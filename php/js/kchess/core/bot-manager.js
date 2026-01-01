/**
 * BotManager - Gère le cycle de vie de l'IA
 * Version 2.3.6 - Correction Flip/Vue Coordonnées
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
        return state.gameActive && state.currentPlayer === this.botColor && !this.isBotThinking;
    }

    async playBotMove() {
        // Accès robuste au core
        const core = this.chessGame?.core || this.chessGame || window.chessGame?.core;
        
        if (!this.isBotTurn() || this.isBotThinking) return;

        this.isBotThinking = true;
        BotManager.log("L'IA réfléchit...");
        
        try {
            await new Promise(r => setTimeout(r, 600));

            let currentFEN = "";
            const gen = window.FENGenerator;
            if (gen) currentFEN = gen.generate(core.board, core.gameState);

            const botMove = this.bot.getMove(currentFEN);

            if (botMove) {
                BotManager.log(`Coup décidé : ${this._getNotation(botMove)}`, null, 'success');
                
                // IMPORTANT : On passe true pour 'isDirect' pour ignorer le Flip
                core.handleSquareClick(botMove.fromRow, botMove.fromCol, true);
                
                await new Promise(r => setTimeout(r, 300));
                
                core.handleSquareClick(botMove.toRow, botMove.toCol, true);
            }
        } catch (error) {
            BotManager.log(`Erreur : ${error.message}`, error, 'error');
        } finally {
            this.isBotThinking = false;
        }
    }

    _triggerDelayedMove() {
        if (this._moveTimeout) clearTimeout(this._moveTimeout);
        this._moveTimeout = setTimeout(() => this.playBotMove(), 500);
    }

    _getNotation(move) {
        const files = 'abcdefgh';
        return `${files[move.fromCol]}${8 - move.fromRow} ➔ ${files[move.toCol]}${8 - move.toRow}`;
    }
}

BotManager.init();
window.BotManager = BotManager;