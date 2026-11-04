// validators/move-pieces/move-validator-knight.js
if (typeof KnightMoveValidator !== 'undefined') {
    console.warn('⚠️ KnightMoveValidator existe déjà.');
} else {

class KnightMoveValidator {
    
    static consoleLog = false; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('🐴 KnightMoveValidator: Système initialisé (Sauts en L)');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine) {
                this.consoleLog = window.appConfig.chess_engine.console_log ?? true;
            } else if (window.chessConfig) {
                this.consoleLog = window.chessConfig.debug ?? true;
            }
        } catch (error) {
            this.consoleLog = true;
        }
    }

    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;

        // --- PONT DE COMPATIBILITÉ ---
        if (this.board && !this.board.getPiece) {
            this.board.getPiece = (r, c) => {
                if (typeof this.board.getSquare === 'function') {
                    const square = this.board.getSquare(r, c);
                    return square?.type ? square : null;
                }
                return null;
            };
        }
    }

    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.group(`\n🐴🔍 Analyse Cavalier ${piece.color} en [${row},${col}]`);
        }

        const rawMoves = [];
        const knightOffsets = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];

        const pieceColor = piece.color;

        knightOffsets.forEach(([rowOffset, colOffset]) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                if (!targetPiece || targetPiece.color !== pieceColor) {
                    rawMoves.push({ 
                        row: newRow, 
                        col: newCol, 
                        type: targetPiece ? 'capture' : 'move'
                    });
                }
            }
        });

        // FILTRAGE : Un cavalier ne peut pas bouger s'il est cloué
        const validMoves = rawMoves.filter(move => {
            return !this.wouldKingBeInCheckAfterMove(pieceColor, row, col, move.row, move.col);
        });

        if (this.constructor.consoleLog) {
            console.log(`🐴 Résultat: ${validMoves.length} valides.`);
            console.groupEnd();
        }
        
        return validMoves;
    }

    /**
     * Simulation améliorée pour éviter l'arrêt injustifié (Bug ID #3)
     */
    wouldKingBeInCheckAfterMove(pieceColor, fromRow, fromCol, toRow, toCol) {
        try {
            const tempBoard = this.createTempBoard();
            const knight = tempBoard[fromRow][fromCol];
            
            // Simulation du déplacement
            tempBoard[toRow][toCol] = knight;
            tempBoard[fromRow][fromCol] = null;
            
            const tempFEN = this.generateTempFEN(tempBoard, pieceColor);
            
            if (typeof ChessEngine !== 'undefined') {
                const engine = new ChessEngine(tempFEN);
                const colorCode = pieceColor === 'white' ? 'w' : 'b';
                return engine.isKingInCheck(colorCode);
            }
            return false;
        } catch (error) {
            // CRITIQUE : Si la simulation échoue, on ne bloque PAS le coup.
            // C'est ce qui causait l'arrêt injustifié.
            console.error("⚠️ Erreur simulation Cavalier:", error);
            return false; 
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

    generateTempFEN(tempBoard, currentPlayer) {
        let fenRows = [];
        const typeMap = { 'pawn': 'p', 'knight': 'n', 'bishop': 'b', 'rook': 'r', 'queen': 'q', 'king': 'k' };

        for (let r = 0; r < 8; r++) {
            let rowStr = "", empty = 0;
            for (let c = 0; c < 8; c++) {
                const p = tempBoard[r][c];
                if (!p) empty++;
                else {
                    if (empty > 0) { rowStr += empty; empty = 0; }
                    let code = typeMap[p.type] || 'p';
                    rowStr += p.color === 'white' ? code.toUpperCase() : code.toLowerCase();
                }
            }
            if (empty > 0) rowStr += empty;
            fenRows.push(rowStr);
        }
        const turn = currentPlayer === 'white' ? 'w' : 'b';
        
        // Récupération des droits de roque réels pour plus de précision
        const castling = this.gameState?.castlingRightsString || "KQkq";
        
        return `${fenRows.join('/')} ${turn} ${castling} - 0 1`;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

KnightMoveValidator.init();
window.KnightMoveValidator = KnightMoveValidator;

}