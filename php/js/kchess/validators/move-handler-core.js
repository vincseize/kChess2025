/**
 * validators/move-handler-core.js - Version 1.5.0
 * Correction : Gestion robuste du verrou isPromoting pour éviter le blocage du Bot.
 */
if (typeof ChessGameMoveHandler !== 'undefined') {
    console.warn('⚠️ ChessGameMoveHandler existe déjà.');
} else {

class ChessGameMoveHandler {
    
    static consoleLog = false; 
    
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
        
        // Initialisation de l'exécuteur de mouvement
        this.moveExecutor = new MoveExecutor(game);
        
        // Liaison avec le gestionnaire d'états visuels (Highlights)
        this.moveStateManager = (typeof MoveStateManager !== 'undefined') ? new MoveStateManager(game) : null;
    }

    // ========== GESTION DES CLICS ==========

    handleSquareClick(displayRow, displayCol, isDirect = false) {
        // Validation d'état avec nettoyage automatique si nécessaire
        if (!this.validateGameState()) return;
        
        const { actualRow, actualCol, square } = this.getActualSquare(displayRow, displayCol, isDirect);
        if (!square) return;

        if (this.constructor.consoleLog) {
            console.group(`🎯 Clic [${actualRow}, ${actualCol}] (Origine: ${isDirect ? 'IA' : 'Humain'})`);
        }

        const selectedPiece = this.game.selectedPiece;

        if (selectedPiece) {
            this.handleMovementPhase(actualRow, actualCol, square);
        } else {
            this.handleSelectionPhase(actualRow, actualCol, square);
        }

        if (this.constructor.consoleLog) console.groupEnd();
    }

    handleSelectionPhase(row, col, square) {
        const piece = square.piece;
        const currentPlayer = this.game.gameState.currentPlayer;
        
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

        if (selectedPiece.row === row && selectedPiece.col === col) {
            this.clearSelection();
            return;
        }

        if (square.piece && square.piece.color === this.game.gameState.currentPlayer) {
            this.handleSelectionPhase(row, col, square);
            return;
        }

        const isPossible = this.game.possibleMoves?.some(m => m.row === row && m.col === col);
        
        if (isPossible) {
            const fromRow = selectedPiece.row;
            const fromCol = selectedPiece.col;
            
            this.executeMove(row, col);

            if (this.moveStateManager) {
                this.moveStateManager.highlightLastMove(fromRow, fromCol, row, col);
            }
        } else {
            if (this.constructor.consoleLog) console.log("❌ Mouvement non autorisé");
            this.clearSelection();
        }
    }

    // ========== EXÉCUTION ==========

    executeMove(toRow, toCol) {
        const moveData = this.moveExecutor.prepareMoveExecution(toRow, toCol);
        
        if (moveData) {
            // On lève le drapeau de promotion si le coup le demande
            if (moveData.move?.isPromotion) {
                this.isPromoting = true; 
            }

            try {
                this.moveExecutor.executeNormalMove(
                    moveData.fromSquare, 
                    moveData.toSquare, 
                    moveData.selectedPiece, 
                    moveData.move, 
                    toRow, 
                    toCol
                );
            } catch (error) {
                console.error("Erreur lors de l'exécution du mouvement:", error);
                this.isPromoting = false; // Reset en cas de crash
            }
            
            // Note : Si moveData.move.isPromotion est vrai, isPromoting RESTE à true.
            // Il devra être repassé à false par le PromotionManager via completeTurn() ou finalizePromotion().
        }
    }

    // ========== UTILITAIRES ==========

    /**
     * Valide l'état du jeu et vérifie si le verrou de promotion est légitime
     */
    validateGameState() {
        if (!this.game.gameState?.gameActive) return false;

        if (this.isPromoting) {
            // SÉCURITÉ : Si on est en "promotion" mais qu'aucune fenêtre de promotion n'est ouverte
            // ou si le PromotionManager n'existe pas, on débloque de force.
            const isModalOpen = document.querySelector('.promotion-modal, #promotion-overlay'); 
            if (!isModalOpen && !this.game.promotionManager) {
                console.warn("⚠️ Correction automatique : Verrou promotion levé (Manager ou UI absent)");
                this.isPromoting = false;
                return true;
            }

            if (this.constructor.consoleLog) console.warn("⏳ Promotion en cours...");
            return false;
        }
        return true;
    }

    getActualSquare(displayRow, displayCol, isDirect = false) {
        let actualRow = displayRow;
        let actualCol = displayCol;

        if (!isDirect && this.game.gameState.boardFlipped) {
            actualRow = 7 - displayRow;
            actualCol = 7 - displayCol;
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