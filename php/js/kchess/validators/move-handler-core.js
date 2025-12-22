// validators/move-handler-core.js
if (typeof ChessGameMoveHandler !== 'undefined') {
    console.warn('⚠️ ChessGameMoveHandler existe déjà.');
} else {

class ChessGameMoveHandler {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('🎮 ChessGameMoveHandler: Système de contrôle prêt');
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine) {
                this.consoleLog = window.appConfig.chess_engine.console_log ?? true;
            }
        } catch (e) { this.consoleLog = true; }
    }

    constructor(game) {
        this.game = game;
        this.isPromoting = false; // Bloque les clics pendant le choix de la pièce
        
        // Modules délégués
        this.moveExecutor = new MoveExecutor(game);
        
        // Modules optionnels avec fallback
        this.moveStateManager = (typeof MoveStateManager !== 'undefined') ? new MoveStateManager(game) : null;
        this.validatorInterface = (typeof ValidatorInterface !== 'undefined') ? new ValidatorInterface(game) : null;

        if (this.constructor.consoleLog) {
            console.log('🔧 MoveHandler initialisé (Modules: Executor, State, Interface)');
        }
    }

    // ========== GESTION DES CLICS ==========

    handleSquareClick(displayRow, displayCol) {
        if (!this.validateGameState()) return;
        
        const { actualRow, actualCol, square } = this.getActualSquare(displayRow, displayCol);
        if (!square) return;

        if (this.constructor.consoleLog) {
            console.group(`🎯 Clic sur [${actualRow}, ${actualCol}]`);
        }

        if (this.game.selectedPiece) {
            this.handleMovementPhase(actualRow, actualCol, square);
        } else {
            this.handleSelectionPhase(actualRow, actualCol, square);
        }

        if (this.constructor.consoleLog) console.groupEnd();
    }

    handleSelectionPhase(row, col, square) {
        const piece = square.piece;
        
        // On ne peut sélectionner que ses propres pièces
        if (piece && piece.color === this.game.gameState.currentPlayer) {
            if (this.constructor.consoleLog) console.log(`✅ Sélection : ${piece.type}`);
            
            // On délègue au state manager le stockage et l'affichage des points de mouvement
            if (this.moveStateManager) {
                this.moveStateManager.handlePieceSelection(row, col, square);
            }
        } else {
            if (this.constructor.consoleLog) console.log("🚫 Case vide ou pièce adverse");
        }
    }

    handleMovementPhase(row, col, square) {
        const { selectedPiece } = this.game;

        // 1. Désélection si clic sur la même case
        if (selectedPiece.row === row && selectedPiece.col === col) {
            this.clearSelection();
            return;
        }

        // 2. Changement de pièce (clic sur une autre pièce alliée)
        if (square.piece && square.piece.color === this.game.gameState.currentPlayer) {
            this.handleSelectionPhase(row, col, square);
            return;
        }

        // 3. Vérification de la légalité du coup
        // On vérifie dans la liste des mouvements possibles pré-calculés
        const isPossible = this.game.possibleMoves?.some(m => m.row === row && m.col === col);
        
        if (isPossible) {
            this.executeMove(row, col);
        } else {
            if (this.constructor.consoleLog) console.log("❌ Coup illégal ou non autorisé");
            this.clearSelection();
        }
    }

    // ========== EXÉCUTION ==========

    executeMove(toRow, toCol) {
        // Le MoveExecutor prépare les données (fromSquare, toSquare, type de coup)
        const moveData = this.moveExecutor.prepareMoveExecution(toRow, toCol);
        if (!moveData) return;

        const { fromSquare, toSquare, selectedPiece, move } = moveData;

        // Le MoveExecutor gère maintenant l'aiguillage entre :
        // - Coup normal
        // - Capture
        // - Roque
        // - En passant
        // - Promotion
        this.moveExecutor.executeNormalMove(fromSquare, toSquare, selectedPiece, move, toRow, toCol);
    }

    // ========== UTILITAIRES ==========

    validateGameState() {
        // Empêche de jouer si mat, pat ou promotion en cours
        if (!this.game.gameState.gameActive) return false;
        if (this.isPromoting) return false;
        return true;
    }

    getActualSquare(displayRow, displayCol) {
        // Gère l'inversion du plateau (vue noire vs vue blanche)
        const coords = this.game.board.getActualCoordinates(displayRow, displayCol);
        const square = this.game.board.getSquare(coords.actualRow, coords.actualCol);
        return { ...coords, square };
    }

    clearSelection() {
        if (this.constructor.consoleLog) console.log("🧹 Clear");
        this.game.clearSelection(); // Nettoyage visuel (points bleus, etc.)
        if (this.moveStateManager) {
            this.moveStateManager.clearSelection(); // Nettoyage logique
        }
    }
}

ChessGameMoveHandler.init();
window.ChessGameMoveHandler = ChessGameMoveHandler;

}