/**
 * js/kchess/core/game-status-fix.js - Version 1.4.1
 * STATUT COMPLET + LOGS UNIFIÉS + DÉTECTION FEN ROBUSTE
 */

class GameStatusFix {
    
    static VERSION = '1.4.1';
    static isApplied = false;
    static consoleLog = true; 
    
    static positionHistory = new Map();
    static lastAnalyzedFen = ""; 

    static log(message, type = 'info', data = null) {
        if (!this.consoleLog && (type === 'info' || type === 'config')) return;
        const timestamp = new Date().toLocaleTimeString();
        const icons = { info: '🔧', success: '✅', warn: '⚠️', error: '❌', bot: '🤖', config: '⚙️' };
        const icon = icons[type] || '⚪';
        console.log(`${icon} [GameStatusFix ${timestamp}] ${message}`);
        if (data && this.consoleLog) console.dir(data);
    }

    static init() {
        this.loadConfig();
        const checkInterval = setInterval(() => {
            // On vérifie que le jeu et au moins une méthode de FEN existent
            if (window.chessGame) {
                clearInterval(checkInterval);
                this.applyFix();
            }
        }, 500);
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.debug || window.appConfig?.chess_engine;
            if (config?.console_log !== undefined) {
                this.consoleLog = String(config.console_log).toLowerCase() !== "false";
            }
        } catch (e) { this.log('Erreur config', 'error', e); }
    }

    static applyFix() {
        if (this.isApplied) return;
        try {
            const manager = this.getManager();
            if (!manager) return;

            manager.updateGameStatus = () => this.updateGameStatusImplementation(manager);
            this.isApplied = true;
            this.log(`Système de statut v${this.VERSION} prêt.`, 'success');
        } catch (e) { this.log('Erreur injection', 'error', e); }
    }

    static getManager() {
        let manager = window.chessGame?.gameStatusManager || window.chessGame?.core?.gameStatusManager;
        if (!manager && window.chessGame) {
            if (!window.chessGame.core) window.chessGame.core = {};
            window.chessGame.core.gameStatusManager = { chessGame: window.chessGame };
            manager = window.chessGame.core.gameStatusManager;
        }
        return manager;
    }

    static updateGameStatusImplementation(manager) {
        try {
            const game = window.chessGame;
            const state = game.gameState || game.core?.gameState;
            const board = game.board || game.core?.board;
            
            // --- DÉTECTION FEN ULTRA-ROBUSTE ---
            let fen = "";
            const fenGen = window.FENGenerator || game.core?.FENGenerator || window.fenGenerator;
            
            if (fenGen && typeof fenGen.generateFEN === 'function') {
                fen = fenGen.generateFEN(state, board);
            } else if (typeof window.generateFEN === 'function') {
                fen = window.generateFEN(state, board);
            }

            if (!fen || fen.length < 20) return;
            if (this.lastAnalyzedFen === fen) return;
            this.lastAnalyzedFen = fen;

            this.cleanHighlights();

            const player = state.currentPlayer || 'white';
            const playerCode = player === 'white' ? 'w' : 'b';

            // Analyse de la position
            const status = this.determineFullStatus(fen, playerCode);
            this.processGameStatus(status, player);

        } catch (error) {
            this.log(`Erreur analyse : ${error.message}`, 'error');
        }
    }

    static determineFullStatus(fen, playerCode) {
        if (typeof ChessMateEngine === 'undefined') {
            return { type: 'in_progress', reason: '' };
        }

        const engine = new ChessMateEngine(fen);
        if (engine.isCheckmate(playerCode)) return { type: 'checkmate', reason: 'Mat' };
        if (engine.isStalemate(playerCode)) return { type: 'stalemate', reason: 'Pat' };
        
        const posKey = fen.split(' ').slice(0, 4).join(' ');
        const count = (this.positionHistory.get(posKey) || 0) + 1;
        this.positionHistory.set(posKey, count);
        
        if (count >= 3) return { type: 'draw', reason: 'Triple répétition' };
        if (engine.isKingInCheck(playerCode)) return { type: 'check', reason: 'Échec' };

        return { type: 'in_progress', reason: 'En cours' };
    }

    static processGameStatus(status, currentPlayer) {
        const game = window.chessGame;
        const state = game.gameState || game.core?.gameState;
        const isGameOver = ['checkmate', 'stalemate', 'draw'].includes(status.type);

        if (isGameOver) {
            if (state) state.gameActive = false;
            this.log(`🏁 Fin : ${status.reason}`, 'warn');
            setTimeout(() => {
                const ui = game.ui || game.core?.ui;
                if (ui?.modalManager?.showGameOver) {
                    const winner = status.type === 'checkmate' ? (currentPlayer === 'white' ? 'black' : 'white') : 'draw';
                    ui.modalManager.showGameOver(winner, status.reason);
                }
            }, 600);
        } else {
            if (status.type === 'check') this.highlightKing(currentPlayer);
            
            // IMPORTANT : Ne pas déclencher le bot si une promotion est en cours
            if (!game.moveHandler?.isPromoting) {
                this.triggerBotIfNeeded();
            }
        }
    }

    static triggerBotIfNeeded() {
        const game = window.chessGame;
        const bot = game.botManager || game.core?.botManager;
        const state = game.gameState || game.core?.gameState;

        if (bot && typeof bot.isBotTurn === 'function' && bot.isBotTurn()) {
            if (state?.gameActive !== false) {
                this.log(`🤖 Bot doit jouer (${state.currentPlayer})`, 'bot');
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

    static cleanHighlights() {
        const board = window.chessGame.board || window.chessGame.core?.board;
        if (board?.squares) {
            board.squares.forEach(s => s.element?.classList.remove('king-in-check'));
        }
    }
}

// Initialisation globale
GameStatusFix.init();
window.GameStatusFix = GameStatusFix;