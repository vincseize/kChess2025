/**
 * Level_3 - Tactique & Finalisation
 * Version 1.8.3 - Stable UI + Anti-Pat + High Speed
 */
class Level_3 {
    static VERSION = '1.8.3';

    constructor() {
        this.name = "Bot Level 3 (Tactique+)";
        this.level = 3;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        this.currentGame = null; 
    }

    async getMove() {
        try {
            const game = this.currentGame || window.chessGame?.core || window.chessGame;
            if (!game) return null;

            const color = game.gameState.currentPlayer;
            const myColor = (color.toLowerCase().startsWith('w')) ? 'white' : 'black';
            const oppColor = myColor === 'white' ? 'black' : 'white';
            
            const allMoves = this._getAllLegalMoves(game, myColor);
            if (!allMoves || allMoves.length === 0) return null;

            const oppKing = this._findOpponentKing(game, oppColor);

            allMoves.forEach(m => {
                let score = 0;

                // 1. Valeur de capture (x10)
                if (m.isCapture && m.targetPiece) {
                    score += (this.pieceValues[m.targetPiece.type] * 10);
                }

                // 2. Sécurité (Crucial pour garder l'avantage)
                const isSafe = !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                if (!isSafe) {
                    score -= (this.pieceValues[m.piece.type] * 12);
                }

                // 3. Poussée de pions agressive (Priorité Promotion)
                if (m.piece.type === 'pawn') {
                    const progress = (myColor === 'white') ? (7 - m.toRow) : m.toRow;
                    score += (progress * progress * 8); // Boosté de 5 à 8
                    if (m.toRow === 0 || m.toRow === 7) score += 1500; // Promotion ultra-prioritaire
                }

                // 4. Traque du Roi & Anti-Pat (Bonus si échec)
                if (oppKing) {
                    const distBefore = Math.abs(m.fromRow - oppKing.r) + Math.abs(m.fromCol - oppKing.c);
                    const distAfter = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    if (distAfter < distBefore) score += 20;

                    // Bonus "Anti-Pat" : Favoriser les coups qui attaquent les cases autour du roi ou le roi lui-même
                    if (this._pieceAttacksSquare(m.piece.type, m.toRow, m.toCol, oppKing.r, oppKing.c)) {
                        score += 50; 
                    }
                }

                // 5. Bonus de centralisation
                if (m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5) score += 30;

                // 6. Aléatoire pour éviter les boucles infinies
                score += Math.random() * 15;

                m._finalScore = score;
            });

            allMoves.sort((a, b) => b._finalScore - a._finalScore);
            return this._finalize(allMoves[0]);

        } catch (err) {
            return null;
        }
    }

    // Aide à la décision Anti-Pat
    _pieceAttacksSquare(type, r1, c1, r2, c2) {
        const dr = Math.abs(r1 - r2);
        const dc = Math.abs(c1 - c2);
        if (type === 'rook') return r1 === r2 || c1 === c2;
        if (type === 'bishop') return dr === dc;
        if (type === 'queen') return r1 === r2 || c1 === c2 || dr === dc;
        if (type === 'knight') return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
        return false;
    }

    _findOpponentKing(game, oppColor) {
        const colorKey = oppColor.charAt(0);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPieceCompat(game, r, c);
                if (p && p.type === 'king' && p.color.toLowerCase().startsWith(colorKey)) return { r, c };
            }
        }
        return null;
    }

    _isSquareAttacked(game, row, col, byColor) {
        const colorKey = byColor.toLowerCase().charAt(0);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPieceCompat(game, r, c);
                if (p && p.color.toLowerCase().charAt(0) === colorKey) {
                    const mvs = game.moveValidator.getPossibleMoves(p, r, c);
                    if (mvs && mvs.some(m => m.row === row && m.col === col)) return true;
                }
            }
        }
        return false;
    }

    _getAllLegalMoves(game, color) {
        const moves = [];
        const myColorKey = color.toLowerCase().charAt(0);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this._getPieceCompat(game, r, c);
                if (piece && piece.color.toLowerCase().charAt(0) === myColorKey) {
                    const pieceMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pieceMoves) {
                        pieceMoves.forEach(m => {
                            const target = this._getPieceCompat(game, m.row, m.col);
                            moves.push({
                                fromRow: r, fromCol: c, toRow: m.row, toCol: m.col,
                                piece: piece, targetPiece: target,
                                isCapture: !!target && target.color.toLowerCase().charAt(0) !== myColorKey
                            });
                        });
                    }
                }
            }
        }
        return moves;
    }

    _getPieceCompat(game, r, c) {
        try {
            if (game.board && typeof game.board.getPiece === 'function') {
                return game.board.getPiece(r, c);
            }
            const grid = game.board.grid || game.board;
            const sq = grid[r][c];
            if (!sq) return null;
            return sq.piece || (sq.type ? sq : null);
        } catch(e) { return null; }
    }

    _finalize(move) {
        if (!move) return null;
        return {
            fromRow: move.fromRow,
            fromCol: move.fromCol,
            toRow: move.toRow,
            toCol: move.toCol,
            promotion: (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) ? 'queen' : undefined
        };
    }
}
window.Level_3 = Level_3;