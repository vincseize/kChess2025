/**
 * Level_3 - Tactique & Finalisation
 * Version 2.1.0 - Réponse adverse et évaluation des échanges
 */
class Level_3 {
    static VERSION = '2.1.0';

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

            const hasPlayedMove = game.gameState.moveHistory.some(move =>
                move.player?.toLowerCase().startsWith(myColor[0])
            );
            const openingMoves = hasPlayedMove
                ? allMoves
                : allMoves.filter(move =>
                    move.piece.type !== 'pawn' || (move.fromCol !== 0 && move.fromCol !== 7)
                );
            const candidateMoves = openingMoves.length > 0 ? openingMoves : allMoves;
            const oppKing = this._findOpponentKing(game, oppColor);

            candidateMoves.forEach(move => {
                move._quickScore = this._scoreMoveQuickly(game, move, myColor, oppKing);
            });
            candidateMoves.sort((a, b) => b._quickScore - a._quickScore);

            const searchMoves = candidateMoves.slice(0, 8);
            let bestMove = null;
            let bestScore = -Infinity;

            for (const move of searchMoves) {
                const afterMove = this._simulateMove(game, move);
                const responses = this._getAllLegalMoves(afterMove, oppColor);

                if (responses.length === 0) {
                    const isCheckmate = afterMove.moveValidator.isKingInCheck(oppColor);
                    const score = isCheckmate ? 100000 : 0;
                    if (score > bestScore) {
                        bestMove = move;
                        bestScore = score;
                    }
                    continue;
                }

                let worstResponseScore = Infinity;
                for (const response of responses) {
                    const afterResponse = this._simulateMove(afterMove, response);
                    let responseScore = this._evaluatePosition(afterResponse, myColor);
                    if (response.isCapture || response.details?.isPromotion) {
                        const immediateGain = this._getImmediateExchangeGain(afterMove, response);
                        const exchangeScore = this._evaluateExchange(afterMove, response, oppColor);
                        responseScore += immediateGain - exchangeScore;
                    }
                    worstResponseScore = Math.min(worstResponseScore, responseScore);

                    if (worstResponseScore + move._quickScore * 0.1 <= bestScore) break;
                }

                const score = worstResponseScore + move._quickScore * 0.1;
                if (score > bestScore) {
                    bestMove = move;
                    bestScore = score;
                }
            }

