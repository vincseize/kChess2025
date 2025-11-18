// move-validator-pawn.js - Validateur des mouvements de pion
class PawnMoveValidator {
    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
    }

    getPossibleMoves(piece, row, col) {
        const moves = [];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        const enPassantRow = piece.color === 'white' ? 3 : 4;
        const promotionRow = piece.color === 'white' ? 0 : 7;

        // Mouvement vers l'avant
        if (this.isValidSquare(row + direction, col) && !this.board.getPiece(row + direction, col)) {
            const isPromotion = (row + direction) === promotionRow;
            
            moves.push({ 
                row: row + direction, 
                col: col, 
                type: 'move',
                isPromotion: isPromotion
            });
            
            // Double mouvement depuis la position initiale
            if (row === startRow && !this.board.getPiece(row + 2 * direction, col)) {
                moves.push({ 
                    row: row + 2 * direction, 
                    col: col, 
                    type: 'move',
                    isDoublePush: true
                });
            }
        }

        // Prises en diagonale normales
        [-1, 1].forEach(offset => {
            const targetRow = row + direction;
            const targetCol = col + offset;
            
            if (this.isValidSquare(targetRow, targetCol)) {
                const targetPiece = this.board.getPiece(targetRow, targetCol);
                if (targetPiece && targetPiece.color !== piece.color) {
                    const isPromotion = targetRow === promotionRow;
                    
                    moves.push({ 
                        row: targetRow, 
                        col: targetCol, 
                        type: 'capture',
                        isPromotion: isPromotion
                    });
                }
            }
        });

        // Prise en passant
        if (row === enPassantRow) {
            [-1, 1].forEach(offset => {
                const targetCol = col + offset;
                const targetRow = row + direction;
                const isPromotion = targetRow === promotionRow;
                
                if (this.isValidSquare(row, targetCol)) {
                    const adjacentPiece = this.board.getPiece(row, targetCol);
                    
                    if (adjacentPiece && 
                        adjacentPiece.type === 'pawn' && 
                        adjacentPiece.color !== piece.color &&
                        this.isEnPassantPossible(row, targetCol, piece.color)) {
                        
                        moves.push({
                            row: targetRow,
                            col: targetCol,
                            type: 'en-passant',
                            capturedPawn: { row: row, col: targetCol },
                            isPromotion: isPromotion
                        });
                    }
                }
            });
        }

        return moves;
    }

    isEnPassantPossible(pawnRow, pawnCol, attackerColor) {
        const lastMove = this.gameState.moveHistory[this.gameState.moveHistory.length - 1];
        
        if (!lastMove) return false;

        const isDoublePush = Math.abs(lastMove.from.row - lastMove.to.row) === 2;
        const isPawnMove = lastMove.piece === 'pawn';
        const isAdjacentPawn = lastMove.to.row === pawnRow && lastMove.to.col === pawnCol;
        const isOpponentColor = lastMove.color !== attackerColor;
        
        return isDoublePush && isPawnMove && isAdjacentPawn && isOpponentColor;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

window.PawnMoveValidator = PawnMoveValidator;