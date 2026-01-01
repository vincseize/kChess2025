// validators/move-handler-core.js
if (typeof ChessGameMoveHandler !== 'undefined') {
    console.warn('⚠️ ChessGameMoveHandler existe déjà.');
} else {

class ChessGameMoveHandler {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('🎮 ChessGameMoveHandler: Système prêt');
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
        this.isPromoting = false; 
        
        // Initialisation de l'exécuteur
        this.moveExecutor = new MoveExecutor(game);
        
        // Modules optionnels
        this.moveStateManager = (typeof MoveStateManager !== 'undefined') ? new MoveStateManager(game) : null;
    }

    // ========== GESTION DES CLICS ==========

    /**
     * @param {number} displayRow 
     * @param {number} displayCol 
     * @param {boolean} isDirect - true si coordonnée logique (Bot), false si coordonnée visuelle (Humain)
     */
    handleSquareClick(displayRow, displayCol, isDirect = false) {
        if (!this.validateGameState()) return;
        
        // On récupère les coordonnées réelles en tenant compte du paramètre isDirect
        const { actualRow, actualCol, square } = this.getActualSquare(displayRow, displayCol, isDirect);
        
        if (!square) return;

        if (this.constructor.consoleLog) {
            console.group(`🎯 Clic [${actualRow}, ${actualCol}] (Origine: ${isDirect ? 'IA' : 'Humain'})`);
        }

        const selectedPiece = this.game.selectedPiece;

        // Logique à deux états :
        if (selectedPiece) {
            // État 2 : Une pièce est déjà sélectionnée, on tente un mouvement ou une autre sélection
            this.handleMovementPhase(actualRow, actualCol, square);
        } else {
            // État 1 : Rien n'est sélectionné, on cherche une pièce alliée
            this.handleSelectionPhase(actualRow, actualCol, square);
        }

        if (this.constructor.consoleLog) console.groupEnd();
    }

    handleSelectionPhase(row, col, square) {
        const piece = square.piece;
        const currentPlayer = this.game.gameState.currentPlayer;
        
        // Sécurité : Vérifier que c'est bien une pièce de la couleur du tour
        if (piece && piece.color === currentPlayer) {
            if (this.constructor.consoleLog) console.log(`✅ Sélection : ${piece.color} ${piece.type}`);
            
            if (this.moveStateManager) {
                this.moveStateManager.handlePieceSelection(row, col, square);
            }
        } else {
            if (this.constructor.consoleLog) console.log("🚫 Case vide ou pièce adverse");
            this.clearSelection();
        }
    }

    handleMovementPhase(row, col, square) {
        const selectedPiece = this.game.selectedPiece;

        // 1. Désélection si clic sur la même case
        if (selectedPiece.row === row && selectedPiece.col === col) {
            this.clearSelection();
            return;
        }

        // 2. Changement de sélection (clic sur une autre pièce de la même couleur)
        if (square.piece && square.piece.color === this.game.gameState.currentPlayer) {
            if (this.constructor.consoleLog) console.log("🔄 Changement de pièce sélectionnée");
            this.handleSelectionPhase(row, col, square);
            return;
        }

        // 3. Tentative de mouvement
        // On vérifie si les coordonnées (row, col) sont présentes dans les coups possibles
        const isPossible = this.game.possibleMoves?.some(m => m.row === row && m.col === col);
        
        if (isPossible) {
            this.executeMove(row, col);
        } else {
            if (this.constructor.consoleLog) console.log("❌ Mouvement non autorisé");
            this.clearSelection();
        }
    }

    // ========== EXÉCUTION ==========

    executeMove(toRow, toCol) {
        const moveData = this.moveExecutor.prepareMoveExecution(toRow, toCol);
        
        if (moveData) {
            this.isPromoting = true; 

            try {
                this.moveExecutor.executeNormalMove(
                    moveData.fromSquare, 
                    moveData.toSquare, 
                    moveData.selectedPiece, 
                    moveData.move, 
                    toRow, 
                    toCol
                );
            } finally {
                if (!moveData.move?.isPromotion) {
                    this.isPromoting = false;
                }
            }
        }
    }

    // ========== UTILITAIRES ==========

    validateGameState() {
        if (!this.game.gameState?.gameActive) return false;
        if (this.isPromoting) {
            if (this.constructor.consoleLog) console.warn("⏳ Action bloquée : Promotion en cours");
            return false;
        }
        return true;
    }

    /**
     * Calcule les coordonnées réelles en fonction du Flip
     * @param {number} displayRow
     * @param {number} displayCol
     * @param {boolean} isDirect - Si true, on ignore l'inversion car le bot donne déjà la bonne coordonnée
     */
    getActualSquare(displayRow, displayCol, isDirect = false) {
        let actualRow = displayRow;
        let actualCol = displayCol;

        // Si c'est un humain (!isDirect) et que le plateau est inversé, on transforme
        if (!isDirect && this.game.gameState.boardFlipped) {
            actualRow = 7 - displayRow;
            actualCol = 7 - displayCol;
            if (this.constructor.consoleLog) {
                console.log(`🔄 Conversion Vue -> Logique: [${displayRow},${displayCol}] vers [${actualRow},${actualCol}]`);
            }
        }

        const square = this.game.board.getSquare(actualRow, actualCol);
        return { actualRow, actualCol, square };
    }

    clearSelection() {
        this.game.clearSelection?.(); 
        if (this.moveStateManager?.clearSelection) {
            this.moveStateManager.clearSelection();
        }
    }
}

ChessGameMoveHandler.init();
window.ChessGameMoveHandler = ChessGameMoveHandler;

}