/**
 * Level_16 - Level 8 + ouverture + depth-1 + mat en 1 + anti-pat + anti-mat + sécurité roi
 * Version 1.3.0
 *
 * Changelog v1.3.0 :
 *   - Ajout détection de mat adverse en 1 (évite mat du berger, etc.)
 *   - Ajout pénalité si le roi propre est sous pression après le coup
 *   - Les détections lourdes (mat adverse, pat) sont optimisées :
 *     ne se déclenchent que si le roi est menacé ou en fin de partie
 */
class Level_16 {
    static VERSION = '1.3.0';

    constructor() {
        this.name = "Bot Level 16 (L8 + ouverture + depth1 + mat/anti-pat/anti-mat)";
        this.level = 16;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        this.centerValues = { 'pawn': 150, 'knight': 135, 'bishop': 100, 'rook': 55, 'queen': 45, 'king': 0 };
        this.gameFonctions = GameFonctions.attach(this);

        this.maxOppReplies = 8;
    }

    async getMove() {
        try {
            const game = window.chessGame?.core || window.chessGame;
            if (!game) return null;

            const color = game.gameState.currentPlayer;
            const isWhite = color.toLowerCase().startsWith('w');
            const myColor = isWhite ? 'white' : 'black';
            const oppColor = isWhite ? 'black' : 'white';

            // ============================================================
            // ★ OUVERTURE
            // ============================================================
            const openingMove = this._tryOpeningMove(game, myColor);
            if (openingMove) return this._finalize(openingMove);

            // ============================================================
            // LOGIQUE LEVEL_8
            // ============================================================
            const allMoves = this._getAllLegalMoves(game, myColor);
            if (allMoves.length === 0) return null;

            // ============================================================
            // ★ MAT EN 1 — priorité absolue
            // ============================================================
            for (const m of allMoves) {
                const after = this._simulateMove(game, m);
                if (!after) continue;
                const oppMoves = this._getAllLegalMoves(after, oppColor);
                if (oppMoves.length !== 0) continue;
                const king = this._findKing(after, oppColor);
                if (king && this._isSquareAttacked(after, king.r, king.c, myColor)) {
                    return this._finalize(m);
                }
            }

            // ============================================================
            // ÉVALUATION NORMALE
            // ============================================================
            const oppKing = this._findKing(game, oppColor);
            const centerControlBefore = this._getCenterControlScore(game, myColor);
            const doubledPawnsBefore = this._getDoubledPawnCount(game, myColor);
            const majorPieceFilesBefore = this._getMajorPieceFileScore(game, myColor);
            const connectedPawnsBefore = this._getConnectedPawnPairCount(game, myColor);
            const doubledRooksBefore = this._getDoubledRookFileCount(game, myColor);
            const pawnIslandsBefore = this._getPawnIslandCount(game, myColor);
            const advancedMajorRanksBefore = this._getAdvancedMajorPieceRankCount(game, myColor);
            const myKingBefore = this._findKing(game, myColor);

            allMoves.forEach(m => {
                let score = 0;
                const afterMove = this._simulateMove(game, m);
                const exposure = this._evaluateMoveExposure(game, m, oppColor, afterMove);

                if (m.isCapture) {
                    const capturedValue = this.pieceValues[m.targetPiece.type] || 0;
                    score += capturedValue * 20;
                    score += this._getFavorableTradeBonus(
                        game, m, myColor, this.pieceValues.knight, 100
                    );
                }
                score -= exposure * 12;
                score += (this._getCenterControlScore(afterMove, myColor) - centerControlBefore) * 12;
                score -= (this._getDoubledPawnCount(afterMove, myColor) - doubledPawnsBefore) * 25;
                score -= (this._getPawnIslandCount(afterMove, myColor) - pawnIslandsBefore) * 25;
                score += (this._getMajorPieceFileScore(afterMove, myColor) - majorPieceFilesBefore) * 12;
                score += (this._getConnectedPawnPairCount(afterMove, myColor) - connectedPawnsBefore) * 25;
                score += (this._getDoubledRookFileCount(afterMove, myColor) - doubledRooksBefore) * 30;
                score += (this._getAdvancedMajorPieceRankCount(afterMove, myColor) - advancedMajorRanksBefore) * 20;
                score += this.gameFonctions.getSafeKnightForkBonus(game, m, myColor, {
                    simulated: afterMove,
                    exposure
                });

                if (oppKing) {
                    const distAfter = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    score += (10 - distAfter) * 20;

                    const edgeDist = Math.max(Math.abs(oppKing.r - 3.5), Math.abs(oppKing.c - 3.5));
                    score += edgeDist * 25;
                }

                if (m.piece.type === 'pawn') {
                    const rank = isWhite ? (7 - m.toRow) : m.toRow;
                    score += rank * rank * 10;
                    if (m.details?.isPromotion || (m.toRow === 0 || m.toRow === 7)) {
                        score += 10000;
                    }
                }

                if (m.isCheck) score += 300;

                if (oppKing && !m.isCheck) {
                    const dist = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    if (dist <= 1) score -= 200;
                }

                score += this._getCenterValue(m.piece.type, m.toRow, m.toCol)
                    - this._getCenterValue(m.piece.type, m.fromRow, m.fromCol);

                if (m.details?.type === 'castling') {
                    score += 100;
                }

                // ============================================================
                // ★ DEPTH-1 : pénalité réponse adverse
                // ============================================================
                score -= this._opponentBestReplyPenalty(afterMove, oppColor, myColor);

                // ============================================================
                // ★ ANTI-PAT : pénalité massive en fin de partie ou roi acculé
                // ============================================================
                if (this._shouldCheckStalemate(afterMove, oppColor)) {
                    if (this.gameFonctions.isStalemateAfterMove(game, m, oppColor, afterMove)) {
                        score -= 50000;
                    }
                }

                // ============================================================
                // ★ SÉCURITÉ DU ROI : pénalité si le roi est sous pression
                // ============================================================
                if (myKingBefore) {
                    const myKingAfter = this._findKing(afterMove, myColor);
                    if (myKingAfter) {
                        const attackers = this._countAttackersOnSquare(
                            afterMove, myKingAfter.r, myKingAfter.c, oppColor
                        );
                        if (attackers >= 2) score -= 500 * attackers;

                        if (this._isSquareAttacked(
                            afterMove, myKingAfter.r, myKingAfter.c, oppColor
                        )) {
                            score -= 1000;
                        }
                    }
                }

                // ============================================================
                // ★ ANTI-MAT ADVERSE : si ce coup laisse mater l'adversaire en 1
                // ============================================================
                if (this._isKingUnderThreatAfterMove(afterMove, myColor)) {
                    if (this.gameFonctions.opponentCanMateInOne(afterMove, oppColor, myColor)) {
                        score -= 100000;   // pire que le pat : on va perdre immédiatement
                    }
                }

                m._finalScore = score;
            });

            const promotionMoves = allMoves.filter(move => this._isPromotionMove(move));
            if (promotionMoves.length > 0) {
                promotionMoves.sort((a, b) => b._finalScore - a._finalScore);
                return this._finalize(promotionMoves[0]);
            }

            return this._finalize(this._getBestMove(allMoves));
        } catch (err) {
            console.error('L16 Error:', err);
            return null;
        }
    }

