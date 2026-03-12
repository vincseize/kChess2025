/**
 * Gère l'état logique de la partie d'échecs.
 * Centralise les droits de roque, l'historique et la notation.
 */
class GameState {
    static consoleLog = true;

    static init() {
        this.loadConfig();
        this.logInfo('📋 Système de GameState initialisé', `Source: ${this.getConfigSource()}`);
    }

    static log(emoji, message, data = '') {
        if (this.consoleLog) {
            console.log(`${emoji} [GameState] ${message}`, data);
        }
    }

    static logInfo(message, data = '') {
        if (this.consoleLog) {
            console.info(`ℹ️ [GameState] ${message}`, data);
        } else if (!window._gameStateSilencedNotified) {
            console.info('📋 GameState: Mode silencieux activé (debug=false)');
            window._gameStateSilencedNotified = true;
        }
    }

    static loadConfig() {
        try {
            let configValue = null;
            if (window.appConfig?.debug) {
                configValue = window.appConfig.debug.console_log;
            } else if (typeof window.getConfig === 'function') {
                configValue = window.getConfig('debug.console_log', true);
            }

            if (configValue === "false" || configValue === false) this.consoleLog = false;
            else if (configValue === "true" || configValue === true) this.consoleLog = true;
            else if (configValue !== null) this.consoleLog = Boolean(configValue);
            return true;
        } catch (error) {
            return false;
        }
    }

    static getConfigSource() {
        if (window.appConfig) return 'JSON config';
        if (typeof window.getConfig === 'function') return 'getConfig()';
        return 'Default';
    }

    constructor() {
        this.constructor.loadConfig();
        this.constructor.log('===', 'INITIALISATION NOUVELLE PARTIE', '===');

        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.boardFlipped = false;
        this.gameStartTime = new Date();
        
        // --- ÉTAT DU ROQUE (Utilisé par MoveValidator et MoveExecutor) ---
        this.hasKingMoved = { white: false, black: false };
        this.hasRookMoved = {
            white: { kingside: false, queenside: false },
            black: { kingside: false, queenside: false }
        };

        // Droits de roque pour le FEN (format standard)
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        
        this.enPassantTarget = null; // Coordonnées de la case derrière le pion qui a doublé
        this.halfMoveClock = 0;      // Pour la règle des 50 coups
        this.fullMoveNumber = 1;     // Incrémenté après chaque coup noir
    }

    /**
     * Convertit [row, col] en notation algébrique (ex: 7,0 -> a1)
     */
    getSquareNotation(row, col) {
        const chars = 'abcdefgh';
        const rank = 8 - row;
        const file = chars[col];
        return (file && rank >= 1 && rank <= 8) ? file + rank : '??';
    }

    /**
     * Génère la notation SAN (ex: Nf3, e4, O-O)
     */
    getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo, specialMove, isCapture = false) {
        if (specialMove === 'kingside-castling' || specialMove === 'castling-kingside') return 'O-O';
        if (specialMove === 'queenside-castling' || specialMove === 'castling-queenside') return 'O-O-O';

        const pieceLetter = pieceInfo.type === 'pawn' ? '' : 
                           (pieceInfo.type === 'knight' ? 'N' : pieceInfo.type[0].toUpperCase());
        
        let notation = pieceLetter;

        // Si c'est un pion qui capture, on doit spécifier la colonne de départ (ex: exd5)
        if (pieceInfo.type === 'pawn' && isCapture) {
            notation += 'abcdefgh'[fromCol];
        }

        if (isCapture) notation += 'x';
        
        notation += this.getSquareNotation(toRow, toCol);
        return notation;
    }

    getPromotionSymbol(type) {
        const symbols = { queen: 'Q', rook: 'R', bishop: 'B', knight: 'N' };
        return symbols[type] || 'Q';
    }

    /**
     * Enregistre un mouvement et met à jour les flags de la partie
     */
    recordMove(fromRow, fromCol, toRow, toCol, pieceInfo, promotion = null, specialMove = null, isCapture = false) {
        if (!pieceInfo) return null;

        const moveNumber = this.fullMoveNumber;
        let notation = this.getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo, specialMove, isCapture);

        if (promotion) notation += `=${this.getPromotionSymbol(promotion)}`;

        // Mise à jour des droits de roque (Castling Rights)
        this.updateCastlingRightsAfterMove(pieceInfo, fromRow, fromCol);
        
        // Simulation d'échec pour la notation
        const isCheck = this.checkIfMoveCausesCheck();
        if (isCheck) notation += '+';

        const move = {
            number: moveNumber,
            player: this.currentPlayer,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            notation: notation,
            piece: pieceInfo.type,
            color: pieceInfo.color,
            promotion,
            specialMove,
            isCheck,
            timestamp: new Date(),
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights))
        };

        this.moveHistory.push(move);
        
        // Mise à jour des compteurs standards
        if (pieceInfo.type === 'pawn' || isCapture) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }

        if (this.currentPlayer === 'black') this.fullMoveNumber++;

        this.constructor.log('📝', `${moveNumber}${this.currentPlayer === 'white' ? '.' : '...'} ${notation}`);
        
        return move;
    }

    /**
     * Met à jour les droits de roque si le roi ou une tour bouge
     */
    updateCastlingRightsAfterMove(pieceInfo, fromRow, fromCol) {
        const color = pieceInfo.color;
        const startRow = (color === 'white') ? 7 : 0;

        if (pieceInfo.type === 'king') {
            this.castlingRights[color].kingside = false;
            this.castlingRights[color].queenside = false;
            this.hasKingMoved[color] = true;
        } 
        else if (pieceInfo.type === 'rook' && fromRow === startRow) {
            if (fromCol === 7) {
                this.castlingRights[color].kingside = false;
                this.hasRookMoved[color].kingside = true;
            }
            else if (fromCol === 0) {
                this.castlingRights[color].queenside = false;
                this.hasRookMoved[color].queenside = true;
            }
        }
    }

    /**
     * Détermine si le dernier coup a mis l'adversaire en échec
     */
    checkIfMoveCausesCheck() {
        try {
            // On vérifie si l'engine est disponible pour valider l'échec
            if (window.chessGame?.moveValidator) {
                const opponentColor = this.currentPlayer === 'white' ? 'black' : 'white';
                return window.chessGame.moveValidator.isKingInCheck?.(opponentColor);
            }
            return false;
        } catch (e) {
            return false;
        }
    }

switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.constructor.log('🔄', `Tour : ${this.currentPlayer.toUpperCase()}`);

        // --- AJOUT CRITIQUE : Affichage de la FEN à chaque changement de tour ---
        try {
            if (this.constructor.consoleLog && window.chessGame?.getFEN) {
                const currentFEN = window.chessGame.getFEN();
                console.log(`🧩 [FEN] ${currentFEN}`);
            }
        } catch (e) {
            // On ignore silencieusement si ChessGameCore n'est pas encore lié
        }
    }

    /**
     * Réinitialise l'état pour une nouvelle partie
     */
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
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
    }
}

// Initialisation globale
GameState.init();
window.GameState = GameState;