// check/checkChessPat.js - Vérification du pat (égalité) avec consoleLog configurable
class ChessPatEngine extends ChessEngine {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('check/checkChessPat.js loaded');
        }
    }

    constructor(fen) {
        super(fen);
    }

    // Vérifier le pat (égalité)
    isStalemate(color) {
        if (this.constructor.consoleLog) {
            console.log(`♟️🔍 Vérification pat pour ${color}`);
        }
        
        // 1. Le roi n'est PAS en échec
        if (this.isKingInCheck(color)) {
            if (this.constructor.consoleLog) {
                console.log(`♟️❌ Roi en échec - pas pat`);
            }
            return false;
        }
        
        // 2. Aucun coup légal possible
        const hasLegalMoves = this.hasAnyLegalMoves(color);
        
        if (this.constructor.consoleLog) {
            console.log(`♟️✅ Pas d'échec, coups légaux: ${hasLegalMoves}`);
        }
        
        return !hasLegalMoves;
    }

    // Vérifier s'il y a au moins un coup légal
    hasAnyLegalMoves(color) {
        // Parcourir toutes les pièces de la couleur
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                
                // Si c'est une pièce de la bonne couleur
                if (piece && this.isPieceColor(piece, color)) {
                    // Générer tous les mouvements possibles pour cette pièce
                    const possibleMoves = this.getPossibleMovesForPiece(piece, row, col);
                    
                    // Si au moins un mouvement est légal (ne met pas le roi en échec)
                    for (const move of possibleMoves) {
                        if (this.isMoveLegal(color, row, col, move.row, move.col)) {
                            if (this.constructor.consoleLog) {
                                console.log(`♟️✅ Coup légal trouvé: ${piece} de [${row},${col}] vers [${move.row},${move.col}]`);
                            }
                            return true; // Au moins un coup légal existe
                        }
                    }
                }
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`♟️❌ Aucun coup légal pour ${color}`);
        }
        
        return false; // Aucun coup légal
    }

    // Vérifier si une pièce est de la bonne couleur
    isPieceColor(piece, color) {
        const isWhite = piece === piece.toUpperCase();
        return (color === 'w' && isWhite) || (color === 'b' && !isWhite);
    }

    // Générer les mouvements possibles pour une pièce
    getPossibleMovesForPiece(piece, row, col) {
        const pieceType = piece.toLowerCase();
        const moves = [];
        
        switch (pieceType) {
            case 'p': // Pion
                this.getPawnMoves(moves, piece, row, col);
                break;
            case 'n': // Cavalier
                this.getKnightMoves(moves, row, col);
                break;
            case 'b': // Fou
                this.getBishopMoves(moves, row, col);
                break;
            case 'r': // Tour
                this.getRookMoves(moves, row, col);
                break;
            case 'q': // Dame
                this.getQueenMoves(moves, row, col);
                break;
            case 'k': // Roi
                this.getKingMoves(moves, row, col);
                break;
        }
        
        return moves;
    }

    // Vérifier si un mouvement est légal (ne met pas le roi en échec)
    isMoveLegal(color, fromRow, fromCol, toRow, toCol) {
        // Créer une copie du plateau pour simulation
        const tempBoard = this.createTempBoard();
        const piece = tempBoard[fromRow][fromCol];
        
        // Exécuter le mouvement temporairement
        tempBoard[toRow][toCol] = piece;
        tempBoard[fromRow][fromCol] = null;
        
        // Vérifier si le roi est toujours en échec après le mouvement
        const tempEngine = new ChessPatEngine(this.generateFENFromBoard(tempBoard, color));
        return !tempEngine.isKingInCheck(color);
    }

    // Créer une copie temporaire du plateau
    createTempBoard() {
        const tempBoard = Array(8).fill().map(() => Array(8).fill(null));
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                tempBoard[row][col] = this.board[row][col];
            }
        }
        return tempBoard;
    }

    // Générer un FEN à partir d'un plateau temporaire
    generateFENFromBoard(tempBoard, currentPlayer) {
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
        
        // Tour actuel (inversé car on teste les coups de l'adversaire)
        const nextPlayer = currentPlayer === 'w' ? 'b' : 'w';
        fen += ` ${nextPlayer} KQkq - 0 1`;
        
        return fen;
    }

    // Méthodes de génération des mouvements
    getPawnMoves(moves, piece, row, col) {
        const direction = piece === 'P' ? -1 : 1;
        const startRow = piece === 'P' ? 6 : 1;
        
        // Avance d'une case
        if (this.isValidSquare(row + direction, col) && !this.getPiece(row + direction, col)) {
            moves.push({ row: row + direction, col: col });
            
            // Avance de deux cases depuis la position initiale
            if (row === startRow && !this.getPiece(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col: col });
            }
        }
        
        // Prises
        const captureDirections = [[direction, -1], [direction, 1]];
        for (const [dr, dc] of captureDirections) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidSquare(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (target && this.isPieceColor(target, piece === 'P' ? 'b' : 'w')) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    getKnightMoves(moves, row, col) {
        const directions = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidSquare(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                if (!target || this.isPieceColor(target, this.getPiece(row, col) === this.getPiece(row, col).toUpperCase() ? 'b' : 'w')) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    getBishopMoves(moves, row, col) {
        this.getSlidingMoves(moves, row, col, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    }

    getRookMoves(moves, row, col) {
        this.getSlidingMoves(moves, row, col, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
    }

    getQueenMoves(moves, row, col) {
        this.getSlidingMoves(moves, row, col, [
            [-1, -1], [-1, 1], [1, -1], [1, 1],
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ]);
    }

    getKingMoves(moves, row, col) {
        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidSquare(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                const pieceColor = this.getPiece(row, col) === this.getPiece(row, col).toUpperCase() ? 'w' : 'b';
                if (!target || this.isPieceColor(target, pieceColor === 'w' ? 'b' : 'w')) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    getSlidingMoves(moves, row, col, directions) {
        const pieceColor = this.getPiece(row, col) === this.getPiece(row, col).toUpperCase() ? 'w' : 'b';
        
        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;
            
            while (this.isValidSquare(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (this.isPieceColor(target, pieceColor === 'w' ? 'b' : 'w')) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                
                newRow += dr;
                newCol += dc;
            }
        }
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    /**
     * Configurer le mode debug
     */
    static setDebugMode(enabled) {
        this.consoleLog = enabled;
        console.log(`🔧 ChessPatEngine debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }
}

// Appeler init() automatiquement
ChessPatEngine.init();

window.ChessPatEngine = ChessPatEngine;