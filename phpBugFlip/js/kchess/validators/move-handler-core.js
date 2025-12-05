// move-handler-core.js - Cœur de la gestion des mouvements
class ChessGameMoveHandler {
    constructor(game) {
        this.game = game;
        this.isPromoting = false;
        
        // Initialiser les modules
        this.moveExecutor = new MoveExecutor(game);
        this.specialMovesHandler = new SpecialMovesHandler(game);
        this.moveStateManager = new MoveStateManager(game);
        this.validatorInterface = new ValidatorInterface(game);
    }

    // ========== MÉTHODES PRINCIPALES ==========

    handleSquareClick(displayRow, displayCol) {
        DeviceLogger.log(`Click sur [display:${displayRow},${displayCol}]`);
        
        if (!this.validateGameState()) return;
        
        const { actualRow, actualCol, square } = this.getActualSquare(displayRow, displayCol);
        if (!square) return;

        this.logCurrentState(square, actualRow, actualCol);

        if (this.game.selectedPiece) {
            this.handleMovementPhase(actualRow, actualCol, square);
        } else {
            this.handleSelectionPhase(actualRow, actualCol, square);
        }
    }

    executeDirectMove(fromRow, fromCol, toRow, toCol) {
        if (!this.game.gameState.gameActive || this.isPromoting) {
            DeviceLogger.log('Jeu non actif ou promotion en cours');
            return false;
        }
        
        const fromSquare = this.game.board.getSquare(fromRow, fromCol);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        
        if (!fromSquare || !toSquare || !fromSquare.piece) {
            DeviceLogger.log('Cases ou pièce non valides');
            return false;
        }
        
        const possibleMoves = this.validatorInterface.getPossibleMoves(fromSquare.piece, fromRow, fromCol);
        const isValidMove = possibleMoves.some(move => move.row === toRow && move.col === toCol);
        
        if (!isValidMove) {
            DeviceLogger.log('Mouvement non valide');
            return false;
        }
        
        DeviceLogger.log(`Mouvement direct valide: [${fromRow},${fromCol}] -> [${toRow},${toCol}]`);
        
        this.moveStateManager.setSelection(fromRow, fromCol, fromSquare.piece, possibleMoves);
        this.executeMove(toRow, toCol);
        return true;
    }

    // ========== MÉTHODES DE VALIDATION ==========

    validateGameState() {
        if (!this.game.gameState.gameActive) {
            DeviceLogger.log('Jeu non actif');
            return false;
        }
        
        if (this.isPromoting) {
            DeviceLogger.log('Promotion en cours');
            return false;
        }
        
        return true;
    }

    getActualSquare(displayRow, displayCol) {
        const { actualRow, actualCol } = this.game.board.getActualCoordinates(displayRow, displayCol);
        DeviceLogger.log(`Coordonnées: display[${displayRow},${displayCol}] -> actual[${actualRow},${actualCol}]`);
        
        const square = this.game.board.getSquare(actualRow, actualCol);
        if (!square) {
            DeviceLogger.error('Case non trouvée');
        }
        
        return { actualRow, actualCol, square };
    }

    // ========== DÉLÉGATION AUX MODULES ==========

    handleSelectionPhase(row, col, square) {
        DeviceLogger.log('Tentative de sélection...');
        this.moveStateManager.handlePieceSelection(row, col, square);
    }

    handleMovementPhase(row, col, square) {
        DeviceLogger.log('Tentative de mouvement...');
        
        if (!this.game.selectedPiece) {
            DeviceLogger.error('Aucune pièce sélectionnée');
            return;
        }

        const isPossibleMove = this.moveStateManager.isMovePossible(row, col);
        DeviceLogger.log(`Mouvement possible: ${isPossibleMove}`);

        if (isPossibleMove) {
            this.executeMove(row, col);
        } else {
            this.moveStateManager.handleInvalidMove(row, col, square);
        }
    }

    executeMove(toRow, toCol) {
        if (!this.validateMoveExecution()) return;
        
        const moveData = this.moveExecutor.prepareMoveExecution(toRow, toCol);
        if (!moveData) return;

        const { selectedPiece, fromSquare, toSquare, move } = moveData;

        DeviceLogger.log(`Exécution mouvement`, move);

        // Délégation aux handlers spécialisés
        if (this.specialMovesHandler.handleSpecialMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol)) {
            return;
        }

        // Mouvement normal
        this.moveExecutor.executeNormalMove(fromSquare, toSquare, selectedPiece, move, toRow, toCol);
    }

    validateMoveExecution() {
        if (this.isPromoting || !this.game.selectedPiece) {
            DeviceLogger.log(`Bloqué: promoting=${this.isPromoting}, selected=${!!this.game.selectedPiece}`);
            return false;
        }
        return true;
    }

    // ========== MÉTHODES DE LOG ==========

    logCurrentState(square, row, col) {
        DeviceLogger.debug('État actuel', {
            selectedPiece: this.game.selectedPiece ? 
                `${this.game.selectedPiece.piece.color} ${this.game.selectedPiece.piece.type}` : 'aucune',
            currentPlayer: this.game.gameState.currentPlayer,
            pieceOnSquare: square.piece ? `${square.piece.color} ${square.piece.type}` : 'vide',
            isPromoting: this.isPromoting,
            coordinates: `[${row},${col}]`
        });
    }

    // ========== ACCÈS AUX MÉTHODES DES MODULES ==========

    clearSelection() {
        this.moveStateManager.clearSelection();
    }

    highlightPossibleMoves() {
        this.moveStateManager.highlightPossibleMoves();
    }

    updateGameStateForMove(piece, fromRow, fromCol, toRow, toCol) {
        this.moveExecutor.updateGameStateForMove(piece, fromRow, fromCol, toRow, toCol);
    }
}

window.ChessGameMoveHandler = ChessGameMoveHandler;