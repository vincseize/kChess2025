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
        // Boutons desktop
        document.getElementById('newGame')?.addEventListener('click', () => {
            console.log('🔄 Nouvelle partie (desktop)');
            this.game.newGame();
        });
        
        document.getElementById('flipBoard')?.addEventListener('click', () => {
            console.log('🔄 Flip board (desktop)');
            this.game.flipBoard();
        });
        
        document.getElementById('copyFEN')?.addEventListener('click', () => this.copyFENToClipboard());
        document.getElementById('copyPGN')?.addEventListener('click', () => this.copyPGNToClipboard());
        
        // Événements du plateau
        document.getElementById('chessBoard')?.addEventListener('click', (e) => {
            const square = e.target.closest('.chess-square');
            if (square) {
                const displayRow = parseInt(square.dataset.displayRow);
                const displayCol = parseInt(square.dataset.displayCol);
                this.game.moveHandler.handleSquareClick(displayRow, displayCol);
            }
        });

        console.log('✅ Événements UI configurés');
    }

    updateUI() {
        this.updateGameStatus();
        this.updateMoveHistory();
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
                if (blackTimeElement) blackTimeElement.className = 'text-primary';
            }
        }
        
        if (blackTimeElement) {
            blackTimeElement.textContent = this.formatTime(this.blackTime);
            // Mettre en évidence le joueur actif
            if (this.currentPlayerTimer === 'black') {
                blackTimeElement.className = 'text-success fw-bold';
                if (whiteTimeElement) whiteTimeElement.className = 'text-primary';
            }
        }
    }

    // NOUVELLE MÉTHODE : Formater le temps (secondes -> MM:SS)
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        
        // Récupérer les temps en secondes
        const whiteTime = this.game.gameState.getMoveTime(i);
        const blackTime = blackMove ? this.game.gameState.getMoveTime(i + 1) : '';
        
        let moveText = `<span class="fw-bold">${whiteMove.number}.</span> ${whiteMove.notation}`;
        
        if (blackMove) {
            moveText += ` ${blackMove.notation}`;
        }
        
        // Afficher les deux temps
        let timeText = whiteTime;
        if (blackTime) {
            timeText = `${whiteTime} / ${blackTime}`;
        }
        
        moveItem.innerHTML = `
            <span>${moveText}</span>
            <small class="text-muted">${timeText}</small>
        `;
        historyElement.appendChild(moveItem);
    }
    
    if (moves.length === 0) {
        historyElement.innerHTML = '<div class="text-center text-muted small p-3">Aucun coup joué</div>';
    }
    
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

    // Afficher un feedback visuel pour la copie
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

    // Afficher l'écran de fin de partie - CORRIGÉ POUR LA NULLITÉ
showGameOver(result, reason = null) {
    const statusElement = document.getElementById('gameStatus');
    const playerElement = document.getElementById('currentPlayer');
    
    if (statusElement && playerElement) {
        statusElement.textContent = 'Partie terminée';
        statusElement.className = 'h5 text-danger';
        
        if (result === 'draw') {
            const drawMessages = {
                'repetition': '🔄 Répétition triple',
                'fiftyMoves': '🎯 50 coups sans capture',
                'insufficientMaterial': '♜ Matériel insuffisant',
                null: '🤝 Partie nulle'
            };
            playerElement.textContent = `${drawMessages[reason] || '🤝 Partie nulle'} !`;
            playerElement.className = 'small mb-2 text-warning fw-bold';
        } else {
            playerElement.textContent = `🎉 Victoire des ${result === 'white' ? 'blancs' : 'noirs'} !`;
            playerElement.className = 'small mb-2 text-success fw-bold';
        }
    }
    
    // Afficher une notification appropriée
    if (result === 'draw') {
        const notificationMessages = {
            'repetition': '🔄 Partie nulle par répétition triple de position',
            'fiftyMoves': '🎯 Partie nulle par la règle des 50 coups',
            'insufficientMaterial': '♜ Partie nulle par matériel insuffisant',
            null: '🤝 Partie nulle'
        };
        this.showNotification(notificationMessages[reason] || '🤝 Partie nulle !', 'warning');
    } else {
        this.showNotification(`🎉 Les ${result === 'white' ? 'blancs' : 'noirs'} remportent la partie !`, 'success');
    }
    
    // Arrêter les timers
    this.stopPlayerTimer();
}

    // Afficher une notification UI
    showNotification(message, type = 'info') {
        console.log('🔔 UI Notification:', message);
        
        // Éviter les doublons de notifications
        const existingNotifications = document.querySelectorAll('.chess-ui-notification');
        existingNotifications.forEach(notif => notif.remove());

        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = `chess-ui-notification chess-ui-notification-${type}`;
        notification.innerHTML = message;
        
        // Style de base pour les notifications UI
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? 'rgba(25, 135, 84, 0.95)' : 
                         type === 'warning' ? 'rgba(255, 193, 7, 0.95)' : 
                         'rgba(33, 37, 41, 0.95)'};
            color: ${type === 'warning' ? '#000' : 'white'};
            padding: 20px 30px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 1.2rem;
            z-index: 10001;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            text-align: center;
            animation: fadeIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Supprimer après 5 secondes
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Initialiser les animations CSS pour les notifications
    initNotificationStyles() {
        if (document.getElementById('chess-ui-notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'chess-ui-notification-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { 
                    opacity: 0; 
                    transform: translate(-50%, -60%); 
                }
                to { 
                    opacity: 1; 
                    transform: translate(-50%, -50%); 
                }
            }
            
            @keyframes fadeOut {
                from { 
                    opacity: 1; 
                    transform: translate(-50%, -50%); 
                }
                to { 
                    opacity: 0; 
                    transform: translate(-50%, -40%); 
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Déclaration globale
if (typeof window.ChessGameUI === 'undefined') {
    window.ChessGameUI = ChessGameUI;
}