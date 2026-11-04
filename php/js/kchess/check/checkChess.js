// check/checkChess.js - Parse les positions FEN et détecte les cases attaquées
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

    isPieceColor(piece, side) {
        const isWhite = piece === piece.toUpperCase();
        return (side === 'w' && isWhite) || (side === 'b' && !isWhite);
    }

    isValidSquare(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
}

ChessEngine.init();
window.ChessEngine = ChessEngine;