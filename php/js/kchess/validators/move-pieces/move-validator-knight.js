// validators/move-pieces/move-validator-knight.js
if (typeof KnightMoveValidator !== 'undefined') {
    console.warn('⚠️ KnightMoveValidator existe déjà.');
} else {

class KnightMoveValidator {
    
    static consoleLog = true; 
    
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

        // --- PONT DE COMPATIBILITÉ (INDISPENSABLE) ---
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
            console.group(`\n🐴🔍 Analyse Cavalier ${piece.color} en [${row},${col}]`);
        }

        const rawMoves = [];
        // Les 8 sauts possibles du cavalier
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
                
                // Le cavalier peut aller sur une case vide ou capturer un ennemi
                if (!targetPiece || targetPiece.color !== pieceColor) {
                    const moveType = targetPiece ? 'capture' : 'move';
                    rawMoves.push({ 
                        row: newRow, 
                        col: newCol, 
                        type: moveType
                    });
                }
            }
        });

        // FILTRAGE : Un cavalier ne peut pas bouger s'il est cloué devant son roi
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
     * Simulation pour vérifier si le mouvement expose le Roi
     */
    wouldKingBeInCheckAfterMove(pieceColor, fromRow, fromCol, toRow, toCol) {
        try {
            const tempBoard = this.createTempBoard();
            const knight = tempBoard[fromRow][fromCol];
            
            // On simule le déplacement sur un plateau fantôme
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
            return true; // En cas de doute, on bloque le mouvement
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
        const typeMap = {
            'pawn': 'p', 'knight': 'n', 'bishop': 'b', 
            'rook': 'r', 'queen': 'q', 'king': 'k'
        };

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
        // FEN simplifié pour la détection d'échec
        return `${fenRows.join('/')} ${turn} - - 0 1`;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

KnightMoveValidator.init();
window.KnightMoveValidator = KnightMoveValidator;

}