// validators/move-pieces/move-validator-rook.js
if (typeof RookMoveValidator !== 'undefined') {
    console.warn('⚠️ RookMoveValidator existe déjà.');
} else {

class RookMoveValidator {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('🏰 RookMoveValidator: Système initialisé (Mouvements orthogonaux)');
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
            { r: 1,  c: 0 },  // Bas
            { r: -1, c: 0 },  // Haut
            { r: 0,  c: 1 },  // Droite
            { r: 0,  c: -1 }  // Gauche
        ];

        // 1. Calcul des mouvements coulissants physiques
        directions.forEach(dir => {
            this.addSlidingMoves(moves, piece, row, col, dir.r, dir.c);
        });

        // 2. Filtrage par simulation (Protection du Roi / Clouage)
        const validMoves = moves.filter(move => {
            return !this.wouldKingBeInCheckAfterMove(piece.color, row, col, move.row, move.col);
        });

        if (this.constructor.consoleLog) {
            console.log(`🏰 Résultat: ${validMoves.length} valides sur ${moves.length} physiques.`);
            console.groupEnd();
        }
        
        return validMoves;
    }

    /**
     * Parcourt une direction jusqu'à rencontrer un obstacle ou le bord du plateau
     */
    addSlidingMoves(moves, piece, startRow, startCol, rowDir, colDir) {
        let row = startRow + rowDir;
        let col = startCol + colDir;

        while (this.isValidSquare(row, col)) {
            const targetPiece = this.board.getPiece(row, col);
            
            if (!targetPiece) {
                // Case vide
                moves.push({ row, col, type: 'move' });
            } else {
                // Case occupée : capture possible si couleur différente
                if (targetPiece.color !== piece.color) {
                    moves.push({ row, col, type: 'capture' });
                }
                // Une pièce bloque toujours le passage, qu'elle soit amie ou ennemie
                break; 
            }
            row += rowDir;
            col += colDir;
        }
    }

    /**
     * Vérifie si le déplacement laisse le Roi en échec (ex: pièce clouée)
     */
    wouldKingBeInCheckAfterMove(pieceColor, fromRow, fromCol, toRow, toCol) {
        try {
            const tempBoard = this.createTempBoard();
            const movingPiece = tempBoard[fromRow][fromCol];
            if (!movingPiece) return false;

            // Simulation du mouvement
            tempBoard[toRow][toCol] = movingPiece;
            tempBoard[fromRow][fromCol] = null;
            
            const tempFEN = this.generateTempFEN(tempBoard, pieceColor);
            
            if (typeof ChessEngine !== 'undefined') {
                const engine = new ChessEngine(tempFEN);
                return engine.isKingInCheck(pieceColor === 'white' ? 'w' : 'b');
            }
            return false;
        } catch (error) {
            return true; 
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
                if (!p) {
                    empty++;
                } else {
                    if (empty > 0) { rowStr += empty; empty = 0; }
                    let code = typeMap[p.type] || 'p';
                    rowStr += p.color === 'white' ? code.toUpperCase() : code.toLowerCase();
                }
            }
            if (empty > 0) rowStr += empty;
            fenRows.push(rowStr);
        }
        const turn = currentPlayer === 'white' ? 'w' : 'b';
        return `${fenRows.join('/')} ${turn} - - 0 1`;
    }

    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

RookMoveValidator.init();
window.RookMoveValidator = RookMoveValidator;

}