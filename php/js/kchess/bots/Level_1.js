// bots/Level_1.js - Version utilisant la configuration JSON comme priorité
class Level_1 {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('🤖 bots/Level_1.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('🤖 Level_1: Mode silencieux activé (debug désactivé dans config)');
        }
    }
    
    // Méthode pour charger la configuration CORRIGÉE
    static loadConfig() {
        try {
            // Vérifier si la configuration globale existe
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                
                // CONVERSION CORRECTE - Gérer les string "false" et "true"
                if (configValue === "false") {
                    this.consoleLog = false;
                    // Ne pas loguer en mode silencieux
                    if (configValue !== "false") {
                        console.info('🔧 Level_1: console_log désactivé via config JSON');
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
                    console.log(`⚙️ Level_1: Configuration chargée - console_log = ${this.consoleLog} (valeur brute: "${configValue}")`);
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
                console.warn('⚠️ Level_1: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ Level_1: Erreur lors du chargement de la config:', error);
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

    constructor() {
        this.name = "Bot Level 1";
        this.level = 1;
        
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log(`🤖 [Level_1] Bot Level 1 initialisé - "Random Move Bot"`);
            console.log(`📊 ${this.constructor.getConfigSource()}: console_log = ${this.constructor.consoleLog}`);
        } else {
            console.info(`🤖 [Level_1] Bot Level 1 initialisé (mode silencieux)`);
        }
    }

// bots/Level_1.js
// Dans bots/Level_1.js
getMove(fen) {
    this.constructor.loadConfig();
    const isDebug = this.constructor.consoleLog;

    try {
        // Tentative de récupération de l'instance par plusieurs chemins possibles
        const game = window.chessGame || window.gameInstance || (window.ChessApp ? window.ChessApp.game : null);
        
        // Vérification ultra-précise de la chaîne de dépendances
        if (!game) {
            console.error("❌ [Level_1] Instance globale du jeu introuvable.");
            return null;
        }

        // On cherche le moveValidator là où il se trouve réellement
        const validator = game.moveValidator || (game.core ? game.core.moveValidator : null);

        if (!validator) {
            console.error("❌ [Level_1] MoveValidator introuvable dans l'instance.", game);
            return null;
        }

        const validMoves = [];
        const currentPlayer = game.gameState ? game.gameState.currentPlayer : (fen.split(' ')[1] === 'w' ? 'white' : 'black');

        if (isDebug) console.group(`🤖 Tour du Bot (${currentPlayer})`);

        // Parcours de l'échiquier
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                // Accès sécurisé à la pièce
                const piece = game.board.getPiece(fromRow, fromCol);
                
                if (piece && piece.color === currentPlayer) {
                    // Utilisation du validateur trouvé
                    const moves = validator.getPossibleMoves(piece, fromRow, fromCol);
                    
                    moves.forEach(m => {
                        validMoves.push({
                            fromRow, fromCol,
                            toRow: m.row,
                            toCol: m.col,
                            piece: piece,
                            notation: `${String.fromCharCode(97 + fromCol)}${8 - fromRow} → ${String.fromCharCode(97 + m.col)}${8 - m.row}`
                        });
                    });
                }
            }
        }

        if (validMoves.length === 0) {
            if (isDebug) {
                console.warn(`⚠️ Aucun coup légal trouvé pour ${currentPlayer}`);
                console.groupEnd();
            }
            return null;
        }

        const selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];

        if (isDebug) {
            console.log(`🎯 Choisi: ${selectedMove.notation}`);
            console.groupEnd();
        }

        return selectedMove;

    } catch (error) {
        console.error(`⛔ [Level_1] Crash lors de la recherche de coups:`, error);
        if (isDebug) console.groupEnd();
        return null;
    }
}
    
    // Méthode : Obtenir le statut du bot
    getStatus() {
        return {
            name: this.name,
            level: this.level,
            type: "Random Move Bot",
            description: "Effectue des coups aléatoires parmi les mouvements légaux",
            config: {
                console_log: this.constructor.consoleLog,
                source: this.constructor.getConfigSource(),
                app_config_available: !!window.appConfig
            }
        };
    }
    
    // Méthode : Simuler un coup pour test
    simulateMove(fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`🧪 [Level_1] Simulation de coup: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        // Vérifier si le coup est dans la liste des mouvements possibles
        const game = window.chessGame;
        if (!game) return false;
        
        const square = game.board.getSquare(fromRow, fromCol);
        if (!square || !square.piece) return false;
        
        const possibleMoves = game.core.moveValidator.getPossibleMoves(square.piece, fromRow, fromCol);
        const isValid = possibleMoves.some(move => move.row === toRow && move.col === toCol);
        
        if (this.constructor.consoleLog) {
            console.log(`  ✅ [Level_1] Coup ${isValid ? 'VALIDE' : 'INVALIDE'}`);
        }
        
        return isValid;
    }
    
    // Méthode pour forcer la mise à jour de la configuration
    static reloadConfig() {
        const oldValue = this.consoleLog;
        this.loadConfig();
        
        if (this.consoleLog && oldValue !== this.consoleLog) {
            console.log(`🔄 Level_1: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
        }
        return this.consoleLog;
    }
    
    // Méthode pour tester la configuration
    static testConfig() {
        console.group('🧪 Test de configuration Level_1');
        console.log('consoleLog actuel:', this.consoleLog);
        console.log('Source config:', this.getConfigSource());
        console.log('window.appConfig disponible:', !!window.appConfig);
        
        if (window.appConfig) {
            console.log('Valeur debug.console_log dans appConfig:', 
                window.appConfig.debug?.console_log, 
                '(type:', typeof window.appConfig.debug?.console_log + ')');
        }
        
        if (typeof window.getConfig === 'function') {
            console.log('Valeur via getConfig:', 
                window.getConfig('debug.console_log', 'non trouvé'));
        }
        
        console.log('Mode debug activé:', this.isDebugMode());
        console.groupEnd();
        
        return this.consoleLog;
    }
}

// Initialisation statique
Level_1.init();

// Exposer la classe globalement
window.Level_1 = Level_1;

// Ajouter des fonctions utilitaires globales
window.Level1Utils = {
    // Forcer le rechargement de la config
    reloadConfig: () => Level_1.reloadConfig(),
    
    // Tester la configuration
    testConfig: () => Level_1.testConfig(),
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: Level_1.consoleLog,
        source: Level_1.getConfigSource(),
        debugMode: Level_1.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Activer/désactiver manuellement (temporaire)
    setConsoleLog: (value) => {
        const oldValue = Level_1.consoleLog;
        Level_1.consoleLog = Boolean(value);
        console.log(`🔧 Level_1: consoleLog changé manuellement: ${oldValue} → ${Level_1.consoleLog}`);
        return Level_1.consoleLog;
    },
    
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
    }
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            Level_1.loadConfig();
            if (Level_1.consoleLog) {
                console.log('✅ Level_1: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        Level_1.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (Level_1.consoleLog) {
    console.log('✅ Level_1 prêt (mode debug activé)');
} else {
    console.info('✅ Level_1 prêt (mode silencieux)');
}

// Fonction de test pour vérifier depuis la console
window.testLevel1Config = function() {
    console.log('=== TEST CONFIGURATION Level_1 ===');
    const state = window.Level1Utils.getState();
    console.log('État actuel:', state);
    console.log('Valeur brute JSON:', window.appConfig?.debug?.console_log);
    console.log('String "false" === false ?', "false" === false);
    console.log('Boolean("false") ?', Boolean("false"));
    console.log('"false" == false ?', "false" == false);
    console.log('=== FIN TEST ===');
    return state;
};