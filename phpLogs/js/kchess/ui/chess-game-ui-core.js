// ui/chess-game-ui-core.js - Version Robuste 1.0.8
class ChessGameUI {
    static consoleLog = true;

    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('🎨 ChessGameUI: Système prêt');
    }

    static loadConfig() {
        const config = window.appConfig?.debug?.console_log ?? window.getConfig?.('debug.console_log', true);
        this.consoleLog = (config !== "false" && config !== false);
    }

    constructor(game) {
        this.game = game;
        this.modalManager = null;
        this.moveHistoryManager = null;
        this.timerManager = null;
        this.clipboardManager = null;
        this.styleManager = null;

        this._log('=== INITIALISATION UI ===');

        // Initialisation avec protection contre les erreurs fatales
        this.initComponents();
        
        // Configuration des interactions
        this.setupEventListeners();

        // Injection des styles
        if (this.styleManager?.initAllStyles) {
            this.styleManager.initAllStyles();
        }

        // Démarrage différé des services non-critiques
        setTimeout(() => {
            if (this.timerManager?.startTimer) {
                this._log('⏱️ Démarrage automatique du timer');
                this.timerManager.startTimer();
            }
        }, 1000);
    }

    /**
     * Initialise les composants un par un. 
     * Si l'un crash, les autres continuent.
     */
    initComponents() {
        const modules = [
            { id: 'styleManager', classRef: typeof ChessStyleManager !== 'undefined' ? ChessStyleManager : null },
            { id: 'modalManager', classRef: typeof ChessModalManager !== 'undefined' ? ChessModalManager : null },
            { id: 'timerManager', classRef: typeof ChessTimerManager !== 'undefined' ? ChessTimerManager : null },
            { id: 'moveHistoryManager', classRef: typeof ChessMoveHistoryManager !== 'undefined' ? ChessMoveHistoryManager : null },
            { id: 'clipboardManager', classRef: typeof ChessClipboardManager !== 'undefined' ? ChessClipboardManager : null }
        ];

        modules.forEach(mod => {
            try {
                if (mod.classRef) {
                    this[mod.id] = new mod.classRef(this);
                    this._log(`• ${mod.id} initialisé`);
                } else {
                    console.warn(`⚠️ [ChessGameUI] Classe manquante pour: ${mod.id}`);
                }
            } catch (e) {
                console.error(`❌ [ChessGameUI] Échec d'initialisation de ${mod.id}:`, e);
            }
        });
    }

    _log(msg, data = '') {
        if (ChessGameUI.consoleLog) {
            console.log(`[ChessGameUI] ${msg}`, data);
        }
    }

    setupEventListeners() {
        this._log('Configuration des boutons');
        
        const buttonActions = {
            'newGame': () => this.modalManager?.confirmNewGame?.(),
            'newGameMobile': () => this.modalManager?.confirmNewGame?.(),
            'flipBoard': () => this.game?.flipBoard?.(),
            'flipBoardMobile': () => this.game?.flipBoard?.(),
            'copyFEN': () => this.clipboardManager?.copyFENToClipboard?.(),
            'copyPGN': () => this.clipboardManager?.copyPGNToClipboard?.()
        };

        Object.entries(buttonActions).forEach(([id, action]) => {
            const btn = document.getElementById(id);
            if (btn) {
                // On clone pour éviter les doublons d'écouteurs si init() est rappelé
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                newBtn.addEventListener('click', (e) => {
                    this._log(`Action: ${id}`);
                    if (id.includes('Mobile')) { e.preventDefault(); e.stopPropagation(); }
                    action();
                });
            }
        });

        this.setupBoardEventListeners();
    }

    setupBoardEventListeners() {
        const boardEl = document.getElementById('chessBoard');
        if (!boardEl) return console.warn('⚠️ chessBoard absent');

        // Gestion unifiée Clic / Touch
        const onSquareInteract = (e) => {
            const square = e.target.closest('.chess-square');
            if (square) {
                if (e.type === 'touchstart') e.preventDefault();
                
                // On utilise les datasets pour la logique de jeu
                const row = parseInt(square.dataset.displayRow);
                const col = parseInt(square.dataset.displayCol);
                
                this._log(`Interaction [${row},${col}]`);
                
                // On passe l'ordre au handler de mouvement
                const handler = this.game.moveHandler || this.game.core?.moveHandler;
                handler?.handleSquareClick?.(row, col);
            }
        };

        boardEl.addEventListener('click', onSquareInteract);
        boardEl.addEventListener('touchstart', onSquareInteract, { passive: false });
    }

    updateUI() {
        this._log('🔄 Rafraîchissement UI');
        
        // Mise à jour des sous-modules
        this.timerManager?.updateTimerDisplay?.();
        this.moveHistoryManager?.updateMoveHistory?.();
        
        // Statut et Bots
        this.updateGameStatusDisplay();
        this.updateBotIndicator();

        // Callback externe éventuel
        if (typeof window.updatePlayerLabels === 'function') {
            window.updatePlayerLabels();
        }
    }

    updateGameStatusDisplay() {
        const el = document.getElementById('currentPlayer');
        if (!el) return;

        const gameState = this.game.gameState || this.game.core?.gameState;
        const player = gameState?.currentPlayer || 'white';
        const t = this.getTranslations();
        
        const statusText = player === 'white' ? 
            (t.traitAuBlancs || 'Aux blancs') : 
            (t.traitAuxNoirs || 'Aux noirs');
        
        el.textContent = statusText;
    }

    updateBotIndicator() {
        const el = document.getElementById('currentPlayer');
        if (!el) return;

        // Récupération sécurisée du statut du bot
        const botMgr = this.game.botManager || this.game.core?.botManager;
        const isBotActive = botMgr?.bot !== null;
        
        const indicator = document.getElementById('botIndicator') || this.createBotIndicator();
        const t = this.getTranslations();

        if (isBotActive) {
            const level = botMgr.botLevel || 1;
            const botType = t[`bot_level${level}`] || 'Ordinateur';
            const isBotTurn = botMgr.isBotTurn?.();
            
            indicator.innerHTML = `<span class="bot-tag ${isBotTurn ? 'thinking' : ''}">🤖 ${botType}</span>`;
            el.classList.add('bot-active');
            el.classList.toggle('bot-thinking', isBotTurn);
        } else {
            indicator.innerHTML = '';
            el.classList.remove('bot-active', 'bot-thinking');
        }
    }

    createBotIndicator() {
        const container = document.querySelector('.player-status-area') || 
                          document.getElementById('currentPlayer')?.parentElement;
        if (!container) return null;
        
        const div = document.createElement('div');
        div.id = 'botIndicator';
        container.appendChild(div);
        return div;
    }

    getTranslations() {
        const lang = window.appConfig?.current_lang || 'fr';
        return window.appConfig?.lang?.[lang] || {};
    }

    // Méthode de secours pour les notifications si ModalManager échoue
    showNotification(msg, type = 'info') {
        if (this.modalManager?.showToast) {
            this.modalManager.showToast(msg, type);
        } else {
            console.info(`[Fallback Notif] ${type}: ${msg}`);
        }
    }
}

// Globalisation
window.ChessGameUI = ChessGameUI;