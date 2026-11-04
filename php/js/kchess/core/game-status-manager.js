/**
 * core/game-status-manager.js
 * Gère les états de fin de partie et les alertes d'échec
 */
class GameStatusManager {
    
    static VERSION = '1.2.2';
    static consoleLog = true;
    static logHistory = [];
    static MAX_LOGS = 100;

    static log(message, type = 'info', data = null) {
        if (!this.consoleLog && type === 'info') return;
        const timestamp = new Date().toLocaleTimeString();
        const icon = { info:'🔍', success:'✅', warn:'⚠️', error:'❌', critical:'🚨', death:'💀' }[type] || '⚪';
        console.log(`${icon} [StatusManager ${timestamp}] ${message}`);
        if (data && this.consoleLog) console.dir(data);
    }
    
    static init() {
        this.loadConfig();
        this.log(`Initialisé - v${this.VERSION}`, 'success');
    }
    
    static loadConfig() {
        try {
            const config = window.appConfig?.chess_engine || window.appConfig?.debug;
            if (config?.console_log !== undefined) {
                this.consoleLog = String(config.console_log).toLowerCase() !== "false";
            }
        } catch (e) { this.consoleLog = true; }
    }

    constructor(chessGame) {
        this.chessGame = chessGame;
        this.lastCheckAlert = null;
        this.lastStatus = null;
    }

    /**
     * Applique les conséquences d'état à partir des coups légaux du MoveValidator.
     */
    updateGameStatus() {
        if (!this.chessGame.gameState.gameActive && this.lastStatus
            && ['checkmate', 'stalemate', 'draw'].includes(this.lastStatus.status)) {
            return this.lastStatus;
        }

        this.cleanUIEffects();

        if (!this.chessGame.moveValidator || typeof this.chessGame.moveValidator.getGameStatus !== 'function') {
            throw new Error('MoveValidator est requis pour déterminer le statut de la partie.');
        }

        const currentPlayer = this.chessGame.gameState.currentPlayer;
        const status = this.chessGame.moveValidator.getGameStatus(currentPlayer);
        this.lastStatus = status;

        if (status.status === 'checkmate') {
            this.handleCheckmate(currentPlayer);
        } else if (status.status === 'stalemate') {
            this.handleStalemate(currentPlayer);
        } else if (status.status === 'check') {
            this.handleCheck(currentPlayer);
        } else if (status.status === 'in_progress') {
            const drawReason = this.getDrawReason();
            if (drawReason) {
                status.status = 'draw';
                status.reason = drawReason;
                this.handleDraw(drawReason);
            }
        }

        if (this.chessGame.gameState.gameActive) this.triggerBotIfNeeded();
        return status;
    }

    getDrawReason() {
        if (typeof FENGenerator === 'undefined' || typeof ChessNulleEngine === 'undefined') {
            throw new Error('FENGenerator et ChessNulleEngine sont requis pour vérifier les nulles.');
        }
        const fen = FENGenerator.generate(this.chessGame.board, this.chessGame.gameState);
        const drawEngine = new ChessNulleEngine(fen);
        if (drawEngine.isInsufficientMaterial()) return 'Matériel insuffisant';
        if (this.chessGame.gameState.halfMoveClock >= 100) return "Règle des 50 coups";
        return null;
    }

    // --- GESTION DES RÉSULTATS ---

    handleCheckmate(kingColor) {
        this.highlightKing(kingColor, 'checkmate');
        const winnerColor = kingColor === 'white' ? 'black' : 'white';
        const winner = winnerColor === 'black' ? 'Noirs' : 'Blancs';
        this.showNotification(`Échec et mat ! Victoire des ${winner}`, 'danger');
        this.endGame(winnerColor, 'checkmate');
    }

    handleStalemate(kingColor) {
        this.highlightKing(kingColor, 'stalemate');
        this.showNotification(`Pat ! Match nul.`, 'warning');
        this.endGame('stalemate', 'stalemate');
    }

    handleDraw(reason) {
        this.showNotification(`Match nul : ${reason}`, 'info');
        this.endGame('draw', reason);
    }

    handleCheck(kingColor) {
        this.highlightKing(kingColor, 'king-in-check');
        this.showCheckAlert(kingColor);
    }

    // --- UTILITAIRES ---

    highlightKing(color, className) {
        const pos = this.findKingPosition(color);
        if (pos) {
            const square = this.chessGame.board.getSquare(pos.row, pos.col);
            if (square?.element) square.element.classList.add(className);
        }
    }

    findKingPosition(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.chessGame.board.getPiece(r, c);
                if (p?.type === 'king' && p?.color === color) return { row: r, col: c };
            }
        }
        return null;
    }

    cleanUIEffects() {
        const boardEl = document.querySelector('.chess-board');
        if (boardEl) {
            boardEl.querySelectorAll('.king-in-check, .checkmate, .stalemate')
                   .forEach(el => el.classList.remove('king-in-check', 'checkmate', 'stalemate'));
        }
    }

    showCheckAlert(kingColor) {
        if (this.lastCheckAlert === kingColor) return;
        this.lastCheckAlert = kingColor;
        this.showNotification(`Roi ${kingColor === 'white' ? 'blanc' : 'noir'} en échec !`);
        setTimeout(() => { this.lastCheckAlert = null; }, 3000);
    }

    triggerBotIfNeeded() {
        const bot = this.chessGame.botManager;
        if (bot && bot.isBotTurn && bot.isBotTurn()) {
            setTimeout(() => bot.playBotMove(), 400);
        }
    }

    endGame(result, reason) {
        this.chessGame.gameState.gameActive = false;
        this.chessGame.ui?.timerManager?.stopTimer?.();
        this.chessGame.ui?.modalManager?.showGameOver?.(result, reason);
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('chess-notifications') || document.body;
        const note = document.createElement('div');
        note.className = `chess-notification type-${type}`;
        note.textContent = message;
        container.appendChild(note);
        setTimeout(() => {
            note.style.opacity = '0';
            setTimeout(() => note.remove(), 600);
        }, 4000);
    }
}

GameStatusManager.init();
window.GameStatusManager = GameStatusManager;