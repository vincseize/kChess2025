/**
 * js/stress-test-bot.js
 * Version : 7.4.1 - Avec filtre UI pour les nulles
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
            config: { white: "", black: "", isRandom: false, maxCoups: 0 }
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
        if (copyLogBtn) copyLogBtn.onclick = (e) => this.copyToClipboard(this.logEl.innerText, e.target);
        
        const copyFenBtn = document.getElementById('copyFenBtn');
        if (copyFenBtn) {
            copyFenBtn.onclick = (e) => {
                const fenText = this.stats.fenList.join('\n');
                if (fenText) this.copyToClipboard(fenText, e.target);
            };
        }

        const copyStatsBtn = document.getElementById('copyStatsBtn');
        if (copyStatsBtn) {
            copyStatsBtn.onclick = () => {
                const stats = {
                    white: document.getElementById('dash-win-w').innerText,
                    black: document.getElementById('dash-win-b').innerText,
                    draws: document.getElementById('dash-draws').innerText,
                    moves: document.getElementById('dash-moves').innerText,
                    ratioGlobal: document.getElementById('dash-ratio')?.innerText || "0/0/0",
                    ratioPure: document.getElementById('dash-pure-ratio')?.innerText || "0/0",
                    total: document.getElementById('count').innerText
                };
                const text = `📊 ARENA STATS REPORT\n-----------------------\nParties : ${stats.total}\nBlancs  : ${stats.white} victoires\nNoirs   : ${stats.black} victoires\nNulles  : ${stats.draws}\nCoups   : ${stats.moves}\nRatio (W/D/B) : ${stats.ratioGlobal}\nRatio (W/B)   : ${stats.ratioPure} (Hors nulles)\n-----------------------\nGénéré le : ${new Date().toLocaleString()}`;
                this.copyToClipboard(text, copyStatsBtn);
            };
        }

        const clearBtn = document.getElementById('clearJsonBtn');
        if (clearBtn) {
            clearBtn.onclick = () => {
                if (!confirm("Supprimer tous les fichiers JSON sur le serveur ?")) return;
                fetch('log_error.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'clear_all' })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.status === "cleared" || data.status === "success") {
                        if (window.arenaAnalyst) window.arenaAnalyst.reset();
                        alert("Serveur nettoyé !");
                        location.reload();
                    }
                })
                .catch(e => console.error("Erreur:", e));
            };
        }

        document.getElementById('selectBotWhite')?.addEventListener('change', (e) => console.log(`[ARENA] Bot BLANC changé pour : ${e.target.value}`));
        document.getElementById('selectBotBlack')?.addEventListener('change', (e) => console.log(`[ARENA] Bot NOIR changé pour : ${e.target.value}`));
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
        const colors = { rouge: "#f85149", orange: "#d29922", blanc: "#ffffff", gris: "#8b949e", system: "#3fb950" };
        const time = `<span style="color:#8b949e">[${new Date().toLocaleTimeString()}]</span> `;
        let formattedMsg = msg;
        if (resultLabel) {
            const labelColor = colors[type] || "#ffffff";
            formattedMsg = msg.replace("FIN", `<span style="color:${labelColor}; font-weight:bold;">FIN</span>`);
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
        const dynamicName = `stress_test-White_${white}-vs-Black_${black}${isRandom ? "-RANDOM" : ""}.json`;
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
        const normalMoves = [], prioritaryMoves = [];
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
            if (game.promotionManager) {
                game.promotionManager.showPromotionModal = (row, col, pieceColor, callback) => {
                    game.promotionManager.handleChoice('queen', row, col, callback);
                };
            }
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
        const _log = console.log; const _warn = console.warn;
        console.log = console.warn = () => {}; 

        const game = new ChessGame();
        game.gameState.gameActive = true;
        let coupsCount = 0;

        const whiteAI = window[`Level_${pWhite.replace('L','')}`] ? new window[`Level_${pWhite.replace('L','')}`]() : null;
        const blackAI = window[`Level_${pBlack.replace('L','')}`] ? new window[`Level_${pBlack.replace('L','')}`]() : null;

        if (this.badge) this.badge.innerText = `RUNNING ${id}/${totalGames}`;

        try {
            while (coupsCount < maxCoups && game.gameState.gameActive) {
                const color = game.gameState.currentPlayer;
                const currentAI = (color === 'white' || color === 'w') ? whiteAI : blackAI;
                let move = null;
                if (currentAI && typeof currentAI.getMove === 'function') {
                    window.chessGame = game;
                    move = await currentAI.getMove();
                } 
                if (!move || move.error || move.fromRow === undefined) {
                    const moves = this.getAvailableMoves(game, color);
                    if (moves.length === 0) break;
                    move = moves[Math.floor(Math.random() * moves.length)];
                }
                if (await this.executeMove(game, move, color)) {
                    coupsCount++;
                    this.stats.totalMoves++;
                } else break;
            }

            const gs = game.gameState;
            if (gs.checkGameOver) gs.checkGameOver();

            let winner = 'draw', resTag = "FIN nulle", type = "blanc";
            const whiteMoves = this.getAvailableMoves(game, 'white');
            const blackMoves = this.getAvailableMoves(game, 'black');
            const whiteInCheck = game.moveValidator.isKingInCheck('white');
            const blackInCheck = game.moveValidator.isKingInCheck('black');

            let isStalemate = false;

            if (whiteInCheck && whiteMoves.length === 0) { winner = 'black'; resTag = "FIN mat"; type = "rouge"; }
            else if (blackInCheck && blackMoves.length === 0) { winner = 'white'; resTag = "FIN mat"; type = "rouge"; this.stats.checkmates++; }
            else if ((!whiteInCheck && whiteMoves.length === 0) || (!blackInCheck && blackMoves.length === 0)) { 
                resTag = "FIN pat"; type = "orange"; this.stats.stalemates++; isStalemate = true;
            }
            else if (coupsCount >= maxCoups) { resTag = "FIN limite"; type = "gris"; }
            else { this.stats.draws++; }

            const finalFen = FENGenerator.generateFEN ? FENGenerator.generateFEN(gs, game.board) : FENGenerator.generate(game.board, gs);
            window.dispatchEvent(new CustomEvent('arena-game-finished', { detail: { winner, status: resTag, pWhite, pBlack, moves: coupsCount } }));

            this.stats.fenList.push(finalFen);
            this.stats.gamesPlayed++;
            
            if (document.getElementById('count')) document.getElementById('count').innerText = this.stats.gamesPlayed;
            if (document.getElementById('progress-bar')) document.getElementById('progress-bar').style.width = `${(this.stats.gamesPlayed / totalGames) * 100}%`;

            console.log = _log; console.warn = _warn;
            
            // --- LOGIQUE D'AFFICHAGE FILTRÉE ---
            const showDraws = document.getElementById('checkShowDraws')?.checked;
            // On affiche si : Ce n'est pas une nulle, OU si c'est un PAT, OU si la case "Afficher nulles" est cochée
            const shouldLog = (winner !== 'draw') || isStalemate || showDraws;

            if (shouldLog) {
                let logMsg = `P#${id} [W:${pWhite} vs B:${pBlack}] (${coupsCount}/${maxCoups}c) ${resTag} | FEN: ${finalFen}`;
                if (winner === 'white') logMsg += ` - Gagnant: BLANCS`;
                else if (winner === 'black') logMsg += ` - Gagnant: NOIRS`;
                this.statusUpdate(logMsg, type, resTag);
            }

        } catch (e) {
            console.log = _log; console.warn = _warn;
            this.stats.errors++;
            this.statusUpdate(`FIN CRASH P#${id} : ${e.message}`, "rouge", "FIN CRASH");
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

        this.stats.config = { white: selW, black: selB, isRandom, maxCoups: moves };

        if (!document.getElementById('stress-test-style')) {
            document.head.insertAdjacentHTML('beforeend', `<style id="stress-test-style">.promotion-modal, .promotion-overlay, .chess-notification { display: none !important; }</style>`);
        }

        this.isRunning = true; 
        if (this.btn) this.btn.disabled = true; 
        if (this.logEl) this.logEl.innerHTML = ''; 
        this.stats.startTime = performance.now();
        
        this.statusUpdate("DEMARRAGE DU TEST...", "system");
        this.statusUpdate(`CONFIG : [BLANC:${selW}] vs [NOIRS:${selB}] | Aleatoire: ${isRandom ? 'OUI' : 'NON'} | Limite: ${moves} coups`, "gris");

        for (let i = 1; i <= total; i++) {
            let pW = selW, pB = selB;
            if (isRandom && Math.random() > 0.5) { pW = selB; pB = selW; }
            await this.simulateGame(i, moves, total, pW, pB);
            await new Promise(r => setTimeout(r, 1));
        }

        this.stats.totalDuration = ((performance.now() - this.stats.startTime) / 1000).toFixed(1);
        this.statusUpdate(`SESSION TERMINEE : [BLANCS:${selW} vs NOIRS:${selB}] en ${this.stats.totalDuration}s`, "system");
        this.isRunning = false; 
        if (this.btn) this.btn.disabled = false;
        await this.saveJsonToServer();
    }
}

document.addEventListener('DOMContentLoaded', () => { window.stressTester = new BotStressTest(); });