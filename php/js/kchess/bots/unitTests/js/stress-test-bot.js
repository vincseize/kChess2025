/**
 * js/stress-test-bot.js
 * Version : 7.3.3 - Stable Automated Promotion & Winner Labels
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
            if (game.moveHandler) { 
                game.moveHandler.isPromoting = false; 
                game.moveHandler.selectedPiece = null; 
            }
            if (game.clearSelection) game.clearSelection();

            // Automatisation de la promotion : On force la Dame
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
        } catch (e) { 
            return false; 
        }
    }

async simulateGame(id, maxCoups, totalGames, pWhite, pBlack) {
        const startPartie = performance.now();
        const _log = console.log; 
        const _warn = console.warn;
        
        // Silence local de la console pour les performances
        console.log = console.warn = () => {}; 

        const game = new ChessGame();
        game.gameState.gameActive = true;
        let coupsCount = 0;

        if (this.badge) this.badge.innerText = `RUNNING ${id}/${totalGames}`;

        try {
            // Boucle de jeu principale
            while (coupsCount < maxCoups && game.gameState.gameActive) {
                const color = game.gameState.currentPlayer;
                const moves = this.getAvailableMoves(game, color);
                
                if (moves.length === 0) break;
                
                const move = moves[Math.floor(Math.random() * moves.length)];
                const success = await this.executeMove(game, move, color);
                
                if (success) {
                    coupsCount++;
                    this.stats.totalMoves++;
                } else {
                    break;
                }
            }

            // Forcer la vérification de fin de partie par le moteur
            const gs = game.gameState;
            if (gs.checkGameOver) gs.checkGameOver();

            // Génération du FEN final
            const finalFen = (FENGenerator.generate) ? 
                FENGenerator.generate(game.board, gs) : 
                FENGenerator.generateFEN(gs, game.board);

            // Analyse de l'état final
            const currentPossibleMoves = this.getAvailableMoves(game, gs.currentPlayer);
            const kingInCheck = game.moveValidator.isKingInCheck(gs.currentPlayer);

            let engineDraw = { isDraw: false, reason: "" };
            if (window.ChessNulleEngine) {
                const nulleChecker = new ChessNulleEngine(finalFen);
                const halfMoves = finalFen.split(' ')[4] || 0;
                engineDraw = nulleChecker.isDraw(halfMoves);
            }

            let type = "blanc", resTag = "FIN nulle", winner = null;

            // --- LOGIQUE DE DÉTERMINATION DU VAINQUEUR ---
            if (gs.isCheckmate || (currentPossibleMoves.length === 0 && kingInCheck)) { 
                resTag = "FIN mat"; 
                type = "rouge"; 
                this.stats.checkmates++; 
                
                // Vérification directe pour éviter les erreurs d'inversion
                const whiteKingInCheck = game.moveValidator.isKingInCheck('w');
                const blackKingInCheck = game.moveValidator.isKingInCheck('b');

                if (whiteKingInCheck) {
                    winner = 'black'; // Le blanc est mat, noir gagne
                } else if (blackKingInCheck) {
                    winner = 'white'; // Le noir est mat, blanc gagne
                } else {
                    // Sécurité : si l'état est flou, on utilise le tour
                    winner = (gs.currentPlayer === 'w') ? 'black' : 'white';
                }

            } else if (gs.isStalemate || (currentPossibleMoves.length === 0 && !kingInCheck)) { 
                resTag = "FIN pat"; 
                type = "orange"; 
                this.stats.stalemates++; 
                winner = 'draw';
            } else if (engineDraw.isDraw) {
                resTag = `FIN nulle (${engineDraw.reason})`;
                type = "blanc"; 
                this.stats.draws++;
                winner = 'draw';
            } else if (coupsCount >= maxCoups) {
                resTag = "FIN en cours"; 
                type = "gris"; 
                winner = 'ongoing';
            } else {
                resTag = "FIN nulle (technique)"; 
                type = "blanc"; 
                this.stats.draws++;
                winner = 'draw';
            }

            // Envoi de l'événement à l'analyste ArenaAnalyst
            window.dispatchEvent(new CustomEvent('arena-game-finished', {
                detail: { winner, status: resTag, pWhite, pBlack, moves: coupsCount }
            }));

            // Mise à jour des statistiques de session
            this.stats.fenList.push(finalFen);
            this.stats.gamesPlayed++;
            
            if (document.getElementById('count')) document.getElementById('count').innerText = this.stats.gamesPlayed;
            if (document.getElementById('progress-bar')) {
                document.getElementById('progress-bar').style.width = `${(this.stats.gamesPlayed / totalGames) * 100}%`;
            }

            // Restauration des logs console
            console.log = _log; console.warn = _warn;
            const dureePartie = ((performance.now() - startPartie) / 1000).toFixed(2);
            
            // --- CONSTRUCTION DU MESSAGE DE LOG ---
            // Format : P#1 [W:L1 vs B:L3] (88/100c - 0.12s) FIN mat | FEN: ... - Gagnant: NOIRS
            let logMsg = `P#${id} [W:${pWhite} vs B:${pBlack}] (${coupsCount}/${maxCoups}c - ${dureePartie}s) ${resTag} | FEN: ${finalFen}`;
            
            if (winner === 'white') {
                logMsg += ` - Gagnant: BLANCS`;
            } else if (winner === 'black') {
                logMsg += ` - Gagnant: NOIRS`;
            }

            this.statusUpdate(logMsg, type, resTag);

        } catch (e) {
            console.log = _log; console.warn = _warn;
            this.stats.errors++;
            if (document.getElementById('errors')) document.getElementById('errors').innerText = this.stats.errors;
            this.statusUpdate(`FIN CRASH P#${id}`, "rouge", "FIN CRASH");
        }
    }
    
    async runBatch() {
        if (this.isRunning) return;
        
        // Réinitialisation des statistiques et de l'analyste
        this.resetStats();
        if (window.arenaAnalyst) window.arenaAnalyst.reset();

        // Récupération des paramètres de l'interface
        const total = parseInt(document.getElementById('inputMaxGames')?.value || 50);
        const moves = parseInt(document.getElementById('inputMaxMoves')?.value || 100);
        const selW = document.getElementById('selectBotWhite')?.value || "L1";
        const selB = document.getElementById('selectBotBlack')?.value || "L1";
        const isRandom = document.getElementById('checkRandomColors')?.checked;

        // Sauvegarde de la configuration (incluant maxCoups pour le JSON final)
        this.stats.config = { 
            white: selW, 
            black: selB, 
            isRandom: isRandom,
            maxCoups: moves 
        };

        // Injection CSS pour cacher les éléments UI parasites (modales de promotion, etc.)
        if (!document.getElementById('stress-test-style')) {
            document.head.insertAdjacentHTML('beforeend', `
                <style id="stress-test-style">
                    .promotion-modal, .promotion-overlay, .chess-notification { display: none !important; }
                </style>`);
        }

        // État de fonctionnement
        this.isRunning = true; 
        if (this.btn) this.btn.disabled = true; 
        if (this.logEl) this.logEl.innerHTML = ''; 
        
        this.stats.startTime = performance.now();
        
        // Messages de statut sobres (sans émojis)
        this.statusUpdate("DEMARRAGE DU TEST...", "system");
        this.statusUpdate(`CONFIG : [BLANC:${selW}] vs [NOIRS:${selB}] | Aleatoire: ${isRandom ? 'OUI' : 'NON'} | Limite: ${moves} coups`, "gris");

        // Boucle principale des parties
        for (let i = 1; i <= total; i++) {
            let pWhite = selW;
            let pBlack = selB;

            // Inversion aléatoire des couleurs si l'option est cochée
            if (isRandom && Math.random() > 0.5) {
                pWhite = selB;
                pBlack = selW;
            }

            // Exécution d'une simulation de partie
            await this.simulateGame(i, moves, total, pWhite, pBlack);
            
            // Laisser une micro-pause pour ne pas figer le navigateur
            await new Promise(r => setTimeout(r, 1));
        }

        // Calcul de la durée totale
        this.stats.totalDuration = ((performance.now() - this.stats.startTime) / 1000).toFixed(1);
        
        // Message de fin
        this.statusUpdate(`SESSION TERMINEE : [BLANCS:${selW} vs NOIRS:${selB}] en ${this.stats.totalDuration}s`, "system");
        
        this.isRunning = false; 
        if (this.btn) this.btn.disabled = false;
        
        // Réactivation des logs de console standards du jeu si nécessaire
        if (window.GameStatusManager) window.GameStatusManager.consoleLog = true;
        
        // Sauvegarde automatique du rapport JSON sur le serveur
        await this.saveJsonToServer();
    }
}

document.addEventListener('DOMContentLoaded', () => { 
    window.stressTester = new BotStressTest(); 
});