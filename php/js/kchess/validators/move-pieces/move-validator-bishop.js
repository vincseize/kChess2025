// validators/move-pieces/move-validator-bishop.js
if (typeof BishopMoveValidator !== 'undefined') {
    console.warn('⚠️ BishopMoveValidator existe déjà.');
} else {

class BishopMoveValidator {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('📐 BishopMoveValidator: Système de balayage diagonal initialisé');
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
     * Calcule tous les mouvements diagonaux possibles pour le Fou
     */
    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.group(`\n📐🔍 Analyse Fou ${piece.color} en [${row},${col}]`);
        }

        const moves = [];
        const directions = [
            { r: -1, c: -1, label: 'Haut-Gauche ↖️' },
            { r: -1, c: 1,  label: 'Haut-Droite ↗️' },
            { r: 1,  c: -1, label: 'Bas-Gauche ↙️' },
            { r: 1,  c: 1,  label: 'Bas-Droite ↘️' }
        ];

        const pieceColor = piece.color;

        directions.forEach(dir => {
            let nextR = row + dir.r;
            let nextC = col + dir.c;

            // Le Fou continue tant qu'il est sur l'échiquier et ne rencontre pas d'obstacle
            while (this.isValidSquare(nextR, nextC)) {
                const targetPiece = this.board.getPiece(nextR, nextC);

                if (!targetPiece) {
                    // Case vide : mouvement possible
                    if (this.isSafeMove(pieceColor, row, col, nextR, nextC)) {
                        moves.push({ row: nextR, col: nextC, type: 'move' });
                    }
                } else {
                    // Case occupée : capture possible si couleur opposée
                    if (targetPiece.color !== pieceColor) {
                        if (this.isSafeMove(pieceColor, row, col, nextR, nextC)) {
                            moves.push({ row: nextR, col: nextC, type: 'capture' });
                        }
                    }
                    // Dans tous les cas, une pièce bloque le chemin du Fou
                    break; 
                }
                nextR += dir.r;
                nextC += dir.c;
            }
        });

        if (this.constructor.consoleLog) {
            console.log(`📐 Fin d'analyse : ${moves.length} coups valides.`);
            console.groupEnd();
        }
        return moves;
    }

    /**
     * Vérifie si le mouvement ne met pas (ou ne laisse pas) le roi en échec
     */
    isSafeMove(color, fromR, fromC, toR, toC) {
        try {
            const tempBoard = this.createTempBoard();
            const piece = tempBoard[fromR][fromC];
            
            // Simulation du coup
            tempBoard[toR][toC] = piece;
            tempBoard[fromR][fromC] = null;

            const fen = this.generateTempFEN(tempBoard, color);
            
            if (typeof ChessEngine !== 'undefined') {
                const engine = new ChessEngine(fen);
                return !engine.isKingInCheck(color === 'white' ? 'w' : 'b');
            }
            return true; 
        } catch (e) {
            console.error("Erreur simulation Fou:", e);
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

    generateTempFEN(board, color) {
        let rows = [];
        const typeMap = {
            'pawn': 'p', 'knight': 'n', 'bishop': 'b', 
            'rook': 'r', 'queen': 'q', 'king': 'k'
        };

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
        const turn = (color === 'white' || color === 'w') ? 'w' : 'b';
        return `${rows.join('/')} ${turn} - - 0 1`;
    }

    isValidSquare(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }
}

BishopMoveValidator.init();
window.BishopMoveValidator = BishopMoveValidator;

}