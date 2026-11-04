/**
 * Level_4 - Stratège UI
 * Version 2.2.0 - Priorité au petit roque
 */
class Level_4 {
    static VERSION = '2.2.0';

    constructor() {
        this.name = "Bot Level 4 (Minimax)";
        this.level = 4;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
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

            const hasPlayedMove = game.gameState.moveHistory.some(move =>
                move.player?.toLowerCase().startsWith(myColor[0])
            );
            const openingMoves = hasPlayedMove
                ? allMoves
                : allMoves.filter(move =>
                    move.piece.type !== 'pawn' || (move.fromCol !== 0 && move.fromCol !== 7)
                );
            const candidateMoves = openingMoves.length > 0 ? openingMoves : allMoves;
            const oppKing = this._findKing(game, oppColor);

            candidateMoves.forEach(m => {
                let score = 0;

                // 1. CAPTURES AGRESSIVES
                if (m.isCapture) {
                    score += this._evaluateExchange(game, m, myColor) * 20;
                }

                // 2. SÉCURITÉ APRÈS SIMULATION
                if (!m.isCapture) {
                    score -= this._evaluateMoveExposure(game, m, oppColor) * 10;
                }

                // 3. CHASSE AU ROI
                if (oppKing) {
                    const distAfter = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    score += (10 - distAfter) * 15;
                }

                // 4. PERCÉE DES PIONS
                if (m.piece.type === 'pawn') {
                    const rank = isWhite ? (7 - m.toRow) : m.toRow;
                    score += (rank * rank * 5);
                    if (m.toRow === 0 || m.toRow === 7) score += 5000;
                }

                // 5. BONUS ÉCHEC
                if (m.isCheck) score += 150;

                if (m.details?.type === 'castling' && m.details.side === 'kingside') {
                    score += 100;
                }

                m._finalScore = score;
            });

            // Sélection intelligente du coup
            const selectedMove = this._getBestMove(candidateMoves);
            return this._finalize(selectedMove);

        } catch (err) { 
            console.error("L4 Error:", err);
            return null; 
        }
    }

    _getBestMove(moves) {
        // Tri par score décroissant
        moves.sort((a, b) => b._finalScore - a._finalScore);
        const bestScore = moves[0]._finalScore;

        // On garde les coups qui valent au moins 90% du meilleur coup (marge faible = bot rigide)
        const threshold = bestScore > 0 ? bestScore * 0.90 : bestScore * 1.10;
        const candidates = moves.filter(m => m._finalScore >= threshold);

        // Choix aléatoire parmi les excellents coups
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    _findKing(game, color) {
        const key = color.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPieceCompat(game, r, c);
                if (p && p.type === 'king' && p.color.toLowerCase().startsWith(key)) return { r, c };
            }
        }
        return null;
    }

    _isSquareAttacked(game, row, col, byColor) {
        const key = byColor.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this._getPieceCompat(game, r, c);
                if (p && p.color.toLowerCase().startsWith(key)) {
                    const moves = game.moveValidator.getPossibleMoves(p, r, c);
                    if (moves && moves.some(m => m.row === row && m.col === col)) return true;
                }
            }
        }
        return false;
    }

    _evaluateExchange(game, move, color) {
        const immediateGain = this._getImmediateExchangeGain(game, move);
        if (immediateGain === 0) return 0;

        const toRow = move.details?.kingTo?.row ?? move.toRow;
        const toCol = move.details?.kingTo?.col ?? move.toCol;
        const afterMove = this._simulateMove(game, move);
        const opponent = color === 'white' ? 'black' : 'white';
        return immediateGain - this._bestExchange(afterMove, toRow, toCol, opponent, 0);
    }

    _evaluateMoveExposure(game, move, opponent) {
        const afterMove = this._simulateMove(game, move);
        const toRow = move.details?.kingTo?.row ?? move.toRow;
        const toCol = move.details?.kingTo?.col ?? move.toCol;
        return this._bestExchange(afterMove, toRow, toCol, opponent, 0);
    }

    _getImmediateExchangeGain(game, move) {
        const toRow = move.details?.kingTo?.row ?? move.toRow;
        const toCol = move.details?.kingTo?.col ?? move.toCol;
        const capturedPiece = move.details?.type === 'en-passant'
            ? { type: 'pawn' }
            : this._getPieceCompat(game, toRow, toCol);
        const capturedValue = capturedPiece ? this.pieceValues[capturedPiece.type] || 0 : 0;
        const promotionGain = move.details?.isPromotion
            || (move.piece.type === 'pawn' && (toRow === 0 || toRow === 7))
            ? this.pieceValues.queen - this.pieceValues.pawn
            : 0;
        return capturedValue + promotionGain;
    }

    _bestExchange(game, targetRow, targetCol, capturingColor, depth) {
        if (depth >= 8) return 0;

        const target = this._getPieceCompat(game, targetRow, targetCol);
        if (!target || target.color !== (capturingColor === 'white' ? 'black' : 'white')) return 0;

        const capturedValue = this.pieceValues[target.type] || 0;
        let bestScore = 0;
        for (const move of this._getAllLegalMoves(game, capturingColor)) {
            if (move.toRow !== targetRow || move.toCol !== targetCol || !move.isCapture) continue;

            const promotionGain = move.piece.type === 'pawn' && (targetRow === 0 || targetRow === 7)
                ? this.pieceValues.queen - this.pieceValues.pawn
                : 0;
            const afterCapture = this._simulateMove(game, move);
            const nextColor = capturingColor === 'white' ? 'black' : 'white';
            const score = capturedValue + promotionGain
                - this._bestExchange(afterCapture, targetRow, targetCol, nextColor, depth + 1);
            bestScore = Math.max(bestScore, score);
        }
        return bestScore;
    }

    _simulateMove(game, move) {
        const board = new BoardPosition();
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._getPieceCompat(game, row, col);
                if (piece) board.setPiece(row, col, { ...piece });
            }
        }

        const previousState = game.gameState;
        const state = {
            currentPlayer: previousState.currentPlayer,
            moveHistory: (previousState.moveHistory || []).slice(-1).map(entry => ({
                ...entry,
                from: entry.from ? { ...entry.from } : entry.from,
                to: entry.to ? { ...entry.to } : entry.to
            })),
            hasKingMoved: { ...(previousState.hasKingMoved || { white: false, black: false }) },
            hasRookMoved: {
                white: { ...(previousState.hasRookMoved?.white || { kingside: false, queenside: false }) },
                black: { ...(previousState.hasRookMoved?.black || { kingside: false, queenside: false }) }
            },
            castlingRights: {
                white: { ...(previousState.castlingRights?.white || {}) },
                black: { ...(previousState.castlingRights?.black || {}) }
            },
            kingStartCols: { ...(previousState.kingStartCols || { white: 4, black: 4 }) },
            rookStartCols: {
                white: { ...(previousState.rookStartCols?.white || { kingside: 7, queenside: 0 }) },
                black: { ...(previousState.rookStartCols?.black || { kingside: 7, queenside: 0 }) }
            },
            castlingRightsString: previousState.castlingRightsString || 'KQkq',
            chess960: previousState.chess960 === true
        };
        const simulatedGame = { board, gameState: state };
        simulatedGame.moveValidator = new MoveValidator(board, state);

        const movingPiece = board.getPiece(move.fromRow, move.fromCol);
        if (!movingPiece) throw new Error('Pièce absente de la position simulée Level 4.');

        const details = move.details || {};
        const toRow = details.kingTo?.row ?? move.toRow;
        const toCol = details.kingTo?.col ?? move.toCol;
        const capturedPiece = board.getPiece(toRow, toCol);
        const isCapture = !!capturedPiece || details.type === 'en-passant';

        if (details.type === 'castling') {
            const rook = board.getPiece(details.rookFrom.row, details.rookFrom.col);
            board.setPiece(move.fromRow, move.fromCol, null);
            board.setPiece(details.rookFrom.row, details.rookFrom.col, null);
            movingPiece.row = toRow;
            movingPiece.col = toCol;
            rook.row = details.rookTo.row;
            rook.col = details.rookTo.col;
            board.setPiece(toRow, toCol, movingPiece);
            board.setPiece(rook.row, rook.col, rook);
        } else {
            board.setPiece(move.fromRow, move.fromCol, null);
            if (details.type === 'en-passant' && details.capturedPawn) {
                board.setPiece(details.capturedPawn.row, details.capturedPawn.col, null);
            }
            movingPiece.row = toRow;
            movingPiece.col = toCol;
            if (details.isPromotion || (movingPiece.type === 'pawn' && (toRow === 0 || toRow === 7))) {
                movingPiece.type = 'queen';
            }
            board.setPiece(toRow, toCol, movingPiece);
        }

        this._updateCastlingState(state, movingPiece, move, capturedPiece);
        state.moveHistory.push({
            player: state.currentPlayer,
            color: state.currentPlayer,
            from: { row: move.fromRow, col: move.fromCol },
            to: { row: toRow, col: toCol },
            piece: movingPiece.type,
            type: details.type,
            isDoublePush: details.isDoublePush === true,
            isCapture
        });
        state.currentPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
        return simulatedGame;
    }

    _updateCastlingState(state, movingPiece, move, capturedPiece) {
        const color = movingPiece.color;
        const startRow = color === 'white' ? 7 : 0;

        if (movingPiece.type === 'king') {
            state.hasKingMoved[color] = true;
            if (state.castlingRights[color]) {
                state.castlingRights[color].kingside = false;
                state.castlingRights[color].queenside = false;
            }
        }
        if (movingPiece.type === 'rook' && move.fromRow === startRow) {
            const side = move.fromCol === 0 ? 'queenside' : move.fromCol === 7 ? 'kingside' : null;
            if (side && state.hasRookMoved[color]) state.hasRookMoved[color][side] = true;
        }
        if (capturedPiece?.type === 'rook') {
            const capturedColor = capturedPiece.color;
            const capturedRow = capturedColor === 'white' ? 7 : 0;
            const toRow = move.details?.kingTo?.row ?? move.toRow;
            const toCol = move.details?.kingTo?.col ?? move.toCol;
            const side = toRow === capturedRow
                ? (toCol === 0 ? 'queenside' : toCol === 7 ? 'kingside' : null)
                : null;
            if (side && state.hasRookMoved[capturedColor]) state.hasRookMoved[capturedColor][side] = true;
        }
    }

    _getAllLegalMoves(game, color) {
        const moves = [];
        const myKey = color.toLowerCase().charAt(0);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this._getPieceCompat(game, r, c);
                if (piece && piece.color.toLowerCase().startsWith(myKey)) {
                    const pMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pMoves) {
                        pMoves.forEach(m => {
                            const target = this._getPieceCompat(game, m.row, m.col);
                            moves.push({
                                fromRow: r, fromCol: c,
                                toRow: m.kingTo?.row ?? m.row,
                                toCol: m.kingTo?.col ?? m.col,
                                piece: piece, targetPiece: target,
                                isCapture: (!!target && !target.color.toLowerCase().startsWith(myKey))
                                    || m.type === 'en-passant',
                                isCheck: m.isCheck || false,
                                details: m,
                                details: m
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
            const sq = grid[r] ? grid[r][c] : null;
            return sq?.type ? sq : null;
        } catch(e) { return null; }
    }

    _finalize(move) {
        if (!move) return null;
        return {
            fromRow: move.fromRow, fromCol: move.fromCol,
            toRow: move.toRow, toCol: move.toCol,
            promotion: (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) ? 'queen' : undefined
        };
    }
}
window.Level_4 = Level_4;