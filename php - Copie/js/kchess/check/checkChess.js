// check/checkChess.js - Moteur de vérification d'échec simple avec priorité à la config JSON
class ChessEngine {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('✅ check/checkChess.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            console.info('🔇 checkChess.js: Mode silencieux activé');
        }
    }
    
    // Méthode pour charger la configuration CORRIGÉE
    static loadConfig(debugLoading = false) {
        try {
            if (debugLoading && this.consoleLog) {
                console.log('🔄 ChessEngine.loadConfig() appelé');
                console.log('🔍 Recherche de window.appConfig...');
            }
            
            // Vérifier si la configuration globale existe
            if (window.appConfig) {
                if (debugLoading && this.consoleLog) {
                    console.log('✅ window.appConfig trouvé');
                }
                
                if (window.appConfig.debug) {
                    const configValue = window.appConfig.debug.console_log;
                    
                    if (debugLoading && this.consoleLog) {
                        console.log(`📊 Valeur debug.console_log: "${configValue}" (type: ${typeof configValue})`);
                    }
                    
                    // CONVERSION CORRECTE - Gérer les string "false" et "true"
                    let newConsoleLog;
                    if (configValue === "false") {
                        newConsoleLog = false;
                    } else if (configValue === false) {
                        newConsoleLog = false;
                    } else if (configValue === "true") {
                        newConsoleLog = true;
                    } else if (configValue === true) {
                        newConsoleLog = true;
                    } else {
                        // Pour toute autre valeur, utiliser Boolean()
                        newConsoleLog = Boolean(configValue);
                    }
                    
                    // Mettre à jour seulement si la valeur a changé
                    if (this.consoleLog !== newConsoleLog) {
                        if (debugLoading && this.consoleLog) {
                            console.log(`🔄 Changement de consoleLog: ${this.consoleLog} → ${newConsoleLog}`);
                        }
                        this.consoleLog = newConsoleLog;
                    } else if (debugLoading && this.consoleLog) {
                        console.log(`ℹ️ Pas de changement (déjà ${this.consoleLog})`);
                    }
                    
                    if (debugLoading && this.consoleLog) {
                        console.log(`🔧 Configuration finale: console_log = ${this.consoleLog}`);
                    }
                    
                    return true;
                } else if (debugLoading && this.consoleLog) {
                    console.log('❌ window.appConfig.debug NON TROUVÉ');
                }
            } else if (debugLoading && this.consoleLog) {
                console.log('❌ window.appConfig NON DÉFINI');
            }
            
            // Si window.appConfig n'existe pas, essayer de le charger via fonction utilitaire
            if (typeof window.getConfig === 'function') {
                if (debugLoading && this.consoleLog) {
                    console.log('🔍 Appel de window.getConfig()...');
                }
                const configValue = window.getConfig('debug.console_log', 'true');
                
                if (configValue === "false") {
                    this.consoleLog = false;
                } else if (configValue === false) {
                    this.consoleLog = false;
                } else {
                    this.consoleLog = Boolean(configValue);
                }
                
                if (debugLoading && this.consoleLog) {
                    console.log(`📊 Valeur getConfig: "${configValue}" → ${this.consoleLog}`);
                }
                return true;
            }
            
            // Si rien n'est disponible, garder la valeur par défaut
            if (this.consoleLog && debugLoading) {
                console.log('⚠️ ChessEngine: Aucune configuration trouvée, utilisation de la valeur par défaut');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessEngine: Erreur lors du chargement de la config:', error);
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
        this.fen = fen;
        this.board = this.parseFEN(fen);
        const parts = fen.split(' ');
        this.turn = parts[1]; // 'w' pour blanc, 'b' pour noir
        
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log('🔧 ChessEngine créé avec FEN:', fen.substring(0, 50) + (fen.length > 50 ? '...' : ''));
            console.log(`📊 Source config: ${this.constructor.getConfigSource()}`);
            this.displayBoard(); // Afficher le plateau à la création
        } else {
            console.info('🔧 ChessEngine créé (mode silencieux)');
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
        if (this.constructor.consoleLog) {
            console.log(`👑 Recherche du roi ${color === 'w' ? 'blanc' : 'noir'}`);
        }
        
        const king = color === 'w' ? 'K' : 'k';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === king) {
                    if (this.constructor.consoleLog) {
                        console.log(`👑✅ Roi ${color === 'w' ? 'blanc' : 'noir'} trouvé en [${row},${col}]`);
                    }
                    return { row, col };
                }
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`👑❌ Roi ${color === 'w' ? 'blanc' : 'noir'} NON TROUVÉ!`);
        }
        return null;
    }

    isSquareAttacked(row, col, attackerColor) {
        // Mode silencieux - exécuter sans logs
        if (!this.constructor.consoleLog) {
            const directions = {
                rook: [[-1,0], [1,0], [0,-1], [0,1]],
                bishop: [[-1,-1], [-1,1], [1,-1], [1,1]],
                queen: [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]],
                knight: [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]]
            };

            const pawnAttacks = attackerColor === 'w' 
                ? [[1, -1], [1, 1]]   // Pions blancs attaquent vers le bas
                : [[-1, -1], [-1, 1]]; // Pions noirs attaquent vers le haut

            // Vérifier les pions
            for (const [dr, dc] of pawnAttacks) {
                const r = row + dr, c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const piece = this.getPiece(r, c);
                    const pawn = attackerColor === 'w' ? 'P' : 'p';
                    if (piece === pawn) return true;
                }
            }

            // Vérifier les cavaliers
            for (const [dr, dc] of directions.knight) {
                const r = row + dr, c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const piece = this.getPiece(r, c);
                    const knight = attackerColor === 'w' ? 'N' : 'n';
                    if (piece === knight) return true;
                }
            }

            // Vérifier les directions (tours, fous, dame)
            for (const [type, dirs] of [['rook', directions.rook], ['bishop', directions.bishop], ['queen', directions.queen]]) {
                for (const [dr, dc] of dirs) {
                    let r = row + dr, c = col + dc;
                    
                    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                        const piece = this.getPiece(r, c);
                        if (piece) {
                            const pieceType = piece.toLowerCase();
                            const isAttackerColor = (attackerColor === 'w') === (piece === piece.toUpperCase());
                            
                            if (isAttackerColor) {
                                if (type === 'rook' && (pieceType === 'r' || pieceType === 'q')) return true;
                                if (type === 'bishop' && (pieceType === 'b' || pieceType === 'q')) return true;
                                if (type === 'queen' && pieceType === 'q') return true;
                            }
                            break;
                        }
                        r += dr;
                        c += dc;
                    }
                }
            }
            
            return false;
        }
        
        // Mode debug - avec logs
        if (this.constructor.consoleLog) {
            console.log(`\n🔍🔍🔍 Vérification case [${row},${col}] attaquée par ${attackerColor === 'w' ? 'blancs' : 'noirs'}`);
        }
        
        const directions = {
            rook: [[-1,0], [1,0], [0,-1], [0,1]],
            bishop: [[-1,-1], [-1,1], [1,-1], [1,1]],
            queen: [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]],
            knight: [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]]
        };

        const pawnAttacks = attackerColor === 'w' 
            ? [[1, -1], [1, 1]]   // Pions blancs attaquent vers le bas
            : [[-1, -1], [-1, 1]]; // Pions noirs attaquent vers le haut

        if (this.constructor.consoleLog) {
            console.log(`🎯 Directions d'attaque des pions ${attackerColor}:`, pawnAttacks);
        }

        // Vérifier les pions
        for (const [dr, dc] of pawnAttacks) {
            const r = row + dr, c = col + dc;
            
            if (this.constructor.consoleLog) {
                console.log(`  → Vérification case [${r},${c}] pour un pion ${attackerColor}`);
            }
            
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                const pawn = attackerColor === 'w' ? 'P' : 'p';
                
                if (this.constructor.consoleLog) {
                    console.log(`    Pièce trouvée: '${piece}', attendu: '${pawn}'`);
                }
                
                if (piece === pawn) {
                    if (this.constructor.consoleLog) {
                        console.log(`🎯✅✅✅ PION TROUVÉ! Pion ${attackerColor} attaque depuis [${r},${c}] vers [${row},${col}]`);
                    }
                    return true;
                }
            }
        }

        // Vérifier les cavaliers
        for (const [dr, dc] of directions.knight) {
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                const knight = attackerColor === 'w' ? 'N' : 'n';
                if (piece === knight) {
                    if (this.constructor.consoleLog) {
                        console.log(`🐴✅ Cavalier ${attackerColor} attaque depuis [${r},${c}]`);
                    }
                    return true;
                }
            }
        }

        // Vérifier les directions (tours, fous, dame)
        for (const [type, dirs] of [['rook', directions.rook], ['bishop', directions.bishop], ['queen', directions.queen]]) {
            for (const [dr, dc] of dirs) {
                let r = row + dr, c = col + dc;
                
                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const piece = this.getPiece(r, c);
                    if (piece) {
                        const pieceType = piece.toLowerCase();
                        const isAttackerColor = (attackerColor === 'w') === (piece === piece.toUpperCase());
                        
                        if (isAttackerColor) {
                            if (type === 'rook' && (pieceType === 'r' || pieceType === 'q')) {
                                if (this.constructor.consoleLog) {
                                    console.log(`🏰✅ ${type} ${attackerColor} attaque depuis [${r},${c}]`);
                                }
                                return true;
                            }
                            if (type === 'bishop' && (pieceType === 'b' || pieceType === 'q')) {
                                if (this.constructor.consoleLog) {
                                    console.log(`🗼✅ ${type} ${attackerColor} attaque depuis [${r},${c}]`);
                                }
                                return true;
                            }
                            if (type === 'queen' && pieceType === 'q') {
                                if (this.constructor.consoleLog) {
                                    console.log(`👑✅ ${type} ${attackerColor} attaque depuis [${r},${c}]`);
                                }
                                return true;
                            }
                        }
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            }
        }

        if (this.constructor.consoleLog) {
            console.log(`🔍❌❌❌ AUCUNE ATTAQUE détectée sur [${row},${col}]`);
        }
        return false;
    }

    // Vérifie l'échec pour une couleur spécifique
    isKingInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) {
            if (this.constructor.consoleLog) {
                console.log(`❌ Roi ${color} non trouvé!`);
            }
            return false;
        }
        
        if (this.constructor.consoleLog) {
            console.log(`\n♔♔♔ Vérification échec pour roi ${color === 'w' ? 'blanc' : 'noir'} en [${kingPos.row},${kingPos.col}]`);
        }
        
        const attackerColor = color === 'w' ? 'b' : 'w';
        const isInCheck = this.isSquareAttacked(kingPos.row, kingPos.col, attackerColor);
        
        if (this.constructor.consoleLog) {
            const pieceNotation = color === 'w' ? '♔' : '♚';
            const checkStatus = isInCheck ? 'EN ÉCHEC ⚠️' : 'sans échec ✓';
            console.log(`♔ ${pieceNotation} Roi ${color === 'w' ? 'blanc' : 'noir'} en [${kingPos.row},${kingPos.col}] - ${checkStatus}`);
        }
        
        return isInCheck;
    }

    areKingsAdjacent() {
        const whiteKing = this.findKing('w');
        const blackKing = this.findKing('b');
        
        if (!whiteKing || !blackKing) return false;
        
        const rowDiff = Math.abs(whiteKing.row - blackKing.row);
        const colDiff = Math.abs(whiteKing.col - blackKing.col);
        
        const areAdjacent = rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
        
        if (this.constructor.consoleLog) {
            console.log(`👑↔️👑 Rois adjacents? Blanc[${whiteKing.row},${whiteKing.col}] ↔ Noir[${blackKing.row},${blackKing.col}] = ${areAdjacent ? 'OUI ⚠️' : 'NON ✓'}`);
        }
        
        return areAdjacent;
    }

    // Compatibilité
    isCheck() {
        const isCheck = this.isKingInCheck(this.turn);
        
        if (this.constructor.consoleLog) {
            console.log(`⚠️ Vérification échec pour ${this.turn === 'w' ? 'Blancs' : 'Noirs'} (tour actuel): ${isCheck ? 'EN ÉCHEC' : 'Pas d\'échec'}`);
        }
        
        return isCheck;
    }

    // Afficher le plateau complet
    displayBoard() {
        if (!this.constructor.consoleLog) return;
        
        console.log('\n📊📊📊 PLATEAU COMPLET:');
        console.log('   a b c d e f g h');
        for (let row = 0; row < 8; row++) {
            let line = `${8 - row} `;
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                line += (piece || '.') + ' ';
            }
            console.log(line + ` ${8 - row}`);
        }
        console.log('   a b c d e f g h\n');
    }

    // Obtenir un résumé du plateau
    getBoardSummary() {
        if (!this.constructor.consoleLog) return {};
        
        const summary = {
            turn: this.turn === 'w' ? 'Blancs' : 'Noirs',
            whiteKing: this.findKing('w'),
            blackKing: this.findKing('b'),
            whiteInCheck: this.isKingInCheck('w'),
            blackInCheck: this.isKingInCheck('b'),
            kingsAdjacent: this.areKingsAdjacent()
        };
        
        return summary;
    }

    // Afficher le résumé
    displaySummary() {
        if (!this.constructor.consoleLog) return;
        
        console.log('\n📋📋📋 RÉSUMÉ DU PLATEAU:');
        const summary = this.getBoardSummary();
        
        console.log(`Tour actuel: ${summary.turn}`);
        console.log(`Roi blanc: ${summary.whiteKing ? `[${summary.whiteKing.row},${summary.whiteKing.col}]` : 'NON TROUVÉ'}`);
        console.log(`Roi noir: ${summary.blackKing ? `[${summary.blackKing.row},${summary.blackKing.col}]` : 'NON TROUVÉ'}`);
        console.log(`Échec blanc: ${summary.whiteInCheck ? 'OUI ⚠️' : 'NON ✓'}`);
        console.log(`Échec noir: ${summary.blackInCheck ? 'OUI ⚠️' : 'NON ✓'}`);
        console.log(`Rois adjacents: ${summary.kingsAdjacent ? 'OUI ⚠️' : 'NON ✓'}`);
    }
    
    // Méthode pour forcer la mise à jour de la configuration
    static reloadConfig() {
        const oldValue = this.consoleLog;
        this.loadConfig();
        
        if (this.consoleLog && oldValue !== this.consoleLog) {
            console.log(`🔄 ChessEngine: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
        }
        return this.consoleLog;
    }
}

// Initialisation statique
ChessEngine.init();

// Exposer la classe globalement
window.ChessEngine = ChessEngine;

// Ajouter des fonctions utilitaires globales
window.ChessEngineUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => ChessEngine.reloadConfig(),
    
    // Tester la configuration
    testConfig: () => {
        console.group('🧪 Test de configuration ChessEngine');
        console.log('consoleLog actuel:', ChessEngine.consoleLog);
        console.log('Source config:', ChessEngine.getConfigSource());
        console.log('window.appConfig disponible:', !!window.appConfig);
        
        if (window.appConfig) {
            console.log('Valeur debug.console_log dans appConfig:', 
                window.appConfig.debug?.console_log, 
                '(type:', typeof window.appConfig.debug?.console_log + ')');
        }
        
        console.log('Mode debug activé:', ChessEngine.isDebugMode());
        console.groupEnd();
        
        return ChessEngine.consoleLog;
    },
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: ChessEngine.consoleLog,
        source: ChessEngine.getConfigSource(),
        debugMode: ChessEngine.isDebugMode(),
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
    
    // Tester le moteur d'échec
    testEngine: (fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") => {
        console.log('🧪 Test ChessEngine avec FEN:', fen);
        const engine = new ChessEngine(fen);
        
        // Exécuter les vérifications uniquement si debug activé
        if (ChessEngine.consoleLog) {
            console.log('✓ Blanc en échec?', engine.isKingInCheck('w'));
            console.log('✓ Noir en échec?', engine.isKingInCheck('b'));
            console.log('✓ Échec (tour actuel)?', engine.isCheck());
            console.log('✓ Rois adjacents?', engine.areKingsAdjacent());
        }
        
        return engine;
    }
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ChessEngine.loadConfig();
            if (ChessEngine.consoleLog) {
                console.log('✅ ChessEngine: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        ChessEngine.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (ChessEngine.consoleLog) {
    console.log('✅ ChessEngine prêt (mode debug activé)');
} else {
    console.info('✅ ChessEngine prêt (mode silencieux)');
}

// Fonction de test pour vérifier depuis la console (toujours disponible)
window.testChessEngineConfig = function() {
    console.log('=== TEST CONFIGURATION ChessEngine ===');
    const state = window.ChessEngineUtils.getState();
    console.log('État actuel:', state);
    console.log('Valeur brute JSON:', window.appConfig?.debug?.console_log);
    console.log('String "false" === false ?', "false" === false);
    console.log('Boolean("false") ?', Boolean("false"));
    console.log('"false" == false ?', "false" == false);
    console.log('=== FIN TEST ===');
    return state;
};