// check/checkChess.js - Moteur de vérification d'échec unifié
class ChessEngine {
    
    static consoleLog = true;
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('✅ ChessEngine v2.1 (Anti-Recursion) chargé');
    }
    
    static loadConfig() {
        try {
            const config = window.appConfig?.chess_engine?.console_log ?? window.appConfig?.debug?.console_log ?? true;
            this.consoleLog = String(config) !== "false";
        } catch (e) { this.consoleLog = true; }
    }

    constructor(fen) {
        this.fen = fen;
        this.board = this.parseFEN(fen);
        const parts = fen.split(' ');
        this.turn = parts[1] || 'w';
    }

    parseFEN(fen) {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        const boardPart = fen.split(' ')[0];
        let row = 0, col = 0;
        
        for (const char of boardPart) {
            if (char === '/') { row++; col = 0; }
            else if (isNaN(char)) { board[row][col] = char; col++; }
            else { col += parseInt(char); }
        }
        return board;
    }

    getPiece(row, col) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
        return this.board[row][col];
    }

    findKing(side) {
        const kingChar = side === 'w' ? 'K' : 'k';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.board[r][c] === kingChar) return { row: r, col: c };
            }
        }
        return null;
    }

    isSquareAttacked(row, col, attackerColor) {
    const attSide = (attackerColor === 'white' || attackerColor === 'w') ? 'w' : 'b';
    
    // 1. Cavaliers
    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of knightMoves) {
        const r = row + dr, c = col + dc;
        if (this.isValidSquare(r, c) && this.getPiece(r, c) === (attSide === 'w' ? 'N' : 'n')) return true;
    }

    // 2. PIONS (Version corrigée)
    // Si l'attaquant est BLANC, il vient des lignes du BAS (index row + 1)
    // Si l'attaquant est NOIR, il vient des lignes du HAUT (index row - 1)
    const pSourceRow = (attSide === 'w') ? row + 1 : row - 1;
    for (const dc of [-1, 1]) {
        const pSourceCol = col + dc;
        if (this.isValidSquare(pSourceRow, pSourceCol)) {
            const p = this.getPiece(pSourceRow, pSourceCol);
            if (p === (attSide === 'w' ? 'P' : 'p')) return true;
        }
    }

    // 3. Glissants & Roi
    const dirs = [
        { d: [[-1, 0], [1, 0], [0, -1], [0, 1]], t: attSide === 'w' ? ['R', 'Q'] : ['r', 'q'] },
        { d: [[-1, -1], [-1, 1], [1, -1], [1, 1]], t: attSide === 'w' ? ['B', 'Q'] : ['b', 'q'] }
    ];

    for (const cfg of dirs) {
        for (const [dr, dc] of cfg.d) {
            let r = row + dr, c = col + dc;
            // Roi (1 case)
            if (this.isValidSquare(r, c) && this.getPiece(r, c) === (attSide === 'w' ? 'K' : 'k')) return true;
            
            // Rayons
            while (this.isValidSquare(r, c)) {
                const p = this.getPiece(r, c);
                if (p) {
                    if (cfg.t.includes(p)) return true;
                    break; 
                }
                r += dr; c += dc;
            }
        }
    }
    return false;
}

    

    isKingInCheck(color) {
        const side = color === 'white' || color === 'w' ? 'w' : 'b';
        const kingPos = this.findKing(side);
        if (!kingPos) return false;
        return this.isSquareAttacked(kingPos.row, kingPos.col, side === 'w' ? 'b' : 'w');
    }

    // --- LOGIQUE DE FIN DE PARTIE SANS RÉCURSION ---

    checkGameStatus(color = null) {
        const side = color || this.turn;
        const hasMoves = this.hasAnyLegalMoves(side);
        const inCheck = this.isKingInCheck(side);

        if (!hasMoves) {
            return inCheck ? 'checkmate' : 'stalemate';
        }
        return 'in_progress';
    }

    isCheckmate(color) {
        const side = color === 'white' || color === 'w' ? 'w' : 'b';
        return this.isKingInCheck(side) && !this.hasAnyLegalMoves(side);
    }

    isStalemate(color) {
        const side = color === 'white' || color === 'w' ? 'w' : 'b';
        return !this.isKingInCheck(side) && !this.hasAnyLegalMoves(side);
    }

    hasAnyLegalMoves(side) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && this.isPieceColor(piece, side)) {
                    const moves = this.getPossibleMovesForPiece(piece, r, c);
                    for (const m of moves) {
                        if (this.isMoveLegal(side, r, c, m.row, m.col)) return true;
                    }
                }
            }
        }
        return false;
    }

    isMoveLegal(side, fR, fC, tR, tC) {
        const originalTarget = this.board[tR][tC];
        const originalSource = this.board[fR][fC];

        // Simulation
        this.board[tR][tC] = originalSource;
        this.board[fR][fC] = null;

        const stillInCheck = this.isKingInCheck(side);

        // Backtrack
        this.board[fR][fC] = originalSource;
        this.board[tR][tC] = originalTarget;

        return !stillInCheck;
    }

    isPieceColor(piece, side) {
        const isWhite = piece === piece.toUpperCase();
        return (side === 'w' && isWhite) || (side === 'b' && !isWhite);
    }

    isValidSquare(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

    getPossibleMovesForPiece(piece, row, col) {
        const moves = [];
        const type = piece.toLowerCase();
        // Utilisation des fonctions déjà définies dans votre code
        if (type === 'p') this.getPawnMoves(moves, piece, row, col);
        else if (type === 'n') this.getKnightMoves(moves, row, col);
        else if (type === 'b') this.getBishopMoves(moves, row, col);
        else if (type === 'r') this.getRookMoves(moves, row, col);
        else if (type === 'q') this.getQueenMoves(moves, row, col);
        else if (type === 'k') this.getKingMoves(moves, row, col);
        return moves;
    }

    // (Gardez vos méthodes getPawnMoves, getKnightMoves, etc. telles quelles)
    getPawnMoves(moves, piece, row, col) {
        const dir = (piece === 'P') ? -1 : 1;
        const start = (piece === 'P') ? 6 : 1;
        if (this.isValidSquare(row + dir, col) && !this.getPiece(row + dir, col)) {
            moves.push({ row: row + dir, col: col });
            if (row === start && !this.getPiece(row + 2 * dir, col) && !this.getPiece(row + dir, col)) 
                moves.push({ row: row + 2 * dir, col: col });
        }
        [[dir, -1], [dir, 1]].forEach(([dr, dc]) => {
            const nr = row + dr, nc = col + dc;
            if (this.isValidSquare(nr, nc)) {
                const target = this.getPiece(nr, nc);
                if (target && !this.isPieceColor(target, piece === 'P' ? 'w' : 'b')) moves.push({ row: nr, col: nc });
            }
        });
    }

    getKnightMoves(moves, row, col) {
        [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
            const nr = row + dr, nc = col + dc;
            if (this.isValidSquare(nr, nc)) {
                const target = this.getPiece(nr, nc);
                if (!target || !this.isPieceColor(target, this.isPieceColor(this.getPiece(row, col), 'w') ? 'w' : 'b')) moves.push({ row: nr, col: nc });
            }
        });
    }
    getSlidingMoves(moves, row, col, directions) {
        const side = this.isPieceColor(this.getPiece(row, col), 'w') ? 'w' : 'b';
        directions.forEach(([dr, dc]) => {
            let nr = row + dr, nc = col + dc;
            while (this.isValidSquare(nr, nc)) {
                const target = this.getPiece(nr, nc);
                if (!target) moves.push({ row: nr, col: nc });
                else {
                    if (!this.isPieceColor(target, side)) moves.push({ row: nr, col: nc });
                    break;
                }
                nr += dr; nc += dc;
            }
        });
    }
    getBishopMoves(moves, row, col) { this.getSlidingMoves(moves, row, col, [[-1,-1],[-1,1],[1,-1],[1,1]]); }
    getRookMoves(moves, row, col) { this.getSlidingMoves(moves, row, col, [[-1,0],[1,0],[0,-1],[0,1]]); }
    getQueenMoves(moves, row, col) { this.getSlidingMoves(moves, row, col, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]); }
    getKingMoves(moves, row, col) {
        [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => {
            const nr = row + dr, nc = col + dc;
            if (this.isValidSquare(nr, nc)) {
                const target = this.getPiece(nr, nc);
                if (!target || !this.isPieceColor(target, this.isPieceColor(this.getPiece(row, col), 'w') ? 'w' : 'b')) moves.push({ row: nr, col: nc });
            }
        });
    }
}

ChessEngine.init();
window.ChessEngine = ChessEngine;