    /**
     * Heuristique : ne vérifier le pat que si l'adversaire a peu de matériel
     * ou si son roi est acculé au bord.
     */
    _shouldCheckStalemate(afterMove, oppColor) {
        if (!afterMove) return false;
        const pieceCount = this._countPieces(afterMove);
        if (pieceCount <= 12) return true;

        const oppKing = this._findKing(afterMove, oppColor);
        if (!oppKing) return false;
        return oppKing.r === 0 || oppKing.r === 7 || oppKing.c === 0 || oppKing.c === 7;
    }

    /**
     * Heuristique : ne vérifier le mat adverse que si mon roi est menacé
     * (≥ 2 attaquants ou sur un bord).
     */
    _isKingUnderThreatAfterMove(afterMove, myColor) {
        if (!afterMove) return false;
        return this.gameFonctions.isKingUnderThreat(afterMove, myColor);
    }

    _countAttackersOnSquare(game, row, col, byColor) {
        return this.gameFonctions.countAttackersOnSquare(game, row, col, byColor);
    }

    // =====================================================================
    // OUVERTURE
    // =====================================================================

    _tryOpeningMove(game, color) {
        if (typeof window.GameOuverture === 'undefined') return null;

        const history = game.gameState.moveHistory || [];
        if (history.length >= 6) return null;

        const candidateLines = window.GameOuverture.lignes.filter(line => {
            if (line.coups.length <= history.length) return false;
            for (let i = 0; i < history.length; i++) {
                if (!this._moveMatchesHistory(history[i], line.coups[i])) return false;
            }
            return true;
        });

        if (candidateLines.length === 0) return null;

        const line = candidateLines[0];
        const nextBookMove = line.coups[history.length];
        if (!nextBookMove) return null;
        if (!this._sameColor(nextBookMove.couleur, color)) return null;

        const from = this._algebraicToCoords(nextBookMove.depart);
        const to = this._algebraicToCoords(nextBookMove.arrivee);
        if (!from || !to) return null;

        return this._getAllLegalMoves(game, color).find(m =>
            m.fromRow === from.row && m.fromCol === from.col &&
            m.toRow === to.row && m.toCol === to.col
        ) || null;
    }

