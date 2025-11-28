// move-state-manager.js - Gestion de l'état des sélections
class MoveStateManager {
    constructor(game) {
        this.game = game;
    }

    handlePieceSelection(row, col, square) {
        if (square.piece && square.piece.color === this.game.gameState.currentPlayer) {
            this.clearSelection();
            square.element.classList.add('selected');
            this.setSelection(row, col, square.piece);
            
            DeviceLogger.log(`Pièce sélectionnée: ${square.piece.type} ${square.piece.color} en [${row},${col}]`);
            DeviceLogger.debug('Mouvements possibles', this.game.possibleMoves);
        }
    }

    setSelection(row, col, piece, possibleMoves = null) {
        this.game.selectedPiece = { row, col, piece };
        
        if (possibleMoves) {
            this.game.possibleMoves = possibleMoves;
        } else {
            this.game.possibleMoves = this.game.moveValidator.getPossibleMoves(piece, row, col);
        }
        
        this.highlightPossibleMoves();
    }

    isMovePossible(toRow, toCol) {
        return this.game.possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
    }

    handleInvalidMove(toRow, toCol, toSquare) {
        DeviceLogger.log('Mouvement non valide');
        
        if (this.shouldReselectOnInvalid(toSquare)) {
            DeviceLogger.log('Resélection automatique');
            this.handlePieceSelection(toRow, toCol, toSquare);
        } else {
            DeviceLogger.log('Désélection simple');
            this.clearSelection();
        }
    }

    shouldReselectOnInvalid(toSquare) {
        return DeviceLogger.isMobile() && 
               toSquare.piece && 
               toSquare.piece.color === this.game.gameState.currentPlayer;
    }

    highlightPossibleMoves() {
        // Réinitialiser tous les styles
        this.game.board.squares.forEach(square => {
            square.element.classList.remove(
                'selected', 
                'possible-move', 
                'possible-capture', 
                'possible-en-passant', 
                'possible-castle'
            );
        });
        
        // Appliquer les styles selon le type de mouvement
        this.game.possibleMoves.forEach(move => {
            const square = this.game.board.getSquare(move.row, move.col);
            if (square) {
                if (move.special === 'castle') {
                    square.element.classList.add('possible-castle');
                    DeviceLogger.log(`Case de roque highlightée: [${move.row},${move.col}]`);
                } else if (move.type === 'en-passant') {
                    square.element.classList.add('possible-en-passant');
                } else if (move.type === 'capture') {
                    square.element.classList.add('possible-capture');
                } else {
                    square.element.classList.add('possible-move');
                }
            }
        });
        
        DeviceLogger.log(`${this.game.possibleMoves.length} mouvements highlightés`);
    }

    clearSelection() {
        this.game.board.squares.forEach(square => {
            square.element.classList.remove(
                'selected', 
                'possible-move', 
                'possible-capture', 
                'possible-en-passant', 
                'possible-castle'
            );
        });
        this.game.selectedPiece = null;
        this.game.possibleMoves = [];
        
        DeviceLogger.log('Sélection effacée');
    }
}

window.MoveStateManager = MoveStateManager;