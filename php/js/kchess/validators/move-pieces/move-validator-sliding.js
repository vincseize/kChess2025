// validators/move-pieces/move-validator-sliding.js
if (typeof SlidingMoveValidator !== 'undefined') {
    console.warn('⚠️ SlidingMoveValidator existe déjà.');
} else {

class SlidingMoveValidator {
    
    static consoleLog = true;
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('📏 SlidingMoveValidator: Moteur de balayage initialisé');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine) {
                this.consoleLog = window.appConfig.chess_engine.console_log ?? true;
            }
        } catch (e) { this.consoleLog = true; }
    }

    constructor(board) {
        this.board = board;

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

    /**
     * Calcule les mouvements pour plusieurs directions (ex: [[1,0], [-1,0]])
     * @param {Object} piece - L'objet pièce (color, type)
     * @param {number} row - Ligne actuelle
     * @param {number} col - Colonne actuelle
     * @param {Array} directions - Tableau de directions [[r, c], ...]
     */
    getSlidingMoves(piece, row, col, directions) {
        if (this.constructor.consoleLog) {
            console.group(`📏🔍 Balayage : ${piece.type} ${piece.color} en [${row},${col}]`);
        }
        
        const allMoves = [];
        
        directions.forEach(([rowDir, colDir]) => {
            const directionMoves = this.addSlidingMoves(piece, row, col, rowDir, colDir);
            allMoves.push(...directionMoves);
        });

        if (this.constructor.consoleLog) {
            console.log(`📏 Total trouvé : ${allMoves.length} mouvements physiques`);
            console.groupEnd();
        }
        
        return allMoves;
    }

    /**
     * Explore une ligne/diagonale jusqu'à un obstacle
     */
    addSlidingMoves(piece, startRow, startCol, rowDir, colDir) {
        const directionMoves = [];
        let r = startRow + rowDir;
        let c = startCol + colDir;

        while (this.isValidSquare(r, c)) {
            const target = this.board.getPiece(r, c);
            
            if (!target) {
                // Case vide : on continue le balayage
                directionMoves.push({ row: r, col: c, type: 'move' });
            } else {
                // Obstacle rencontré : on s'arrête après avoir vérifié la capture
                if (target.color !== piece.color) {
                    // Capture possible
                    directionMoves.push({ row: r, col: c, type: 'capture' });
                }
                break; 
            }
            r += rowDir;
            c += colDir;
        }
        return directionMoves;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    /**
     * Analyse avancée pour le debug (distances, bloqueurs spécifiques)
     */
    checkLine(piece, startRow, startCol, rowDir, colDir) {
        const lineInfo = { squares: [], blockedBy: null, canCapture: false };
        let r = startRow + rowDir;
        let c = startCol + colDir;
        let distance = 1;

        while (this.isValidSquare(r, c)) {
            const target = this.board.getPiece(r, c);
            lineInfo.squares.push({ row: r, col: c, distance });

            if (target) {
                lineInfo.canCapture = (target.color !== piece.color);
                lineInfo.blockedBy = { 
                    type: target.color === piece.color ? 'ally' : 'enemy', 
                    piece: target, 
                    distance 
                };
                break;
            }
            r += rowDir;
            c += colDir;
            distance++;
        }
        return lineInfo;
    }
}

SlidingMoveValidator.init();
window.SlidingMoveValidator = SlidingMoveValidator;

}