// validators/move-pieces/move-validator-bishop.js - Version utilisant la configuration JSON comme priorité
class BishopMoveValidator {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('♝ validators/move-pieces/move-validator-bishop.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('♝ BishopMoveValidator: Mode silencieux activé (debug désactivé dans config)');
        }
    }
    
    // Méthode pour charger la configuration
    static loadConfig() {
        try {
            // Vérifier si la configuration globale existe
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                
                // CONVERSION CORRECTE - Gérer les string "false" et "true"
                if (configValue === "false") {
                    this.consoleLog = false;
                    if (configValue !== "false") {
                        console.info('🔧 BishopMoveValidator: console_log désactivé via config JSON');
                    }
                } else if (configValue === false) {
                    this.consoleLog = false;
                } else if (configValue === "true") {
                    this.consoleLog = true;
                } else if (configValue === true) {
                    this.consoleLog = true;
                } else {
                    // Pour toute autre valeur, utiliser Boolean()
                    this.consoleLog = Boolean(configValue);
                }
                
                // Log de confirmation (uniquement en mode debug)
                if (this.consoleLog) {
                    console.log(`⚙️ BishopMoveValidator: Configuration chargée - console_log = ${this.consoleLog} (valeur brute: "${configValue}")`);
                }
                return true;
            }
            
            // Si window.appConfig n'existe pas, essayer de le charger via fonction utilitaire
            if (typeof window.getConfig === 'function') {
                const configValue = window.getConfig('debug.console_log', 'true');
                
                if (configValue === "false") {
                    this.consoleLog = false;
                } else if (configValue === false) {
                    this.consoleLog = false;
                } else {
                    this.consoleLog = Boolean(configValue);
                }
                return true;
            }
            
            // Si rien n'est disponible, garder la valeur par défaut
            if (this.consoleLog) {
                console.warn('⚠️ BishopMoveValidator: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ BishopMoveValidator: Erreur lors du chargement de la config:', error);
            return false;
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig) {
            return 'JSON config';
        } else if (typeof window.getConfig === 'function') {
            return 'fonction getConfig';
        } else {
            return 'valeur par défaut';
        }
    }
    
    // Méthode pour vérifier si on est en mode debug
    static isDebugMode() {
        return this.consoleLog;
    }

    constructor(board, gameState) {
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        this.board = board;
        this.gameState = gameState;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 BishopMoveValidator initialisé');
            console.log(`  - Board: ${board ? '✓' : '✗'}`);
            console.log(`  - GameState: ${gameState ? '✓' : '✗'}`);
        }
    }

    getPossibleMoves(piece, row, col) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const moves = [];
            const directions = [
                [1, 1],   // ↘️ SE (bas-droite)
                [1, -1],  // ↙️ SO (bas-gauche)
                [-1, 1],  // ↗️ NE (haut-droite)
                [-1, -1]  // ↖️ NO (haut-gauche)
            ];

            const pieceColor = piece.color;

            // Générer tous les mouvements possibles
            directions.forEach(([rowDir, colDir]) => {
                this.addSlidingMoves(moves, piece, row, col, rowDir, colDir);
            });

            // Filtrer les mouvements qui mettraient le roi en échec
            const validMoves = moves.filter(move => {
                return !this.wouldKingBeInCheckAfterMove(pieceColor, row, col, move.row, move.col);
            });

            return validMoves;
        }
        
        // Mode debug
        console.log(`\n🗂️🔍 Recherche mouvements pour fou ${piece.color} en [${row},${col}]`);
        
        const moves = [];
        const directions = [
            [1, 1],   // ↘️ SE (bas-droite)
            [1, -1],  // ↙️ SO (bas-gauche)
            [-1, 1],  // ↗️ NE (haut-droite)
            [-1, -1]  // ↖️ NO (haut-gauche)
        ];

        const pieceColor = piece.color;

        console.log(`🗂️ Directions diagonales: ${directions.length} directions`);

        // Générer tous les mouvements possibles
        directions.forEach(([rowDir, colDir], index) => {
            const directionNames = ['↘️ SE', '↙️ SO', '↗️ NE', '↖️ NO'];
            console.log(`\n  Exploration ${directionNames[index]}: [${rowDir},${colDir}]`);
            
            this.addSlidingMoves(moves, piece, row, col, rowDir, colDir);
        });

        console.log(`\n🗂️📊 Résultat brut: ${moves.length} mouvements trouvés`);
        if (moves.length > 0) {
            moves.forEach((move, index) => {
                const typeIcon = move.type === 'capture' ? '⚔️' : '➡️';
                console.log(`  ${index + 1}. ${typeIcon} [${move.row},${move.col}] (${move.type})`);
            });
        }

        // Filtrer les mouvements qui mettraient le roi en échec
        console.log(`\n🗂️🛡️ Vérification échec au roi pour ${pieceColor}`);
        
        const validMoves = moves.filter(move => {
            const wouldBeInCheck = this.wouldKingBeInCheckAfterMove(pieceColor, row, col, move.row, move.col);
            
            if (wouldBeInCheck) {
                console.log(`  ❌ Mouvement [${row},${col}]->[${move.row},${move.col}] → mettrait le roi en échec`);
            } else {
                console.log(`  ✓ Mouvement [${row},${col}]->[${move.row},${move.col}] (${move.type}) → sûr`);
            }
            
            return !wouldBeInCheck;
        });

        const filteredCount = moves.length - validMoves.length;
        console.log(`\n🗂️✅ FINAL: Fou ${pieceColor} en [${row},${col}]`);
        console.log(`  - Mouvements bruts: ${moves.length}`);
        console.log(`  - Mouvements valides: ${validMoves.length}`);
        console.log(`  - Mouvements filtrés: ${filteredCount}`);
        
        if (validMoves.length > 0) {
            console.log(`  Mouvements valides:`);
            validMoves.forEach((move, index) => {
                const typeIcon = move.type === 'capture' ? '⚔️' : ' ';
                console.log(`  ${index + 1}. [${move.row},${move.col}] ${typeIcon}`);
            });
        } else {
            console.log(`  ⚠️ Aucun mouvement valide disponible`);
        }
        
        return validMoves;
    }

    addSlidingMoves(moves, piece, startRow, startCol, rowDir, colDir) {
        let row = startRow + rowDir;
        let col = startCol + colDir;
        let distance = 1;

        // Mode silencieux
        if (!this.constructor.consoleLog) {
            while (this.isValidSquare(row, col)) {
                const targetPiece = this.board.getPiece(row, col);
                
                if (!targetPiece) {
                    moves.push({ row, col, type: 'move', distance });
                } else {
                    if (targetPiece.color !== piece.color) {
                        moves.push({ row, col, type: 'capture', distance });
                    }
                    break;
                }
                
                row += rowDir;
                col += colDir;
                distance++;
            }
            return;
        }
        
        // Mode debug
        console.log(`    Exploration diagonale [${rowDir},${colDir}] depuis [${startRow},${startCol}]`);

        while (this.isValidSquare(row, col)) {
            const targetPiece = this.board.getPiece(row, col);
            
            if (!targetPiece) {
                moves.push({ row, col, type: 'move', distance });
                console.log(`      Distance ${distance}: [${row},${col}] → case vide`);
            } else {
                if (targetPiece.color !== piece.color) {
                    moves.push({ row, col, type: 'capture', distance });
                    console.log(`      Distance ${distance}: [${row},${col}] → ⚔️ capture ${targetPiece.color} ${targetPiece.type}`);
                } else {
                    console.log(`      Distance ${distance}: [${row},${col}] → ❌ blocage par ${targetPiece.color} ${targetPiece.type}`);
                }
                break;
            }
            
            row += rowDir;
            col += colDir;
            distance++;
        }

        if (distance === 1) {
            console.log(`      Aucun mouvement possible dans cette direction`);
        }
    }

    // Vérifier si le mouvement mettrait le roi en échec
    wouldKingBeInCheckAfterMove(pieceColor, fromRow, fromCol, toRow, toCol) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                // Créer une simulation du plateau
                const tempBoard = this.createTempBoard();
                
                // Déplacer le fou temporairement
                const bishopPiece = tempBoard[fromRow][fromCol];
                tempBoard[toRow][toCol] = bishopPiece;
                tempBoard[fromRow][fromCol] = null;
                
                // Générer un FEN temporaire
                const tempFEN = this.generateTempFEN(tempBoard, pieceColor);
                
                // Vérifier l'échec
                const engine = new ChessEngine(tempFEN);
                const colorCode = pieceColor === 'white' ? 'w' : 'b';
                return engine.isKingInCheck(colorCode);
                
            } catch (error) {
                return true; // En cas d'erreur, on bloque le mouvement par sécurité
            }
        }
        
        // Mode debug
        console.log(`    ↳ Simulation: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        
        try {
            // Créer une simulation du plateau
            const tempBoard = this.createTempBoard();
            
            // Déplacer le fou temporairement
            const bishopPiece = tempBoard[fromRow][fromCol];
            tempBoard[toRow][toCol] = bishopPiece;
            tempBoard[fromRow][fromCol] = null;
            
            console.log(`      Simulation créée: fou déplacé`);
            
            // Générer un FEN temporaire
            const tempFEN = this.generateTempFEN(tempBoard, pieceColor);
            
            console.log(`      FEN généré: ${tempFEN.substring(0, 30)}...`);
            
            // Vérifier l'échec
            const engine = new ChessEngine(tempFEN);
            const colorCode = pieceColor === 'white' ? 'w' : 'b';
            const isInCheck = engine.isKingInCheck(colorCode);
            
            console.log(`      Résultat: ${isInCheck ? 'ROI EN ÉCHEC ⚠️' : 'roi en sécurité ✓'}`);
            
            return isInCheck;
            
        } catch (error) {
            console.error(`❌ Erreur dans wouldKingBeInCheckAfterMove:`, error);
            return true; // En cas d'erreur, on bloque le mouvement par sécurité
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
        const isValid = row >= 0 && row < 8 && col >= 0 && col < 8;
        return isValid;
    }
    
    // NOUVELLE MÉTHODE : Obtenir des statistiques sur les mouvements
    getMovementStats(piece, row, col) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const moves = this.getPossibleMoves(piece, row, col);
            return {
                totalMoves: moves.length,
                captures: moves.filter(m => m.type === 'capture').length,
                normalMoves: moves.filter(m => m.type === 'move').length,
                pieceColor: piece.color,
                pieceType: 'bishop',
                position: { row, col }
            };
        }
        
        // Mode debug
        console.group('📊 Statistiques des mouvements du fou');
        
        const moves = this.getPossibleMoves(piece, row, col);
        const captures = moves.filter(m => m.type === 'capture').length;
        const normalMoves = moves.filter(m => m.type === 'move').length;
        
        const stats = {
            totalMoves: moves.length,
            captures: captures,
            normalMoves: normalMoves,
            pieceColor: piece.color,
            pieceType: 'bishop',
            position: { row, col },
            percentageCapture: moves.length > 0 ? Math.round((captures / moves.length) * 100) : 0
        };
        
        console.log('Position:', { row, col });
        console.log('Couleur:', piece.color);
        console.log('Total mouvements:', moves.length);
        console.log('Captures:', captures);
        console.log('Mouvements normaux:', normalMoves);
        console.log('% de captures:', stats.percentageCapture + '%');
        
        // Analyser les directions disponibles
        const directions = [
            { name: 'SE', vector: [1, 1] },
            { name: 'SO', vector: [1, -1] },
            { name: 'NE', vector: [-1, 1] },
            { name: 'NO', vector: [-1, -1] }
        ];
        
        console.log('Directions analysées:');
        directions.forEach(dir => {
            let maxDistance = 0;
            let hasCapture = false;
            let hasMove = false;
            
            // Analyser cette direction
            let currentRow = row + dir.vector[0];
            let currentCol = col + dir.vector[1];
            let distance = 1;
            
            while (this.isValidSquare(currentRow, currentCol)) {
                const targetPiece = this.board.getPiece(currentRow, currentCol);
                
                if (!targetPiece) {
                    hasMove = true;
                    maxDistance = distance;
                } else {
                    if (targetPiece.color !== piece.color) {
                        hasCapture = true;
                        maxDistance = distance;
                    }
                    break;
                }
                
                currentRow += dir.vector[0];
                currentCol += dir.vector[1];
                distance++;
            }
            
            console.log(`  ${dir.name}: distance=${maxDistance}, move=${hasMove}, capture=${hasCapture}`);
        });
        
        console.groupEnd();
        
        return stats;
    }
    
    // NOUVELLE MÉTHODE : Tester la logique du validateur
    testValidator(piece, row, col) {
        // Mode silencieux - retourner juste les mouvements
        if (!this.constructor.consoleLog) {
            return this.getPossibleMoves(piece, row, col);
        }
        
        // Mode debug
        console.group('🧪 Test du BishopMoveValidator');
        
        console.log('Pièce à tester:');
        console.log('  - Type: bishop');
        console.log('  - Couleur:', piece.color);
        console.log('  - Position:', { row, col });
        
        // Tester isValidSquare
        console.log('\nTest isValidSquare:');
        const testSquares = [
            { row: 0, col: 0, expected: true },
            { row: 7, col: 7, expected: true },
            { row: -1, col: 0, expected: false },
            { row: 0, col: 8, expected: false },
            { row: 8, col: 8, expected: false }
        ];
        
        testSquares.forEach(test => {
            const result = this.isValidSquare(test.row, test.col);
            const passed = result === test.expected;
            console.log(`  [${test.row},${test.col}] → ${result} ${passed ? '✅' : '❌'}`);
        });
        
        // Tester pieceToFEN
        console.log('\nTest pieceToFEN:');
        const testPieces = [
            { piece: { type: 'bishop', color: 'white' }, expected: 'B' },
            { piece: { type: 'bishop', color: 'black' }, expected: 'b' },
            { piece: { type: 'queen', color: 'white' }, expected: 'Q' },
            { piece: { type: 'queen', color: 'black' }, expected: 'q' }
        ];
        
        testPieces.forEach(test => {
            const result = this.pieceToFEN(test.piece);
            const passed = result === test.expected;
            console.log(`  ${test.piece.color} ${test.piece.type} → "${result}" ${passed ? '✅' : '❌'}`);
        });
        
        // Obtenir les mouvements
        console.log('\nTest getPossibleMoves:');
        const moves = this.getPossibleMoves(piece, row, col);
        console.log('  Nombre de mouvements:', moves.length);
        
        if (moves.length > 0) {
            console.log('  Détails des mouvements:');
            moves.forEach((move, index) => {
                console.log(`  ${index + 1}. [${move.row},${move.col}] type: ${move.type}`);
            });
        }
        
        // Tester wouldKingBeInCheckAfterMove
        console.log('\nTest wouldKingBeInCheckAfterMove:');
        if (moves.length > 0) {
            const testMove = moves[0];
            const result = this.wouldKingBeInCheckAfterMove(piece.color, row, col, testMove.row, testMove.col);
            console.log(`  Premier mouvement [${row},${col}]→[${testMove.row},${testMove.col}]`);
            console.log(`  Mettrait le roi en échec? ${result ? '✅ OUI' : '❌ NON'}`);
        } else {
            console.log('  Aucun mouvement à tester');
        }
        
        console.groupEnd();
        
        return {
            testSquares: testSquares,
            testPieces: testPieces,
            moves: moves,
            isValid: this.isValidSquare(row, col)
        };
    }
}

// Initialisation statique
BishopMoveValidator.init();

// Exposer la classe globalement
window.BishopMoveValidator = BishopMoveValidator;

// Ajouter des fonctions utilitaires globales
window.BishopMoveValidatorUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => BishopMoveValidator.reloadConfig(),
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: BishopMoveValidator.consoleLog,
        source: BishopMoveValidator.getConfigSource(),
        debugMode: BishopMoveValidator.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Activer/désactiver manuellement (temporaire)
    setConsoleLog: (value) => {
        const oldValue = BishopMoveValidator.consoleLog;
        BishopMoveValidator.consoleLog = Boolean(value);
        console.log(`🔧 BishopMoveValidator: consoleLog changé manuellement: ${oldValue} → ${BishopMoveValidator.consoleLog}`);
        return BishopMoveValidator.consoleLog;
    },
    
    // Tester la création d'un validateur
    testBishopValidator: (board, gameState) => {
        console.group('🧪 Test BishopMoveValidator');
        const validator = new BishopMoveValidator(board, gameState);
        console.log('Validateur créé:', validator);
        console.log('Statut config:', BishopMoveValidator.getConfigStatus());
        console.groupEnd();
        return validator;
    },
    
    // Tester les mouvements d'un fou spécifique
    testBishopMoves: (validator, piece, row, col) => {
        if (!validator || !validator.getPossibleMoves) {
            console.log('❌ Validateur ou méthode getPossibleMoves non disponible');
            return null;
        }
        
        console.group(`🧪 Test mouvements fou en [${row},${col}]`);
        
        // Test basique
        const moves = validator.getPossibleMoves(piece, row, col);
        console.log('Mouvements trouvés:', moves.length);
        
        // Test avancé si disponible
        if (validator.testValidator) {
            console.log('\nTest complet du validateur:');
            const testResults = validator.testValidator(piece, row, col);
            console.log('Résultats du test:', testResults);
        }
        
        // Statistiques si disponibles
        if (validator.getMovementStats) {
            console.log('\nStatistiques des mouvements:');
            const stats = validator.getMovementStats(piece, row, col);
            console.log('Statistiques:', stats);
        }
        
        console.groupEnd();
        
        return {
            moves: moves,
            piece: piece,
            position: { row, col }
        };
    }
};

// Méthode statique pour obtenir le statut de la configuration
BishopMoveValidator.getConfigStatus = function() {
    return {
        consoleLog: this.consoleLog,
        source: this.getConfigSource(),
        debugMode: this.isDebugMode(),
        appConfigAvailable: !!window.appConfig,
        configValue: window.appConfig?.debug?.console_log
    };
};

// Méthode statique pour forcer la mise à jour de la configuration
BishopMoveValidator.reloadConfig = function() {
    const oldValue = this.consoleLog;
    this.loadConfig();
    
    if (this.consoleLog && oldValue !== this.consoleLog) {
        console.log(`🔄 BishopMoveValidator: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
    }
    return this.consoleLog;
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            BishopMoveValidator.loadConfig();
            if (BishopMoveValidator.consoleLog) {
                console.log('✅ BishopMoveValidator: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        BishopMoveValidator.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (BishopMoveValidator.consoleLog) {
    console.log('✅ BishopMoveValidator prêt (mode debug activé)');
} else {
    console.info('✅ BishopMoveValidator prêt (mode silencieux)');
}