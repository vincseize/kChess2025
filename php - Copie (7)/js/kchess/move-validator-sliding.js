// move-validator-sliding.js - Validateur des pièces à déplacement linéaire
class SlidingMoveValidator {
    constructor(board) {
        this.board = board;
    }

    getSlidingMoves(piece, row, col, directions) {
        const moves = [];
        
        directions.forEach(([rowDir, colDir]) => {
            this.addSlidingMoves(moves, piece, row, col, rowDir, colDir);
        });

        return moves;
    }

    addSlidingMoves(moves, piece, startRow, startCol, rowDir, colDir) {
        let row = startRow + rowDir;
        let col = startCol + colDir;

        while (this.isValidSquare(row, col)) {
            const targetPiece = this.board.getPiece(row, col);
            
            if (!targetPiece) {
                moves.push({ row, col, type: 'move' });
            } else {
                if (targetPiece.color !== piece.color) {
                    moves.push({ row, col, type: 'capture' });
                }
                break;
            }
            
            row += rowDir;
            col += colDir;
        }
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

window.SlidingMoveValidator = SlidingMoveValidator;