/**
 * STRESS TESTER - K-CHESS ENGINE
 * Version : 6.9.23 - Multi-Bot Ready & Async Fix
 * Ce script pilote des sessions Bot vs Bot avec support pour duels asynchrones.
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
        
        // Éléments UI
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
    // --- PATCH DE COMPATIBILITÉ SANS TOUCHER AUX FICHIERS SOURCES ---
    if (typeof FENGenerator !== 'undefined' && !FENGenerator.generateFEN) {
        // On crée l'alias attendu par GameStatusManager
        FENGenerator.generateFEN = function(gameState, board) {
            // Attention : GameStatusManager envoie (state, board) 
            // alors que FENGenerator.generate attend (board, state)
            return FENGenerator.generate(board, gameState);
        };
        console.log("🛠️ Bridge FENGenerator.generateFEN injecté avec succès.");
    }
    // ----------------------------------------------------------------

    if (this.btn) this.btn.onclick = () => this.runBatch();
    console.log("🧪 StressTester prêt.");
}

    // ========== GESTION LOGS ==========

    async clearPreviousLogs() {
        try {
            const response = await fetch('log_error.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear_all' })
            });
            const res = await response.json();
            this.statusUpdate(`Sweep : ${res.count || 0} rapports nettoyés.`, "info");
        } catch (e) { console.error("Nettoyage impossible:", e); }
    }

    statusUpdate(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = `msg-${type}`;
        div.style.padding = "2px 0";
        div.style.borderBottom = "1px solid #222";
        if (type === 'fen') {
            div.style.fontSize = "10px";
            div.style.color = "#777";
            div.style.fontFamily = "monospace";
        }
        div.innerHTML = `<span style="color:#666">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
        if (this.logEl) {
            this.logEl.appendChild(div);
            this.logEl.scrollTop = this.logEl.scrollHeight;
        }
    }

    // ========== LOGIQUE NORMALISATION & MOTEUR ==========

    normalizeMove(rawMove) {
        if (!rawMove) return null;
        
        const move = {
            fR: rawMove.fromRow ?? rawMove.startRow ?? (rawMove.from ? rawMove.from.row : undefined),
            fC: rawMove.fromCol ?? rawMove.startCol ?? (rawMove.from ? rawMove.from.col : undefined),
            tR: rawMove.toRow ?? rawMove.targetRow ?? rawMove.endRow ?? (rawMove.to ? rawMove.to.row : undefined),
            tC: rawMove.toCol ?? rawMove.targetCol ?? rawMove.endCol ?? (rawMove.to ? rawMove.to.col : undefined)
        };

        if (move.fR === undefined || move.tR === undefined) {
            console.error("❌ Format de mouvement Bot inconnu :", rawMove);
            return null;
        }
        return move;
    }

    async performMove(game, nMove) {
        try {
            let handler = game.moveHandler || (game.core ? game.core.moveHandler : null);
            if (!handler && game.core) {
                for (let key in game.core) {
                    if (game.core[key]?.moveExecutor) { handler = game.core[key]; break; }
                }
            }
            if (!handler) return false;

            const fromSq = game.board.getSquare(nMove.fR, nMove.fC);
            const toSq = game.board.getSquare(nMove.tR, nMove.tC);
            
            if (!fromSq || !fromSq.piece) return false;

            game.gameState.currentPlayer = fromSq.piece.color;
            game.selectedPiece = { row: nMove.fR, col: nMove.fC, piece: fromSq.piece };
            
            const possibleMoves = game.moveValidator.getPossibleMoves(fromSq.piece, nMove.fR, nMove.fC);

            let engineMove = possibleMoves.find(m => 
                (m.row === nMove.tR && m.col === nMove.tC) || 
                (m.toRow === nMove.tR && m.toCol === nMove.tC)
            );
            
            if (!engineMove) return false;

            handler.moveExecutor.executeNormalMove(fromSq, toSq, game.selectedPiece, engineMove, nMove.tR, nMove.tC);
            if (handler.clearSelection) handler.clearSelection();
            
            return true;
        } catch (e) {
            console.error("💥 Erreur performMove:", e);
            return false;
        }
    }

    // ========== LOGIQUE DE SIMULATION (CAS 3 INCLUS) ==========

    async simulateSingleGame(id, maxMoves) {
    const startTime = performance.now();
    // On va stocker l'historique des FEN localement sans les afficher
    const fenHistory = [];
    const session = { id, status: 'ok', moveCount: 0, result: "en cours", lastFen: "" };
    
    try {
        this.updateBadge(id);
        const game = new ChessGame();
        window.chessGame = game; 
        
        const botWhite = new Level_1();
        const botBlack = new Level_1();
        
        let mCount = 0;
        while (mCount < maxMoves) {
            if (!game.gameState.gameActive) break;

            const currentFen = FENGenerator.generate(game.board, game.gameState);
            session.lastFen = currentFen;
            fenHistory.push(currentFen); // On sauvegarde dans l'array

            // ON NE LOGUE PLUS ICI SYSTÉMATIQUEMENT
            // Sauf pour le tout premier coup pour le feedback visuel
            if (mCount === 0) this.statusUpdate(`Départ FEN: ${currentFen}`, "fen");

            const activeColor = game.gameState.currentPlayer;
            const currentBot = (activeColor === 'white') ? botWhite : botBlack;

            const rawMove = await currentBot.getMove(currentFen);
            const move = this.normalizeMove(rawMove);

            if (!move) throw new Error(`Format invalide au coup ${mCount}`);

            const success = await this.performMove(game, move);
            if (!success) throw new Error(`Incohérence moteur au coup ${mCount}`);

            mCount++;
            session.moveCount = mCount;
            await new Promise(r => setTimeout(r, 10)); // Accéléré à 10ms
        }

        session.result = this.determineResult(game, mCount, maxMoves).text;
        session.duration = Math.round(performance.now() - startTime);

        // LOG DE FIN : On affiche la position finale et le résultat
        this.statusUpdate(`Partie #${id} terminée : ${session.result} (${mCount} coups). FEN Finale: ${session.lastFen}`, "success");

        return session;

    } catch (e) {
        // SI ERREUR : On déballe tout l'historique pour comprendre
        this.statusUpdate(`💥 CRASH Partie #${id} au coup ${session.moveCount}`, "error");
        this.statusUpdate(`Historique avant crash :`, "error");
        fenHistory.forEach((f, i) => this.statusUpdate(`  [${i}] ${f}`, "fen"));
        this.statusUpdate(`Erreur: ${e.message}`, "error");
        
        session.status = 'error';
        session.error = e.message;
        return session;
    }
}

    determineResult(game, mCount, maxMoves) {
        const state = game.gameState;
        if (state.isCheckmate) return { text: "Echec et Mat" };
        if (state.isStalemate) return { text: "Pat (Nulle)" };
        if (state.isDraw) return { text: "Nulle" };
        if (mCount >= maxMoves) return { text: "Limite de coups atteinte" };
        return { text: "Terminée" };
    }

    // ========== EXÉCUTION DU TEST ==========

    async runBatch() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.btn.disabled = true;
        
        await this.clearPreviousLogs();
        this.globalStartTime = performance.now();

        const total = parseInt(document.getElementById('inputMaxGames').value) || 1;
        const moves = parseInt(document.getElementById('inputMaxMoves').value) || 10;
        this.totalGamesToRun = total;

        this.logEl.innerHTML = "";
        this.statusUpdate(`🚀 Démarrage du Stress Test (${total} parties)...`, "info");
        
        this.gameSessions = [];
        this.gameCount = 0;
        this.errorCount = 0;

        for (let i = 0; i < total; i++) {
            const result = await this.simulateSingleGame(i + 1, moves);
            this.gameSessions.push(result);
            
            result.status === 'ok' ? this.gameCount++ : this.errorCount++;
            
            // Mise à jour UI
            this.countDisplay.innerText = this.gameCount;
            this.errorDisplay.innerText = this.errorCount;
            this.progressBar.style.width = `${((i + 1) / total) * 100}%`;
        }

        this.isRunning = false;
        this.btn.disabled = false;
        if (this.badge) this.badge.innerText = `FINISHED`;
        this.statusUpdate(`🏁 Test terminé en ${((performance.now() - this.globalStartTime)/1000).toFixed(1)}s`, "info");
        this.export();
    }

    updateBadge(id) {
        if (this.badge) this.badge.innerText = `RUNNING #${id}/${this.totalGamesToRun}`;
    }

    export() {
        fetch('log_error.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'save', 
                summary: { total: this.gameSessions.length, success: this.gameCount, errors: this.errorCount },
                details: this.gameSessions 
            })
        }).catch(e => console.error("Échec de l'exportation:", e));
    }
}

document.addEventListener('DOMContentLoaded', () => { window.stressTester = new BotStressTest(); });