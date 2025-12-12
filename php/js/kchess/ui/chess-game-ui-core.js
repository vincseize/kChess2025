// ui/chess-game-ui-core.js - Version utilisant la configuration JSON comme priorité
class ChessGameUI {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {



        // AJOUTER CETTE VÉRIFICATION AVEC ALERT
        alert('🔍 VÉRIFICATION DES VARIABLES JSON:\n\n' +
              `1. window.appConfig existe ? ${!!window.appConfig}\n` +
              `2. window.appTranslations existe ? ${!!window.appTranslations}\n` +
              `3. window.appConfig?.lang = "${window.appConfig?.lang || 'NON DÉFINI'}"\n` +
              `4. window.appTranslations?.new_game = "${window.appTranslations?.new_game || 'NON TROUVÉ'}"\n\n` +
              'Voir la console (F12) pour plus de détails.');
        
        // Afficher plus de détails dans la console
        console.log('🔍 === VÉRIFICATION DÉTAILLÉE ===');
        console.log('📦 window.appConfig:', window.appConfig);
        console.log('📚 window.appTranslations:', window.appTranslations);
        console.log('🌍 Langue:', window.appConfig?.lang);



        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('🎨 ui/chess-game-ui-core.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('🎨 ChessGameUI: Mode silencieux activé (debug désactivé dans config)');
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
                        console.info('🔧 ChessGameUI: console_log désactivé via config JSON');
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
                    console.log(`⚙️ ChessGameUI: Configuration chargée - console_log = ${this.consoleLog} (valeur brute: "${configValue}")`);
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
        
        // Mode debug
        if (this.constructor.consoleLog) {
            console.log('\n🎨 [ChessGameUI] === INITIALISATION UI ===');
            console.log('🎨 [ChessGameUI] Création de l\'interface utilisateur...');
            console.log('🎨 [ChessGameUI] Game instance:', game);
        }
        
        this.game = game;
        
        // Initialiser les modules
        if (this.constructor.consoleLog) {
            console.log('🎨 [ChessGameUI] Initialisation des modules...');
        }
        
        try {
            this.timerManager = new ChessTimerManager(this);
            this.modalManager = new ChessModalManager(this);
            this.moveHistoryManager = new ChessMoveHistoryManager(this);
            this.clipboardManager = new ChessClipboardManager(this);
            this.styleManager = new ChessStyleManager(this);
            
            if (this.constructor.consoleLog) {
                console.log('✅ [ChessGameUI] Modules initialisés:');
                console.log('   • TimerManager:', this.timerManager);
                console.log('   • ModalManager:', this.modalManager);
                console.log('   • MoveHistoryManager:', this.moveHistoryManager);
                console.log('   • ClipboardManager:', this.clipboardManager);
                console.log('   • StyleManager:', this.styleManager);
            }
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [ChessGameUI] Erreur initialisation modules: ${error.message}`);
            }
            
            // Initialiser avec des valeurs null si les classes ne sont pas disponibles
            this.timerManager = null;
            this.modalManager = null;
            this.moveHistoryManager = null;
            this.clipboardManager = null;
            this.styleManager = null;
        }
        
        // Initialiser les styles
        if (this.constructor.consoleLog) {
            console.log('🎨 [ChessGameUI] Initialisation des styles...');
        }
        
        if (this.styleManager && this.styleManager.initAllStyles) {
            this.styleManager.initAllStyles();
            if (this.constructor.consoleLog) {
                console.log('✅ [ChessGameUI] Styles initialisés');
            }
        } else {
            if (this.constructor.consoleLog) {
                console.warn('⚠️ [ChessGameUI] StyleManager non disponible');
            }
        }
        
        // Démarrer le timer après un court délai
        setTimeout(() => {
            if (this.timerManager && this.timerManager.startTimer) {
                if (this.constructor.consoleLog) {
                    console.log('⏱️ [ChessGameUI] Démarrage du timer...');
                }
                
                this.timerManager.startTimer();
                
                if (this.constructor.consoleLog) {
                    console.log('✅ [ChessGameUI] Timer démarré');
                }
            } else {
                if (this.constructor.consoleLog) {
                    console.warn('⚠️ [ChessGameUI] TimerManager non disponible');
                }
            }
        }, 1000);
        
        if (this.constructor.consoleLog) {
            console.log('🎨 [ChessGameUI] === INITIALISATION TERMINÉE ===\n');
        }
    }

    setupEventListeners() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
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
            return;
        }
        
        // Mode debug
        console.log('\n🎮 [ChessGameUI] === CONFIGURATION DES ÉVÉNEMENTS ===');
        console.log('🎮 [ChessGameUI] Configuration des écouteurs d\'événements...');
        
        // Boutons desktop
        console.log('🖥️ [ChessGameUI] Configuration boutons desktop...');
        
        document.getElementById('newGame')?.addEventListener('click', () => {
            console.log('🎮 [ChessGameUI] Bouton nouvelle partie desktop cliqué');
            this.modalManager?.confirmNewGame?.();
        });
        
        document.getElementById('flipBoard')?.addEventListener('click', () => {
            console.log('🔄 [ChessGameUI] Bouton flip board desktop cliqué');
            this.game?.flipBoard?.();
        });
        
        document.getElementById('copyFEN')?.addEventListener('click', () => {
            console.log('📋 [ChessGameUI] Bouton copier FEN cliqué');
            this.clipboardManager?.copyFENToClipboard?.();
        });
        
        document.getElementById('copyPGN')?.addEventListener('click', () => {
            console.log('📋 [ChessGameUI] Bouton copier PGN cliqué');
            this.clipboardManager?.copyPGNToClipboard?.();
        });
        
        // Boutons mobiles
        console.log('📱 [ChessGameUI] Configuration boutons mobiles...');
        
        document.getElementById('newGameMobile')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🎮 [ChessGameUI] Bouton nouvelle partie mobile touché');
            this.modalManager?.confirmNewGame?.();
        });
        
        document.getElementById('flipBoardMobile')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔄 [ChessGameUI] Bouton flip board mobile touché');
            this.game?.flipBoard?.();
        });
        
        // Événements du plateau
        console.log('🎯 [ChessGameUI] Configuration événements plateau...');
        this.setupBoardEventListeners();
        
        console.log('✅ [ChessGameUI] === ÉVÉNEMENTS CONFIGURÉS ===\n');
    }

    setupBoardEventListeners() {
        const chessBoard = document.getElementById('chessBoard');
        if (!chessBoard) {
            if (this.constructor.consoleLog) {
                console.warn('⚠️ [ChessGameUI] Élément chessBoard non trouvé');
            }
            return;
        }
        
        if (this.constructor.consoleLog) {
            console.log('🎯 [ChessGameUI] Configuration écouteurs plateau:', chessBoard);
        }
        
        // Clic souris
        chessBoard.addEventListener('click', (e) => {
            const square = e.target.closest('.chess-square');
            if (square) {
                const displayRow = parseInt(square.dataset.displayRow);
                const displayCol = parseInt(square.dataset.displayCol);
                
                if (this.constructor.consoleLog) {
                    console.log(`🎯 [ChessGameUI] Clic sur case [${displayRow},${displayCol}]`);
                }
                
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
                
                if (this.constructor.consoleLog) {
                    console.log(`📱 [ChessGameUI] Touch sur case [${displayRow},${displayCol}]`);
                }
                
                this.game.moveHandler?.handleSquareClick?.(displayRow, displayCol);
            }
        }, { passive: false });
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGameUI] Écouteurs plateau configurés');
        }
    }

    // Mettre à jour l'UI complète
    updateUI() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            // Mise à jour du timer
            this.timerManager?.updateTimerDisplay?.();
            
            // Mise à jour de l'historique
            this.moveHistoryManager?.updateMoveHistory?.();
            
            // Mise à jour du statut
            this.updateGameStatus();
            
            // Mise à jour de l'indicateur bot
            this.updateBotIndicator();
            
            // Mise à jour des labels des joueurs
            this.updatePlayerLabelsWithBot();
            return;
        }
        
        // Mode debug
        console.log('\n🔄 [ChessGameUI] === MISE À JOUR COMPLÈTE UI ===');
        
        // Mise à jour du timer
        console.log('⏱️ [ChessGameUI] Mise à jour du timer...');
        this.timerManager?.updateTimerDisplay?.();
        
        // Mise à jour de l'historique
        console.log('📜 [ChessGameUI] Mise à jour de l\'historique...');
        this.moveHistoryManager?.updateMoveHistory?.();
        
        // Mise à jour du statut
        console.log('📊 [ChessGameUI] Mise à jour du statut...');
        this.updateGameStatus();
        
        // Mise à jour de l'indicateur bot
        console.log('🤖 [ChessGameUI] Mise à jour indicateur bot...');
        this.updateBotIndicator();
        
        // Mise à jour des labels des joueurs
        console.log('🏷️ [ChessGameUI] Mise à jour des labels...');
        this.updatePlayerLabelsWithBot();
        
        console.log('✅ [ChessGameUI] === MISE À JOUR TERMINÉE ===\n');
    }

    updateGameStatus() {
        const currentPlayerElement = document.getElementById('currentPlayer');
        if (!currentPlayerElement) {
            if (this.constructor.consoleLog) {
                console.warn('⚠️ [ChessGameUI] Élément currentPlayer non trouvé');
            }
            return;
        }

        if (this.game.gameState && this.game.gameState.currentPlayer) {

            const player = this.game.gameState.currentPlayer;

            // 100% TRAD JSON — aucune phrase en dur
            const t = window.appTranslations || {};
            const text = player === 'white'
                ? t.traitAuBlancs
                : t.traitAuxNoirs;

            currentPlayerElement.textContent = text;

            if (this.constructor.consoleLog) {
                console.log(`📊 [ChessGameUI] Statut mis à jour: ${text}`);
            }

        } else {
            if (this.constructor.consoleLog) {
                console.warn('⚠️ [ChessGameUI] GameState ou currentPlayer non disponible');
            }
        }
    }

    updateBotIndicator() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const botStatus = this.game.getBotStatus ? this.game.getBotStatus() : { active: false };
            const currentPlayerElement = document.getElementById('currentPlayer');
            const botIndicatorElement = document.getElementById('botIndicator') || this.createBotIndicator();
            
            if (!currentPlayerElement) return;
            
            if (botStatus.active) {
                let botType = '';
                let botIcon = '';
                
                switch(botStatus.level) {
                    case 1:
                        botType = 'Bot Niv.1 (Aléatoire)';
                        botIcon = '🤖';
                        break;
                    case 2:
                        botType = 'Bot Niv.2 (CCMO)';
                        botIcon = '🧠';
                        break;
                    default:
                        botType = `Bot Niv.${botStatus.level}`;
                        botIcon = '🤖';
                }
                
                botIndicatorElement.innerHTML = `
                    <span class="bot-indicator" title="${botType} - Joue les ${botStatus.color === 'white' ? 'Blancs' : 'Noirs'}">
                        ${botIcon} ${botType}
                    </span>
                `;
                
                currentPlayerElement.classList.add('bot-active');
                
                const isBotTurn = this.game.core && this.game.core.botManager && 
                                this.game.core.botManager.isBotTurn && 
                                this.game.core.botManager.isBotTurn();
                
                if (isBotTurn) {
                    currentPlayerElement.classList.add('bot-turn');
                    currentPlayerElement.title = `${botType} réfléchit...`;
                } else {
                    currentPlayerElement.classList.remove('bot-turn');
                    currentPlayerElement.title = '';
                }
            } else {
                botIndicatorElement.innerHTML = '';
                currentPlayerElement.classList.remove('bot-active', 'bot-turn');
                currentPlayerElement.title = '';
            }
            return;
        }
        
        // Mode debug
        console.log('🤖 [ChessGameUI] Mise à jour indicateur bot...');
        
        const botStatus = this.game.getBotStatus ? this.game.getBotStatus() : { active: false };
        const currentPlayerElement = document.getElementById('currentPlayer');
        const botIndicatorElement = document.getElementById('botIndicator') || this.createBotIndicator();
        
        if (!currentPlayerElement) {
            console.warn('⚠️ [ChessGameUI] Élément currentPlayer non trouvé');
            return;
        }
        
        if (botStatus.active) {
            console.log(`🤖 [ChessGameUI] Bot actif: niveau ${botStatus.level}, couleur ${botStatus.color}`);
            
            let botType = '';
            let botIcon = '';
            
            switch(botStatus.level) {
                case 1:
                    botType = 'Bot Niv.1 (Aléatoire)';
                    botIcon = '🤖';
                    break;
                case 2:
                    botType = 'Bot Niv.2 (CCMO)';
                    botIcon = '🧠';
                    break;
                default:
                    botType = `Bot Niv.${botStatus.level}`;
                    botIcon = '🤖';
            }
            
            console.log(`🤖 [ChessGameUI] Type bot: ${botType}`);
            
            botIndicatorElement.innerHTML = `
                <span class="bot-indicator" title="${botType} - Joue les ${botStatus.color === 'white' ? 'Blancs' : 'Noirs'}">
                    ${botIcon} ${botType}
                </span>
            `;
            
            currentPlayerElement.classList.add('bot-active');
            
            const isBotTurn = this.game.core && this.game.core.botManager && 
                            this.game.core.botManager.isBotTurn && 
                            this.game.core.botManager.isBotTurn();
            
            if (isBotTurn) {
                currentPlayerElement.classList.add('bot-turn');
                currentPlayerElement.title = `${botType} réfléchit...`;
                console.log('🤖 [ChessGameUI] C\'est le tour du bot');
            } else {
                currentPlayerElement.classList.remove('bot-turn');
                currentPlayerElement.title = '';
            }
            
        } else {
            console.log('🤖 [ChessGameUI] Bot inactif');
            
            botIndicatorElement.innerHTML = '';
            currentPlayerElement.classList.remove('bot-active', 'bot-turn');
            currentPlayerElement.title = '';
        }
    }
    
    // Créer l'élément indicateur de bot s'il n'existe pas
    createBotIndicator() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const container = document.querySelector('.player-info') || document.getElementById('currentPlayer')?.parentElement;
            if (!container) return document.createElement('div');
            
            const botIndicator = document.createElement('div');
            botIndicator.id = 'botIndicator';
            botIndicator.className = 'bot-indicator-container';
            container.appendChild(botIndicator);
            
            return botIndicator;
        }
        
        // Mode debug
        console.log('🏗️ [ChessGameUI] Création élément indicateur bot...');
        
        const container = document.querySelector('.player-info') || document.getElementById('currentPlayer')?.parentElement;
        if (!container) {
            console.warn('⚠️ [ChessGameUI] Conteneur pour indicateur bot non trouvé');
            return document.createElement('div');
        }
        
        const botIndicator = document.createElement('div');
        botIndicator.id = 'botIndicator';
        botIndicator.className = 'bot-indicator-container';
        container.appendChild(botIndicator);
        
        console.log('✅ [ChessGameUI] Indicateur bot créé');
        
        return botIndicator;
    }
    
    // Méthode pour mettre à jour les labels des joueurs avec info bot
    updatePlayerLabelsWithBot() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            if (typeof window.updatePlayerLabels === 'function') {
                window.updatePlayerLabels();
            }
            return;
        }
        
        // Mode debug
        console.log('🏷️ [ChessGameUI] Mise à jour labels avec info bot...');
        
        if (typeof window.updatePlayerLabels === 'function') {
            window.updatePlayerLabels();
            console.log('✅ [ChessGameUI] Fonction updatePlayerLabels appelée');
        } else {
            console.warn('⚠️ [ChessGameUI] Fonction updatePlayerLabels non disponible');
        }
    }

    // Méthode utilitaire pour les notifications
    showNotification(message, type = 'info') {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
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
            return;
        }
        
        // Mode debug
        console.log(`📢 [ChessGameUI] Notification ${type}: ${message}`);
        
        if (this.game.gameStatusManager && this.game.gameStatusManager.showNotification) {
            console.log('📢 [ChessGameUI] Délégation à gameStatusManager');
            this.game.gameStatusManager.showNotification(message, type);
        } else {
            console.log('📢 [ChessGameUI] Création notification simple');
            
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
                    console.log('📢 [ChessGameUI] Notification supprimée');
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
        
        if (this.constructor.consoleLog) {
            console.log('📊 [ChessGameUI] Statut UI:', status);
        }
        
        return status;
    }
    
    // NOUVELLE MÉTHODE : Tester toutes les fonctionnalités de l'UI
    testUIFeatures() {
        // Mode silencieux - retourner le statut sans logs
        if (!this.constructor.consoleLog) {
            return this.getUIStatus();
        }
        
        // Mode debug
        console.group('🧪 [ChessGameUI] Test des fonctionnalités UI');
        
        const status = this.getUIStatus();
        
        // Tester chaque module
        const tests = {
            timerManager: this.testTimerManager(),
            modalManager: this.testModalManager(),
            clipboardManager: this.testClipboardManager(),
            styleManager: this.testStyleManager(),
            moveHistoryManager: this.testMoveHistoryManager(),
            eventListeners: this.testEventListeners(),
            notifications: this.testNotifications()
        };
        
        console.log('📊 [ChessGameUI] Résultats des tests:', tests);
        console.groupEnd();
        
        return {
            status: status,
            tests: tests
        };
    }
    
    testTimerManager() {
        if (!this.timerManager) return { available: false, error: 'TimerManager non disponible' };
        
        try {
            const methods = ['startTimer', 'stopTimer', 'updateTimerDisplay', 'getElapsedTime'];
            const availableMethods = methods.filter(method => typeof this.timerManager[method] === 'function');
            
            return {
                available: true,
                methodsAvailable: availableMethods.length,
                totalMethods: methods.length,
                allMethodsAvailable: availableMethods.length === methods.length
            };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }
    
    testModalManager() {
        if (!this.modalManager) return { available: false, error: 'ModalManager non disponible' };
        
        try {
            const methods = ['confirmNewGame', 'showPromotionModal'];
            const availableMethods = methods.filter(method => typeof this.modalManager[method] === 'function');
            
            return {
                available: true,
                methodsAvailable: availableMethods.length,
                totalMethods: methods.length
            };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }
    
    testClipboardManager() {
        if (!this.clipboardManager) return { available: false, error: 'ClipboardManager non disponible' };
        
        try {
            const methods = ['copyFENToClipboard', 'copyPGNToClipboard', 'isClipboardAvailable'];
            const availableMethods = methods.filter(method => typeof this.clipboardManager[method] === 'function');
            
            return {
                available: true,
                methodsAvailable: availableMethods.length,
                totalMethods: methods.length,
                clipboardAvailable: this.clipboardManager.isClipboardAvailable ? 
                    this.clipboardManager.isClipboardAvailable() : false
            };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }
    
    testStyleManager() {
        if (!this.styleManager) return { available: false, error: 'StyleManager non disponible' };
        
        try {
            const methods = ['initAllStyles', 'applyBoardStyle', 'applySquareColors'];
            const availableMethods = methods.filter(method => typeof this.styleManager[method] === 'function');
            
            return {
                available: true,
                methodsAvailable: availableMethods.length,
                totalMethods: methods.length
            };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }
    
    testMoveHistoryManager() {
        if (!this.moveHistoryManager) return { available: false, error: 'MoveHistoryManager non disponible' };
        
        try {
            const methods = ['updateMoveHistory'];
            const availableMethods = methods.filter(method => typeof this.moveHistoryManager[method] === 'function');
            
            return {
                available: true,
                methodsAvailable: availableMethods.length,
                totalMethods: methods.length
            };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }
    
    testEventListeners() {
        try {
            const elements = {
                newGame: document.getElementById('newGame'),
                flipBoard: document.getElementById('flipBoard'),
                copyFEN: document.getElementById('copyFEN'),
                copyPGN: document.getElementById('copyPGN'),
                newGameMobile: document.getElementById('newGameMobile'),
                flipBoardMobile: document.getElementById('flipBoardMobile'),
                chessBoard: document.getElementById('chessBoard')
            };
            
            const elementsFound = Object.entries(elements).filter(([name, el]) => !!el).length;
            
            return {
                elementsFound: elementsFound,
                totalElements: Object.keys(elements).length,
                chessBoardAvailable: !!elements.chessBoard
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    testNotifications() {
        try {
            // Test simple - vérifier si la méthode existe
            const canShowNotification = typeof this.showNotification === 'function';
            
            return {
                canShowNotification: canShowNotification,
                gameStatusManagerAvailable: !!(this.game && this.game.gameStatusManager)
            };
        } catch (error) {
            return { error: error.message };
        }
    }
}

// Initialisation statique
ChessGameUI.init();

// Exposer la classe globalement
window.ChessGameUI = ChessGameUI;

// Ajouter des fonctions utilitaires globales
window.ChessGameUIUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => ChessGameUI.reloadConfig(),
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: ChessGameUI.consoleLog,
        source: ChessGameUI.getConfigSource(),
        debugMode: ChessGameUI.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Activer/désactiver manuellement (temporaire)
    setConsoleLog: (value) => {
        const oldValue = ChessGameUI.consoleLog;
        ChessGameUI.consoleLog = Boolean(value);
        console.log(`🔧 ChessGameUI: consoleLog changé manuellement: ${oldValue} → ${ChessGameUI.consoleLog}`);
        return ChessGameUI.consoleLog;
    },
    
    // Tester la création d'un ChessGameUI
    testChessGameUI: (game) => {
        console.group('🧪 Test ChessGameUI');
        const chessGameUI = new ChessGameUI(game);
        console.log('ChessGameUI créé:', chessGameUI);
        console.log('Statut UI:', chessGameUI.getUIStatus());
        console.log('Statut config:', ChessGameUI.getConfigStatus());
        console.groupEnd();
        return chessGameUI;
    },
    
    // Tester toutes les fonctionnalités
    testAllFeatures: (chessGameUI) => {
        console.group('🧪 Test complet ChessGameUI');
        if (!chessGameUI || !chessGameUI.testUIFeatures) {
            console.log('❌ ChessGameUI ou méthode testUIFeatures non disponible');
            console.groupEnd();
            return null;
        }
        
        const results = chessGameUI.testUIFeatures();
        console.log('Résultats complets:', results);
        console.groupEnd();
        return results;
    }
};

// Méthode statique pour obtenir le statut de la configuration
ChessGameUI.getConfigStatus = function() {
    return {
        consoleLog: this.consoleLog,
        source: this.getConfigSource(),
        debugMode: this.isDebugMode(),
        appConfigAvailable: !!window.appConfig,
        configValue: window.appConfig?.debug?.console_log
    };
};

// Méthode statique pour forcer la mise à jour de la configuration
ChessGameUI.reloadConfig = function() {
    const oldValue = this.consoleLog;
    this.loadConfig();
    
    if (this.consoleLog && oldValue !== this.consoleLog) {
        console.log(`🔄 ChessGameUI: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
    }
    return this.consoleLog;
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ChessGameUI.loadConfig();
            if (ChessGameUI.consoleLog) {
                console.log('✅ ChessGameUI: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        ChessGameUI.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (ChessGameUI.consoleLog) {
    console.log('✅ ChessGameUI prêt (mode debug activé)');
} else {
    console.info('✅ ChessGameUI prêt (mode silencieux)');
}