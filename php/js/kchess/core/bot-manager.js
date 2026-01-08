/**
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

    async performMove(game, nMove) {
        try {
            const core = game.core || game;
            
            // Correction de la détection d'inversion : on regarde si les pions blancs sont en ligne 6
            if (this.needsInversion === null) {
                const pieceAt64 = game.board.getSquare(6, 4)?.piece;
                this.needsInversion = (pieceAt64 && pieceAt64.color === 'black');
            }

            let finalMove = { ...nMove };
            if (this.needsInversion) {
                finalMove.fR = 7 - nMove.fR;
                finalMove.tR = 7 - nMove.tR;
            }

            // --- SIMULATION UI ---
            core.handleSquareClick(finalMove.fR, finalMove.fC, true);
            await new Promise(r => setTimeout(r, 80)); // Temps pour le moteur de valider
            core.handleSquareClick(finalMove.tR, finalMove.tC, true);

            return true;
        } catch (e) {
            return false;
        }
    }

    async simulateSingleGame(id, maxMoves) {
        const startTime = performance.now();
        const session = { id, status: 'ok', moveCount: 0, result: "", lastFen: "" };
        
        try {
            const game = new ChessGame();
            
            // Désactivation des bots automatiques
            if (game.botManager) game.botManager.isActive = false;
            if (window.botManager) window.botManager.isActive = false;

            const botWhite = new Level_1();
            const botBlack = new Level_1();
            
            let mCount = 0;
            while (mCount < maxMoves) {
                if (!game.gameState.gameActive) break;

                const currentFen = FENGenerator.generate(game.board, game.gameState);
                session.lastFen = currentFen;

                const currentBot = (game.gameState.currentPlayer === 'white') ? botWhite : botBlack;
                const rawMove = await currentBot.getMove(currentFen);
                
                if (!rawMove) break;
                const move = this.normalizeMove(rawMove);
                
                await this.performMove(game, move);
                
                // Pause pour laisser le moteur finir le switchPlayer
                await new Promise(r => setTimeout(r, 150));

                const postFen = FENGenerator.generate(game.board, game.gameState);
                if (currentFen === postFen) {
                    this.statusUpdate(`⚠️ Coup rejeté (${game.gameState.currentPlayer})`, "warn");
                    break;
                }

                mCount++;
                session.moveCount = mCount;
            }

            const resObj = this.determineResult(game, mCount, maxMoves);
            session.result = resObj.text;
            session.duration = Math.round(performance.now() - startTime);
            this.updateStats(resObj, session.moveCount, session.duration);
            this.statusUpdate(`Partie #${id}: ${session.result} (${mCount} coups)`, "success");
            return session;
        } catch (e) {
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