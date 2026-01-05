/**
 * js/stress-test-bot.js
 * STRESS TESTER - K-CHESS ENGINE
 * Version : 6.9.67 - Arena + Multi-FEN Copy
 */

if (window.stressTester) window.stressTester = null;

class BotStressTest {
    constructor() {
        this.isRunning = false;
        this.resetStats();
        this.logEl = document.getElementById('log-content');
        this.btn = document.getElementById('startBtn');
        this.badge = document.getElementById('game-id-badge');
        this.init();
    }

    resetStats() {
        this.stats = { 
            totalMoves: 0, 
            gamesPlayed: 0, 
            errors: 0, 
            checkmates: 0, 
            stalemates: 0, 
            draws: 0, 
            fenList: [] 
        };
        // Reset de l'affichage UI des erreurs
        const errEl = document.getElementById('errors');
        if (errEl) errEl.innerText = "0";
    }

    init() {
        if (this.btn) this.btn.onclick = () => this.runBatch();
        
        // --- GESTION DES BOUTONS DE COPIE ---
        document.getElementById('copyLogBtn').onclick = (e) => this.copyToClipboard(this.logEl.innerText, e.target);
        
        document.getElementById('copyFenBtn').onclick = (e) => {
            const fenText = this.stats.fenList.join('\n');
            if (!fenText) {
                this.statusUpdate("⚠️ Aucune FEN à copier (lancez un test)", "warning");
                return;
            }
            this.copyToClipboard(fenText, e.target);
        };

        document.getElementById('clearJsonBtn').onclick = () => this.clearServerLogs(true);

        console.log("🧪 StressTester Arena prêt v6.9.67");
    }

    async copyToClipboard(text, btn) {
        try {
            await navigator.clipboard.writeText(text);
            const original = btn.innerText;
            btn.innerText = "✅ COPIÉ";
            btn.style.borderColor = "#3fb950";
            setTimeout(() => {
                btn.innerText = original;
                btn.style.borderColor = "#30363d";
            }, 1200);
        } catch (err) { 
            console.error(err);
            this.statusUpdate("❌ Erreur lors de la copie", "error");
        }
    }

