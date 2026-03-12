/**
 * core/BotStressTest - Framework de test de stress pour les bots
 * STRESS TESTER - K-CHESS ENGINE
 * Version : 6.9.37 - Multi-load Safety & UI Sync
 */

// Protection contre la double déclaration
if (window.stressTester) {
    console.log("♻️ Nettoyage de l'instance précédente...");
    window.stressTester = null;
}

window.BotStressTest = class BotStressTest {
    constructor() {
        this.isRunning = false;
        this.gameSessions = [];
        this.needsInversion = null; 
        this.stats = { whiteWins: 0, blackWins: 0, pats: 0, draws: 0, limitReached: 0, totalMoves: 0, totalDuration: 0, errorCount: 0 };
        
        this.logEl = document.getElementById('log-content');
        this.btn = document.getElementById('startBtn');
        this.countDisplay = document.getElementById('count');
        this.progressBar = document.getElementById('progress-bar');
        
        this.init();
    }

    init() {
        if (typeof FENGenerator !== 'undefined' && !FENGenerator.generateFEN) {
            FENGenerator.generateFEN = (gs, b) => FENGenerator.generate(b, gs);
        }
        if (this.btn) this.btn.onclick = () => this.runBatch();
        console.log("🧪 StressTester prêt v6.9.37");
    }

    statusUpdate(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = `msg-${type}`;
        div.innerHTML = `<span style="color:#666">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
        if (this.logEl) {
            this.logEl.appendChild(div);
            this.logEl.scrollTop = this.logEl.scrollHeight;
        }
    }

    normalizeMove(rawMove) {
        if (!rawMove) return null;
        return {
            fR: rawMove.fromRow ?? (rawMove.from?.row),
            fC: rawMove.fromCol ?? (rawMove.from?.col),
            tR: rawMove.toRow ?? (rawMove.to?.row),
            tC: rawMove.toCol ?? (rawMove.to?.col)
        };
    }

    // Dans ton BotStressTest, modifie la fonction performMove :

async performMove(game, nMove) {
    try {
        const board = game.board;
        const gs = game.gameState;

        const fromSq = board.getSquare(nMove.fR, nMove.fC);
        const toSq = board.getSquare(nMove.tR, nMove.tC);

        if (!fromSq || !fromSq.piece) return false;

        const piece = fromSq.piece;

        // Mise à jour mémoire et visuelle
        fromSq.element.innerHTML = ''; 
        fromSq.piece = null;
        toSq.element.innerHTML = '';
        board.placePiece(piece, toSq);

        // --- CORRECTION ICI ---
        // On passe les données du coup pour que GameState puisse les noter dans l'historique
        if (gs.switchPlayer) {
            gs.switchPlayer({
                fR: nMove.fR, fC: nMove.fC, 
                tR: nMove.tR, tC: nMove.tC,
                piece: piece.type
            });
        }

        return true;
    } catch (e) {
        console.error("Erreur performMove:", e);
        return false;
    }
}

async simulateSingleGame(id, maxMoves) {
        const startTime = performance.now();
        const session = { id, status: 'ok', moveCount: 0, result: "", lastFen: "" };
        
        try {
            // Création d'une instance de jeu isolée pour ce test
            const game = new ChessGame();
            
            // Désactivation forcée des managers de bots automatiques du moteur
            if (game.botManager) game.botManager.isActive = false;
            if (window.botManager) window.botManager.isActive = false;

            // --- LOGIQUE DYNAMIQUE UNIVERSELLE (Level 1 à n) ---
            const urlParams = new URLSearchParams(window.location.search);
            const levelNum = urlParams.get('level') || '1';
            
            // On cherche la classe dans window (ex: window["Level_3"])
            // Si le niveau demandé n'est pas chargé, on cherche Level_1, 
            // sinon on prend la première classe Level_x disponible.
            const BotClass = window[`Level_${levelNum}`] || window['Level_1'] || Object.values(window).find(c => c?.name?.startsWith('Level_'));

            if (!BotClass) {
                throw new Error(`Aucune classe de Bot (Level_${levelNum}) n'a été trouvée en mémoire.`);
            }

            // Instanciation des deux adversaires
            const botWhite = new BotClass();
            const botBlack = new BotClass();
            
            this.statusUpdate(`🤖 Partie #${id} : Utilisation de ${BotClass.name}`, "info");
            // ---------------------------------------------------
            
            let mCount = 0;
            while (mCount < maxMoves) {
                // Arrêt si le jeu est terminé (Mat, Pat, etc.)
                if (!game.gameState || !game.gameState.gameActive) break;

                const currentFen = FENGenerator.generate(game.board, game.gameState);
                session.lastFen = currentFen;

                // Sélection du bot selon le trait
                const currentBot = (game.gameState.currentPlayer === 'white') ? botWhite : botBlack;
                
                // Appel asynchrone du bot externe
                const rawMove = await currentBot.getMove(currentFen);
                
                if (!rawMove) {
                    this.statusUpdate(`Partie #${id} : Le bot n'a pas renvoyé de coup.`, "warn");
                    break;
                }

                const move = this.normalizeMove(rawMove);
                
                // Exécution physique du coup sur le plateau
                const moved = await this.performMove(game, move);
                
                // Petit délai pour laisser les événements du moteur (switchPlayer) se propager
                await new Promise(r => setTimeout(r, 150));

                // Vérification anti-blocage : si le FEN n'a pas changé, le coup était invalide
                const postFen = FENGenerator.generate(game.board, game.gameState);
                if (currentFen === postFen) {
                    this.statusUpdate(`⚠️ Coup rejeté par le moteur : ${JSON.stringify(move)}`, "warn");
                    break;
                }

                mCount++;
                session.moveCount = mCount;
            }

            // Calcul du résultat final
            const resObj = this.determineResult(game, mCount, maxMoves);
            session.result = resObj.text;
            session.duration = Math.round(performance.now() - startTime);
            
            // Mise à jour des stats globales du StressTester
            this.updateStats(resObj, session.moveCount, session.duration);
            this.statusUpdate(`Partie #${id}: ${session.result} en ${mCount} coups`, "success");
            
            return session;
        } catch (e) {
            console.error(`❌ Erreur critique Simulation #${id}:`, e);
            this.statusUpdate(`Erreur #${id}: ${e.message}`, "error");
            this.stats.errorCount++;
            return { id, status: 'error' };
        }
    }

    determineResult(game, mCount, maxMoves) {
        const state = game.gameState;
        if (state.isCheckmate) return { text: "Mat", code: (state.currentPlayer === 'white' ? 'black' : 'white') };
        if (state.isStalemate) return { text: "Pat", code: 'pat' };
        if (mCount >= maxMoves) return { text: "Limite", code: 'limit' };
        return { text: "Arrêt", code: 'draw' };
    }

    updateStats(resObj, moves, duration) {
        this.stats.totalMoves += moves;
        this.stats.totalDuration += duration;
        if (resObj.code === 'white') this.stats.whiteWins++;
        else if (resObj.code === 'black') this.stats.blackWins++;
        else if (resObj.code === 'pat') this.stats.pats++;
        else if (resObj.code === 'limit') this.stats.limitReached++;
        else this.stats.draws++;
    }

    async runBatch() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.btn.disabled = true;
        
        const total = parseInt(document.getElementById('inputMaxGames').value) || 1;
        const moves = parseInt(document.getElementById('inputMaxMoves').value) || 10;
        
        this.logEl.innerHTML = "";
        this.statusUpdate(`🚀 Test v6.9.37 (${total} parties)...`, "info");
        this.resetStats();

        for (let i = 0; i < total; i++) {
            const result = await this.simulateSingleGame(i + 1, moves);
            this.gameSessions.push(result);
            if (this.countDisplay) this.countDisplay.innerText = i + 1;
        }

        this.isRunning = false;
        this.btn.disabled = false;
    }

    resetStats() { this.stats = { whiteWins: 0, blackWins: 0, pats: 0, draws: 0, limitReached: 0, totalMoves: 0, totalDuration: 0, errorCount: 0 }; }
}

window.stressTester = new BotStressTest();