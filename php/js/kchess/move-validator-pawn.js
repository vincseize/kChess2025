// move-validator-pawn.js - Validateur des mouvements de pion CORRIGÉ
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

        const pieceColor = piece.color;

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
                if (targetPiece && targetPiece.color !== pieceColor) {
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
                        adjacentPiece.color !== pieceColor &&
                        this.isEnPassantPossible(row, targetCol, pieceColor)) {
                        
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

        // Filtrer les mouvements qui mettraient le roi en échec
        const validMoves = moves.filter(move => {
            const wouldBeInCheck = this.wouldKingBeInCheckAfterMove(pieceColor, row, col, move.row, move.col);
            if (wouldBeInCheck) {
                console.log(`❌ Mouvement bloqué: pion [${row},${col}]->[${move.row},${move.col}] mettrait le roi en échec`);
            }
            return !wouldBeInCheck;
        });

        console.log(`♟️ Pion ${pieceColor} en [${row},${col}]: ${moves.length} mouvements bruts, ${validMoves.length} valides`);
        return validMoves;
    }

    // Vérifier si le mouvement mettrait le roi en échec
    wouldKingBeInCheckAfterMove(pieceColor, fromRow, fromCol, toRow, toCol) {
        try {
            // Créer une simulation du plateau
            const tempBoard = this.createTempBoard();
            
            // Déplacer le pion temporairement
            const pawnPiece = tempBoard[fromRow][fromCol];
            tempBoard[toRow][toCol] = pawnPiece;
            tempBoard[fromRow][fromCol] = null;
            
            // Générer un FEN temporaire
            const tempFEN = this.generateTempFEN(tempBoard, pieceColor);
            
            // Vérifier l'échec
            const engine = new ChessEngine(tempFEN);
            const isInCheck = engine.isKingInCheck(pieceColor === 'white' ? 'w' : 'b');
            
            return isInCheck;
            
        } catch (error) {
            console.error('Erreur dans wouldKingBeInCheckAfterMove:', error);
            return true;
        }
    }

    // Créer une copie temporaire du plateau
    createTempBoard() {
        const tempBoard = Array(8).fill().map(() => Array(8).fill(null));
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                tempBoard[row][col] = square.piece ? {...square.piece} : null;
            }
        }
        return tempBoard;
    }

    // Générer un FEN temporaire
    generateTempFEN(tempBoard, currentPlayer) {
        let fen = '';
        
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            
            for (let col = 0; col < 8; col++) {
                const piece = tempBoard[row][col];
                
                if (!piece) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    fen += this.pieceToFEN(piece);
                }
            }
            
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            
            if (row < 7) {
                fen += '/';
            }
        }
        
        const nextPlayer = currentPlayer === 'white' ? 'b' : 'w';
        fen += ` ${nextPlayer} KQkq - 0 1`;
        
        return fen;
    }

    // Convertir une pièce en notation FEN
    pieceToFEN(piece) {
        const pieceMap = {
            'king': 'k',
            'queen': 'q',
            'rook': 'r', 
            'bishop': 'b',
            'knight': 'n',
            'pawn': 'p'
        };
        
        const fenCode = pieceMap[piece.type] || '?';
        return piece.color === 'white' ? fenCode.toUpperCase() : fenCode;
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