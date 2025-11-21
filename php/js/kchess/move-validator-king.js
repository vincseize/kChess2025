// move-validator-king.js - Validateur des mouvements de roi COMPLET
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

        const kingColor = piece.color;
        console.log(`♔ Calcul des mouvements du roi ${kingColor} en [${row},${col}]`);
        
        directions.forEach(([rowDir, colDir]) => {
            const newRow = row + rowDir;
            const newCol = col + colDir;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                
                // Vérifier que la case n'est pas occupée par une pièce de même couleur
                if (!targetPiece || targetPiece.color !== kingColor) {
                    // VÉRIFICATION CRITIQUE : Le roi ne peut pas se mettre en échec
                    if (!this.wouldBeInCheck(kingColor, row, col, newRow, newCol)) {
                        // VÉRIFICATION CRITIQUE : Les rois ne peuvent pas être adjacents
                        if (!this.wouldBeAdjacentToOpponentKing(kingColor, newRow, newCol)) {
                            const moveType = targetPiece ? 'capture' : 'move';
                            moves.push({ 
                                row: newRow, 
                                col: newCol, 
                                type: moveType 
                            });
                            console.log(`✅ Mouvement valide: [${newRow},${newCol}] (${moveType})`);
                        } else {
                            console.log(`❌ Rois adjacents: [${newRow},${newCol}]`);
                        }
                    } else {
                        console.log(`❌ Case attaquée: [${newRow},${newCol}]`);
                    }
                } else {
                    console.log(`❌ Pièce alliée: [${newRow},${newCol}]`);
                }
            }
        });

        console.log(`♔ Mouvements valides pour le roi ${kingColor}:`, moves.length);
        return moves;
    }

    // Vérifier si le mouvement mettrait le roi en échec
    wouldBeInCheck(kingColor, fromRow, fromCol, toRow, toCol) {
        try {
            // Créer une simulation temporaire du plateau
            const tempBoard = this.createTempBoard();
            
            // Déplacer le roi temporairement
            const kingPiece = tempBoard[fromRow][fromCol];
            tempBoard[toRow][toCol] = kingPiece;
            tempBoard[fromRow][fromCol] = null;
            
            // Générer un FEN temporaire
            const tempFEN = this.generateTempFEN(tempBoard, kingColor);
            
            console.log('🔍 FEN de simulation:', tempFEN);
            
            // Vérifier l'échec
            const engine = new ChessEngine(tempFEN);
            const isInCheck = engine.isKingInCheck(kingColor === 'white' ? 'w' : 'b');
            
            console.log(`🔍 Simulation [${fromRow},${fromCol}]->[${toRow},${toCol}]: échec = ${isInCheck}`);
            return isInCheck;
            
        } catch (error) {
            console.error('Erreur dans wouldBeInCheck:', error);
            return true; // En cas d'erreur, on considère que c'est dangereux
        }
    }

    // Vérifier si le roi serait adjacent à l'autre roi
    wouldBeAdjacentToOpponentKing(kingColor, newRow, newCol) {
        const opponentColor = kingColor === 'white' ? 'black' : 'white';
        const opponentKingPos = this.findKingPosition(opponentColor);
        
        if (!opponentKingPos) {
            console.log(`❌ Roi adverse ${opponentColor} non trouvé`);
            return false;
        }
        
        // Méthode optimisée : calculer la distance
        const rowDiff = Math.abs(newRow - opponentKingPos.row);
        const colDiff = Math.abs(newCol - opponentKingPos.col);
        
        const areAdjacent = rowDiff <= 1 && colDiff <= 1;
        
        if (areAdjacent) {
            console.log(`⚠️ Rois adjacents: roi ${kingColor} [${newRow},${newCol}] vs roi ${opponentColor} [${opponentKingPos.row},${opponentKingPos.col}]`);
        }
        
        return areAdjacent;
    }

    // Trouver la position du roi adverse
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
        console.warn(`❌ Roi ${color} non trouvé !`);
        return null;
    }

    // Créer une copie temporaire du plateau
    createTempBoard() {
        const tempBoard = Array(8).fill().map(() => Array(8).fill(null));
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                if (square && square.piece) {
                    // Copier l'objet pièce complet
                    tempBoard[row][col] = { 
                        type: square.piece.type,
                        color: square.piece.color
                    };
                }
            }
        }
        return tempBoard;
    }

    // Convertir une pièce en notation FEN
    convertPieceToFEN(piece) {
        if (!piece) return null;
        
        const pieceMap = {
            'king': 'k',
            'queen': 'q',
            'rook': 'r', 
            'bishop': 'b',
            'knight': 'n',
            'pawn': 'p'
        };
        
        const pieceCode = pieceMap[piece.type] || '?';
        return piece.color === 'white' ? pieceCode.toUpperCase() : pieceCode;
    }

    // Générer un FEN temporaire
    generateTempFEN(tempBoard, currentPlayer) {
        let fen = '';
        
        // Partie plateau
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
                    fen += this.convertPieceToFEN(piece);
                }
            }
            
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            
            if (row < 7) {
                fen += '/';
            }
        }
        
        // CORRECTION CRITIQUE : Après le mouvement du roi, c'est à l'adversaire de jouer
        const nextPlayer = currentPlayer === 'white' ? 'b' : 'w';
        fen += ` ${nextPlayer} KQkq - 0 1`;
        
        return fen;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

window.KingMoveValidator = KingMoveValidator;