// move-validator-knight.js - Validateur des mouvements de cavalier CORRIGÉ
class KnightMoveValidator {
    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
    }

    getPossibleMoves(piece, row, col) {
        const moves = [];
        const knightMoves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];

        const pieceColor = piece.color;

        // Générer tous les mouvements possibles
        knightMoves.forEach(([rowOffset, colOffset]) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                if (!targetPiece || targetPiece.color !== pieceColor) {
                    moves.push({ 
                        row: newRow, 
                        col: newCol, 
                        type: targetPiece ? 'capture' : 'move' 
                    });
                }
            }
        });

        // Filtrer les mouvements qui mettraient le roi en échec
        const validMoves = moves.filter(move => {
            const wouldBeInCheck = this.wouldKingBeInCheckAfterMove(pieceColor, row, col, move.row, move.col);
            if (wouldBeInCheck) {
                console.log(`❌ Mouvement bloqué: cavalier [${row},${col}]->[${move.row},${move.col}] mettrait le roi en échec`);
            }
            return !wouldBeInCheck;
        });

        console.log(`🐴 Cavalier ${pieceColor} en [${row},${col}]: ${moves.length} mouvements bruts, ${validMoves.length} valides`);
        return validMoves;
    }

    // Vérifier si le mouvement mettrait le roi en échec
    wouldKingBeInCheckAfterMove(pieceColor, fromRow, fromCol, toRow, toCol) {
        try {
            // Créer une simulation du plateau
            const tempBoard = this.createTempBoard();
            
            // Déplacer le cavalier temporairement
            const knightPiece = tempBoard[fromRow][fromCol];
            tempBoard[toRow][toCol] = knightPiece;
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

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

window.KnightMoveValidator = KnightMoveValidator;