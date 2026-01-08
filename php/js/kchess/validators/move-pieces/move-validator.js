/**
 * validators/move-pieces/move-validator.js
 */
class MoveValidator {
    
    static consoleLog = false; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('✅ MoveValidator (Master) : Système prêt');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine) {
                this.consoleLog = window.appConfig.chess_engine.console_log ?? true;
            }
        } catch (error) { this.consoleLog = true; }
    }

    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
        
        // Pont de compatibilité Board (sécurisation)
        if (this.board && typeof this.board.getPiece !== 'function') {
            this.board.getPiece = (r, c) => {
                if (typeof this.board.getSquare === 'function') {
                    const square = this.board.getSquare(r, c);
                    return square ? square.piece : null;
                }
                return (this.board.grid && this.board.grid[r]) ? this.board.grid[r][c] : null;
            };
        }

        this.initializePieceValidators();
    }

    initializePieceValidators() {
        // On s'assure que les dépendances sont passées aux sous-validateurs
        const params = [this.board, this.gameState];
        
        this.pieceValidators = {
            'pawn':   typeof PawnMoveValidator !== 'undefined'   ? new PawnMoveValidator(...params)   : null,
            'knight': typeof KnightMoveValidator !== 'undefined' ? new KnightMoveValidator(...params) : null,
            'bishop': typeof BishopMoveValidator !== 'undefined' ? new BishopMoveValidator(...params) : null,
            'rook':   typeof RookMoveValidator !== 'undefined'   ? new RookMoveValidator(...params)   : null,
            'queen':  typeof QueenMoveValidator !== 'undefined'  ? new QueenMoveValidator(...params)  : null,
            'king':   typeof KingMoveValidator !== 'undefined'   ? new KingMoveValidator(...params)   : null
        };

        // Log d'avertissement si un validateur est manquant
        if (MoveValidator.consoleLog) {
            Object.keys(this.pieceValidators).forEach(type => {
                if (!this.pieceValidators[type]) {
                    console.warn(`⚠️ MoveValidator: Sous-validateur [${type}] manquant.`);
                }
            });
        }
    }

    /**
     * Point d'entrée principal pour récupérer les coups
     */
    getPossibleMoves(piece, fromRow, fromCol) {
        if (!piece || !piece.type) {
            piece = this.board.getPiece(fromRow, fromCol);
        }
        if (!piece) return [];

        const validator = this.pieceValidators[piece.type];
        if (!validator) {
            console.warn(`❌ Aucun validateur pour le type: ${piece.type}`);
            return [];
        }
        
        return validator.getPossibleMoves(piece, fromRow, fromCol);
    }

    /**
     * Vérifie si le roi est en échec
     */
    isKingInCheck(color) {
        try {
            if (typeof ChessEngine !== 'undefined') {
                const fen = this.generateCurrentFEN(color);
                const engine = new ChessEngine(fen);
                return engine.isKingInCheck(color === 'white' ? 'w' : 'b');
            }
            // Fallback si ChessEngine n'est pas là
            return false;
        } catch (e) {
            console.error("❌ Erreur isKingInCheck:", e);
            return false;
        }
    }

    /**
     * Génère une FEN simplifiée pour les calculs internes
     */
    generateCurrentFEN(activeColor) {
        let rows = [];
        const typeMap = { 'pawn': 'p', 'knight': 'n', 'bishop': 'b', 'rook': 'r', 'queen': 'q', 'king': 'k' };

        for (let r = 0; r < 8; r++) {
            let rowStr = "", empty = 0;
            for (let c = 0; c < 8; c++) {
                const p = this.board.getPiece(r, c);
                if (!p) empty++;
                else {
                    if (empty > 0) { rowStr += empty; empty = 0; }
                    let char = typeMap[p.type] || 'p';
                    rowStr += p.color === 'white' ? char.toUpperCase() : char.toLowerCase();
                }
            }
            if (empty > 0) rowStr += empty;
            rows.push(rowStr);
        }
        const turn = activeColor === 'white' ? 'w' : 'b';
        return `${rows.join('/')} ${turn} - - 0 1`;
    }

    isMoveValid(piece, fromRow, fromCol, toRow, toCol) {
        const moves = this.getPossibleMoves(piece, fromRow, fromCol);
        return moves.some(m => m.row === toRow && m.col === toCol);
    }
}

// Exposition immédiate et globale
window.MoveValidator = MoveValidator;

// Initialisation statique
MoveValidator.init();