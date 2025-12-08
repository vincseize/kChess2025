// ui/chess-game-ui-core.js - Version corrigée
class ChessGameUI {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('ui/chess-game-ui-core.js loaded');
        }
    }

    constructor(game) {
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
        
        // Initialiser les styles
        if (this.constructor.consoleLog) {
            console.log('🎨 [ChessGameUI] Initialisation des styles...');
        }
        
        this.styleManager.initAllStyles();
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGameUI] Styles initialisés');
        }
        
        // Démarrer le timer après un court délai
        setTimeout(() => {
            if (this.constructor.consoleLog) {
                console.log('⏱️ [ChessGameUI] Démarrage du timer...');
            }
            
            this.timerManager.startTimer();
            
            if (this.constructor.consoleLog) {
                console.log('✅ [ChessGameUI] Timer démarré');
                console.log('🎨 [ChessGameUI] === INITIALISATION TERMINÉE ===\n');
            }
        }, 1000);
    }

    setupEventListeners() {
        if (this.constructor.consoleLog) {
            console.log('\n🎮 [ChessGameUI] === CONFIGURATION DES ÉVÉNEMENTS ===');
            console.log('🎮 [ChessGameUI] Configuration des écouteurs d\'événements...');
        }
        
        // Boutons desktop
        if (this.constructor.consoleLog) {
            console.log('🖥️ [ChessGameUI] Configuration boutons desktop...');
        }
        
        document.getElementById('newGame')?.addEventListener('click', () => {
            if (this.constructor.consoleLog) {
                console.log('🎮 [ChessGameUI] Bouton nouvelle partie desktop cliqué');
            }
            this.modalManager.confirmNewGame();
        });
        
        document.getElementById('flipBoard')?.addEventListener('click', () => {
            if (this.constructor.consoleLog) {
                console.log('🔄 [ChessGameUI] Bouton flip board desktop cliqué');
            }
            this.game.flipBoard();
        });
        
        document.getElementById('copyFEN')?.addEventListener('click', () => {
            if (this.constructor.consoleLog) {
                console.log('📋 [ChessGameUI] Bouton copier FEN cliqué');
            }
            this.clipboardManager.copyFENToClipboard();
        });
        
        document.getElementById('copyPGN')?.addEventListener('click', () => {
            if (this.constructor.consoleLog) {
                console.log('📋 [ChessGameUI] Bouton copier PGN cliqué');
            }
            this.clipboardManager.copyPGNToClipboard();
        });
        
        // Boutons mobiles
        if (this.constructor.consoleLog) {
            console.log('📱 [ChessGameUI] Configuration boutons mobiles...');
        }
        
        document.getElementById('newGameMobile')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.constructor.consoleLog) {
                console.log('🎮 [ChessGameUI] Bouton nouvelle partie mobile touché');
            }
            
            this.modalManager.confirmNewGame();
        });
        
        document.getElementById('flipBoardMobile')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.constructor.consoleLog) {
                console.log('🔄 [ChessGameUI] Bouton flip board mobile touché');
            }
            
            this.game.flipBoard();
        });
        
        // Événements du plateau
        if (this.constructor.consoleLog) {
            console.log('🎯 [ChessGameUI] Configuration événements plateau...');
        }
        
        this.setupBoardEventListeners();
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGameUI] === ÉVÉNEMENTS CONFIGURÉS ===\n');
        }
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
                
                this.game.moveHandler.handleSquareClick(displayRow, displayCol);
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
                
                this.game.moveHandler.handleSquareClick(displayRow, displayCol);
            }
        }, { passive: false });
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGameUI] Écouteurs plateau configurés');
        }
    }

    // Mettre à jour l'UI complète
    updateUI() {
        if (this.constructor.consoleLog) {
            console.log('\n🔄 [ChessGameUI] === MISE À JOUR COMPLÈTE UI ===');
        }
        
        // Mise à jour du timer
        if (this.constructor.consoleLog) {
            console.log('⏱️ [ChessGameUI] Mise à jour du timer...');
        }
        this.timerManager.updateTimerDisplay();
        
        // Mise à jour de l'historique
        if (this.constructor.consoleLog) {
            console.log('📜 [ChessGameUI] Mise à jour de l\'historique...');
        }
        this.moveHistoryManager.updateMoveHistory();
        
        // Mise à jour du statut
        if (this.constructor.consoleLog) {
            console.log('📊 [ChessGameUI] Mise à jour du statut...');
        }
        this.updateGameStatus();
        
        // Mise à jour de l'indicateur bot
        if (this.constructor.consoleLog) {
            console.log('🤖 [ChessGameUI] Mise à jour indicateur bot...');
        }
        this.updateBotIndicator();
        
        // Mise à jour des labels des joueurs
        if (this.constructor.consoleLog) {
            console.log('🏷️ [ChessGameUI] Mise à jour des labels...');
        }
        this.updatePlayerLabelsWithBot();
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGameUI] === MISE À JOUR TERMINÉE ===\n');
        }
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
            const text = player === 'white' ? 'Aux blancs de jouer' : 'Aux noirs de jouer';
            
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

    // Nouvelle méthode : afficher l'indicateur de bot
    updateBotIndicator() {
        if (this.constructor.consoleLog) {
            console.log('🤖 [ChessGameUI] Mise à jour indicateur bot...');
        }
        
        const botStatus = this.game.getBotStatus ? this.game.getBotStatus() : { active: false };
        const currentPlayerElement = document.getElementById('currentPlayer');
        const botIndicatorElement = document.getElementById('botIndicator') || this.createBotIndicator();
        
        if (!currentPlayerElement) {
            if (this.constructor.consoleLog) {
                console.warn('⚠️ [ChessGameUI] Élément currentPlayer non trouvé');
            }
            return;
        }
        
        if (botStatus.active) {
            if (this.constructor.consoleLog) {
                console.log(`🤖 [ChessGameUI] Bot actif: niveau ${botStatus.level}, couleur ${botStatus.color}`);
            }
            
            // Déterminer le type de bot
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
            
            if (this.constructor.consoleLog) {
                console.log(`🤖 [ChessGameUI] Type bot: ${botType}`);
            }
            
            // Mettre à jour l'indicateur
            botIndicatorElement.innerHTML = `
                <span class="bot-indicator" title="${botType} - Joue les ${botStatus.color === 'white' ? 'Blancs' : 'Noirs'}">
                    ${botIcon} ${botType}
                </span>
            `;
            
            // Ajouter la classe bot-active à l'élément currentPlayer
            currentPlayerElement.classList.add('bot-active');
            
            // Si c'est le tour du bot, ajouter une classe supplémentaire
            const isBotTurn = this.game.core && this.game.core.botManager && 
                            this.game.core.botManager.isBotTurn && 
                            this.game.core.botManager.isBotTurn();
            
            if (isBotTurn) {
                currentPlayerElement.classList.add('bot-turn');
                currentPlayerElement.title = `${botType} réfléchit...`;
                
                if (this.constructor.consoleLog) {
                    console.log('🤖 [ChessGameUI] C\'est le tour du bot');
                }
            } else {
                currentPlayerElement.classList.remove('bot-turn');
                currentPlayerElement.title = '';
            }
            
        } else {
            if (this.constructor.consoleLog) {
                console.log('🤖 [ChessGameUI] Bot inactif');
            }
            
            // Cacher l'indicateur si le bot est désactivé
            botIndicatorElement.innerHTML = '';
            currentPlayerElement.classList.remove('bot-active', 'bot-turn');
            currentPlayerElement.title = '';
        }
    }
    
    // Créer l'élément indicateur de bot s'il n'existe pas
    createBotIndicator() {
        if (this.constructor.consoleLog) {
            console.log('🏗️ [ChessGameUI] Création élément indicateur bot...');
        }
        
        const container = document.querySelector('.player-info') || document.getElementById('currentPlayer')?.parentElement;
        if (!container) {
            if (this.constructor.consoleLog) {
                console.warn('⚠️ [ChessGameUI] Conteneur pour indicateur bot non trouvé');
            }
            return document.createElement('div');
        }
        
        const botIndicator = document.createElement('div');
        botIndicator.id = 'botIndicator';
        botIndicator.className = 'bot-indicator-container';
        container.appendChild(botIndicator);
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ChessGameUI] Indicateur bot créé');
        }
        
        return botIndicator;
    }
    
    // Méthode pour mettre à jour les labels des joueurs avec info bot
    updatePlayerLabelsWithBot() {
        if (this.constructor.consoleLog) {
            console.log('🏷️ [ChessGameUI] Mise à jour labels avec info bot...');
        }
        
        // L'actualisation des labels se fait par la fonction globale updatePlayerLabels
        if (typeof window.updatePlayerLabels === 'function') {
            window.updatePlayerLabels();
            
            if (this.constructor.consoleLog) {
                console.log('✅ [ChessGameUI] Fonction updatePlayerLabels appelée');
            }
        } else {
            if (this.constructor.consoleLog) {
                console.warn('⚠️ [ChessGameUI] Fonction updatePlayerLabels non disponible');
            }
        }
    }

    // Méthode utilitaire pour les notifications
    showNotification(message, type = 'info') {
        if (this.constructor.consoleLog) {
            console.log(`📢 [ChessGameUI] Notification ${type}: ${message}`);
        }
        
        if (this.game.gameStatusManager && this.game.gameStatusManager.showNotification) {
            if (this.constructor.consoleLog) {
                console.log('📢 [ChessGameUI] Délégation à gameStatusManager');
            }
            
            this.game.gameStatusManager.showNotification(message, type);
        } else {
            // Notification simple
            if (this.constructor.consoleLog) {
                console.log('📢 [ChessGameUI] Création notification simple');
            }
            
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
            
            // Supprimer après 3 secondes
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    
                    if (this.constructor.consoleLog) {
                        console.log('📢 [ChessGameUI] Notification supprimée');
                    }
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
}

// Initialisation statique
ChessGameUI.init();

window.ChessGameUI = ChessGameUI;