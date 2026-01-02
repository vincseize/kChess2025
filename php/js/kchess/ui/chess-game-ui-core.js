// ui/chess-game-ui-core.js - Version utilisant la configuration JSON comme priorité
class ChessGameUI {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('🎨 ui/chess-game-ui-core.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
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
                console.warn('⚠️ ChessGameUI: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessGameUI: Erreur lors du chargement de la config:', error);
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

    constructor(game) {
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        if (this.constructor.consoleLog) {
            console.log('🎨 [ChessGameUI] Initialisation UI');
        }
        
        this.game = game;
        
        try {
            this.timerManager = new ChessTimerManager(this);
            this.modalManager = new ChessModalManager(this);
            this.moveHistoryManager = new ChessMoveHistoryManager(this);
            this.clipboardManager = new ChessClipboardManager(this);
            this.styleManager = new ChessStyleManager(this);
        } catch (error) {
            console.error('❌ [ChessGameUI] Erreur initialisation modules:', error);
            
            // Initialiser avec des valeurs null si les classes ne sont pas disponibles
            this.timerManager = null;
            this.modalManager = null;
            this.moveHistoryManager = null;
            this.clipboardManager = null;
            this.styleManager = null;
        }
        
        // Initialiser les styles
        if (this.styleManager && this.styleManager.initAllStyles) {
            this.styleManager.initAllStyles();
        }
        
        // Démarrer le timer après un court délai
        setTimeout(() => {
            if (this.timerManager && this.timerManager.startTimer) {
                this.timerManager.startTimer();
            }
        }, 1000);
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGameUI] Initialisation terminée');
        }
    }

    setupEventListeners() {
        // Boutons desktop
        document.getElementById('newGame')?.addEventListener('click', () => {
            this.modalManager?.confirmNewGame?.();
        });
        
        document.getElementById('flipBoard')?.addEventListener('click', () => {
            this.game?.flipBoard?.();
        });
        
        document.getElementById('copyFEN')?.addEventListener('click', () => {
            this.clipboardManager?.copyFENToClipboard?.();
        });
        
        document.getElementById('copyPGN')?.addEventListener('click', () => {
            this.clipboardManager?.copyPGNToClipboard?.();
        });
        
        // Boutons mobiles
        document.getElementById('newGameMobile')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.modalManager?.confirmNewGame?.();
        });
        
        document.getElementById('flipBoardMobile')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.game?.flipBoard?.();
        });
        
        // Événements du plateau
        this.setupBoardEventListeners();
    }

    setupBoardEventListeners() {
        const chessBoard = document.getElementById('chessBoard');
        if (!chessBoard) {
            if (this.constructor.consoleLog) {
                console.warn('⚠️ [ChessGameUI] Élément chessBoard non trouvé');
            }
            return;
        }
        
        // Clic souris
        chessBoard.addEventListener('click', (e) => {
            const square = e.target.closest('.chess-square');
            if (square) {
                const displayRow = parseInt(square.dataset.displayRow);
                const displayCol = parseInt(square.dataset.displayCol);
                
                this.game.moveHandler?.handleSquareClick?.(displayRow, displayCol);
            }
        });

        // Touch mobile
        chessBoard.addEventListener('touchstart', (e) => {
            const square = e.target.closest('.chess-square');
            if (square) {
                e.preventDefault();
                const displayRow = parseInt(square.dataset.displayRow);
                const displayCol = parseInt(square.dataset.displayCol);
                
                this.game.moveHandler?.handleSquareClick?.(displayRow, displayCol);
            }
        }, { passive: false });
    }

    // Mettre à jour l'UI complète
