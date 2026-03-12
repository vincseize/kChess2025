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
                const val = window.appConfig.debug.console_log;
                this.consoleLog = val === "false" ? false : Boolean(val);
            }
        } catch (e) {}
    }

    /**
     * LOGIQUE DE DÉCISION UNIQUE
     * Centralise l'appel aux différents moteurs pour déterminer l'état de la partie
     */
    static checkGameStatus(fen, color = null) {
        // 1. On utilise le moteur de base (qui est maintenant robuste)
        const engine = new ChessEngine(fen);
        const playerColor = color || engine.turn;
        
        // 2. Récupération des états clés
        const isCheck = engine.isKingInCheck(playerColor);
        const hasLegalMoves = engine.hasAnyLegalMoves(playerColor); 

        if (this.consoleLog) {
            console.log(`🔍 Analyse ${playerColor === 'w' ? 'Blancs' : 'Noirs'}: Check=${isCheck}, hasMoves=${hasLegalMoves}`);
        }

        // --- ORDRE DE PRIORITÉ DES RÈGLES ---

        // 1. ÉCHEC ET MAT
        if (isCheck && !hasLegalMoves) {
            return { 
                status: 'checkmate', 
                reason: 'Échec et mat ! Le roi ne peut plus s\'échapper.',
                winner: playerColor === 'w' ? 'black' : 'white'
            };
        }

        // 2. PAT (STALEMATE)
        if (!isCheck && !hasLegalMoves) {
            return { 
                status: 'stalemate', 
                reason: 'Pat ! Aucun coup possible, la partie est nulle.' 
            };
        }

        // 3. ÉCHEC SIMPLE
        if (isCheck) {
            return { 
                status: 'check', 
                reason: 'Le roi est en échec !' 
            };
        }

        // 4. VÉRIFICATION DES NULLES TECHNIQUES (Matériel insuffisant, etc.)
        if (typeof ChessNulleEngine !== 'undefined') {
            const nulleEngine = new ChessNulleEngine(fen);
            const drawCheck = nulleEngine.isDraw();
            if (drawCheck && drawCheck.isDraw) {
                return { status: 'draw', reason: drawCheck.reason };
            }
        }

        // 5. JEU EN COURS
        return { status: 'in_progress', reason: '' };
    }
}

// Initialisation
ChessStatusController.init();
window.ChessStatusController = ChessStatusController;