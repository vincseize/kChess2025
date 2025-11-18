// chess-game.js - Classe principale orchestratrice
class ChessGame {
    constructor() {
        this.pieceManager = new PieceManager();
        this.gameState = new GameState();
        this.board = new ChessBoard(this.gameState, this.pieceManager);
        this.moveValidator = new MoveValidator(this.board);
        
        this.selectedPiece = null;
        this.possibleMoves = [];
        
        this.init();
    }
    
    init() {
        this.loadInitialPosition();
        this.setupEventListeners();
        this.updateUI();
        console.log('✅ Jeu d\'échecs initialisé');
    }

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

    handleSquareClick(displayRow, displayCol) {
        if (!this.gameState.gameActive) return;
        
        const { actualRow, actualCol } = this.board.getActualCoordinates(displayRow, displayCol);
        const square = this.board.getSquare(actualRow, actualCol);
        if (!square) return;

        if (this.selectedPiece) {
            this.handlePieceMovement(actualRow, actualCol, square);
        } else {
            this.handlePieceSelection(actualRow, actualCol, square);
        }
    }

    handlePieceSelection(row, col, square) {
        if (square.piece && square.piece.color === this.gameState.currentPlayer) {
            this.clearSelection();
            square.element.classList.add('selected');
            this.selectedPiece = { row, col, piece: square.piece };
            this.possibleMoves = this.moveValidator.getPossibleMoves(square.piece, row, col);
            this.highlightPossibleMoves();
        }
    }

    handlePieceMovement(toRow, toCol, toSquare) {
        const isPossibleMove = this.possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );

        if (isPossibleMove) {
            this.executeMove(toRow, toCol);
            this.updateUI();
        } else {
            this.clearSelection();
            this.handlePieceSelection(toRow, toCol, toSquare);
        }
    }

    executeMove(toRow, toCol) {
        const fromSquare = this.board.getSquare(this.selectedPiece.row, this.selectedPiece.col);
        const toSquare = this.board.getSquare(toRow, toCol);

        // Déplacer la pièce
        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(pieceElement);
        toSquare.piece = this.selectedPiece.piece;
        fromSquare.piece = null;

        // Enregistrer le mouvement
        this.gameState.recordMove(
            this.selectedPiece.row, 
            this.selectedPiece.col, 
            toRow, 
            toCol,
            this.selectedPiece.piece
        );

        this.gameState.switchPlayer();
        this.clearSelection();
    }

    highlightPossibleMoves() {
        this.board.squares.forEach(square => {
            square.element.classList.remove('possible-move', 'possible-capture');
        });
        
        this.possibleMoves.forEach(move => {
            const square = this.board.getSquare(move.row, move.col);
            if (square) {
                square.element.classList.add(move.type === 'capture' ? 'possible-capture' : 'possible-move');
            }
        });
    }

    clearSelection() {
        this.board.squares.forEach(square => {
            square.element.classList.remove('selected', 'possible-move', 'possible-capture');
        });
        this.selectedPiece = null;
        this.possibleMoves = [];
    }

    setupEventListeners() {
        // Boutons de contrôle
        document.getElementById('newGame')?.addEventListener('click', () => this.newGame());
        document.getElementById('flipBoard')?.addEventListener('click', () => this.flipBoard());
        document.getElementById('mobileNewGame')?.addEventListener('click', () => this.newGame());
        document.getElementById('mobileFlipBoard')?.addEventListener('click', () => this.flipBoard());
        document.getElementById('clearHistory')?.addEventListener('click', () => this.clearMoveHistory());
        
        // Clics sur les cases
        document.getElementById('chessBoard')?.addEventListener('click', (e) => {
            const square = e.target.closest('.chess-square');
            if (square) {
                const displayRow = parseInt(square.dataset.displayRow);
                const displayCol = parseInt(square.dataset.displayCol);
                this.handleSquareClick(displayRow, displayCol);
            }
        });
    }

    flipBoard() {
        console.log('Flip du plateau - ancien état:', this.gameState.boardFlipped);
        const currentPosition = this.board.saveCurrentPosition();
        this.gameState.boardFlipped = !this.gameState.boardFlipped;
        this.board.createBoard();
        
        // Replacer les pièces
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
        this.updateMoveHistory();
    }

    updateUI() {
        this.updateGameStatus();
        this.updateMoveHistory();
        this.updateMoveCount();
    }

    updateGameStatus() {
        const statusElement = document.getElementById('gameStatus');
        const playerElement = document.getElementById('currentPlayer');
        
        if (statusElement && playerElement) {
            playerElement.textContent = `Aux ${this.gameState.currentPlayer === 'white' ? 'blancs' : 'noirs'} de jouer`;
            statusElement.textContent = 'En cours';
            statusElement.className = 'h5 text-success';
        }
    }

    updateMoveCount() {
        const moveCountElement = document.getElementById('moveCount');
        if (moveCountElement) {
            moveCountElement.textContent = this.gameState.moveHistory.length;
        }
    }

    updateMoveHistory() {
        const historyElement = document.getElementById('moveHistory');
        if (!historyElement) return;
        
        historyElement.innerHTML = '';
        const moves = this.gameState.moveHistory;
        
        for (let i = 0; i < moves.length; i += 2) {
            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';
            
            const whiteMove = moves[i];
            const blackMove = moves[i + 1];
            
            let moveText = `${whiteMove.number}. ${whiteMove.notation}`;
            if (blackMove) moveText += ` ${blackMove.notation}`;
            
            moveItem.textContent = moveText;
            historyElement.appendChild(moveItem);
        }
        
        if (moves.length === 0) {
            historyElement.innerHTML = '<div class="text-center text-muted small">Aucun coup joué</div>';
        }
    }
}

window.ChessGame = ChessGame;