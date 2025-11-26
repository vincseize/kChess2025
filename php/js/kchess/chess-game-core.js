// chess-game-core.js - Classe principale orchestratrice AVEC TOUTES LES VÉRIFICATIONS
class ChessGame {
    constructor() {
        this.pieceManager = new PieceManager();
        this.gameState = new GameState();
        this.board = new ChessBoard(this.gameState, this.pieceManager);
        this.moveValidator = new MoveValidator(this.board, this.gameState);
        
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.lastCheckAlert = null; 
        
        // Initialiser les modules
        this.moveHandler = new ChessGameMoveHandler(this);
        this.ui = new ChessGameUI(this);
        this.promotionManager = new PromotionManager(this);
        
        this.init();
    }
    
    init() {
        this.loadInitialPosition();
        this.ui.setupEventListeners();
        this.ui.initNotificationStyles();
        this.ui.updateUI();
    }

    // Méthodes déléguées
    handleSquareClick = (displayRow, displayCol) => this.moveHandler.handleSquareClick(displayRow, displayCol);
    highlightPossibleMoves = () => this.moveHandler.highlightPossibleMoves();
    clearSelection = () => this.moveHandler.clearSelection();
    updateUI = () => {
        this.ui.updateUI();
        this.updateGameStatus();
    };

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

    // NOUVELLE MÉTHODE : Vérifier TOUS les statuts de jeu
    updateGameStatus() {
        // Retirer les anciennes surbrillances d'échec
        this.board.squares.forEach(square => {
            square.element.classList.remove('king-in-check', 'checkmate', 'stalemate');
        });

        // Générer le FEN actuel
        const currentFEN = FENGenerator.generateFEN(this.gameState, this.board);
        console.log('🔍 Vérification statut jeu avec FEN:', currentFEN);
        
        // Vérifier l'échec et mat pour les DEUX camps
        const mateEngine = new ChessMateEngine(currentFEN);
        const whiteCheckmate = mateEngine.isCheckmate('w');
        const blackCheckmate = mateEngine.isCheckmate('b');
        
        // Vérifier le pat pour les DEUX camps
        const patEngine = new ChessPatEngine(currentFEN);
        const whiteStalemate = patEngine.isStalemate('w');
        const blackStalemate = patEngine.isStalemate('b');
        
        // Vérifier les autres conditions de nullité
        const nulleEngine = new ChessNulleEngine(currentFEN, this.gameState.moveHistory.map(m => m.fen));
        const isDraw = nulleEngine.isDraw(this.gameState.halfMoveClock);
        
        console.log('🔍 Échec et mat blanc:', whiteCheckmate);
        console.log('🔍 Échec et mat noir:', blackCheckmate);
        console.log('🔍 Pat blanc:', whiteStalemate);
        console.log('🔍 Pat noir:', blackStalemate);
        console.log('🔍 Autres nullités:', isDraw);

        // 1. Vérifier l'échec et mat (priorité)
        if (whiteCheckmate) {
            this.handleCheckmate('white');
            return;
        }
        
        if (blackCheckmate) {
            this.handleCheckmate('black');
            return;
        }

        // 2. Vérifier le pat
        if (whiteStalemate) {
            this.handleStalemate('white');
            return;
        }
        
        if (blackStalemate) {
            this.handleStalemate('black');
            return;
        }

        // 3. Vérifier les autres nullités
        if (isDraw) {
            this.handleDraw();
            return;
        }

        // 4. Vérifier les échecs simples (seulement si pas mat/pat/nul)
        this.updateCheckDisplay(currentFEN);
    }

    // Gérer l'échec et mat
    handleCheckmate(kingColor) {
        const kingPos = this.findKingPosition(kingColor);
        console.log('💀 ÉCHEC ET MAT ! Roi', kingColor, 'trouvé à:', kingPos);
        
        if (kingPos) {
            const kingSquare = this.board.getSquare(kingPos.row, kingPos.col);
            if (kingSquare) {
                kingSquare.element.classList.add('checkmate');
            }
        }
        
        const winner = kingColor === 'white' ? 'black' : 'white';
        this.showNotification(`Échec et mat ! Roi ${kingColor === 'white' ? 'blanc' : 'noir'} mat. Les ${winner === 'white' ? 'blancs' : 'noirs'} gagnent !`, 'danger');
        console.log(`💀 ÉCHEC ET MAT ! Victoire des ${winner === 'white' ? 'blancs' : 'noirs'}`);
        
        this.endGame(winner);
    }

    // Gérer le pat
    handleStalemate(kingColor) {
        const kingPos = this.findKingPosition(kingColor);
        console.log('♟️ PAT ! Roi', kingColor, 'trouvé à:', kingPos);
        
        if (kingPos) {
            const kingSquare = this.board.getSquare(kingPos.row, kingPos.col);
            if (kingSquare) {
                kingSquare.element.classList.add('stalemate');
            }
        }
        
        this.showNotification(`Pat ! Roi ${kingColor === 'white' ? 'blanc' : 'noir'} pat. Partie nulle.`, 'warning');
        console.log(`♟️ PAT ! Partie nulle`);
        
        this.endGame('draw');
    }

    // Gérer les autres nullités
    handleDraw() {
        this.showNotification(`Partie nulle ! (Répétition triple, 50 coups ou matériel insuffisant)`, 'info');
        console.log(`🤝 NULLITÉ ! Partie terminée`);
        
        this.endGame('draw');
    }

