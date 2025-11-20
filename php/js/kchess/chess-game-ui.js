// chess-game-ui.js - Gestion de l'interface utilisateur
class ChessGameUI {
    constructor(game) {
        this.game = game;
    }

    setupEventListeners() {
        document.getElementById('newGame')?.addEventListener('click', () => this.game.newGame());
        document.getElementById('flipBoard')?.addEventListener('click', () => this.game.flipBoard());
        document.getElementById('copyFEN')?.addEventListener('click', () => this.copyFENToClipboard());
        document.getElementById('copyPGN')?.addEventListener('click', () => this.copyPGNToClipboard());
        
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
            moveItem.className = 'move-item d-flex justify-content-between align-items-center p-2 border-bottom';
            
            const whiteMove = moves[i];
            const blackMove = moves[i + 1];
            
            let moveText = `<span class="fw-bold">${whiteMove.number}.</span> ${whiteMove.notation}`;
            if (blackMove) moveText += ` ${blackMove.notation}`;
            
            // Ajouter un indicateur d'échec
            if (whiteMove.isCheck || (blackMove && blackMove.isCheck)) {
                moveText += ' <span class="text-danger">+</span>';
            }
            
            moveItem.innerHTML = `
                <span>${moveText}</span>
                <small class="text-muted">${this.game.gameState.getMoveTime(i)}</small>
            `;
            historyElement.appendChild(moveItem);
        }
        
        if (moves.length === 0) {
            historyElement.innerHTML = '<div class="text-center text-muted small p-3">Aucun coup joué</div>';
        }
        
        // Faire défiler vers le bas pour voir le dernier coup
        historyElement.scrollTop = historyElement.scrollHeight;
    }

    // NOUVELLE MÉTHODE : Copier le FEN dans le presse-papier
    async copyFENToClipboard() {
        try {
            const currentFEN = FENGenerator.generateFEN(this.game.gameState, this.game.board);
            
            // Utiliser l'API Clipboard moderne
            await navigator.clipboard.writeText(currentFEN);
            
            // Afficher une confirmation
            this.showCopyFeedback('✅ FEN copié !', 'copyFEN');
            
            console.log('📋 FEN copié:', currentFEN);
            
        } catch (err) {
            // Fallback pour les navigateurs plus anciens
            console.error('Erreur clipboard moderne, fallback:', err);
            this.copyFENFallback();
        }
    }

    // Fallback pour la copie FEN
    copyFENFallback() {
        const currentFEN = FENGenerator.generateFEN(this.game.gameState, this.game.board);
        const textArea = document.createElement('textarea');
        textArea.value = currentFEN;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        this.showCopyFeedback('✅ FEN copié (fallback) !', 'copyFEN');
        console.log('📋 FEN copié (fallback):', currentFEN);
    }

    // Copier le PGN dans le presse-papier
    async copyPGNToClipboard() {
        try {
            const pgn = this.game.gameState.getFullPGN();
            
            // Utiliser l'API Clipboard moderne
            await navigator.clipboard.writeText(pgn);
            
            // Afficher une confirmation
            this.showCopyFeedback('✅ PGN copié !', 'copyPGN');
            
            console.log('📋 PGN copié:', pgn);
            
        } catch (err) {
            // Fallback pour les navigateurs plus anciens
            console.error('Erreur clipboard moderne, fallback:', err);
            this.copyPGNFallback();
        }
    }

    // Fallback pour la copie PGN
    copyPGNFallback() {
        const pgn = this.game.gameState.getFullPGN();
        const textArea = document.createElement('textarea');
        textArea.value = pgn;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        this.showCopyFeedback('✅ PGN copié (fallback) !', 'copyPGN');
        console.log('📋 PGN copié (fallback):', pgn);
    }

    // Afficher un feedback visuel
    showCopyFeedback(message, buttonId) {
        const copyButton = document.getElementById(buttonId);
        if (!copyButton) return;
        
        const originalHTML = copyButton.innerHTML;
        const originalTitle = copyButton.title;
        const originalClass = buttonId === 'copyFEN' ? 'btn-secondary' : 'btn-dark';
        
        // Changer l'apparence du bouton
        copyButton.innerHTML = '✓';
        copyButton.title = message;
        copyButton.classList.remove(originalClass);
        copyButton.classList.add('btn-success');
        
        // Remettre après 1.5 secondes
        setTimeout(() => {
            copyButton.innerHTML = originalHTML;
            copyButton.title = originalTitle;
            copyButton.classList.remove('btn-success');
            copyButton.classList.add(originalClass);
        }, 1500);
    }
    
}

window.ChessGameUI = ChessGameUI;