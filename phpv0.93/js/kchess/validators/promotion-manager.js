// promotion-manager.js - Gestion de la promotion des pions (version avec sélection SANS bouton annuler)
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
        
        let selectedPiece = 'queen'; // Sélection par défaut
        
        modal.innerHTML = `
            <div class="promotion-overlay">
                <div class="promotion-content">
                    <h4><i class="bi bi-arrow-up-circle"></i> Promotion du Pion</h4>
                    <p>Choisissez une pièce pour promouvoir votre pion</p>
                    
                    <div class="promotion-options">
                        <div class="promotion-option ${selectedPiece === 'queen' ? 'selected' : ''}" data-piece="queen">
                            <div class="chess-piece ${color}">
                                <img src="img/chesspieces/wikipedia/${color === 'white' ? 'w' : 'b'}Q.png" alt="Dame" class="chess-piece-img">
                            </div>
                            <span>Dame</span>
                        </div>
                        <div class="promotion-option ${selectedPiece === 'rook' ? 'selected' : ''}" data-piece="rook">
                            <div class="chess-piece ${color}">
                                <img src="img/chesspieces/wikipedia/${color === 'white' ? 'w' : 'b'}R.png" alt="Tour" class="chess-piece-img">
                            </div>
                            <span>Tour</span>
                        </div>
                        <div class="promotion-option ${selectedPiece === 'bishop' ? 'selected' : ''}" data-piece="bishop">
                            <div class="chess-piece ${color}">
                                <img src="img/chesspieces/wikipedia/${color === 'white' ? 'w' : 'b'}B.png" alt="Fou" class="chess-piece-img">
                            </div>
                            <span>Fou</span>
                        </div>
                        <div class="promotion-option ${selectedPiece === 'knight' ? 'selected' : ''}" data-piece="knight">
                            <div class="chess-piece ${color}">
                                <img src="img/chesspieces/wikipedia/${color === 'white' ? 'w' : 'b'}N.png" alt="Cavalier" class="chess-piece-img">
                            </div>
                            <span>Cavalier</span>
                        </div>
                    </div>
                    
                    <div class="promotion-actions mt-3">
                        <button class="btn btn-success" id="promotionConfirm">
                            <i class="bi bi-check-circle me-1"></i>Valider la sélection
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gestion de la sélection des pièces
        const options = modal.querySelectorAll('.promotion-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                // Retirer la sélection précédente
                options.forEach(opt => opt.classList.remove('selected'));
                // Ajouter la sélection
                option.classList.add('selected');
                selectedPiece = option.dataset.piece;
            });
        });
        
        // Bouton Valider
        modal.querySelector('#promotionConfirm').addEventListener('click', () => {
            modal.remove();
            callback(selectedPiece);
        });
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                callback(null);
            }
        });
        
        // Empêcher la fermeture en cliquant à l'intérieur
        modal.querySelector('.promotion-overlay').addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

window.PromotionManager = PromotionManager;