// core/move-logic.js - VERSION OPTIMISÉE (LOGS ET GESTION D'ÉTAT)
class MoveLogic {
    
    static VERSION = '1.2.0';
    static consoleLog = true;
    
    /**
     * Initialisation statique de la configuration
     */
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log(`♟️ MoveLogic v${this.VERSION} chargé (${this.getConfigSource()})`);
        }
    }
    
    static loadConfig() {
        try {
            // Priorité 1: window.appConfig.debug.console_log
            // Priorité 2: window.getConfig utilitaire
            const rawValue = window.appConfig?.debug?.console_log ?? 
                             (typeof window.getConfig === 'function' ? window.getConfig('debug.console_log') : true);
            
            // Conversion robuste en Boolean (gère les strings "false" du JSON)
            this.consoleLog = rawValue === "false" ? false : Boolean(rawValue);
            return true;
        } catch (error) {
            console.error('❌ MoveLogic Config Error:', error);
            this.consoleLog = true; // Fallback sécurisé
            return false;
        }
    }

    static getConfigSource() {
        if (window.appConfig?.debug?.console_log !== undefined) return 'JSON Config';
        if (typeof window.getConfig === 'function') return 'App Helper';
        return 'Default Value';
    }

    constructor(chessGame) {
        this.chessGame = chessGame;
        // On s'assure que la config est fraîche à l'instanciation
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log('♟️ [MoveLogic] Instance créée pour ChessGame');
        }
    }

    /**
     * EXÉCUTION DU MOUVEMENT
     */
    movePiece(fromSquare, toSquare, promotionType = null) {
        const fromPiece = fromSquare.piece;
        const toPiece = toSquare.piece;

        if (!fromPiece) {
            if (this.constructor.consoleLog) console.error('❌ [MoveLogic] Tentative de déplacement sans pièce');
            return false;
        }

        if (this.constructor.consoleLog) this.logMoveStart(fromSquare, toSquare, fromPiece, toPiece);

        // 1. Sauvegarde de l'état (FEN) avant modification
        const previousFEN = this.getFEN();

        // 2. Action sur le plateau (DOM + Data)
        this.chessGame.board.movePiece(fromSquare, toSquare);

        // 3. Gestion de la promotion
        if (promotionType && this.chessGame.promotionManager) {
            this.chessGame.promotionManager.promotePawn(toSquare, promotionType);
        }

        // 4. Mise à jour des compteurs (50 coups)
        this.updateHalfMoveClock(fromPiece, toPiece);

        // 5. Enregistrement dans l'historique
        this.recordMove(fromSquare, toSquare, fromPiece, toPiece, previousFEN);

        // 6. Changement de tour
        this.switchTurn();

        // 7. Nettoyage et vérification du statut global
        this.chessGame.clearSelection();
        
        if (this.chessGame.gameStatusManager) {
            this.chessGame.gameStatusManager.updateGameStatus();
        }

        if (this.constructor.consoleLog) console.log('✅ [MoveLogic] Mouvement finalisé\n');
        return true;
    }

    /**
     * GESTION DE L'HORLOGE DES 50 COUPS (Half-move clock)
     */
    updateHalfMoveClock(fromPiece, toPiece) {
        // Règle : remise à zéro si capture ou mouvement de pion
        const isCapture = !!toPiece;
        const isPawnMove = fromPiece.type === 'pawn';
        
        if (isCapture || isPawnMove) {
            this.chessGame.gameState.halfMoveClock = 0;
            if (this.constructor.consoleLog) console.log('🕒 [MoveLogic] Horloge réinitialisée (capture ou pion)');
        } else {
            this.chessGame.gameState.halfMoveClock++;
            if (this.constructor.consoleLog) console.log(`🕒 [MoveLogic] Horloge: ${this.chessGame.gameState.halfMoveClock}`);
        }
    }

    switchTurn() {
        const oldTurn = this.chessGame.gameState.currentTurn;
        this.chessGame.gameState.currentTurn = (oldTurn === 'white') ? 'black' : 'white';
        if (this.constructor.consoleLog) console.log(`🔄 [MoveLogic] Tour: ${oldTurn} → ${this.chessGame.gameState.currentTurn}`);
    }

    recordMove(fromSquare, toSquare, piece, captured, fen) {
        const moveData = {
            from: { row: fromSquare.row, col: fromSquare.col },
            to: { row: toSquare.row, col: toSquare.col },
            piece: piece.type,
            color: piece.color,
            captured: captured ? captured.type : null,
            fen: fen,
            timestamp: Date.now()
        };
        this.chessGame.gameState.moveHistory.push(moveData);
    }

    getFEN() {
        return window.FENGenerator ? 
            window.FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board) : 
            'FEN_NOT_AVAILABLE';
    }

    // --- DIAGNOSTICS ET LOGS ---

    logMoveStart(from, to, piece, target) {
        console.group(`♟️ MOUVEMENT : ${piece.type} (${piece.color})`);
        console.log(`De: [${from.row},${from.col}] Vers: [${to.row},${to.col}]`);
        if (target) console.log(`Capture: ${target.type} (${target.color})`);
        console.groupEnd();
    }
}

// Initialisation immédiate
MoveLogic.init();

// Exposition globale
window.MoveLogic = MoveLogic;

/**
 * UTILS : Fonctions de dépannage en console
 */
window.MoveDebug = {
    toggle: () => {
        MoveLogic.consoleLog = !MoveLogic.consoleLog;
        console.log(`Logs MoveLogic: ${MoveLogic.consoleLog ? 'ACTIVÉS' : 'DÉSACTIVÉS'}`);
    },
    showHistory: () => {
        if (window.chessGame) {
            console.table(window.chessGame.gameState.moveHistory);
        }
    }
};