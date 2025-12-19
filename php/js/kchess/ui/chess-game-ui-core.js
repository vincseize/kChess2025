// ui/chess-game-ui-core.js - Version corrigée et complète
class ChessGameUI {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; 
    
    /**
     * Système de log centralisé sécurisé
     * Remplace les console.log directs pour éviter les erreurs de type
     */
    static log(message, type = 'log', data = null) {
        if (!this.consoleLog && type !== 'error' && type !== 'warn') return;
        
        const emojis = {
            log: '🎨', warn: '⚠️', error: '❌', info: '🌐',
            success: '✅', bot: '🤖', timer: '⏱️', event: '🎮', config: '⚙️'
        };

        const methodMap = {
            log: 'log', success: 'log', bot: 'log', timer: 'log',
            event: 'log', config: 'log', info: 'info', warn: 'warn', error: 'error'
        };

        const method = methodMap[type] || 'log';
        const prefix = `[ChessGameUI]`;
        const emoji = emojis[type] || emojis.log;
        const output = `${emoji} ${prefix} ${message}`;

        if (data) {
            console[method](output, data);
        } else {
            console[method](output);
        }
    }

    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            this.log('Fichier chargé', 'log');
            this.log(`Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`, 'config');
        } else {
            console.info('🎨 ChessGameUI: Mode silencieux activé (debug désactivé dans config)');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                
                // Gérer les types string et boolean
                if (configValue === "false" || configValue === false) {
                    this.consoleLog = false;
                } else if (configValue === "true" || configValue === true) {
                    this.consoleLog = true;
                } else {
                    this.consoleLog = Boolean(configValue);
                }
                
                if (this.consoleLog) {
                    this.log(`Configuration chargée (valeur brute: "${configValue}")`, 'config');
                }
                return true;
            }
            
            if (typeof window.getConfig === 'function') {
                const configValue = window.getConfig('debug.console_log', 'true');
                this.consoleLog = !(configValue === "false" || configValue === false);
                return true;
            }
            
            if (this.consoleLog) {
                this.log('Aucune configuration trouvée, utilisation du mode debug par défaut', 'warn');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessGameUI: Erreur lors du chargement de la config:', error);
            return false;
        }
    }
    
    static getConfigSource() {
        if (window.appConfig) return 'JSON config';
        if (typeof window.getConfig === 'function') return 'fonction getConfig';
        return 'valeur par défaut';
    }
    
    static isDebugMode() {
        return this.consoleLog;
    }

    constructor(game) {
        this.constructor.loadConfig();
        
        this.constructor.log('=== INITIALISATION UI ===', 'log');
        this.game = game;
        
        try {
            this.timerManager = new ChessTimerManager(this);
            this.modalManager = new ChessModalManager(this);
            this.moveHistoryManager = new ChessMoveHistoryManager(this);
            this.clipboardManager = new ChessClipboardManager(this);
            this.styleManager = new ChessStyleManager(this);
            
            this.constructor.log('Modules initialisés', 'success');
        } catch (error) {
            this.constructor.log(`Erreur initialisation modules: ${error.message}`, 'error');
            this.timerManager = this.modalManager = this.moveHistoryManager = 
            this.clipboardManager = this.styleManager = null;
        }
        
        if (this.styleManager?.initAllStyles) {
            this.styleManager.initAllStyles();
            this.constructor.log('Styles initialisés', 'success');
        }
        
        setTimeout(() => {
            if (this.timerManager?.startTimer) {
                this.timerManager.startTimer();
                this.constructor.log('Timer démarré', 'timer');
            }
        }, 1000);
        
        this.constructor.log('=== INITIALISATION TERMINÉE ===', 'log');
    }

    setupEventListeners() {
        this.constructor.log('=== CONFIGURATION DES ÉVÉNEMENTS ===', 'event');
        
        const attachClick = (id, callback, logMsg) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', (e) => {
                    if (this.constructor.consoleLog) this.constructor.log(logMsg, 'event');
                    callback(e);
                });
            }
        };

        // Desktop & Mobile
        attachClick('newGame', () => this.modalManager?.confirmNewGame?.(), 'Bouton nouvelle partie');
        attachClick('newGameMobile', (e) => { e.preventDefault(); this.modalManager?.confirmNewGame?.(); }, 'Bouton nouvelle partie mobile');
        attachClick('flipBoard', () => this.game?.flipBoard?.(), 'Bouton flip board');
        attachClick('flipBoardMobile', (e) => { e.preventDefault(); this.game?.flipBoard?.(); }, 'Bouton flip board mobile');
        attachClick('copyFEN', () => this.clipboardManager?.copyFENToClipboard?.(), 'Bouton copier FEN');
        attachClick('copyPGN', () => this.clipboardManager?.copyPGNToClipboard?.(), 'Bouton copier PGN');

        this.setupBoardEventListeners();
    }

    setupBoardEventListeners() {
        const chessBoard = document.getElementById('chessBoard');
        if (!chessBoard) {
            this.constructor.log('Élément chessBoard non trouvé', 'warn');
            return;
        }
        
        const handleInteraction = (e) => {
            const square = e.target.closest('.chess-square');
            if (square) {
                const displayRow = parseInt(square.dataset.displayRow);
                const displayCol = parseInt(square.dataset.displayCol);
                this.constructor.log(`Interaction case [${displayRow},${displayCol}]`, 'event');
                this.game.moveHandler?.handleSquareClick?.(displayRow, displayCol);
            }
        };

        chessBoard.addEventListener('click', handleInteraction);
        chessBoard.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleInteraction(e);
        }, { passive: false });
    }

    updateUI() {
        this.constructor.log('=== MISE À JOUR COMPLÈTE UI ===', 'log');
        this.timerManager?.updateTimerDisplay?.();
        this.moveHistoryManager?.updateMoveHistory?.();
        this.updateGameStatus();
        this.updateBotIndicator();
        this.updatePlayerLabelsWithBot();
    }

    updateGameStatus() {
        const currentPlayerElement = document.getElementById('currentPlayer');
        if (!currentPlayerElement) return;
        
        if (this.game.gameState?.currentPlayer) {
            const t = this.getTranslations();
            const player = this.game.gameState.currentPlayer;
            const text = player === 'white' ? (t.traitAuBlancs || 'Aux blancs') : (t.traitAuxNoirs || 'Aux noirs');
            currentPlayerElement.textContent = text;
        }
    }

    updateBotIndicator() {
        const botStatus = this.game.getBotStatus ? this.game.getBotStatus() : { active: false };
        const currentPlayerElement = document.getElementById('currentPlayer');
        let botIndicatorElement = document.getElementById('botIndicator') || this.createBotIndicator();
        
        if (!currentPlayerElement || !botIndicatorElement) return;
        
        if (botStatus.active) {
            const t = this.getTranslations();
            let botType = t[`bot_level${botStatus.level}`] || t.bot_level1?.replace('1', botStatus.level) || 'Bot';
            let botIcon = botStatus.level === 2 ? '🧠' : '🤖';
            
            botIndicatorElement.innerHTML = `
                <span class="bot-indicator" title="${botType} - ${t.plays || 'Joue'} ${botStatus.color}">
                    ${botIcon} ${botType}
                </span>`;
            
            currentPlayerElement.classList.add('bot-active');
            const isBotTurn = this.game.core?.botManager?.isBotTurn?.();
            
            if (isBotTurn) {
                currentPlayerElement.classList.add('bot-turn');
                currentPlayerElement.title = `${botType} ${t.thinking || 'réfléchit...'}`;
            } else {
                currentPlayerElement.classList.remove('bot-turn');
            }
        } else {
            botIndicatorElement.innerHTML = '';
            currentPlayerElement.classList.remove('bot-active', 'bot-turn');
        }
    }
    
    createBotIndicator() {
        const container = document.querySelector('.player-info') || document.getElementById('currentPlayer')?.parentElement;
        if (!container) return null;
        const botIndicator = document.createElement('div');
        botIndicator.id = 'botIndicator';
        botIndicator.className = 'bot-indicator-container';
        container.appendChild(botIndicator);
        return botIndicator;
    }
    
    updatePlayerLabelsWithBot() {
        if (typeof window.updatePlayerLabels === 'function') {
            window.updatePlayerLabels();
        }
    }

    showNotification(message, type = 'info') {
        this.constructor.log(`Notification ${type}: ${message}`, 'info');
        if (this.game.gameStatusManager?.showNotification) {
            this.game.gameStatusManager.showNotification(message, type);
        } else {
            const notif = document.createElement('div');
            notif.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed top-0 end-0 m-3`;
            notif.style.zIndex = '9999';
            notif.innerHTML = `<span>${message}</span>`;
            document.body.appendChild(notif);
            setTimeout(() => notif.remove(), 3000);
        }
    }

    getTranslations() {
        try {
            if (window.appConfig?.lang) {
                const lang = window.appConfig.current_lang || this.getCurrentLanguage();
                return window.appConfig.lang[lang] || window.appConfig.lang.fr || {};
            }
        } catch (e) {
            this.constructor.log('Erreur traductions', 'error');
        }
        return {};
    }

    getCurrentLanguage() {
        return localStorage.getItem('charlychess_lang') || 
               (navigator.language.startsWith('en') ? 'en' : 'fr');
    }

    getUIStatus() {
        return {
            hasTimer: !!this.timerManager,
            botActive: this.game?.getBotStatus?.().active || false,
            lang: this.getCurrentLanguage()
        };
    }
}