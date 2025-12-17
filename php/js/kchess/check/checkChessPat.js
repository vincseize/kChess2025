// check/checkChessPat.js - Vérification du pat (égalité) avec consoleLog configurable
class ChessPatEngine extends ChessEngine {
    
    static consoleLog = true; // Valeur par défaut - sera écrasée par la config JSON
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('check/checkChessPat.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            console.info('🔇 checkChessPat.js: Mode silencieux activé');
        }
    }
    
    // Méthode pour charger la configuration depuis window.appConfig
    static loadConfig() {
        try {
            // Vérifier si la configuration globale existe
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                
                // CONVERSION CORRECTE - Gérer les string "false" et "true"
                if (configValue === "false") {
                    this.consoleLog = false;
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
                    console.log(`⚙️ ChessPatEngine: Configuration chargée - console_log = ${this.consoleLog}`);
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
                console.warn('⚠️ ChessPatEngine: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessPatEngine: Erreur lors du chargement de la config:', error);
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

    constructor(fen) {
        super(fen);
        
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log('🔧 ChessPatEngine créé');
            console.log(`📊 Source config: ${this.constructor.getConfigSource()}`);
        } else {
            console.info('🔧 ChessPatEngine créé (mode silencieux)');
        }
    }

    // Vérifier le pat (égalité)
    isStalemate(color) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            // 1. Le roi n'est PAS en échec
            if (this.isKingInCheck(color)) {
                return false;
            }
            
            // 2. Aucun coup légal possible
            return !this.hasAnyLegalMoves(color);
        }
        
        // Mode debug
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
        // Mode silencieux
        if (!this.constructor.consoleLog) {
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
                                return true; // Au moins un coup légal existe
                            }
                        }
                    }
                }
            }
            return false; // Aucun coup légal
        }
        
        // Mode debug
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

isMoveLegal(color, fromRow, fromCol, toRow, toCol) {
    if (ChessEngine.consoleLog) {
        console.log(`\n🔍 isMoveLegal: ${color} [${fromRow},${fromCol}] -> [${toRow},${toCol}]`);
    }
    
    // Vérifier si c'est un roi qui bouge
    const piece = this.getPiece(fromRow, fromCol);
    if (piece && piece.toLowerCase() === 'k') {
        // Vérifier la proximité avec le roi adverse
        const opponentColor = color === 'w' ? 'b' : 'w';
        const opponentKingPos = this.findKing(opponentColor);
        
        if (opponentKingPos) {
            const rowDiff = Math.abs(toRow - opponentKingPos.row);
            const colDiff = Math.abs(toCol - opponentKingPos.col);
            const isAdjacentToOpponentKing = rowDiff <= 1 && colDiff <= 1;
            
            if (isAdjacentToOpponentKing) {
                if (ChessEngine.consoleLog) {
                    console.log(`❌ Mouvement illégal: roi ne peut pas être adjacent au roi adverse`);
                }
                return false;
            }
        }
    }
    
    // Créer une copie du plateau pour simulation
    const tempBoard = this.createTempBoard();
    
    // Vérifier si la case d'arrivée est occupée par une pièce de la même couleur
    const targetPiece = tempBoard[toRow][toCol];
    if (targetPiece && this.isPieceColor(targetPiece, color)) {
        return false;
    }
    
    // Exécuter le mouvement
    tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
    tempBoard[fromRow][fromCol] = null;
    
    // Vérifier si le roi est en échec après le mouvement
    const fen = this.generateFENFromBoard(tempBoard, color); // Garder la même couleur
    const tempEngine = new ChessEngine(fen);
    
    // Vérifier si le roi qui a joué est en échec
    const isInCheck = tempEngine.isKingInCheck(color);
    
    if (ChessEngine.consoleLog) {
        console.log(`  FEN après mouvement: ${fen}`);
        console.log(`  Roi ${color} en échec après mouvement: ${isInCheck}`);
        console.log(`  Mouvement légal: ${!isInCheck}`);
    }
    
    return !isInCheck;
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
    
    // Méthode pour forcer la mise à jour de la configuration
    static reloadConfig() {
        const oldValue = this.consoleLog;
        this.loadConfig();
        
        if (this.consoleLog && oldValue !== this.consoleLog) {
            console.log(`🔄 ChessPatEngine: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
        }
        return this.consoleLog;
    }
    
    /**
     * Configurer le mode debug
     */
    static setDebugMode(enabled) {
        this.consoleLog = enabled;
        console.log(`🔧 ChessPatEngine debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }
}

// Initialisation statique
ChessPatEngine.init();

// Exposer des fonctions utilitaires globales
window.ChessPatEngineUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => ChessPatEngine.reloadConfig(),
    
    // Tester la configuration
    testConfig: () => {
        console.group('🧪 Test de configuration ChessPatEngine');
        console.log('consoleLog actuel:', ChessPatEngine.consoleLog);
        console.log('Source config:', ChessPatEngine.getConfigSource());
        console.log('window.appConfig disponible:', !!window.appConfig);
        
        if (window.appConfig) {
            console.log('Valeur debug.console_log dans appConfig:', 
                window.appConfig.debug?.console_log, 
                '(type:', typeof window.appConfig.debug?.console_log + ')');
        }
        
        console.log('Mode debug activé:', ChessPatEngine.isDebugMode());
        console.groupEnd();
        
        return ChessPatEngine.consoleLog;
    },
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: ChessPatEngine.consoleLog,
        source: ChessPatEngine.getConfigSource(),
        debugMode: ChessPatEngine.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Vérifier la configuration JSON
    checkJSONConfig: () => {
        if (window.appConfig) {
            return {
                exists: true,
                debug: window.appConfig.debug,
                console_log_value: window.appConfig.debug?.console_log,
                console_log_type: typeof window.appConfig.debug?.console_log
            };
        }
        return { exists: false };
    },
    
    // Tester le moteur de pat
    testEngine: (fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", color = "w") => {
        console.log('🧪 Test ChessPatEngine avec FEN:', fen);
        const engine = new ChessPatEngine(fen);
        
        // Exécuter les vérifications uniquement si debug activé
        if (ChessPatEngine.consoleLog) {
            console.log('✓ Pat pour', color, '?', engine.isStalemate(color));
            console.log('✓ Coups légaux pour', color, '?', engine.hasAnyLegalMoves(color));
        }
        
        return engine;
    }
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ChessPatEngine.loadConfig();
            if (ChessPatEngine.consoleLog) {
                console.log('✅ ChessPatEngine: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        ChessPatEngine.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (ChessPatEngine.consoleLog) {
    console.log('✅ ChessPatEngine prêt (mode debug activé)');
} else {
    console.info('✅ ChessPatEngine prêt (mode silencieux)');
}

window.ChessPatEngine = ChessPatEngine;