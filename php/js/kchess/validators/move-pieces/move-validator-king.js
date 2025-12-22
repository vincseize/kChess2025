// validators/move-pieces/move-validator-king.js
if (typeof KingMoveValidator !== 'undefined') {
    console.warn('⚠️ KingMoveValidator existe déjà.');
} else {

class KingMoveValidator {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('♔ KingMoveValidator: Système initialisé (Mouvements + Roque)');
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
            console.group(`\n♔🔍 Analyse Roi ${piece.color} en [${row},${col}]`);
        }

        const moves = [];
        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];

        const kingColor = piece.color;
        
        // 1. MOUVEMENTS STANDARDS (1 case autour)
        directions.forEach(([rowDir, colDir]) => {
            const newRow = row + rowDir;
            const newCol = col + colDir;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                
                // On ne peut pas capturer sa propre couleur
                if (!targetPiece || targetPiece.color !== kingColor) {
                    
                    // Simulations de sécurité
                    const putsInCheck = this.wouldBeInCheck(kingColor, row, col, newRow, newCol);
                    const tooCloseToKing = this.wouldBeAdjacentToOpponentKing(kingColor, newRow, newCol);

                    if (!putsInCheck && !tooCloseToKing) {
                        moves.push({ 
                            row: newRow, 
                            col: newCol, 
                            type: targetPiece ? 'capture' : 'move' 
                        });
                    }
                }
            }
        });

        // 2. LOGIQUE DU ROQUE
        if (this.canAttemptCastle(kingColor, row, col)) {
            const castleMoves = this.getCastleMoves(piece, row, col);
            moves.push(...castleMoves);
        }

        if (this.constructor.consoleLog) {
            console.log(`✅ Total: ${moves.length} mouvements possibles.`);
            console.groupEnd();
        }
        
        return moves;
    }

    // --- LOGIQUE DU ROQUE ---

    canAttemptCastle(color, row, col) {
        const startRow = color === 'white' ? 7 : 0;
        // Le Roi ne doit jamais avoir bougé
        const hasMoved = this.gameState?.hasKingMoved?.[color] === true;
        const isAtStart = (row === startRow && col === 4);
        
        return isAtStart && !hasMoved;
    }

    getCastleMoves(king, row, col) {
        const moves = [];
        const color = king.color;

        // On ne peut pas roquer si on est actuellement en échec
        if (this.isKingInCheckNow(color)) return moves;

        // Petit Roque (Kingside)
        if (this.canCastleSide(color, 'kingside')) {
            moves.push({ 
                row, col: 6, 
                type: 'castling', // Changé de 'castle' à 'castling' pour MoveExecutor
                side: 'kingside',
                rookFrom: { row, col: 7 },
                rookTo: { row, col: 5 }
            });
        }

        // Grand Roque (Queenside)
        if (this.canCastleSide(color, 'queenside')) {
            moves.push({ 
                row, col: 2, 
                type: 'castling', 
                side: 'queenside',
                rookFrom: { row, col: 0 },
                rookTo: { row, col: 3 }
            });
        }

        return moves;
    }

    canCastleSide(color, side) {
        const row = color === 'white' ? 7 : 0;
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        // 1. La tour doit être présente et ne pas avoir bougé
        if (this.hasRookMoved(color, side)) return false;

        // 2. Le chemin doit être vide
        const emptyCols = side === 'kingside' ? [5, 6] : [1, 2, 3];
        for (let c of emptyCols) {
            if (this.board.getPiece(row, c)) return false;
        }

        // 3. Le Roi ne doit pas traverser une case attaquée
        // 
        const pathCols = side === 'kingside' ? [5, 6] : [3, 2];
        for (let c of pathCols) {
            if (this.isSquareAttacked(row, c, opponentColor)) return false;
        }

        return true;
    }

    hasRookMoved(color, side) {
        // Priorité aux flags du GameState
        if (this.gameState?.hasRookMoved?.[color]?.[side] !== undefined) {
            return this.gameState.hasRookMoved[color][side];
        }
        // Fallback : vérification physique de la tour
        const rookCol = side === 'kingside' ? 7 : 0;
        const row = color === 'white' ? 7 : 0;
        const piece = this.board.getPiece(row, rookCol);
        return !(piece && piece.type === 'rook' && piece.color === color);
    }

    // --- SIMULATIONS ET MOTEUR ---

    isSquareAttacked(row, col, attackerColor) {
        try {
            // On génère une FEN du plateau actuel pour que le ChessEngine vérifie la case
            const fen = this.generateTempFEN(this.createTempBoard(), attackerColor);
            if (typeof ChessEngine !== 'undefined') {
                const engine = new ChessEngine(fen);
                return engine.isSquareAttacked(row, col, attackerColor === 'white' ? 'w' : 'b');
            }
        } catch (e) { return false; }
        return false;
    }

    isKingInCheckNow(color) {
        // Simulation sans mouvement (0,0,0,0) pour voir l'état actuel
        return this.wouldBeInCheck(color, 0, 0, 0, 0, true); 
    }

    wouldBeInCheck(kingColor, fromRow, fromCol, toRow, toCol, isStaticCheck = false) {
        try {
            const tempBoard = this.createTempBoard();
            if (!isStaticCheck) {
                tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
                tempBoard[fromRow][fromCol] = null;
            }

            const tempFEN = this.generateTempFEN(tempBoard, kingColor);
            if (typeof ChessEngine !== 'undefined') {
                const engine = new ChessEngine(tempFEN);
                return engine.isKingInCheck(kingColor === 'white' ? 'w' : 'b');
            }
        } catch (e) { return true; }
        return false;
    }

    wouldBeAdjacentToOpponentKing(kingColor, newRow, newCol) {
        const opponentColor = kingColor === 'white' ? 'black' : 'white';
        const oppKing = this.findKingPosition(opponentColor);
        if (!oppKing) return false;
        // Règle : Les deux rois ne peuvent jamais être sur des cases adjacentes
        return Math.abs(newRow - oppKing.row) <= 1 && Math.abs(newCol - oppKing.col) <= 1;
    }

    findKingPosition(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board.getPiece(r, c);
                if (p && p.type === 'king' && p.color === color) return { row: r, col: c };
            }
        }
        return null;
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

KingMoveValidator.init();
window.KingMoveValidator = KingMoveValidator;

}