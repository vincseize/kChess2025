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

        const kingColor = piece.color;
        
        // Vérifier les déplacements normaux
        directions.forEach(([rowDir, colDir]) => {
            const newRow = row + rowDir;
            const newCol = col + colDir;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                
                if (!targetPiece || targetPiece.color !== kingColor) {
                    if (!this.wouldBeInCheck(kingColor, row, col, newRow, newCol)) {
                        if (!this.wouldKingsBeAdjacent(kingColor, newRow, newCol)) {
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

        // Ajouter le roque si disponible
        this.addCastlingMoves(moves, piece, row, col, kingColor);

        return moves;
    }

    // Vérifier si le mouvement mettrait le roi en échec
    wouldBeInCheck(kingColor, fromRow, fromCol, toRow, toCol) {
        try {
            // Sauvegarder l'état actuel
            const originalBoard = this.createBoardSnapshot();
            
            // Simuler le mouvement
            this.simulateMove(fromRow, fromCol, toRow, toCol);
            
            // Vérifier si le roi est en échec après le mouvement
            const isInCheck = this.isKingInCheck(kingColor);
            
            // Restaurer l'état original
            this.restoreBoard(originalBoard);
            
            return isInCheck;
        } catch (error) {
            console.error('Erreur dans wouldBeInCheck:', error);
            return true; // En cas d'erreur, on considère que c'est dangereux
        }
    }

    // Vérifier si les rois seraient adjacents
    wouldKingsBeAdjacent(kingColor, newRow, newCol) {
        const opponentColor = kingColor === 'white' ? 'black' : 'white';
        const opponentKingPos = this.findKingPosition(opponentColor);
        
        if (!opponentKingPos) return false;
        
        const rowDiff = Math.abs(newRow - opponentKingPos.row);
        const colDiff = Math.abs(newCol - opponentKingPos.col);
        
        return rowDiff <= 1 && colDiff <= 1;
    }

    // Ajouter les mouvements de roque
    addCastlingMoves(moves, piece, row, col, color) {
        // Le roi ne peut pas roquer s'il est en échec
        if (this.isKingInCheck(color)) {
            return;
        }

        const castlingRights = this.getCastlingRights(color);

        if (castlingRights.kingside && this.canCastleKingside(color)) {
            moves.push({ 
                row: row, 
                col: col + 2, 
                type: 'castling-kingside' 
            });
        }

        if (castlingRights.queenside && this.canCastleQueenside(color)) {
            moves.push({ 
                row: row, 
                col: col - 2, 
                type: 'castling-queenside' 
            });
        }
    }

    // Vérifier si le roi peut roquer côté roi
    canCastleKingside(color) {
        const row = color === 'white' ? 7 : 0;
        
        // Vérifier que les cases entre le roi et la tour sont vides
        if (this.board.getPiece(row, 5) || this.board.getPiece(row, 6)) {
            return false;
        }

        // Vérifier que le roi ne passe pas par une case en échec
        if (this.wouldBeInCheck(color, row, 4, row, 5) || 
            this.wouldBeInCheck(color, row, 4, row, 6)) {
            return false;
        }

        return true;
    }

    // Vérifier si le roi peut roquer côté dame
    canCastleQueenside(color) {
        const row = color === 'white' ? 7 : 0;
        
        // Vérifier que les cases entre le roi et la tour sont vides
        if (this.board.getPiece(row, 1) || this.board.getPiece(row, 2) || this.board.getPiece(row, 3)) {
            return false;
        }

        // Vérifier que le roi ne passe pas par une case en échec
        if (this.wouldBeInCheck(color, row, 4, row, 3) || 
            this.wouldBeInCheck(color, row, 4, row, 2)) {
            return false;
        }

        return true;
    }

    // Obtenir les droits de roque (simplifié)
    getCastlingRights(color) {
        // Pour l'instant, on suppose que le roque est possible si les tours sont en place
        // Vous pourriez améliorer cela en stockant l'état du roque dans gameState
        const row = color === 'white' ? 7 : 0;
        
        const kingsideRook = this.board.getPiece(row, 7);
        const queensideRook = this.board.getPiece(row, 0);
        
        return {
            kingside: kingsideRook && kingsideRook.type === 'rook' && kingsideRook.color === color,
            queenside: queensideRook && queensideRook.type === 'rook' && queensideRook.color === color
        };
    }

    // Vérifier si le roi est en échec dans la position actuelle
    isKingInCheck(color) {
        try {
            const currentFEN = this.generateCurrentFEN();
            const engine = new ChessEngine(currentFEN);
            return engine.isKingInCheck(color === 'white' ? 'w' : 'b');
        } catch (error) {
            console.error('Erreur dans isKingInCheck:', error);
            return false;
        }
    }

    // === MÉTHODES UTILITAIRES ===

    // Créer un snapshot du plateau
    createBoardSnapshot() {
        const snapshot = [];
        for (let row = 0; row < 8; row++) {
            const rowSnapshot = [];
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                rowSnapshot.push(square.piece ? {...square.piece} : null);
            }
            snapshot.push(rowSnapshot);
        }
        return snapshot;
    }

    // Restaurer le plateau depuis un snapshot
    restoreBoard(snapshot) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                square.piece = snapshot[row][col] ? {...snapshot[row][col]} : null;
            }
        }
    }

    // Simuler un mouvement temporaire
    simulateMove(fromRow, fromCol, toRow, toCol) {
        const fromSquare = this.board.getSquare(fromRow, fromCol);
        const toSquare = this.board.getSquare(toRow, toCol);
        
        if (fromSquare && toSquare) {
            toSquare.piece = fromSquare.piece;
            fromSquare.piece = null;
        }
    }

    // Trouver la position du roi
    findKingPosition(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                if (square.piece && 
                    square.piece.type === 'king' && 
                    square.piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    // Générer le FEN actuel du jeu
    generateCurrentFEN() {
        let fen = '';
        
        // Partie plateau
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                const piece = square.piece;
                
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
        
        // Tour actuel
        fen += ` ${this.gameState.currentPlayer === 'white' ? 'w' : 'b'}`;
        
        // Droits de roque (simplifiés)
        fen += ' KQkq';
        
        // Prise en passant (vide pour l'instant)
        fen += ' -';
        
        // Demi-coups et coup complet
        fen += ' 0 1';
        
        return fen;
    }

    // Convertir une pièce en notation FEN
    pieceToFEN(piece) {
        let pieceCode;
        switch(piece.type) {
            case 'king': pieceCode = 'k'; break;
            case 'queen': pieceCode = 'q'; break;
            case 'rook': pieceCode = 'r'; break;
            case 'bishop': pieceCode = 'b'; break;
            case 'knight': pieceCode = 'n'; break;
            case 'pawn': pieceCode = 'p'; break;
            default: pieceCode = '?';
        }
        
        return piece.color === 'white' ? pieceCode.toUpperCase() : pieceCode;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

window.KingMoveValidator = KingMoveValidator;