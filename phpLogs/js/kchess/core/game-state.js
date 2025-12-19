// core/game-state.js - Version optimisée avec logs essentiels
class GameState {
    
    // Valeur par défaut
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('📋 GameState: Système de monitoring activé');
        } else {
            console.info('📋 GameState: Mode silencieux (Debug désactivé)');
        }
    }
    
    static loadConfig() {
        try {
            let configValue = null;

            if (window.appConfig && window.appConfig.debug) {
                configValue = window.appConfig.debug.console_log;
            } else if (typeof window.getConfig === 'function') {
                configValue = window.getConfig('debug.console_log', true);
            }

            if (configValue !== null) {
                // Conversion robuste : gère booléens et strings "true"/"false"
                const isFalse = (configValue === "false" || configValue === false);
                const isTrue = (configValue === "true" || configValue === true);
                this.consoleLog = isFalse ? false : (isTrue ? true : Boolean(configValue));
            }
        } catch (error) {
            console.error('❌ GameState Config Error:', error);
        }
    }

    constructor() {
        // S'assurer que la config est à jour à l'instanciation
        this.constructor.loadConfig();
        
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.boardFlipped = false;
        this.gameStartTime = new Date();
        
        // DROITS DE ROQUE
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;

        if (this.constructor.consoleLog) {
            console.log('✅ GameState: Nouvelle partie initialisée');
        }
    }

    recordMove(fromRow, fromCol, toRow, toCol, pieceInfo, promotion = null, specialMove = null) {
        if (!pieceInfo) return null;

        const moveNumber = Math.floor(this.moveHistory.length / 2) + 1;
        let notation = this.getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo, specialMove);
        
        if (promotion) {
            notation += `=${this.getPromotionSymbol(promotion)}`;
        }

        // 1. Mise à jour des droits de roque (AVANT le calcul de l'échec)
        this.updateCastlingRightsAfterMove(pieceInfo, fromRow, fromCol);
        
        // 2. Vérification de l'échec
        const isCheck = this.checkIfMoveCausesCheck();
        if (isCheck) notation += '+';

        // 3. Création de l'objet move
        const move = {
            number: moveNumber,
            player: this.currentPlayer,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            notation: notation,
            piece: pieceInfo.type,
            color: pieceInfo.color,
            promotion: promotion,
            specialMove: specialMove,
            isCheck: isCheck,
            timestamp: new Date(),
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
            fen: window.FENGenerator ? window.FENGenerator.generateFEN(this, window.chessGame?.board) : ''
        };

        this.moveHistory.push(move);
        this.updateHalfMoveClock(pieceInfo, toRow, toCol);

        if (this.currentPlayer === 'black') this.fullMoveNumber++;

        // LOGS ESSENTIELS
        if (this.constructor.consoleLog) {
            const playerIcon = move.color === 'white' ? '⚪' : '⚫';
            console.log(`${playerIcon} Move ${move.number}: ${move.notation} (${move.piece})`);
            if (isCheck) console.log('⚠️ ÉCHEC détecté');
        }

        return move;
    }

    updateCastlingRightsAfterMove(pieceInfo, fromRow, fromCol) {
        const color = pieceInfo.color;
        let changed = false;

        if (pieceInfo.type === 'king') {
            if (this.castlingRights[color].kingside || this.castlingRights[color].queenside) {
                this.castlingRights[color].kingside = false;
                this.castlingRights[color].queenside = false;
                changed = true;
            }
        } else if (pieceInfo.type === 'rook') {
            const startRow = color === 'white' ? 7 : 0;
            if (fromRow === startRow) {
                if (fromCol === 7 && this.castlingRights[color].kingside) {
                    this.castlingRights[color].kingside = false;
                    changed = true;
                } else if (fromCol === 0 && this.castlingRights[color].queenside) {
                    this.castlingRights[color].queenside = false;
                    changed = true;
                }
            }
        }

        if (changed && this.constructor.consoleLog) {
            console.log(`🏰 Droits de roque mis à jour pour ${color}`);
        }
    }

    updateHalfMoveClock(pieceInfo, toRow, toCol) {
        const targetSquare = window.chessGame?.board?.getSquare(toRow, toCol);
        const isCapture = targetSquare && targetSquare.piece && targetSquare.piece.color !== pieceInfo.color;
        
        if (pieceInfo.type === 'pawn' || isCapture) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }
    }

checkIfMoveCausesCheck() {
    try {
        const currentFEN = window.FENGenerator ? 
            window.FENGenerator.generateFEN(this, window.chessGame?.board) : '';
        
        if (!currentFEN) return false;

        // On vérifie si la classe ChessEngine existe
        if (typeof ChessEngine !== 'undefined') {
            const engine = new ChessEngine(currentFEN);
            const opponentColor = this.currentPlayer === 'white' ? 'b' : 'w';
            
            // Vérification sécurisée de la méthode
            if (typeof engine.isKingInCheck === 'function') {
                return engine.isKingInCheck(opponentColor);
            }
        }
        return false;
    } catch (e) {
        console.warn('⚠️ GameState: Erreur calcul échec:', e);
        return false;
    }
}

    getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo, specialMove) {
        if (specialMove === 'castle-kingside') return 'O-O';
        if (specialMove === 'castle-queenside') return 'O-O-O';
        
        const files = 'abcdefgh';
        const from = files[fromCol] + (8 - fromRow);
        const to = files[toCol] + (8 - toRow);
        const piece = pieceInfo.type === 'pawn' ? '' : this.getPieceSymbol(pieceInfo.type);
        
        return `${piece}${from}-${to}`;
    }

    getPieceSymbol(type) {
        const s = { king:'K', queen:'Q', rook:'R', bishop:'B', knight:'N' };
        return s[type] || '';
    }

    getPromotionSymbol(type) {
        return this.getPieceSymbol(type) || 'Q';
    }

    getPGN() {
        let pgn = '';
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const moveNum = Math.floor(i / 2) + 1;
            const white = this.moveHistory[i].notation;
            const black = this.moveHistory[i + 1] ? this.moveHistory[i + 1].notation : '';
            pgn += `${moveNum}. ${white} ${black} `.trim() + ' ';
        }
        return pgn.trim();
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        return this.currentPlayer;
    }

    resetGame() {
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.gameStartTime = new Date();
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        if (this.constructor.consoleLog) console.clear();
        if (this.constructor.consoleLog) console.log('🔄 Partie réinitialisée');
    }
}

// Initialisation et exposition
GameState.init();
window.GameState = GameState;

// Utils
window.GameStateUtils = {
    reloadConfig: () => GameState.loadConfig(),
    getPGN: () => {
        const inst = window.chessGame?.gameState;
        return inst ? inst.getPGN() : 'Pas de partie en cours';
    }
};