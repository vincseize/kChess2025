/**
 * Level_3 - Niveau Tactique Anti-Kamikaze
 * Version : 1.5.0 - Optimisé pour Stress Test
 */
class Level_3 {
    static VERSION = '1.5.0';

    constructor() {
        this.name = "Bot Level 3 (Tactique)";
        this.level = 3;
        this.pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
    }

    async getMove() {
        const game = window.chessGame?.core || window.chessGame;
        if (!game) return { error: 'engine_not_found' };

        const currentPlayer = game.gameState.currentPlayer;
        const oppColor = currentPlayer === 'white' ? 'black' : 'white';
        
        const allMoves = this._getAllLegalMoves(game, currentPlayer);
        if (allMoves.length === 0) return { error: 'game_over' };

        // 1. ANALYSE DES MENACES SUR MES PIÈCES
        const myUnderAttack = allMoves.filter(m => this._isSquareAttacked(game, m.fromRow, m.fromCol, oppColor));

        // 2. TRI TACTIQUE
        const safeMoves = allMoves.filter(m => !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor));
        const safeCaptures = safeMoves.filter(m => m.isCapture);
        
        // --- LOGIQUE DE DÉCISION ---

        // A. Si je peux capturer une pièce de valeur égale ou supérieure en toute sécurité
        if (safeCaptures.length > 0) {
            safeCaptures.sort((a, b) => this.pieceValues[b.targetPiece.type] - this.pieceValues[a.targetPiece.type]);
            if (this.pieceValues[safeCaptures[0].targetPiece.type] >= this.pieceValues[safeCaptures[0].piece.type]) {
                return this._finalize(safeCaptures[0]);
            }
        }

        // B. Si une de mes pièces est attaquée, j'essaie de la sauver (si le coup est sûr)
        if (myUnderAttack.length > 0) {
            const escapeMoves = myUnderAttack.filter(m => !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor));
            if (escapeMoves.length > 0) {
                // On privilégie l'évasion qui capture ou qui va vers le centre
                return this._finalize(escapeMoves[0]);
            }
        }

        // C. Coup offensif (Check) s'il est sûr
        const safeChecks = safeMoves.filter(m => this._checkIfMoveGivesCheck(game, m.piece, m.toRow, m.toCol, currentPlayer));
        if (safeChecks.length > 0) return this._finalize(safeChecks[0]);

        // D. Meilleur coup sûr disponible (priorité centre)
        if (safeMoves.length > 0) {
            const centralMoves = safeMoves.filter(m => m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5);
            return this._finalize(centralMoves.length > 0 ? centralMoves[0] : safeMoves[0]);
        }

        // E. Fallback : n'importe quel coup pour ne pas bloquer
        return this._finalize(allMoves[Math.floor(Math.random() * allMoves.length)]);
    }

    _finalize(move) {
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            move.promotion = 'queen';
        }
        return move;
    }

    _getAllLegalMoves(game, color) {
        const moves = [];
        const board = game.board;
        const colorKey = color.charAt(0).toLowerCase();

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                let piece = this._getPiece(board, r, c);
                if (piece && piece.color.charAt(0).toLowerCase() === colorKey) {
                    let pieceMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pieceMoves) {
                        pieceMoves.forEach(m => {
                            let target = this._getPiece(board, m.row, m.col);
                            moves.push({
                                fromRow: r, fromCol: c,
                                toRow: m.row, toCol: m.col,
                                piece: piece,
                                targetPiece: target,
                                isCapture: !!target && target.color.charAt(0).toLowerCase() !== colorKey,
                                notation: this._simpleNotation(r, c, m.row, m.col)
                            });
                        });
                    }
                }
            }
        }
        return moves;
    }

    _isSquareAttacked(game, row, col, byColor) {
        const board = game.board;
        const colorKey = byColor.charAt(0).toLowerCase();
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

    _checkIfMoveGivesCheck(game, piece, tR, tC, myColor) {
        const myColorKey = myColor.charAt(0).toLowerCase();
        const nextMoves = game.moveValidator.getPossibleMoves(piece, tR, tC);
        return nextMoves.some(m => {
            const p = this._getPiece(game.board, m.row, m.col);
            return p && p.type === 'king' && p.color.charAt(0).toLowerCase() !== myColorKey;
        });
    }

    _getPiece(board, r, c) {
        try {
            let sq = board.getPiece ? board.getPiece(r, c) : (board.grid ? board.grid[r][c] : board[r][c]);
            if (sq && sq.piece) return sq.piece;
            return (sq && sq.type) ? sq : null;
        } catch (e) { return null; }
    }

    _simpleNotation(fR, fC, tR, tC) {
        return `${'abcdefgh'[fC]}${8 - fR}➔${'abcdefgh'[tC]}${8 - tR}`;
    }
}

window.Level_3 = Level_3;