    _moveMatchesHistory(played, expectedBookEntry) {
        const from = this._algebraicToCoords(expectedBookEntry.depart);
        const to = this._algebraicToCoords(expectedBookEntry.arrivee);
        if (!from || !to) return false;

        const pFrom = played.from || { row: played.fromRow, col: played.fromCol };
        const pTo = played.to || { row: played.toRow, col: played.toCol };
        return pFrom.row === from.row && pFrom.col === from.col
            && pTo.row === to.row && pTo.col === to.col;
    }

    _algebraicToCoords(square) {
        if (typeof square !== 'string' || square.length !== 2) return null;
        const col = square.charCodeAt(0) - 97;
        const row = 8 - parseInt(square[1], 10);
        if (col < 0 || col > 7 || row < 0 || row > 7) return null;
        return { row, col };
    }

    _sameColor(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') return false;
        return a.charAt(0).toLowerCase() === b.charAt(0).toLowerCase();
    }

    // =====================================================================
    // DEPTH-1 : pénalité réponse adverse
    // =====================================================================

    _opponentBestReplyPenalty(simulatedGame, oppColor, myColor) {
        const replies = this._getAllLegalMoves(simulatedGame, oppColor);
        if (replies.length === 0) return 0;

        let worstNet = 0;
        let examined = 0;

        for (const reply of replies) {
            if (!reply.isCapture && !reply.isCheck) continue;
            if (++examined > this.maxOppReplies) break;

            let net = 0;

            if (reply.isCapture && reply.targetPiece) {
                const attackVal = this.pieceValues[reply.piece.type] || 0;
                const targetVal = this.pieceValues[reply.targetPiece.type] || 0;
                const defended = this._isSquareAttacked(
                    simulatedGame, reply.toRow, reply.toCol, myColor
                );
                const gain = defended ? (targetVal - attackVal) : targetVal;
                if (gain > 0) net += gain;
            }

            if (reply.isCheck) net += 100;
            if (this._isPromotionMove(reply)) net += 5000;

            if (net > worstNet) worstNet = net;
            if (worstNet > 1000) break;
        }
        return worstNet;
    }

    // =====================================================================
    // ↓↓↓ IDENTIQUE À Level_8 v1.1.0 ↓↓↓
    // =====================================================================

    _getCenterValue(pieceType, row, col) {
        const distance = Math.min(
            ...[3, 4].flatMap(centerRow => [3, 4].map(centerCol =>
                Math.abs(row - centerRow) + Math.abs(col - centerCol)
            ))
        );
        const proximity = [1, 0.65, 0.3, 0.1][distance] || 0;
        return (this.centerValues[pieceType] || 0) * proximity;
    }

    _getCenterControlScore(game, color) {
        const fen = game.moveValidator.generateCurrentFEN(color);
        const engine = new ChessEngine(fen);
        const colorKey = color === 'white' ? 'w' : 'b';
        let score = 0;

        for (const [row, col] of [[3, 3], [3, 4], [4, 3], [4, 4]]) {
            const piece = this._getPieceCompat(game, row, col);
            if (piece?.color === color) score += 1;
            if (engine.isSquareAttacked(row, col, colorKey)) score += 1;
        }
        return score;
    }

