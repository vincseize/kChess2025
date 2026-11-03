// ui/chess-game-ui-modals.js - VERSION CORRIGÉE COMPLÈTE
class ChessModalManager {
    
    static consoleLog = true;
    
    static init() {
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('🎭 ChessModalManager chargé - VERSION CORRIGÉE COMPLÈTE');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.debug?.console_log !== undefined) {
                const val = window.appConfig.debug.console_log;
                this.consoleLog = val === "false" ? false : Boolean(val);
                
                if (this.consoleLog) {
                    console.log(`🎭 ModalManager config: console_log = ${this.consoleLog} (valeur brute: "${val}")`);
                }
            }
            return true;
        } catch (error) {
            console.error('❌ ChessModalManager config error:', error);
            return false;
        }
    }

    constructor(ui) {
        this.ui = ui;
        this.currentResultModal = null;
        
        if (ChessModalManager.consoleLog) {
            console.log('🎭 ModalManager initialisé avec UI:', ui ? 'oui' : 'non');
        }
    }

    // ✅ MÉTHODE NOUVELLE PARTIE (AJOUTÉE)
    confirmNewGame() {
        if (ChessModalManager.consoleLog) {
            console.log('\n🎭 confirmNewGame appelée');
        }
        
        return this.showConfirmModal(
            'Nouvelle partie',
            'Voulez-vous vraiment commencer une nouvelle partie ?<br><br><strong>La partie actuelle sera perdue.</strong>',
            {
                confirmText: 'Nouvelle Partie',
                cancelText: 'Annuler',
                confirmColor: '#28a745',
                cancelColor: '#6c757d'
            }
        ).then(result => {
            if (result) {
                if (ChessModalManager.consoleLog) {
                    console.log('🎭 Utilisateur accepte nouvelle partie');
                }
                this.startNewGame();
            } else {
                if (ChessModalManager.consoleLog) {
                    console.log('🎭 Utilisateur annule nouvelle partie');
                }
            }
            return result;
        });
    }

    // ✅ MÉTHODE PRINCIPALE : Afficher résultat
    showGameOver(result, reason = null) {
        if (ChessModalManager.consoleLog) {
            console.log(`\n🎭 showGameOver appelé: result=${result}, reason=${reason}`);
        }
        
        // Déterminer le type de fin
        let gameStatus, winner;
        
        if (result === 'draw' || result === 'stalemate') {
            gameStatus = result === 'stalemate' ? 'stalemate' : 'draw';
            winner = null;
        } else {
            gameStatus = 'checkmate';
            winner = result === 'white' ? 'Les Blancs' : 'Les Noirs';
        }
        
        if (ChessModalManager.consoleLog) {
            console.log(`🎭 Détails: gameStatus=${gameStatus}, winner=${winner}`);
        }
        
        // Afficher la modal
        return this.showGameResult(gameStatus, winner, reason);
    }

    // ✅ Afficher le résultat avec la bonne modal
    showGameResult(gameStatus, winner = null, details = null) {
        if (this.currentResultModal) {
            this.removeResultModal();
        }
        
        if (ChessModalManager.consoleLog) {
            console.log(`🎭 Création modal: ${gameStatus}, winner=${winner}`);
        }
        
        // Arrêter les timers
        if (this.ui && this.ui.timerManager) {
            this.ui.timerManager.stopTimer();
        }
        
        // Créer la modal
        const modal = this.createResultModal(gameStatus, winner, details);
        document.body.appendChild(modal);
        this.currentResultModal = modal;
        
        // Configurer les événements
        this.setupResultModalEvents();
        
        return true;
    }

    showTimeLoss(loserColor) {
        if (this.currentResultModal) this.removeResultModal();

        const t = (key, fallback) => (window.translations && window.translations[key]) || fallback;
        const modal = document.createElement('div');
        modal.id = 'timeLossModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.55);';

        const panel = document.createElement('div');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.style.cssText = 'width:min(100%,340px);padding:24px;border-radius:14px;background:#fff;text-align:center;box-shadow:0 12px 36px rgba(0,0,0,.3);';

        const title = document.createElement('h2');
        title.textContent = t('time_lost', 'Perdu au temps');
        title.style.cssText = 'margin:0 0 10px;color:#dc3545;font-size:1.35rem;';

        const message = document.createElement('p');
        const loserName = loserColor === 'white' ? t('white_player', 'Blancs') : t('black_player', 'Noirs');
        message.textContent = `${loserName} — ${t('time_lost_message', 'Votre temps est écoulé.')}`;
        message.style.cssText = 'margin:0 0 18px;color:#444;';

        const replayButton = document.createElement('button');
        replayButton.type = 'button';
        replayButton.className = 'btn btn-success me-2';
        replayButton.textContent = t('play_again', 'Rejouer');
        replayButton.addEventListener('click', () => {
            modal.remove();
            window.showReplayColorPicker?.();
        });

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn btn-outline-secondary';
        closeButton.textContent = t('close', 'Fermer');
        closeButton.addEventListener('click', () => modal.remove());

        panel.append(title, message, replayButton, closeButton);
        modal.appendChild(panel);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.remove();
        });
        document.body.appendChild(modal);
    }

    // ✅ MODALE DE CONFIRMATION (AJOUTÉE)
    showConfirmModal(title, message, options = {}) {
        return new Promise((resolve) => {
            const modal = this.createConfirmModal(title, message, options);
            
            // Gestionnaires d'événements
            const confirmBtn = modal.querySelector('#modalConfirmBtn');
            const cancelBtn = modal.querySelector('#modalCancelBtn');
            
            const cleanup = () => {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            };
            
            const handleConfirm = () => {
                cleanup();
                resolve(true);
            };
            
            const handleCancel = () => {
                cleanup();
                resolve(false);
            };
            
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                }
            };
            
            const handleClickOutside = (e) => {
                if (e.target === modal) {
                    handleCancel();
                }
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            modal.addEventListener('click', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
            
            document.body.appendChild(modal);
        });
    }

    // ✅ Créer la modal de confirmation (AJOUTÉE)
    createConfirmModal(title, message, options) {
        const modal = document.createElement('div');
        modal.id = 'chessConfirmModal';
        
        const {
            confirmText = 'Confirmer',
            cancelText = 'Annuler',
            confirmColor = '#28a745',
            cancelColor = '#6c757d'
        } = options;
        
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
            z-index: 9999;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div class="confirm-modal-content" style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 400px;
                width: 90%;
                animation: slideIn 0.3s ease;
            ">
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 24px; font-weight: bold;">
                    ${title}
                </h3>
                <div style="margin: 0 0 25px 0; color: #666; line-height: 1.5; font-size: 16px;">
                    ${message}
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="modalCancelBtn" class="modal-btn" style="
                        padding: 12px 25px;
                        background: ${cancelColor};
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                        transition: all 0.3s;
                        flex: 1;
                        min-width: 120px;
                    ">${cancelText}</button>
                    <button id="modalConfirmBtn" class="modal-btn" style="
                        padding: 12px 25px;
                        background: ${confirmColor};
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                        transition: all 0.3s;
                        flex: 1;
                        min-width: 120px;
                    ">${confirmText}</button>
                </div>
            </div>
        `;
        
        this.addModalStyles();
        return modal;
    }

    // ✅ Créer la modal de résultat
    createResultModal(gameStatus, winner, details) {
        const modal = document.createElement('div');
        modal.id = 'chessGameResultModal';
        
        const { title, message, icon, color } = this.getResultDetails(gameStatus, winner, details);
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                text-align: center;
                max-width: 500px;
                width: 90%;
                border: 5px solid ${color};
                animation: slideIn 0.5s ease;
            ">
                <div style="font-size: 70px; margin-bottom: 20px; line-height: 1;">
                    ${icon}
                </div>
                <h2 style="margin: 0 0 15px 0; color: #333; font-size: 32px; font-weight: bold;">
                    ${title}
                </h2>
                <div style="margin: 0 0 30px 0; color: #666; line-height: 1.6; font-size: 18px;">
                    ${message}
                </div>
                ${details ? `<div style="margin: 0 0 20px 0; color: #888; font-size: 14px; font-style: italic;">
                    ${details}
                </div>` : ''}
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="newGameBtn" class="modal-btn primary-btn" style="
                        padding: 15px 30px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 18px;
                        font-weight: bold;
                        transition: all 0.3s;
                        flex: 1;
                        min-width: 150px;
                    ">${(window.translations && window.translations.play_again) || 'Rejouer'}</button>
                    <button id="closeModalBtn" class="modal-btn secondary-btn" style="
                        padding: 15px 30px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 18px;
                        transition: all 0.3s;
                        flex: 1;
                        min-width: 150px;
                    ">Continuer à Regarder</button>
                </div>
                <div style="margin-top: 25px; font-size: 13px; color: #aaa;">
                    Appuyez sur Échap ou cliquez en dehors pour fermer
                </div>
            </div>
        `;
        
        this.addModalStyles();
        return modal;
    }

    // ✅ Détails selon le type de fin
    // ✅ Détails selon le type de fin liés aux traductions
