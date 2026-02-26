/**
 * Level_3 - Tactique & Finalisation (CCMO)
 * Version 2.1.5 - Mode Autonome (Sans Extends)
 */
class Level_3 {
    static VERSION = '2.1.5';

    constructor() {
        this.name = "Bot Level 3 (Tactique+)";
        this.level = 3;
        // Valeurs standards (Echelle 1/100)
        this.pieceValues = { 
            'pawn': 100, 'knight': 320, 'bishop': 330, 
            'rook': 500, 'queen': 900, 'king': 20000 
        };
    }

    async getMove() {
        try {
            // Accès moteur via window (comme Level 16)
            const game = window.chessGame?.core || window.chessGame;
            if (!game) return null;

            const color = game.gameState.currentPlayer;
            const myColor = color.toLowerCase().startsWith('w') ? 'white' : 'black';
            const oppColor = myColor === 'white' ? 'black' : 'white';
            
            // 1. Récupération des coups via méthode interne sécurisée
            const allMoves = this._getAllMoves(game, myColor);
            if (!allMoves || allMoves.length === 0) return null;

            const oppKing = this.findOpponentKing(game, oppColor);

            // 2. Évaluation Tactique
            allMoves.forEach(m => {
                let score = 0;

                // --- C : CAPTURE ---
                if (m.isCapture && m.targetPiece) {
                    const targetVal = this.pieceValues[m.targetPiece.type] || 0;
                    score += (targetVal * 10);
                }

                // --- S : SÉCURITÉ ---
                const isSafe = !this.isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                if (!isSafe) {
                    const pieceVal = this.pieceValues[m.piece.type] || 0;
                    score -= (pieceVal * 12);
                }

                // --- M : MOBILITÉ & PIONS ---
                if (m.piece.type === 'pawn') {
                    const progress = (myColor === 'white') ? (7 - m.toRow) : m.toRow;
                    score += (progress * progress * 8); 
                    if (m.toRow === 0 || m.toRow === 7) score += 1500; // Bonus Promotion
                }

                // --- O : OPTIMISATION ---
                if (oppKing) {
                    const distBefore = Math.abs(m.fromRow - oppKing.r) + Math.abs(m.fromCol - oppKing.c);
                    const distAfter = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    
                    if (distAfter < distBefore) score += 25;

                    if (this.checkAttackRange(m.piece.type, m.toRow, m.toCol, oppKing.r, oppKing.c)) {
                        score += 60; 
                    }
                }

                // Centralisation
                if (m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5) {
                    score += 35;
                }

                score += Math.random() * 20;
                m._finalScore = score;
            });

            // 3. Tri et sélection
            allMoves.sort((a, b) => b._finalScore - a._finalScore);
            const bestMove = allMoves[0];
            
            return this._finalize(bestMove);

        } catch (err) {
            console.error("❌ [Level_3] Erreur:", err);
            return null;
        }
    }

    /**
     * Méthodes utilitaires autonomes
     */
    checkAttackRange(type, r1, c1, r2, c2) {
        const dr = Math.abs(r1 - r2);
        const dc = Math.abs(c1 - c2);
        if (type === 'rook') return r1 === r2 || c1 === c2;
        if (type === 'bishop') return dr === dc;
        if (type === 'queen') return r1 === r2 || c1 === c2 || dr === dc;
        if (type === 'knight') return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
        if (type === 'pawn') return dr === 1 && dc === 1;
        return false;
    }

    findOpponentKing(game, oppColor) {
        const colorKey = oppColor.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPiece(game.board, r, c);
                if (p && p.type === 'king' && p.color.toLowerCase().startsWith(colorKey)) {
                    return { r, c };
                }
            }
        }
        return null;
    }

    isSquareAttacked(game, row, col, byColor) {
        const colorKey = byColor.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPiece(game.board, r, c);
                if (p && p.color.toLowerCase().startsWith(colorKey)) {
                    const mvs = game.moveValidator.getPossibleMoves(p, r, c);
                    if (mvs && mvs.some(m => m.row === row && m.col === col)) return true;
                }
            }
        }
        return false;
    }

    _getAllMoves(game, color) {
        const moves = [];
        const myColorKey = color.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this._getPiece(game.board, r, c);
                if (piece && piece.color.charAt(0).toLowerCase() === myColorKey) {
                    const possible = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (possible) {
                        possible.forEach(m => {
                            const target = this._getPiece(game.board, m.row, m.col);
                            moves.push({
                                fromRow: r, fromCol: c, toRow: m.row, toCol: m.col,
                                piece: piece, targetPiece: target,
                                isCapture: !!target
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
        return {
            fromRow: move.fromRow, fromCol: move.fromCol,
            toRow: move.toRow, toCol: move.toCol,
            promotion: (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) ? 'queen' : null
        };
    }
}

window.Level_3 = Level_3;