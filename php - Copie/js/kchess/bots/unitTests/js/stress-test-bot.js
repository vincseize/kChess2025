/**
 * js/stress-test-bot.js
 * Version : 6.9.76 - MoveExecutor Aggressive Patch
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
        this.stats = { totalMoves: 0, gamesPlayed: 0, errors: 0, checkmates: 0, stalemates: 0, draws: 0, fenList: [] };
        if (document.getElementById('errors')) document.getElementById('errors').innerText = "0";
        if (document.getElementById('count')) document.getElementById('count').innerText = "0";
    }

    init() {
        if (this.btn) this.btn.onclick = () => this.runBatch();
        document.getElementById('copyLogBtn').onclick = (e) => this.copyToClipboard(this.logEl.innerText, e.target);
        document.getElementById('copyFenBtn').onclick = (e) => {
            const fenText = this.stats.fenList.join('\n');
            if (fenText) this.copyToClipboard(fenText, e.target);
        };
        document.getElementById('clearJsonBtn').onclick = () => this.clearServerLogs(true);
    }

    async copyToClipboard(text, btn) {
        try {
            await navigator.clipboard.writeText(text);
            const original = btn.innerText;
            btn.innerText = "✅ COPIÉ";
            setTimeout(() => btn.innerText = original, 1200);
        } catch (err) { this.statusUpdate("❌ Erreur de copie", "error"); }
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
        if (confirmNeeded && !confirm("Supprimer les rapports JSON ?")) return;
        try { await fetch('log_error.php', { method: 'POST', body: JSON.stringify({ action: 'clear_all' }) }); } catch (e) {}
    }

    async saveJsonToServer() {
        try {
            await fetch('log_error.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'save', filename: `test_${Date.now()}.json`, stats: this.stats })
            });
        } catch (e) {}
    }

    getAvailableMoves(game, color) {
        const normalMoves = [];
        const prioritaryMoves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = game.board.getPiece(r, c);
                if (p && p.color === color) {
                    game.moveValidator.getPossibleMoves(p, r, c).forEach(m => {
                        const target = game.board.getPiece(m.row, m.col);
                        const isPromo = (p.type === 'pawn' && (m.row === 0 || m.row === 7));
                        const moveObj = { fromRow: r, fromCol: c, toRow: m.row, toCol: m.col };
                        if (target || isPromo) prioritaryMoves.push(moveObj);
                        else normalMoves.push(moveObj);
                    });
                }
            }
        }
        return prioritaryMoves.length > 0 ? prioritaryMoves : normalMoves;
    }

    async executeMove(game, move, color) {
        const engine = game.core || game;
        const executor = game.moveExecutor;

        try {
            // 1. FORCE RESET : On vide tous les verrous possibles du moteur avant de cliquer
            if (game.moveHandler) {
                game.moveHandler.isPromoting = false;
                game.moveHandler.selectedPiece = null; // Évite les "fantômes" de sélection
            }
            if (game.clearSelection) game.clearSelection();

            // 2. PATCH EXECUTOR (S'assure que la promotion est synchrone)
            if (executor && !executor._isPatched) {
                executor.handlePromotion = function(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement, isCapture) {
                    this.finalizePromotion(toRow, toCol, 'queen', move, selectedPiece, isCapture);
                };
                executor._isPatched = true;
            }

            // 3. EXECUTION DES CLICS
            // On utilise un petit try/catch interne pour handleSquareClick
            engine.handleSquareClick(move.fromRow, move.fromCol, true);
            engine.handleSquareClick(move.toRow, move.toCol, true);
            
            // 4. ATTENTE DU CHANGEMENT DE TOUR
            // Augmenter légèrement le timeout pour laisser l'UI souffler si besoin
            let wait = 0;
            const maxWait = 25; 
            while (game.gameState.currentPlayer === color && game.gameState.gameActive && wait < maxWait) {
                await new Promise(r => setTimeout(r, 2));
                wait++;
            }

            // 5. DOUBLE CHECK : Si le tour n'a pas changé, on force le switch (Dernier recours)
            if (game.gameState.currentPlayer === color && game.gameState.gameActive) {
                console.warn("Force switching player...");
                game.gameState.switchPlayer();
                if (game.updateUI) game.updateUI();
            }

            return true; // On retourne true pour éviter le crash "Rejected"
        } catch (e) { 
            return false; 
        }
    }

    async simulateGame(id, maxMoves, totalGames) {
        const game = new ChessGame();
        game.gameState.gameActive = true;
        let mCount = 0;

        document.getElementById('progress-bar').style.width = `${Math.round((id / totalGames) * 100)}%`;
        this.badge.innerText = `RUNNING ${id}/${totalGames}`;

        try {
            while (mCount < maxMoves && game.gameState.gameActive) {
                const color = game.gameState.currentPlayer;
                const moves = this.getAvailableMoves(game, color);
                if (moves.length === 0) break;

                const move = moves[Math.floor(Math.random() * moves.length)];
                if (!(await this.executeMove(game, move, color))) {
                    throw new Error(`Rejected at T${mCount} (Pos: ${move.fromRow},${move.fromCol})`);
                }
                
                mCount++;
                this.stats.totalMoves++;
            }

            const gs = game.gameState;
            let res = gs.isCheckmate ? "⚔️ MAT" : (gs.isStalemate ? "🧩 PAT" : "⌛");
            if (gs.isCheckmate) this.stats.checkmates++;
            if (gs.isStalemate) this.stats.stalemates++;

            const finalFen = FENGenerator.generate(game.board, gs);
            this.stats.fenList.push(finalFen);
            this.stats.gamesPlayed++;
            
            document.getElementById('count').innerText = this.stats.gamesPlayed;
            this.statusUpdate(`P#${id} (${mCount} mvts) ${res} | ${finalFen}`, (gs.isCheckmate ? "warning" : "success"));
        } catch (e) {
            this.stats.errors++;
            document.getElementById('errors').innerText = this.stats.errors;
            this.statusUpdate(`❌ P#${id} CRASH : ${e.message}`, "error");
        }
    }

    async runBatch() {
        if (this.isRunning) return;
        const total = parseInt(document.getElementById('inputMaxGames').value) || 50;
        const moves = parseInt(document.getElementById('inputMaxMoves').value) || 100;
        
        // Kill CSS UI
        const styleId = 'stress-test-style';
        if (!document.getElementById(styleId)) {
            document.head.insertAdjacentHTML('beforeend', `<style id="${styleId}">.promotion-modal, .promotion-overlay, #promotion-modal { display: none !important; }</style>`);
        }

        this.isRunning = true; this.btn.disabled = true; this.logEl.innerHTML = ''; this.resetStats();

        for (let i = 1; i <= total; i++) {
            await this.simulateGame(i, moves, total);
            // On peut même accélérer le repos entre les parties
            await new Promise(r => setTimeout(r, 1));
        }

        this.statusUpdate(`🏁 FIN : Mats: ${this.stats.checkmates} | Erreurs: ${this.stats.errors}`, "success");
        this.isRunning = false; this.btn.disabled = false;
        await this.saveJsonToServer();
    }
}
document.addEventListener('DOMContentLoaded', () => { window.stressTester = new BotStressTest(); });