    statusUpdate(msg, type = 'info') {
        const div = document.createElement('div');
        const colors = { error: "#f85149", success: "#3fb950", info: "#58a6ff", warning: "#d29922" };
        div.style.color = colors[type] || "#ffffff";
        div.style.fontSize = "11px";
        div.style.padding = "2px 0";
        div.style.borderBottom = "1px solid #30363d";
        div.innerHTML = `<span style="color:#8b949e">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
        this.logEl.appendChild(div);
        this.logEl.scrollTop = this.logEl.scrollHeight;
    }

    async clearServerLogs(confirmNeeded = false) {
        if (confirmNeeded && !confirm("Voulez-vous supprimer TOUS les rapports JSON ?")) return;
        try {
            const response = await fetch('log_error.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'clear_all' })
            });
            const res = await response.json();
            if (confirmNeeded) this.statusUpdate(`🗑️ Dossier results/ vidé (${res.count} fichiers).`, "info");
            return true;
        } catch (e) { 
            this.statusUpdate("❌ Erreur de nettoyage serveur", "error"); 
            return false;
        }
    }

    async saveJsonToServer() {
        this.statusUpdate("💾 Exportation JSON...", "info");
        try {
            await fetch('log_error.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'save',
                    filename: `test_${Date.now()}.json`,
                    stats: this.stats
                })
            });
        } catch (e) { this.statusUpdate("❌ Échec de l'enregistrement JSON", "error"); }
    }

    getAvailableMoves(game, color) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = game.board.getPiece(r, c);
                if (p && p.color === color) {
                    game.moveValidator.getPossibleMoves(p, r, c).forEach(m => {
                        moves.push({ fromRow: r, fromCol: c, toRow: m.row, toCol: m.col });
                    });
                }
            }
        }
        return moves;
    }

    async simulateGame(id, maxMoves, totalGames) {
        const game = new ChessGame();
        game.gameState.gameActive = true;
        let mCount = 0;

        while (mCount < maxMoves && game.gameState.gameActive) {
            const color = game.gameState.currentPlayer;
            const moves = this.getAvailableMoves(game, color);
            if (moves.length === 0) break;

            const move = moves[Math.floor(Math.random() * moves.length)];
            const success = await this.executeMove(game, move, color);

            if (!success) {
                this.stats.errors++;
                document.getElementById('errors').innerText = this.stats.errors;
                this.statusUpdate(`❌ P#${id} Crash Mouvement au coup ${mCount}`, "error");
                break;
            }
            mCount++;
            this.stats.totalMoves++;
            await new Promise(r => setTimeout(r, 5));
        }

        const gs = game.gameState;
        if (gs.isCheckmate) this.stats.checkmates++;
        else if (gs.isStalemate) this.stats.stalemates++;
        else if (gs.isDraw) this.stats.draws++;

        const finalFen = FENGenerator.generate(game.board, gs);
        this.stats.fenList.push(finalFen);
        this.stats.gamesPlayed++;
        
        this.statusUpdate(`P#${id} (${mCount} mvts) | ${finalFen}`, "success");
        document.getElementById('progress-bar').style.width = `${(id / totalGames) * 100}%`;
        document.getElementById('count').innerText = id;
    }

    async executeMove(game, move, color) {
        const engine = game.core || game;
        try {
            const piece = game.board.getPiece(move.fromRow, move.fromCol);
            const isPromotion = piece && piece.type === 'pawn' && (move.toRow === 0 || move.toRow === 7);

            engine.handleSquareClick(move.fromRow, move.fromCol, true);
            await new Promise(r => setTimeout(r, 5));
            engine.handleSquareClick(move.toRow, move.toCol, true);
            
            if (isPromotion) {
                await new Promise(r => setTimeout(r, 20)); 
                const pm = game.promotionManager || engine.promotionManager;
                if (pm) pm.handlePromotionChoice('queen');
                else if (engine.handlePromotionChoice) engine.handlePromotionChoice('queen');
            }

            let wait = 0;
            while (game.gameState.currentPlayer === color && wait < 30) {
                await new Promise(r => setTimeout(r, 5));
                wait++;
            }
            return game.gameState.currentPlayer !== color || !game.gameState.gameActive;
        } catch (e) { return false; }
    }

    async runBatch() {
        if (this.isRunning) return;

        const botWhite = document.getElementById('selectBotWhite').value;
        const botBlack = document.getElementById('selectBotBlack').value;
        const total = parseInt(document.getElementById('inputMaxGames').value) || 5;
        const moves = parseInt(document.getElementById('inputMaxMoves').value) || 16;

        this.isRunning = true;
        this.btn.disabled = true;
        this.logEl.innerHTML = '';
        this.resetStats();

        await this.clearServerLogs(false); 
        
        this.statusUpdate(`🚀 DÉMARRAGE ARENA : ${total} parties`, "info");
        this.statusUpdate(`⚔️ DUEL : ${botWhite} vs ${botBlack}`, "warning");

        for (let i = 0; i < total; i++) {
            this.badge.innerText = `RUNNING ${i+1}/${total}`;
            await this.simulateGame(i + 1, moves, total);
        }

        const s = this.stats;
        this.statusUpdate("----------------------------", "info");
        this.statusUpdate(`📊 TOTAL : ${s.gamesPlayed} parties | ${s.totalMoves} mvts`, "success");
        this.statusUpdate(`🏁 RÉSULTATS : Mats: ${s.checkmates} | Pats: ${s.stalemates} | Nulles: ${s.draws}`, "warning");

        this.badge.innerText = `FINISH: ${s.totalMoves} MVTS`;
        this.badge.style.color = (s.errors > 0) ? "#f85149" : "#3fb950";
        this.isRunning = false;
        this.btn.disabled = false;
        await this.saveJsonToServer();
    }
}

document.addEventListener('DOMContentLoaded', () => { window.stressTester = new BotStressTest(); });