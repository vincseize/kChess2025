// validators/promotion-manager.js - Gestion de la promotion des pions
class PromotionManager {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('validators/promotion-manager.js loaded');
        }
    }

    constructor(game) {
        this.game = game;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 PromotionManager initialisé');
            console.log(`  - Game: ${game ? '✓' : '✗'}`);
        }
    }

    checkPromotion(move, piece) {
        const isPromotion = piece.type === 'pawn' && 
                          ((piece.color === 'white' && move.row === 0) || 
                           (piece.color === 'black' && move.row === 7));
        
        if (this.constructor.consoleLog) {
            console.log(`♟️🔍 Vérification promotion:`);
            console.log(`  - Pièce: ${piece.color} ${piece.type}`);
            console.log(`  - Mouvement vers: [${move.row},${move.col}]`);
            console.log(`  - Rang promotion: ${piece.color === 'white' ? '0 (haut)' : '7 (bas)'}`);
            console.log(`  - Promotion nécessaire: ${isPromotion ? '✓ OUI' : '✗ NON'}`);
        }
        
        return isPromotion;
    }

    handlePromotion(row, col, color, callback) {
        if (this.constructor.consoleLog) {
            console.log(`\n👑 PROMOTION DEMANDÉE:`);
            console.log(`  - Position: [${row},${col}]`);
            console.log(`  - Couleur: ${color}`);
            console.log(`  - Rang: ${row} (${row === 0 ? 'haut' : 'bas'})`);
        }
        
        this.showPromotionModal(color, callback);
    }

    showPromotionModal(color, callback) {
        if (this.constructor.consoleLog) {
            console.log(`🎭 Affichage modal de promotion pour ${color}`);
        }
        
        const modal = document.createElement('div');
        modal.className = 'promotion-modal';
        
        let selectedPiece = 'queen'; // Sélection par défaut
        
        modal.innerHTML = `
            <div class="promotion-overlay">
                <div class="promotion-content">
                    <h4><i class="bi bi-arrow-up-circle"></i> Promotion du Pion</h4>
                    <p>Choisissez une pièce pour promouvoir votre pion</p>
                    
                    <div class="promotion-options">
                        <div class="promotion-option ${selectedPiece === 'queen' ? 'selected' : ''}" data-piece="queen" title="Dame - Pièce la plus puissante">
                            <div class="chess-piece ${color}">
                                <img src="img/chesspieces/wikipedia/${color === 'white' ? 'w' : 'b'}Q.png" alt="Dame" class="chess-piece-img">
                            </div>
                            <span>Dame</span>
                        </div>
                        <div class="promotion-option ${selectedPiece === 'rook' ? 'selected' : ''}" data-piece="rook" title="Tour - Déplacements horizontaux/verticaux">
                            <div class="chess-piece ${color}">
                                <img src="img/chesspieces/wikipedia/${color === 'white' ? 'w' : 'b'}R.png" alt="Tour" class="chess-piece-img">
                            </div>
                            <span>Tour</span>
                        </div>
                        <div class="promotion-option ${selectedPiece === 'bishop' ? 'selected' : ''}" data-piece="bishop" title="Fou - Déplacements diagonaux">
                            <div class="chess-piece ${color}">
                                <img src="img/chesspieces/wikipedia/${color === 'white' ? 'w' : 'b'}B.png" alt="Fou" class="chess-piece-img">
                            </div>
                            <span>Fou</span>
                        </div>
                        <div class="promotion-option ${selectedPiece === 'knight' ? 'selected' : ''}" data-piece="knight" title="Cavalier - Déplacements en L">
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
        
        if (this.constructor.consoleLog) {
            console.log(`  ✅ Modal créé et ajouté au DOM`);
            console.log(`  - Couleur: ${color}`);
            console.log(`  - Sélection par défaut: ${selectedPiece}`);
        }
        
        // Gestion de la sélection des pièces
        const options = modal.querySelectorAll('.promotion-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                // Retirer la sélection précédente
                options.forEach(opt => opt.classList.remove('selected'));
                // Ajouter la sélection
                option.classList.add('selected');
                selectedPiece = option.dataset.piece;
                
                if (this.constructor.consoleLog) {
                    console.log(`  🎯 Pièce sélectionnée: ${selectedPiece}`);
                }
            });
        });
        
        // Bouton Valider
        modal.querySelector('#promotionConfirm').addEventListener('click', () => {
            if (this.constructor.consoleLog) {
                console.log(`  ✅ Validation promotion: ${selectedPiece}`);
            }
            
            modal.remove();
            callback(selectedPiece);
        });
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (this.constructor.consoleLog) {
                    console.log(`  ❌ Promotion annulée (clic extérieur)`);
                }
                
                modal.remove();
                callback(null);
            }
        });
        
        // Empêcher la fermeture en cliquant à l'intérieur
        modal.querySelector('.promotion-overlay').addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Gestion touche Échap
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (this.constructor.consoleLog) {
                    console.log(`  ❌ Promotion annulée (touche Échap)`);
                }
                
                modal.remove();
                callback(null);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        
        // Nettoyage lors de la fermeture
        const originalCallback = callback;
        callback = (result) => {
            document.removeEventListener('keydown', handleEscape);
            originalCallback(result);
        };
        
        if (this.constructor.consoleLog) {
            console.log(`  🎭 Modal prêt - attente sélection utilisateur`);
        }
    }

    // NOUVELLE MÉTHODE : Log des statistiques de promotion
    logPromotionStats(selectedPiece) {
        if (!this.constructor.consoleLog) return;
        
        const stats = {
            'queen': '👑 Dame (97% des cas) - Pièce la plus puissante',
            'rook': '🏰 Tour (1.5% des cas) - Utile pour les finales',
            'bishop': '🗂️ Fou (1% des cas) - Pour positions spécifiques',
            'knight': '🐴 Cavalier (0.5% des cas) - Pour échec ou pat'
        };
        
        console.log(`📊 STATISTIQUES PROMOTION:`);
        console.log(`  Choix utilisateur: ${selectedPiece}`);
        console.log(`  Recommandation: ${stats[selectedPiece] || 'Choix non standard'}`);
        
        // Log des choix historiques (si disponibles)
        if (this.game.gameState?.promotionHistory) {
            const history = this.game.gameState.promotionHistory;
            console.log(`  Historique cette partie:`);
            Object.entries(history).forEach(([piece, count]) => {
                console.log(`    - ${piece}: ${count} fois`);
            });
        }
    }

    // NOUVELLE MÉTHODE : Gestion automatique (pour tests/bot)
    autoPromote(color, preferredPiece = 'queen') {
        if (this.constructor.consoleLog) {
            console.log(`🤖 PROMOTION AUTOMATIQUE: ${color} → ${preferredPiece}`);
        }
        
        const validPieces = ['queen', 'rook', 'bishop', 'knight'];
        const piece = validPieces.includes(preferredPiece) ? preferredPiece : 'queen';
        
        if (this.constructor.consoleLog) {
            console.log(`  Pièce choisie: ${piece}`);
        }
        
        return piece;
    }
}

// Initialisation statique
PromotionManager.init();

window.PromotionManager = PromotionManager;