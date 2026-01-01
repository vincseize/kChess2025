// validators/promotion-manager.js
if (typeof PromotionManager !== 'undefined') {
    console.warn('⚠️ PromotionManager existe déjà.');
} else {

class PromotionManager {
    static consoleLog = true;

    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('👑 PromotionManager : Prêt');
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.chess_engine || window.appConfig?.debug;
            if (config?.console_log !== undefined) {
                this.consoleLog = String(config.console_log).toLowerCase() !== "false";
            }
        } catch (e) { this.consoleLog = true; }
    }

    constructor(game) {
        this.game = game;
        this.promotionHistory = { queen: 0, rook: 0, bishop: 0, knight: 0 };
    }

    /**
     * Vérifie si la destination déclenche une promotion
     */
    checkPromotion(targetRow, piece) {
        if (!piece || piece.type !== 'pawn') return false;
        return (piece.color === 'white' && targetRow === 0) || 
               (piece.color === 'black' && targetRow === 7);
    }

    /**
     * Cycle de promotion asynchrone
     */
    async askPromotionPiece(color) {
        if (this.game.moveHandler) this.game.moveHandler.isPromoting = true;

        // On transforme la modal en Promesse pour une utilisation propre avec await
        return new Promise((resolve) => {
            this.showPromotionModal(color, (selectedPiece) => {
                if (this.game.moveHandler) this.game.moveHandler.isPromoting = false;
                
                if (selectedPiece) {
                    this.promotionHistory[selectedPiece]++;
                    resolve(selectedPiece);
                } else {
                    // Si annulé, on retourne 'null' pour que le MoveExecutor annule le coup
                    resolve(null);
                }
            });
        });
    }

    showPromotionModal(color, callback) {
        // Suppression d'une éventuelle modal résiduelle
        const oldModal = document.querySelector('.promotion-modal');
        if (oldModal) oldModal.remove();

        const modal = document.createElement('div');
        modal.className = 'promotion-modal';
        
        modal.innerHTML = `
            <div class="promotion-overlay">
                <div class="promotion-content">
                    <div class="promotion-header">
                        <h4><i class="bi bi-stars"></i> Promotion</h4>
                    </div>
                    <div class="promotion-options">
                        ${['queen', 'rook', 'bishop', 'knight'].map(p => `
                            <div class="promotion-option" data-piece="${p}">
                                <img src="img/chesspieces/wikipedia/${color[0]}${this.getPieceLetter(p)}.png" alt="${p}">
                                <span>${this.getPieceNameFr(p)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="promotion-footer">
                        <small>Appuyez sur Échap pour annuler le mouvement</small>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // --- Événements ---
        const closeModal = (result) => {
            document.removeEventListener('keydown', handleEsc);
            modal.remove();
            callback(result);
        };

        modal.querySelectorAll('.promotion-option').forEach(opt => {
            opt.onclick = () => closeModal(opt.dataset.piece);
        });

        const handleEsc = (e) => { if (e.key === 'Escape') closeModal(null); };
        document.addEventListener('keydown', handleEsc);

        modal.querySelector('.promotion-overlay').onclick = (e) => {
            if (e.target.classList.contains('promotion-overlay')) closeModal(null);
        };
    }

    // ========== LOGIQUE PHYSIQUE (Appelée par MoveExecutor) ==========

    promotePawn(square, newType) {
        if (!square || !square.piece) return;
        
        const piece = square.piece;
        piece.type = newType;
        
        // Mise à jour visuelle immédiate de la pièce sur le plateau
        if (this.game.board && typeof this.game.board.placePiece === 'function') {
            this.game.board.placePiece(piece, square);
        }

        if (PromotionManager.consoleLog) {
            console.log(`✨ Pion promu en ${newType} sur ${square.row}:${square.col}`);
        }
    }

    getPieceLetter(type) {
        return { queen: 'Q', rook: 'R', bishop: 'B', knight: 'N' }[type] || 'Q';
    }

    getPieceNameFr(type) {
        return { queen: 'Dame', rook: 'Tour', bishop: 'Fou', knight: 'Cavalier' }[type] || type;
    }
}

PromotionManager.init();
window.PromotionManager = PromotionManager;
}