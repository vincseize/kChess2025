// move-validator.js - Validation des mouvements légaux
class MoveValidator {
    constructor(board) {
        this.board = board;
    }

    getPossibleMoves(piece, fromRow, fromCol) {
        const moves = [];
        
        switch (piece.type) {
            case 'pawn':
                return this.getPawnMoves(piece, fromRow, fromCol);
            case 'knight':
                return this.getKnightMoves(piece, fromRow, fromCol);
            case 'bishop':
                return this.getBishopMoves(piece, fromRow, fromCol);
            case 'rook':
                return this.getRookMoves(piece, fromRow, fromCol);
            case 'queen':
                return this.getQueenMoves(piece, fromRow, fromCol);
            case 'king':
                return this.getKingMoves(piece, fromRow, fromCol);
            default:
                return moves;
        }
    }

    getPawnMoves(piece, row, col) {
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

    getKnightMoves(piece, row, col) {
        const moves = [];
        const knightMoves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];

        knightMoves.forEach(([rowOffset, colOffset]) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                if (!targetPiece || targetPiece.color !== piece.color) {
                    moves.push({ 
                        row: newRow, 
                        col: newCol, 
                        type: targetPiece ? 'capture' : 'move' 
                    });
                }
            }
        });

        return moves;
    }

    getBishopMoves(piece, row, col) {
        const moves = [];
        const directions = [
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];

        directions.forEach(([rowDir, colDir]) => {
            this.addSlidingMoves(moves, piece, row, col, rowDir, colDir);
        });

        return moves;
    }

    getRookMoves(piece, row, col) {
        const moves = [];
        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1]
        ];

        directions.forEach(([rowDir, colDir]) => {
            this.addSlidingMoves(moves, piece, row, col, rowDir, colDir);
        });

        return moves;
    }

    getQueenMoves(piece, row, col) {
        return [
            ...this.getBishopMoves(piece, row, col),
            ...this.getRookMoves(piece, row, col)
        ];
    }

    getKingMoves(piece, row, col) {
        const moves = [];
        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];

        directions.forEach(([rowDir, colDir]) => {
            const newRow = row + rowDir;
            const newCol = col + colDir;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                if (!targetPiece || targetPiece.color !== piece.color) {
                    moves.push({ 
                        row: newRow, 
                        col: newCol, 
                        type: targetPiece ? 'capture' : 'move' 
                    });
                }
            }
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

    isMoveValid(piece, fromRow, fromCol, toRow, toCol) {
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        return possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
    }
}

window.MoveValidator = MoveValidator;