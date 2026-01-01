// validators/move-pieces/move-validator-pawn.js
if (typeof PawnMoveValidator !== 'undefined') {
    console.warn('⚠️ PawnMoveValidator existe déjà.');
} else {

class PawnMoveValidator {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('♟️ PawnMoveValidator: Système initialisé (Prise en passant incluse)');
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

        if (this.board && !this.board.getPiece) {
            this.board.getPiece = (r, c) => {
                if (typeof this.board.getSquare === 'function') {
                    const square = this.board.getSquare(r, c);
                    return square ? square.piece : null;
                }
                return null;
            };
        }
    }

    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.group(`\n♟️🔍 Analyse Pion ${piece.color} en [${row},${col}]`);
        }

        const rawMoves = [];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        const promotionRow = piece.color === 'white' ? 0 : 7;
        const pieceColor = piece.color;

        // 1. AVANCE SIMPLE ET DOUBLE
        const forwardRow = row + direction;
        if (this.isValidSquare(forwardRow, col) && !this.board.getPiece(forwardRow, col)) {
            rawMoves.push({ row: forwardRow, col: col, type: 'move', isPromotion: forwardRow === promotionRow });

            const doubleForwardRow = row + (2 * direction);
            if (row === startRow && this.isValidSquare(doubleForwardRow, col) && !this.board.getPiece(doubleForwardRow, col)) {
                rawMoves.push({ row: doubleForwardRow, col: col, type: 'move', isDoublePush: true });
            }
        }

        // 2. CAPTURES DIAGONALES
        [1, -1].forEach(colOffset => {
            const targetRow = row + direction;
            const targetCol = col + colOffset;
            
            if (this.isValidSquare(targetRow, targetCol)) {
                const targetPiece = this.board.getPiece(targetRow, targetCol);
                if (targetPiece && targetPiece.color !== pieceColor) {
                    rawMoves.push({ 
                        row: targetRow, col: targetCol, 
                        type: 'capture', 
                        isPromotion: targetRow === promotionRow 
                    });
                }
            }
        });

        // 3. PRISE EN PASSANT
        const epRow = piece.color === 'white' ? 3 : 4;
        if (row === epRow) {
            [1, -1].forEach(colOffset => {
                const targetCol = col + colOffset;
                if (this.isValidSquare(row, targetCol)) {
                    if (this.isEnPassantPossible(row, targetCol, pieceColor)) {
                        rawMoves.push({
                            row: row + direction,
                            col: targetCol,
                            type: 'en-passant',
                            capturedPawn: { row: row, col: targetCol }
                        });
                    }
                }
            });
        }

        // 4. FILTRAGE
        const validMoves = rawMoves.filter(move => {
            return !this.wouldKingBeInCheckAfterMove(pieceColor, row, col, move);
        });

        if (this.constructor.consoleLog) {
            console.groupEnd();
        }
        
        return validMoves;
    }

    isEnPassantPossible(row, targetCol, attackerColor) {
        const history = this.gameState?.moveHistory || [];
        if (history.length === 0) return false;

        const lastMove = history[history.length - 1];
        if (!lastMove) return false;
        
        const pieceType = (typeof lastMove.piece === 'object') ? lastMove.piece.type : lastMove.piece;
        
        return pieceType === 'pawn' && 
               Math.abs(lastMove.from.row - lastMove.to.row) === 2 && 
               lastMove.to.row === row && 
               lastMove.to.col === targetCol && 
               lastMove.color !== attackerColor;
    }

    wouldKingBeInCheckAfterMove(pieceColor, fromRow, fromCol, move) {
        try {
            const tempBoard = this.createTempBoard();
            const movingPiece = tempBoard[fromRow][fromCol];
            if (!movingPiece) return false; 

            tempBoard[move.row][move.col] = movingPiece;
            tempBoard[fromRow][fromCol] = null;

            if (move.type === 'en-passant' && move.capturedPawn) {
                tempBoard[move.capturedPawn.row][move.capturedPawn.col] = null;
            }

            const tempFEN = this.generateTempFEN(tempBoard, pieceColor);
            
            if (typeof ChessEngine !== 'undefined') {
                const engine = new ChessEngine(tempFEN);
                return engine.isKingInCheck(pieceColor === 'white' ? 'w' : 'b');
            }
            return false;
        } catch (e) {
            console.error("⚠️ Erreur simulation Pion:", e);
            return false; // Fail-safe : on autorise le coup
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

    generateTempFEN(board, currentPlayer) {
        let rows = [];
        const pieceChars = { 'king': 'k', 'queen': 'q', 'rook': 'r', 'bishop': 'b', 'knight': 'n', 'pawn': 'p' };

        for (let r = 0; r < 8; r++) {
            let rowStr = "", empty = 0;
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p) empty++;
                else {
                    if (empty > 0) { rowStr += empty; empty = 0; }
                    let char = pieceChars[p.type] || 'p';
                    rowStr += (p.color === 'white') ? char.toUpperCase() : char;
                }
            }
            if (empty > 0) rowStr += empty;
            rows.push(rowStr);
        }
        const turn = currentPlayer === 'white' ? 'w' : 'b';
        const castling = this.gameState?.castlingRightsString || "KQkq";
        // On omet volontairement la cible en passant ici pour simplifier la validation d'échec
        return `${rows.join('/')} ${turn} ${castling} - 0 1`;
    }

    isValidSquare(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }
}

PawnMoveValidator.init();
window.PawnMoveValidator = PawnMoveValidator;

}