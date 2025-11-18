// chess-move-handler.js - Logique des déplacements
class ChessMoveHandler {
    constructor(gameState, board, moveValidator) {
        this.gameState = gameState;
        this.board = board;
        this.moveValidator = moveValidator;
    }

    handleSquareClick(displayRow, displayCol) {
        if (!this.gameState.gameActive) return;

        const { actualRow, actualCol } = this.board.getActualCoordinates(displayRow, displayCol);
        const square = this.board.getSquare(actualRow, actualCol);
        if (!square) return;

        if (this.board.selectedPiece) {
            this.handlePieceMovement(actualRow, actualCol, square);
        } else {
            this.handlePieceSelection(actualRow, actualCol, square);
        }
    }

    handlePieceSelection(row, col, square) {
        if (square.piece && square.piece.color === this.gameState.currentPlayer) {
            this.board.selectPiece(row, col, square.piece);
            this.board.possibleMoves = this.moveValidator.getPossibleMoves(square.piece, row, col);
            this.board.highlightPossibleMoves();
        }
    }

    handlePieceMovement(toRow, toCol, toSquare) {
        const isPossibleMove = this.board.possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );

        if (isPossibleMove) {
            this.executeMove(toRow, toCol);
        } else {
            this.board.clearSelection();
            this.handlePieceSelection(toRow, toCol, toSquare);
        }
    }

    executeMove(toRow, toCol) {
        const fromSquare = this.board.getSquare(this.board.selectedPiece.row, this.board.selectedPiece.col);
        const toSquare = this.board.getSquare(toRow, toCol);

        // Logique de déplacement...
        this.movePiece(fromSquare, toSquare);
        this.gameState.recordMove(
            this.board.selectedPiece.row, 
            this.board.selectedPiece.col, 
            toRow, 
            toCol,
            this.board.selectedPiece.piece
        );
        this.gameState.switchPlayer();
        this.board.clearSelection();
    }

    movePiece(fromSquare, toSquare) {
        // Logique physique du déplacement
    }
}

window.ChessMoveHandler = ChessMoveHandler;