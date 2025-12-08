// ui/chess-game-ui-modals.js - Gestion des modals et confirmations
class ChessModalManager {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('ui/chess-game-ui-modals.js loaded');
        }
    }

    constructor(ui) {
        this.ui = ui;
        
        if (this.constructor.consoleLog) {
            console.log('🎭 [ModalManager] Gestionnaire de modals initialisé');
            console.log('🎭 [ModalManager] UI parent:', ui);
        }
    }

    confirmNewGame() {
        if (this.constructor.consoleLog) {
            console.log('\n🔄 [ModalManager] === DEMANDE NOUVELLE PARTIE ===');
            console.log('🔄 [ModalManager] Ouverture de la confirmation de nouvelle partie...');
        }
        
        // Arrêter le timer
        if (this.constructor.consoleLog) {
            console.log('⏱️ [ModalManager] Arrêt du timer...');
        }
        
        this.ui.timerManager.stopTimer();
        
        // Essayer de créer une modal custom
        if (this.constructor.consoleLog) {
            console.log('🎭 [ModalManager] Tentative de création de modal custom...');
        }
        
        if (this.createConfirmationModal()) {
            if (this.constructor.consoleLog) {
                console.log('✅ [ModalManager] Modal custom créée avec succès');
            }
            return true;
        }
        
        // Fallback vers alert() natif
        if (this.constructor.consoleLog) {
            console.log('⚠️ [ModalManager] Fallback vers confirm() natif');
        }
        
        const isConfirmed = confirm('Êtes-vous sûr de vouloir commencer une nouvelle partie ?\n\nLa partie en cours sera perdue.');
        
        if (isConfirmed) {
            if (this.constructor.consoleLog) {
                console.log('✅ [ModalManager] Confirmation acceptée via confirm()');
            }
            this.executeNewGame();
            return true;
        } else {
            if (this.constructor.consoleLog) {
                console.log('❌ [ModalManager] Confirmation annulée via confirm()');
                console.log('⏱️ [ModalManager] Reprise du timer...');
            }
            
            this.ui.timerManager.resumeTimer();
            return false;
        }
    }

    createConfirmationModal() {
        // Vérifier si la modal existe déjà
        if (document.getElementById('chessConfirmationModal')) {
            if (this.constructor.consoleLog) {
                console.log('🎭 [ModalManager] Modal existe déjà');
            }
            return true;
        }
        
        if (this.constructor.consoleLog) {
            console.log('🎭 [ModalManager] Création de la modal de confirmation...');
        }
        
        try {
            // Créer l'élément modal
            const modal = document.createElement('div');
            modal.id = 'chessConfirmationModal';
            
            // Styles de la modal
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
                animation: modalFadeIn 0.3s ease;
            `;
            
            // Contenu HTML de la modal
            modal.innerHTML = `
                <div class="modal-content" style="
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    animation: modalSlideIn 0.3s ease;
                ">
                    <h3 style="margin: 0 0 15px 0; color: #333;">Nouvelle partie</h3>
                    <p style="margin: 0 0 25px 0; color: #666; line-height: 1.5;">
                        Êtes-vous sûr de vouloir commencer une nouvelle partie ?<br>
                        <strong>La partie en cours sera perdue.</strong>
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="confirmNewGame" class="modal-btn confirm-btn" style="
                            padding: 12px 25px;
                            background: #dc3545;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                            transition: background 0.3s;
                        ">Nouvelle Partie</button>
                        <button id="cancelNewGame" class="modal-btn cancel-btn" style="
                            padding: 12px 25px;
                            background: #6c757d;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            transition: background 0.3s;
                        ">Annuler</button>
                    </div>
                </div>
            `;
            
            // Ajouter les styles d'animation
            if (!document.querySelector('#modal-animation-styles')) {
                const style = document.createElement('style');
                style.id = 'modal-animation-styles';
                style.textContent = `
                    @keyframes modalFadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes modalSlideIn {
                        from { 
                            transform: translateY(-20px); 
                            opacity: 0; 
                        }
                        to { 
                            transform: translateY(0); 
                            opacity: 1; 
                        }
                    }
                    .modal-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    }
                    .confirm-btn:hover {
                        background: #c82333 !important;
                    }
                    .cancel-btn:hover {
                        background: #5a6268 !important;
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Ajouter la modal au DOM
            document.body.appendChild(modal);
            
            if (this.constructor.consoleLog) {
                console.log('✅ [ModalManager] Modal créée et ajoutée au DOM');
            }
            
            // Configuration des événements
            this.setupModalEvents();
            
            return true;
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [ModalManager] Erreur création modal: ${error.message}`);
                console.error('Modal creation error:', error);
            }
            return false;
        }
    }

    setupModalEvents() {
        if (this.constructor.consoleLog) {
            console.log('🎭 [ModalManager] Configuration des événements de la modal...');
        }
        
        // Bouton Confirmer
        document.getElementById('confirmNewGame').addEventListener('click', () => {
            if (this.constructor.consoleLog) {
                console.log('✅ [ModalManager] Bouton confirmation cliqué');
            }
            this.removeConfirmationModal();
            this.executeNewGame();
        });
        
        // Bouton Annuler
        document.getElementById('cancelNewGame').addEventListener('click', () => {
            if (this.constructor.consoleLog) {
                console.log('❌ [ModalManager] Bouton annulation cliqué');
            }
            this.removeConfirmationModal();
            
            if (this.constructor.consoleLog) {
                console.log('⏱️ [ModalManager] Reprise du timer...');
            }
            
            this.ui.timerManager.resumeTimer();
        });
        
        // Fermeture en cliquant sur le fond
        const modal = document.getElementById('chessConfirmationModal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (this.constructor.consoleLog) {
                    console.log('❌ [ModalManager] Fermeture par clic sur fond');
                }
                
                this.removeConfirmationModal();
                
                if (this.constructor.consoleLog) {
                    console.log('⏱️ [ModalManager] Reprise du timer...');
                }
                
                this.ui.timerManager.resumeTimer();
            }
        });
        
        // Fermeture avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('chessConfirmationModal')) {
                if (this.constructor.consoleLog) {
                    console.log('❌ [ModalManager] Fermeture avec touche Échap');
                }
                
                this.removeConfirmationModal();
                
                if (this.constructor.consoleLog) {
                    console.log('⏱️ [ModalManager] Reprise du timer...');
                }
                
                this.ui.timerManager.resumeTimer();
            }
        });
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ModalManager] Événements configurés');
        }
    }

    removeConfirmationModal() {
        const modal = document.getElementById('chessConfirmationModal');
        if (modal) {
            if (this.constructor.consoleLog) {
                console.log('🎭 [ModalManager] Suppression de la modal...');
            }
            
            // Animation de fermeture
            modal.style.animation = 'modalFadeOut 0.3s ease';
            const content = modal.querySelector('.modal-content');
            if (content) {
                content.style.animation = 'modalSlideOut 0.3s ease';
            }
            
            // Ajouter l'animation de fermeture si elle n'existe pas
            if (!document.querySelector('#modal-animation-out-styles')) {
                const style = document.createElement('style');
                style.id = 'modal-animation-out-styles';
                style.textContent = `
                    @keyframes modalFadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                    @keyframes modalSlideOut {
                        from { 
                            transform: translateY(0); 
                            opacity: 1; 
                        }
                        to { 
                            transform: translateY(-20px); 
                            opacity: 0; 
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Supprimer après l'animation
            setTimeout(() => {
                modal.remove();
                
                // Nettoyer les styles si plus de modal
                if (!document.getElementById('chessConfirmationModal')) {
                    const outStyle = document.querySelector('#modal-animation-out-styles');
                    if (outStyle) outStyle.remove();
                }
                
                if (this.constructor.consoleLog) {
                    console.log('✅ [ModalManager] Modal supprimée');
                }
            }, 300);
        } else {
            if (this.constructor.consoleLog) {
                console.log('ℹ️ [ModalManager] Aucune modal à supprimer');
            }
        }
    }

    executeNewGame() {
        if (this.constructor.consoleLog) {
            console.log('\n🎮 [ModalManager] === EXÉCUTION NOUVELLE PARTIE ===');
            console.log('🎮 [ModalManager] Lancement d\'une nouvelle partie...');
        }
        
        // Arrêter définitivement le timer
        this.ui.timerManager.stopTimer();
        
        // Redirection vers la page de démarrage
        setTimeout(() => {
            if (this.constructor.consoleLog) {
                console.log('🔄 [ModalManager] Redirection vers index.php...');
            }
            
            window.location.href = 'index.php';
        }, 500);
        
        if (this.constructor.consoleLog) {
            console.log('✅ [ModalManager] === NOUVELLE PARTIE INITIÉE ===\n');
        }
    }
    
    // NOUVELLE MÉTHODE : Vérifier si une modal est ouverte
    isModalOpen() {
        const isOpen = !!document.getElementById('chessConfirmationModal');
        
        if (this.constructor.consoleLog) {
            console.log(`🔍 [ModalManager] Modal ouverte? ${isOpen ? '✅ OUI' : '❌ NON'}`);
        }
        
        return isOpen;
    }
    
    // NOUVELLE MÉTHODE : Fermer toutes les modals
    closeAllModals() {
        const modal = document.getElementById('chessConfirmationModal');
        if (modal) {
            if (this.constructor.consoleLog) {
                console.log('🎭 [ModalManager] Fermeture de toutes les modals...');
            }
            
            this.removeConfirmationModal();
            return true;
        }
        
        return false;
    }
}

// Initialisation statique
ChessModalManager.init();