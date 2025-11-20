// move-validator-core.js - Validation des mouvements légaux
class MoveValidator {
    constructor(board) {
        this.board = board;
        this.pieceValidators = {
            'pawn': new PawnMoveValidator(this.board),
            'knight': new KnightMoveValidator(this.board),
            'bishop': new BishopMoveValidator(this.board),
            'rook': new RookMoveValidator(this.board),
            'queen': new QueenMoveValidator(this.board),
            'king': new KingMoveValidator(this.board)
        };
    }

    getPossibleMoves(piece, fromRow, fromCol) {
        const validator = this.pieceValidators[piece.type];
        if (validator) {
            return validator.getPossibleMoves(piece, fromRow, fromCol);
        }
        return [];
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    isMoveValid(piece, fromRow, fromCol, toRow, toCol) {
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        return possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
    }
}

window.MoveValidator = MoveValidator;