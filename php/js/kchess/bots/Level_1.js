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
            
            // Si window.appConfig n'existe pas, essayer de le charger
            if (typeof window.getConfig === 'function') {
                const configValue = window.getConfig('debug.console_log', 'true');
                this.consoleLog = configValue === true || configValue === 'true';
                return true;
            }
            
            // Si rien n'est disponible, garder la valeur par défaut
            if (this.consoleLog) {
                console.warn('⚠️ Level_1: Aucune configuration trouvée, utilisation de la valeur par défaut');
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
        this.name = "Bot Level 0";
        this.level = 0;
        
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log(`🤖 [Level_1] Bot Level 0 initialisé - "Random Move Bot"`);
            console.log(`📊 ${this.constructor.getConfigSource()}: console_log = ${this.constructor.consoleLog}`);
        }
    }

    getMove(fen) {
        // Vérifier la configuration avant chaque appel (optionnel)
        if (!this.constructor.consoleLog && window.appConfig) {
            this.constructor.loadConfig();
        }
        
        if (this.constructor.consoleLog) {
            console.log(`🎲 [Level_1] Début calcul du coup pour FEN: ${fen}`);
            console.log(`⚪ [Level_1] Joueur actuel: ${window.chessGame?.gameState?.currentPlayer || 'inconnu'}`);
        }

        try {
            const game = window.chessGame;
            if (!game || !game.core || !game.core.moveValidator) {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [Level_1] Jeu ou moteur de mouvement non disponible`);
                }
                return null;
            }

            const validMoves = [];
            const currentPlayer = game.gameState.currentPlayer;

            if (this.constructor.consoleLog) {
                console.log(`🔍 [Level_1] Recherche des coups valides pour ${currentPlayer === 'white' ? 'Blancs' : 'Noirs'}`);
            }

            // Parcourir toutes les pièces
            for (let fromRow = 0; fromRow < 8; fromRow++) {
                for (let fromCol = 0; fromCol < 8; fromCol++) {
                    const square = game.board.getSquare(fromRow, fromCol);
                    
                    if (square && square.piece && square.piece.color === currentPlayer) {
                        const pieceType = square.piece.type;
                        const pieceChar = pieceType.charAt(0).toUpperCase();
                        
                        if (this.constructor.consoleLog) {
                            console.log(`  👉 [Level_1] Pièce ${pieceChar} en [${fromRow},${fromCol}] (${currentPlayer})`);
                        }
                        
                        const possibleMoves = game.core.moveValidator.getPossibleMoves(
                            square.piece, 
                            fromRow, 
                            fromCol
                        );
                        
                        if (this.constructor.consoleLog && possibleMoves.length > 0) {
                            console.log(`    📍 [Level_1] ${possibleMoves.length} mouvement(s) possible(s)`);
                        }
                        
                        possibleMoves.forEach(move => {
                            validMoves.push({
                                fromRow: fromRow,
                                fromCol: fromCol,
                                toRow: move.row,
                                toCol: move.col,
                                piece: square.piece
                            });
                            
                            if (this.constructor.consoleLog) {
                                console.log(`      → [${fromRow},${fromCol}] → [${move.row},${move.col}]`);
                            }
                        });
                    }
                }
            }

            if (this.constructor.consoleLog) {
                console.log(`📊 [Level_1] Total coups valides trouvés: ${validMoves.length}`);
            }

            if (validMoves.length === 0) {
                if (this.constructor.consoleLog) {
                    console.log(`🚫 [Level_1] Aucun coup valide disponible!`);
                }
                return null;
            }

            // Choisir aléatoirement
            const randomIndex = Math.floor(Math.random() * validMoves.length);
            const selectedMove = validMoves[randomIndex];
            
            if (this.constructor.consoleLog) {
                console.log(`🎯 [Level_1] Coup sélectionné (aléatoire):`);
                console.log(`    📍 Départ: [${selectedMove.fromRow},${selectedMove.fromCol}]`);
                console.log(`    📍 Arrivée: [${selectedMove.toRow},${selectedMove.toCol}]`);
                console.log(`    ♟️ Pièce: ${selectedMove.piece.type} (${selectedMove.piece.color})`);
                console.log(`    🎲 Index choisi: ${randomIndex + 1}/${validMoves.length}`);
                
                // Convertir en notation échecs si possible
                const colToLetter = col => String.fromCharCode(97 + col);
                const rowToNumber = row => 8 - row;
                console.log(`    📝 Notation: ${colToLetter(selectedMove.fromCol)}${rowToNumber(selectedMove.fromRow)} → ${colToLetter(selectedMove.toCol)}${rowToNumber(selectedMove.toRow)}`);
            }

            return selectedMove;

        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [Level_1] ERREUR lors du calcul du coup: ${error.message}`);
                console.error('Level_1 error:', error);
            }
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
                window.appConfig.debug?.console_log);
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
        debugMode: Level_1.isDebugMode()
    }),
    
    // Activer/désactiver manuellement (temporaire)
    setConsoleLog: (value) => {
        const oldValue = Level_1.consoleLog;
        Level_1.consoleLog = Boolean(value);
        console.log(`🔧 Level_1: consoleLog changé manuellement: ${oldValue} → ${Level_1.consoleLog}`);
        return Level_1.consoleLog;
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

// Log final (si activé)
if (Level_1.consoleLog) {
    console.log('✅ Level_1 prêt à utiliser la configuration JSON');
}