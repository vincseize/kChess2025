// chess-game.js - Version corrigée
class ChessGame {
    constructor() {
        this.pieceManager = new PieceManager();
        this.gameState = new GameState();
        this.board = new ChessBoard(this.gameState, this.pieceManager);
        this.moveValidator = new MoveValidator(this.board, this.gameState);
        
        // Utiliser ChessGameCore
        this.core = new ChessGameCore(this.board, this.gameState, this.moveValidator);
        
        console.log('♟️ ChessGame initialisé');
        
        this.init();
    }
    
    init() {
        this.loadInitialPosition();
        this.applyUrlParamsConfiguration();
        
        // Setup UI si disponible
        if (this.core.ui && typeof this.core.ui.setupEventListeners === 'function') {
            this.core.ui.setupEventListeners();
        }
        
        if (this.core.ui && typeof this.core.ui.updateUI === 'function') {
            this.core.ui.updateUI();
        }
    }

    // Méthodes déléguées
    handleSquareClick = (displayRow, displayCol) => this.core.handleSquareClick(displayRow, displayCol);
    highlightPossibleMoves = () => this.core.highlightPossibleMoves();
    clearSelection = () => this.core.clearSelection();
    updateUI = () => this.core.updateUI();

    loadInitialPosition() {
        this.board.createBoard();
        const initialPosition = this.pieceManager.getInitialPosition();
        Object.keys(initialPosition).forEach(key => {
            const [row, col] = key.split('-').map(Number);
            const square = this.board.getSquare(row, col);
            if (square) {
                this.board.placePiece(initialPosition[key], square);
            }
        });
    }

    // CONFIGURATION URL SIMPLIFIÉE
    applyUrlParamsConfiguration() {
        const urlParams = this.getUrlParams();
        console.log('🎯 Configuration URL:', urlParams);
        
        // Mettre à jour gameState
        this.gameState.updateFromUrlParams(urlParams);
        
        // Bot
        const shouldActivateBot =
            urlParams.bot === '1' ||
            urlParams.bot === 'true' ||
            urlParams.mode === 'bot' ||
            urlParams.level === '0';
        
        if (shouldActivateBot) {
            console.log('🤖 Bot activé via URL');
            const botColor = urlParams.color === 'white' ? 'black' : 'white';
            this.core.setBotLevel(1, botColor);
        }
    }

    getUrlParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        
        for (let [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        return params;
    }

    // FLIP SIMPLIFIÉ - délègue tout au core
    flipBoard() {
        console.log('🔄 ChessGame.flipBoard() appelé');
        this.core.flipBoard();
    }

    newGame() {
        console.log('🔄 Nouvelle partie');
        this.core.newGame();
        
        // Réappliquer la configuration URL
        this.applyUrlParamsConfiguration();
    }

    clearMoveHistory() {
        this.gameState.moveHistory = [];
        if (this.core.ui && typeof this.core.ui.updateMoveHistory === 'function') {
            this.core.ui.updateMoveHistory();
        }
    }

    // Délégation bot
    setBotLevel(level, color = 'black') {
        return this.core.setBotLevel(level, color);
    }

    getBotStatus() {
        return this.core.getBotStatus();
    }

    setBotColor(color) {
        this.core.setBotColor(color);
    }

    playBotMove() {
        return this.core.playBotMove();
    }
    
    handleMove(fromRow, fromCol, toRow, toCol) {
        return this.core.handleMove(fromRow, fromCol, toRow, toCol);
    }
}

window.ChessGame = ChessGame;