// js/kchess/core/game-status-fix.js
class GameStatusFix {
    static VERSION = '1.0.6';
    static debug = true;

    static init() {
        this._log(`🔧 Initialisation v${this.VERSION}`);
        setTimeout(() => this.applyFix(), 1500);
    }

    static _log(msg, data = '') {
        if (this.debug) console.log(`[GameStatusFix] ${msg}`, data);
    }

    static applyFix() {
        if (!window.chessGame) return console.warn('⚠️ chessGame non trouvé');

        const manager = window.chessGame.gameStatusManager || window.chessGame.core?.gameStatusManager;
        
        if (manager) {
            this._log('📍 Patching du manager existant');
            if (!manager._originalUpdate) manager._originalUpdate = manager.updateGameStatus;
            
            // On remplace la fonction par la nôtre
            manager.updateGameStatus = () => this.runStatusCheck(manager);
            window._gameStatusManager = manager;
        }
        this._log('✅ Correction appliquée');
    }

    static runStatusCheck(manager) {
        this._log('🔍 Vérification du statut...');
        
        try {
            const fen = this.getCurrentFEN();
            const player = window.chessGame?.gameState?.currentPlayer || 'white';
            const fenColor = player === 'white' ? 'w' : 'b';

            // 1. Déterminer le statut (avec sécurité totale)
            const result = this.calculateStatus(fen, fenColor);
            this._log(`🎯 Résultat: ${result.type}`, result);

            // 2. Appliquer les visuels (Échec / Mat)
            this.updateBoardVisuals(result, player);

            // 3. Traiter la fin de partie
            if (result.type === 'checkmate' || result.type === 'stalemate') {
                this.handleGameOver(result, player);
            }

            // 4. IMPORTANT : Relancer les services tiers (Bots et Timers)
            // Même si le status check a eu des micro-erreurs, on libère le flux
            this.triggerExternalServices();

        } catch (e) {
            console.error('❌ Erreur critique dans le Fix:', e);
            // En cas d'erreur, on essaie quand même de passer au tour suivant
            this.triggerExternalServices();
        }
    }

    static calculateStatus(fen, color) {
        // --- PRIORITÉ 1: ChessMateEngine ---
        if (typeof ChessMateEngine !== 'undefined') {
            try {
                const engine = new ChessMateEngine(fen);
                if (typeof engine.isCheckmate === 'function' && engine.isCheckmate(color)) {
                    return { type: 'checkmate', reason: 'Échec et mat' };
                }
                if (typeof engine.isStalemate === 'function' && engine.isStalemate(color)) {
                    return { type: 'stalemate', reason: 'Pat' };
                }
                if (typeof engine.isKingInCheck === 'function' && engine.isKingInCheck(color)) {
                    return { type: 'check', reason: 'Échec' };
                }
            } catch (e) { this._log('Erreur MateEngine', e); }
        }

        // --- PRIORITÉ 2: ChessStatusController (Le coupable de l'erreur) ---
        // On ajoute un try/catch ultra-spécifique pour ne pas bloquer le reste
        if (typeof ChessStatusController !== 'undefined') {
            try {
                // On vérifie que ChessStatusController et sa méthode existent
                if (typeof ChessStatusController.checkGameStatus === 'function') {
                    const status = ChessStatusController.checkGameStatus(fen, color);
                    return { type: status?.status || 'in_progress', reason: status?.reason || '' };
                }
            } catch (e) { 
                console.warn('[GameStatusFix] Fallback ChessStatusController a échoué, poursuite du jeu.');
            }
        }

        return { type: 'in_progress', reason: '' };
    }

    static triggerExternalServices() {
        // Relancer les timers
        if (window.chessGame?.timerManager) {
            window.chessGame.timerManager.switchTimer?.();
        }

        // Signaler aux bots que le statut est mis à jour
        // On attend un tout petit peu que le DOM soit prêt
        setTimeout(() => {
            if (window.chessGame?.botManager) {
                this._log('🤖 Notification BotManager');
                window.chessGame.botManager.handleMoveEnd?.();
            }
        }, 50);
    }

    static handleGameOver(result, currentPlayer) {
        if (window.chessGame?.gameState) window.chessGame.gameState.gameActive = false;
        
        // Arrêter les timers
        window.chessGame?.timerManager?.stopAll?.();

        const winner = result.type === 'checkmate' ? (currentPlayer === 'white' ? 'black' : 'white') : 'draw';
        this._log(`🏁 Fin de partie : ${winner}`);

        const msg = result.type === 'checkmate' ? "🎯 ÉCHEC ET MAT !" : "⚖️ PAT !";
        this.showToast(msg, result.type === 'checkmate' ? '#dc3545' : '#ffc107');

        setTimeout(() => {
            const ui = window.chessGame.ui || window.chessGame.core?.ui;
            ui?.modalManager?.showGameOver?.(winner, result.reason);
        }, 800);
    }

    static updateBoardVisuals(result, player) {
        const board = window.chessGame.board;
        if (!board) return;

        board.squares.forEach(s => s.element?.classList.remove('king-in-check', 'checkmate'));

        if (result.type === 'check' || result.type === 'checkmate') {
            const kingSquare = board.squares.find(s => s.piece?.type === 'king' && s.piece?.color === player);
            if (kingSquare?.element) {
                kingSquare.element.classList.add(result.type === 'checkmate' ? 'checkmate' : 'king-in-check');
            }
        }
    }

    static getCurrentFEN() {
        return window.chessGame.getCurrentFEN?.() || 
               window.chessGame.core?.getCurrentFEN?.() || 
               "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    }

    static showToast(text, color) {
        const toast = document.createElement('div');
        toast.style = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:${color};color:white;padding:15px 25px;border-radius:8px;z-index:10000;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.5);`;
        toast.textContent = text;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
}

// Lancement automatique
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GameStatusFix.init());
} else {
    GameStatusFix.init();
}