// ui/chess-game-ui-modals.js - Version utilisant la configuration JSON comme priorité
class ChessModalManager {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('🎭 ui/chess-game-ui-modals.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('🎭 ChessModalManager: Mode silencieux activé (debug désactivé dans config)');
        }
    }
    
    // Méthode pour charger la configuration
    static loadConfig() {
        try {
            // Vérifier si la configuration globale existe
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                
                // CONVERSION CORRECTE - Gérer les string "false" et "true"
                if (configValue === "false") {
                    this.consoleLog = false;
                    if (configValue !== "false") {
                        console.info('🔧 ChessModalManager: console_log désactivé via config JSON');
                    }
                } else if (configValue === false) {
                    this.consoleLog = false;
                } else if (configValue === "true") {
                    this.consoleLog = true;
                } else if (configValue === true) {
                    this.consoleLog = true;
                } else {
                    // Pour toute autre valeur, utiliser Boolean()
                    this.consoleLog = Boolean(configValue);
                }
                
                // Log de confirmation (uniquement en mode debug)
                if (this.consoleLog) {
                    console.log(`⚙️ ChessModalManager: Configuration chargée - console_log = ${this.consoleLog} (valeur brute: "${configValue}")`);
                }
                return true;
            }
            
            // Si window.appConfig n'existe pas, essayer de le charger via fonction utilitaire
            if (typeof window.getConfig === 'function') {
                const configValue = window.getConfig('debug.console_log', 'true');
                
                if (configValue === "false") {
                    this.consoleLog = false;
                } else if (configValue === false) {
                    this.consoleLog = false;
                } else {
                    this.consoleLog = Boolean(configValue);
                }
                return true;
            }
            
            // Si rien n'est disponible, garder la valeur par défaut
            if (this.consoleLog) {
                console.warn('⚠️ ChessModalManager: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessModalManager: Erreur lors du chargement de la config:', error);
            return false;
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig) {
            return 'JSON config';
        } else if (typeof window.getConfig === 'function') {
            return 'fonction getConfig';
        } else {
            return 'valeur par défaut';
        }
    }
    
    // Méthode pour vérifier si on est en mode debug
    static isDebugMode() {
        return this.consoleLog;
    }

    constructor(ui) {
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        this.ui = ui;
        
        if (this.constructor.consoleLog) {
            console.log('🎭 [ModalManager] Gestionnaire de modals initialisé');
            console.log('🎭 [ModalManager] UI parent:', ui);
        }
    }

    confirmNewGame() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            // Arrêter le timer
            this.ui.timerManager?.stopTimer?.();
            
            // Essayer de créer une modal custom
            if (this.createConfirmationModal()) {
                return true;
            }
            
            // Fallback vers alert() natif
            const isConfirmed = confirm('Êtes-vous sûr de vouloir commencer une nouvelle partie ?\n\nLa partie en cours sera perdue.');
            
            if (isConfirmed) {
                this.executeNewGame();
                return true;
            } else {
                this.ui.timerManager?.resumeTimer?.();
                return false;
            }
        }
        
        // Mode debug
        console.log('\n🔄 [ModalManager] === DEMANDE NOUVELLE PARTIE ===');
        console.log('🔄 [ModalManager] Ouverture de la confirmation de nouvelle partie...');
        
        // Arrêter le timer
        console.log('⏱️ [ModalManager] Arrêt du timer...');
        this.ui.timerManager?.stopTimer?.();
        
        // Essayer de créer une modal custom
        console.log('🎭 [ModalManager] Tentative de création de modal custom...');
        
        if (this.createConfirmationModal()) {
            console.log('✅ [ModalManager] Modal custom créée avec succès');
            return true;
        }
        
        // Fallback vers alert() natif
        console.log('⚠️ [ModalManager] Fallback vers confirm() natif');
        
        const isConfirmed = confirm('Êtes-vous sûr de vouloir commencer une nouvelle partie ?\n\nLa partie en cours sera perdue.');
        
        if (isConfirmed) {
            console.log('✅ [ModalManager] Confirmation acceptée via confirm()');
            this.executeNewGame();
            return true;
        } else {
            console.log('❌ [ModalManager] Confirmation annulée via confirm()');
            console.log('⏱️ [ModalManager] Reprise du timer...');
            
            this.ui.timerManager?.resumeTimer?.();
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
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            // Bouton Confirmer
            const confirmBtn = document.getElementById('confirmNewGame');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    this.removeConfirmationModal();
                    this.executeNewGame();
                });
            }
            
            // Bouton Annuler
            const cancelBtn = document.getElementById('cancelNewGame');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.removeConfirmationModal();
                    this.ui.timerManager?.resumeTimer?.();
                });
            }
            
            // Fermeture en cliquant sur le fond
            const modal = document.getElementById('chessConfirmationModal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.removeConfirmationModal();
                        this.ui.timerManager?.resumeTimer?.();
                    }
                });
            }
            
            // Fermeture avec Échap
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && document.getElementById('chessConfirmationModal')) {
                    this.removeConfirmationModal();
                    this.ui.timerManager?.resumeTimer?.();
                }
            });
            return;
        }
        
        // Mode debug
        console.log('🎭 [ModalManager] Configuration des événements de la modal...');
        
        // Bouton Confirmer
        document.getElementById('confirmNewGame')?.addEventListener('click', () => {
            console.log('✅ [ModalManager] Bouton confirmation cliqué');
            this.removeConfirmationModal();
            this.executeNewGame();
        });
        
        // Bouton Annuler
        document.getElementById('cancelNewGame')?.addEventListener('click', () => {
            console.log('❌ [ModalManager] Bouton annulation cliqué');
            this.removeConfirmationModal();
            console.log('⏱️ [ModalManager] Reprise du timer...');
            this.ui.timerManager?.resumeTimer?.();
        });
        
        // Fermeture en cliquant sur le fond
        const modal = document.getElementById('chessConfirmationModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    console.log('❌ [ModalManager] Fermeture par clic sur fond');
                    this.removeConfirmationModal();
                    console.log('⏱️ [ModalManager] Reprise du timer...');
                    this.ui.timerManager?.resumeTimer?.();
                }
            });
        }
        
        // Fermeture avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('chessConfirmationModal')) {
                console.log('❌ [ModalManager] Fermeture avec touche Échap');
                this.removeConfirmationModal();
                console.log('⏱️ [ModalManager] Reprise du timer...');
                this.ui.timerManager?.resumeTimer?.();
            }
        });
        
        console.log('✅ [ModalManager] Événements configurés');
    }

    removeConfirmationModal() {
        const modal = document.getElementById('chessConfirmationModal');
        if (!modal) {
            if (this.constructor.consoleLog) {
                console.log('ℹ️ [ModalManager] Aucune modal à supprimer');
            }
            return;
        }
        
        // Mode silencieux
        if (!this.constructor.consoleLog) {
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
            }, 300);
            return;
        }
        
        // Mode debug
        console.log('🎭 [ModalManager] Suppression de la modal...');
        
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
            
            console.log('✅ [ModalManager] Modal supprimée');
        }, 300);
    }

    executeNewGame() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            // Arrêter définitivement le timer
            this.ui.timerManager?.stopTimer?.();
            
            // Redirection vers la page de démarrage
            setTimeout(() => {
                window.location.href = 'index.php';
            }, 500);
            return;
        }
        
        // Mode debug
        console.log('\n🎮 [ModalManager] === EXÉCUTION NOUVELLE PARTIE ===');
        console.log('🎮 [ModalManager] Lancement d\'une nouvelle partie...');
        
        // Arrêter définitivement le timer
        this.ui.timerManager?.stopTimer?.();
        
        // Redirection vers la page de démarrage
        setTimeout(() => {
            console.log('🔄 [ModalManager] Redirection vers index.php...');
            window.location.href = 'index.php';
        }, 500);
        
        console.log('✅ [ModalManager] === NOUVELLE PARTIE INITIÉE ===\n');
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
            // Mode silencieux
            if (!this.constructor.consoleLog) {
                this.removeConfirmationModal();
                return true;
            }
            
            // Mode debug
            console.log('🎭 [ModalManager] Fermeture de toutes les modals...');
            this.removeConfirmationModal();
            return true;
        }
        
        return false;
    }
    
    // NOUVELLE MÉTHODE : Tester la création et gestion des modals
    testModalSystem() {
        // Mode silencieux - retourner un statut simple
        if (!this.constructor.consoleLog) {
            return {
                modalCreation: false,
                eventsSetup: false,
                canCreateModal: false
            };
        }
        
        // Mode debug
        console.group('🧪 [ModalManager] Test du système de modals');
        
        const testResults = {
            modalCreation: false,
            eventsSetup: false,
            canCreateModal: false,
            animationStyles: false,
            domManipulation: false
        };
        
        try {
            // Test de création de modal
            testResults.canCreateModal = this.createConfirmationModal();
            console.log(`✅ Modal création: ${testResults.canCreateModal ? 'SUCCÈS' : 'ÉCHEC'}`);
            
            // Vérifier si la modal a été créée
            testResults.modalCreation = !!document.getElementById('chessConfirmationModal');
            console.log(`✅ Modal présente dans DOM: ${testResults.modalCreation ? 'OUI' : 'NON'}`);
            
            // Vérifier les événements
            const confirmBtn = document.getElementById('confirmNewGame');
            const cancelBtn = document.getElementById('cancelNewGame');
            testResults.eventsSetup = !!(confirmBtn && cancelBtn);
            console.log(`✅ Boutons configurés: ${testResults.eventsSetup ? 'OUI' : 'NON'}`);
            
            // Vérifier les styles d'animation
            testResults.animationStyles = !!document.querySelector('#modal-animation-styles');
            console.log(`✅ Styles animation: ${testResults.animationStyles ? 'PRÉSENTS' : 'ABSENTS'}`);
            
            // Nettoyer après le test
            if (testResults.modalCreation) {
                this.removeConfirmationModal();
                console.log('✅ Modal nettoyée après test');
            }
            
            testResults.domManipulation = true;
            
        } catch (error) {
            console.log(`❌ Erreur test modals: ${error.message}`);
            testResults.error = error.message;
        }
        
        console.log('📊 Résultats du test:', testResults);
        console.groupEnd();
        
        return testResults;
    }
}

