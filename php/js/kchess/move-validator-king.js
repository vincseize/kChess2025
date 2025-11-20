// move-validator-king.js - Validateur des mouvements de roi
class KingMoveValidator {
    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
    }

    getPossibleMoves(piece, row, col) {
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
                
                // Vérifier que la case n'est pas occupée par une pièce de même couleur
                if (!targetPiece || targetPiece.color !== piece.color) {
                    // VÉRIFICATION CRITIQUE : Le roi ne peut pas se mettre en échec
                    if (!this.wouldBeInCheck(piece.color, row, col, newRow, newCol)) {
                        // VÉRIFICATION CRITIQUE : Les rois ne peuvent pas être adjacents
                        if (!this.wouldBeAdjacentToOpponentKing(piece.color, newRow, newCol)) {
                            moves.push({ 
                                row: newRow, 
                                col: newCol, 
                                type: targetPiece ? 'capture' : 'move' 
                            });
                        }
                    }
                }
            }
        });

        return moves;
    }

    // NOUVELLE MÉTHODE : Vérifier si le mouvement mettrait le roi en échec
    wouldBeInCheck(kingColor, fromRow, fromCol, toRow, toCol) {
        // Créer une simulation temporaire du plateau
        const tempBoard = this.createTempBoard();
        
        // Déplacer le roi temporairement
        tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
        tempBoard[fromRow][fromCol] = null;
        
        // Générer un FEN temporaire
        const tempFEN = this.generateTempFEN(tempBoard, kingColor);
        
        // Vérifier l'échec
        const engine = new ChessEngine(tempFEN);
        return engine.isKingInCheck(kingColor === 'white' ? 'w' : 'b');
    }

    // NOUVELLE MÉTHODE : Vérifier si le roi serait adjacent à l'autre roi
    wouldBeAdjacentToOpponentKing(kingColor, newRow, newCol) {
        const opponentColor = kingColor === 'white' ? 'black' : 'white';
        const opponentKingPos = this.findKingPosition(opponentColor);
        
        if (!opponentKingPos) return false;
        
        // Vérifier toutes les cases adjacentes autour de la nouvelle position
        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
        
        return directions.some(([dr, dc]) => {
            const adjacentRow = newRow + dr;
            const adjacentCol = newCol + dc;
            return adjacentRow === opponentKingPos.row && adjacentCol === opponentKingPos.col;
        });
    }

    // NOUVELLE MÉTHODE : Trouver la position du roi adverse
    findKingPosition(color) {
        const kingType = 'king';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                if (square.piece && 
                    square.piece.type === kingType && 
                    square.piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    // NOUVELLE MÉTHODE : Créer une copie temporaire du plateau
    createTempBoard() {
        const tempBoard = Array(8).fill().map(() => Array(8).fill(null));
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                if (square && square.piece) {
                    tempBoard[row][col] = this.convertPieceToFEN(square.piece);
                }
            }
        }
        return tempBoard;
    }

    // NOUVELLE MÉTHODE : Convertir une pièce en notation FEN
    convertPieceToFEN(piece) {
        if (!piece) return null;
        
        const pieceCode = piece.type === 'knight' ? 'n' : piece.type[0];
        return piece.color === 'white' ? pieceCode.toUpperCase() : pieceCode;
    }

    // NOUVELLE MÉTHODE : Générer un FEN temporaire
    generateTempFEN(tempBoard, currentPlayer) {
        let fen = '';
        
        // Partie plateau
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            
            for (let col = 0; col < 8; col++) {
                const piece = tempBoard[row][col];
                
                if (piece === null) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    fen += piece;
                }
            }
            
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            
            if (row < 7) {
                fen += '/';
            }
        }
        
        // Ajouter les autres informations FEN
        const currentPlayerFEN = currentPlayer === 'white' ? 'w' : 'b';
        fen += ` ${currentPlayerFEN} KQkq - 0 1`;
        
        return fen;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

window.KingMoveValidator = KingMoveValidator;