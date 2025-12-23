// validators/promotion-manager.js
if (typeof PromotionManager !== 'undefined') {
    console.warn('⚠️ PromotionManager existe déjà.');
} else {

class PromotionManager {
    static consoleLog = true;

    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('👑 PromotionManager : Prêt pour le couronnement');
    }

    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine) {
                this.consoleLog = window.appConfig.chess_engine.console_log ?? true;
            }
        } catch (e) { this.consoleLog = true; }
    }

    constructor(game) {
        this.game = game;
        this.promotionHistory = { queen: 0, rook: 0, bishop: 0, knight: 0 };
    }

    /**
     * Détecte si un mouvement de pion déclenche une promotion.
     * Logique : Rang 0 pour Blancs, Rang 7 pour Noirs (en coordonnées 0-indexed).
     */
    checkPromotion(move, piece) {
        if (!piece || piece.type !== 'pawn') return false;
        
        const isPromotion = (piece.color === 'white' && move.row === 0) || 
                            (piece.color === 'black' && move.row === 7);
        
        if (isPromotion && this.constructor.consoleLog) {
            console.log(`🎉 Promotion détectée pour ${piece.color} en [${move.row},${move.col}]`);
        }
        return isPromotion;
    }

    /**
     * Gère le cycle de vie de la promotion : Bloquer UI -> Afficher Modal -> Callback -> Débloquer UI
     */
    handlePromotion(row, col, color, callback) {
        // 1. Verrouiller le MoveHandler pour empêcher d'autres clics sur le plateau
        if (this.game.moveHandler) {
            this.game.moveHandler.isPromoting = true;
        }
        
        // 2. Ouvrir l'interface de choix
        this.showPromotionModal(color, (selectedPiece) => {
            // 3. Déverrouiller le MoveHandler
            if (this.game.moveHandler) {
                this.game.moveHandler.isPromoting = false;
            }
            
            if (selectedPiece) {
                this.promotionHistory[selectedPiece]++;
                if (this.constructor.consoleLog) console.log(`👑 Choix validé : ${selectedPiece}`);
                callback(selectedPiece);
            } else {
                // Si l'utilisateur a fermé la modal sans choisir, on annule le mouvement
                if (this.constructor.consoleLog) console.log("🔄 Promotion annulée par l'utilisateur");
                callback(null);
            }
        });
    }

    /**
     * Crée et injecte la modal de promotion dans le DOM
     */
    showPromotionModal(color, callback) {
        const modal = document.createElement('div');
        modal.className = 'promotion-modal';
        
        // Utilisation de backticks pour un template HTML propre
        modal.innerHTML = `
            <div class="promotion-overlay">
                <div class="promotion-content">
                    <h4><i class="bi bi-stars"></i> Promotion</h4>
                    <p>Choisissez votre nouvelle pièce :</p>
                    <div class="promotion-options">
                        ${['queen', 'rook', 'bishop', 'knight'].map(p => `
                            <div class="promotion-option" data-piece="${p}">
                                <img src="img/chesspieces/wikipedia/${color[0]}${this.getPieceLetter(p)}.png" alt="${p}">
                                <span>${this.getPieceNameFr(p)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // --- Gestion des événements ---

        // Sélection d'une pièce
        modal.querySelectorAll('.promotion-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const piece = option.getAttribute('data-piece');
                modal.remove();
                callback(piece);
            });
        });

        // Fermeture par clic extérieur (Annulation)
        modal.querySelector('.promotion-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('promotion-overlay')) {
                modal.remove();
                callback(null);
            }
        });

        // Touche Echap pour annuler
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleEsc);
                modal.remove();
                callback(null);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    // ========== UTILITAIRES ==========

    getPieceLetter(type) {
        const letters = { queen: 'Q', rook: 'R', bishop: 'B', knight: 'N' };
        return letters[type] || 'Q';
    }

    getPieceNameFr(type) {
        const names = { queen: 'Dame', rook: 'Tour', bishop: 'Fou', knight: 'Cavalier' };
        return names[type] || type;
    }
}

PromotionManager.init();
window.PromotionManager = PromotionManager;

}