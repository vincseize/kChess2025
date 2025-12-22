/**
 * js/kchess/core/game-status-fix.js - Version 1.3.5
 * STATUT COMPLET + OPTIMISATION DES LOGS + ANTI-BOUCLE
 */

class GameStatusFix {
    
    static VERSION = '1.3.5';
    static isApplied = false;
    static debug = true;
    static logs = [];
    static MAX_LOGS = 30;
    static positionHistory = new Map();
    static lastAnalyzedFen = ""; // Empêche les calculs inutiles

    static log(message, type = 'info', data = null) {
        if (!this.debug && type === 'info') return;
        const timestamp = new Date().toLocaleTimeString();
        const icons = { info: '🔧', success: '✅', warn: '⚠️', error: '❌', bot: '🤖' };
        console.log(`${icons[type] || '⚪'} [GameStatusFix ${timestamp}] ${message}`);
        if (data && this.debug) console.dir(data);
    }

    static init() {
        const checkInterval = setInterval(() => {
            if (window.chessGame && window.FENGenerator) {
                clearInterval(checkInterval);
                this.applyFix();
            }
        }, 500);
    }
    
    static applyFix() {
        if (this.isApplied) return;
        try {
            this.ensureGameStatusManagerExists();
            this.patchUpdateGameStatus();
            this.isApplied = true;
            this.log('Système de statut optimisé prêt.', 'success');
        } catch (e) {
            console.error('🚨 GameStatusFix critical error:', e);
        }
    }
    
    static ensureGameStatusManagerExists() {
        let manager = window.chessGame?.core?.gameStatusManager || window.chessGame?.gameStatusManager;
        if (!manager) {
            if (!window.chessGame.core) window.chessGame.core = {};
            window.chessGame.core.gameStatusManager = { chessGame: window.chessGame };
            manager = window.chessGame.core.gameStatusManager;
        }
        window._gameStatusManager = manager;
    }

    static patchUpdateGameStatus() {
        const manager = window._gameStatusManager;
        if (manager) {
            manager.updateGameStatus = () => this.updateGameStatusImplementation(manager);
        }
    }

    static updateGameStatusImplementation(manager) {
        try {
            const gameState = window.chessGame.gameState || window.chessGame.core?.gameState;
            const board = window.chessGame.board || window.chessGame.core?.board;
            
            const fen = FENGenerator.generateFEN(gameState, board);
            if (!fen || fen.length < 20) return;

            // --- OPTIMISATION : Ne rien faire si la position n'a pas bougé ---
            if (this.lastAnalyzedFen === fen) return;
            this.lastAnalyzedFen = fen;

            this.cleanHighlightsImplementation(manager);
            const player = gameState?.currentPlayer || 'white';
            const playerCode = player === 'white' ? 'w' : 'b';

            const status = this.determineFullStatus(fen, playerCode);
            this.processGameStatusImplementation(manager, status, player);
        } catch (error) {
            this.log(`Erreur Update : ${error.message}`, 'error');
        }
    }

    static determineFullStatus(fen, playerCode) {
        if (typeof ChessMateEngine !== 'undefined') {
            const engine = new ChessMateEngine(fen);
            
            if (engine.isCheckmate(playerCode)) return { type: 'checkmate', reason: 'Mat' };
            if (engine.isStalemate(playerCode)) return { type: 'stalemate', reason: 'Pat' };
            
            // Répétition
            const posKey = fen.split(' ').slice(0, 4).join(' ');
            const count = (this.positionHistory.get(posKey) || 0) + 1;
            this.positionHistory.set(posKey, count);
            if (count >= 3) return { type: 'draw', reason: 'Triple répétition' };

            // 50 coups
            const halfMove = parseInt(fen.split(' ')[4]) || 0;
            if (halfMove >= 100) return { type: 'draw', reason: '50 coups' };

            if (engine.isKingInCheck(playerCode)) return { type: 'check', reason: 'Échec' };
        }
        return { type: 'in_progress', reason: 'En cours' };
    }

    static processGameStatusImplementation(manager, status, currentPlayer) {
        const isGameOver = ['checkmate', 'stalemate', 'draw'].includes(status.type);

        if (isGameOver) {
            if (window.chessGame.gameState) window.chessGame.gameState.gameActive = false;
            this.log(`Fin de partie : ${status.reason}`, 'warn');
            
            setTimeout(() => {
                const ui = window.chessGame.ui || window.chessGame.core?.ui;
                if (ui?.modalManager?.showGameOver) {
                    const winner = status.type === 'checkmate' ? (currentPlayer === 'white' ? 'black' : 'white') : 'draw';
                    ui.modalManager.showGameOver(winner, status.reason);
                }
            }, 500);
        } else {
            if (status.type === 'check') this.highlightKing(currentPlayer);
            this.triggerBotIfNeeded();
        }
    }

    static triggerBotIfNeeded() {
        const game = window.chessGame;
        const bot = game.botManager || game.core?.botManager;
        const state = game.gameState || game.core?.gameState;

        if (bot && typeof bot.isBotTurn === 'function' && bot.isBotTurn()) {
            if (state?.gameActive !== false) {
                this.log(`🤖 Tour du Bot (${state.currentPlayer})`, 'bot');
                setTimeout(() => {
                    if (typeof bot.playBotMove === 'function') bot.playBotMove();
                }, 600);
            }
        }
    }

    static highlightKing(color) {
        const board = window.chessGame.board || window.chessGame.core?.board;
        if (!board?.squares) return;
        const kingSq = board.squares.find(s => s.piece?.type === 'king' && s.piece?.color === color);
        if (kingSq?.element) kingSq.element.classList.add('king-in-check');
    }

    static cleanHighlightsImplementation() {
        const board = window.chessGame.board || window.chessGame.core?.board;
        if (board?.squares) {
            board.squares.forEach(s => s.element?.classList.remove('king-in-check'));
        }
    }
}

// Injection CSS pour l'échec au roi
(function() {
    if (!document.getElementById('fix-status-styles')) {
        const style = document.createElement('style');
        style.id = 'fix-status-styles';
        style.textContent = `.king-in-check { box-shadow: inset 0 0 15px 5px rgba(255,0,0,0.7) !important; background-color: rgba(255,0,0,0.2) !important; }`;
        document.head.appendChild(style);
    }
})();

GameStatusFix.init();
window.GameStatusFix = GameStatusFix;