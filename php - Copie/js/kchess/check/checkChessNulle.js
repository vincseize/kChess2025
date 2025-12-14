// check/checkChessNulle.js - Vérification des autres cas de nullité
class ChessNulleEngine extends ChessEngine {
    
    static consoleLog = true; // Valeur par défaut - sera écrasée par la config JSON
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('check/checkChessNulle.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            console.info('🔇 checkChessNulle.js: Mode silencieux activé');
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
                    console.log(`⚙️ ChessNulleEngine: Configuration chargée - console_log = ${this.consoleLog}`);
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
                console.warn('⚠️ ChessNulleEngine: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessNulleEngine: Erreur lors du chargement de la config:', error);
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

    constructor(fen, moveHistory = []) {
        super(fen);
        this.moveHistory = moveHistory; // Historique des coups pour la répétition
        this.positionCount = new Map(); // Compteur de positions pour répétition triple
        
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log('🔧 ChessNulleEngine créé');
            console.log(`📊 Source config: ${this.constructor.getConfigSource()}`);
        } else {
            console.info('🔧 ChessNulleEngine créé (mode silencieux)');
        }
        
        this.initializePositionCount();
    }

    // Initialiser le compteur de positions
    initializePositionCount() {
        const currentFEN = this.getPositionSignature();
        this.positionCount.set(currentFEN, 1);
        
        // Compter les positions précédentes
        for (const fen of this.moveHistory) {
            const signature = this.getFENSignature(fen);
            this.positionCount.set(signature, (this.positionCount.get(signature) || 0) + 1);
        }
        
        if (this.constructor.consoleLog) {
            console.log(`📊 ${this.positionCount.size} positions uniques dans l'historique`);
        }
    }

