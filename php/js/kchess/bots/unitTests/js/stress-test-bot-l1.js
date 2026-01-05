/**
 * STRESS TESTER - K-CHESS ENGINE
 * Version : 6.9.57 - Animated Badge & Progress Tracking
 */

if (window.stressTester) window.stressTester = null;

class BotStressTest {
    constructor() {
        this.isRunning = false;
        this.dotCount = 0;
        this.dotInterval = null;
        this.stats = { totalMoves: 0, gamesPlayed: 0, errors: 0 };
        
        // Liaison UI
        this.logEl = document.getElementById('log-content');
        this.btn = document.getElementById('startBtn');
        this.countEl = document.getElementById('count');
        this.errorEl = document.getElementById('errors');
        this.progressBar = document.getElementById('progress-bar');
        this.progressContainer = document.getElementById('p-container');
        this.badge = document.getElementById('game-id-badge');

        this.init();
    }

    init() {
        if (this.btn) this.btn.onclick = () => this.runBatch();

        const inputGames = document.getElementById('inputMaxGames');
        const inputMoves = document.getElementById('inputMaxMoves');
        if (inputGames) inputGames.value = 5;
        if (inputMoves) inputMoves.value = 16;

        console.log("🧪 StressTester prêt v6.9.57");
    }

    /**
     * Gère l'animation du badge (ex: 1/5 en cours...)
     */
    startBadgeAnimation(current, total) {
        if (this.dotInterval) clearInterval(this.dotInterval);
        this.dotInterval = setInterval(() => {
            this.dotCount = (this.dotCount + 1) % 4;
            const dots = ".".repeat(this.dotCount);
            if (this.badge) {
                this.badge.innerText = `${current}/${total} en cours${dots}`;
                this.badge.style.color = "#58a6ff"; // Bleu actif
            }
        }, 400);
    }

    stopBadgeAnimation() {
        if (this.dotInterval) clearInterval(this.dotInterval);
        if (this.badge) {
            this.badge.innerText = 'IDLE';
            this.badge.style.color = "#6e7681"; // Gris neutre
        }
    }

    resetUI() {
        if (this.logEl) this.logEl.innerHTML = ''; 
        if (this.countEl) this.countEl.innerText = '0';
        if (this.errorEl) this.errorEl.innerText = '0';
        if (this.progressBar) this.progressBar.style.width = '0%';
        if (this.progressContainer) this.progressContainer.style.display = 'block';
        
        this.stats = { totalMoves: 0, gamesPlayed: 0, errors: 0 };
    }

    updateProgress(current, total) {
        if (this.progressBar) {
            const percent = (current / total) * 100;
            this.progressBar.style.width = `${percent}%`;
        }
        if (this.countEl) this.countEl.innerText = current;
    }

    statusUpdate(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = `msg-${type}`;
        
        if (type === 'error') div.style.color = "#f85149";
        if (type === 'success') div.style.color = "#3fb950";
        if (type === 'info') div.style.color = "#58a6ff";
        if (type === 'warn') div.style.color = "#d29922";
        
        div.innerHTML = `<span style="color:#8b949e">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
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

    async simulateSingleGame(id, maxMoves, totalGames) {
        // Lancement de l'animation pour cette partie
        this.startBadgeAnimation(id, totalGames);
        this.statusUpdate(`⏳ Partie #${id} en cours...`, "info");
        
        const game = new ChessGame();
        if (game.core && game.core.botManager) game.core.botManager.isActive = false;
        
        game.gameState.gameActive = true;
        game.gameState.currentPlayer = 'white';
        let mCount = 0;

        while (mCount < maxMoves && game.gameState.gameActive) {
            const currentColor = game.gameState.currentPlayer;
            const possibleMoves = this.getAllValidMoves(game, currentColor);

            if (possibleMoves.length === 0) {
                const status = game.gameState.isCheckmate ? "MAT" : "PAT/NULLE";
                this.statusUpdate(`🏁 Fin : ${status} au coup ${mCount}`, "success");
                break;
            }

            const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            const success = await this.performMove(game, move, currentColor);

            if (!success) {
                this.stats.errors++;
                if (this.errorEl) this.errorEl.innerText = this.stats.errors;
                this.statusUpdate(`❌ ERREUR CRITIQUE P#${id} (Coup ${mCount+1})`, "error");
                this.statusUpdate(`FEN Bloqué: ${FENGenerator.generate(game.board, game.gameState)}`, "error");
                break; 
            }

            mCount++;
            this.stats.totalMoves++;
            await new Promise(r => setTimeout(r, 30)); 
        }

        if (mCount >= maxMoves && game.gameState.gameActive) {
            this.statusUpdate(`✅ LIMITE ATTEINTE (${maxMoves} coups)`, "success");
            this.statusUpdate(`Final FEN: ${FENGenerator.generate(game.board, game.gameState)}`, "info");
        }

        this.stats.gamesPlayed++;
        this.updateProgress(this.stats.gamesPlayed, totalGames);
    }

    async runBatch() {
        if (this.isRunning) return;
        const total = parseInt(document.getElementById('inputMaxGames').value) || 5;
        const moves = parseInt(document.getElementById('inputMaxMoves').value) || 16;

        this.isRunning = true;
        this.btn.disabled = true;
        this.resetUI();
        
        this.statusUpdate(`🚀 DÉMARRAGE BATCH v6.9.57 (${total} parties)`, "info");
        
        for (let i = 0; i < total; i++) {
            await this.simulateSingleGame(i + 1, moves, total);
        }

        this.stopBadgeAnimation();
        this.showFinalSummary();
        this.isRunning = false;
        this.btn.disabled = false;
    }

    showFinalSummary() {
        const color = this.stats.errors > 0 ? "error" : "success";
        this.statusUpdate("--- 📊 BILAN FINAL ---", "info");
        this.statusUpdate(`✅ Parties terminées : ${this.stats.gamesPlayed}`, "info");
        this.statusUpdate(`🧩 Mouvements : ${this.stats.totalMoves}`, "info");
        this.statusUpdate(`⚠️ Erreurs : ${this.stats.errors}`, color);
    }
}

document.addEventListener('DOMContentLoaded', () => { 
    window.stressTester = new BotStressTest(); 
});