getResultDetails(gameStatus, winner, details) {
    let title, message, icon, color;
    
    // Fonction helper pour récupérer la traduction ou un fallback
    const t = (key, fallback) => (window.translations && window.translations[key]) ? window.translations[key] : fallback;

    switch(gameStatus) {
        case 'checkmate':
            title = `🎯 ${t('checkmate', 'ÉCHEC ET MAT').toUpperCase()} !`;
            
            // On gère le message de victoire dynamiquement
            if (winner) {
                // Traduction du gagnant (Blancs/Noirs)
                const winnerName = winner.toLowerCase().includes('blanc') || winner.toLowerCase().includes('white') 
                                   ? t('white_player', 'Blancs') 
                                   : t('black_player', 'Noirs');
                                   
                message = `<strong style="color: #dc3545;">${winnerName}</strong> ${t('win_message', 'remportent la victoire !')}<br>${t('checkmate_desc', 'Le roi adverse est mat.')}`;
            } else {
                message = t('game_over', 'Partie terminée');
            }
            
            icon = '♔⚔️🏆';
            color = '#dc3545';
            break;
            
        case 'stalemate':
            title = `⚖️ ${t('stalemate', 'PAT').toUpperCase()} !`;
            message = t('stalemate_desc', 'Match nul par pat ! Le roi n\'a aucun coup légal.');
            icon = '⚖️🤝♟️';
            color = '#ffc107';
            break;
            
        case 'draw':
            title = `🤝 ${t('draw', 'MATCH NUL').toUpperCase()}`;
            message = t('draw_desc', 'La partie se termine par un match nul.');
            icon = '🤝🎯⚖️';
            color = '#17a2b8';
            break;
            
        default:
            title = `🏁 ${t('game_over', 'PARTIE TERMINÉE').toUpperCase()}`;
            message = t('game_over', 'La partie est terminée.');
            icon = '🏁🎮';
            color = '#6c757d';
    }
    
    return { title, message, icon, color };
}

    // ✅ Configurer les événements
    setupResultModalEvents() {
        // Nouvelle partie
        document.getElementById('newGameBtn')?.addEventListener('click', () => {
            if (ChessModalManager.consoleLog) {
                console.log('🎮 Nouvelle partie demandée depuis modal résultat');
            }
            this.removeResultModal();
            window.showReplayColorPicker?.();
        });
        
        // Fermer
        document.getElementById('closeModalBtn')?.addEventListener('click', () => {
            this.removeResultModal();
        });
        
        // Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentResultModal) {
                this.removeResultModal();
            }
        });
        
        // Clic sur fond
        if (this.currentResultModal) {
            this.currentResultModal.addEventListener('click', (e) => {
                if (e.target === this.currentResultModal) {
                    this.removeResultModal();
                }
            });
        }
    }

    // ✅ Supprimer la modal
    removeResultModal() {
        if (!this.currentResultModal) return;
        
        const modal = this.currentResultModal;
        modal.style.animation = 'fadeOut 0.3s ease';
        
        setTimeout(() => {
            modal.remove();
            this.currentResultModal = null;
            
            if (ChessModalManager.consoleLog) {
                console.log('🎭 Modal résultat supprimée');
            }
        }, 300);
    }

    // ✅ Lancer nouvelle partie
    startNewGame() {
        if (ChessModalManager.consoleLog) {
            console.log('🎭 Démarrage nouvelle partie...');
        }
        
        // Essayer de redémarrer le jeu si possible
        if (window.chessGame && typeof window.chessGame.restartGame === 'function') {
            window.chessGame.restartGame();
        } else if (window.chessGame && window.chessGame.core && typeof window.chessGame.core.restartGame === 'function') {
            window.chessGame.core.restartGame();
        } else {
            // Fallback: redirection
            setTimeout(() => {
                window.location.href = 'index.php';
            }, 500);
        }
    }

    // ✅ MODALE DE PROMOTION (AJOUTÉE)
    showPromotionModal(color, callback) {
        if (ChessModalManager.consoleLog) {
            console.log(`🎭 Promotion demandée pour ${color}`);
        }
        
        const modal = document.createElement('div');
        modal.id = 'chessPromotionModal';
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9998;
            animation: fadeIn 0.3s ease;
        `;
        
        const pieces = [
            { type: 'queen', symbol: '♕', name: 'Dame' },
            { type: 'rook', symbol: '♖', name: 'Tour' },
            { type: 'bishop', symbol: '♗', name: 'Fou' },
            { type: 'knight', symbol: '♘', name: 'Cavalier' }
        ];
        
        const pieceColor = color === 'white' ? 'white' : 'black';
        
        modal.innerHTML = `
            <div class="promotion-modal-content" style="
                background: white;
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                text-align: center;
                animation: slideIn 0.3s ease;
            ">
                <h3 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">
                    Promotion du pion
                </h3>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 16px;">
                    Choisissez la pièce de promotion
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    ${pieces.map(piece => `
                        <button class="promotion-piece" data-type="${piece.type}" style="
                            width: 80px;
                            height: 80px;
                            background: ${pieceColor === 'white' ? '#f8f9fa' : '#343a40'};
                            color: ${pieceColor === 'white' ? '#333' : '#fff'};
                            border: 3px solid ${pieceColor === 'white' ? '#ddd' : '#555'};
                            border-radius: 10px;
                            font-size: 40px;
                            cursor: pointer;
                            transition: all 0.3s;
                        ">
                            ${piece.symbol}
                        </button>
                    `).join('')}
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #999;">
                    Cliquez sur une pièce pour promouvoir
                </div>
            </div>
        `;
        
        // Gestionnaires d'événements
        const piecesButtons = modal.querySelectorAll('.promotion-piece');
        piecesButtons.forEach(button => {
            button.addEventListener('click', () => {
                const pieceType = button.dataset.type;
                modal.remove();
                if (callback) callback(pieceType);
            });
        });
        
        // Clic sur fond pour annuler (choisir dame par défaut)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                if (callback) callback('queen');
            }
        });
        
        // Échap pour annuler
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleEscape);
                modal.remove();
                if (callback) callback('queen');
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        document.body.appendChild(modal);
        
        // Nettoyage après suppression
        modal.addEventListener('remove', () => {
            document.removeEventListener('keydown', handleEscape);
        });
    }

    // ✅ MODALE D'ÉCHEC (AJOUTÉE)
    showCheckModal(color) {
        if (ChessModalManager.consoleLog) {
            console.log(`🎭 Échec détecté pour ${color}`);
        }
        
        const modal = document.createElement('div');
        modal.id = 'chessCheckModal';
        modal.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color === 'white' ? '#dc3545' : '#343a40'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 9997;
            animation: slideInRight 0.5s ease, fadeOut 0.5s ease 2s forwards;
            font-weight: bold;
            font-size: 16px;
        `;
        
        const player = color === 'white' ? 'Blancs' : 'Noirs';
        modal.innerHTML = `⚠️ Échec ! Roi ${player} en danger`;
        
        document.body.appendChild(modal);
        
        // Auto-suppression après 2.5 secondes
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 2500);
    }

    // ✅ Ajouter styles
    addModalStyles() {
        if (!document.querySelector('#chess-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'chess-modal-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes slideIn {
                    from { 
                        transform: translateY(-50px) scale(0.9); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateY(0) scale(1); 
                        opacity: 1; 
                    }
                }
                @keyframes slideInRight {
                    from { 
                        transform: translateX(100%); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateX(0); 
                        opacity: 1; 
                    }
                }
                .modal-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                }
                .modal-btn:active {
                    transform: translateY(-1px);
                }
                .primary-btn:hover {
                    background: #218838 !important;
                }
                .secondary-btn:hover {
                    background: #5a6268 !important;
                }
                .promotion-piece:hover {
                    transform: scale(1.1);
                    box-shadow: 0 0 20px rgba(0,0,0,0.3);
                    border-color: #28a745 !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ✅ MÉTHODES UTILITAIRES (AJOUTÉES)
    showSimpleModal(title, message, type = 'info') {
        const colors = {
            info: '#17a2b8',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545'
        };
        
        return this.showConfirmModal(title, message, {
            confirmText: 'OK',
            cancelText: null,
            confirmColor: colors[type]
        });
    }
    
    showError(message) {
        return this.showSimpleModal('Erreur', message, 'error');
    }
    
    showSuccess(message) {
        return this.showSimpleModal('Succès', message, 'success');
    }
    
    showInfo(message) {
        return this.showSimpleModal('Information', message, 'info');
    }
}

// Initialisation statique
ChessModalManager.init();

// Attendre le DOM
document.addEventListener('DOMContentLoaded', () => {
    // Exposer globalement
    window.ChessModalManager = ChessModalManager;
    
    if (ChessModalManager.consoleLog) {
        console.log('✅ ChessModalManager prêt et global');
    }
});

// Exporter pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessModalManager;
}
