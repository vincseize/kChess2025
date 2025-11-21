// move-validator-queen.js - Validateur des mouvements de reine
class QueenMoveValidator {
    constructor(board) {
        this.board = board;
    }

    getPossibleMoves(piece, row, col) {
        // La reine combine les mouvements du fou et de la tour
        const bishopValidator = new BishopMoveValidator(this.board);
        const rookValidator = new RookMoveValidator(this.board);
        
        return [
            ...bishopValidator.getPossibleMoves(piece, row, col),
            ...rookValidator.getPossibleMoves(piece, row, col)
        ];
    }
}

window.QueenMoveValidator = QueenMoveValidator;