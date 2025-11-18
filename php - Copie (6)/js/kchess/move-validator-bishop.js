// move-validator-bishop.js - Validateur des mouvements de fou
class BishopMoveValidator extends SlidingMoveValidator {
    getPossibleMoves(piece, row, col) {
        const directions = [
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
        
        return this.getSlidingMoves(piece, row, col, directions);
    }
}

window.BishopMoveValidator = BishopMoveValidator;