    // Vérifier la répétition triple
    isThreefoldRepetition() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const currentFEN = this.getPositionSignature();
            const count = this.positionCount.get(currentFEN) || 0;
            return count >= 3;
        }
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log(`🔄🔍 Vérification répétition triple`);
        }
        
        const currentFEN = this.getPositionSignature();
        const count = this.positionCount.get(currentFEN) || 0;
        
        if (this.constructor.consoleLog) {
            console.log(`🔄 Position actuelle apparue ${count} fois`);
        }
        
        return count >= 3;
    }

    // Vérifier la règle des 50 coups
    isFiftyMoveRule(halfMoveClock) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            return halfMoveClock >= 50;
        }
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log(`🎯🔍 Vérification règle des 50 coups: ${halfMoveClock}/50`);
        }
        
        return halfMoveClock >= 50;
    }

    // Vérifier matériel insuffisant (égalité)
    isInsufficientMaterial() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const pieces = this.getAllPieces();
            
            // Cas 1: Roi contre roi
            if (pieces.length === 2) {
                return true;
            }
            
            // Cas 2: Roi + fou contre roi
            if (pieces.length === 3) {
                const bishops = pieces.filter(p => p.piece.toLowerCase() === 'b');
                if (bishops.length === 1) {
                    return true;
                }
            }
            
            // Cas 3: Roi + cavalier contre roi  
            if (pieces.length === 3) {
                const knights = pieces.filter(p => p.piece.toLowerCase() === 'n');
                if (knights.length === 1) {
                    return true;
                }
            }
            
            // Cas 4: Roi + fou contre roi + fou (même couleur de cases)
            if (pieces.length === 4) {
                const bishops = pieces.filter(p => p.piece.toLowerCase() === 'b');
                if (bishops.length === 2) {
                    const whiteBishop = bishops.find(b => b.piece === 'B');
                    const blackBishop = bishops.find(b => b.piece === 'b');
                    
                    if (whiteBishop && blackBishop) {
                        const whiteSquareColor = (whiteBishop.row + whiteBishop.col) % 2;
                        const blackSquareColor = (blackBishop.row + blackBishop.col) % 2;
                        
                        if (whiteSquareColor === blackSquareColor) {
                            return true;
                        }
                    }
                }
            }
            
            return false;
        }
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log(`♜🔍 Vérification matériel insuffisant`);
        }
        
        const pieces = this.getAllPieces();
        
        // Cas 1: Roi contre roi
        if (pieces.length === 2) {
            if (this.constructor.consoleLog) {
                console.log(`♜✅ Roi contre roi - matériel insuffisant`);
            }
            return true;
        }
        
        // Cas 2: Roi + fou contre roi
        if (pieces.length === 3) {
            const bishops = pieces.filter(p => p.piece.toLowerCase() === 'b');
            if (bishops.length === 1) {
                if (this.constructor.consoleLog) {
                    console.log(`♜✅ Roi + fou contre roi - matériel insuffisant`);
                }
                return true;
            }
        }
        
        // Cas 3: Roi + cavalier contre roi  
        if (pieces.length === 3) {
            const knights = pieces.filter(p => p.piece.toLowerCase() === 'n');
            if (knights.length === 1) {
                if (this.constructor.consoleLog) {
                    console.log(`♜✅ Roi + cavalier contre roi - matériel insuffisant`);
                }
                return true;
            }
        }
        
        // Cas 4: Roi + fou contre roi + fou (même couleur de cases)
        if (pieces.length === 4) {
            const bishops = pieces.filter(p => p.piece.toLowerCase() === 'b');
            if (bishops.length === 2) {
                const whiteBishop = bishops.find(b => b.piece === 'B');
                const blackBishop = bishops.find(b => b.piece === 'b');
                
                if (whiteBishop && blackBishop) {
                    const whiteSquareColor = (whiteBishop.row + whiteBishop.col) % 2;
                    const blackSquareColor = (blackBishop.row + blackBishop.col) % 2;
                    
                    if (whiteSquareColor === blackSquareColor) {
                        if (this.constructor.consoleLog) {
                            console.log(`♜✅ Roi + fou contre roi + fou (même couleur) - matériel insuffisant`);
                        }
                        return true;
                    }
                }
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`♜❌ Matériel suffisant pour continuer`);
        }
        return false;
    }

    // Obtenir toutes les pièces sur le plateau
    getAllPieces() {
        const pieces = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece) {
                    pieces.push({
                        piece: piece,
                        row: row,
                        col: col
                    });
                }
            }
        }
        return pieces;
    }

    // Obtenir la signature de position (FEN sans compteurs)
    getPositionSignature() {
        // Utiliser le FEN fourni au constructeur
        const parts = this.fen.split(' ');
        // Retourner seulement la position des pièces, le tour et les droits de roque
        return parts.slice(0, 4).join(' ');
    }

    // Obtenir la signature d'un FEN donné
    getFENSignature(fen) {
        const parts = fen.split(' ');
        return parts.slice(0, 4).join(' ');
    }

    // Vérifier toutes les conditions de nullité avec détection précise
    isDraw(halfMoveClock) {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            // 1. Matériel insuffisant - LE PLUS RAPIDE À VÉRIFIER
            if (this.isInsufficientMaterial()) {
                return { isDraw: true, reason: 'insufficientMaterial' };
            }
            
            // 2. Règle des 50 coups - SIMPLE COMPARATION
            if (this.isFiftyMoveRule(halfMoveClock)) {
                return { isDraw: true, reason: 'fiftyMoves' };
            }
            
            // 3. Répétition triple - LE PLUS LOURD À CALCULER
            if (this.isThreefoldRepetition()) {
                return { isDraw: true, reason: 'repetition' };
            }
            
            return { isDraw: false, reason: null };
        }
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log(`🤝🔍 Vérification globale des conditions de nullité`);
        }
        
        // 1. Matériel insuffisant - LE PLUS RAPIDE À VÉRIFIER
        if (this.isInsufficientMaterial()) {
            if (this.constructor.consoleLog) {
                console.log(`🤝✅ Nullité par matériel insuffisant`);
            }
            return { isDraw: true, reason: 'insufficientMaterial' };
        }
        
        // 2. Règle des 50 coups - SIMPLE COMPARATION
        if (this.isFiftyMoveRule(halfMoveClock)) {
            if (this.constructor.consoleLog) {
                console.log(`🤝✅ Nullité par règle des 50 coups`);
            }
            return { isDraw: true, reason: 'fiftyMoves' };
        }
        
        // 3. Répétition triple - LE PLUS LOURD À CALCULER
        if (this.isThreefoldRepetition()) {
            if (this.constructor.consoleLog) {
                console.log(`🤝✅ Nullité par répétition triple`);
            }
            return { isDraw: true, reason: 'repetition' };
        }
        
        if (this.constructor.consoleLog) {
            console.log(`🤝❌ Aucune condition de nullité détectée`);
        }
        return { isDraw: false, reason: null };
    }

    // NOUVELLE MÉTHODE : Obtenir le message détaillé pour la nullité
    getDrawMessage(reason) {
        const messages = {
            'repetition': 'Partie nulle par répétition triple de position !',
            'fiftyMoves': 'Partie nulle par la règle des 50 coups !',
            'insufficientMaterial': 'Partie nulle par matériel insuffisant !'
        };
        return messages[reason] || 'Partie nulle !';
    }

    // NOUVELLE MÉTHODE : Obtenir la description détaillée
    getDrawDescription(reason) {
        const descriptions = {
            'repetition': 'La même position s\'est répétée trois fois avec le même joueur ayant le trait.',
            'fiftyMoves': '50 coups complets (100 demi-coups) se sont écoulés sans capture ni mouvement de pion.',
            'insufficientMaterial': 'Aucun des deux joueurs ne dispose du matériel suffisant pour donner un échec et mat.'
        };
        return descriptions[reason] || 'La partie est déclarée nulle.';
    }
    
    // Méthode pour forcer la mise à jour de la configuration
    static reloadConfig() {
        const oldValue = this.consoleLog;
        this.loadConfig();
        
        if (this.consoleLog && oldValue !== this.consoleLog) {
            console.log(`🔄 ChessNulleEngine: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
        }
        return this.consoleLog;
    }
}

// Initialisation statique
ChessNulleEngine.init();

// Exposer des fonctions utilitaires globales
window.ChessNulleEngineUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => ChessNulleEngine.reloadConfig(),
    
    // Tester la configuration
    testConfig: () => {
        console.group('🧪 Test de configuration ChessNulleEngine');
        console.log('consoleLog actuel:', ChessNulleEngine.consoleLog);
        console.log('Source config:', ChessNulleEngine.getConfigSource());
        console.log('window.appConfig disponible:', !!window.appConfig);
        
        if (window.appConfig) {
            console.log('Valeur debug.console_log dans appConfig:', 
                window.appConfig.debug?.console_log, 
                '(type:', typeof window.appConfig.debug?.console_log + ')');
        }
        
        console.log('Mode debug activé:', ChessNulleEngine.isDebugMode());
        console.groupEnd();
        
        return ChessNulleEngine.consoleLog;
    },
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: ChessNulleEngine.consoleLog,
        source: ChessNulleEngine.getConfigSource(),
        debugMode: ChessNulleEngine.isDebugMode(),
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
    
    // Tester le moteur de nullité
    testEngine: (fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", halfMoveClock = 0) => {
        console.log('🧪 Test ChessNulleEngine avec FEN:', fen);
        const engine = new ChessNulleEngine(fen);
        
        // Exécuter les vérifications uniquement si debug activé
        if (ChessNulleEngine.consoleLog) {
            console.log('✓ Matériel insuffisant?', engine.isInsufficientMaterial());
            console.log('✓ Règle 50 coups?', engine.isFiftyMoveRule(halfMoveClock));
            console.log('✓ Répétition triple?', engine.isThreefoldRepetition());
            console.log('✓ Nullité totale?', engine.isDraw(halfMoveClock));
        }
        
        return engine;
    }
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ChessNulleEngine.loadConfig();
            if (ChessNulleEngine.consoleLog) {
                console.log('✅ ChessNulleEngine: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        ChessNulleEngine.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (ChessNulleEngine.consoleLog) {
    console.log('✅ ChessNulleEngine prêt (mode debug activé)');
} else {
    console.info('✅ ChessNulleEngine prêt (mode silencieux)');
}

window.ChessNulleEngine = ChessNulleEngine;