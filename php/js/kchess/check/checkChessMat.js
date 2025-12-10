// check/checkChessMat.js - Moteur avancé de vérification d'échec et mat avec priorité à la config JSON
class ChessMateEngine extends ChessEngine {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('✅ check/checkChessMat.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        }
    }
    
    // Méthode pour charger la configuration
    static loadConfig() {
        try {
            // Vérifier si la configuration globale existe
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                
                // Convertir la valeur en booléen
                if (typeof configValue === 'string') {
                    this.consoleLog = configValue.toLowerCase() === 'true';
                } else {
                    this.consoleLog = Boolean(configValue);
                }
                
                return true;
            }
            
            // Si rien n'est disponible, garder la valeur par défaut
            if (this.consoleLog) {
                console.warn('⚠️ ChessMateEngine: Aucune configuration trouvée, utilisation de la valeur par défaut');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessMateEngine: Erreur lors du chargement de la config:', error);
            return false;
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig) {
            return 'JSON config';
        } else {
            return 'valeur par défaut';
        }
    }

    constructor(fen) {
        super(fen);
        
        if (this.constructor.consoleLog) {
            console.log(`♔🔧 ChessMateEngine initialisé avec FEN: ${fen.substring(0, 50)}...`);
        }
    }

    // Vérifier l'échec et mat
    isCheckmate(color) {
        if (this.constructor.consoleLog) {
            console.log(`\n♔🔍🔍🔍 VÉRIFICATION ÉCHEC ET MAT pour ${color === 'w' ? 'BLANCS' : 'NOIRS'}`);
            console.log(`FEN: ${this.fen}`);
            this.displayBoard();
        }
        
        // 1. Le roi doit être en échec
        const isInCheck = this.isKingInCheck(color);
        
        if (this.constructor.consoleLog) {
            console.log(`♔ État échec: ${isInCheck ? '✅ OUI - Le roi est en échec' : '❌ NON - Le roi n\'est pas en échec'}`);
        }
        
        if (!isInCheck) {
            if (this.constructor.consoleLog) {
                console.log(`♔❌ Pas d'échec et mat - le roi n'est pas en échec`);
            }
            return false;
        }
        
        // 2. Aucun coup légal ne permet d'échapper à l'échec
        const hasLegalMoves = this.hasAnyLegalMoves(color);
        
        if (this.constructor.consoleLog) {
            if (hasLegalMoves) {
                console.log(`♔❌ Des coups légaux sont disponibles - pas d'échec et mat`);
            } else {
                console.log(`♔✅✅✅ ÉCHEC ET MAT DÉTECTÉ ! Aucun coup légal disponible`);
            }
        }
        
        return !hasLegalMoves;
    }

    // Vérifier le pat (égalité)
    isStalemate(color) {
        if (this.constructor.consoleLog) {
            console.log(`\n⚖️🔍🔍🔍 VÉRIFICATION PAT pour ${color === 'w' ? 'BLANCS' : 'NOIRS'}`);
            console.log(`FEN: ${this.fen}`);
        }
        
        // 1. Le roi n'est PAS en échec
        const isInCheck = this.isKingInCheck(color);
        
        if (this.constructor.consoleLog) {
            console.log(`⚖️ État échec: ${isInCheck ? '⚠️ OUI - Le roi est en échec' : '✅ NON - Le roi n\'est pas en échec'}`);
        }
        
        if (isInCheck) {
            if (this.constructor.consoleLog) {
                console.log(`⚖️❌ Le roi est en échec - pas un pat`);
            }
            return false;
        }
        
        // 2. Aucun coup légal possible
        const hasLegalMoves = this.hasAnyLegalMoves(color);
        
        if (this.constructor.consoleLog) {
            if (hasLegalMoves) {
                console.log(`⚖️❌ Des coups légaux sont disponibles - pas de pat`);
            } else {
                console.log(`⚖️✅✅✅ PAT DÉTECTÉ ! Aucun coup légal disponible sans échec`);
            }
        }
        
        return !hasLegalMoves;
    }

