// move-validator-king.js - Validateur des mouvements de roi AVEC ROQUE
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
        
        // Mouvements normaux
        directions.forEach(([rowDir, colDir]) => {
            const newRow = row + rowDir;
            const newCol = col + colDir;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                
                if (!targetPiece || targetPiece.color !== kingColor) {
                    if (!this.wouldBeInCheck(kingColor, row, col, newRow, newCol)) {
                        if (!this.wouldBeAdjacentToOpponentKing(kingColor, newRow, newCol)) {
                            const moveType = targetPiece ? 'capture' : 'move';
                            moves.push({ 
                                row: newRow, 
                                col: newCol, 
                                type: moveType 
                            });
                        }
                    }
                }
            }
        });

        // Ajouter les roques
        const castleMoves = this.getCastleMoves(piece, row, col);
        moves.push(...castleMoves);

        console.log(`♔ Mouvements valides pour le roi ${kingColor}:`, moves.length);
        return moves;
    }

    // Roques possibles
    getCastleMoves(king, row, col) {
        const moves = [];
        const color = king.color;
        
        // Le roi ne doit pas être en échec
        if (this.isKingInCheck(color)) {
            console.log(`♔❌ Roque impossible: roi ${color} en échec`);
            return moves;
        }

        // Vérifier si le roi n'a pas encore bougé
        if (this.hasKingMoved(color)) {
            console.log(`♔❌ Roque impossible: roi ${color} a déjà bougé`);
            return moves;
        }

        // Roque côté roi (petit roque)
        if (this.canCastleKingside(color)) {
            console.log(`♔✅ Roque côté roi possible pour ${color}`);
            const kingsideMove = this.createCastleMove(color, 'kingside');
            if (kingsideMove) moves.push(kingsideMove);
        }

        // Roque côté dame (grand roque)
        if (this.canCastleQueenside(color)) {
            console.log(`♔✅ Roque côté dame possible pour ${color}`);
            const queensideMove = this.createCastleMove(color, 'queenside');
            if (queensideMove) moves.push(queensideMove);
        }

        return moves;
    }

    // Vérifier le roque côté roi
    canCastleKingside(color) {
        const row = color === 'white' ? 7 : 0;
        
        // Vérifier si la tour côté roi n'a pas bougé
        if (this.hasRookMoved(color, 'kingside')) {
            console.log(`♔❌ Tour côté roi ${color} a bougé`);
            return false;
        }

        // Vérifier les cases vides entre roi et tour
        if (!this.areCastleSquaresEmpty(color, 'kingside')) {
            console.log(`♔❌ Cases non vides pour roque côté roi ${color}`);
            return false;
        }

        // Vérifier que les cases traversées ne sont pas attaquées
        if (!this.areCastleSquaresSafe(color, 'kingside')) {
            console.log(`♔❌ Cases attaquées pour roque côté roi ${color}`);
            return false;
        }

        return true;
    }

    // Vérifier le roque côté dame
    canCastleQueenside(color) {
        const row = color === 'white' ? 7 : 0;
        
        // Vérifier si la tour côté dame n'a pas bougé
        if (this.hasRookMoved(color, 'queenside')) {
            console.log(`♔❌ Tour côté dame ${color} a bougé`);
            return false;
        }

        // Vérifier les cases vides entre roi et tour
        if (!this.areCastleSquaresEmpty(color, 'queenside')) {
            console.log(`♔❌ Cases non vides pour roque côté dame ${color}`);
            return false;
        }

        // Vérifier que les cases traversées ne sont pas attaquées
        if (!this.areCastleSquaresSafe(color, 'queenside')) {
            console.log(`♔❌ Cases attaquées pour roque côté dame ${color}`);
            return false;
        }

        return true;
    }

    // Vérifier si les cases sont vides pour le roque
    areCastleSquaresEmpty(color, side) {
        const row = color === 'white' ? 7 : 0;
        
        if (side === 'kingside') {
            // Cases f et g doivent être vides
            return !this.board.getPiece(row, 5) && !this.board.getPiece(row, 6);
        } else {
            // Cases b, c, d doivent être vides
            return !this.board.getPiece(row, 1) && 
                   !this.board.getPiece(row, 2) && 
                   !this.board.getPiece(row, 3);
        }
    }

    // Vérifier si les cases traversées sont sûres
    areCastleSquaresSafe(color, side) {
        const row = color === 'white' ? 7 : 0;
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        if (side === 'kingside') {
            // Le roi traverse f et g - ces cases ne doivent pas être attaquées
            const fAttacked = this.isSquareAttacked(row, 5, opponentColor);
            const gAttacked = this.isSquareAttacked(row, 6, opponentColor);
            
            console.log(`♔ Cases roque côté roi: f[${row},5] attaquée=${fAttacked}, g[${row},6] attaquée=${gAttacked}`);
            
            return !fAttacked && !gAttacked;
        } else {
            // Le roi traverse d et c - ces cases ne doivent pas être attaquées
            const dAttacked = this.isSquareAttacked(row, 3, opponentColor);
            const cAttacked = this.isSquareAttacked(row, 2, opponentColor);
            
            console.log(`♔ Cases roque côté dame: d[${row},3] attaquée=${dAttacked}, c[${row},2] attaquée=${cAttacked}`);
            
            return !dAttacked && !cAttacked;
        }
    }

    // Créer un mouvement de roque
    createCastleMove(color, side) {
        const row = color === 'white' ? 7 : 0;
        
        if (side === 'kingside') {
            return {
                row: row,
                col: 6,
                type: 'castle-kingside',
                special: 'castle'
            };
        } else {
            return {
                row: row,
                col: 2,
                type: 'castle-queenside', 
                special: 'castle'
            };
        }
    }

    // Vérifier si le roi a bougé
    hasKingMoved(color) {
        // À implémenter avec l'historique des mouvements
        // Pour l'instant, on suppose que non si le roi est sur sa case de départ
        const startRow = color === 'white' ? 7 : 0;
        const startCol = 4;
        
        const king = this.board.getPiece(startRow, startCol);
        return !king || king.type !== 'king' || king.color !== color;
    }

    // Vérifier si une tour a bougé
    hasRookMoved(color, side) {
        const row = color === 'white' ? 7 : 0;
        const rookCol = side === 'kingside' ? 7 : 0;
        
        const rook = this.board.getPiece(row, rookCol);
        return !rook || rook.type !== 'rook' || rook.color !== color;
    }

    // Vérifier si une case est attaquée
    isSquareAttacked(row, col, attackerColor) {
        const tempBoard = this.createTempBoard();
        const tempFEN = this.generateTempFEN(tempBoard, attackerColor === 'white' ? 'black' : 'white');
        const engine = new ChessEngine(tempFEN);
        return engine.isSquareAttacked(row, col, attackerColor === 'white' ? 'w' : 'b');
    }

    // Vérifier si le roi est en échec
    isKingInCheck(color) {
        const tempBoard = this.createTempBoard();
        const tempFEN = this.generateTempFEN(tempBoard, color);
        const engine = new ChessEngine(tempFEN);
        return engine.isKingInCheck(color === 'white' ? 'w' : 'b');
    }

    // === MÉTHODES EXISTANTES (gardées telles quelles) ===
    
    wouldBeInCheck(kingColor, fromRow, fromCol, toRow, toCol) {
        try {
            const tempBoard = this.createTempBoard();
            const kingPiece = tempBoard[fromRow][fromCol];
            tempBoard[toRow][toCol] = kingPiece;
            tempBoard[fromRow][fromCol] = null;
            const tempFEN = this.generateTempFEN(tempBoard, kingColor);
            const engine = new ChessEngine(tempFEN);
            const isInCheck = engine.isKingInCheck(kingColor === 'white' ? 'w' : 'b');
            console.log(`🔍 Simulation [${fromRow},${fromCol}]->[${toRow},${toCol}]: échec = ${isInCheck}`);
            return isInCheck;
        } catch (error) {
            console.error('Erreur dans wouldBeInCheck:', error);
            return true;
        }
    }

    wouldBeAdjacentToOpponentKing(kingColor, newRow, newCol) {
        const opponentColor = kingColor === 'white' ? 'black' : 'white';
        const opponentKingPos = this.findKingPosition(opponentColor);
        if (!opponentKingPos) return false;
        const rowDiff = Math.abs(newRow - opponentKingPos.row);
        const colDiff = Math.abs(newCol - opponentKingPos.col);
        const areAdjacent = rowDiff <= 1 && colDiff <= 1;
        if (areAdjacent) {
            console.log(`⚠️ Rois adjacents: roi ${kingColor} [${newRow},${newCol}] vs roi ${opponentColor} [${opponentKingPos.row},${opponentKingPos.col}]`);
        }
        return areAdjacent;
    }

    findKingPosition(color) {
        const kingType = 'king';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                if (square.piece && square.piece.type === kingType && square.piece.color === color) {
                    return { row, col };
                }
            }
        }
        console.warn(`❌ Roi ${color} non trouvé !`);
        return null;
    }

    createTempBoard() {
        const tempBoard = Array(8).fill().map(() => Array(8).fill(null));
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                if (square && square.piece) {
                    tempBoard[row][col] = { 
                        type: square.piece.type,
                        color: square.piece.color
                    };
                }
            }
        }
        return tempBoard;
    }

    convertPieceToFEN(piece) {
        if (!piece) return null;
        const pieceMap = {
            'king': 'k', 'queen': 'q', 'rook': 'r', 'bishop': 'b', 'knight': 'n', 'pawn': 'p'
        };
        const pieceCode = pieceMap[piece.type] || '?';
        return piece.color === 'white' ? pieceCode.toUpperCase() : pieceCode;
    }

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
                    fen += this.convertPieceToFEN(piece);
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (row < 7) fen += '/';
        }
        const nextPlayer = currentPlayer === 'white' ? 'b' : 'w';
        fen += ` ${nextPlayer} KQkq - 0 1`;
        return fen;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

window.KingMoveValidator = KingMoveValidator;