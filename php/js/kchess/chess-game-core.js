// chess-game-core.js - Classe principale orchestratrice
class ChessGame {
    constructor() {
        this.pieceManager = new PieceManager();
        this.gameState = new GameState();
        this.board = new ChessBoard(this.gameState, this.pieceManager);
        this.moveValidator = new MoveValidator(this.board, this.gameState);
        
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.lastCheckAlert = null; // ← AJOUT ICI
        
        // Initialiser les modules
        this.moveHandler = new ChessGameMoveHandler(this);
        this.ui = new ChessGameUI(this);
        this.promotionManager = new PromotionManager(this);
        
        this.init();
    }
    
    init() {
        this.loadInitialPosition();
        this.ui.setupEventListeners();
        this.ui.updateUI();
        console.log('✅ Jeu d\'échecs initialisé avec promotion');
    }

    // Méthodes déléguées
    handleSquareClick = (displayRow, displayCol) => this.moveHandler.handleSquareClick(displayRow, displayCol);
    highlightPossibleMoves = () => this.moveHandler.highlightPossibleMoves();
    clearSelection = () => this.moveHandler.clearSelection();
    updateUI = () => {
        this.ui.updateUI();
        this.updateCheckDisplay();
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

    // NOUVELLE MÉTHODE : Vérifier et afficher les échecs POUR LES DEUX CAMPS
    updateCheckDisplay() {
        // Retirer les anciennes surbrillances d'échec
        this.board.squares.forEach(square => {
            square.element.classList.remove('king-in-check');
        });

        // Générer le FEN actuel
        const currentFEN = FENGenerator.generateFEN(this.gameState, this.board);
        console.log('🔍 Vérification échec avec FEN:', currentFEN);
        
        const engine = new ChessEngine(currentFEN);
        
        // Vérifier l'échec pour les DEUX camps
        const whiteInCheck = engine.isKingInCheck('w');
        const blackInCheck = engine.isKingInCheck('b');
        
        console.log('🔍 Échec roi blanc (w):', whiteInCheck);
        console.log('🔍 Échec roi noir (b):', blackInCheck);

        // Surligner le roi blanc si en échec
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

        // Surligner le roi noir si en échec
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

    // NOUVELLE MÉTHODE : Afficher l'alerte d'échec
    showCheckAlert(kingColor) {
        // Éviter les alertes en double pour le même échec
        if (this.lastCheckAlert === kingColor) return;
        
        this.lastCheckAlert = kingColor;
        
        this.showNotification(`Échec ! Roi ${kingColor === 'white' ? 'blanc' : 'noir'} menacé`, 'warning');
        console.log(`🚨 ÉCHEC ! Roi ${kingColor} en danger`);
        
        // Réinitialiser après un délai pour permettre de nouvelles alertes
        setTimeout(() => {
            this.lastCheckAlert = null;
        }, 2000);
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
        const icon = type === 'warning' ? '⚠️' : 'ℹ️';
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
        this.updateCheckDisplay();
        console.log('Flip du plateau - nouvel état:', this.gameState.boardFlipped);
    }

    newGame() {
        console.log('Nouvelle partie');
        this.gameState.resetGame();
        this.clearSelection();
        this.loadInitialPosition();
        this.ui.resetTimers(); // ← AJOUT ICI
        this.updateUI();
    }

    clearMoveHistory() {
        this.gameState.moveHistory = [];
        this.ui.updateMoveHistory();
    }
}

window.ChessGame = ChessGame;