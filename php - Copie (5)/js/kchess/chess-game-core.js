// chess-game-core.js - Version finale
class ChessGame {
    constructor() {
        this.pieceManager = new PieceManager();
        this.gameState = new GameState();
        this.board = new ChessBoard(this.gameState, this.pieceManager);
        this.moveValidator = new MoveValidator(this.board);
        
        this.selectedPiece = null;
        this.possibleMoves = [];
        
        // Initialiser les modules
        this.moveHandler = new ChessGameMoveHandler(this);
        this.ui = new ChessGameUI(this);
        
        this.init();
    }
    
    init() {
        this.loadInitialPosition();
        this.ui.setupEventListeners();
        this.ui.updateUI();
        console.log('✅ Jeu d\'échecs initialisé');
    }

    // Méthodes déléguées
    handleSquareClick = (displayRow, displayCol) => this.moveHandler.handleSquareClick(displayRow, displayCol);
    highlightPossibleMoves = () => this.moveHandler.highlightPossibleMoves();
    clearSelection = () => this.moveHandler.clearSelection();
    updateUI = () => this.ui.updateUI();

    // Le reste du code reste identique...
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

    flipBoard() {
        console.log('Flip du plateau - ancien état:', this.gameState.boardFlipped);
        const currentPosition = this.board.saveCurrentPosition();
        this.gameState.boardFlipped = !this.gameState.boardFlipped;
        this.board.createBoard();
        
        Object.keys(currentPosition).forEach(key => {
            const [row, col] = key.split('-').map(Number);
            const square = this.board.getSquare(row, col);
            if (square) {
                this.board.placePiece(currentPosition[key], square);
            }
        });
        
        this.clearSelection();
        console.log('Flip du plateau - nouvel état:', this.gameState.boardFlipped);
    }

    newGame() {
        console.log('Nouvelle partie');
        this.gameState.resetGame();
        this.clearSelection();
        this.loadInitialPosition();
        this.updateUI();
    }

    clearMoveHistory() {
        this.gameState.moveHistory = [];
        this.ui.updateMoveHistory();
    }
}

window.ChessGame = ChessGame;