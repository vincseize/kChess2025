/**
 * Level_3 - Tactique Optimisée
 * Version 1.6.0 - Spécial Stress Test (Performance focus)
 */
class Level_3 {
    static VERSION = '1.6.0';

    constructor() {
        this.name = "Bot Level 3 (Tactique)";
        this.level = 3;
        this.pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
    }

    async getMove() {
        const game = window.chessGame?.core || window.chessGame;
        if (!game) return { error: 'engine_not_found' };

        const color = game.gameState.currentPlayer;
        const oppColor = color === 'white' ? 'black' : 'white';
        
        const allMoves = this._getAllLegalMoves(game, color);
        if (allMoves.length === 0) return null;

        // --- 1. PRIORITÉ : CAPTURES RENTABLES ---
        const captures = allMoves.filter(m => m.isCapture);
        if (captures.length > 0) {
            // Trier par valeur de la pièce cible (desc)
            captures.sort((a, b) => this.pieceValues[b.targetPiece.type] - this.pieceValues[a.targetPiece.type]);
            
            // On ne vérifie la sécurité QUE pour les 2 meilleures captures (gain de temps)
            for (let i = 0; i < Math.min(captures.length, 2); i++) {
                const m = captures[i];
                const isSafe = !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                if (isSafe || this.pieceValues[m.targetPiece.type] > this.pieceValues[m.piece.type]) {
                    return this._finalize(m);
                }
            }
        }

        // --- 2. SAUVETAGE / ESCAPE ---
        // On cherche si une pièce de valeur est attaquée
        const threatenedMoves = allMoves.filter(m => this._isSquareAttacked(game, m.fromRow, m.fromCol, oppColor));
        if (threatenedMoves.length > 0) {
            // On trie pour sauver la plus grosse pièce d'abord
            threatenedMoves.sort((a,b) => this.pieceValues[b.piece.type] - this.pieceValues[a.piece.type]);
            const escape = threatenedMoves.find(m => !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor));
            if (escape) return this._finalize(escape);
        }

        // --- 3. JEU DE POSITION (CENTRE SAFE) ---
        const safeMoves = allMoves.filter(m => !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor));
        if (safeMoves.length > 0) {
            const central = safeMoves.filter(m => m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5);
            return this._finalize(central.length > 0 ? central[Math.floor(Math.random() * central.length)] : safeMoves[0]);
        }

        // --- 4. FALLBACK ---
        return this._finalize(allMoves[Math.floor(Math.random() * allMoves.length)]);
    }

    _isSquareAttacked(game, row, col, byColor) {
        const colorKey = byColor.charAt(0).toLowerCase();
        const board = game.board;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPiece(board, r, c);
                if (p && p.color.charAt(0).toLowerCase() === colorKey) {
                    const moves = game.moveValidator.getPossibleMoves(p, r, c);
                    if (moves.some(m => m.row === row && m.col === col)) return true;
                }
            }
        }
        return false;
    }

    _getAllLegalMoves(game, color) {
        const moves = [];
        const myColorKey = color.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                let piece = this._getPiece(game.board, r, c);
                if (piece && piece.color.charAt(0).toLowerCase() === myColorKey) {
                    let pieceMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pieceMoves) {
                        pieceMoves.forEach(m => {
                            let target = this._getPiece(game.board, m.row, m.col);
                            moves.push({
                                fromRow: r, fromCol: c, toRow: m.row, toCol: m.col,
                                piece: piece, targetPiece: target,
                                isCapture: !!target && target.color.charAt(0).toLowerCase() !== myColorKey
                            });
                        });
                    }
                }
            }
        }
        return moves;
    }

    _getPiece(board, r, c) {
        try {
            let sq = board.grid ? board.grid[r][c] : (board.getPiece ? board.getPiece(r,c) : board[r][c]);
            if (!sq) return null;
            return sq.piece ? sq.piece : (sq.type ? sq : null);
        } catch(e) { return null; }
    }

    _finalize(move) {
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) move.promotion = 'queen';
        return move;
    }
}
window.Level_3 = Level_3;