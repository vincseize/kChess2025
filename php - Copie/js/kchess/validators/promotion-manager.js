/**
 * js/kchess/core/promotion-manager.js
 * Gère l'interface et la logique de promotion des pions.
 * Version 1.5.5 - Support Bot Aléatoire & Libération Verrou
 */
class PromotionManager {
    static consoleLog = true;

    constructor(game) {
        this.game = game;
        this.promotionHistory = { queen: 0, rook: 0, bishop: 0, knight: 0 };
    }

    /**
     * Affiche la modal de promotion ou effectue un choix automatique pour le bot.
     * @param {number} row - Ligne de destination
     * @param {number} col - Colonne de destination
     * @param {string} color - Couleur du joueur ('white' ou 'black')
     * @param {Function} callback - Callback de retour vers MoveExecutor
     */
    showPromotionModal(row, col, color, callback = null) {
        // --- GESTION DU BOT (Choix Aléatoire) ---
        const bot = this.game.botManager || this.game.core?.botManager;
        const isBot = bot && typeof bot.isBotTurn === 'function' && bot.isBotTurn();

        if (isBot) {
            const options = ['queen', 'rook', 'bishop', 'knight'];
            const randomPiece = options[Math.floor(Math.random() * options.length)];
            
            if (PromotionManager.consoleLog) {
                console.log(`🤖 Bot Promotion : Choix aléatoire -> ${randomPiece}`);
            }

            // Petit délai pour laisser l'animation de déplacement se finir
            setTimeout(() => {
                this.handleChoice(randomPiece, row, col, callback);
            }, 500);
            return;
        }

        // --- GESTION HUMAINE (Interface Modal) ---
        const oldModal = document.querySelector('.promotion-modal');
        if (oldModal) oldModal.remove();

        const modal = document.createElement('div');
        modal.className = 'promotion-modal';
        modal.innerHTML = `
            <div class="promotion-overlay">
                <div class="promotion-content">
                    <div class="promotion-header"><h4><i class="bi bi-stars"></i> Promotion</h4></div>
                    <div class="promotion-options">
                        ${['queen', 'rook', 'bishop', 'knight'].map(p => `
                            <div class="promotion-option" data-piece="${p}">
                                <img src="img/chesspieces/wikipedia/${color[0].toLowerCase()}${this.getPieceLetter(p)}.png" alt="${p}">
                                <span>${this.getPieceNameFr(p)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Événements de clic pour l'humain
        modal.querySelectorAll('.promotion-option').forEach(opt => {
            opt.onclick = () => {
                modal.remove();
                this.handleChoice(opt.dataset.piece, row, col, callback);
            };
        });

        // Fermeture sur Échap (annule le coup)
        const handleEsc = (e) => { 
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleEsc);
                modal.remove();
                this.handleChoice(null, row, col, callback);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    /**
     * Traite le choix de la pièce (qu'il vienne de l'UI ou du Bot)
     */
    handleChoice(selectedPiece, row, col, callback) {
        // 1. Libération immédiate du verrou pour le MoveHandler
        if (this.game.moveHandler) {
            this.game.moveHandler.isPromoting = false;
            if (PromotionManager.consoleLog) console.log("🔓 Verrou promotion libéré.");
        }

        if (selectedPiece) {
            // 2. Transformation visuelle et logique
            const square = this.game.board.getSquare(row, col);
            this.promotePawn(square, selectedPiece);
            this.promotionHistory[selectedPiece]++;

            // 3. Finalisation du tour via le callback ou manuellement
            if (typeof callback === 'function') {
                callback(selectedPiece);
            } else {
                if (this.game.gameState) this.game.gameState.switchPlayer();
                this.game.updateUI();
                if (this.game.checkBotTurn) this.game.checkBotTurn();
            }
        } else {
            if (typeof callback === 'function') callback(null);
            if (PromotionManager.consoleLog) console.warn("Promotion annulée.");
        }
    }

    /**
     * Change réellement le type de la pièce dans l'objet Board et l'UI
     */
    promotePawn(square, newType) {
        if (!square || !square.piece) return;
        
        const color = square.piece.color;
        square.piece.type = newType;
        
        // Nettoyage visuel de la case
        square.element.innerHTML = ''; 

        // Création de la nouvelle pièce (via MoveExecutor si possible)
        const executor = this.game.moveExecutor;
        if (executor && typeof executor.createPieceElement === 'function') {
            const newPieceEl = executor.createPieceElement({
                type: newType,
                color: color
            });
            square.element.appendChild(newPieceEl);
        } else {
            // Fallback manuel si l'exécuteur n'est pas prêt
            const img = document.createElement('img');
            img.src = `img/chesspieces/wikipedia/${color[0].toLowerCase()}${this.getPieceLetter(newType)}.png`;
            img.className = 'chess-piece-img';
            square.element.appendChild(img);
        }

        if (PromotionManager.consoleLog) {
            console.log(`✨ [Promotion] Case [${square.row},${square.col}] transformée en ${newType}`);
        }
    }

    getPieceLetter(type) {
        const letters = { queen: 'Q', rook: 'R', bishop: 'B', knight: 'N' };
        return letters[type] || 'Q';
    }

    getPieceNameFr(type) {
        const names = { queen: 'Dame', rook: 'Tour', bishop: 'Fou', knight: 'Cavalier' };
        return names[type] || type;
    }
}

window.PromotionManager = PromotionManager;