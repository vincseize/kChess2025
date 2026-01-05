/**
 * STRESS TESTER - K-CHESS ENGINE
 * Version : 6.9.64 - Auto-Clear JSON on Start + Auto-Promotion
 */

if (window.stressTester) window.stressTester = null;

class BotStressTest {
    constructor() {
        this.isRunning = false;
        this.stats = { totalMoves: 0, gamesPlayed: 0, errors: 0, fenList: [] };
        this.logEl = document.getElementById('log-content');
        this.btn = document.getElementById('startBtn');
        this.badge = document.getElementById('game-id-badge');
        this.init();
    }

    init() {
        if (this.btn) this.btn.onclick = () => this.runBatch();
        
        document.getElementById('copyLogBtn').onclick = (e) => this.copyToClipboard(this.logEl.innerText, e.target);
        document.getElementById('copyFenBtn').onclick = (e) => this.copyToClipboard(this.stats.fenList.join('\n'), e.target);
        document.getElementById('clearJsonBtn').onclick = () => this.clearServerLogs(true);

        console.log("🧪 StressTester prêt v6.9.64");
    }

    async copyToClipboard(text, btn) {
        try {
            await navigator.clipboard.writeText(text);
            const original = btn.innerText;
            btn.innerText = "✅ COPIÉ";
            setTimeout(() => btn.innerText = original, 1200);
        } catch (err) { console.error(err); }
    }

    statusUpdate(msg, type = 'info') {
        const div = document.createElement('div');
        const colors = { error: "#f85149", success: "#3fb950", info: "#58a6ff" };
        div.style.color = colors[type] || "#ffffff";
        div.style.fontSize = "11px";
        div.style.padding = "2px 0";
        div.style.borderBottom = "1px solid #30363d";
        div.innerHTML = `<span style="color:#8b949e">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
        this.logEl.appendChild(div);
        this.logEl.scrollTop = this.logEl.scrollHeight;
    }

    /**
     * Nettoyage des logs sur le serveur
     * @param {boolean} confirmNeeded - Si vrai, demande confirmation (pour le bouton manuel)
     */
    async clearServerLogs(confirmNeeded = false) {
        if (confirmNeeded && !confirm("Voulez-vous supprimer TOUS les rapports JSON du serveur ?")) return;
        
        try {
            const response = await fetch('log_error.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'clear_all' })
            });
            const res = await response.json();
            if (confirmNeeded) {
                this.statusUpdate(`🗑️ Dossier results/ vidé (${res.count} fichiers).`, "info");
            }
            return true;
        } catch (e) { 
            this.statusUpdate("❌ Erreur de nettoyage serveur", "error"); 
            return false;
        }
    }

    async saveJsonToServer() {
        this.statusUpdate("💾 Exportation JSON...", "info");
        try {
            const response = await fetch('log_error.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'save',
                    filename: `test_${Date.now()}.json`,
                    stats: {
                        moves: this.stats.totalMoves,
                        games: this.stats.gamesPlayed,
                        errors: this.stats.errors,
                        fens: this.stats.fenList
                    }
                })
            });
            const res = await response.json();
            if (res.status === 'saved') this.statusUpdate(`📁 Rapport créé : ${res.path}`, "success");
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
                this.statusUpdate(`❌ P#${id} Crash Mouvement au coup ${mCount}`, "error");
                break;
            }
            mCount++;
            this.stats.totalMoves++;
            await new Promise(r => setTimeout(r, 5));
        }

        const finalFen = FENGenerator.generate(game.board, game.gameState);
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
            await new Promise(r => setTimeout(r, 10));
            
            engine.handleSquareClick(move.toRow, move.toCol, true);
            
            if (isPromotion) {
                await new Promise(r => setTimeout(r, 50)); 
                if (game.promotionManager) {
                    game.promotionManager.handlePromotionChoice('queen');
                } else if (engine.handlePromotionChoice) {
                    engine.handlePromotionChoice('queen');
                }
            }

            let wait = 0;
            while (game.gameState.currentPlayer === color && wait < 50) {
                await new Promise(r => setTimeout(r, 10));
                wait++;
            }
            return game.gameState.currentPlayer !== color;
        } catch (e) { return false; }
    }

    async runBatch() {
        if (this.isRunning) return;

        // 1. Suppression automatique des anciens JSON avant de commencer
        this.statusUpdate("🧹 Nettoyage des anciens tests...", "info");
        await this.clearServerLogs(false); 

        this.isRunning = true;
        this.btn.disabled = true;
        this.logEl.innerHTML = '';
        this.stats = { totalMoves: 0, gamesPlayed: 0, errors: 0, fenList: [] };
        
        const total = parseInt(document.getElementById('inputMaxGames').value) || 5;
        const moves = parseInt(document.getElementById('inputMaxMoves').value) || 16;

        this.statusUpdate(`🚀 DÉMARRAGE : ${total} parties`, "info");

        for (let i = 0; i < total; i++) {
            this.badge.innerText = `RUNNING ${i+1}/${total}`;
            await this.simulateGame(i + 1, moves, total);
        }

        this.badge.innerText = `FINISH: ${this.stats.totalMoves} MVTS`;
        this.badge.style.color = (this.stats.errors > 0) ? "#f85149" : "#3fb950";
        this.isRunning = false;
        this.btn.disabled = false;
        await this.saveJsonToServer();
    }
}

document.addEventListener('DOMContentLoaded', () => { window.stressTester = new BotStressTest(); });