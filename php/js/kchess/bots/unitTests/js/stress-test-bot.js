/**
 * js/stress-test-bot.js
 * Version : 7.1.3 - Complete Silent Edition
 * Neutralise GameStatusManager et les notifications UI pendant le test.
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
            fenList: [],
            startTime: null,
            totalDuration: 0
        };
        const errEl = document.getElementById('errors');
        const countEl = document.getElementById('count');
        if (errEl) errEl.innerText = "0";
        if (countEl) countEl.innerText = "0";
    }

    init() {
        if (this.btn) this.btn.onclick = () => this.runBatch();
        
        const copyLogBtn = document.getElementById('copyLogBtn');
        if (copyLogBtn) {
            copyLogBtn.onclick = (e) => this.copyToClipboard(this.logEl.innerText, e.target);
        }
        
        const copyFenBtn = document.getElementById('copyFenBtn');
        if (copyFenBtn) {
            copyFenBtn.onclick = (e) => {
                const fenText = this.stats.fenList.join('\n');
                if (fenText) this.copyToClipboard(fenText, e.target);
            };
        }
        
        const clearJsonBtn = document.getElementById('clearJsonBtn');
        if (clearJsonBtn) {
            clearJsonBtn.onclick = () => {
                if (this.clearServerLogs) this.clearServerLogs(true);
            };
        }
    }

    async copyToClipboard(text, btn) {
        try {
            await navigator.clipboard.writeText(text);
            const original = btn.innerText;
            btn.innerText = "✅ COPIÉ";
            setTimeout(() => btn.innerText = original, 1200);
        } catch (err) { this.statusUpdate("❌ Erreur de copie", "rouge"); }
    }

    statusUpdate(msg, type = 'blanc', resultLabel = "") {
        if (!this.logEl) return;
        const div = document.createElement('div');
        const colors = { 
            rouge: "#f85149", orange: "#d29922", blanc: "#ffffff", gris: "#8b949e", system: "#3fb950" 
        };

        const time = `<span style="color:#8b949e">[${new Date().toLocaleTimeString()}]</span> `;
        let formattedMsg = msg;
        
        if (resultLabel) {
            const finColor = (type === "rouge" && resultLabel.includes("CRASH")) ? "#f85149" : "#3fb950";
            const greenLabel = `<span style="color:${finColor}; font-weight:bold;">FIN</span>`;
            formattedMsg = msg.replace("FIN", greenLabel);
        }

        div.style.color = colors[type] || "#ffffff";
        div.style.fontSize = "11px";
        div.style.padding = "2px 0";
        div.style.borderBottom = "1px solid #30363d";
        div.innerHTML = time + formattedMsg;
        
        this.logEl.appendChild(div);
        this.logEl.scrollTop = this.logEl.scrollHeight;
    }

    async saveJsonToServer() {
        const lvlW = document.getElementById('selectBotWhite')?.value || "unknown";
        const lvlB = document.getElementById('selectBotBlack')?.value || "unknown";
        const dynamicName = `stress_test-${lvlW}vs${lvlB}.json`;
        try {
            await fetch('log_error.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'save', filename: dynamicName, stats: this.stats })
            });
            this.statusUpdate(`💾 Rapport généré : ${dynamicName}`, "system");
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
        try {
            if (game.moveHandler) { game.moveHandler.isPromoting = false; game.moveHandler.selectedPiece = null; }
            if (game.clearSelection) game.clearSelection();
            
            if (game.moveExecutor && !game.moveExecutor._isPatched) {
                game.moveExecutor.handlePromotion = function(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement, isCapture) {
                    this.finalizePromotion(toRow, toCol, 'queen', move, selectedPiece, isCapture);
                };
                game.moveExecutor._isPatched = true;
            }

            engine.handleSquareClick(move.fromRow, move.fromCol, true);
            engine.handleSquareClick(move.toRow, move.toCol, true);

            let wait = 0;
            while (game.gameState.currentPlayer === color && game.gameState.gameActive && wait < 25) {
                await new Promise(r => setTimeout(r, 2));
                wait++;
            }
            if (game.gameState.currentPlayer === color && game.gameState.gameActive) {
                game.gameState.switchPlayer();
                if (game.updateUI) game.updateUI();
            }
            return true;
        } catch (e) { return false; }
    }

    async simulateGame(id, maxMoves, totalGames) {
        const startPartie = performance.now();
        const _log = console.log; const _warn = console.warn;
        
        // Blocage de la console standard
        console.log = console.warn = () => {}; 

        // Désactivation globale des logs du StatusManager
        if (window.GameStatusManager) window.GameStatusManager.consoleLog = false;

        const game = new ChessGame();
        
        // Neutralisation des fonctions UI du Manager pour cette instance
        if (game.statusManager) {
            game.statusManager.showNotification = () => {};
            game.statusManager.showCheckAlert = () => {};
            game.statusManager.highlightKing = () => {};
        }

        if (game.ui && game.ui.showStatus) game.ui.showStatus = () => {};
        if (window.displayStatus) { this._oldStatus = window.displayStatus; window.displayStatus = () => {}; }

        game.gameState.gameActive = true;
        let mCount = 0;

        const progressBar = document.getElementById('progress-bar');
        if (progressBar) progressBar.style.width = `${Math.round((id / totalGames) * 100)}%`;
        if (this.badge) this.badge.innerText = `RUNNING ${id}/${totalGames}`;

        try {
            while (mCount < maxMoves && game.gameState.gameActive) {
                const color = game.gameState.currentPlayer;
                const moves = this.getAvailableMoves(game, color);
                if (moves.length === 0) break;
                const move = moves[Math.floor(Math.random() * moves.length)];
                if (!(await this.executeMove(game, move, color))) throw new Error(`Err`);
                mCount++;
                this.stats.totalMoves++;
            }

            const gs = game.gameState;
            let type = "blanc", resTag = "FIN nulle";

            if (gs.isCheckmate) { 
                resTag = "FIN mat"; type = "rouge"; this.stats.checkmates++; 
            } else if (gs.isStalemate) { 
                resTag = "FIN pat"; type = "orange"; this.stats.stalemates++; 
            } else if (mCount >= maxMoves) { 
                resTag = "FIN en cours"; type = "gris"; 
            }

            // Correction : FENGenerator.generate ou generateFEN selon ta version
            const finalFen = (FENGenerator.generate) ? 
                FENGenerator.generate(game.board, gs) : 
                FENGenerator.generateFEN(gs, game.board);

            this.stats.fenList.push(finalFen);
            this.stats.gamesPlayed++;
            
            const countDisplay = document.getElementById('count');
            if (countDisplay) countDisplay.innerText = this.stats.gamesPlayed;
            
            // Restauration console pour le statusUpdate
            console.log = _log; console.warn = _warn;
            const dureePartie = ((performance.now() - startPartie) / 1000).toFixed(2);
            
            this.statusUpdate(`P#${id} (${mCount} mvts - ${dureePartie}s) ${resTag} | ${finalFen}`, type, resTag);

        } catch (e) {
            console.log = _log; console.warn = _warn;
            this.stats.errors++;
            const errDisplay = document.getElementById('errors');
            if (errDisplay) errDisplay.innerText = this.stats.errors;
            this.statusUpdate(`FIN CRASH P#${id}`, "rouge", "FIN CRASH");
        }
    }

    async runBatch() {
        if (this.isRunning) return;
        
        const inputGames = document.getElementById('inputMaxGames');
        const inputMoves = document.getElementById('inputMaxMoves');
        const total = inputGames ? parseInt(inputGames.value) : 50;
        const moves = inputMoves ? parseInt(inputMoves.value) : 100;
        
        // Cache les modales de promotion et les notifications UI persistantes
        if (!document.getElementById('stress-test-style')) {
            document.head.insertAdjacentHTML('beforeend', `
                <style id="stress-test-style">
                    .promotion-modal, .promotion-overlay, .chess-notification { display: none !important; }
                </style>`);
        }

        this.isRunning = true; 
        if (this.btn) this.btn.disabled = true; 
        if (this.logEl) this.logEl.innerHTML = ''; 
        this.resetStats();
        this.stats.startTime = performance.now();
        
        this.statusUpdate("🚀 DÉMARRAGE DU TEST...", "system");

        for (let i = 1; i <= total; i++) {
            await this.simulateGame(i, moves, total);
            // Petit délai pour laisser le navigateur respirer
            await new Promise(r => setTimeout(r, 1));
        }

        const tempsTotal = ((performance.now() - this.stats.startTime) / 1000).toFixed(1);
        this.stats.totalDuration = tempsTotal;

        this.statusUpdate(`🏁 SESSION TERMINÉE en ${tempsTotal}s`, "system");
        this.isRunning = false; 
        if (this.btn) this.btn.disabled = false;
        
        // Réactivation optionnelle des logs du StatusManager après le test
        if (window.GameStatusManager) window.GameStatusManager.consoleLog = true;
        
        await this.saveJsonToServer();
    }
}

document.addEventListener('DOMContentLoaded', () => { 
    window.stressTester = new BotStressTest(); 
});