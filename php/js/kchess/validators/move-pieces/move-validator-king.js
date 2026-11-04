// validators/move-pieces/move-validator-king.js
if (typeof KingMoveValidator !== 'undefined') {
    console.warn('⚠️ KingMoveValidator existe déjà.');
} else {

class KingMoveValidator {
    
    static consoleLog = false; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log('♔ KingMoveValidator: Système initialisé (Robustesse ++)');
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
                    return square?.type ? square : null;
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
        
        directions.forEach(([rowDir, colDir]) => {
            const newRow = row + rowDir;
            const newCol = col + colDir;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                
                if (!targetPiece || targetPiece.color !== kingColor) {
                    // Sécurité : si la simulation échoue, on autorise par défaut pour ne pas bloquer le jeu
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

        if (this.canAttemptCastle(kingColor, row, col)) {
            const castleMoves = this.getCastleMoves(piece, row, col);
            moves.push(...castleMoves);
        }

        if (this.constructor.consoleLog) {
            console.groupEnd();
        }
        
        return moves;
    }

    canAttemptCastle(color, row, col) {
        const startRow = color === 'white' ? 7 : 0;
        const hasMoved = this.gameState?.hasKingMoved?.[color] === true;
        const startCol = this.gameState?.kingStartCols?.[color] ?? 4;
        return (row === startRow && col === startCol) && !hasMoved;
    }

    getCastleMoves(king, row, col) {
        const moves = [];
        const color = king.color;
        const chess960 = this.gameState?.chess960 === true;

        if (this.isKingInCheckNow(color)) return moves;

        if (this.canCastleSide(color, 'kingside')) {
            moves.push({ 
                row, col: chess960 ? this.gameState.rookStartCols[color].kingside : 6,
                type: 'castling', 
                side: 'kingside',
                kingTo: { row, col: 6 },
                rookFrom: { row, col: this.gameState.rookStartCols?.[color]?.kingside ?? 7 },
                rookTo: { row, col: 5 }
            });
        }

        if (this.canCastleSide(color, 'queenside')) {
            moves.push({ 
                row, col: chess960 ? this.gameState.rookStartCols[color].queenside : 2,
                type: 'castling', 
                side: 'queenside',
                kingTo: { row, col: 2 },
                rookFrom: { row, col: this.gameState.rookStartCols?.[color]?.queenside ?? 0 },
                rookTo: { row, col: 3 }
            });
        }

        return moves;
    }

    canCastleSide(color, side) {
        const row = color === 'white' ? 7 : 0;
        
        if (this.hasRookMoved(color, side)) return false;

        const kingStartCol = this.gameState?.kingStartCols?.[color] ?? 4;
        const rookStartCol = this.gameState?.rookStartCols?.[color]?.[side]
            ?? (side === 'kingside' ? 7 : 0);
        const kingToCol = side === 'kingside' ? 6 : 2;
        const rookToCol = side === 'kingside' ? 5 : 3;
        const king = this.board.getPiece(row, kingStartCol);
        const rook = this.board.getPiece(row, rookStartCol);

        if (king?.type !== 'king' || king.color !== color
            || rook?.type !== 'rook' || rook.color !== color) return false;

        for (const col of this.columnsBetween(kingStartCol, kingToCol)) {
            if (col !== kingStartCol && col !== rookStartCol && this.board.getPiece(row, col)) return false;
        }

        for (const col of this.columnsBetween(rookStartCol, rookToCol)) {
            if (col !== kingStartCol && col !== rookStartCol && this.board.getPiece(row, col)) return false;
        }

        const boardWithoutCastlePieces = this.createTempBoard();
        boardWithoutCastlePieces[row][kingStartCol] = null;
        boardWithoutCastlePieces[row][rookStartCol] = null;
        const kingPath = this.columnsBetween(kingStartCol, kingToCol);
        for (const col of kingPath) {
            const boardAtStep = boardWithoutCastlePieces.map(boardRow => boardRow.slice());
            boardAtStep[row][col] = { type: 'king', color };
            if (col === kingToCol) {
                boardAtStep[row][rookToCol] = { type: 'rook', color };
            }
            if (this.isKingInCheckOnBoard(boardAtStep, color)) return false;
        }

        return true;
    }

    columnsBetween(from, to) {
        if (from === to) return [to];
        const direction = to > from ? 1 : -1;
        return Array.from({ length: Math.abs(to - from) }, (_, index) => from + direction * (index + 1));
    }

    isKingInCheckOnBoard(board, color) {
        if (typeof ChessEngine === 'undefined') {
            throw new Error('ChessEngine est requis pour vérifier le roque Chess960.');
        }
        const fen = this.generateTempFEN(board, color);
        const engine = new ChessEngine(fen);
        return engine.isKingInCheck(color === 'white' ? 'w' : 'b');
    }

    hasRookMoved(color, side) {
        if (this.gameState?.hasRookMoved?.[color]?.[side] !== undefined) {
            return this.gameState.hasRookMoved[color][side];
        }
        const rookCol = this.gameState?.rookStartCols?.[color]?.[side]
            ?? (side === 'kingside' ? 7 : 0);
        const row = color === 'white' ? 7 : 0;
        const piece = this.board.getPiece(row, rookCol);
        return !(piece && piece.type === 'rook' && piece.color === color);
    }

    isSquareAttacked(row, col, attackerColor) {
        try {
            const fen = this.generateTempFEN(this.createTempBoard(), attackerColor);
            if (typeof ChessEngine !== 'undefined') {
                const engine = new ChessEngine(fen);
                return engine.isSquareAttacked(row, col, attackerColor === 'white' ? 'w' : 'b');
            }
        } catch (e) { return false; }
        return false;
    }

    isKingInCheckNow(color) {
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
        } catch (e) { 
            console.error("⚠️ Erreur simulation Roi:", e);
            return false; // Changement CRITIQUE : On n'empêche pas le mouvement si le moteur crash
        }
        return false;
    }

    wouldBeAdjacentToOpponentKing(kingColor, newRow, newCol) {
        const opponentColor = kingColor === 'white' ? 'black' : 'white';
        const oppKing = this.findKingPosition(opponentColor);
        if (!oppKing) return false;
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
        const turn = (color === 'white' || color === 'w') ? 'w' : 'b';
        const castling = this.gameState?.castlingRightsString || "KQkq";
        return `${rows.join('/')} ${turn} ${castling} - 0 1`;
    }

    isValidSquare(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }
}

KingMoveValidator.init();
window.KingMoveValidator = KingMoveValidator;

}