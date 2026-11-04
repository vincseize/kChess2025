// ui/chess-game-ui-modals.js - VERSION CORRIGÉE COMPLÈTE + anti timeLoss en arène
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
        this.resultModalKeydown = null;
        
        if (ChessModalManager.consoleLog) {
            console.log('🎭 ModalManager initialisé avec UI:', ui ? 'oui' : 'non');
        }
    }

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

    showGameOver(result, reason = null) {
        if (ChessModalManager.consoleLog) {
            console.log(`\n🎭 showGameOver appelé: result=${result}, reason=${reason}`);
        }
        
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
        
        return this.showGameResult(gameStatus, winner, reason);
    }

    showGameResult(gameStatus, winner = null, details = null) {
        if (this.currentResultModal) {
            this.removeResultModal();
        }
        
        if (ChessModalManager.consoleLog) {
            console.log(`🎭 Création modal: ${gameStatus}, winner=${winner}`);
        }
        
        if (this.ui && this.ui.timerManager) {
            this.ui.timerManager.stopTimer();
        }
        
        const modal = this.createResultModal(gameStatus, winner, details);
        document.body.appendChild(modal);
        this.currentResultModal = modal;
        
        this.setupResultModalEvents();
        
        return true;
    }

    /**
     * ★ v1.1.0 : neutralisé si le timer est globalement désactivé (arène).
     */
    showTimeLoss(loserColor) {
        // ★ Court-circuit total si le timer est désactivé (arène / stress test)
        if (typeof ChessTimerManager !== 'undefined' && ChessTimerManager.globallyDisabled) {
            if (ChessModalManager.consoleLog) {
                console.log('🎭 showTimeLoss ignoré (arène - timer désactivé)');
            }
            return;
        }
        return this.showGameResult('timeLoss', null, loserColor);
    }

    showConfirmModal(title, message, options = {}) {
        return new Promise((resolve) => {
            const modal = this.createConfirmModal(title, message, options);
            
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

    createResultModal(gameStatus, winner, details) {
        const modal = document.createElement('div');
        modal.id = gameStatus === 'timeLoss' ? 'timeLossModal' : 'chessGameResultModal';
        modal.className = 'game-result-modal';
        
        const { title, message, icon, color } = this.getResultDetails(gameStatus, winner, details);
        const t = (key, fallback) => (window.translations && window.translations[key]) || fallback;
        const headingId = 'game-result-title';
        const messageId = 'game-result-message';
        modal.innerHTML = `
            <section class="game-result-overlay" role="dialog" aria-modal="true"
                aria-labelledby="${headingId}" aria-describedby="${messageId}" tabindex="-1">
                <div class="game-result-content">
                    <header class="game-result-header">
                        <span class="promotion-icon game-result-icon" style="--result-accent:${color}" aria-hidden="true">${icon}</span>
                        <h2 id="${headingId}">${title}</h2>
                        <p id="${messageId}">${message}</p>
                    </header>
                    <div class="game-result-actions">
                        <button id="newGameBtn" class="game-result-action game-result-action-primary" type="button">
                            ${t('play_again', 'Rejouer')}
                        </button>
                        <button id="closeModalBtn" class="game-result-action" type="button">
                            ${t('close', 'Fermer')}
                        </button>
                    </div>
                </div>
            </section>
        `;
        
        this.addModalStyles();
        return modal;
    }

    getResultDetails(gameStatus, winner, details) {
        let title, message, icon, color;
        
        const t = (key, fallback) => (window.translations && window.translations[key]) ? window.translations[key] : fallback;

        switch(gameStatus) {
            case 'checkmate':
                title = `🎯 ${t('checkmate', 'ÉCHEC ET MAT').toUpperCase()} !`;
                
                if (winner) {
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
                const drawMessages = {
                    repetition: t('draw_repetition_desc', 'Nulle par triple répétition.'),
                    fiftyMoves: t('draw_fifty_moves_desc', 'Nulle selon la règle des 50 coups.'),
                    'Règle des 50 coups': t('draw_fifty_moves_desc', 'Nulle selon la règle des 50 coups.'),
                    insufficient: t('draw_insufficient_material_desc', 'Nulle par matériel insuffisant.'),
                    'Matériel insuffisant': t('draw_insufficient_material_desc', 'Nulle par matériel insuffisant.')
                };
                message = drawMessages[details] || t('draw_desc', 'La partie se termine par un match nul.');
                icon = '🤝';
                color = '#17a2b8';
                break;

            case 'timeLoss': {
                const loserName = details === 'white' ? t('white_player', 'Blancs') : t('black_player', 'Noirs');
                title = t('time_lost', 'Perdu au temps').toUpperCase();
                message = `${loserName} — ${t('time_lost_message', 'Votre temps est écoulé.')}`;
                icon = '⏱';
                color = '#fb7185';
                break;
            }
                
            default:
                title = `🏁 ${t('game_over', 'PARTIE TERMINÉE').toUpperCase()}`;
                message = t('game_over', 'La partie est terminée.');
                icon = '🏁🎮';
                color = '#6c757d';
        }
        
        return { title, message, icon, color };
    }

    setupResultModalEvents() {
        const modal = this.currentResultModal;
        if (!modal) return;

        modal.querySelector('#newGameBtn')?.addEventListener('click', () => {
            if (ChessModalManager.consoleLog) {
                console.log('🎮 Nouvelle partie demandée depuis modal résultat');
            }
            this.removeResultModal();
            window.showReplayColorPicker?.();
        });
        
        modal.querySelector('#closeModalBtn')?.addEventListener('click', () => {
            this.removeResultModal();
        });

        this.resultModalKeydown = (e) => {
            if (e.key === 'Escape' && this.currentResultModal === modal) {
                this.removeResultModal();
            } else if (e.key === 'Tab' && this.currentResultModal === modal) {
                const buttons = [...modal.querySelectorAll('button')];
                const first = buttons[0];
                const last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', this.resultModalKeydown);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.removeResultModal();
        });
        modal.querySelector('#newGameBtn')?.focus();
    }

    removeResultModal() {
        if (!this.currentResultModal) return;
        this.currentResultModal.remove();
        this.currentResultModal = null;
        if (this.resultModalKeydown) {
            document.removeEventListener('keydown', this.resultModalKeydown);
            this.resultModalKeydown = null;
        }
        if (ChessModalManager.consoleLog) console.log('🎭 Modal résultat supprimée');
    }

    startNewGame() {
        if (ChessModalManager.consoleLog) {
            console.log('🎭 Démarrage nouvelle partie...');
        }
        
        if (window.chessGame && typeof window.chessGame.restartGame === 'function') {
            window.chessGame.restartGame();
        } else if (window.chessGame && window.chessGame.core && typeof window.chessGame.core.restartGame === 'function') {
            window.chessGame.core.restartGame();
        } else {
            setTimeout(() => {
                window.location.href = 'index.php';
            }, 500);
        }
    }

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
        
        const piecesButtons = modal.querySelectorAll('.promotion-piece');
        piecesButtons.forEach(button => {
            button.addEventListener('click', () => {
                const pieceType = button.dataset.type;
                modal.remove();
                if (callback) callback(pieceType);
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                if (callback) callback('queen');
            }
        });
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleEscape);
                modal.remove();
                if (callback) callback('queen');
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        document.body.appendChild(modal);
        
        modal.addEventListener('remove', () => {
            document.removeEventListener('keydown', handleEscape);
        });
    }

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
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 2500);
    }

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

ChessModalManager.init();

document.addEventListener('DOMContentLoaded', () => {
    window.ChessModalManager = ChessModalManager;
    
    if (ChessModalManager.consoleLog) {
        console.log('✅ ChessModalManager prêt et global');
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessModalManager;
}