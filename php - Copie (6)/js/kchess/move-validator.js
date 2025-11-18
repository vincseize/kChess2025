// move-validator.js - Validation des mouvements légaux avec prise en passant
class MoveValidator {
    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
        this.enPassantTarget = null; // Stocke la case cible pour la prise en passant
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

    // Dans move-validator.js, modifiez getPawnMoves :
getPawnMoves(piece, row, col) {
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

    // PRISE EN PASSANT (avec promotion possible)
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


    // Vérifier si la prise en passant est possible
    isEnPassantPossible(pawnRow, pawnCol, attackerColor) {
        // La prise en passant n'est possible que si le dernier mouvement était un double push de pion
        const lastMove = this.gameState.moveHistory[this.gameState.moveHistory.length - 1];
        
        if (!lastMove) return false;

        // Vérifier si le dernier mouvement était un double push de pion
        const isDoublePush = Math.abs(lastMove.from.row - lastMove.to.row) === 2;
        const isPawnMove = lastMove.piece === 'pawn';
        const isAdjacentPawn = lastMove.to.row === pawnRow && lastMove.to.col === pawnCol;
        const isOpponentColor = lastMove.color !== attackerColor;
        
        return isDoublePush && isPawnMove && isAdjacentPawn && isOpponentColor;
    }

    // Mettre à jour la cible de prise en passant après un mouvement
    updateEnPassantTarget(move, piece) {
        if (piece.type === 'pawn' && move.isDoublePush) {
            // La cible en passant est la case derrière le pion qui a fait le double push
            const direction = piece.color === 'white' ? -1 : 1;
            this.enPassantTarget = {
                row: move.to.row + direction,
                col: move.to.col
            };
            console.log(`🎯 Cible en passant définie: [${this.enPassantTarget.row},${this.enPassantTarget.col}]`);
        } else {
            this.enPassantTarget = null;
        }
    }

    // Exécuter une prise en passant
    executeEnPassant(move) {
        if (move.type === 'en-passant' && move.capturedPawn) {
            // Capturer le pion adverse
            const capturedSquare = this.board.getSquare(move.capturedPawn.row, move.capturedPawn.col);
            if (capturedSquare && capturedSquare.piece) {
                console.log(`🎯 Prise en passant exécutée sur [${move.capturedPawn.row},${move.capturedPawn.col}]`);
                capturedSquare.piece = null;
                capturedSquare.element.innerHTML = '';
            }
        }
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