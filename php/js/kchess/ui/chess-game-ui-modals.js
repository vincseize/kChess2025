// ui/chess-game-ui-modals.js - Gestionnaire de modales avec système de logs centralisé
class ChessModalManager {
    
    static consoleLog = true;
    
    static init() {
        this.loadConfig();
        this.log('Système initialisé', 'info');
    }

    // --- Système de Log Centralisé ---
    static log(message, type = 'log', data = null) {
        if (!this.consoleLog && type !== 'error' && type !== 'warn') return;
        
        const prefix = `🎭 [Modal]`;
        const output = data ? `${message} |` : message;
        
        switch(type) {
            case 'error': console.error(`${prefix} ❌ ${output}`, data || ''); break;
            case 'warn':  console.warn(`${prefix} ⚠️ ${output}`, data || ''); break;
            case 'info':  console.info(`${prefix} ℹ️ ${output}`, data || ''); break;
            default:      console.log(`${prefix} ${output}`, data || '');
        }
    }

    static loadConfig() {
        try {
            if (window.appConfig?.debug?.console_log !== undefined) {
                const val = window.appConfig.debug.console_log;
                this.consoleLog = val === "false" ? false : Boolean(val);
                this.log(`Configuration chargée (console_log: ${this.consoleLog})`);
            }
            return true;
        } catch (error) {
            this.log('Erreur de configuration', 'error', error);
            return false;
        }
    }

    constructor(ui) {
        this.ui = ui;
        this.currentResultModal = null;
        this.constructor.log('Instance créée', 'log', { ui_connected: !!ui });
    }

