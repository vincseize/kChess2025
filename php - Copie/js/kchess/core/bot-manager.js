// core/bot-manager.js - Version utilisant la configuration JSON
class BotManager {
    
    static consoleLog = true; // Valeur par défaut - sera écrasée par la config
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('core/bot-manager.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            console.info('🔇 BotManager: Mode silencieux activé');
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
                    if (configValue !== "false") { // Log seulement si ce n'est pas déjà false
                        console.info('🔧 BotManager: console_log désactivé via config JSON ("false")');
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
                    console.log(`⚙️ BotManager: Configuration chargée - console_log = ${this.consoleLog} (valeur brute: "${configValue}")`);
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
                console.warn('⚠️ BotManager: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ BotManager: Erreur lors du chargement de la config:', error);
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

    constructor(chessGame) {
        this.chessGame = chessGame;
        this.bot = null;
        this.botLevel = 0;
        this.isBotThinking = false;
        this.botColor = 'black';
        this.moveCount = 0;
        this.maxRetries = 3;
        this.retryCount = 0;
        
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log('🤖 [BotManager] Gestionnaire de bot initialisé');
        }
    }

    setBotLevel(level, color = 'black') {
        // Vérifier la configuration avant l'action
        if (!this.constructor.consoleLog && window.appConfig) {
            this.constructor.loadConfig();
        }
        
        if (this.constructor.consoleLog) {
            console.log(`\n⚙️ [BotManager] === CONFIGURATION DU BOT ===`);
            console.log(`⚙️ [BotManager] Niveau demandé: ${level}, Couleur: ${color}`);
            console.log(`⚙️ [BotManager] Bot actuel: niveau ${this.botLevel}, couleur ${this.botColor}`);
        } else {
            // Mode silencieux
            console.info(`🤖 [BotManager] Configuration bot: niveau ${level}, couleur ${color}`);
        }
        
        // Convertir en nombre
        level = parseInt(level);
        
        if (isNaN(level)) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [BotManager] Niveau invalide: ${level}`);
            }
            return null;
        }
        
        this.botLevel = level;
        this.botColor = color;
        this.moveCount = 0;
        this.retryCount = 0;
        
        // Désactiver le bot actuel
        this.bot = null;
        
        // Créer le nouveau bot selon le niveau
        if (level === 0) {
            if (this.constructor.consoleLog) {
                console.log(`🔴 [BotManager] Bot désactivé`);
            } else {
                console.info('🔴 [BotManager] Bot désactivé');
            }
        } else if (level === 1) {
            // Niveau 1 = Level_1 (aléatoire)
            if (window.Level_1) {
                this.bot = new Level_1();
                if (this.constructor.consoleLog) {
                    console.log(`🟢 [BotManager] Bot Level 1 activé (Level_1 - aléatoire)`);
                    console.log(`🎨 [BotManager] Bot joue les ${color === 'white' ? 'Blancs' : 'Noirs'}`);
                    console.log(`🤖 [BotManager] Nom: ${this.bot.name}`);
                } else {
                    console.info(`🟢 [BotManager] Bot Level 1 activé - joue les ${color === 'white' ? 'Blancs' : 'Noirs'}`);
                }
            } else {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [BotManager] Classe Level_1 non trouvée`);
                }
                console.error('❌ BotManager: Classe Level_1 non trouvée');
            }
        } else if (level === 2) {
            // Niveau 2 = Level_2 (CCMO)
            if (window.Level_2) {
                this.bot = new Level_2();
                if (this.constructor.consoleLog) {
                    console.log(`🟢 [BotManager] Bot Level 2 activé (Level_2 - CCMO)`);
                    console.log(`🎨 [BotManager] Bot joue les ${color === 'white' ? 'Blancs' : 'Noirs'}`);
                    console.log(`🤖 [BotManager] Nom: ${this.bot.name}`);
                    console.log(`🎯 [BotManager] Stratégie: Check → Capture → Menace → Optimisation`);
                } else {
                    console.info(`🟢 [BotManager] Bot Level 2 activé - joue les ${color === 'white' ? 'Blancs' : 'Noirs'}`);
                }
            } else {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [BotManager] Classe Level_2 non trouvée`);
                }
                console.error('❌ BotManager: Classe Level_2 non trouvée');
            }
        } else {
            if (this.constructor.consoleLog) {
                console.log(`❌ [BotManager] Niveau de bot inconnu: ${level}`);
            }
            console.error(`❌ BotManager: Niveau de bot inconnu: ${level}`);
        }
        
        if (this.constructor.consoleLog) {
            console.log(`📊 [BotManager] Configuration finale: niveau=${this.botLevel}, couleur=${this.botColor}`);
        }
        
        // Si c'est le tour du bot, le faire jouer après un délai
        setTimeout(() => {
            const isTurn = this.isBotTurn();
            if (this.constructor.consoleLog) {
                console.log(`🤔 [BotManager] Vérification tour bot après délai: ${isTurn ? '✅ OUI' : '❌ NON'}`);
            }
            
            if (isTurn) {
                if (this.constructor.consoleLog) {
                    console.log(`🎯 [BotManager] C'est le tour du bot, déclenchement du coup...`);
                }
                this.playBotMove();
            } else {
                const currentPlayer = this.chessGame?.gameState?.currentPlayer || 'inconnu';
                if (this.constructor.consoleLog) {
                    console.log(`⏳ [BotManager] Pas le tour du bot (joueur: ${currentPlayer})`);
                }
            }
        }, 1000);
        
        if (this.constructor.consoleLog) {
            console.log(`✅ [BotManager] === FIN CONFIGURATION ===\n`);
        }
        
        return this.bot;
    }

    isBotTurn() {
        // Mode silencieux - vérifier rapidement
        if (!this.constructor.consoleLog) {
            try {
                return this.chessGame && 
                       this.chessGame.gameState && 
                       this.bot && 
                       this.botLevel > 0 && 
                       !this.isBotThinking && 
                       this.chessGame.gameState.gameActive && 
                       this.chessGame.gameState.currentPlayer === this.botColor;
            } catch (error) {
                return false;
            }
        }
        
        // Mode debug - avec logs
        try {
            // Vérifications de base
            if (!this.chessGame || !this.chessGame.gameState) {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [BotManager] Jeu ou gameState non disponible`);
                }
                return false;
            }
            
            if (!this.bot || this.botLevel === 0 || this.isBotThinking) {
                return false;
            }
            
            const gameActive = this.chessGame.gameState.gameActive;
            const currentPlayer = this.chessGame.gameState.currentPlayer;
            const isTurn = gameActive && currentPlayer === this.botColor;
            
            if (this.constructor.consoleLog && this.botLevel > 0) {
                const turnStatus = isTurn ? '✅ OUI' : '❌ NON';
                console.log(`🔄 [BotManager] Tour bot? ${turnStatus}`);
                console.log(`   • Jeu actif: ${gameActive ? '✅' : '❌'}`);
                console.log(`   • Joueur actuel: ${currentPlayer}`);
                console.log(`   • Couleur bot: ${this.botColor}`);
                console.log(`   • Bot niveau: ${this.botLevel}`);
                console.log(`   • En réflexion: ${this.isBotThinking ? '🤔' : '💤'}`);
            }
            
            return isTurn;
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [BotManager] Erreur dans isBotTurn: ${error.message}`);
            }
            return false;
        }
    }

    async playBotMove() {
        // Vérifier la configuration avant l'action
        if (!this.constructor.consoleLog && window.appConfig) {
            this.constructor.loadConfig();
        }
        
        if (this.constructor.consoleLog) {
            console.log(`\n🤖 [BotManager] === DÉBUT DU TOUR DU BOT ===`);
            console.log(`🤖 [BotManager] Niveau: ${this.botLevel}, Couleur: ${this.botColor}`);
            console.log(`🤖 [BotManager] En réflexion: ${this.isBotThinking ? 'OUI ⏳' : 'NON ✅'}`);
        } else {
            console.info(`🤖 [BotManager] Tour du bot niveau ${this.botLevel}...`);
        }
        
        // Vérifications initiales
        if (this.isBotThinking) {
            if (this.constructor.consoleLog) {
                console.log(`🚫 [BotManager] Bot déjà en train de penser - annulation`);
            }
            return;
        }
        
        const currentPlayerBefore = this.chessGame.gameState.currentPlayer;
        if (this.constructor.consoleLog) {
            console.log(`🔄 [BotManager] Joueur avant vérification: ${currentPlayerBefore}`);
            console.log(`🤖 [BotManager] Couleur bot: ${this.botColor}`);
        }
        
        if (!this.isBotTurn()) {
            if (this.constructor.consoleLog) {
                console.log(`🚫 [BotManager] Pas le tour du bot`);
                console.log(`   • Joueur actuel: ${currentPlayerBefore}`);
                console.log(`   • Couleur bot: ${this.botColor}`);
                console.log(`   • Vérification tour: ${this.isBotTurn() ? '✅' : '❌'}`);
            }
            return;
        }
        
        this.isBotThinking = true;
        this.moveCount++;
        
        // Mode silencieux - exécution sans logs
        if (!this.constructor.consoleLog) {
            try {
                // Temps de réflexion très court
                const thinkTime = 50 + Math.random() * 150;
                await new Promise(resolve => setTimeout(resolve, thinkTime));
                
                // Vérifier avant de continuer
                if (this.chessGame.gameState.currentPlayer !== this.botColor) {
                    this.isBotThinking = false;
                    return;
                }
                
                // Générer le FEN
                const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
                
                // Demander un coup au bot
                const botMove = this.bot.getMove(currentFEN);
                
                if (!botMove) {
                    this.retryCount++;
                    this.isBotThinking = false;
                    
                    if (this.retryCount < this.maxRetries) {
                        setTimeout(() => {
                            if (this.isBotTurn()) {
                                this.playBotMove();
                            }
                        }, 100);
                    }
                    return;
                }
                
                // Jouer le coup
                const success = this.chessGame.handleMove(
                    botMove.fromRow, 
                    botMove.fromCol, 
                    botMove.toRow, 
                    botMove.toCol
                );
                
                if (!success) {
                    this.retryCount++;
                    this.isBotThinking = false;
                    
                    if (this.retryCount < this.maxRetries) {
                        setTimeout(() => {
                            if (this.isBotTurn()) {
                                this.playBotMove();
                            }
                        }, 100);
                    }
                    return;
                }
                
                this.retryCount = 0; // Réinitialiser le compteur d'erreurs
                
            } catch (error) {
                // Mode silencieux - pas de log d'erreur
            } finally {
                this.isBotThinking = false;
            }
            return;
        }
        
        // Mode debug - avec logs complets
        if (this.constructor.consoleLog) {
            console.log(`🧠 [BotManager] Bot commence à penser... (coup ${this.moveCount})`);
            console.log(`⏱️ [BotManager] Temps de réflexion: 50-200ms`);
        }
        
        try {
            // Temps de réflexion très court (50-200ms) pour éviter le problème
            const thinkTime = 50 + Math.random() * 150;
            await new Promise(resolve => setTimeout(resolve, thinkTime));
            
            // Vérifier immédiatement avant de continuer
            const currentPlayerNow = this.chessGame.gameState.currentPlayer;
            if (this.constructor.consoleLog) {
                console.log(`🔄 [BotManager] Après réflexion: joueur=${currentPlayerNow}`);
                console.log(`   • Période de réflexion: ${thinkTime.toFixed(0)}ms`);
            }
            
            if (currentPlayerNow !== this.botColor) {
                if (this.constructor.consoleLog) {
                    console.log(`⚠️ [BotManager] Plus le tour du bot après réflexion`);
                    console.log(`   • Attendu: ${this.botColor}`);
                    console.log(`   • Actuel: ${currentPlayerNow}`);
                }
                this.isBotThinking = false;
                return;
            }
            
            // Générer le FEN
            const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
            if (this.constructor.consoleLog) {
                console.log(`📋 [BotManager] FEN actuel: ${currentFEN.substring(0, 50)}...`);
            }
            
            // Demander un coup au bot
            const botMove = this.bot.getMove(currentFEN);
            
            if (!botMove) {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [BotManager] Bot n'a pas trouvé de coup`);
                }
                this.retryCount++;
                this.isBotThinking = false;
                
                if (this.retryCount < this.maxRetries) {
                    if (this.constructor.consoleLog) {
                        console.log(`🔄 [BotManager] Réessai ${this.retryCount}/${this.maxRetries}...`);
                    }
                    setTimeout(() => {
                        if (this.isBotTurn()) {
                            this.playBotMove();
                        }
                    }, 100);
                } else {
                    if (this.constructor.consoleLog) {
                        console.log(`🚫 [BotManager] Nombre maximum de tentatives atteint (${this.maxRetries})`);
                    }
                }
                return;
            }
            
            if (this.constructor.consoleLog) {
                console.log(`🎯 [BotManager] Coup proposé par le bot:`);
                console.log(`   • Départ: [${botMove.fromRow},${botMove.fromCol}]`);
                console.log(`   • Arrivée: [${botMove.toRow},${botMove.toCol}]`);
                if (botMove.piece) {
                    console.log(`   • Pièce: ${botMove.piece.type} (${botMove.piece.color})`);
                }
                
                // Convertir en notation échecs
                const colToLetter = col => String.fromCharCode(97 + col);
                const rowToNumber = row => 8 - row;
                console.log(`   📝 Notation: ${colToLetter(botMove.fromCol)}${rowToNumber(botMove.fromRow)} → ${colToLetter(botMove.toCol)}${rowToNumber(botMove.toRow)}`);
            }
            
            // Jouer le coup
            const success = this.chessGame.handleMove(
                botMove.fromRow, 
                botMove.fromCol, 
                botMove.toRow, 
                botMove.toCol
            );
            
            if (!success) {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [BotManager] Coup du bot échoué`);
                }
                this.retryCount++;
                this.isBotThinking = false;
                
                if (this.retryCount < this.maxRetries) {
                    if (this.constructor.consoleLog) {
                        console.log(`🔄 [BotManager] Réessai après échec ${this.retryCount}/${this.maxRetries}...`);
                    }
                    setTimeout(() => {
                        if (this.isBotTurn()) {
                            this.playBotMove();
                        }
                    }, 100);
                }
                return;
            }
            
            if (this.constructor.consoleLog) {
                console.log(`✅ [BotManager] Coup du bot réussi!`);
                console.log(`📊 [BotManager] Coups joués: ${this.moveCount}`);
                console.log(`🔄 [BotManager] Tentatives réinitialisées: ${this.retryCount} → 0`);
            }
            this.retryCount = 0; // Réinitialiser le compteur d'erreurs
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [BotManager] Erreur lors du tour du bot: ${error.message}`);
                console.error('BotManager error:', error);
            }
        } finally {
            // TOUJOURS libérer le verrou
            this.isBotThinking = false;
            if (this.constructor.consoleLog) {
                console.log(`✅ [BotManager] Verrou de réflexion libéré`);
                console.log(`🤖 [BotManager] === FIN DU TOUR DU BOT ===\n`);
            }
        }
    }

    setBotColor(color) {
        // Vérifier la configuration avant l'action
        if (!this.constructor.consoleLog && window.appConfig) {
            this.constructor.loadConfig();
        }
        
        if (this.constructor.consoleLog) {
            console.log(`\n🎨 [BotManager] === CHANGEMENT DE COULEUR ===`);
            console.log(`🎨 [BotManager] Ancienne couleur: ${this.botColor}`);
            console.log(`🎨 [BotManager] Nouvelle couleur: ${color}`);
        } else {
            console.info(`🎨 [BotManager] Changement couleur bot: ${this.botColor} → ${color}`);
        }
        
        this.botColor = color;
        this.retryCount = 0; // Réinitialiser les tentatives
        
        // Si c'est maintenant son tour, jouer
        setTimeout(() => {
            if (this.isBotTurn()) {
                if (this.constructor.consoleLog) {
                    console.log(`🎯 [BotManager] Nouvelle couleur, déclenchement du coup...`);
                }
                this.playBotMove();
            } else {
                if (this.constructor.consoleLog) {
                    console.log(`⏳ [BotManager] Pas le tour du bot avec la nouvelle couleur`);
                }
            }
        }, 300);
        
        if (this.constructor.consoleLog) {
            console.log(`✅ [BotManager] === FIN CHANGEMENT DE COULEUR ===\n`);
        }
    }

    getBotStatus() {
        const botType = this.botLevel === 0 ? 'Inactif' :
                      this.botLevel === 1 ? 'Level_1 (Aléatoire)' :
                      this.botLevel === 2 ? 'Level_2 (CCMO)' :
                      'Inconnu';
        
        const status = {
            active: this.botLevel > 0,
            level: this.botLevel,
            color: this.botColor,
            thinking: this.isBotThinking,
            name: this.bot ? this.bot.name : 'Aucun',
            type: botType,
            moveCount: this.moveCount,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries,
            isBotTurn: this.isBotTurn()
        };
        
        if (this.constructor.consoleLog) {
            console.log(`📊 [BotManager] Statut du bot:`, status);
        }
        
        return status;
    }

    reactivateBot() {
        if (this.constructor.consoleLog) {
            console.log(`\n🔄 [BotManager] === RÉACTIVATION DU BOT ===`);
            console.log(`🔄 [BotManager] Niveau: ${this.botLevel}, Couleur: ${this.botColor}`);
        }
        
        if (this.botLevel > 0) {
            this.setBotLevel(this.botLevel, this.botColor);
        }
        
        if (this.constructor.consoleLog) {
            console.log(`✅ [BotManager] === FIN RÉACTIVATION ===\n`);
        }
    }

    forcePlay() {
        if (this.constructor.consoleLog) {
            console.log(`\n⚡ [BotManager] === FORÇAGE DU COUP ===`);
            console.log(`⚡ [BotManager] Bot actif: ${this.bot && this.botLevel > 0 ? '✅ OUI' : '❌ NON'}`);
        }
        
        if (this.bot && this.botLevel > 0) {
            if (this.constructor.consoleLog) {
                console.log(`⚡ [BotManager] Lancement du coup forcé...`);
            }
            this.playBotMove();
        } else {
            if (this.constructor.consoleLog) {
                console.log(`❌ [BotManager] Bot non activé - impossible de forcer le coup`);
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`✅ [BotManager] === FIN FORÇAGE ===\n`);
        }
    }
    
    // Méthode de debug
    debug() {
        if (this.constructor.consoleLog) {
            console.group('🐛 [BotManager] Debug');
            console.log('Niveau:', this.botLevel);
            console.log('Couleur:', this.botColor);
            console.log('En réflexion:', this.isBotThinking);
            console.log('Nombre de coups:', this.moveCount);
            console.log('Tentatives:', this.retryCount);
            console.log('Instance bot:', this.bot);
            console.log('Tour du bot?', this.isBotTurn() ? '✅ OUI' : '❌ NON');
            
            if (this.chessGame && this.chessGame.gameState) {
                console.log('Joueur actuel:', this.chessGame.gameState.currentPlayer);
                console.log('Jeu actif:', this.chessGame.gameState.gameActive);
            }
            console.groupEnd();
        }
    }
    
    // Méthode statique pour recharger la configuration
    static reloadConfig() {
        const oldValue = this.consoleLog;
        this.loadConfig();
        
        if (this.consoleLog && oldValue !== this.consoleLog) {
            console.log(`🔄 BotManager: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
        }
        return this.consoleLog;
    }
    
    // Méthode statique pour obtenir la source de configuration
    static getConfigSource() {
        if (window.appConfig) {
            return 'JSON config';
        } else if (typeof window.getConfig === 'function') {
            return 'fonction getConfig';
        } else {
            return 'valeur par défaut';
        }
    }
}

// Initialisation statique
BotManager.init();

// Exposer des fonctions utilitaires globales
window.BotManagerUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => BotManager.reloadConfig(),
    
    // Obtenir l'état de la configuration
    getConfigState: () => ({
        consoleLog: BotManager.consoleLog,
        source: BotManager.getConfigSource(),
        debugMode: BotManager.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Tester la configuration
    testConfig: () => {
        console.group('🧪 Test de configuration BotManager');
        console.log('consoleLog actuel:', BotManager.consoleLog);
        console.log('Source config:', BotManager.getConfigSource());
        console.log('window.appConfig disponible:', !!window.appConfig);
        
        if (window.appConfig) {
            console.log('Valeur debug.console_log dans appConfig:', 
                window.appConfig.debug?.console_log, 
                '(type:', typeof window.appConfig.debug?.console_log + ')');
        }
        
        console.log('Mode debug activé:', BotManager.isDebugMode());
        console.groupEnd();
        
        return BotManager.consoleLog;
    }
};

window.BotManager = BotManager;