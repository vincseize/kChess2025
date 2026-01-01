/**
 * BotManager - Gère le cycle de vie de l'IA
 * Version 2.4.1 - Correction Sécurité Fin de Partie
 */
class BotManager {
    
    static consoleLog = true;
    static initialized = false;

    static init() {
        this.loadConfig();
        this.initialized = true;
        this.log(`Système prêt`, null, 'success');
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.debug?.console_log ?? true;
            this.consoleLog = (config === true || config === "true");
        } catch (e) { this.consoleLog = true; }
    }

    static log(message, data = null, type = 'log') {
        if (!this.consoleLog && type === 'log') return;
        const icons = { log: '🤖', info: 'ℹ️', warn: '⚠️', error: '❌', success: '✅' };
        const msg = `${icons[type] || '⚪'} [BotManager] ${message}`;
        console[type === 'success' ? 'log' : type === 'warn' ? 'warn' : type === 'error' ? 'error' : 'log'](msg, data || "");
    }

    constructor(chessGame) {
        this.chessGame = chessGame; 
        this.bot = null;
        this.botLevel = 0;
        this.botColor = 'black';
        this.isBotThinking = false;
        this.isActive = false;
        this._moveTimeout = null;
        this._setupGameStateHook();
    }

    _setupGameStateHook() {
        const state = this.chessGame?.gameState || window.chessGame?.gameState;
        if (!state) {
            setTimeout(() => this._setupGameStateHook(), 100);
            return;
        }

        const originalSwitch = state.switchPlayer.bind(state);
        state.switchPlayer = () => {
            originalSwitch();
            if (this.isBotTurn()) this._triggerDelayedMove();
        };
    }

    setBotLevel(level, color = 'black') {
        this.botLevel = parseInt(level);
        this.botColor = color;
        this.isActive = (this.botLevel > 0);

        if (this.isActive) {
            this._instantiateBot(this.botLevel);
        } else {
            this.bot = null;
        }

        if (this.isBotTurn()) this._triggerDelayedMove();
    }

    _instantiateBot(level) {
        const botClassName = `Level_${level}`;
        if (typeof window[botClassName] === 'function') {
            this.bot = new window[botClassName]();
            BotManager.log(`${botClassName} activé (${this.botColor})`, null, 'success');
        } else {
            BotManager.log(`Classe ${botClassName} manquante !`, null, 'error');
            this.isActive = false;
        }
    }

    isBotTurn() {
        const state = this.chessGame?.gameState || window.chessGame?.gameState;
        if (!state || !this.bot || !this.isActive) return false;
        
        // Sécurité : Si le jeu est déjà marqué comme inactif, le bot s'arrête
        if (!state.gameActive) return false;

        return state.currentPlayer === this.botColor && !this.isBotThinking;
    }

    async playBotMove() {
        const core = this.chessGame?.core || this.chessGame || window.chessGame?.core;
        
        if (!this.isBotTurn() || this.isBotThinking) return;

        this.isBotThinking = true;
        
        try {
            // 1. Génération de la FEN
            let currentFEN = "";
            const gen = window.FENGenerator;
            if (gen) {
                currentFEN = gen.generate(core.board, core.gameState);
            }

            // 2. Appel ASYNC du bot
            BotManager.log("L'IA analyse la position...");
            const botMove = await this.bot.getMove(currentFEN);

            // 3. Gestion Fin de partie (Mat ou Pat détecté par le bot)
            if (!botMove || botMove.error) {
                if (botMove?.error === 'game_over') {
                    this.handleBotDetectedEnd(botMove);
                }
                this.isBotThinking = false;
                return;
            }

            // 4. Exécution du coup
            BotManager.log(`Coup décidé : ${this._getNotation(botMove)}`, null, 'success');
            
            core.handleSquareClick(botMove.fromRow, botMove.fromCol, true);
            await new Promise(r => setTimeout(r, 250));
            core.handleSquareClick(botMove.toRow, botMove.toCol, true);

        } catch (error) {
            BotManager.log(`Erreur critique : ${error.message}`, error, 'error');
        } finally {
            this.isBotThinking = false;
        }
    }

    /**
     * Gère proprement l'affichage de fin de partie détectée par l'IA
     */
    handleBotDetectedEnd(botMove) {
        BotManager.log(`Fin de partie détectée : ${botMove.reason}`, null, 'info');
        
        // On désactive le jeu pour éviter d'autres clics
        if (this.chessGame?.gameState) {
            this.chessGame.gameState.gameActive = false;
        }

        const mm = window.ChessModalManager;
        const reason = botMove.reason || 'checkmate';
        
        // Sécurité : On teste plusieurs noms de fonctions possibles pour la modale
        if (mm) {
            if (typeof mm.showGameOver === 'function') {
                mm.showGameOver(botMove.details, reason);
            } else if (typeof mm.show === 'function') {
                mm.show(reason, botMove.details);
            } else {
                BotManager.log("ChessModalManager trouvé mais fonction showGameOver manquante.", null, 'warn');
                alert(`Fin de partie : ${reason}`);
            }
        }
    }

    _triggerDelayedMove() {
        if (this._moveTimeout) clearTimeout(this._moveTimeout);
        this._moveTimeout = setTimeout(() => this.playBotMove(), 400);
    }

    _getNotation(move) {
        if (!move || move.fromCol === undefined) return "???";
        const files = 'abcdefgh';
        return `${files[move.fromCol]}${8 - move.fromRow} ➔ ${files[move.toCol]}${8 - move.toRow}`;
    }
}

BotManager.init();
window.BotManager = BotManager;