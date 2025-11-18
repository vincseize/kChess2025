// move-validator-rook.js - Validateur des mouvements de tour
class RookMoveValidator extends SlidingMoveValidator {
    getPossibleMoves(piece, row, col) {
        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1]
        ];
        
        return this.getSlidingMoves(piece, row, col, directions);
    }
}

window.RookMoveValidator = RookMoveValidator;
