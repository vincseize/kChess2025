// promotion-manager.js - Gestion de la promotion des pions
class PromotionManager {
    constructor(game) {
        this.game = game;
        this.promotionModal = null;
        this.pendingPromotion = null;
        this.selectedPieceType = null;
    }

    // Vérifier si un mouvement nécessite une promotion
    checkPromotion(move, piece) {
        if (piece.type === 'pawn' && move.isPromotion) {
            console.log('🎯 Promotion détectée !');
            this.pendingPromotion = {
                move: move,
                piece: piece,
                square: this.game.board.getSquare(move.row, move.col)
            };
            this.selectedPieceType = null;
            this.showPromotionModal();
            return true;
        }
        return false;
    }

    // Afficher le modal de promotion
    showPromotionModal() {
        // Créer le modal
        this.promotionModal = document.createElement('div');
        this.promotionModal.className = 'promotion-modal';
        this.promotionModal.innerHTML = `
            <div class="promotion-overlay">
                <div class="promotion-content">
                    <h4>Promotion du pion</h4>
                    <p>Choisissez une pièce :</p>
                    <div class="promotion-options">
                        <button class="promotion-option" data-piece="queen">
                            <div class="chess-piece ${this.pendingPromotion.piece.color}">
                                ${this.game.pieceManager.getSymbol('queen', this.pendingPromotion.piece.color)}
                            </div>
                        </button>
                        <button class="promotion-option" data-piece="rook">
                            <div class="chess-piece ${this.pendingPromotion.piece.color}">
                                ${this.game.pieceManager.getSymbol('rook', this.pendingPromotion.piece.color)}
                            </div>
                        </button>
                        <button class="promotion-option" data-piece="bishop">
                            <div class="chess-piece ${this.pendingPromotion.piece.color}">
                                ${this.game.pieceManager.getSymbol('bishop', this.pendingPromotion.piece.color)}
                            </div>
                        </button>
                        <button class="promotion-option" data-piece="knight">
                            <div class="chess-piece ${this.pendingPromotion.piece.color}">
                                ${this.game.pieceManager.getSymbol('knight', this.pendingPromotion.piece.color)}
                            </div>
                        </button>
                    </div>
                    <button class="promotion-confirm-btn" id="promotionConfirm" disabled>OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.promotionModal);

        // Ajouter les événements
        const options = this.promotionModal.querySelectorAll('.promotion-option');
        const confirmBtn = this.promotionModal.querySelector('#promotionConfirm');

        options.forEach(option => {
            option.addEventListener('click', (e) => {
                // Retirer la sélection précédente
                options.forEach(opt => opt.classList.remove('selected'));
                
                // Sélectionner la nouvelle option
                e.currentTarget.classList.add('selected');
                this.selectedPieceType = e.currentTarget.dataset.piece;
                
                // Activer le bouton OK
                confirmBtn.disabled = false;
            });
        });

        // Bouton de confirmation
        confirmBtn.addEventListener('click', () => {
            if (this.selectedPieceType) {
                this.handlePromotionChoice(this.selectedPieceType);
            }
        });

        // Fermer le modal en cliquant à l'extérieur
        this.promotionModal.addEventListener('click', (e) => {
            if (e.target === this.promotionModal) {
                this.cancelPromotion();
            }
        });
    }

    // Gérer le choix de promotion
    handlePromotionChoice(pieceType) {
        console.log(`🎯 Promotion choisie: ${pieceType}`);
        
        if (this.pendingPromotion) {
            const { move, piece, square } = this.pendingPromotion;
            
            // Créer la nouvelle pièce
            const newPiece = {
                type: pieceType,
                color: piece.color
            };

            // Remplacer le pion par la nouvelle pièce
            square.element.innerHTML = '';
            this.game.board.placePiece(newPiece, square);
            square.piece = newPiece;

            // Mettre à jour l'historique avec la promotion
            this.game.gameState.recordMove(
                this.game.selectedPiece.row, 
                this.game.selectedPiece.col, 
                move.row, 
                move.col,
                this.game.selectedPiece.piece,
                pieceType
            );

            this.hidePromotionModal();
            this.game.gameState.switchPlayer();
            this.game.clearSelection();
            this.game.updateUI();

            console.log(`✅ Pion promu en ${pieceType}`);
        }
    }

    // Annuler la promotion
    cancelPromotion() {
        console.log('❌ Promotion annulée');
        this.hidePromotionModal();
        this.game.clearSelection();
        // Replacer le pion à sa position d'origine
        if (this.pendingPromotion) {
            const fromSquare = this.game.board.getSquare(this.game.selectedPiece.row, this.game.selectedPiece.col);
            const toSquare = this.pendingPromotion.square;
            
            // Replacer le pion
            toSquare.element.innerHTML = '';
            toSquare.piece = null;
            
            const pieceElement = document.createElement('div');
            pieceElement.className = `chess-piece ${this.game.selectedPiece.piece.color}`;
            pieceElement.innerHTML = this.game.pieceManager.getSymbol('pawn', this.game.selectedPiece.piece.color);
            fromSquare.element.appendChild(pieceElement);
            fromSquare.piece = this.game.selectedPiece.piece;
        }
        this.pendingPromotion = null;
        this.selectedPieceType = null;
    }

    // Cacher le modal
    hidePromotionModal() {
        if (this.promotionModal) {
            this.promotionModal.remove();
            this.promotionModal = null;
        }
        this.pendingPromotion = null;
        this.selectedPieceType = null;
    }
}

window.PromotionManager = PromotionManager;