    confirmNewGame() {
        this.constructor.log('Demande de confirmation: Nouvelle partie');
        
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
            this.constructor.log(`Réponse confirmation: ${result ? 'ACCEPTER' : 'ANNULER'}`);
            if (result) this.startNewGame();
            return result;
        });
    }

    showGameOver(result, reason = null) {
        this.constructor.log('Fin de partie détectée', 'info', { result, reason });
        
        let gameStatus, winner;
        if (result === 'draw' || result === 'stalemate') {
            gameStatus = result === 'stalemate' ? 'stalemate' : 'draw';
            winner = null;
        } else {
            gameStatus = 'checkmate';
            winner = result === 'white' ? 'Les Blancs' : 'Les Noirs';
        }
        
        return this.showGameResult(gameStatus, winner, reason);
    }

    showGameResult(gameStatus, winner = null, details = null) {
        if (this.currentResultModal) this.removeResultModal();
        
        this.constructor.log('Affichage modal résultat', 'log', { status: gameStatus, winner });
        
        if (this.ui?.timerManager) {
            this.ui.timerManager.stopTimer();
        }
        
        const modal = this.createResultModal(gameStatus, winner, details);
        document.body.appendChild(modal);
        this.currentResultModal = modal;
        
        this.setupResultModalEvents();
        return true;
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
            
            const handleConfirm = () => { cleanup(); resolve(true); };
            const handleCancel = () => { cleanup(); resolve(false); };
            const handleEscape = (e) => { if (e.key === 'Escape') handleCancel(); };
            const handleClickOutside = (e) => { if (e.target === modal) handleCancel(); };
            
            confirmBtn?.addEventListener('click', handleConfirm);
            cancelBtn?.addEventListener('click', handleCancel);
            modal.addEventListener('click', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
            
            document.body.appendChild(modal);
        });
    }

    createConfirmModal(title, message, options) {
        const modal = document.createElement('div');
        modal.id = 'chessConfirmModal';
        const { confirmText = 'Confirmer', cancelText = 'Annuler', confirmColor = '#28a745', cancelColor = '#6c757d' } = options;
        
        modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:9999;animation:fadeIn 0.3s ease;`;
        modal.innerHTML = `
            <div class="confirm-modal-content" style="background:white;padding:30px;border-radius:15px;text-align:center;max-width:400px;width:90%;animation:slideIn 0.3s ease;">
                <h3 style="margin:0 0 15px 0;color:#333;font-size:24px;font-weight:bold;">${title}</h3>
                <div style="margin:0 0 25px 0;color:#666;line-height:1.5;">${message}</div>
                <div style="display:flex;gap:10px;justify-content:center;">
                    ${cancelText ? `<button id="modalCancelBtn" style="padding:12px 25px;background:${cancelColor};color:white;border:none;border-radius:8px;cursor:pointer;flex:1;">${cancelText}</button>` : ''}
                    <button id="modalConfirmBtn" style="padding:12px 25px;background:${confirmColor};color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;flex:1;">${confirmText}</button>
                </div>
            </div>`;
        this.addModalStyles();
        return modal;
    }

    createResultModal(gameStatus, winner, details) {
        const modal = document.createElement('div');
        modal.id = 'chessGameResultModal';
        const { title, message, icon, color } = this.getResultDetails(gameStatus, winner, details);
        
        modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;justify-content:center;align-items:center;z-index:10000;animation:fadeIn 0.3s ease;`;
        modal.innerHTML = `
            <div class="modal-content" style="background:white;padding:40px;border-radius:20px;text-align:center;max-width:500px;width:90%;border:5px solid ${color};animation:slideIn 0.5s ease;">
                <div style="font-size:70px;margin-bottom:20px;">${icon}</div>
                <h2 style="margin:0 0 15px 0;color:#333;font-size:32px;font-weight:bold;">${title}</h2>
                <div style="margin:0 0 30px 0;color:#666;font-size:18px;">${message}</div>
                ${details ? `<div style="margin-0 0 20px 0;color:#888;font-size:14px;font-style:italic;">${details}</div>` : ''}
                <div style="display:flex;gap:15px;justify-content:center;">
                    <button id="newGameBtn" style="padding:15px 30px;background:#28a745;color:white;border:none;border-radius:10px;cursor:pointer;font-size:18px;font-weight:bold;flex:1;">Nouvelle Partie</button>
                    <button id="closeModalBtn" style="padding:15px 30px;background:#6c757d;color:white;border:none;border-radius:10px;cursor:pointer;font-size:18px;flex:1;">Fermer</button>
                </div>
            </div>`;
        this.addModalStyles();
        return modal;
    }

    getResultDetails(gameStatus, winner, details) {
        let title, message, icon, color;
        switch(gameStatus) {
            case 'checkmate': title = '🎯 ÉCHEC ET MAT !'; message = winner ? `<strong style="color:#dc3545;">${winner}</strong> remportent la victoire !` : 'Échec et mat !'; icon = '🏆'; color = '#dc3545'; break;
            case 'stalemate': title = '⚖️ PAT !'; message = 'Match nul par pat !'; icon = '🤝'; color = '#ffc107'; break;
            case 'draw': title = '🤝 MATCH NUL'; message = 'La partie se termine par un match nul.'; icon = '⚖️'; color = '#17a2b8'; break;
            default: title = '🏁 TERMINÉE'; message = 'La partie est terminée.'; icon = '🏁'; color = '#6c757d';
        }
        return { title, message, icon, color };
    }

    setupResultModalEvents() {
        document.getElementById('newGameBtn')?.addEventListener('click', () => {
            this.constructor.log('Nouvelle partie demandée via modal');
            this.removeResultModal();
            this.startNewGame();
        });
        document.getElementById('closeModalBtn')?.addEventListener('click', () => this.removeResultModal());
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.removeResultModal(); });
    }

    removeResultModal() {
        if (!this.currentResultModal) return;
        const modal = this.currentResultModal;
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            modal.remove();
            this.currentResultModal = null;
            this.constructor.log('Modal résultat supprimée');
        }, 300);
    }

    startNewGame() {
        this.constructor.log('Action: Redémarrage du jeu...');
        const game = window.chessGame || window.chessGame?.core;
        if (typeof game?.restartGame === 'function') {
            game.restartGame();
        } else {
            window.location.reload();
        }
    }

    showPromotionModal(color, callback) {
        this.constructor.log(`Ouverture modal promotion: ${color}`);
        const modal = document.createElement('div');
        modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:9998;`;
        
        const pieces = [
            { type: 'queen', symbol: '♕' }, { type: 'rook', symbol: '♖' },
            { type: 'bishop', symbol: '♗' }, { type: 'knight', symbol: '♘' }
        ];
        const pieceColor = color === 'white' ? 'white' : 'black';

        modal.innerHTML = `
            <div style="background:white;padding:20px;border-radius:15px;text-align:center;">
                <h3 style="margin:0 0 20px 0;">Promotion</h3>
                <div style="display:flex;gap:15px;">
                    ${pieces.map(p => `<button class="promotion-piece" data-type="${p.type}" style="width:70px;height:70px;font-size:40px;cursor:pointer;background:${pieceColor === 'white' ? '#eee' : '#333'};color:${pieceColor === 'white' ? '#000' : '#fff'};border-radius:10px;border:none;">${p.symbol}</button>`).join('')}
                </div>
            </div>`;

        modal.querySelectorAll('.promotion-piece').forEach(btn => {
            btn.addEventListener('click', () => {
                this.constructor.log(`Pièce choisie: ${btn.dataset.type}`);
                modal.remove();
                if (callback) callback(btn.dataset.type);
            });
        });
        document.body.appendChild(modal);
    }

    showCheckModal(color) {
        this.constructor.log(`Alerte Échec: ${color}`, 'warn');
        const modal = document.createElement('div');
        modal.style.cssText = `position:fixed;top:20px;right:20px;background:#dc3545;color:white;padding:15px 25px;border-radius:10px;z-index:9997;animation:slideInRight 0.5s ease;font-weight:bold;`;
        modal.innerHTML = `⚠️ Échec au Roi ${color === 'white' ? 'Blanc' : 'Noir'} !`;
        document.body.appendChild(modal);
        setTimeout(() => modal.remove(), 2500);
    }

    addModalStyles() {
        if (document.querySelector('#chess-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'chess-modal-styles';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            @keyframes slideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
            .promotion-piece:hover { transform: scale(1.1); background: #28a745 !important; color: white !important; }
        `;
        document.head.appendChild(style);
    }

    showSimpleModal(title, message, type = 'info') {
        const colors = { info: '#17a2b8', success: '#28a745', warning: '#ffc107', error: '#dc3545' };
        return this.showConfirmModal(title, message, { confirmText: 'OK', cancelText: null, confirmColor: colors[type] });
    }
}

// Initialisation
ChessModalManager.init();
window.ChessModalManager = ChessModalManager;