// validators/promotion-manager.js - Version utilisant la configuration JSON comme priorité
if (typeof PromotionManager !== 'undefined') {
    console.warn('⚠️ PromotionManager existe déjà. Vérifiez les doublons dans les imports.');
} else {

class PromotionManager {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('👑 validators/promotion-manager.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('👑 PromotionManager: Mode silencieux activé (debug désactivé dans config)');
        }
    }
    
    // Méthode pour charger la configuration
    static loadConfig() {
        try {
            if (window.appConfig && window.appConfig.chess_engine) {
                // Configuration prioritaire: window.appConfig
                if (window.appConfig.chess_engine.console_log !== undefined) {
                    this.consoleLog = window.appConfig.chess_engine.console_log;
                }
                
                if (this.consoleLog) {
                    console.log('👑 Configuration chargée depuis window.appConfig');
                }
            } else if (window.chessConfig) {
                // Configuration secondaire: window.chessConfig (pour compatibilité)
                if (window.chessConfig.debug !== undefined) {
                    this.consoleLog = window.chessConfig.debug;
                }
                
                if (this.consoleLog) {
                    console.log('👑 Configuration chargée depuis window.chessConfig (legacy)');
                }
            } else {
                // Fallback: valeurs par défaut
                if (this.consoleLog) {
                    console.log('👑 Configuration: valeurs par défaut utilisées');
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de la configuration:', error);
            // Garder les valeurs par défaut en cas d'erreur
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig && window.appConfig.chess_engine) {
            return 'window.appConfig';
        } else if (window.chessConfig) {
            return 'window.chessConfig (legacy)';
        } else {
            return 'valeur par défaut';
        }
    }

    constructor(game) {
        this.game = game;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 PromotionManager initialisé');
            console.log(`  - Game: ${game ? '✓' : '✗'}`);
            console.log(`  - Configuration: console_log = ${this.constructor.consoleLog}`);
        }
        
        // Historique des promotions pour cette partie
        this.promotionHistory = {
            queen: 0,
            rook: 0,
            bishop: 0,
            knight: 0
        };
    }

    checkPromotion(move, piece) {
        const isPromotion = piece.type === 'pawn' && 
                          ((piece.color === 'white' && move.row === 0) || 
                           (piece.color === 'black' && move.row === 7));
        
        if (this.constructor.consoleLog) {
            console.log(`♟️🔍 Vérification promotion:`);
            console.log(`  - Pièce: ${piece.color} ${piece.type}`);
            console.log(`  - Mouvement vers: [${move.row},${move.col}]`);
            console.log(`  - Rang promotion: ${piece.color === 'white' ? '0 (dernière rangée)' : '7 (dernière rangée)'}`);
            console.log(`  - Condition de promotion: ${isPromotion ? '✓ REMPLIE' : '✗ NON REMPLIE'}`);
            
            if (isPromotion) {
                console.log(`  🎉 PION ARRIVE EN FIN DE PLATEAU!`);
            }
        }
        
        return isPromotion;
    }

    handlePromotion(row, col, color, callback) {
        if (this.constructor.consoleLog) {
            console.log(`\n👑 PROMOTION DEMANDÉE:`);
            console.log(`  - Position: [${row},${col}]`);
            console.log(`  - Couleur: ${color}`);
            console.log(`  - Rang: ${row} (${row === 0 ? 'haut - Blanc' : 'bas - Noir'})`);
            console.log(`  - Historique promotions: Q:${this.promotionHistory.queen} R:${this.promotionHistory.rook} B:${this.promotionHistory.bishop} N:${this.promotionHistory.knight}`);
        }
        
        this.showPromotionModal(color, callback);
    }

    showPromotionModal(color, callback) {
        if (this.constructor.consoleLog) {
            console.log(`🎭 Affichage modal de promotion pour ${color}`);
        }
        
        // Supprimer toute modal existante
        const existingModal = document.querySelector('.promotion-modal');
        if (existingModal) {
            existingModal.remove();
            if (this.constructor.consoleLog) {
                console.log(`  🗑️ Modal existante supprimée`);
            }
        }
        
        const modal = document.createElement('div');
        modal.className = 'promotion-modal';
        
        let selectedPiece = 'queen'; // Sélection par défaut (statistiquement le choix le plus courant)
        
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
                            <span>Dame (97%)</span>
                        </div>
                        <div class="promotion-option ${selectedPiece === 'rook' ? 'selected' : ''}" data-piece="rook" title="Tour - Déplacements horizontaux/verticaux">
                            <div class="chess-piece ${color}">
                                <img src="img/chesspieces/wikipedia/${color === 'white' ? 'w' : 'b'}R.png" alt="Tour" class="chess-piece-img">
                            </div>
                            <span>Tour (1.5%)</span>
                        </div>
                        <div class="promotion-option ${selectedPiece === 'bishop' ? 'selected' : ''}" data-piece="bishop" title="Fou - Déplacements diagonaux">
                            <div class="chess-piece ${color}">
                                <img src="img/chesspieces/wikipedia/${color === 'white' ? 'w' : 'b'}B.png" alt="Fou" class="chess-piece-img">
                            </div>
                            <span>Fou (1%)</span>
                        </div>
                        <div class="promotion-option ${selectedPiece === 'knight' ? 'selected' : ''}" data-piece="knight" title="Cavalier - Déplacements en L">
                            <div class="chess-piece ${color}">
                                <img src="img/chesspieces/wikipedia/${color === 'white' ? 'w' : 'b'}N.png" alt="Cavalier" class="chess-piece-img">
                            </div>
                            <span>Cavalier (0.5%)</span>
                        </div>
                    </div>
                    
                    <div class="promotion-info mt-2">
                        <small class="text-muted">
                            <i class="bi bi-info-circle"></i> 
                            Statistiques de choix en parties classiques
                        </small>
                    </div>
                    
                    <div class="promotion-actions mt-3">
                        <button class="btn btn-success" id="promotionConfirm">
                            <i class="bi bi-check-circle me-1"></i>Valider la sélection (${selectedPiece})
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        if (this.constructor.consoleLog) {
            console.log(`  ✅ Modal créée et ajoutée au DOM`);
            console.log(`  - Couleur: ${color}`);
            console.log(`  - Sélection par défaut: ${selectedPiece} (recommandé)`);
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
                
                // Mettre à jour le texte du bouton
                const confirmBtn = modal.querySelector('#promotionConfirm');
                confirmBtn.innerHTML = `<i class="bi bi-check-circle me-1"></i>Valider la sélection (${selectedPiece})`;
                
                if (this.constructor.consoleLog) {
                    console.log(`  🎯 Pièce sélectionnée: ${selectedPiece}`);
                }
            });
        });
        
        // Bouton Valider
        modal.querySelector('#promotionConfirm').addEventListener('click', () => {
            if (this.constructor.consoleLog) {
                console.log(`  ✅ Validation promotion: ${selectedPiece}`);
                this.logPromotionStats(selectedPiece);
            }
            
            // Mettre à jour l'historique
            this.promotionHistory[selectedPiece]++;
            
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
        
        // Focus automatique sur la modal pour l'accessibilité
        modal.focus();
        
        if (this.constructor.consoleLog) {
            console.log(`  🎭 Modal prête - attente sélection utilisateur`);
        }
        
        return modal;
    }

    logPromotionStats(selectedPiece) {
        if (!this.constructor.consoleLog) return;
        
        const stats = {
            'queen': '👑 Dame (97% des cas) - Pièce la plus puissante, choix recommandé',
            'rook': '🏰 Tour (1.5% des cas) - Utile pour les finales avec pions',
            'bishop': '🗂️ Fou (1% des cas) - Pour éviter le pat ou positions spécifiques',
            'knight': '🐴 Cavalier (0.5% des cas) - Pour donner échec ou éviter pat'
        };
        
        console.log(`📊 STATISTIQUES PROMOTION:`);
        console.log(`  Choix utilisateur: ${selectedPiece}`);
        console.log(`  Recommandation: ${stats[selectedPiece] || 'Choix non standard'}`);
        console.log(`  Historique cette partie:`);
        Object.entries(this.promotionHistory).forEach(([piece, count]) => {
            const icon = piece === 'queen' ? '👑' : 
                        piece === 'rook' ? '🏰' : 
                        piece === 'bishop' ? '🗂️' : '🐴';
            console.log(`    ${icon} ${piece}: ${count} fois`);
        });
        
        // Conseil tactique
        if (selectedPiece !== 'queen') {
            console.log(`  💡 Conseil: La Dame est presque toujours le meilleur choix`);
            console.log(`  💡 Exception: Choisir une autre pièce peut éviter le pat`);
        }
    }

    autoPromote(color, preferredPiece = 'queen') {
        if (this.constructor.consoleLog) {
            console.log(`🤖 PROMOTION AUTOMATIQUE: ${color} → ${preferredPiece}`);
        }
        
        const validPieces = ['queen', 'rook', 'bishop', 'knight'];
        const piece = validPieces.includes(preferredPiece) ? preferredPiece : 'queen';
        
        // Mettre à jour l'historique
        this.promotionHistory[piece]++;
        
        if (this.constructor.consoleLog) {
            console.log(`  Pièce choisie: ${piece}`);
            console.log(`  Historique mis à jour: Q:${this.promotionHistory.queen} R:${this.promotionHistory.rook} B:${this.promotionHistory.bishop} N:${this.promotionHistory.knight}`);
        }
        
        return piece;
    }

    // NOUVELLE MÉTHODE : Obtenir un résumé des promotions
    getPromotionSummary() {
        const total = Object.values(this.promotionHistory).reduce((a, b) => a + b, 0);
        
        if (this.constructor.consoleLog) {
            console.log(`\n📈 RÉSUMÉ PROMOTIONS:`);
            console.log(`  Total promotions: ${total}`);
            
            if (total > 0) {
                console.log(`  Répartition:`);
                Object.entries(this.promotionHistory).forEach(([piece, count]) => {
                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                    const icon = piece === 'queen' ? '👑' : 
                                piece === 'rook' ? '🏰' : 
                                piece === 'bishop' ? '🗂️' : '🐴';
                    console.log(`    ${icon} ${piece}: ${count} (${percentage}%)`);
                });
            }
        }
        
        return {
            total: total,
            history: {...this.promotionHistory}
        };
    }

    // NOUVELLE MÉTHODE : Réinitialiser l'historique
    resetHistory() {
        if (this.constructor.consoleLog) {
            console.log(`🔄 Réinitialisation historique promotions`);
        }
        
        this.promotionHistory = {
            queen: 0,
            rook: 0,
            bishop: 0,
            knight: 0
        };
        
        if (this.constructor.consoleLog) {
            console.log(`✅ Historique réinitialisé`);
        }
    }
}

// Initialisation statique
PromotionManager.init();

window.PromotionManager = PromotionManager;

} // Fin du if de protection