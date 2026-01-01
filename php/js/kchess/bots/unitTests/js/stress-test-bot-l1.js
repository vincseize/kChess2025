/**
 * STRESS TESTER - K-CHESS ENGINE
 * Version : 6.9.17 - Deep Debug & Bug Detection
 */

class BotStressTest {
    constructor() {
        this.isRunning = false;
        this.gameSessions = [];
        this.gameCount = 0;
        this.errorCount = 0;
        this.totalGamesToRun = 0;
        this.dotInterval = null;
        this.globalStartTime = 0;
        
        this.logEl = document.getElementById('log-content');
        this.btn = document.getElementById('startBtn');
        this.badge = document.getElementById('game-id-badge');
        this.countDisplay = document.getElementById('count');
        this.errorDisplay = document.getElementById('errors');
        this.progressBar = document.getElementById('progress-bar');
        this.pContainer = document.getElementById('p-container');
        
        this.init();
    }

    init() {
        if (this.btn) this.btn.onclick = () => this.runBatch();
    }

    // ========== GESTION DES LOGS SERVEUR ==========

    async clearPreviousLogs() {
        try {
            const response = await fetch('log_error.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear_all' })
            });
            const res = await response.json();
            console.log(`🧹 Nettoyage terminé : ${res.count || 0} fichiers supprimés.`);
        } catch (e) {
            console.error("Impossible de nettoyer les logs:", e);
        }
    }

    // ========== ANIMATIONS UI ==========

    startBadgeAnimation(currentId) {
        this.stopBadgeAnimation();
        let dotCount = 0;
        this.dotInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            const dots = ".".repeat(dotCount);
            if (this.badge) {
                this.badge.innerText = `RUNNING #${currentId}/${this.totalGamesToRun} ${dots}`;
            }
        }, 400);
    }

    stopBadgeAnimation() {
        if (this.dotInterval) {
            clearInterval(this.dotInterval);
            this.dotInterval = null;
        }
    }

    // ========== OUTILS ==========

    formatDuration(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        let parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}min`);
        parts.push(`${seconds}sec`);
        return parts.length > 0 ? parts.join(' ') : "0sec";
    }

    statusUpdate(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = `msg-${type}`;
        div.innerHTML = `<strong>[${new Date().toLocaleTimeString()}]</strong> ${msg}`;
        if (this.logEl) {
            this.logEl.appendChild(div);
            this.logEl.scrollTop = this.logEl.scrollHeight;
        }
    }

    // ========== LOGIQUE MOTEUR ==========

    async performMove(game, move) {
        try {
            let handler = null;
            if (game.core) {
                for (let key in game.core) {
                    if (game.core[key]?.moveExecutor) {
                        handler = game.core[key];
                        break;
                    }
                }
            }
            if (!handler && game.core.moveHandler) handler = game.core.moveHandler;
            if (!handler) return false;

            const executor = handler.moveExecutor;
            const fromSq = game.board.getSquare(move.fromRow, move.fromCol);
            const toSq = game.board.getSquare(move.toRow, move.toCol);
            
            if (!fromSq || !fromSq.piece) return false;

            game.gameState.currentPlayer = fromSq.piece.color;
            game.selectedPiece = { row: move.fromRow, col: move.fromCol, piece: fromSq.piece };
            game.possibleMoves = game.moveValidator.getPossibleMoves(fromSq.piece, move.fromRow, move.fromCol);

            let engineMove = game.possibleMoves.find(m => m.row === move.toRow && m.col === move.toCol);
            if (!engineMove) return false;

            executor.executeNormalMove(fromSq, toSq, game.selectedPiece, engineMove, move.toRow, move.toCol);
            if (handler.clearSelection) handler.clearSelection();
            return true;
        } catch (e) {
            return false;
        }
    }

    // ========== GESTION DES SESSIONS ==========

    async simulateSingleGame(id, maxMoves) {
        const startTime = performance.now();
        const session = { 
            id, 
            duration: 0, 
            status: 'ok', 
            error: null, 
            moveCount: 0, 
            result: "en cours", 
            lastFen: "",
            engineDebug: null 
        };
        
        let game = null;
        try {
            this.startBadgeAnimation(id);
            game = new ChessGame();
            window.chessGame = game; 
            await new Promise(r => setTimeout(r, 100)); 

            const bot = new Level_1();
            let mCount = 0;

            while (mCount < maxMoves) {
                const currentFen = FENGenerator.generateFEN(game.gameState, game.board);
                session.lastFen = currentFen; 

                // Détection de l'arrêt du moteur AVANT de jouer
                if (!game.gameState.gameActive) {
                    break; 
                }

                const move = bot.getMove(currentFen);
                if (!move) {
                    session.result = "bloqué (pas de move)";
                    break;
                }

                const success = await this.performMove(game, move);
                if (!success) {
                    throw new Error(`Erreur Moteur sur [${move.fromRow},${move.fromCol}]`);
                }

                mCount++;
                session.moveCount = mCount;
                
                // Petit délai pour laisser respirer le thread JS
                await new Promise(r => setTimeout(r, 10)); 
            }

            // Détermination du résultat final une fois sorti de la boucle
            const resObj = this.determineResult(game, mCount, maxMoves);
            session.result = resObj.text;
            session.engineDebug = resObj.debug;

            session.duration = Math.round(performance.now() - startTime);
            return session;

        } catch (e) {
            session.duration = Math.round(performance.now() - startTime);
            this.statusUpdate(`Partie #${id}: ERROR - ${e.message}`, "error");
            session.status = 'error';
            session.error = e.message;
            session.result = "crash";
            return session;
        }
    }

    determineResult(game, mCount, maxMoves) {
        if (!game || !game.gameState) {
            return { text: "ERREUR: Data manquante", debug: null };
        }

        const state = game.gameState;
        const history = state.moveHistory || state.history || [];
        
        // 1. Détection des états de fin de partie officiels
        if (state.isCheckmate) return { text: "mat", debug: null };
        if (state.isStalemate) return { text: "pat", debug: null };
        
        if (state.isDraw) {
            const reasons = {
                'repetition': "nulle (répétition)",
                'insufficientMaterial': "nulle (manque de pièces)",
                'fiftyMoveRule': "nulle (50 coups)"
            };
            return { text: reasons[state.drawReason] || "nulle", debug: null };
        }

        // 2. Cas critique : Le moteur a stoppé gameActive sans raison (le fameux bug "Terminée")
        if (state.gameActive === false) {
            console.warn(`%c 🚨 BUG DETECTÉ SESSION #${this.gameSessions.length + 1} `, "background: #ff0000; color: #fff; font-weight: bold;");
            return { 
                text: "BUG: Arrêt injustifié", 
                debug: {
                    lastMove: history.length > 0 ? history[history.length - 1].notation : "aucun",
                    active: state.gameActive,
                    turn: state.currentPlayer,
                    fullState: JSON.parse(JSON.stringify(state)) 
                }
            };
        }

        // 3. Si on est arrivé ici et que mCount >= maxMoves, c'est la limite normale
        if (mCount >= maxMoves) {
            return { text: "limite atteinte (en cours)", debug: null };
        }

        return { text: "terminée (inconnu)", debug: null };
    }

    async runBatch() {
        if (this.isRunning) return;
        
        await this.clearPreviousLogs();

        this.globalStartTime = performance.now();
        this.isRunning = true;
        this.btn.disabled = true;
        if(this.pContainer) this.pContainer.style.display = 'block';

        this.totalGamesToRun = parseInt(document.getElementById('inputMaxGames').value) || 1;
        const maxMoves = parseInt(document.getElementById('inputMaxMoves').value) || 10;

        this.logEl.innerHTML = "";
        this.statusUpdate(`Démarrage du batch (${this.totalGamesToRun} parties)...`, "info");
        
        this.gameSessions = [];
        this.gameCount = 0;
        this.errorCount = 0;

        for (let i = 0; i < this.totalGamesToRun; i++) {
            const result = await this.simulateSingleGame(i + 1, maxMoves);
            this.gameSessions.push(result);
            
            result.status === 'ok' ? this.gameCount++ : this.errorCount++;
            
            this.countDisplay.innerText = this.gameCount;
            this.errorDisplay.innerText = this.errorCount;
            this.progressBar.style.width = `${((i + 1) / this.totalGamesToRun) * 100}%`;
            
            await new Promise(r => setTimeout(r, 50));
        }

        this.stopBadgeAnimation();
        const globalDuration = performance.now() - this.globalStartTime;
        this.isRunning = false;
        this.btn.disabled = false;
        
        if (this.badge) {
            this.badge.innerText = `DONE #${this.totalGamesToRun}/${this.totalGamesToRun} !`;
        }

        this.statusUpdate(`🏁 Session terminée. Succès: ${this.gameCount} | Errors: ${this.errorCount} | Temps total : <strong>${this.formatDuration(globalDuration)}</strong>`, "info");
        
        this.export(globalDuration);
    }

    export(finalDuration) {
        if (this.gameSessions.length === 0) return;

        const now = new Date();
        const timestamp = now.getFullYear() + "-" + 
                        String(now.getMonth()+1).padStart(2,'0') + "-" + 
                        String(now.getDate()).padStart(2,'0') + "_" + 
                        String(now.getHours()).padStart(2,'0') + "-" + 
                        String(now.getMinutes()).padStart(2,'0') + "-" + 
                        String(now.getSeconds()).padStart(2,'0');

        const filename = `test_results_${timestamp}.json`;

        fetch('log_error.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save',
                filename: filename,
                summary: { 
                    total: this.gameSessions.length, 
                    success: this.gameCount, 
                    errors: this.errorCount,
                    duration: this.formatDuration(finalDuration)
                },
                details: this.gameSessions
            })
        })
        .then(response => response.json())
        .then(res => {
            this.statusUpdate(`💾 Sauvegardé sur serveur : <span style="color:#58a6ff">${res.file}</span>`, "info");
            
            // --- LOGIQUE DE TÉLÉCHARGEMENT AUTOMATIQUE ---
            if (res.downloadUrl) {
                const link = document.createElement('a');
                link.href = res.downloadUrl;
                link.download = res.file; // Force le nom du fichier
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                this.statusUpdate(`📥 Téléchargement lancé...`, "info");
            }
        })
        .catch(err => console.error("Erreur export:", err));
    }
}

document.addEventListener('DOMContentLoaded', () => { window.stressTester = new BotStressTest(); });