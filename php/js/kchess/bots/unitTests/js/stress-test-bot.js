/**
 * js/stress-test-bot.js
 * Version : 7.3.2 - Explicit Color Labels in Filenames
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
            totalDuration: 0,
            config: { white: "", black: "", isRandom: false } 
        };
        const errEl = document.getElementById('errors');
        const countEl = document.getElementById('count');
        const progressEl = document.getElementById('progress-bar');

        if (errEl) errEl.innerText = "0";
        if (countEl) countEl.innerText = "0";
        if (progressEl) progressEl.style.width = "0%";
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
        if (!this.logEl || !msg.trim()) return; 
        const div = document.createElement('div');
        const colors = { 
            rouge: "#f85149", orange: "#d29922", blanc: "#ffffff", gris: "#8b949e", system: "#3fb950" 
        };

        const time = `<span style="color:#8b949e">[${new Date().toLocaleTimeString()}]</span> `;
        let formattedMsg = msg;
        
        if (resultLabel) {
            const labelColor = colors[type] || "#ffffff";
            const coloredLabel = `<span style="color:${labelColor}; font-weight:bold;">FIN</span>`;
            formattedMsg = msg.replace("FIN", coloredLabel);
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
        const { white, black, isRandom } = this.stats.config;
        const randTag = isRandom ? "-RANDOM" : "";
        // Nom de fichier explicite : White_LVL-vs-Black_LVL
        const dynamicName = `stress_test-White_${white}-vs-Black_${black}${randTag}.json`;
        
        try {
            await fetch('log_error.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save', filename: dynamicName, stats: this.stats })
            });
            this.statusUpdate(`💾 Rapport généré : ${dynamicName}`, "system");
        } catch (e) { console.error("Save error:", e); }
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
            while (game.gameState.currentPlayer === color && game.gameState.gameActive && wait < 20) {
                await new Promise(r => setTimeout(r, 2));
                wait++;
            }
            return (game.gameState.currentPlayer !== color);
        } catch (e) { return false; }
    }

    async simulateGame(id, maxCoups, totalGames, pWhite, pBlack) {
        const startPartie = performance.now();
        const _log = console.log; const _warn = console.warn;
        console.log = console.warn = () => {}; 

        const game = new ChessGame();
        game.gameState.gameActive = true;
        let coupsCount = 0;

        if (this.badge) this.badge.innerText = `RUNNING ${id}/${totalGames}`;

        try {
            while (coupsCount < maxCoups && game.gameState.gameActive) {
                const color = game.gameState.currentPlayer;
                const moves = this.getAvailableMoves(game, color);
                if (moves.length === 0) break;
                
                const move = moves[Math.floor(Math.random() * moves.length)];
                const success = await this.executeMove(game, move, color);
                
                if (success) {
                    coupsCount++;
                    this.stats.totalMoves++;
                } else break;
            }

            const gs = game.gameState;
            if (gs.checkGameOver) gs.checkGameOver();

            const finalFen = (FENGenerator.generate) ? 
                FENGenerator.generate(game.board, gs) : 
                FENGenerator.generateFEN(gs, game.board);

            const currentPossibleMoves = this.getAvailableMoves(game, gs.currentPlayer);
            const kingInCheck = game.moveValidator.isKingInCheck(gs.currentPlayer);

            let engineDraw = { isDraw: false, reason: "" };
            if (window.ChessNulleEngine) {
                const nulleChecker = new ChessNulleEngine(finalFen);
                const halfMoves = finalFen.split(' ')[4] || 0;
                engineDraw = nulleChecker.isDraw(halfMoves);
            }

            let type = "blanc", resTag = "FIN nulle", winner = null;

            if (gs.isCheckmate || (currentPossibleMoves.length === 0 && kingInCheck)) { 
                resTag = "FIN mat"; type = "rouge"; this.stats.checkmates++; 
                winner = (gs.currentPlayer === 'w') ? 'black' : 'white';
            } else if (gs.isStalemate || (currentPossibleMoves.length === 0 && !kingInCheck)) { 
                resTag = "FIN pat"; type = "orange"; this.stats.stalemates++; 
            } else if (engineDraw.isDraw) {
                resTag = `FIN nulle (${engineDraw.reason})`;
                type = "blanc"; this.stats.draws++;
            } else if (coupsCount >= maxCoups) {
                resTag = "FIN en cours"; type = "gris"; 
            } else {
                resTag = "FIN nulle (technique)"; type = "blanc"; this.stats.draws++;
            }

            window.dispatchEvent(new CustomEvent('arena-game-finished', {
                detail: { winner: winner, status: resTag, pWhite: pWhite, pBlack: pBlack }
            }));

            this.stats.fenList.push(finalFen);
            this.stats.gamesPlayed++;
            
            if (document.getElementById('count')) document.getElementById('count').innerText = this.stats.gamesPlayed;
            if (document.getElementById('progress-bar')) {
                document.getElementById('progress-bar').style.width = `${(this.stats.gamesPlayed / totalGames) * 100}%`;
            }

            console.log = _log; console.warn = _warn;
            const dureePartie = ((performance.now() - startPartie) / 1000).toFixed(2);
            this.statusUpdate(`P#${id} [W:${pWhite} vs B:${pBlack}] (${coupsCount}c - ${dureePartie}s) ${resTag}`, type, resTag);

        } catch (e) {
            console.log = _log; console.warn = _warn;
            this.stats.errors++;
            if (document.getElementById('errors')) document.getElementById('errors').innerText = this.stats.errors;
            this.statusUpdate(`FIN CRASH P#${id}`, "rouge", "FIN CRASH");
        }
    }

    async runBatch() {
        if (this.isRunning) return;
        
        this.resetStats();
        if (window.arenaAnalyst) window.arenaAnalyst.reset();

        const total = parseInt(document.getElementById('inputMaxGames')?.value || 50);
        const moves = parseInt(document.getElementById('inputMaxMoves')?.value || 100);
        const selW = document.getElementById('selectBotWhite')?.value || "L1";
        const selB = document.getElementById('selectBotBlack')?.value || "L1";
        const isRandom = document.getElementById('checkRandomColors')?.checked;

        this.stats.config = { white: selW, black: selB, isRandom: isRandom };

        if (!document.getElementById('stress-test-style')) {
            document.head.insertAdjacentHTML('beforeend', `
                <style id="stress-test-style">
                    .promotion-modal, .promotion-overlay, .chess-notification { display: none !important; }
                </style>`);
        }

        this.isRunning = true; 
        if (this.btn) this.btn.disabled = true; 
        if (this.logEl) this.logEl.innerHTML = ''; 
        
        this.stats.startTime = performance.now();
        this.statusUpdate("🚀 DÉMARRAGE DU TEST...", "system");
        this.statusUpdate(`⚙️ CONFIG : [BLANC:${selW}] vs [NOIR:${selB}] | Aléatoire: ${isRandom ? 'OUI' : 'NON'}`, "gris");

        for (let i = 1; i <= total; i++) {
            let pWhite = selW;
            let pBlack = selB;

            if (isRandom && Math.random() > 0.5) {
                pWhite = selB;
                pBlack = selW;
            }

            await this.simulateGame(i, moves, total, pWhite, pBlack);
            await new Promise(r => setTimeout(r, 1));
        }

        this.stats.totalDuration = ((performance.now() - this.stats.startTime) / 1000).toFixed(1);
        this.statusUpdate(`🏁 SESSION TERMINÉE : [BLANC:${selW} vs NOIR:${selB}] en ${this.stats.totalDuration}s`, "system");
        
        this.isRunning = false; 
        if (this.btn) this.btn.disabled = false;
        
        if (window.GameStatusManager) window.GameStatusManager.consoleLog = true;
        await this.saveJsonToServer();
    }
}

document.addEventListener('DOMContentLoaded', () => { 
    window.stressTester = new BotStressTest(); 
});