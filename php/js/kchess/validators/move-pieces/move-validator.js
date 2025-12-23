// validators/move-pieces/move-validator.js
if (typeof MoveValidator !== 'undefined') {
    console.warn('⚠️ MoveValidator existe déjà. Vérifiez les doublons dans les imports.');
} else {

class MoveValidator {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('✅ MoveValidator (Master) : Système de coordination prêt');
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
        this.enPassantTarget = null;
        
        // --- PONT DE COMPATIBILITÉ BOARD ---
        if (this.board && !this.board.getPiece) {
            this.board.getPiece = (r, c) => {
                if (typeof this.board.getSquare === 'function') {
                    const square = this.board.getSquare(r, c);
                    return square ? square.piece : null;
                }
                return (this.board[r] && this.board[r][c]) ? this.board[r][c] : null;
            };
        }

        this.initializePieceValidators();
        
        if (this.constructor.consoleLog) {
            console.log('🔧 Master MoveValidator initialisé (Architecture modulaire)');
        }
    }

    /**
     * Instancie les validateurs spécifiques
     */
    initializePieceValidators() {
        const params = [this.board, this.gameState];
        
        this.pieceValidators = {
            'pawn':   typeof PawnMoveValidator !== 'undefined'   ? new PawnMoveValidator(...params)   : null,
            'knight': typeof KnightMoveValidator !== 'undefined' ? new KnightMoveValidator(...params) : null,
            'bishop': typeof BishopMoveValidator !== 'undefined' ? new BishopMoveValidator(...params) : null,
            'rook':   typeof RookMoveValidator !== 'undefined'   ? new RookMoveValidator(...params)   : null,
            'queen':  typeof QueenMoveValidator !== 'undefined'  ? new QueenMoveValidator(...params)  : null,
            'king':   typeof KingMoveValidator !== 'undefined'   ? new KingMoveValidator(...params)   : null
        };

        if (this.constructor.consoleLog) {
            const active = Object.keys(this.pieceValidators).filter(k => this.pieceValidators[k]);
            const missing = Object.keys(this.pieceValidators).filter(k => !this.pieceValidators[k]);
            console.log(`📦 Validateurs chargés: ${active.join(', ')}`);
            if (missing.length > 0) console.warn(`⚠️ Validateurs manquants: ${missing.join(', ')}`);
        }
    }

    /**
     * Point d'entrée principal pour l'UI
     * Récupère TOUS les coups valides pour une pièce donnée
     */
    getPossibleMoves(piece, fromRow, fromCol) {
        // Sécurité si l'objet pièce n'est pas passé
        if (!piece || !piece.type) {
            piece = this.board.getPiece(fromRow, fromCol);
        }

        if (!piece || !piece.type) return [];

        const validator = this.pieceValidators[piece.type];
        if (!validator) {
            console.error(`❌ Aucun validateur trouvé pour le type: ${piece.type}`);
            return [];
        }
        
        // Délégation au validateur spécifique
        return validator.getPossibleMoves(piece, fromRow, fromCol);
    }

    /**
     * Vérifie si le roi d'une couleur donnée est actuellement attaqué
     */
    isKingInCheck(color) {
        // 1. Localiser le roi sur le plateau
        let kingPos = null;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board.getPiece(r, c);
                if (p && p.type === 'king' && p.color === color) {
                    kingPos = { r, c };
                    break;
                }
            }
            if (kingPos) break;
        }

        if (!kingPos) return false;

        // 2. Vérifier si une pièce adverse peut capturer sur cette case
        const opponentColor = (color === 'white') ? 'black' : 'white';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board.getPiece(r, c);
                if (p && p.color === opponentColor) {
                    const validator = this.pieceValidators[p.type];
                    if (validator) {
                        // On vérifie les coups possibles de l'adversaire
                        const moves = validator.getPossibleMoves(p, r, c);
                        if (moves.some(m => m.row === kingPos.r && m.col === kingPos.c)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * Met à jour la cible "En Passant" après un double pas de pion
     */
    updateEnPassantTarget(move, piece) {
        if (piece?.type === 'pawn' && move.isDoublePush) {
            const direction = piece.color === 'white' ? 1 : -1;
            this.enPassantTarget = {
                row: move.row + direction, 
                col: move.col
            };
            if (this.constructor.consoleLog) console.log("♟️ Cible En Passant active en:", this.enPassantTarget);
        } else {
            this.enPassantTarget = null;
        }
    }

    /**
     * Logique de nettoyage pour la capture en passant
     */
    executeEnPassant(move) {
        if (move.type === 'en-passant') {
            const capRow = move.capturedPawn?.row;
            const capCol = move.capturedPawn?.col;
            
            if (capRow !== undefined && capCol !== undefined) {
                const square = this.board.getSquare ? this.board.getSquare(capRow, capCol) : null;
                if (square) {
                    square.piece = null;
                    if (square.element) square.element.innerHTML = '';
                    if (this.constructor.consoleLog) console.log(`🔪 Capture En Passant en [${capRow},${capCol}]`);
                }
            }
        }
    }

    /**
     * Méthode utilitaire rapide pour l'UI (booléen)
     */
    isMoveValid(piece, fromRow, fromCol, toRow, toCol) {
        const moves = this.getPossibleMoves(piece, fromRow, fromCol);
        return moves.some(m => m.row === toRow && m.col === toCol);
    }
}

MoveValidator.init();
window.MoveValidator = MoveValidator;

}