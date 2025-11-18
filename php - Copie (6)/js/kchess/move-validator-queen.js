// move-validator-queen.js - Validateur des mouvements de dame
class QueenMoveValidator extends SlidingMoveValidator {
    getPossibleMoves(piece, row, col) {
        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
        
        return this.getSlidingMoves(piece, row, col, directions);
    }
}

window.QueenMoveValidator = QueenMoveValidator;