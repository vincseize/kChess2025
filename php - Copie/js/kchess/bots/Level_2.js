/**
 * Level_2 - Stratégie CCMO optimisée
 * Check -> Capture -> Menace -> Optimisation
 * Version 1.5.0 - Compatible Stress Test Turbo
 */
class Level_2 {
    static VERSION = '1.5.0';

    constructor() {
        this.name = "Bot Level 2 (CCMO)";
        this.level = 2;
        this.pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
    }

    async getMove() {
        const game = window.chessGame?.core || window.chessGame;
        if (!game) return { error: 'engine_not_found' };

        const currentPlayer = game.gameState.currentPlayer;
        const oppColor = currentPlayer === 'white' ? 'black' : 'white';
        
        // 1. Récupérer tous les coups légaux
        const allMoves = this._getAllLegalMoves(game, currentPlayer);
        if (allMoves.length === 0) return { error: 'game_over' };

        // 2. Filtrer par catégories stratégiques
        const captureMoves = allMoves.filter(m => m.isCapture);
        const checkMoves = allMoves.filter(m => m.isCheck);

        // --- STRATÉGIE 1 : CAPTURES RENTABLES ---
        if (captureMoves.length > 0) {
            // Trier par valeur de la pièce cible (décroissant)
            captureMoves.sort((a, b) => this.pieceValues[b.targetPiece.type] - this.pieceValues[a.targetPiece.type]);

            // Ne prendre que si c'est "safe" ou si on gagne au change
            const smartCaptures = captureMoves.filter(m => {
                const isAttacked = this._isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                if (!isAttacked) return true; // Capture gratuite
                // Échange favorable (ex: mon pion prend sa tour)
                return this.pieceValues[m.targetPiece.type] >= this.pieceValues[m.piece.type];
            });

            if (smartCaptures.length > 0) return this._finalize(smartCaptures[0]);
        }

        // --- STRATÉGIE 2 : ÉCHECS SÉCURISÉS ---
        if (checkMoves.length > 0) {
            const safeChecks = checkMoves.filter(m => !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor));
            if (safeChecks.length > 0) return this._finalize(safeChecks[Math.floor(Math.random() * safeChecks.length)]);
        }

        // --- STRATÉGIE 3 : POSITIONNEMENT CENTRAL & PROTECTION ---
        const safeMoves = allMoves.filter(m => !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor));
        
        if (safeMoves.length > 0) {
            // Priorité au centre (lignes 2 à 5, colonnes 2 à 5)
            const centralMoves = safeMoves.filter(m => m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5);
            if (centralMoves.length > 0) return this._finalize(centralMoves[Math.floor(Math.random() * centralMoves.length)]);
            
            return this._finalize(safeMoves[Math.floor(Math.random() * safeMoves.length)]);
        }

        // --- FALLBACK : Coup aléatoire si tout est dangereux ---
        return this._finalize(allMoves[Math.floor(Math.random() * allMoves.length)]);
    }

    _finalize(move) {
        // SÉCURITÉ PROMOTION
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            move.promotion = 'queen';
        }
        return move;
    }

    _getAllLegalMoves(game, color) {
        const moves = [];
        const board = game.board;
        const myColorKey = color.charAt(0).toLowerCase();

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                let piece = this._getPiece(board, r, c);
                if (piece && piece.color.charAt(0).toLowerCase() === myColorKey) {
                    let pieceMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pieceMoves) {
                        pieceMoves.forEach(m => {
                            let target = this._getPiece(board, m.row, m.col);
                            moves.push({
                                fromRow: r, fromCol: c,
                                toRow: m.row, toCol: m.col,
                                piece: piece,
                                targetPiece: target,
                                isCapture: !!target && target.color.charAt(0).toLowerCase() !== myColorKey,
                                isCheck: this._checkIfMoveGivesCheck(game, piece, m.row, m.col, myColorKey),
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

    _checkIfMoveGivesCheck(game, piece, tR, tC, myColorKey) {
        const oppColor = myColorKey === 'w' ? 'black' : 'white';
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
window.Level_2 = Level_2;