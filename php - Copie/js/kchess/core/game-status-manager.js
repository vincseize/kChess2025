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
    }

    /**
     * Analyse complète de l'état du jeu
     */
    updateGameStatus() {
        if (!this.chessGame.gameState.gameActive) return;

        this.cleanUIEffects();

        // 1. Dépendances et FEN
        if (typeof FENGenerator === 'undefined' || typeof ChessMateEngine === 'undefined') {
            GameStatusManager.log('Dépendances manquantes', 'critical');
            return;
        }

        const currentFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
        
        // Sécurité plateau vide
        if (!currentFEN || currentFEN.split(' ')[0] === '8/8/8/8/8/8/8/8') {
            GameStatusManager.log('FEN invalide détectée', 'error');
            return;
        }

        const engine = new ChessMateEngine(currentFEN);
        const currentPlayer = this.chessGame.gameState.currentPlayer;
        const side = currentPlayer === 'white' ? 'w' : 'b';

        // 2. Vérification Echec et Mat (Priorité 1)
        if (engine.isCheckmate(side)) {
            this.handleCheckmate(currentPlayer);
            return;
        }

        // 3. Vérification Pat (Priorité 2)
        if (engine.isStalemate(side)) {
            this.handleStalemate(currentPlayer);
            return;
        }

        // 4. Vérification Nulle Technique (Priorité 3)
        const drawReason = this.getDrawReason(engine);
        if (drawReason) {
            this.handleDraw(drawReason);
            return;
        }

        // 5. Échec Simple (Priorité 4)
        if (engine.isKingInCheck('w')) this.handleCheck('white');
        if (engine.isKingInCheck('b')) this.handleCheck('black');

        // 6. Relance du Bot
        this.triggerBotIfNeeded();
    }

    getDrawReason(engine) {
        // Matériel insuffisant (Roi vs Roi, etc.)
        if (engine.isInsufficientMaterial && engine.isInsufficientMaterial()) return "Matériel insuffisant";
        // Règle des 50 coups (via le State)
        if (this.chessGame.gameState.halfMoveClock >= 100) return "Règle des 50 coups";
        return null;
    }

    // --- GESTION DES RÉSULTATS ---

    handleCheckmate(kingColor) {
        this.highlightKing(kingColor, 'checkmate');
        const winner = kingColor === 'white' ? 'Noirs' : 'Blancs';
        this.showNotification(`Échec et mat ! Victoire des ${winner}`, 'danger');
        this.endGame(winner, 'checkmate');
    }

    handleStalemate(kingColor) {
        this.highlightKing(kingColor, 'stalemate');
        this.showNotification(`Pat ! Match nul.`, 'warning');
        this.endGame('Nulle', 'stalemate');
    }

    handleDraw(reason) {
        this.showNotification(`Match nul : ${reason}`, 'info');
        this.endGame('Nulle', reason);
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
        if (this.chessGame.ui?.showGameOver) {
            this.chessGame.ui.showGameOver(result, reason);
        }
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