updateUI() {
        this.timerManager?.updateTimerDisplay?.();
        this.moveHistoryManager?.updateMoveHistory?.();
        this.updateGameStatus();
        this.updateBotIndicator();
        
        if (typeof window.updatePlayerLabels === 'function') window.updatePlayerLabels();

        // --- AJOUT : Déclencheur du Bot ---
        if (this.game.core?.botManager?.isBotTurn()) {
            setTimeout(() => {
                this.game.core.botManager.playBotMove();
            }, 250);
        }
    }

    updateGameStatus() {
        const currentPlayerElement = document.getElementById('currentPlayer');
        if (!currentPlayerElement) return;

        // 1. SÉCURITÉ : Récupérer le FEN
        let fen = "";
        if (typeof this.game.getFEN === 'function') {
            fen = this.game.getFEN();
        } else if (this.game.core && typeof this.game.core.getFEN === 'function') {
            fen = this.game.core.getFEN();
        } else if (window.FENGenerator && typeof window.FENGenerator.generate === 'function') {
            fen = window.FENGenerator.generate(this.game.board, this.game.gameState);
        } else {
            return;
        }

        // 2. Récupérer l'analyse du statut via le contrôleur
        const statusInfo = ChessStatusController.checkGameStatus(fen);
        const t = this.getTranslations();
        
        // 3. LOGIQUE D'AFFICHAGE DU TEXTE
        let statusText = "";
        let isGameOver = false;

        // Cas : ÉCHEC ET MAT
        if (statusInfo.status === 'checkmate') {
            const loser = this.game.gameState.currentPlayer === 'white' ? (t.white || 'Blancs') : (t.black || 'Noirs');
            statusText = `💀 ${t.checkmate || 'ÉCHEC ET MAT'} (${loser})`;
            currentPlayerElement.style.color = '#dc3545'; // Rouge vif
            currentPlayerElement.style.fontWeight = '900';
            isGameOver = true;
        } 
        // Cas : PAT (Stalemate)
        else if (statusInfo.status === 'stalemate') {
            statusText = `🤝 ${t.stalemate || 'Match nul (Pat)'}`;
            currentPlayerElement.style.color = '#6c757d'; // Gris
            isGameOver = true;
        }
        // Cas : ÉCHEC SIMPLE
        else if (statusInfo.status === 'check') {
            const turnText = this.game.gameState.currentPlayer === 'white' ? 
                             (t.traitAuBlancs || 'Aux blancs') : (t.traitAuxNoirs || 'Aux noirs');
            statusText = `${turnText} - ⚠️ ${t.check || 'ÉCHEC'}`;
            currentPlayerElement.style.color = '#ffc107'; // Jaune orangé
            currentPlayerElement.style.fontWeight = 'bold';
        } 
        // Cas : JEU EN COURS
        else {
            statusText = this.game.gameState.currentPlayer === 'white' ? 
                         (t.traitAuBlancs || 'Aux blancs') : (t.traitAuxNoirs || 'Aux noirs');
            currentPlayerElement.style.color = '';
            currentPlayerElement.style.fontWeight = 'normal';
        }

        // Mise à jour du DOM
        currentPlayerElement.textContent = statusText;

        // Optionnel : Arrêter les timers si c'est fini
        if (isGameOver && this.timerManager) {
            this.timerManager.stopTimer?.();
        }
    }

    updateBotIndicator() {
        const botStatus = this.game.getBotStatus ? this.game.getBotStatus() : { active: false };
        const currentPlayerElement = document.getElementById('currentPlayer');
        const botIndicatorElement = document.getElementById('botIndicator') || this.createBotIndicator();
        
        if (!currentPlayerElement) return;
        
        if (botStatus.active) {
            let botType = '';
            let botIcon = '';
            
            const t = this.getTranslations();

            switch(botStatus.level) {
                case 1:
                    botType = t.bot_level1 || t.random_bot || 'Bot';
                    botIcon = '🤖';
                    break;
                case 2:
                    botType = t.ccmo_bot || t.bot_level2 || 'Bot';
                    botIcon = '🧠';
                    break;
                case 3:
                    // Priorité à la nouvelle clé ccmo_bot3 pour le Niveau 3
                    botType = t.ccmo_bot3 || t.bot_level3 || 'Bot';
                    botIcon = '🧡'; // Optionnel : un emoji différent pour marquer le niveau orange
                    break;
                default:
                    if (t[`bot_level${botStatus.level}`]) {
                        botType = t[`bot_level${botStatus.level}`];
                    } else if (t.bot_level1) {
                        botType = t.bot_level1.replace('1', botStatus.level);
                    } else {
                        botType = `Bot ${botStatus.level}`;
                    }
                    botIcon = '🤖';
            }
            
            botIndicatorElement.innerHTML = `
                <span class="bot-indicator" title="${botType} - ${t.plays || 'Joue'} les ${botStatus.color === 'white' ? t.white : t.black}">
                    ${botIcon} ${botType}
                </span>
            `;
            
            currentPlayerElement.classList.add('bot-active');
            
            const isBotTurn = this.game.core && this.game.core.botManager && 
                            this.game.core.botManager.isBotTurn && 
                            this.game.core.botManager.isBotTurn();
            
            if (isBotTurn) {
                currentPlayerElement.classList.add('bot-turn');
                currentPlayerElement.title = `${botType} ${t.thinking || 'réfléchit...'}`;
            } else {
                currentPlayerElement.classList.remove('bot-turn');
                currentPlayerElement.title = '';
            }
        } else {
            botIndicatorElement.innerHTML = '';
            currentPlayerElement.classList.remove('bot-active', 'bot-turn');
            currentPlayerElement.title = '';
        }
    }
    
    // Créer l'élément indicateur de bot s'il n'existe pas
    createBotIndicator() {
        const container = document.querySelector('.player-info') || document.getElementById('currentPlayer')?.parentElement;
        if (!container) return document.createElement('div');
        
        const botIndicator = document.createElement('div');
        botIndicator.id = 'botIndicator';
        botIndicator.className = 'bot-indicator-container';
        container.appendChild(botIndicator);
        
        return botIndicator;
    }
    
    // Méthode pour mettre à jour les labels des joueurs avec info bot
    updatePlayerLabelsWithBot() {
        if (typeof window.updatePlayerLabels === 'function') {
            window.updatePlayerLabels();
        }
    }

    // Méthode utilitaire pour les notifications
    showNotification(message, type = 'info') {
        if (this.game.gameStatusManager && this.game.gameStatusManager.showNotification) {
            this.game.gameStatusManager.showNotification(message, type);
        } else {
            // Notification simple
            const notification = document.createElement('div');
            notification.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed top-0 end-0 m-3`;
            notification.style.zIndex = '9999';
            
            const icon = type === 'success' ? 'bi-check-circle' : 
                        type === 'error' ? 'bi-exclamation-triangle' : 'bi-info-circle';
            
            notification.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bi ${icon} me-2"></i>
                    <span>${message}</span>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
    }
    
    // NOUVELLE MÉTHODE : Obtenir le statut de l'UI
    getUIStatus() {
        const status = {
            hasTimerManager: !!this.timerManager,
            hasModalManager: !!this.modalManager,
            hasMoveHistoryManager: !!this.moveHistoryManager,
            hasClipboardManager: !!this.clipboardManager,
            hasStyleManager: !!this.styleManager,
            hasGame: !!this.game,
            isGameActive: this.game?.gameState?.gameActive || false,
            currentPlayer: this.game?.gameState?.currentPlayer || 'unknown',
            botStatus: this.game?.getBotStatus ? this.game.getBotStatus() : { active: false }
        };
        
        return status;
    }
    
    // Méthode utilitaire pour récupérer les traductions
    getTranslations() {
        try {
            // Vérifier si la configuration existe
            if (window.appConfig && window.appConfig.lang) {
                // PRIORITÉ 1: Utiliser current_lang de la config
                if (window.appConfig.current_lang && window.appConfig.lang[window.appConfig.current_lang]) {
                    return window.appConfig.lang[window.appConfig.current_lang];
                }
                
                // PRIORITÉ 2: Vérifier localStorage
                const savedLang = localStorage.getItem('charlychess_lang');
                if (savedLang && window.appConfig.lang[savedLang]) {
                    return window.appConfig.lang[savedLang];
                }
                
                // PRIORITÉ 3: Utiliser getCurrentLanguage()
                const detectedLang = this.getCurrentLanguage();
                if (detectedLang && window.appConfig.lang[detectedLang]) {
                    return window.appConfig.lang[detectedLang];
                }
                
                // PRIORITÉ 4: Fallback à default_lang
                const defaultLang = window.appConfig.default_lang || 'fr';
                if (window.appConfig.lang[defaultLang]) {
                    return window.appConfig.lang[defaultLang];
                }
                
                // PRIORITÉ 5: Fallback final au français
                return window.appConfig.lang.fr || {};
            }
        } catch (error) {
            console.error('❌ [ChessGameUI] Erreur lors du chargement des traductions:', error);
        }
        
        return {};
    }

    // Méthode pour déterminer la langue actuelle
    getCurrentLanguage() {
        // Vérifier dans localStorage
        if (localStorage.getItem('charlychess_lang')) {
            return localStorage.getItem('charlychess_lang');
        }
        
        // Vérifier la langue du navigateur
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.startsWith('en')) {
            return 'en';
        }
        
        // Par défaut, retourner français
        return 'fr';
    }
}

// Initialisation statique
ChessGameUI.init();

// Exposer la classe globalement
window.ChessGameUI = ChessGameUI;

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ChessGameUI.loadConfig();
        }, 100);
    });
} else {
    setTimeout(() => {
        ChessGameUI.loadConfig();
    }, 100);
}