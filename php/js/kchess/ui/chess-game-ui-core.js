// chess-game-ui-core.js - Classe principale ChessGameUI
class ChessGameUI {
    constructor(game) {
        this.game = game;
        
        // Initialiser les modules
        this.timerManager = new ChessTimerManager(this);
        this.modalManager = new ChessModalManager(this);
        this.moveHistoryManager = new ChessMoveHistoryManager(this);
        this.clipboardManager = new ChessClipboardManager(this);
        this.styleManager = new ChessStyleManager(this);
        
        // Initialiser les styles
        this.styleManager.initAllStyles();
        
        // Démarrer le timer après un court délai
        setTimeout(() => {
            this.timerManager.startTimer();
        }, 1000);
        
        // Mettre à jour les labels après initialisation
        setTimeout(() => {
            this.updatePlayerLabels();
        }, 1500);
    }

    setupEventListeners() {
        // Boutons desktop
        document.getElementById('newGame')?.addEventListener('click', () => {
            this.modalManager.confirmNewGame();
        });
        
        document.getElementById('flipBoard')?.addEventListener('click', () => {
            console.log('🔄 Flip board (desktop)');
            this.game.flipBoard();
            this.updatePlayerLabels();
        });
        
        document.getElementById('copyFEN')?.addEventListener('click', () => this.clipboardManager.copyFENToClipboard());
        document.getElementById('copyPGN')?.addEventListener('click', () => this.clipboardManager.copyPGNToClipboard());
        
        // Boutons mobiles
        document.getElementById('newGameMobile')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.modalManager.confirmNewGame();
        });
        
        document.getElementById('flipBoardMobile')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Flip board (mobile)');
            this.game.flipBoard();
            this.updatePlayerLabels();
        });
        
        // Événements du plateau
        this.setupBoardEventListeners();
    }

    // MÉTHODE POUR METTRE À JOUR LES LABELS DES JOUEURS
    updatePlayerLabels() {
        console.log('🎮 Mise à jour des labels depuis ChessGameUI');
        
        try {
            // Appeler la fonction globale depuis chess-events.js
            if (typeof window.updatePlayerLabels === 'function') {
                window.updatePlayerLabels();
            } else {
                // Fallback si la fonction globale n'existe pas
                this._updatePlayerLabelsFallback();
            }
        } catch (error) {
            console.error('❌ Erreur dans updatePlayerLabels:', error);
        }
    }
    
    // Fallback si la fonction globale n'est pas disponible
    _updatePlayerLabelsFallback() {
        const topLabel = document.getElementById('topPlayerLabel');
        const bottomLabel = document.getElementById('bottomPlayerLabel');
        
        if (!topLabel || !bottomLabel) return;
        
        // Logique simplifiée
        const isFlipped = this.game.isBoardFlipped?.() || false;
        
        if (isFlipped) {
            topLabel.innerHTML = '<i class="bi bi-person me-1"></i> Human White';
            bottomLabel.innerHTML = '<i class="bi bi-cpu me-1"></i> Human Black';
            topLabel.className = 'badge bg-primary text-white p-2';
            bottomLabel.className = 'badge bg-dark text-white p-2';
        } else {
            topLabel.innerHTML = '<i class="bi bi-cpu me-1"></i> Human Black';
            bottomLabel.innerHTML = '<i class="bi bi-person me-1"></i> Human White';
            topLabel.className = 'badge bg-dark text-white p-2';
            bottomLabel.className = 'badge bg-primary text-white p-2';
        }
    }

    setupBoardEventListeners() {
        const chessBoard = document.getElementById('chessBoard');
        if (!chessBoard) return;
        
        // Clic souris
        chessBoard.addEventListener('click', (e) => {
            const square = e.target.closest('.chess-square');
            if (square) {
                const displayRow = parseInt(square.dataset.displayRow);
                const displayCol = parseInt(square.dataset.displayCol);
                this.game.moveHandler.handleSquareClick(displayRow, displayCol);
            }
        });

        // Touch mobile
        chessBoard.addEventListener('touchstart', (e) => {
            const square = e.target.closest('.chess-square');
            if (square) {
                e.preventDefault();
                const displayRow = parseInt(square.dataset.displayRow);
                const displayCol = parseInt(square.dataset.displayCol);
                this.game.moveHandler.handleSquareClick(displayRow, displayCol);
            }
        }, { passive: false });
    }

    // Mettre à jour l'UI complète
    updateUI() {
        this.timerManager.updateTimerDisplay();
        this.moveHistoryManager.updateMoveHistory();
        this.updateGameStatus();
        
        // Mettre à jour les labels si nécessaire
        this.updatePlayerLabels();
    }

    updateGameStatus() {
        const currentPlayerElement = document.getElementById('currentPlayer');
        if (!currentPlayerElement) return;
        
        if (this.game.gameState && this.game.gameState.currentPlayer) {
            const player = this.game.gameState.currentPlayer;
            currentPlayerElement.textContent = player === 'white' ? 'Aux blancs de jouer' : 'Aux noirs de jouer';
        }
    }

    // Méthode utilitaire pour les notifications
    showNotification(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        if (this.game.gameStatusManager && this.game.gameStatusManager.showNotification) {
            this.game.gameStatusManager.showNotification(message, type);
        } else {
            // Notification simple
            const notification = document.createElement('div');
            notification.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed top-0 end-0 m-3`;
            notification.style.zIndex = '9999';
            notification.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-exclamation-triangle' : 'bi-info-circle'} me-2"></i>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(notification);
            
            // Supprimer après 3 secondes
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
    }
}

window.ChessGameUI = ChessGameUI;