// ui/chess-game-ui-core.js - Version finale avec détection du Roi par Scan DOM
class ChessGameUI {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; 

    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('🎨 ui/chess-game-ui-core.js chargé');
        }
    }

    static loadConfig() {
        try {
            if (window.appConfig && window.appConfig.debug) {
                const val = window.appConfig.debug.console_log;
                this.consoleLog = (val === "true" || val === true);
                return true;
            }
            if (typeof window.getConfig === 'function') {
                const val = window.getConfig('debug.console_log', 'true');
                this.consoleLog = (val === "true" || val === true);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ ChessGameUI: Erreur config:', error);
            return false;
        }
    }

    constructor(game) {
        this.constructor.loadConfig();
        this.game = game;
        
        try {
            this.timerManager = new ChessTimerManager(this);
            this.modalManager = new ChessModalManager(this);
            this.moveHistoryManager = new ChessMoveHistoryManager(this);
            this.clipboardManager = new ChessClipboardManager(this);
            this.styleManager = new ChessStyleManager(this);
        } catch (error) {
            console.error('❌ [ChessGameUI] Modules UI manquants:', error);
        }

        if (this.styleManager?.initAllStyles) {
            this.styleManager.initAllStyles();
        }

        setTimeout(() => {
            this.timerManager?.startTimer?.();
        }, 1000);

        document.getElementById('startChess960Game')?.addEventListener('click', () => {
            if (!this.game?.gameState?.chess960 || this.game.gameState.chess960Started) return;
            this.game.gameState.chess960Started = true;
            this.game.gameState.gameActive = true;
            this.updateUI();
            this.timerManager?.startTimer?.();
        });

        const timeControl = document.getElementById('chess960TimeControl');
        timeControl?.addEventListener('change', () => {
            if (!this.game?.gameState?.chess960 || !timeControl.value) return;
            const [minutes, increment] = timeControl.value.split(':').map(Number);
            this.timerManager?.setTimerConfig({
                clock: `${minutes}:00`,
                increment: String(increment)
            });
        });
    }

    setupEventListeners() {
        document.getElementById('flipBoard')?.addEventListener('click', () => this.game?.flipBoard?.());
        document.getElementById('copyFEN')?.addEventListener('click', () => this.clipboardManager?.copyFENToClipboard?.());
        document.getElementById('copyPGN')?.addEventListener('click', () => this.clipboardManager?.copyPGNToClipboard?.());

        // Mobiles
        const mobileEvents = ['flipBoardMobile'];
        mobileEvents.forEach(id => {
            document.getElementById(id)?.addEventListener('click', (e) => {
                e.preventDefault();
                this.game?.flipBoard?.();
            });
        });

        this.setupBoardEventListeners();
    }

setupBoardEventListeners() {
        const board = document.getElementById('chessBoard');
        if (!board) return;

        // 1. DÉSACTIVER LE CLIC DROIT (CONTEXT MENU)
        // Empêche l'ouverture du menu contextuel du navigateur sur l'échiquier
        board.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        const handleAction = (e) => {
            // 2. VERROU ANTI-CLIC (BOT TURN)
            // On vérifie si le bot est en train de jouer avant de traiter le clic
            const isBotTurn = this.game.core?.botManager?.isBotTurn?.();
            
            if (isBotTurn) {
                if (this.constructor.consoleLog) {
                    console.log("⏳ [UI] Clic bloqué : Attente du coup du Bot...");
                }
                return; // On sort immédiatement, le clic est ignoré
            }

            const square = e.target.closest('.chess-square');
            if (square) {
                // Pour le tactile, on empêche le comportement par défaut (zoom/scroll)
                if (e.type === 'touchstart') e.preventDefault();
                
                const r = parseInt(square.dataset.displayRow);
                const c = parseInt(square.dataset.displayCol);
                
                // 3. APPEL DE LA LOGIQUE DE JEU
                this.game.moveHandler?.handleSquareClick?.(r, c);
            }
        };

        // Écouteurs pour Desktop et Mobile
        board.addEventListener('click', handleAction);
        board.addEventListener('touchstart', handleAction, { passive: false });
    }

    /**
     * MISE À JOUR UI PRINCIPALE
     */
    updateUI() {
        this.updateChess960Controls();

        // 1. Nettoyage global
        this.clearCheckEffects();

        // 2. Refresh modules
        this.timerManager?.updateTimerDisplay?.();
        this.moveHistoryManager?.updateMoveHistory?.();
        
        // 3. Statut du jeu (Déclenche l'échec visuel si besoin)
        this.updateGameStatus();
        this.updateBotIndicator();
        
        if (typeof window.updatePlayerLabels === 'function') window.updatePlayerLabels();

        // 4. Tour du Bot
        if (this.game.core?.botManager?.isBotTurn()) {
            setTimeout(() => this.game.core.botManager.playBotMove(), 250);
        }
    }

    updateChess960Controls() {
        const state = this.game?.gameState;
        const position = document.getElementById('chess960Position');
        const startButton = document.getElementById('startChess960Game');
        const actions = document.getElementById('chess960Actions');
        if (!state || !position || !startButton || !actions) return;

        const isChess960 = state.chess960 === true;
        position.hidden = !isChess960;
        actions.hidden = !isChess960;
        if (isChess960) {
            position.textContent = `Chess960 #${state.chess960PositionNumber} / 960`;
        }
        startButton.hidden = state.chess960Started;
    }

    /**
     * ANALYSE DU STATUT ET AFFICHAGE TEXTE
     */
    updateGameStatus() {
        const el = document.getElementById('currentPlayer');
        if (!el) return;

        let fen = "";
        if (typeof this.game.getFEN === 'function') fen = this.game.getFEN();
        else if (window.FENGenerator) fen = window.FENGenerator.generate(this.game.board, this.game.gameState);
        
        if (!fen) return;

        const statusInfo = ChessStatusController.checkGameStatus(fen);
        const isChess960 = this.game.gameState.chess960 === true;
        const t = this.getTranslations();
        let statusText = "";
        let isGameOver = false;

        if (statusInfo.status === 'checkmate') {
            const loser = this.game.gameState.currentPlayer === 'white' ? (t.white || 'Blancs') : (t.black || 'Noirs');
            statusText = `💀 ${t.checkmate || 'ÉCHEC ET MAT'} (${loser})`;
            el.style.color = '#dc3545'; 
            isGameOver = true;
            this.highlightKingInCheck(); 
        } 
        else if (statusInfo.status === 'stalemate') {
            statusText = `🤝 ${t.stalemate || 'Match nul (Pat)'}`;
            el.style.color = '#6c757d'; 
            isGameOver = true;
        }
        else if (statusInfo.status === 'check') {
            const turn = this.game.gameState.currentPlayer === 'white' ? (t.traitAuBlancs || 'Aux blancs') : (t.traitAuxNoirs || 'Aux noirs');
            statusText = isChess960
                ? `⚠️ ${t.check || 'ÉCHEC'}`
                : `${turn} - ⚠️ ${t.check || 'ÉCHEC'}`;
            el.style.color = '#ffc107'; 
            
            if (this.constructor.consoleLog) console.log("📣 [UI] Échec détecté, appel du highlight...");
            this.highlightKingInCheck(); 
        } 
        else {
            statusText = isChess960
                ? ""
                : this.game.gameState.currentPlayer === 'white' ? (t.traitAuBlancs || 'Aux blancs') : (t.traitAuxNoirs || 'Aux noirs');
            el.style.color = '';
        }

        el.hidden = isChess960 && statusInfo.status !== 'check'
            && statusInfo.status !== 'checkmate' && statusInfo.status !== 'stalemate';
        el.textContent = statusText;
        if (isGameOver) this.timerManager?.stopTimer?.();
    }

    /**
     * ALLUMAGE DU ROI (Version Scan DOM)
     */
    highlightKingInCheck() {
        this.clearCheckEffects();
        const color = this.game.gameState.currentPlayer; 
        
        // Scan des pièces dans le DOM
        const pieces = document.querySelectorAll('.chess-piece');
        let target = null;

        pieces.forEach(p => {
            if (p.dataset.pieceType === 'king' && p.dataset.pieceColor === color) {
                target = p.closest('.chess-square');
            }
        });

        // Fallback par image si dataset absent
        if (!target) {
            const code = (color === 'white' ? 'wK' : 'bK');
            document.querySelectorAll('.chess-piece-img').forEach(img => {
                if (img.src.includes(code)) target = img.closest('.chess-square');
            });
        }

        if (target) {
            target.classList.add('square-check');
            if (this.constructor.consoleLog) console.log(`🔥 [UI] Roi ${color} allumé via Scan DOM !`);
        }
    }

    clearCheckEffects() {
        document.querySelectorAll('.square-check').forEach(el => el.classList.remove('square-check'));
    }

    updateBotIndicator() {
        const botStatus = this.game.getBotStatus ? this.game.getBotStatus() : { active: false };
        const el = document.getElementById('currentPlayer');
        const indicator = document.getElementById('botIndicator') || this.createBotIndicator();
        
        if (!el || !botStatus.active) {
            if(indicator) indicator.innerHTML = '';
            el?.classList.remove('bot-active', 'bot-turn');
            return;
        }

        const t = this.getTranslations();
        let botName = t[`bot_level${botStatus.level}`] || `Bot ${botStatus.level}`;
        if (botStatus.level === 3 && t.ccmo_bot3) botName = t.ccmo_bot3;

        indicator.innerHTML = `<span class="bot-indicator">🤖 ${botName}</span>`;
        el.classList.add('bot-active');
        
        const isBotTurn = this.game.core?.botManager?.isBotTurn?.();
        el.classList.toggle('bot-turn', !!isBotTurn);
    }

    createBotIndicator() {
        const container = document.querySelector('.player-info') || document.getElementById('currentPlayer')?.parentElement;
        if (!container) return null;
        const div = document.createElement('div');
        div.id = 'botIndicator';
        container.appendChild(div);
        return div;
    }

    getTranslations() {
        try {
            const cfg = window.appConfig;
            if (cfg?.lang) {
                const lang = cfg.current_lang || localStorage.getItem('charlychess_lang') || cfg.default_lang || 'fr';
                return cfg.lang[lang] || cfg.lang['fr'] || {};
            }
        } catch (e) {}
        return {};
    }

    showNotification(msg, type = 'info') {
        if (this.game.gameStatusManager?.showNotification) {
            this.game.gameStatusManager.showNotification(msg, type);
        } else {
            alert(msg);
        }
    }
}

// Init
ChessGameUI.init();
window.ChessGameUI = ChessGameUI;
