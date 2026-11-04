/**
 * core/chess-game-core.js
 * Chef d'orchestre du moteur de jeu.
 */
class ChessGameCore {
    static consoleLog = true; 

    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('🎮 core/chess-game-core.js chargé');
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.debug) {
                const configValue = window.appConfig.debug.console_log;
                this.consoleLog = (configValue === "false" || configValue === false) ? false : true;
            }
        } catch (error) { this.consoleLog = true; }
    }

    constructor(board, gameState, moveValidator) {
        this.board = board;
        this.gameState = gameState;
        this.moveValidator = moveValidator;
        
        this.selectedPiece = null;
        this.possibleMoves = [];
        
        this.ui = typeof ChessGameUI !== 'undefined' ? new ChessGameUI(this) : null;
        this.promotionManager = typeof PromotionManager !== 'undefined' ? new PromotionManager(this) : null;
        this.gameStatusManager = typeof GameStatusManager !== 'undefined' ? new GameStatusManager(this) : null;
        this.moveExecutor = typeof MoveExecutor !== 'undefined' ? new MoveExecutor(this) : null;
        this.moveHandler = typeof ChessGameMoveHandler !== 'undefined' ? new ChessGameMoveHandler(this) : null;
        this.botManager = typeof BotManager !== 'undefined' ? new BotManager(this) : null;

        if (this.constructor.consoleLog) console.log('✅ ChessGameCore: Architecture assemblée.');
    }
    
    handleSquareClick(row, col, isDirect = false) {
        if (!this.gameState?.gameActive) return;

        const isBotTurn = this.botManager?.isActive && 
                         (this.gameState.currentPlayer === this.botManager.botColor);
        
        if (isBotTurn && !isDirect) {
            console.warn("🚫 Action bloquée : C'est au tour de l'IA.");
            return; 
        }

        if (this.moveHandler) {
            this.moveHandler.handleSquareClick(row, col, isDirect);
        }
    }
    
    clearSelection() {
        this.selectedPiece = null;
        this.possibleMoves = [];
        
        if (this.moveHandler?.stateManager) {
            this.moveHandler.stateManager.clearSelection();
        } else if (this.ui?.clearHighlights) {
            this.ui.clearHighlights();
        }
    }

    updateUI() {
        if (this.ui?.updateUI) this.ui.updateUI();

        if (this.constructor.consoleLog) {
            console.log(`🧩 [FEN] ${this.getFEN()}`);
        }
    }

    checkBotTurn() {
        if (this.botManager?.isBotTurn()) {
            this.playBotMove();
        }
    }

    setBotLevel(level, color = 'black') {
        if (!this.botManager) return false;
        this.botManager.setBotLevel(level, color);
        return true;
    }

    playBotMove() {
        if (this.botManager && typeof this.botManager.playBotMove === 'function') {
            this.botManager.playBotMove();
        }
    }

    newGame() {
        this.clearSelection();
        document.querySelectorAll('.last-move-source, .last-move-dest').forEach(el => {
            el.classList.remove('last-move-source', 'last-move-dest');
        });

        if (this.botManager) this.botManager.isBotThinking = false;
        this.updateUI();
    }

    flipBoard() {
        if (!this.gameState || !this.board) return;
        this.gameState.boardFlipped = !this.gameState.boardFlipped;
        
        this.board.createBoard();

        this.clearSelection();
        this.updateUI();
    }

    getFEN() {
        return (typeof FENGenerator !== 'undefined') ? FENGenerator.generate(this.board, this.gameState) : "FENGenerator introuvable";
    }
}

ChessGameCore.init();
window.ChessGameCore = ChessGameCore;