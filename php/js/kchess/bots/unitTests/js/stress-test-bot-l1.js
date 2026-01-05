/**
 * STRESS TESTER - K-CHESS ENGINE
 * Version : 6.9.59 - Full FEN & Dedicated Copy Tools
 */

if (window.stressTester) window.stressTester = null;

class BotStressTest {
    constructor() {
        this.isRunning = false;
        this.dotInterval = null;
        this.startTime = 0;
        this.stats = { totalMoves: 0, gamesPlayed: 0, errors: 0, fenList: [] };
        
        this.logEl = document.getElementById('log-content');
        this.btn = document.getElementById('startBtn');
        this.badge = document.getElementById('game-id-badge');
        
        this.init();
    }

    init() {
        if (this.btn) this.btn.onclick = () => this.runBatch();

        // Liaison des boutons de copie (à ajouter dans ton HTML)
        const copyAll = document.getElementById('copyLogBtn');
        const copyFen = document.getElementById('copyFenBtn');
        
        if (copyAll) copyAll.onclick = () => this.copyToClipboard(this.logEl.innerText, copyAll);
        if (copyFen) copyFen.onclick = () => this.copyToClipboard(this.stats.fenList.join('\n'), copyFen);

        if (document.getElementById('inputMaxGames')) document.getElementById('inputMaxGames').value = 5;
        if (document.getElementById('inputMaxMoves')) document.getElementById('inputMaxMoves').value = 16;
    }

    async copyToClipboard(text, btn) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = btn.innerText;
            btn.innerText = "✅ Copié !";
            setTimeout(() => btn.innerText = originalText, 1500);
        } catch (err) {
            console.error("Erreur copie:", err);
        }
    }

    startBadgeAnimation(current, total) {
        if (this.dotInterval) clearInterval(this.dotInterval);
        this.dotInterval = setInterval(() => {
            const dots = ".".repeat((Math.floor(Date.now() / 400) % 4));
            if (this.badge) {
                this.badge.innerText = `TEST: ${current}/${total}${dots}`;
                this.badge.style.color = "#58a6ff";
            }
        }, 400);
    }

    statusUpdate(msg, type = 'info') {
        const div = document.createElement('div');
        const colors = { error: "#f85149", success: "#3fb950", info: "#58a6ff", warn: "#d29922" };
        div.style.color = colors[type] || "#ffffff";
        div.style.fontSize = "11px";
        div.style.fontFamily = "monospace";
        div.style.borderBottom = "1px solid #30363d";
        div.style.padding = "2px 0";
        
        div.innerHTML = `<span style="color:#8b949e">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
        if (this.logEl) {
            this.logEl.appendChild(div);
            this.logEl.scrollTop = this.logEl.scrollHeight;
        }
    }

    async simulateSingleGame(id, maxMoves, totalGames) {
        const gameStart = performance.now();
        this.startBadgeAnimation(id, totalGames);
        
        const game = new ChessGame();
        if (game.core && game.core.botManager) game.core.botManager.isActive = false;
        game.gameState.gameActive = true;
        let mCount = 0;

        while (mCount < maxMoves && game.gameState.gameActive) {
            const currentColor = game.gameState.currentPlayer;
            const possibleMoves = this.getAllValidMoves(game, currentColor);
            if (possibleMoves.length === 0) break;

            const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            const success = await this.performMove(game, move, currentColor);

            if (!success) {
                this.stats.errors++;
                this.statusUpdate(`❌ P#${id} ERROR | FEN: ${FENGenerator.generate(game.board, game.gameState)}`, "error");
                break; 
            }
            mCount++;
            this.stats.totalMoves++;
            await new Promise(r => setTimeout(r, 15)); 
        }

        const duration = ((performance.now() - gameStart) / 1000).toFixed(2);
        const finalFen = FENGenerator.generate(game.board, game.gameState);
        
        // Stockage du FEN pour le bouton "Copier FENs"
        this.stats.fenList.push(finalFen);
        
        // Log compact mais avec FEN complet
        this.statusUpdate(`P#${id} (${mCount}mvts) ${duration}s | ${finalFen}`, "success");

        if (document.getElementById('progress-bar')) {
            document.getElementById('progress-bar').style.width = `${((id) / totalGames) * 100}%`;
        }
    }

    async performMove(game, move, color) {
        game.gameState.currentPlayer = color;
        const target = game.core || game;
        try {
            target.handleSquareClick(move.fR, move.fC, true);
            await new Promise(r => setTimeout(r, 20)); 
            target.handleSquareClick(move.tR, move.tC, true);
            let check = 0;
            while (game.gameState.currentPlayer === color && check < 10) {
                await new Promise(r => setTimeout(r, 20));
                check++;
            }
            return game.gameState.currentPlayer !== color;
        } catch (e) { return false; }
    }

    getAllValidMoves(game, color) {
        const validMoves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = game.board.getPiece(r, c);
                if (piece && piece.color === color) {
                    const moves = game.moveValidator.getPossibleMoves(piece, r, c);
                    moves.forEach(m => {
                        validMoves.push({ fR: r, fC: c, tR: m.row, tC: m.col });
                    });
                }
            }
        }
        return validMoves;
    }

    async runBatch() {
        if (this.isRunning) return;
        const total = parseInt(document.getElementById('inputMaxGames').value) || 5;
        const moves = parseInt(document.getElementById('inputMaxMoves').value) || 16;

        this.isRunning = true;
        if (this.btn) this.btn.disabled = true;
        
        this.logEl.innerHTML = '';
        this.stats = { totalMoves: 0, gamesPlayed: 0, errors: 0, fenList: [] };
        this.startTime = performance.now();
        
        this.statusUpdate(`🚀 BATCH START: ${total} games x ${moves} moves`, "info");
        
        for (let i = 0; i < total; i++) {
            await this.simulateSingleGame(i + 1, moves, total);
        }

        const finalTime = ((performance.now() - this.startTime) / 1000).toFixed(2);
        this.isRunning = false;
        if (this.btn) this.btn.disabled = false;
        
        if (this.dotInterval) clearInterval(this.dotInterval);
        if (this.badge) {
            this.badge.innerText = `FINISH: ${this.stats.totalMoves} MVTS`;
            this.badge.style.color = this.stats.errors > 0 ? "#f85149" : "#3fb950";
        }

        this.statusUpdate(`--- 📊 TOTAL: ${this.stats.totalMoves}mvts | Time: ${finalTime}s | Errors: ${this.stats.errors} ---`, "info");
    }
}

document.addEventListener('DOMContentLoaded', () => { 
    window.stressTester = new BotStressTest(); 
});