            return this._finalize(bestMove || searchMoves[0]);

        } catch (err) {
            console.error('Level 3 decision error:', err);
            return null;
        }
    }

    _scoreMoveQuickly(game, move, color, opponentKing) {
        let score = Math.random() * 15;
        if (move.isCapture && move.targetPiece) {
            score += this._evaluateExchange(game, move, color) * 10;
        }
        if (move.piece.type === 'pawn') {
            const progress = color === 'white' ? 7 - move.toRow : move.toRow;
            score += progress * progress * 8;
            if (move.toRow === 0 || move.toRow === 7) score += 1500;
        }
        if (move.toRow >= 2 && move.toRow <= 5 && move.toCol >= 2 && move.toCol <= 5) {
            score += 30;
        }
        if (opponentKing && this._pieceAttacksSquare(game, move, opponentKing.r, opponentKing.c)) {
            score += 50;
        }
        if (game.gameState.moveHistory.length < 20
            && ['knight', 'bishop'].includes(move.piece.type)
            && (move.fromRow === 0 || move.fromRow === 7)) {
            score += 15;
        }
        return score;
    }

    _evaluateExchange(game, move, color) {
        const immediateGain = this._getImmediateExchangeGain(game, move);
        if (immediateGain === 0) return 0;

        const details = move.details || {};
        const toRow = details.kingTo?.row ?? move.toRow;
        const toCol = details.kingTo?.col ?? move.toCol;
        const afterMove = this._simulateMove(game, move);
        const opponent = color === 'white' ? 'black' : 'white';
        return immediateGain
            - this._bestExchange(afterMove, toRow, toCol, opponent, 0);
    }

    _getImmediateExchangeGain(game, move) {
        const details = move.details || {};
        const toRow = details.kingTo?.row ?? move.toRow;
        const toCol = details.kingTo?.col ?? move.toCol;
        const capturedPiece = details.type === 'en-passant'
            ? { type: 'pawn' }
            : this._getPieceCompat(game, toRow, toCol);
        const capturedValue = capturedPiece ? this.pieceValues[capturedPiece.type] || 0 : 0;
        const promotionGain = details.isPromotion || (move.piece.type === 'pawn' && (toRow === 0 || toRow === 7))
            ? this.pieceValues.queen - this.pieceValues.pawn
            : 0;
        return capturedValue + promotionGain;
    }

    _bestExchange(game, targetRow, targetCol, capturingColor, depth) {
        if (depth >= 8) return 0;

        const target = this._getPieceCompat(game, targetRow, targetCol);
        if (!target || target.color === capturingColor) return 0;

        const capturedValue = this.pieceValues[target.type] || 0;
        let bestScore = 0;
        for (const move of this._getAllLegalMoves(game, capturingColor)) {
            if (move.toRow !== targetRow || move.toCol !== targetCol || !move.isCapture) continue;

            const promotionGain = move.piece.type === 'pawn'
                && (targetRow === 0 || targetRow === 7)
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

    _evaluatePosition(game, perspective) {
        const opponent = perspective === 'white' ? 'black' : 'white';
        const status = game.moveValidator.getGameStatus(perspective);
        if (status.status === 'checkmate') return -100000;
        if (status.status === 'stalemate') return 0;

        const attackEngine = new ChessEngine(game.moveValidator.generateCurrentFEN(perspective));
        let score = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._getPieceCompat(game, row, col);
                if (!piece) continue;

                const sign = piece.color === perspective ? 1 : -1;
                score += sign * this.pieceValues[piece.type];
                if (attackEngine.isSquareAttacked(row, col, piece.color === 'white' ? 'b' : 'w')
                    && !attackEngine.isSquareAttacked(row, col, piece.color === 'white' ? 'w' : 'b')) {
                    score -= sign * this.pieceValues[piece.type] * 0.35;
                }

                const centerDistance = Math.min(
                    Math.abs(row - 3) + Math.abs(col - 3),
                    Math.abs(row - 3) + Math.abs(col - 4),
                    Math.abs(row - 4) + Math.abs(col - 3),
                    Math.abs(row - 4) + Math.abs(col - 4)
                );
                const centerWeight = { pawn: 3, knight: 8, bishop: 5, rook: 2, queen: 2, king: 0 }[piece.type] || 0;
                score += sign * Math.max(0, 4 - centerDistance) * centerWeight;

                if (piece.type === 'pawn') {
                    const progress = piece.color === 'white' ? 6 - row : row - 1;
                    score += sign * Math.max(0, progress) * 2;
                }
            }
        }

        if (game.moveValidator.isKingInCheck(perspective)) score -= 80;
        if (game.moveValidator.isKingInCheck(opponent)) score += 80;
        return score;
    }

    _simulateMove(game, move) {
        if (typeof BoardPosition === 'undefined' || typeof MoveValidator === 'undefined') {
            throw new Error('BoardPosition et MoveValidator sont requis pour la recherche Level 3.');
        }

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
        if (!movingPiece) throw new Error('Pièce absente de la position simulée.');

        const moveDetails = move.details || {};
        const toRow = moveDetails.kingTo?.row ?? move.toRow;
        const toCol = moveDetails.kingTo?.col ?? move.toCol;
        const capturedPiece = board.getPiece(toRow, toCol);
        const isCapture = !!capturedPiece || moveDetails.type === 'en-passant';

        if (moveDetails.type === 'castling') {
            const rook = board.getPiece(moveDetails.rookFrom.row, moveDetails.rookFrom.col);
            board.setPiece(move.fromRow, move.fromCol, null);
            board.setPiece(moveDetails.rookFrom.row, moveDetails.rookFrom.col, null);
            movingPiece.row = toRow;
            movingPiece.col = toCol;
            rook.row = moveDetails.rookTo.row;
            rook.col = moveDetails.rookTo.col;
            board.setPiece(toRow, toCol, movingPiece);
            board.setPiece(rook.row, rook.col, rook);
        } else {
            board.setPiece(move.fromRow, move.fromCol, null);
            if (moveDetails.type === 'en-passant' && moveDetails.capturedPawn) {
                board.setPiece(moveDetails.capturedPawn.row, moveDetails.capturedPawn.col, null);
            }
            movingPiece.row = toRow;
            movingPiece.col = toCol;
            if (moveDetails.isPromotion || (movingPiece.type === 'pawn' && (toRow === 0 || toRow === 7))) {
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
            type: moveDetails.type,
            isDoublePush: moveDetails.isDoublePush === true,
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
            const side = move.toRow === capturedRow
                ? (move.toCol === 0 ? 'queenside' : move.toCol === 7 ? 'kingside' : null)
                : null;
            if (side && state.hasRookMoved[capturedColor]) state.hasRookMoved[capturedColor][side] = true;
        }
    }

    // Aide à la décision Anti-Pat
    _pieceAttacksSquare(game, move, targetRow, targetCol) {
        const rowDelta = targetRow - move.toRow;
        const colDelta = targetCol - move.toCol;
        const absRowDelta = Math.abs(rowDelta);
        const absColDelta = Math.abs(colDelta);
        const type = move.piece.type;

        if (type === 'pawn') {
            const forward = move.piece.color.toLowerCase().startsWith('w') ? -1 : 1;
            return rowDelta === forward && absColDelta === 1;
        }
        if (type === 'knight') {
            return (absRowDelta === 2 && absColDelta === 1)
                || (absRowDelta === 1 && absColDelta === 2);
        }
        if (type === 'king') return Math.max(absRowDelta, absColDelta) === 1;

        const isStraight = rowDelta === 0 || colDelta === 0;
        const isDiagonal = absRowDelta === absColDelta;
        if (type === 'rook' && !isStraight) return false;
        if (type === 'bishop' && !isDiagonal) return false;
        if (type === 'queen' && !isStraight && !isDiagonal) return false;
        if (type !== 'rook' && type !== 'bishop' && type !== 'queen') return false;

        const rowStep = Math.sign(rowDelta);
        const colStep = Math.sign(colDelta);
        let row = move.toRow + rowStep;
        let col = move.toCol + colStep;
        while (row !== targetRow || col !== targetCol) {
            const isVacatedOrigin = row === move.fromRow && col === move.fromCol;
            if (!isVacatedOrigin && this._getPieceCompat(game, row, col)) return false;
            row += rowStep;
            col += colStep;
        }
        return true;
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
        if (typeof ChessEngine === 'undefined') {
            throw new Error('ChessEngine est requis pour évaluer la sécurité des pièces.');
        }
        const fen = game.moveValidator.generateCurrentFEN(byColor);
        return new ChessEngine(fen).isSquareAttacked(row, col, byColor);
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
                                fromRow: r, fromCol: c,
                                piece: piece, targetPiece: target,
                                isCapture: (!!target && target.color.toLowerCase().charAt(0) !== myColorKey)
                                    || m.type === 'en-passant',
                                details: m,
                                toRow: m.kingTo?.row ?? m.row,
                                toCol: m.kingTo?.col ?? m.col
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
            return sq?.type ? sq : null;
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