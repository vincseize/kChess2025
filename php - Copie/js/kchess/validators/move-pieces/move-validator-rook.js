// validators/move-pieces/move-validator-rook.js
if (typeof RookMoveValidator !== 'undefined') {
    console.warn('⚠️ RookMoveValidator existe déjà.');
} else {

class RookMoveValidator {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('🏰 RookMoveValidator: Système initialisé (Robustesse Orthogonale)');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine) {
                this.consoleLog = window.appConfig.chess_engine.console_log ?? true;
            } else if (window.chessConfig) {
                this.consoleLog = window.chessConfig.debug ?? true;
            }
        } catch (error) { this.consoleLog = true; }
    }

    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;

        // --- PONT DE COMPATIBILITÉ ---
        if (this.board && !this.board.getPiece) {
            this.board.getPiece = (r, c) => {
                const square = this.board.getSquare ? this.board.getSquare(r, c) : null;
                return square ? square.piece : null;
            };
        }
    }

    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.group(`\n🏰🔍 Analyse Tour ${piece.color} en [${row},${col}]`);
        }
        
        const moves = [];
        const directions = [
            { r: 1,  c: 0 }, { r: -1, c: 0 }, // Vertical
            { r: 0,  c: 1 }, { r: 0,  c: -1 }  // Horizontal
        ];

        directions.forEach(dir => {
            let nextR = row + dir.r;
            let nextC = col + dir.c;

            while (this.isValidSquare(nextR, nextC)) {
                const targetPiece = this.board.getPiece(nextR, nextC);

                if (!targetPiece) {
                    // Case vide
                    if (this.isSafeMove(piece.color, row, col, nextR, nextC)) {
                        moves.push({ row: nextR, col: nextC, type: 'move' });
                    }
                } else {
                    // Case occupée
                    if (targetPiece.color !== piece.color) {
                        if (this.isSafeMove(piece.color, row, col, nextR, nextC)) {
                            moves.push({ row: nextR, col: nextC, type: 'capture' });
                        }
                    }
                    break; // Bloqué par une pièce
                }
                nextR += dir.r;
                nextC += dir.c;
            }
        });

        if (this.constructor.consoleLog) {
            console.log(`🏰 Résultat: ${moves.length} coups valides.`);
            console.groupEnd();
        }
        
        return moves;
    }

    /**
     * Alias de sécurité pour la simulation d'échec
     */
    isSafeMove(color, fromR, fromC, toR, toC) {
        try {
            const tempBoard = this.createTempBoard();
            const piece = tempBoard[fromR][fromC];
            if (!piece) return true;

            tempBoard[toR][toC] = piece;
            tempBoard[fromR][fromC] = null;

            const fen = this.generateTempFEN(tempBoard, color);
            
            if (typeof ChessEngine !== 'undefined') {
                const engine = new ChessEngine(fen);
                return !engine.isKingInCheck(color === 'white' ? 'w' : 'b');
            }
            return true; 
        } catch (e) {
            console.error("⚠️ Erreur simulation Tour:", e);
            return true; // FAIL-SAFE: On autorise le coup si le moteur de test crash
        }
    }

    createTempBoard() {
        const temp = Array(8).fill().map(() => Array(8).fill(null));
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board.getPiece(r, c);
                if (p) temp[r][c] = { type: p.type, color: p.color };
            }
        }
        return temp;
    }

    generateTempFEN(board, color) {
        let rows = [];
        const typeMap = { 'pawn': 'p', 'knight': 'n', 'bishop': 'b', 'rook': 'r', 'queen': 'q', 'king': 'k' };

        for (let r = 0; r < 8; r++) {
            let rowStr = "", empty = 0;
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
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
        const turn = (color === 'white') ? 'w' : 'b';
        const castling = this.gameState?.castlingRightsString || "KQkq";
        return `${rows.join('/')} ${turn} ${castling} - 0 1`;
    }

    isValidSquare(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }
}

RookMoveValidator.init();
window.RookMoveValidator = RookMoveValidator;

}