    _getDoubledPawnCount(game, color) {
        const pawnsByFile = Array(8).fill(0);
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._getPieceCompat(game, row, col);
                if (piece?.type === 'pawn' && piece.color === color) {
                    pawnsByFile[col]++;
                }
            }
        }
        return pawnsByFile.reduce((total, count) => total + Math.max(0, count - 1), 0);
    }

    _getPawnIslandCount(game, color) {
        const pawnsByFile = Array(8).fill(0);
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._getPieceCompat(game, row, col);
                if (piece?.type === 'pawn' && piece.color === color) {
                    pawnsByFile[col]++;
                }
            }
        }

        return pawnsByFile.reduce((islands, count, col) =>
            count > 0 && (col === 0 || pawnsByFile[col - 1] === 0) ? islands + 1 : islands, 0);
    }

    _getConnectedPawnPairCount(game, color) {
        const supportingRowOffset = color === 'white' ? 1 : -1;
        let pairCount = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const pawn = this._getPieceCompat(game, row, col);
                if (pawn?.type !== 'pawn' || pawn.color !== color) continue;

                const supportingRow = row + supportingRowOffset;
                if (supportingRow < 0 || supportingRow > 7) continue;
                for (const supportingCol of [col - 1, col + 1]) {
                    if (supportingCol < 0 || supportingCol > 7) continue;
                    const supportingPawn = this._getPieceCompat(game, supportingRow, supportingCol);
                    if (supportingPawn?.type === 'pawn' && supportingPawn.color === color) {
                        pairCount++;
                    }
                }
            }
        }
        return pairCount;
    }

    _getDoubledRookFileCount(game, color) {
        const rooksByFile = Array(8).fill(0);
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._getPieceCompat(game, row, col);
                if (piece?.type === 'rook' && piece.color === color) {
                    rooksByFile[col]++;
                }
            }
        }
        return rooksByFile.filter(count => count > 1).length;
    }

    _getAdvancedMajorPieceRankCount(game, color) {
        const advancedRanks = new Set();
        const opponentTerritoryStart = color === 'white' ? 0 : 4;
        const opponentTerritoryEnd = color === 'white' ? 3 : 7;

        for (let row = opponentTerritoryStart; row <= opponentTerritoryEnd; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._getPieceCompat(game, row, col);
                if (piece?.color === color && ['rook', 'queen'].includes(piece.type)) {
                    advancedRanks.add(row);
                }
            }
        }
        return advancedRanks.size;
    }

    _getMaterialBalance(game, color) {
        let balance = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._getPieceCompat(game, row, col);
                if (!piece || piece.type === 'king') continue;
                const value = this.pieceValues[piece.type] || 0;
                balance += piece.color === color ? value : -value;
            }
        }
        return balance;
    }

    _isPromotionMove(move) {
        return move.piece?.type === 'pawn'
            && (move.details?.isPromotion || move.toRow === 0 || move.toRow === 7);
    }

    _getMajorPieceFileScore(game, color) {
        const ownPawnsByFile = Array(8).fill(0);
        const opponentPawnsByFile = Array(8).fill(0);
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._getPieceCompat(game, row, col);
                if (piece?.type !== 'pawn') continue;
                const pawnsByFile = piece.color === color ? ownPawnsByFile : opponentPawnsByFile;
                pawnsByFile[col]++;
            }
        }

        let score = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._getPieceCompat(game, row, col);
                if (!piece || piece.color !== color || !['rook', 'queen'].includes(piece.type)) continue;
                if (ownPawnsByFile[col] > 0) continue;
                score += opponentPawnsByFile[col] === 0 ? 2 : 1;
            }
        }
        return score;
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
                    return { r, c, row: r, col: c };
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

    _evaluateMoveExposure(game, move, opponent, afterMove = this._simulateMove(game, move)) {
        const toRow = move.details?.kingTo?.row ?? move.toRow;
        const toCol = move.details?.kingTo?.col ?? move.toCol;
        return this._bestExchange(afterMove, toRow, toCol, opponent, 0);
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
        if (!movingPiece) throw new Error('Pièce absente de la position simulée Level 16.');

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
                    const pieceMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pieceMoves) {
                        pieceMoves.forEach(move => {
                            const target = this._getPieceCompat(game, move.row, move.col);
                            moves.push({
                                fromRow: r,
                                fromCol: c,
                                toRow: move.kingTo?.row ?? move.row,
                                toCol: move.kingTo?.col ?? move.col,
                                piece,
                                targetPiece: target || (move.type === 'en-passant' ? { type: 'pawn' } : null),
                                isCapture: (!!target && !target.color.toLowerCase().startsWith(myKey))
                                    || move.type === 'en-passant',
                                isCheck: move.isCheck || false,
                                details: move,
                                promotion: move.isPromotion ? 'queen' : undefined
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
            return square?.type ? square : null;
        } catch (error) {
            return null;
        }
    }

    _countPieces(game) {
        let count = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this._getPieceCompat(game, r, c)) count++;
            }
        }
        return count;
    }

    _finalize(move) {
        if (!move) return null;
        return {
            fromRow: move.fromRow,
            fromCol: move.fromCol,
            toRow: move.toRow,
            toCol: move.toCol,
            promotion: move.promotion
                || (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7) ? 'queen' : undefined)
        };
    }
}

window.Level_16 = Level_16;