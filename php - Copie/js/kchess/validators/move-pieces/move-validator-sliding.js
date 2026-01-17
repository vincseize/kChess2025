// validators/move-pieces/move-validator-sliding.js
if (typeof SlidingMoveValidator !== 'undefined') {
    console.warn('⚠️ SlidingMoveValidator existe déjà.');
} else {

class SlidingMoveValidator {
    
    static consoleLog = false;
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('📏 SlidingMoveValidator: Moteur de balayage prêt (Standardisé)');
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine) {
                this.consoleLog = window.appConfig.chess_engine.console_log ?? true;
            } else if (window.chessConfig) {
                this.consoleLog = window.chessConfig.debug ?? true;
            }
        } catch (e) { this.consoleLog = true; }
    }

    constructor(board) {
        this.board = board;

        // --- PONT DE COMPATIBILITÉ ---
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
     * Calcule les mouvements pour plusieurs directions
     * Centralise la logique pour la Tour, le Fou et la Reine
     */
    getSlidingMoves(piece, row, col, directions) {
        if (!directions || !Array.isArray(directions)) return [];
        
        if (this.constructor.consoleLog) {
            console.group(`📏🔍 Balayage : ${piece.type} ${piece.color} en [${row},${col}]`);
        }
        
        const allMoves = [];
        
        for (const [rowDir, colDir] of directions) {
            const directionMoves = this.calculatePath(piece, row, col, rowDir, colDir);
            allMoves.push(...directionMoves);
        }

        if (this.constructor.consoleLog) {
            console.log(`📏 Total trouvé : ${allMoves.length} mouvements physiques`);
            console.groupEnd();
        }
        
        return allMoves;
    }

    /**
     * Explore une ligne/diagonale jusqu'à un obstacle
     * Renommé calculatePath pour plus de clarté sémantique
     */
    calculatePath(piece, startRow, startCol, rowDir, colDir) {
        const pathMoves = [];
        let r = startRow + rowDir;
        let c = startCol + colDir;

        while (this.isValidSquare(r, c)) {
            const target = this.board.getPiece(r, c);
            
            if (!target) {
                // Case vide
                pathMoves.push({ row: r, col: c, type: 'move' });
            } else {
                // Obstacle rencontré
                if (target.color !== piece.color) {
                    // Capture possible de la pièce ennemie
                    pathMoves.push({ row: r, col: c, type: 'capture' });
                }
                // Stop : On ne traverse jamais une pièce
                break; 
            }
            r += rowDir;
            c += colDir;
        }
        return pathMoves;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

SlidingMoveValidator.init();
window.SlidingMoveValidator = SlidingMoveValidator;

}