/**
 * Level_5 - Grand Maître GM (Optimisé)
 * Version 2.2.2 - Mode Autonome (Sans Extends)
 * Focus : Précision 95%, Étranglement chirurgical et Anti-Pat dynamique
 */
class Level_5 {
    static VERSION = '2.2.2';

    constructor() {
        this.name = "Bot Level 5 (GM Pro)";
        this.level = 5;
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
            const myMaterial = this.getMaterialScore(game, myColor);
            const oppMaterial = this.getMaterialScore(game, oppColor);

            // --- ÉVALUATION CHIRURGICALE ---
            allMoves.forEach(m => {
                let score = 0;

                // A. CAPTURES & INITIATIVE (Ratio 25/15)
                if (m.isCapture && m.targetPiece) {
                    const targetVal = this.pieceValues[m.targetPiece.type] || 0;
                    score += (targetVal * 25);
                }
                
                // B. SÉCURITÉ (Malus si destination attaquée)
                if (this.isSquareAttacked(game, m.toRow, m.toCol, oppColor)) {
                    const pieceVal = this.pieceValues[m.piece.type] || 0;
                    score -= (pieceVal * 15); 
                }

                // C. GÉOMÉTRIE DU CENTRE
                const centerDist = Math.abs(m.toRow - 3.5) + Math.abs(m.toCol - 3.5);
                score += (5 - centerDist) * 12;

                // D. ÉTRANGLEMENT DU ROI ADVERSE
                if (oppKing) {
                    const distToOppKing = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    score += (10 - distToOppKing) * 30; 

                    // Pousse le roi adverse vers les bords (Centropie inverse)
                    const oppKingCenterDist = Math.abs(oppKing.r - 3.5) + Math.abs(oppKing.c - 3.5);
                    score += oppKingCenterDist * 45; 
                }

                // E. PROMOTION EXPONENTIELLE
                if (m.piece.type === 'pawn') {
                    const rank = isWhite ? (7 - m.toRow) : m.toRow;
                    score += (rank * rank * 15); 
                    if (m.toRow === 0 || m.toRow === 7) score += 15000;
                }

                // F. GESTION DU MAT vs PAT (Anti-Pat dynamique)
                if (m.isCheck) {
                    score += 800; 
                } else if (oppKing && (myMaterial > oppMaterial + 300)) {
                    // SI ÉNORME AVANTAGE : Éviter d'étouffer le roi sans échec (Éviter le Pat)
                    const dist = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    if (dist <= 1.5) score -= 5000; 
                }

                m._finalScore = score;
            });

            // 2. SÉLECTION STRICTE (95% d'efficacité minimale)
            const selectedMove = this.getBestMoveStrict(allMoves);
            
            return this._finalize(selectedMove);

        } catch (err) { 
            console.error("❌ [Level_5] Erreur:", err);
            return null; 
        }
    }

    getBestMoveStrict(moves) {
        moves.sort((a, b) => b._finalScore - a._finalScore);
        const bestScore = moves[0]._finalScore;
        const threshold = bestScore > 0 ? bestScore * 0.95 : bestScore * 1.05;
        const candidates = moves.filter(m => m._finalScore >= threshold);
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    getMaterialScore(game, color) {
        let total = 0;
        const key = color.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPiece(game.board, r, c);
                if (p && p.color.toLowerCase().startsWith(key)) {
                    total += this.pieceValues[p.type] || 0;
                }
            }
        }
        return total;
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

window.Level_5 = Level_5;