/**
 * STRESS TESTER - BOT LEVEL 1 vs LEVEL 1
 * Version : 6.5 - K-Chess Architecture Sync (Core -> MoveHandler)
 */

class BotStressTest {
    constructor() {
        this.isRunning = false;
        this.gameSessions = [];
        this.gameCount = 0;
        this.errorCount = 0;
        
        this.logEl = document.getElementById('log-content');
        this.btn = document.getElementById('startBtn');
        this.badge = document.getElementById('game-id-badge');
        this.countDisplay = document.getElementById('count');
        this.errorDisplay = document.getElementById('errors');
        this.progressBar = document.getElementById('progress-bar');
        
        this.init();
    }

    init() {
        if (this.btn) this.btn.onclick = () => this.runBatch();
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

async performMove(game, move) {
    try {
        // 1. Localisation du Handler (le cerveau)
        let handler = null;
        if (game.core) {
            for (let key in game.core) {
                if (game.core[key]?.moveExecutor) {
                    handler = game.core[key];
                    break;
                }
            }
        }
        if (!handler) return false;

        const executor = handler.moveExecutor;
        const fromSq = game.board.getSquare(move.fromRow, move.fromCol);
        const toSq = game.board.getSquare(move.toRow, move.toCol);
        
        if (!fromSq || !fromSq.piece) return false;

        // 2. CONFIGURATION DE L'ÉTAT (Copie conforme de MoveStateManager)
        game.gameState.currentPlayer = fromSq.piece.color;
        
        // On simule exactement ce que fait handlePieceSelection
        game.selectedPiece = { 
            row: move.fromRow, 
            col: move.fromCol, 
            piece: fromSq.piece 
        };

        // 3. CALCUL DES COUPS (Via ton Master Validator)
        game.possibleMoves = game.moveValidator.getPossibleMoves(
            fromSq.piece, 
            move.fromRow, 
            move.fromCol
        );

        // 4. RÉCUPÉRATION DU COUP SPÉCIFIQUE
        let engineMove = game.possibleMoves.find(m => m.row === move.toRow && m.col === move.toCol);
        if (!engineMove) return false;

        // 5. PRÉPARATION DES ARGUMENTS POUR L'EXECUTOR
        // Ton executeNormalMove attend : (fromSq, toSq, selectedPiece, move, toRow, toCol)
        // selectedPiece ici doit être l'OBJET de l'étape 2
        
        executor.executeNormalMove(
            fromSq, 
            toSq, 
            game.selectedPiece, // L'objet structuré {row, col, piece}
            engineMove, 
            move.toRow, 
            move.toCol
        );

        // 6. NETTOYAGE
        if (handler.clearSelection) handler.clearSelection();
        return true;

    } catch (e) {
        console.group("🔥 Erreur de Synchro Moteur");
        console.error("Message:", e.message);
        console.log("Trace:", e.stack.split('\n')[1]); // Ligne précise du crash
        console.groupEnd();
        return false;
    }
}

    async simulateSingleGame(id, maxMoves) {
        const session = { id, totalMoves: 0, finalFen: '', status: 'ok', error: null };
        try {
            if (this.badge) this.badge.innerText = `RUNNING #${id}`;
            
            // Initialisation conforme à ton chess-game.js
            const game = new ChessGame();
            window.chessGame = game; 
            
            await new Promise(r => setTimeout(r, 500)); 

            const bot = new Level_1();
            let mCount = 0;

            while (mCount < maxMoves) {
                if (!game.gameState.gameActive) break;

                const currentFen = FENGenerator.generateFEN(game.gameState, game.board);
                const move = bot.getMove(currentFen);
                if (!move) break;

                const success = await this.performMove(game, move);
                
                if (!success) {
                    await new Promise(r => setTimeout(r, 200));
                    if (!(await this.performMove(game, move))) {
                        throw new Error(`Refus Moteur à ${mCount} coups sur [${move.fromRow},${move.fromCol}]`);
                    }
                }

                mCount++;
                await new Promise(r => setTimeout(r, 100)); 
            }

            session.totalMoves = mCount;
            session.finalFen = FENGenerator.generateFEN(game.gameState, game.board);
            this.statusUpdate(`Partie #${id}: Succès (${mCount} coups)`, "success");
            return session;

        } catch (e) {
            this.statusUpdate(`Partie #${id}: Échec - ${e.message}`, "error");
            session.status = 'error';
            session.error = e.message;
            return session;
        }
    }

    async runBatch() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.btn.disabled = true;

        const totalGames = parseInt(document.getElementById('inputMaxGames').value) || 1;
        const maxMoves = parseInt(document.getElementById('inputMaxMoves').value) || 10;

        this.logEl.innerHTML = "";
        this.gameSessions = [];
        this.gameCount = 0;
        this.errorCount = 0;

        for (let i = 0; i < totalGames; i++) {
            const result = await this.simulateSingleGame(i + 1, maxMoves);
            this.gameSessions.push(result);
            result.status === 'ok' ? this.gameCount++ : this.errorCount++;
            
            this.countDisplay.innerText = this.gameCount;
            this.errorDisplay.innerText = this.errorCount;
            this.progressBar.style.width = `${((i + 1) / totalGames) * 100}%`;
            await new Promise(r => setTimeout(r, 600));
        }

        this.isRunning = false;
        this.btn.disabled = false;
        this.statusUpdate("🏁 Session terminée.", "info");
        this.export();
    }

    export() {
        if (this.gameSessions.length === 0) return;
        fetch('log_error.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.gameSessions)
        });
    }
}

document.addEventListener('DOMContentLoaded', () => { window.stressTester = new BotStressTest(); });