/**
 * Level_4 - Stratège UI (Minimax-Light)
 * Version 2.1.5 - Mode Autonome (Sans Extends)
 */
class Level_4 {
    static VERSION = '2.1.5';

    constructor() {
        this.name = "Bot Level 4 (Stratège)";
        this.level = 4;
        this.pieceValues = { 
            'pawn': 100, 'knight': 320, 'bishop': 330, 
            'rook': 500, 'queen': 900, 'king': 20000 
        };
    }

    async getMove() {
        try {
            const game = window.chessGame?.core || window.chessGame;
            if (!game) return null;

            const color = game.gameState.currentPlayer;
            const isWhite = color.toLowerCase().startsWith('w');
            const myColor = isWhite ? 'white' : 'black';
            const oppColor = isWhite ? 'black' : 'white';
            
            // 1. Récupération des coups via méthode interne sécurisée
            const allMoves = this._getAllMoves(game, myColor);
            if (!allMoves || allMoves.length === 0) return null;

            const oppKing = this.findKing(game, oppColor);

            // 2. Évaluation des coups (Scoring Multicritères)
            allMoves.forEach(m => {
                let score = 0;

                // --- C : CAPTURES AGRESSIVES ---
                if (m.isCapture && m.targetPiece) {
                    const targetVal = this.pieceValues[m.targetPiece.type] || 0;
                    score += (targetVal * 20);
                }

                // --- S : SÉCURITÉ ---
                if (this.isSquareAttacked(game, m.toRow, m.toCol, oppColor)) {
                    const pieceVal = this.pieceValues[m.piece.type] || 0;
                    score -= (pieceVal * 10);
                }

                // --- O : CHASSE AU ROI ---
                if (oppKing) {
                    const distAfter = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    score += (10 - distAfter) * 15;
                }

                // --- M : PERCÉE DES PIONS ---
                if (m.piece.type === 'pawn') {
                    const rank = isWhite ? (7 - m.toRow) : m.toRow;
                    score += (rank * rank * 5);
                    if (m.toRow === 0 || m.toRow === 7) score += 5000; // Priorité Promotion
                }

                // --- BONUS ÉCHEC & STRUCTURE ---
                if (m.isCheck) score += 150;
                
                if (m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5) {
                    score += 25;
                }

                m._finalScore = score;
            });

            // 3. Sélection intelligente avec variabilité contrôlée (90%)
            const selectedMove = this.getBestMoveRandomized(allMoves);
            
            return this._finalize(selectedMove);

        } catch (err) { 
            console.error("❌ [Level_4] Erreur:", err);
            return null; 
        }
    }

    getBestMoveRandomized(moves) {
        moves.sort((a, b) => b._finalScore - a._finalScore);
        const bestScore = moves[0]._finalScore;

        const threshold = bestScore > 0 ? bestScore * 0.90 : bestScore * 1.10;
        const candidates = moves.filter(m => m._finalScore >= threshold);

        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    findKing(game, color) {
        const key = color.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPiece(game.board, r, c);
                if (p && p.type === 'king' && p.color.toLowerCase().startsWith(key)) return { r, c };
            }
        }
        return null;
    }

    isSquareAttacked(game, row, col, byColor) {
        const key = byColor.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPiece(game.board, r, c);
                if (p && p.color.toLowerCase().startsWith(key)) {
                    const moves = game.moveValidator.getPossibleMoves(p, r, c);
                    if (moves && moves.some(m => m.row === row && m.col === col)) return true;
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
                                isCapture: !!target,
                                isCheck: m.isCheck || false
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

window.Level_4 = Level_4;