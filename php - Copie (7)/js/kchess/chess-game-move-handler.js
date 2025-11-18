// chess-game-move-handler.js - Gestion des mouvements et sélections
class ChessGameMoveHandler {
    constructor(game) {
        this.game = game;
    }

    handleSquareClick(displayRow, displayCol) {
        if (!this.game.gameState.gameActive) return;
        
        const { actualRow, actualCol } = this.game.board.getActualCoordinates(displayRow, displayCol);
        const square = this.game.board.getSquare(actualRow, actualCol);
        if (!square) return;

        if (this.game.selectedPiece) {
            this.handlePieceMovement(actualRow, actualCol, square);
        } else {
            this.handlePieceSelection(actualRow, actualCol, square);
        }
    }

    handlePieceSelection(row, col, square) {
        if (square.piece && square.piece.color === this.game.gameState.currentPlayer) {
            this.game.clearSelection();
            square.element.classList.add('selected');
            this.game.selectedPiece = { row, col, piece: square.piece };
            this.game.possibleMoves = this.game.moveValidator.getPossibleMoves(square.piece, row, col);
            this.game.highlightPossibleMoves();
        }
    }

    handlePieceMovement(toRow, toCol, toSquare) {
        const isPossibleMove = this.game.possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );

        if (isPossibleMove) {
            this.executeMove(toRow, toCol);
        } else {
            this.game.clearSelection();
            this.handlePieceSelection(toRow, toCol, toSquare);
        }
    }

    executeMove(toRow, toCol) {
        const fromSquare = this.game.board.getSquare(this.game.selectedPiece.row, this.game.selectedPiece.col);
        const toSquare = this.game.board.getSquare(toRow, toCol);

        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        
        // Trouver le mouvement exact
        const move = this.game.possibleMoves.find(m => m.row === toRow && m.col === toCol);
        
        // Vérifier si c'est une prise en passant
        if (move && move.type === 'en-passant') {
            console.log('🎯 Exécution d\'une prise en passant');
            this.game.moveValidator.executeEnPassant(move);
        }

        // Déplacer la pièce
        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(pieceElement);
        toSquare.piece = this.game.selectedPiece.piece;
        fromSquare.piece = null;

        // VÉRIFIER LA PROMOTION
        if (move && this.game.promotionManager.checkPromotion(move, this.game.selectedPiece.piece)) {
            // La promotion gère elle-même la suite
            return; // On arrête ici, la promotion continuera
        }

        // Mettre à jour la cible de prise en passant
        if (move) {
            this.game.moveValidator.updateEnPassantTarget(
                { 
                    from: { row: this.game.selectedPiece.row, col: this.game.selectedPiece.col },
                    to: { row: toRow, col: toCol },
                    isDoublePush: move.isDoublePush
                },
                this.game.selectedPiece.piece
            );
        }

        this.game.gameState.recordMove(
            this.game.selectedPiece.row, 
            this.game.selectedPiece.col, 
            toRow, 
            toCol,
            this.game.selectedPiece.piece
        );

        this.game.gameState.switchPlayer();
        this.game.clearSelection();
        this.game.updateUI();
    }

    highlightPossibleMoves() {
        this.game.board.squares.forEach(square => {
            square.element.classList.remove('possible-move', 'possible-capture', 'possible-en-passant');
        });
        
        this.game.possibleMoves.forEach(move => {
            const square = this.game.board.getSquare(move.row, move.col);
            if (square) {
                if (move.type === 'en-passant') {
                    square.element.classList.add('possible-en-passant');
                } else if (move.type === 'capture') {
                    square.element.classList.add('possible-capture');
                } else {
                    square.element.classList.add('possible-move');
                }
            }
        });
    }

    clearSelection() {
        this.game.board.squares.forEach(square => {
            square.element.classList.remove('selected', 'possible-move', 'possible-capture', 'possible-en-passant');
        });
        this.game.selectedPiece = null;
        this.game.possibleMoves = [];
    }
}

window.ChessGameMoveHandler = ChessGameMoveHandler;