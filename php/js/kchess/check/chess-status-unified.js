// check/chess-status-unified.js
class ChessStatusController {
    static consoleLog = true;

    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('✅ ChessStatusController: Moteur unifié prêt');
    }

    static loadConfig() {
        try {
            if (window.appConfig?.debug?.console_log !== undefined) {
                this.consoleLog = window.appConfig.debug.console_log !== "false";
            }
        } catch (e) {}
    }

    /**
     * LOGIQUE DE DÉCISION CRITIQUE
     */
    static checkGameStatus(fen, color = null) {
        const engine = new ChessEngine(fen);
        const playerColor = color || engine.turn;
        
        // ÉTAPE 1 : Le roi est-il en échec ?
        const isCheck = engine.isKingInCheck(playerColor);
        
        // ÉTAPE 2 : Le joueur a-t-il des coups légaux ?
        // On simule pour voir s'il reste une issue
        const hasLegalMoves = engine.generateLegalMoves(playerColor).length > 0;

        if (this.consoleLog) {
            console.log(`🔍 Analyse ${playerColor}: enÉchec=${isCheck}, coupsDispo=${hasLegalMoves}`);
        }

        // --- ORDRE DE PRIORITÉ ---

        // 1. ÉCHEC ET MAT : En échec ET aucun coup possible
        if (isCheck && !hasLegalMoves) {
            return { status: 'checkmate', reason: 'Le roi est en échec et mat.' };
        }

        // 2. PAT (STALEMATE) : PAS en échec MAIS aucun coup possible
        if (!isCheck && !hasLegalMoves) {
            return { status: 'stalemate', reason: 'Pat : aucun coup possible mais pas d\'échec.' };
        }

        // 3. ÉCHEC SIMPLE : En échec MAIS a des coups possibles
        if (isCheck) {
            return { status: 'check', reason: 'Le roi est en échec.' };
        }

        // 4. NULLE TECHNIQUE (Optionnel si vous avez ChessNulleEngine)
        if (typeof ChessNulleEngine !== 'undefined') {
            const nulleEngine = new ChessNulleEngine(fen);
            const drawCheck = nulleEngine.isDraw();
            if (drawCheck.isDraw) {
                return { status: 'draw', reason: drawCheck.reason };
            }
        }

        // 5. JEU EN COURS
        return { status: 'in_progress', reason: '' };
    }

    static getGameStatus(fen, currentPlayerColor) {
        // Conversion 'white' -> 'w'
        const colorKey = currentPlayerColor === 'white' ? 'w' : 'b';
        const result = this.checkGameStatus(fen, colorKey);
        
        const labels = {
            'checkmate': 'Échec et mat',
            'stalemate': 'Pat (Nulle)',
            'draw': 'Match nul',
            'check': 'Échec',
            'in_progress': 'Jeu en cours'
        };

        return {
            status: result.status,
            message: labels[result.status],
            reason: result.reason,
            isGameOver: ['checkmate', 'stalemate', 'draw'].includes(result.status),
            isCheck: result.status === 'check' || result.status === 'checkmate'
        };
    }
}
ChessStatusController.init();
window.ChessStatusController = ChessStatusController;