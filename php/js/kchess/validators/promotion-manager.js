/**
 * Gère l'interface et la logique de promotion des pions.
 * Version 1.5.1 - Fix Libération Verrou MoveHandler
 */
class PromotionManager {
    static consoleLog = true;

    constructor(game) {
        this.game = game;
        this.promotionHistory = { queen: 0, rook: 0, bishop: 0, knight: 0 };
    }

    /**
     * Affiche la modal de promotion et gère la finalisation du coup.
     * @param {Function} callback - Optionnel: callback passé par MoveExecutor
     */
    showPromotionModal(row, col, color, callback = null) {
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

        const handleChoice = (selectedPiece) => {
            modal.remove();
            
            // --- CRUCIAL : On libère le verrou du MoveHandler immédiatement ---
            if (this.game.moveHandler) {
                this.game.moveHandler.isPromoting = false;
                if (PromotionManager.consoleLog) console.log("🔓 Verrou promotion libéré.");
            }
            
            if (selectedPiece) {
                // 1. TRANSFORMATION PHYSIQUE ET LOGIQUE
                const square = this.game.board.getSquare(row, col);
                this.promotePawn(square, selectedPiece);
                this.promotionHistory[selectedPiece]++;

                // 2. EXÉCUTION DU CALLBACK (si MoveExecutor en attend un)
                if (typeof callback === 'function') {
                    callback(selectedPiece);
                } else {
                    // Sinon, gestion manuelle de la fin de tour
                    if (this.game.gameState) this.game.gameState.switchPlayer();
                    this.game.updateUI();
                    if (this.game.checkBotTurn) this.game.checkBotTurn();
                }
            } else {
                // Gestion de l'annulation (Echap)
                if (typeof callback === 'function') callback(null);
                console.warn("Promotion annulée.");
            }
        };

        modal.querySelectorAll('.promotion-option').forEach(opt => {
            opt.onclick = () => handleChoice(opt.dataset.piece);
        });

        const handleEsc = (e) => { 
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleEsc);
                handleChoice(null);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    promotePawn(square, newType) {
        if (!square || !square.piece) return;
        
        const color = square.piece.color;
        
        // 1. Mise à jour Logique (Objet Piece)
        square.piece.type = newType;
        
        // 2. Mise à jour Visuelle (DOM)
        square.element.innerHTML = ''; 

        // On utilise MoveExecutor pour recréer l'élément proprement
        if (this.game.moveExecutor && typeof this.game.moveExecutor.createPieceElement === 'function') {
            const newPieceEl = this.game.moveExecutor.createPieceElement({
                type: newType,
                color: color
            });
            square.element.appendChild(newPieceEl);
        } else {
            // Fallback si MoveExecutor non dispo
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
        return { queen: 'Q', rook: 'R', bishop: 'B', knight: 'N' }[type] || 'Q';
    }

    getPieceNameFr(type) {
        return { queen: 'Dame', rook: 'Tour', bishop: 'Fou', knight: 'Cavalier' }[type] || type;
    }
}

window.PromotionManager = PromotionManager;