    // Vérifier s'il y a au moins un coup légal
    hasAnyLegalMoves(color) {
        if (this.constructor.consoleLog) {
            console.log(`\n♟️🔍 RECHERCHE COUPS LÉGAUX pour ${color === 'w' ? 'Blancs' : 'Noirs'}`);
        }
        
        let legalMoveFound = false;
        let pieceCount = 0;
        let totalMovesChecked = 0;
        
        // Parcourir toutes les pièces de la couleur
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                
                // Si c'est une pièce de la bonne couleur
                if (piece && this.isPieceColor(piece, color)) {
                    pieceCount++;
                    
                    if (this.constructor.consoleLog) {
                        console.log(`♟️ Pièce ${piece} en [${row},${col}]`);
                    }
                    
                    // Générer tous les mouvements possibles pour cette pièce
                    const possibleMoves = this.getPossibleMovesForPiece(piece, row, col);
                    
                    if (this.constructor.consoleLog) {
                        console.log(`   → ${possibleMoves.length} mouvement(s) possible(s)`);
                    }
                    
                    // Si au moins un mouvement est légal (ne met pas le roi en échec)
                    for (const move of possibleMoves) {
                        totalMovesChecked++;
                        
                        if (this.isMoveLegal(color, row, col, move.row, move.col)) {
                            if (this.constructor.consoleLog) {
                                console.log(`   ♟️✅ Coup légal trouvé: ${piece} de [${row},${col}] vers [${move.row},${move.col}]`);
                            }
                            legalMoveFound = true;
                            break;
                        }
                    }
                    
                    if (legalMoveFound) break;
                }
            }
            if (legalMoveFound) break;
        }
        
        if (this.constructor.consoleLog) {
            if (legalMoveFound) {
                console.log(`♟️✅ Au moins un coup légal trouvé`);
            } else {
                console.log(`♟️❌ Aucun coup légal trouvé parmi ${pieceCount} pièces (${totalMovesChecked} mouvements testés)`);
            }
        }
        
        return legalMoveFound;
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
        
        if (this.constructor.consoleLog) {
            console.log(`   Détermination des mouvements pour ${piece} en [${row},${col}]`);
        }
        
        switch (pieceType) {
            case 'p': // Pion
                this.getPawnMoves(moves, piece, row, col);
                break;
            case 'n': // Cavalier
                this.getKnightMoves(moves, piece, row, col);
                break;
            case 'b': // Fou
                this.getBishopMoves(moves, piece, row, col);
                break;
            case 'r': // Tour
                this.getRookMoves(moves, piece, row, col);
                break;
            case 'q': // Dame
                this.getQueenMoves(moves, piece, row, col);
                break;
            case 'k': // Roi
                this.getKingMoves(moves, piece, row, col);
                break;
        }
        
        if (this.constructor.consoleLog) {
            console.log(`   → Résultat: ${moves.length} mouvement(s)`);
        }
        
        return moves;
    }

    // Vérifier si un mouvement est légal (ne met pas le roi en échec)
    isMoveLegal(color, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`     ↳ Test mouvement: [${fromRow},${fromCol}] -> [${toRow},${toCol}]`);
        }
        
        // Créer une copie du plateau pour simulation
        const tempBoard = this.createTempBoard();
        const piece = tempBoard[fromRow][fromCol];
        
        // Vérifier si la case d'arrivée est occupée par une pièce de la même couleur
        const targetPiece = tempBoard[toRow][toCol];
        if (targetPiece && this.isPieceColor(targetPiece, color)) {
            if (this.constructor.consoleLog) {
                console.log(`       ❌ Case occupée par une pièce de même couleur`);
            }
            return false;
        }
        
        // Exécuter le mouvement temporairement
        tempBoard[toRow][toCol] = piece;
        tempBoard[fromRow][fromCol] = null;
        
        // Vérifier si le roi est toujours en échec après le mouvement
        const fen = this.generateFENFromBoard(tempBoard, color);
        const tempEngine = new ChessEngine(fen);
        const stillInCheck = tempEngine.isKingInCheck(color);
        
        if (this.constructor.consoleLog) {
            console.log(`       ${stillInCheck ? '❌ Maintien échec' : '✅ Échappe à l\'échec'}`);
        }
        
        return !stillInCheck;
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
        
        // Tour actuel (inversé car on teste les coups)
        const nextPlayer = currentPlayer === 'w' ? 'b' : 'w';
        fen += ` ${nextPlayer} KQkq - 0 1`;
        
        return fen;
    }

    // Méthodes de génération des mouvements par type de pièce
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

    getKnightMoves(moves, piece, row, col) {
        const directions = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidSquare(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
                if (!target || this.isPieceColor(target, pieceColor === 'w' ? 'b' : 'w')) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    getBishopMoves(moves, piece, row, col) {
        this.getSlidingMoves(moves, piece, row, col, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    }

    getRookMoves(moves, piece, row, col) {
        this.getSlidingMoves(moves, piece, row, col, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
    }

    getQueenMoves(moves, piece, row, col) {
        this.getSlidingMoves(moves, piece, row, col, [
            [-1, -1], [-1, 1], [1, -1], [1, 1],
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ]);
    }

    getKingMoves(moves, piece, row, col) {
        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidSquare(newRow, newCol)) {
                const target = this.getPiece(newRow, newCol);
                const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
                if (!target || this.isPieceColor(target, pieceColor === 'w' ? 'b' : 'w')) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    getSlidingMoves(moves, piece, row, col, directions) {
        const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
        
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

    // NOUVELLE MÉTHODE : Test rapide de position
    static testPosition(fen, expectedMateColor = null) {
        console.group('🧪 TEST POSITION CHESSMATE');
        console.log('FEN:', fen);
        
        const engine = new ChessMateEngine(fen);
        engine.displayBoard();
        
        const whiteMate = engine.isCheckmate('w');
        const blackMate = engine.isCheckmate('b');
        const whiteStale = engine.isStalemate('w');
        const blackStale = engine.isStalemate('b');
        
        console.log('Résultats:');
        console.log(`• Échec et mat Blancs: ${whiteMate ? '✅ OUI' : '❌ NON'}`);
        console.log(`• Échec et mat Noirs: ${blackMate ? '✅ OUI' : '❌ NON'}`);
        console.log(`• Pat Blancs: ${whiteStale ? '✅ OUI' : '❌ NON'}`);
        console.log(`• Pat Noirs: ${blackStale ? '✅ OUI' : '❌ NON'}`);
        
        if (expectedMateColor) {
            const mateDetected = expectedMateColor === 'w' ? whiteMate : blackMate;
            console.log(`\n${mateDetected ? '✅' : '❌'} Résultat attendu: ${expectedMateColor === 'w' ? 'Blancs' : 'Noirs'} mat - ${mateDetected ? 'CORRECT' : 'INCORRECT'}`);
        }
        
        console.groupEnd();
        
        return {
            whiteCheckmate: whiteMate,
            blackCheckmate: blackMate,
            whiteStalemate: whiteStale,
            blackStalemate: blackStale
        };
    }
}

// Initialisation statique
ChessMateEngine.init();

// Exposer la classe globalement
window.ChessMateEngine = ChessMateEngine;

// Fonction de test pour votre position
window.testMatePosition = function() {
    const testFEN = "8/8/8/2n4r/8/8/5k1K/8 w - - 33 48";
    console.log('\n🔍🔍🔍 TEST POSITION SPÉCIFIQUE 🔍🔍🔍');
    console.log('Analyse de la position:', testFEN);
    
    const engine = new ChessMateEngine(testFEN);
    
    // Afficher le plateau
    console.log('\n📊 PLATEAU:');
    console.log('   a b c d e f g h');
    for (let row = 0; row < 8; row++) {
        let line = `${8 - row} `;
        for (let col = 0; col < 8; col++) {
            const piece = engine.getPiece(row, col);
            line += (piece || '.') + ' ';
        }
        console.log(line + ` ${8 - row}`);
    }
    console.log('   a b c d e f g h');
    
    // Positions spécifiques
    console.log('\n📍 POSITIONS CLÉS:');
    console.log('• Roi blanc (K) position attendue: h1 → [7,7]?', engine.getPiece(7, 7));
    console.log('• Roi noir (k) position attendue: f2 → [6,5]?', engine.getPiece(6, 5));
    console.log('• Tour noire (r) position attendue: h5 → [3,7]?', engine.getPiece(3, 7));
    console.log('• Cavalier noir (n) position attendue: c5 → [3,2]?', engine.getPiece(3, 2));
    
    // Vérifications
    console.log('\n🔍 ANALYSE:');
    console.log('• Tour attaque roi blanc?', engine.isSquareAttacked(7, 7, 'b'));
    console.log('• Échec roi blanc?', engine.isKingInCheck('w'));
    console.log('• Échec roi noir?', engine.isKingInCheck('b'));
    console.log('• Échec et mat Blancs?', engine.isCheckmate('w'));
    console.log('• Échec et mat Noirs?', engine.isCheckmate('b'));
    
    return engine;
};

// Test automatique au chargement si en debug
setTimeout(() => {
    if (ChessMateEngine.consoleLog) {
        console.log('🧪 ChessMateEngine prêt - testez avec testMatePosition()');
    }
}, 1000);