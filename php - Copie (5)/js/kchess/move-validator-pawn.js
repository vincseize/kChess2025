// move-validator-pawn.js - Validateur des mouvements de pion
class PawnMoveValidator {
    constructor(board) {
        this.board = board;
    }

    getPossibleMoves(piece, row, col) {
        const moves = [];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;

        // Mouvement vers l'avant
        if (this.isValidSquare(row + direction, col) && !this.board.getPiece(row + direction, col)) {
            moves.push({ row: row + direction, col: col, type: 'move' });
            
            // Double mouvement depuis la position initiale
            if (row === startRow && !this.board.getPiece(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col: col, type: 'move' });
            }
        }

        // Prises en diagonale
        [-1, 1].forEach(offset => {
            const targetRow = row + direction;
            const targetCol = col + offset;
            
            if (this.isValidSquare(targetRow, targetCol)) {
                const targetPiece = this.board.getPiece(targetRow, targetCol);
                if (targetPiece && targetPiece.color !== piece.color) {
                    moves.push({ 
                        row: targetRow, 
                        col: targetCol, 
                        type: 'capture' 
                    });
                }
            }
        });

        return moves;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

window.PawnMoveValidator = PawnMoveValidator;