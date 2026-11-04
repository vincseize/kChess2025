/**
 * Level_6 - Petit Maître (Contrôle du centre)
 * Base Level_5 avec une préférence positionnelle pour les cases centrales.
 */
class Level_6 {
    static VERSION = '1.0.0';

    constructor() {
        this.name = "Bot Level 6 (Centre)";
        this.level = 6;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        this.centerValues = { 'pawn': 150, 'knight': 135, 'bishop': 100, 'rook': 55, 'queen': 45, 'king': 0 };
    }

    async getMove() {
        try {
            const game = window.chessGame?.core || window.chessGame;
            if (!game) return null;

            const color = game.gameState.currentPlayer;
            const isWhite = color.toLowerCase().startsWith('w');
            const myColor = isWhite ? 'white' : 'black';
            const oppColor = isWhite ? 'black' : 'white';

            const allMoves = this._getAllLegalMoves(game, myColor);
            if (allMoves.length === 0) return null;

            const oppKing = this._findKing(game, oppColor);

            allMoves.forEach(m => {
                let score = 0;

                if (m.isCapture) {
                    score += this.pieceValues[m.targetPiece.type] * 20;
                }
                if (this._isSquareAttacked(game, m.toRow, m.toCol, oppColor)) {
                    score -= this.pieceValues[m.piece.type] * 12;
                }

                if (oppKing) {
                    const distAfter = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    score += (10 - distAfter) * 20;

                    const edgeDist = Math.max(Math.abs(oppKing.r - 3.5), Math.abs(oppKing.c - 3.5));
                    score += edgeDist * 25;
                }

                if (m.piece.type === 'pawn') {
                    const rank = isWhite ? (7 - m.toRow) : m.toRow;
                    score += rank * rank * 10;
                    if (m.toRow === 0 || m.toRow === 7) score += 10000;
                }

                if (m.isCheck) score += 300;

                if (oppKing && !m.isCheck) {
                    const dist = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    if (dist <= 1) score -= 200;
                }

                score += this._getCenterValue(m.piece.type, m.toRow, m.toCol)
                    - this._getCenterValue(m.piece.type, m.fromRow, m.fromCol);

                m._finalScore = score;
            });

            return this._finalize(this._getBestMove(allMoves));
        } catch (err) {
            console.error('L6 Error:', err);
            return null;
        }
    }

    _getCenterValue(pieceType, row, col) {
        const distance = Math.min(
            ...[3, 4].flatMap(centerRow => [3, 4].map(centerCol =>
                Math.abs(row - centerRow) + Math.abs(col - centerCol)
            ))
        );
        const proximity = [1, 0.65, 0.3, 0.1][distance] || 0;
        return (this.centerValues[pieceType] || 0) * proximity;
    }

    _getBestMove(moves) {
        moves.sort((a, b) => b._finalScore - a._finalScore);
        const bestScore = moves[0]._finalScore;
        const threshold = bestScore > 0 ? bestScore * 0.75 : bestScore * 1.25;
        const candidates = moves.filter(m => m._finalScore >= threshold);
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    _findKing(game, color) {
        const key = color.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this._getPieceCompat(game, r, c);
                if (piece && piece.type === 'king' && piece.color.toLowerCase().startsWith(key)) {
                    return { r, c };
                }
            }
        }
        return null;
    }

    _isSquareAttacked(game, row, col, byColor) {
        const key = byColor.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this._getPieceCompat(game, r, c);
                if (piece && piece.color.toLowerCase().startsWith(key)) {
                    const moves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (moves && moves.some(move => move.row === row && move.col === col)) return true;
                }
            }
        }
        return false;
    }

    _getAllLegalMoves(game, color) {
        const moves = [];
        const myKey = color.toLowerCase().charAt(0);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this._getPieceCompat(game, r, c);
                if (piece && piece.color.toLowerCase().startsWith(myKey)) {
                    const pieceMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pieceMoves) {
                        pieceMoves.forEach(move => {
                            const target = this._getPieceCompat(game, move.row, move.col);
                            moves.push({
                                fromRow: r,
                                fromCol: c,
                                toRow: move.row,
                                toCol: move.col,
                                piece,
                                targetPiece: target,
                                isCapture: !!target && !target.color.toLowerCase().startsWith(myKey),
                                isCheck: move.isCheck || false
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
            const board = game.board;
            if (board.getPiece) return board.getPiece(r, c);
            const grid = board.grid || board;
            const square = grid[r] ? grid[r][c] : null;
            return square?.piece || (square?.type ? square : null);
        } catch (error) {
            return null;
        }
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

window.Level_6 = Level_6;
