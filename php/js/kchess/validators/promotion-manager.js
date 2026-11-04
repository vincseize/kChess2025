/**
 * js/kchess/core/promotion-manager.js
 * Gère l'interface et la logique de promotion des pions.
 * Version 1.5.6 - Support Arena (Stress Test) & Chemins Absolus
 */
class PromotionManager {
    static consoleLog = true;

    constructor(game) {
        this.game = game;
        this.promotionHistory = { queen: 0, rook: 0, bishop: 0, knight: 0 };
    }

    /**
     * Récupère le chemin des images via la config globale ou un fallback local
     */
    getBasePath() {
        return window.PIECE_IMAGE_PATH || 'img/chesspieces/wikipedia/';
    }

    /**
     * Affiche la modal de promotion ou effectue un choix automatique.
     */
    showPromotionModal(row, col, color, callback = null) {
        // --- DETECTION DU MODE ARENA (STRESS TEST) ---
        // On vérifie si l'interface Arena est présente pour accélérer le traitement
        const isArena = !!document.getElementById('arena-dashboard');

        // --- GESTION DU BOT ---
        const bot = this.game.botManager || this.game.core?.botManager;
        const isBot = bot && typeof bot.isBotTurn === 'function' && bot.isBotTurn();

        if (isBot || isArena) {
            const options = ['queen', 'rook', 'bishop', 'knight'];
            const randomPiece = options[Math.floor(Math.random() * options.length)];
            
            if (PromotionManager.consoleLog && !isArena) {
                console.log(`🤖 Bot Promotion : Choix aléatoire -> ${randomPiece}`);
            }

            // Performance : En mode Arena, on traite immédiatement sans délai
            if (isArena) {
                this.handleChoice(randomPiece, row, col, callback);
            } else {
                // Petit délai pour le confort visuel en jeu standard
                setTimeout(() => {
                    this.handleChoice(randomPiece, row, col, callback);
                }, 500);
            }
            return;
        }

        // --- GESTION HUMAINE (Interface Modal) ---
        const oldModal = document.querySelector('.promotion-modal');
        if (oldModal) {
            oldModal.cleanupPromotion?.();
            oldModal.remove();
        }

        const basePath = this.getBasePath();
        const modal = document.createElement('div');
        modal.className = 'promotion-modal';
        modal.dataset.color = color === 'white' ? 'white' : 'black';
        modal.setAttribute('role', 'presentation');
        const getTranslation = (key, fallback) => window.getTranslation?.(key, fallback) || fallback;
        modal.innerHTML = `
            <section class="promotion-overlay" role="dialog" aria-modal="true" aria-labelledby="pawn-promotion-title" aria-describedby="pawn-promotion-description">
                <div class="promotion-content">
                    <header class="promotion-header">
                        <span class="promotion-icon" aria-hidden="true"><i class="bi bi-stars"></i></span>
                        <h2 id="pawn-promotion-title">${getTranslation('pawn_promotion_title', 'Promotion du pion')}</h2>
                        <p id="pawn-promotion-description">${getTranslation('choose_promotion_piece', 'Choisissez une pièce')}</p>
                    </header>
                    <div class="promotion-options" role="group" aria-label="${getTranslation('choose_promotion_piece', 'Choisissez une pièce')}">
                        ${['queen', 'rook', 'bishop', 'knight'].map(p => `
                            <button class="promotion-option" type="button" data-piece="${p}">
                                <img class="promotion-piece-img" src="${basePath}${color[0].toLowerCase()}${this.getPieceLetter(p)}.png" alt="" aria-hidden="true">
                                <span>${getTranslation(`promotion_piece_${p}`, this.getPieceNameFr(p))}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal(null);
                return;
            }
            if (e.key === 'Tab') {
                const options = [...modal.querySelectorAll('.promotion-option')];
                const first = options[0];
                const last = options[options.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        const closeModal = (pieceType = null) => {
            modal.cleanupPromotion();
            modal.remove();
            this.handleChoice(pieceType, row, col, callback);
        };
        modal.cleanupPromotion = () => document.removeEventListener('keydown', handleEsc);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(null);
        });
        modal.querySelectorAll('.promotion-option').forEach(option => {
            option.addEventListener('click', () => closeModal(option.dataset.piece));
        });

        document.addEventListener('keydown', handleEsc);
        document.body.appendChild(modal);
        modal.querySelector('.promotion-option')?.focus();
    }

    /**
     * Traite le choix de la pièce
     */
    handleChoice(selectedPiece, row, col, callback) {
        // Libération du verrou pour éviter de bloquer le prochain coup
        if (this.game.moveHandler) {
            this.game.moveHandler.isPromoting = false;
        }

        if (selectedPiece) {
            const square = this.game.board.getSquare(row, col);
            this.promotePawn(square, selectedPiece);
            this.promotionHistory[selectedPiece]++;

            if (typeof callback === 'function') {
                callback(selectedPiece);
            } else {
                if (this.game.gameState) this.game.gameState.switchPlayer();
                this.game.updateUI();
                if (this.game.checkBotTurn) this.game.checkBotTurn();
            }
        } else {
            if (typeof callback === 'function') callback(null);
        }
    }

    /**
     * Met à jour la pièce logiquement et visuellement (si nécessaire)
     */
    promotePawn(square, newType) {
        if (!square || !square.piece) return;
        
        const color = square.piece.color;
        square.piece.type = newType;
        
        // --- OPTIMISATION ARENA ---
        // Si le plateau HTML n'existe pas (Stress Test pur), on ne manipule pas le DOM
        const boardEl = document.getElementById('chessBoard');
        if (!boardEl) {
            if (PromotionManager.consoleLog && !document.getElementById('arena-dashboard')) {
                console.log(`✨ [Promotion Logique] ${newType} en [${square.row},${square.col}]`);
            }
            return;
        }

        // Mise à jour visuelle (pour Humain vs Bot)
        square.element.innerHTML = ''; 
        const executor = this.game.moveExecutor;

        if (executor && typeof executor.createPieceElement === 'function') {
            const newPieceEl = executor.createPieceElement({ type: newType, color: color });
            square.element.appendChild(newPieceEl);
        } else {
            // Fallback utilisant le chemin propre
            const img = document.createElement('img');
            img.src = `${this.getBasePath()}${color[0].toLowerCase()}${this.getPieceLetter(newType)}.png`;
            img.className = 'chess-piece-img';
            square.element.appendChild(img);
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