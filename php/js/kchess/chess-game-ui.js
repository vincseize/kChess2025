// chess-game-ui.js - Gestion de l'interface utilisateur
class ChessGameUI {
    constructor(game) {
        this.game = game;
        this.whiteTime = 0; // Temps en secondes pour les blancs
        this.blackTime = 0; // Temps en secondes pour les noirs
        this.gameStartTime = null;
        this.timerInterval = null;
        this.currentPlayerTimer = null;
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
        this.updatePlayerTimes();
    }

    updateGameStatus() {
        const playerElement = document.getElementById('currentPlayer');
        
        if (playerElement) {
            const currentPlayer = this.game.gameState.currentPlayer;
            const playerText = currentPlayer === 'white' ? 'Aux blancs de jouer' : 'Aux noirs de jouer';
            const playerClass = currentPlayer === 'white' ? 'text-white bg-dark rounded px-2' : 'text-dark bg-warning rounded px-2';
            
            playerElement.textContent = playerText;
            playerElement.className = `small mb-2 ${playerClass}`;
            
            // Démarrer/arrêter les timers
            this.handlePlayerTimer(currentPlayer);
        }
    }

    // NOUVELLE MÉTHODE : Gérer les timers des joueurs
    handlePlayerTimer(currentPlayer) {
        if (this.currentPlayerTimer !== currentPlayer) {
            // Arrêter le timer précédent
            this.stopPlayerTimer();
            
            // Démarrer le nouveau timer
            this.currentPlayerTimer = currentPlayer;
            this.startPlayerTimer();
        }
    }

    // NOUVELLE MÉTHODE : Démarrer le timer du joueur actuel
    startPlayerTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (this.currentPlayerTimer === 'white') {
                this.whiteTime++;
            } else {
                this.blackTime++;
            }
            this.updatePlayerTimes();
        }, 1000);
    }

    // NOUVELLE MÉTHODE : Arrêter le timer
    stopPlayerTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // NOUVELLE MÉTHODE : Mettre à jour l'affichage des temps
    updatePlayerTimes() {
        const whiteTimeElement = document.getElementById('whiteTime');
        const blackTimeElement = document.getElementById('blackTime');
        
        if (whiteTimeElement) {
            whiteTimeElement.textContent = this.formatTime(this.whiteTime);
            // Mettre en évidence le joueur actif
            if (this.currentPlayerTimer === 'white') {
                whiteTimeElement.className = 'text-success fw-bold';
                blackTimeElement.className = 'text-primary';
            }
        }
        
        if (blackTimeElement) {
            blackTimeElement.textContent = this.formatTime(this.blackTime);
            // Mettre en évidence le joueur actif
            if (this.currentPlayerTimer === 'black') {
                blackTimeElement.className = 'text-success fw-bold';
                whiteTimeElement.className = 'text-primary';
            }
        }
    }

    // NOUVELLE MÉTHODE : Formater le temps (secondes -> MM:SS)
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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

    // NOUVELLE MÉTHODE : Réinitialiser les timers pour une nouvelle partie
    resetTimers() {
        this.stopPlayerTimer();
        this.whiteTime = 0;
        this.blackTime = 0;
        this.currentPlayerTimer = 'white';
        this.updatePlayerTimes();
        this.startPlayerTimer();
    }

    // Copier le FEN dans le presse-papier
    async copyFENToClipboard() {
        try {
            const currentFEN = FENGenerator.generateFEN(this.game.gameState, this.game.board);
            await navigator.clipboard.writeText(currentFEN);
            this.showCopyFeedback('✅ FEN copié !', 'copyFEN');
            console.log('📋 FEN copié:', currentFEN);
        } catch (err) {
            this.copyFENFallback();
        }
    }

    copyFENFallback() {
        const currentFEN = FENGenerator.generateFEN(this.game.gameState, this.game.board);
        const textArea = document.createElement('textarea');
        textArea.value = currentFEN;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showCopyFeedback('✅ FEN copié (fallback) !', 'copyFEN');
    }

    // Copier le PGN dans le presse-papier
    async copyPGNToClipboard() {
        try {
            const pgn = this.game.gameState.getFullPGN();
            await navigator.clipboard.writeText(pgn);
            this.showCopyFeedback('✅ PGN copié !', 'copyPGN');
            console.log('📋 PGN copié:', pgn);
        } catch (err) {
            this.copyPGNFallback();
        }
    }

    copyPGNFallback() {
        const pgn = this.game.gameState.getFullPGN();
        const textArea = document.createElement('textarea');
        textArea.value = pgn;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showCopyFeedback('✅ PGN copié (fallback) !', 'copyPGN');
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