// Initialisation statique
ChessModalManager.init();

// Exposer la classe globalement
window.ChessModalManager = ChessModalManager;

// Ajouter des fonctions utilitaires globales
window.ModalManagerUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => ChessModalManager.reloadConfig(),
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: ChessModalManager.consoleLog,
        source: ChessModalManager.getConfigSource(),
        debugMode: ChessModalManager.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Activer/désactiver manuellement (temporaire)
    setConsoleLog: (value) => {
        const oldValue = ChessModalManager.consoleLog;
        ChessModalManager.consoleLog = Boolean(value);
        console.log(`🔧 ChessModalManager: consoleLog changé manuellement: ${oldValue} → ${ChessModalManager.consoleLog}`);
        return ChessModalManager.consoleLog;
    },
    
    // Tester la création d'un ModalManager
    testModalManager: (ui) => {
        console.group('🧪 Test ChessModalManager');
        const modalManager = new ChessModalManager(ui);
        console.log('ModalManager créé:', modalManager);
        console.log('Statut config:', ChessModalManager.getConfigStatus());
        console.groupEnd();
        return modalManager;
    },
    
    // Tester la fonction de confirmation
    testConfirmation: (modalManager) => {
        console.group('🧪 Test Confirmation Modal');
        if (!modalManager || !modalManager.confirmNewGame) {
            console.log('❌ ModalManager ou méthode confirmNewGame non disponible');
            console.groupEnd();
            return false;
        }
        
        console.log('Démarrage test confirmation...');
        // Note: Cette fonction ouvre réellement la modal
        const result = modalManager.confirmNewGame();
        console.log('Résultat test confirmation:', result);
        console.groupEnd();
        return result;
    },
    
    // Fermer toutes les modals
    closeModals: () => {
        const modal = document.getElementById('chessConfirmationModal');
        if (modal) {
            modal.remove();
            console.log('✅ Modal fermée manuellement');
            return true;
        }
        console.log('ℹ️ Aucune modal à fermer');
        return false;
    }
};

// Méthode statique pour obtenir le statut de la configuration
ChessModalManager.getConfigStatus = function() {
    return {
        consoleLog: this.consoleLog,
        source: this.getConfigSource(),
        debugMode: this.isDebugMode(),
        appConfigAvailable: !!window.appConfig,
        configValue: window.appConfig?.debug?.console_log
    };
};

// Méthode statique pour forcer la mise à jour de la configuration
ChessModalManager.reloadConfig = function() {
    const oldValue = this.consoleLog;
    this.loadConfig();
    
    if (this.consoleLog && oldValue !== this.consoleLog) {
        console.log(`🔄 ChessModalManager: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
    }
    return this.consoleLog;
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ChessModalManager.loadConfig();
            if (ChessModalManager.consoleLog) {
                console.log('✅ ChessModalManager: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        ChessModalManager.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (ChessModalManager.consoleLog) {
    console.log('✅ ChessModalManager prêt (mode debug activé)');
} else {
    console.info('✅ ChessModalManager prêt (mode silencieux)');
}