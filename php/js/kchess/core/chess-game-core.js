/**
 * core/chess-game-core.js
 * Chef d'orchestre du moteur de jeu.
 * Gère la coordination entre le plateau, les règles et l'intelligence artificielle.
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
        
        // Initialisation des sous-modules
        this.ui = typeof ChessGameUI !== 'undefined' ? new ChessGameUI(this) : null;
        this.promotionManager = typeof PromotionManager !== 'undefined' ? new PromotionManager(this) : null;
        this.gameStatusManager = typeof GameStatusManager !== 'undefined' ? new GameStatusManager(this) : null;
        this.moveExecutor = typeof MoveExecutor !== 'undefined' ? new MoveExecutor(this) : null;
        this.moveHandler = typeof ChessGameMoveHandler !== 'undefined' ? new ChessGameMoveHandler(this) : null;

        // Initialisation du BotManager
        this.botManager = typeof BotManager !== 'undefined' ? new BotManager(this) : null;

        if (this.constructor.consoleLog) console.log('✅ ChessGameCore: Architecture assemblée.');
    }
    
    // ========== GESTION DES INTERACTIONS ==========

    /**
     * @param {number} row 
     * @param {number} col 
     * @param {boolean} isDirect - true si coordonnée logique (Bot), false si coordonnée visuelle (Humain)
     */
    handleSquareClick(row, col, isDirect = false) {
        if (!this.gameState?.gameActive) return;

        // VERROU : Si c'est au tour du bot, on bloque les clics humains (isDirect = false)
        const isBotTurn = this.botManager?.isActive && 
                         (this.gameState.currentPlayer === this.botManager.botColor);
        
        if (isBotTurn && !isDirect) {
            console.warn("🚫 Action bloquée : C'est au tour de l'IA.");
            return; 
        }

        // Si ce n'est pas le bot, on laisse le MoveHandler gérer
        if (this.moveHandler) {
            this.moveHandler.handleSquareClick(row, col, isDirect);
        }
    }
    
    clearSelection() {
        this.selectedPiece = null;
        this.possibleMoves = [];
        if (this.ui?.clearHighlights) this.ui.clearHighlights();
    }

    updateUI() {
        if (this.ui?.updateUI) this.ui.updateUI();
        if (this.gameStatusManager?.updateGameStatus) {
            setTimeout(() => this.gameStatusManager.updateGameStatus(), 50);
        }
    }

    // ========== LOGIQUE DE MOUVEMENT ==========

    executeMove(fromRow, fromCol, toRow, toCol, promotionPiece = null) {
        if (!this.moveExecutor) return false;

        const piece = this.board.getPiece(fromRow, fromCol);
        if (!piece) return false;

        const success = this.moveExecutor.executeNormalMove(
            this.board.getSquare(fromRow, fromCol),
            this.board.getSquare(toRow, toCol),
            piece,
            { row: toRow, col: toCol }, 
            toRow, 
            toCol
        );

        if (success) {
            this.gameState.recordMove(fromRow, fromCol, toRow, toCol, piece, promotionPiece);
            this.gameState.switchPlayer();
            this.updateUI(); 
            return true;
        }
        return false;
    }

    checkBotTurn() {
        if (this.botManager?.isBotTurn()) {
            this.playBotMove();
        }
    }

    // ========== GESTION DU BOT ==========

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

    // ========== ÉTAT DE LA PARTIE ==========

    newGame() {
        this.clearSelection();
        if (this.botManager) this.botManager.isBotThinking = false;
        this.updateUI();
    }

    flipBoard() {
        if (!this.gameState || !this.board) return;
        this.gameState.boardFlipped = !this.gameState.boardFlipped;
        
        const pieces = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board.getPiece(r, c);
                if (p) pieces.push({ r, c, piece: p });
            }
        }

        this.board.createBoard();
        pieces.forEach(item => {
            const sq = this.board.getSquare(item.r, item.c);
            if (sq) this.board.placePiece(item.piece, sq);
        });

        this.clearSelection();
        this.updateUI();
    }

    getFEN() {
        return (typeof FENGenerator !== 'undefined') ? FENGenerator.generate(this.board, this.gameState) : "";
    }
}

ChessGameCore.init();
window.ChessGameCore = ChessGameCore;