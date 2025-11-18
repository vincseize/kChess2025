// chess-game-ui.js - Gestion de l'interface utilisateur
class ChessGameUI {
    constructor(game) {
        this.game = game;
    }

    setupEventListeners() {
        document.getElementById('newGame')?.addEventListener('click', () => this.game.newGame());
        document.getElementById('flipBoard')?.addEventListener('click', () => this.game.flipBoard());
        document.getElementById('clearHistory')?.addEventListener('click', () => this.game.clearMoveHistory());
        
        document.getElementById('chessBoard')?.addEventListener('click', (e) => {
            const square = e.target.closest('.chess-square');
            if (square) {
                const displayRow = parseInt(square.dataset.displayRow);
                const displayCol = parseInt(square.dataset.displayCol);
                this.game.moveHandler.handleSquareClick(displayRow, displayCol);
            }
        });
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
            playerElement.textContent = `Aux ${this.game.gameState.currentPlayer === 'white' ? 'blancs' : 'noirs'} de jouer`;
            statusElement.textContent = 'En cours';
            statusElement.className = 'h5 text-success';
        }
    }

    updateMoveCount() {
        const moveCountElement = document.getElementById('moveCount');
        if (moveCountElement) {
            moveCountElement.textContent = this.game.gameState.moveHistory.length;
        }
    }

    updateMoveHistory() {
        const historyElement = document.getElementById('moveHistory');
        if (!historyElement) return;
        
        historyElement.innerHTML = '';
        const moves = this.game.gameState.moveHistory;
        
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