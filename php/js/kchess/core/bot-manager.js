/**
 * BotManager - Gère l'initialisation, la configuration et le cycle de vie des bots
 * Supporte le mode debug dynamique via window.appConfig.debug.console_log
 */
class BotManager {
    
    // Propriétés statiques pour la configuration globale
    static consoleLog = true;
    static initialized = false;

    /**
     * Initialise le manager et charge la configuration
     */
    static init() {
        this.loadConfig();
        this.initialized = true;
        
        if (this.consoleLog) {
            console.log('🚀 [BotManager] Système initialisé (Mode Debug)');
        } else {
            console.info('🔇 [BotManager] Système initialisé (Mode Silencieux)');
        }
    }

    /**
     * Charge et convertit la configuration JSON
     */
    static loadConfig() {
        try {
            let configValue = true; // Valeur par défaut

            // 1. Priorité au window.appConfig
            if (window.appConfig && window.appConfig.debug) {
                configValue = window.appConfig.debug.console_log;
            } 
            // 2. Repli sur la fonction utilitaire si existante
            else if (typeof window.getConfig === 'function') {
                configValue = window.getConfig('debug.console_log', true);
            }

            // Conversion stricte (gère les types String et Boolean)
            if (configValue === "false" || configValue === false) {
                this.consoleLog = false;
            } else {
                this.consoleLog = true;
            }

            return true;
        } catch (error) {
            console.error('❌ [BotManager] Erreur critique lors du chargement de la config:', error);
            return false;
        }
    }

    /**
     * Logger interne intelligent
     */
    static log(message, data = null, type = 'log') {
        if (!this.consoleLog && type === 'log') return;
        
        const prefix = '🤖 [BotManager] ';
        if (data) {
            console[type](prefix + message, data);
        } else {
            console[type](prefix + message);
        }
    }

    // --- Méthodes d'instance ---

    constructor(chessGame) {
        this.chessGame = chessGame;
        this.bot = null;
        this.botLevel = 0;
        this.botColor = 'black';
        this.isBotThinking = false;
        this.moveCount = 0;
        this.maxRetries = 3;
        this.retryCount = 0;

        BotManager.log('Gestionnaire instancié pour une nouvelle partie');
    }

    /**
     * Configure le niveau du bot et sa couleur
     */
    setBotLevel(level, color = 'black') {
        BotManager.loadConfig(); // Rafraîchissement de la config avant action
        
        const newLevel = parseInt(level);
        BotManager.log(`Configuration : Niveau ${newLevel}, Couleur ${color}`);

        this.botLevel = newLevel;
        this.botColor = color;
        this.moveCount = 0;
        this.retryCount = 0;
        this.bot = null;

        if (newLevel === 0) {
            BotManager.log('Bot désactivé', null, 'info');
        } else {
            this._instantiateBot(newLevel);
        }

        // Si c'est au bot de jouer immédiatement
        this._triggerDelayedMove();
        
        return this.bot;
    }

    /**
     * Instanciation dynamique selon le niveau
     */
    _instantiateBot(level) {
        const botClassName = `Level_${level}`;
        if (window[botClassName]) {
            this.bot = new window[botClassName]();
            BotManager.log(`Bot ${botClassName} activé (${this.bot.name})`, null, 'info');
        } else {
            BotManager.log(`Classe ${botClassName} introuvable !`, null, 'error');
        }
    }

    /**
     * Vérifie si les conditions sont réunies pour que le bot joue
     */
    isBotTurn() {
        try {
            if (!this.chessGame?.gameState || !this.bot || this.botLevel === 0) return false;
            
            const state = this.chessGame.gameState;
            const isTurn = state.gameActive && 
                           state.currentPlayer === this.botColor && 
                           !this.isBotThinking;

            return isTurn;
        } catch (e) {
            return false;
        }
    }

    /**
     * Logique principale d'exécution du coup
     */
    async playBotMove() {
        if (!this.isBotTurn() || this.isBotThinking) return;

        this.isBotThinking = true;
        BotManager.log(`Réflexion en cours (Coup n°${this.moveCount + 1})...`);

        try {
            // Simulation d'un temps de réflexion humain (50ms - 250ms)
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 200));

            // Vérification de sécurité après le délai
            if (this.chessGame.gameState.currentPlayer !== this.botColor) {
                throw new Error("Le tour a changé pendant la réflexion");
            }

            // 1. Génération du FEN via l'utilitaire global
            const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
            
            // 2. Calcul du coup par le Bot
            const botMove = this.bot.getMove(currentFEN);

            if (!botMove) {
                this._handleMoveFailure("Aucun coup trouvé par l'IA");
                return;
            }

            // 3. Exécution du coup sur le moteur de jeu
            const success = this.chessGame.handleMove(
                botMove.fromRow, botMove.fromCol, 
                botMove.toRow, botMove.toCol
            );

            if (success) {
                this.moveCount++;
                this.retryCount = 0;
                BotManager.log(`Coup réussi : ${this._getNotation(botMove)}`);
            } else {
                this._handleMoveFailure("Le moteur de jeu a refusé le coup");
            }

        } catch (error) {
            BotManager.log(`Erreur playBotMove: ${error.message}`, null, 'error');
        } finally {
            this.isBotThinking = false;
        }
    }

    _handleMoveFailure(reason) {
        this.retryCount++;
        BotManager.log(`Échec : ${reason} (Tentative ${this.retryCount}/${this.maxRetries})`, null, 'warn');
        
        if (this.retryCount < this.maxRetries) {
            setTimeout(() => this.playBotMove(), 200);
        }
    }

    _triggerDelayedMove() {
        setTimeout(() => {
            if (this.isBotTurn()) this.playBotMove();
        }, 600);
    }

    _getNotation(move) {
        const files = 'abcdefgh';
        const rows = '87654321';
        return `${files[move.fromCol]}${rows[move.fromRow]} ⮕ ${files[move.toCol]}${rows[move.toRow]}`;
    }

    /**
     * Méthodes de contrôle public
     */
    setBotColor(color) {
        this.botColor = color;
        BotManager.log(`Nouvelle couleur assignée: ${color}`, null, 'info');
        this._triggerDelayedMove();
    }

    getStatus() {
        return {
            level: this.botLevel,
            color: this.botColor,
            thinking: this.isBotThinking,
            moveCount: this.moveCount,
            active: this.botLevel > 0 && !!this.bot
        };
    }
}

// Initialisation au chargement du script
BotManager.init();

// Exportation globale
window.BotManager = BotManager;

// Utilitaires de Debug Console
window.BotUtils = {
    test: () => {
        BotManager.loadConfig();
        console.table({
            "Mode Debug": BotManager.consoleLog ? "✅ ON" : "🔇 OFF",
            "Config Source": window.appConfig ? "JSON window.appConfig" : "Default/Fallbacks",
            "Version": "2.1.0 (Logger-Centralized)"
        });
    },
    forceReload: () => BotManager.loadConfig()
};