    // Mettre à jour l'affichage des échecs simples
    updateCheckDisplay(currentFEN) {
        const engine = new ChessEngine(currentFEN);
        const whiteInCheck = engine.isKingInCheck('w');
        const blackInCheck = engine.isKingInCheck('b');

        console.log('🔍 Échec roi blanc:', whiteInCheck);
        console.log('🔍 Échec roi noir:', blackInCheck);

        // Échec simple BLANC
        if (whiteInCheck) {
            const kingPos = this.findKingPosition('white');
            console.log('🚨 ROI BLANC EN ÉCHEC trouvé à:', kingPos);
            if (kingPos) {
                const kingSquare = this.board.getSquare(kingPos.row, kingPos.col);
                if (kingSquare) {
                    kingSquare.element.classList.add('king-in-check');
                    this.showCheckAlert('white');
                }
            }
        }

        // Échec simple NOIR
        if (blackInCheck) {
            const kingPos = this.findKingPosition('black');
            console.log('🚨 ROI NOIR EN ÉCHEC trouvé à:', kingPos);
            if (kingPos) {
                const kingSquare = this.board.getSquare(kingPos.row, kingPos.col);
                if (kingSquare) {
                    kingSquare.element.classList.add('king-in-check');
                    this.showCheckAlert('black');
                }
            }
        }
    }

    // NOUVELLE MÉTHODE : Afficher l'alerte d'échec
    showCheckAlert(kingColor) {
        // Éviter les alertes en double pour le même échec
        if (this.lastCheckAlert === kingColor) return;
        
        this.lastCheckAlert = kingColor;
        
        this.showNotification(`Roi ${kingColor === 'white' ? 'blanc' : 'noir'} ECHEC`);
        console.log(`🚨 ÉCHEC ! Roi ${kingColor} en danger`);
        
        // Réinitialiser après un délai pour permettre de nouvelles alertes
        setTimeout(() => {
            this.lastCheckAlert = null;
        }, 2000);
    }

    endGame(result) {
        this.gameState.gameActive = false;
        
        let message = '';
        if (result === 'draw') {
            message = 'Partie nulle !';
        } else {
            message = `Partie terminée ! Vainqueur : ${result}`;
        }
        
        console.log(`🏆 ${message}`);
        
        // Arrêter les timers via l'UI
        if (this.ui && this.ui.stopPlayerTimer) {
            this.ui.stopPlayerTimer();
        }
        
        // Mettre à jour l'UI pour montrer le résultat
        if (this.ui && this.ui.showGameOver) {
            this.ui.showGameOver(result);
        }
    }

    // NOUVELLE MÉTHODE : Trouver la position du roi
    findKingPosition(color) {
        const kingType = 'king';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board.getSquare(row, col);
                if (square.piece && 
                    square.piece.type === kingType && 
                    square.piece.color === color) {
                    console.log(`🔍 Roi ${color} trouvé à [${row},${col}]`);
                    return { row, col };
                }
            }
        }
        console.warn(`❌ Roi ${color} non trouvé !`);
        return null;
    }

    // NOUVELLE MÉTHODE : Système de notification amélioré
    showNotification(message, type = 'info') {
        console.log('🔔 Tentative d\'affichage notification:', message);
        
        // Éviter les doublons de notifications
        const existingNotifications = document.querySelectorAll('.chess-notification');
        existingNotifications.forEach(notif => {
            console.log('🗑️ Suppression notification existante');
            notif.remove();
        });

        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = `chess-notification chess-notification-${type}`;
        
        // Ajouter une icône selon le type
        const icons = {
            'danger': '💀',
            'warning': '♟️', 
            'info': 'ℹ️'
        };
        const icon = icons[type] || 'ℹ️';
        notification.innerHTML = `${icon} ${message}`;

        console.log('📝 Ajout de la notification au DOM');
        document.body.appendChild(notification);

        // Supprimer après 3 secondes
        setTimeout(() => {
            console.log('⏰ Suppression programmée de la notification');
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    console.log('✅ Notification supprimée');
                }
            }, 300);
        }, 3000);
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
        this.updateGameStatus();
        console.log('Flip du plateau - nouvel état:', this.gameState.boardFlipped);
    }

    newGame() {
        console.log('Nouvelle partie');
        this.gameState.resetGame();
        this.clearSelection();
        this.loadInitialPosition();
        this.ui.resetTimers();
        this.updateUI();
    }

    clearMoveHistory() {
        this.gameState.moveHistory = [];
        this.ui.updateMoveHistory();
    }
}

// S'assurer que ChessGame est disponible globalement
window.ChessGame = ChessGame;

// Auto-initialisation avec gestion d'erreur
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation ChessGame...');
    try {
        if (!window.chessGame && typeof ChessGame !== 'undefined') {
            window.chessGame = new ChessGame();
            console.log('✅ ChessGame initialisé avec succès');
        } else if (window.chessGame) {
            console.log('ℹ️ ChessGame déjà initialisé');
        } else {
            console.warn('⚠️ ChessGame non disponible pour l\'initialisation');
        }
    } catch (error) {
        console.error('❌ Erreur initialisation ChessGame:', error);
    }
});