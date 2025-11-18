// promotion-manager.js - Gestion de la promotion des pions
class PromotionManager {
    constructor(game) {
        this.game = game;
    }

    checkPromotion(move, piece) {
        if (piece.type !== 'pawn') return false;
        
        const promotionRow = (piece.color === 'white') ? 0 : 7;
        return move.row === promotionRow;
    }

    handlePromotion(row, col, color, callback) {
        console.log(`♟️ Promotion demandée pour le pion ${color} en ${row},${col}`);
        this.showPromotionModal(color, callback);
    }

    showPromotionModal(color, callback) {
        const modal = document.createElement('div');
        modal.className = 'promotion-modal';
        modal.innerHTML = `
            <div class="promotion-overlay">
                <div class="promotion-content">
                    <h4><i class="bi bi-arrow-up-circle"></i> Promotion du Pion</h4>
                    <p>Choisissez une pièce pour promouvoir votre pion</p>
                    
                    <div class="promotion-options">
                        <div class="promotion-option" data-piece="queen">
                            <div class="chess-piece ${color}">♛</div>
                            <span>Dame</span>
                        </div>
                        <div class="promotion-option" data-piece="rook">
                            <div class="chess-piece ${color}">♜</div>
                            <span>Tour</span>
                        </div>
                        <div class="promotion-option" data-piece="bishop">
                            <div class="chess-piece ${color}">♝</div>
                            <span>Fou</span>
                        </div>
                        <div class="promotion-option" data-piece="knight">
                            <div class="chess-piece ${color}">♞</div>
                            <span>Cavalier</span>
                        </div>
                    </div>
                    
                    <button class="promotion-cancel">
                        <i class="bi bi-x-circle me-2"></i>Annuler
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gestion des clics
        modal.querySelectorAll('.promotion-option').forEach(option => {
            option.addEventListener('click', () => {
                const piece = option.dataset.piece;
                modal.remove();
                callback(piece);
            });
        });
        
        modal.querySelector('.promotion-cancel').addEventListener('click', () => {
            modal.remove();
            callback(null);
        });
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                callback(null);
            }
        });
    }
}

window.PromotionManager = PromotionManager;