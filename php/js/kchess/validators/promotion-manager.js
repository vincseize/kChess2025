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
        if (oldModal) oldModal.remove();

        const basePath = this.getBasePath();
        const modal = document.createElement('div');
        modal.className = 'promotion-modal';
        modal.innerHTML = `
            <div class="promotion-overlay">
                <div class="promotion-content">
                    <div class="promotion-header"><h4><i class="bi bi-stars"></i> Promotion</h4></div>
                    <div class="promotion-options">
                        ${['queen', 'rook', 'bishop', 'knight'].map(p => `
                            <div class="promotion-option" data-piece="${p}">
                                <img src="${basePath}${color[0].toLowerCase()}${this.getPieceLetter(p)}.png" alt="${p}">
                                <span>${this.getPieceNameFr(p)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('.promotion-option').forEach(opt => {
            opt.onclick = () => {
                modal.remove();
                this.handleChoice(opt.dataset.piece, row, col, callback);
            };
        });

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