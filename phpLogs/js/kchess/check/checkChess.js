// check/checkChess.js - Moteur de vérification d'échec unifié
class ChessEngine {
    
    static consoleLog = true;
    
    static init() {
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('✅ check/checkChess.js chargé - VERSION UNIFIÉE');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog}`);
        }
    }
    
    static loadConfig() {
        try {
            // Priorité 1: chess_engine.console_log
            if (window.appConfig?.chess_engine?.console_log !== undefined) {
                const val = window.appConfig.chess_engine.console_log;
                this.consoleLog = val === "false" ? false : Boolean(val);
            }
            // Priorité 2: debug.console_log
            else if (window.appConfig?.debug?.console_log !== undefined) {
                const val = window.appConfig.debug.console_log;
                this.consoleLog = val === "false" ? false : Boolean(val);
            }
            
            return true;
        } catch (error) {
            console.error('❌ ChessEngine: Erreur config:', error);
            return false;
        }
    }

    constructor(fen) {
        this.fen = fen;
        this.board = this.parseFEN(fen);
        const parts = fen.split(' ');
        this.turn = parts[1];
        
        if (ChessEngine.consoleLog) {
            console.log('🔧 ChessEngine créé avec FEN:', fen);
            this.displayBoard();
        }
    }

    parseFEN(fen) {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        const boardPart = fen.split(' ')[0];
        let row = 0, col = 0;
        
        for (const char of boardPart) {
            if (char === '/') {
                row++;
                col = 0;
            } else if (isNaN(char)) {
                board[row][col] = char;
                col++;
            } else {
                col += parseInt(char);
            }
        }
        return board;
    }

    getPiece(row, col) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
        return this.board[row][col];
    }

    findKing(color) {
        const king = color === 'w' ? 'K' : 'k';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === king) {
                    return { row, col };
                }
            }
        }
        return null;
    }

isSquareAttacked(row, col, attackerColor) {
    const directions = {
        rook: [[-1, 0], [1, 0], [0, -1], [0, 1]],
        bishop: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
        knight: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
        king: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] // AJOUTÉ
    };

    // 1. VÉRIFIER LE ROI (Indispensable pour le Mat)
    for (const [dr, dc] of directions.king) {
        const r = row + dr, c = col + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const piece = this.getPiece(r, c);
            const enemyKing = attackerColor === 'w' ? 'K' : 'k';
            if (piece === enemyKing) return true;
        }
    }

    // 2. VÉRIFIER LES PIONS
    const pawnAttacks = attackerColor === 'w' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
    for (const [dr, dc] of pawnAttacks) {
        const r = row + dr, c = col + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const piece = this.getPiece(r, c);
            const enemyPawn = attackerColor === 'w' ? 'P' : 'p';
            if (piece === enemyPawn) return true;
        }
    }

    // 3. VÉRIFIER LES CAVALIERS
    for (const [dr, dc] of directions.knight) {
        const r = row + dr, c = col + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const piece = this.getPiece(r, c);
            const enemyKnight = attackerColor === 'w' ? 'N' : 'n';
            if (piece === enemyKnight) return true;
        }
    }

    // 4. VÉRIFIER LES PIÈCES GLISSANTES (Tours, Fous, Dames)
    const slidingConfigs = [
        { dirs: directions.rook, targets: attackerColor === 'w' ? ['R', 'Q'] : ['r', 'q'] },
        { dirs: directions.bishop, targets: attackerColor === 'w' ? ['B', 'Q'] : ['b', 'q'] }
    ];

    for (const config of slidingConfigs) {
        for (const [dr, dc] of config.dirs) {
            let r = row + dr, c = col + dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                if (piece) {
                    if (config.targets.includes(piece)) return true;
                    break; // Bloqué par une pièce (ami ou ennemi)
                }
                r += dr;
                c += dc;
            }
        }
    }

    return false;
}

    isKingInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;
        
        const attackerColor = color === 'w' ? 'b' : 'w';
        return this.isSquareAttacked(kingPos.row, kingPos.col, attackerColor);
    }

    // MÉTHODE CRITIQUE: Vérifier l'échec et mat AVANT le pat
    checkGameStatus(color = null) {
        const playerColor = color || this.turn;
        
        if (ChessEngine.consoleLog) {
            console.log(`\n🎮 VÉRIFICATION STATUT JEU (${playerColor === 'w' ? 'Blancs' : 'Noirs'})`);
            console.log(`🎮 ORDRE: 1. Mat → 2. Pat → 3. Nulle`);
        }
        
        // 1. Vérifier l'échec et mat
        const isMate = this.isCheckmate(playerColor);
        if (isMate) {
            if (ChessEngine.consoleLog) {
                console.log(`🎮✅ ÉCHEC ET MAT!`);
            }
            return 'checkmate';
        }
        
        // 2. Vérifier le pat
        const isStalemate = this.isStalemate(playerColor);
        if (isStalemate) {
            if (ChessEngine.consoleLog) {
                console.log(`🎮⚖️ PAT! Match nul`);
            }
            return 'stalemate';
        }
        
        return 'in_progress';
    }

    // NOUVELLE IMPLÉMENTATION UNIFIÉE pour isCheckmate
    isCheckmate(color = null) {
        const playerColor = color || this.turn;
        
        if (ChessEngine.consoleLog) {
            console.log(`\n♔ Vérification échec et mat pour ${playerColor === 'w' ? 'blancs' : 'noirs'}`);
        }
        
        // 1. Le roi doit être en échec
        const isInCheck = this.isKingInCheck(playerColor);
        if (!isInCheck) {
            if (ChessEngine.consoleLog) {
                console.log(`♔❌ Pas en échec → pas mat`);
            }
            return false;
        }
        
        // 2. Aucun coup légal disponible
        const hasLegalMoves = this.hasAnyLegalMoves(playerColor);
        
        if (ChessEngine.consoleLog) {
            console.log(`♔✅ Roi en échec, coups légaux: ${hasLegalMoves ? 'OUI' : 'NON'}`);
        }
        
        return !hasLegalMoves;
    }

    // NOUVELLE IMPLÉMENTATION UNIFIÉE pour isStalemate
    isStalemate(color = null) {
        const playerColor = color || this.turn;
        
        if (ChessEngine.consoleLog) {
            console.log(`\n⚖️ Vérification pat pour ${playerColor === 'w' ? 'blancs' : 'noirs'}`);
        }
        
        // 1. Le roi ne doit PAS être en échec
        const isInCheck = this.isKingInCheck(playerColor);
        if (isInCheck) {
            if (ChessEngine.consoleLog) {
                console.log(`⚖️❌ Roi en échec → pas pat (serait mat)`);
            }
            return false;
        }
        
        // 2. Aucun coup légal disponible
        const hasLegalMoves = this.hasAnyLegalMoves(playerColor);
        
        if (ChessEngine.consoleLog) {
            console.log(`⚖️✅ Pas en échec, coups légaux: ${hasLegalMoves ? 'OUI' : 'NON'}`);
        }
        
        return !hasLegalMoves;
    }

    // MÉTHODE UNIFIÉE pour vérifier s'il y a des coups légaux
    hasAnyLegalMoves(color) {
        const playerColor = color;
        let legalMoveFound = false;
        
        // Parcourir toutes les pièces de la couleur
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                
                if (piece && this.isPieceColor(piece, playerColor)) {
                    // Générer les mouvements possibles pour cette pièce
                    const possibleMoves = this.getPossibleMovesForPiece(piece, row, col);
                    
                    // Vérifier si au moins un mouvement est légal
                    for (const move of possibleMoves) {
                        if (this.isMoveLegal(playerColor, row, col, move.row, move.col)) {
                            if (ChessEngine.consoleLog) {
                                console.log(`♟️✅ Coup légal trouvé: ${piece} [${row},${col}] → [${move.row},${move.col}]`);
                            }
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }

    isPieceColor(piece, color) {
        const isWhite = piece === piece.toUpperCase();
        return (color === 'w' && isWhite) || (color === 'b' && !isWhite);
    }

    getPossibleMovesForPiece(piece, row, col) {
        const pieceType = piece.toLowerCase();
        const moves = [];
        
        switch(pieceType) {
            case 'p': this.getPawnMoves(moves, piece, row, col); break;
            case 'n': this.getKnightMoves(moves, row, col); break;
            case 'b': this.getBishopMoves(moves, row, col); break;
            case 'r': this.getRookMoves(moves, row, col); break;
            case 'q': this.getQueenMoves(moves, row, col); break;
            case 'k': this.getKingMoves(moves, row, col); break;
        }
        
        return moves;
    }

isMoveLegal(color, fromRow, fromCol, toRow, toCol) {
    // Créer une copie du plateau pour simulation
    const tempBoard = this.createTempBoard();
    const piece = tempBoard[fromRow][fromCol];
    
    // Vérifier si la case d'arrivée est occupée par une pièce de la même couleur
    const targetPiece = tempBoard[toRow][toCol];
    if (targetPiece && this.isPieceColor(targetPiece, color)) {
        return false;
    }
    
    // Exécuter le mouvement
    tempBoard[toRow][toCol] = piece;
    tempBoard[fromRow][fromCol] = null;
    
    // Vérifier si le roi est en échec après le mouvement
    // Après le mouvement, c'est au tour de l'adversaire
    const fen = this.generateFENFromBoard(tempBoard, color === 'w' ? 'b' : 'w');
    const tempEngine = new ChessEngine(fen);
    
    // Le roi qui pourrait être en échec est celui de la couleur qui vient de jouer
    return !tempEngine.isKingInCheck(color);
}

    createTempBoard() {
        return this.board.map(row => [...row]);
    }

generateFENFromBoard(tempBoard, currentPlayer) {
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
                fen += piece;
            }
        }
        
        if (emptyCount > 0) fen += emptyCount;
        if (row < 7) fen += '/';
    }
    
    // CORRECTION UNIFIÉE : Garder le même joueur pour la vérification
    fen += ` ${currentPlayer} KQkq - 0 1`;
    
    return fen;
}

    // Méthodes de génération des mouvements
    getPawnMoves(moves, piece, row, col) {
        const direction = piece === 'P' ? -1 : 1;
        const startRow = piece === 'P' ? 6 : 1;
        
        // Avance d'une case
        if (this.isValidSquare(row + direction, col) && !this.getPiece(row + direction, col)) {
            moves.push({ row: row + direction, col: col });
            
            // Avance de deux cases
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

    displayBoard() {
        if (!ChessEngine.consoleLog) return;
        
        console.log('\n📊 PLATEAU:');
        console.log('   a b c d e f g h');
        for (let row = 0; row < 8; row++) {
            let line = `${8 - row} `;
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                line += (piece || '.') + ' ';
            }
            console.log(line + ` ${8 - row}`);
        }
        console.log('   a b c d e f g h');
    }
}

// Initialisation
ChessEngine.init();
window.ChessEngine = ChessEngine;

// Ajout d'une fonction de test spécifique pour votre bug
window.testOrderBug = function() {
    console.log('\n🔍🔍🔍 TEST DE L ORDRE MAT/PAT 🔍🔍🔍');
    
    // Position d'échec et mat
    const mateFEN = "1R4k1/8/6K1/4p3/1p2P2P/1P1P4/2P2PP1/1NB3N1 b - - 22 37";
    console.log('\n1. Test position MAT (devrait retourner "checkmate"):');
    const mateEngine = new ChessEngine(mateFEN);
    console.log('Résultat:', mateEngine.checkGameStatus());
    
    // Position de pat
    const staleFEN = "k7/8/8/8/8/8/8/R1K5 w - - 0 1";
    console.log('\n2. Test position PAT (devrait retourner "stalemate"):');
    const staleEngine = new ChessEngine(staleFEN);
    console.log('Résultat:', staleEngine.checkGameStatus());
    
    // Position normale
    const normalFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    console.log('\n3. Test position normale (devrait retourner "in_progress"):');
    const normalEngine = new ChessEngine(normalFEN);
    console.log('Résultat:', normalEngine.checkGameStatus());
};