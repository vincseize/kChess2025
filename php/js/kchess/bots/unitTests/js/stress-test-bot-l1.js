/**
 * STRESS TESTER - K-CHESS ENGINE
 * Version : 6.9.53 - Smart Logging & Resilience
 */

if (window.stressTester) window.stressTester = null;

class BotStressTest {
    constructor() {
        this.isRunning = false;
        this.stats = { totalMoves: 0, gamesPlayed: 0, errors: 0 };
        this.logEl = document.getElementById('log-content');
        this.btn = document.getElementById('startBtn');
        this.init();
    }

    init() {
        if (this.btn) this.btn.onclick = () => this.runBatch();
        console.log("🧪 StressTester prêt v6.9.53");
    }

    statusUpdate(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = `msg-${type}`;
        // Style inline pour les erreurs critiques dans l'UI
        if (type === 'error') div.style.color = "#ff0000";
        if (type === 'success') div.style.color = "#2e7d32";
        
        div.innerHTML = `<span style="color:#666">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
        if (this.logEl) {
            this.logEl.appendChild(div);
            this.logEl.scrollTop = this.logEl.scrollHeight;
        }
    }

    getAllValidMoves(game, color) {
        const validMoves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = game.board.getPiece(r, c);
                if (piece && piece.color === color) {
                    const moves = game.moveValidator.getPossibleMoves(piece, r, c);
                    moves.forEach(m => {
                        validMoves.push({ fR: r, fC: c, tR: m.row, tC: m.col, type: piece.type });
                    });
                }
            }
        }
        return validMoves;
    }

    async performMove(game, move, color) {
        game.gameState.currentPlayer = color;
        const target = game.core || game;
        try {
            target.handleSquareClick(move.fR, move.fC, true);
            await new Promise(r => setTimeout(r, 40)); 
            target.handleSquareClick(move.tR, move.tC, true);

            let check = 0;
            while (game.gameState.currentPlayer === color && check < 10) {
                await new Promise(r => setTimeout(r, 40));
                check++;
            }
            return game.gameState.currentPlayer !== color;
        } catch (e) { return false; }
    }

    async simulateSingleGame(id, maxMoves) {
        this.statusUpdate(`⏳ Partie #${id} en cours...`, "info");
        const game = new ChessGame();
        if (game.core && game.core.botManager) game.core.botManager.isActive = false;
        
        game.gameState.gameActive = true;
        game.gameState.currentPlayer = 'white';
        let mCount = 0;
        let lastFen = "";

        while (mCount < maxMoves && game.gameState.gameActive) {
            const currentColor = game.gameState.currentPlayer;
            lastFen = FENGenerator.generate(game.board, game.gameState);

            const possibleMoves = this.getAllValidMoves(game, currentColor);

            if (possibleMoves.length === 0) {
                const status = game.gameState.isCheckmate ? "MAT" : "PAT";
                this.statusUpdate(`🏁 Fin : ${status} au coup ${mCount}`, "success");
                this.statusUpdate(`Final FEN: ${lastFen}`, "info");
                return;
            }

            const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            const success = await this.performMove(game, move, currentColor);

            if (!success) {
                this.stats.errors++;
                this.statusUpdate(`❌ ERREUR CRITIQUE P#${id} (Coup ${mCount+1})`, "error");
                this.statusUpdate(`FEN Bloqué: ${lastFen}`, "error");
                console.error(`Blocage détecté sur FEN: ${lastFen}`);
                return; // On arrête cette partie mais le batch continue
            }

            mCount++;
            this.stats.totalMoves++;
            await new Promise(r => setTimeout(r, 30)); 
        }

        // Si on sort de la boucle sans Mat/Pat
        if (mCount >= maxMoves) {
            this.statusUpdate(`🏳️ Nulle (Limite de ${maxMoves} coups atteinte)`, "info");
            this.statusUpdate(`Final FEN: ${FENGenerator.generate(game.board, game.gameState)}`, "info");
        }
    }

    async runBatch() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.btn.disabled = true;
        this.stats = { totalMoves: 0, gamesPlayed: 0, errors: 0 };

        const total = parseInt(document.getElementById('inputMaxGames').value) || 1;
        const moves = parseInt(document.getElementById('inputMaxMoves').value) || 10;

        this.statusUpdate(`🚀 DÉMARRAGE BATCH v6.9.53 (${total} parties)`, "info");
        
        for (let i = 0; i < total; i++) {
            await this.simulateSingleGame(i + 1, moves);
            this.stats.gamesPlayed++;
        }

        this.showFinalSummary();
        this.isRunning = false;
        this.btn.disabled = false;
    }

    showFinalSummary() {
        const color = this.stats.errors > 0 ? "error" : "success";
        this.statusUpdate("--- 📊 BILAN FINAL ---", "info");
        this.statusUpdate(`✅ Parties jouées : ${this.stats.gamesPlayed}`, "info");
        this.statusUpdate(`🧩 Total Mouvements : ${this.stats.totalMoves}`, "info");
        this.statusUpdate(`⚠️ Erreurs rencontrées : ${this.stats.errors}`, color);
    }
}

document.addEventListener('DOMContentLoaded', () => { window.stressTester = new BotStressTest(); });