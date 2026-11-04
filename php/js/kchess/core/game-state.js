/**
 * Gère l'état logique de la partie d'échecs.
 *
 * v1.1.0 :
 *   - switchPlayer ne notifie le timer que si `enabled !== false`
 *     (protection en arène / stress test)
 */
class GameState {
    static consoleLog = true;

    static init() {
        this.loadConfig();
        this.logInfo('📋 Système de GameState initialisé');
    }

    static log(emoji, message, data = '') {
        if (this.consoleLog) console.log(`${emoji} [GameState] ${message}`, data);
    }

    static logInfo(message, data = '') {
        if (this.consoleLog) console.info(`ℹ️ [GameState] ${message}`, data);
    }

    static loadConfig() {
        try {
            if (window.appConfig?.debug) {
                this.consoleLog = window.appConfig.debug.console_log !== false;
            }
            return true;
        } catch (error) { return false; }
    }

    constructor() {
        this.constructor.loadConfig();
        this.reset();
    }

    /**
     * Change le joueur actif et déclenche l'incrément de temps
     * (uniquement si le timer est actif).
     */
    switchPlayer() {
        // 1. Inversion de la couleur
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.constructor.log('🔄', `Tour : ${this.currentPlayer.toUpperCase()}`);

        // 2. Notification au Timer — v1.1.0 : skip si timer désactivé
        try {
            const timer = window.chessGame?.core?.ui?.timerManager;
            if (timer && timer.enabled !== false) {
                timer.switchTurn(this.currentPlayer);
            }
        } catch (e) {
            console.warn("⚠️ GameState: Impossible de notifier le TimerManager", e);
        }

        // 3. Log FEN pour debug
        try {
            if (this.constructor.consoleLog && window.chessGame?.getFEN) {
                console.log(`🧩 [FEN] ${window.chessGame.getFEN()}`);
            }
        } catch (e) {}
    }

    recordMove(fromRow, fromCol, toRow, toCol, pieceInfo, promotion = null, specialMove = null, isCapture = false) {
        if (!pieceInfo) return null;

        const moveNumber = this.fullMoveNumber;

        const move = {
            number: moveNumber,
            player: this.currentPlayer,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: pieceInfo.type,
            timestamp: new Date()
        };

        this.moveHistory.push(move);

        // Règle des 50 coups
        if (pieceInfo.type === 'pawn' || isCapture) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }

        if (this.currentPlayer === 'black') this.fullMoveNumber++;
        return move;
    }

    reset() {
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.hasKingMoved = { white: false, black: false };
        this.hasRookMoved = {
            white: { kingside: false, queenside: false },
            black: { kingside: false, queenside: false }
        };
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        this.chess960 = false;
        this.chess960PositionNumber = null;
        this.chess960Started = true;
        this.clockGameStarted = false;
        this.kingStartCols = { white: 4, black: 4 };
        this.rookStartCols = {
            white: { kingside: 7, queenside: 0 },
            black: { kingside: 7, queenside: 0 }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
    }
}

GameState.init();
window.GameState = GameState;