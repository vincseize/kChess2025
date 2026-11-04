/**
 * php/js/kchess/bots/game_fonctions.js
 *
 * v1.3.0 :
 *   - Ajout opponentBestReplyPenalty (threat detection publique)
 *   - Ajout getCenterValue (utilitaire commun L5-L8)
 *   - Ajout countAttackersOnSquare (déjà présent, mais maintenant exposé via adapter)
 *   - Ajout isKingUnderThreatAfterMove (raccourci)
 *   - Ajout opponentCanMateInOne (raccourci)
 *   - Nouveaux adapters : _opponentBestReplyPenalty, _isKingUnderThreatAfterMove,
 *     _opponentCanMateInOne, _countAttackersOnSquare, _getCenterValue
 *   - Nouveau paramètre constructeur : maxOppCaptures (défaut 8)
 */
class GameFonctions {
    static VERSION = '1.3.0';

    constructor(options = {}) {
        this.pieceValues = {
            pawn: 100,
            knight: 320,
            bishop: 330,
            rook: 500,
            queen: 900,
            king: 20000,
            ...options.pieceValues
        };
        this.maxExchangeDepth = options.maxExchangeDepth ?? 8;
        this.maxOppCaptures = options.maxOppCaptures ?? 8;
        this.centerValues = options.centerValues ?? null;
    }

    static attach(bot) {
        if (!bot) throw new Error('Un bot est requis.');

        const shared = new GameFonctions({
            pieceValues: bot.pieceValues,
            maxOppCaptures: bot.maxOppCaptures ?? 8,
            centerValues: bot.centerValues ?? null
        });
        const asGame = game => game?.board ? game : { board: game };
        const adapters = {
            getMoves: (game, color) => shared.getAllLegalMoves(game, color),
            _getAllLegalMoves: (game, color) => shared.getAllLegalMoves(game, color),
            _getPiece: (game, row, col) => shared.getPiece(asGame(game), row, col),
            _getPieceCompat: (game, row, col) => shared.getPiece(game, row, col),
            _isSquareAttacked: (game, row, col, color) =>
                shared.isSquareAttacked(game, row, col, color),
            _findKing: (game, color) => {
                const king = shared.findKing(game, color);
                return king ? { ...king, r: king.row, c: king.col } : null;
            },
            _getCenterControlScore: (game, color) =>
                shared.getCenterControlScore(game, color),
            _getCenterValue: (pieceType, row, col) =>
                shared.getCenterValue(pieceType, row, col),
            _isPromotionMove: move => shared.isPromotionMove(move),
            _getDoubledPawnCount: (game, color) => shared.getDoubledPawnCount(game, color),
            _getPawnIslandCount: (game, color) => shared.getPawnIslandCount(game, color),
            _getIsolatedPawnCount: (game, color) => shared.getIsolatedPawnCount(game, color),
            _getConnectedPawnPairCount: (game, color) =>
                shared.getConnectedPawnPairCount(game, color),
            _getDoubledRookFileCount: (game, color) =>
                shared.getDoubledRookFileCount(game, color),
            _getMajorPieceFileScore: (game, color) =>
                shared.getMajorPieceFileScore(game, color),
            _getAdvancedMajorPieceRankCount: (game, color) =>
                shared.getAdvancedMajorPieceRankCount(game, color),
            _getMaterialBalance: (game, color) => shared.getMaterialBalance(game, color),
            _getFavorableTradeBonus: (game, move, color, threshold, bonus) =>
                shared.getFavorableTradeBonus(game, move, color, threshold, bonus),
            _getImmediateExchangeGain: (game, move) =>
                shared.getImmediateExchangeGain(game, move),
            _bestExchange: (game, row, col, color, depth = 0) =>
                shared.bestExchange(game, row, col, color, depth),
            _evaluateExchange: (game, move, color) =>
                shared.evaluateExchange(game, move, color),
            _simulateMove: (game, move) => shared.simulateMove(game, move),
            _evaluateMoveExposure: (game, move, color, simulated = null) =>
                shared.evaluateMoveExposure(game, move, color, simulated),
            _countPieces: game => shared.countPieces(game),

            // Détection pat / échec
            isStalemate: (game, color) => shared.isStalemate(game, color),
            isKingInCheck: (game, color) => shared.isKingInCheck(game, color),
            isStalemateAfterMove: (game, move, oppColor, sim) =>
                shared.isStalemateAfterMove(game, move, oppColor, sim),

            // Sécurité du roi / mat adverse
            countAttackersOnSquare: (game, row, col, byColor) =>
                shared.countAttackersOnSquare(game, row, col, byColor),
            isKingUnderThreat: (game, color) => shared.isKingUnderThreat(game, color),
            opponentCanMateInOne: (game, oppColor, myColor, sim) =>
                shared.opponentCanMateInOne(game, oppColor, myColor, sim),

            // ★ NOUVEAU v1.3.0 : threat detection + wrappers
            _opponentBestReplyPenalty: (simulatedGame, oppColor, myColor) =>
                shared.opponentBestReplyPenalty(simulatedGame, oppColor, myColor),
            _countAttackersOnSquare: (game, row, col, byColor) =>
                shared.countAttackersOnSquare(game, row, col, byColor),
            _isKingUnderThreatAfterMove: (afterMove, myColor) =>
                afterMove ? shared.isKingUnderThreat(afterMove, myColor) : false,
            _opponentCanMateInOne: (afterMove, oppColor, myColor) =>
                shared.opponentCanMateInOne(afterMove, oppColor, myColor),

            _getBestMove: moves => shared.chooseBestMove(moves, bot.level === 4 ? 0.9 : 0.75),
            finalize: move => shared.finalize(move),
            _finalize: move => shared.finalize(move)
        };

        const botClassName = bot.constructor?.name || 'bot';
        for (const [name, adapter] of Object.entries(adapters)) {
            const proto = Object.getPrototypeOf(bot);
            const hasPrototypeMethod = proto && typeof proto[name] === 'function';
            if (hasPrototypeMethod) continue;
            bot[name] = adapter;
        }

        const critical = [
            '_getAllLegalMoves',
            '_simulateMove',
            '_findKing',
            '_getPieceCompat',
            '_finalize',
            '_opponentBestReplyPenalty'
        ];
        for (const name of critical) {
            if (typeof bot[name] !== 'function') {
                console.error(
                    `❌ GameFonctions.attach : ${name} non défini sur ${botClassName}. ` +
                    `Le bot va probablement crasher. Vérifiez la déclaration de classe.`
                );
            }
        }

        bot.gameFonctions = shared;
        return shared;
    }

    // ═══════════════════════════════════════════════════════════════
    // THREAT DETECTION (v1.3.0)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Pénalité basée sur la meilleure réponse adverse après un coup candidat.
     * Approximation rapide de depth-2 : ne simule que les captures et échecs.
     */
    opponentBestReplyPenalty(simulatedGame, oppColor, myColor, maxReplies = null) {
        const limit = maxReplies ?? this.maxOppCaptures;
        const replies = this.getAllLegalMoves(simulatedGame, oppColor);
        if (replies.length === 0) return 0;

        let worstNet = 0;
        let examined = 0;

        for (const reply of replies) {
            if (!reply.isCapture && !reply.isCheck) continue;
            if (++examined > limit) break;

            let net = 0;

            if (reply.isCapture && reply.targetPiece) {
                const attackVal = this.pieceValues[reply.piece.type] || 0;
                const targetVal = this.pieceValues[reply.targetPiece.type] || 0;
                const defended = this.isSquareAttacked(simulatedGame, reply.toRow, reply.toCol, myColor);
                const gain = defended ? (targetVal - attackVal) : targetVal;
                if (gain > 0) net += gain;
            }

            if (reply.isCheck) net += 100;
            if (this.isPromotionMove(reply)) net += 5000;

            if (net > worstNet) worstNet = net;
            if (worstNet > 1000) break;
        }

        return worstNet * 2;
    }

    // ═══════════════════════════════════════════════════════════════
    // CENTER VALUE (v1.3.0)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Évalue la proximité au centre d'une pièce selon son type.
     * Utilise this.centerValues (optionnel, configurable par niveau).
     */
    getCenterValue(pieceType, row, col) {
        if (!this.centerValues) return 0;

        const distance = Math.min(
            ...[3, 4].flatMap(centerRow => [3, 4].map(centerCol =>
                Math.abs(row - centerRow) + Math.abs(col - centerCol)
            ))
        );
        const proximity = [1, 0.65, 0.3, 0.1][distance] || 0;
        return (this.centerValues[pieceType] || 0) * proximity;
    }

    // ═══════════════════════════════════════════════════════════════
    // SUITE INCHANGÉE
    // ═══════════════════════════════════════════════════════════════

    getPiece(game, row, col) {
        if (!game?.board || !Number.isInteger(row) || !Number.isInteger(col)
            || row < 0 || row > 7 || col < 0 || col > 7) {
            return null;
        }

        const board = game.board;
        if (typeof board.getPiece === 'function') {
            const square = board.getPiece(row, col);
            return square?.piece || square || null;
        }

        const grid = board.grid || board;
        const square = grid[row]?.[col];
        return square?.piece || (square?.type ? square : null);
    }

    getAllLegalMoves(game, color) {
        if (!game?.moveValidator || !color) {
            throw new Error('Un jeu avec moveValidator et une couleur sont requis.');
        }

        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(game, row, col);
                if (!piece || !this._sameColor(piece.color, color)) continue;

                const possibleMoves = game.moveValidator.getPossibleMoves(piece, row, col) || [];
                for (const details of possibleMoves) {
                    const target = this.getPiece(game, details.row, details.col);
                    const isEnPassant = details.type === 'en-passant';
                    moves.push({
                        fromRow: row,
                        fromCol: col,
                        toRow: details.kingTo?.row ?? details.row,
                        toCol: details.kingTo?.col ?? details.col,
                        piece,
                        targetPiece: target || (isEnPassant ? { type: 'pawn' } : null),
                        isCapture: (!!target && !this._sameColor(target.color, color)) || isEnPassant,
                        isCheck: details.isCheck || false,
                        details,
                        promotion: details.isPromotion ? 'queen' : undefined
                    });
                }
            }
        }
        return moves;
    }

    isSquareAttacked(game, row, col, byColor) {
        if (!game?.moveValidator || !byColor) {
            throw new Error('Un jeu avec moveValidator et une couleur sont requis.');
        }

        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.getPiece(game, fromRow, fromCol);
                if (!piece || !this._sameColor(piece.color, byColor)) continue;

                const moves = game.moveValidator.getPossibleMoves(piece, fromRow, fromCol) || [];
                if (moves.some(move => move.row === row && move.col === col)) return true;
            }
        }
        return false;
    }

    findKing(game, color) {
        if (!color) throw new Error('Une couleur est requise pour trouver le roi.');

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(game, row, col);
                if (piece?.type === 'king' && this._sameColor(piece.color, color)) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    getMaterialBalance(game, color) {
        if (!color) throw new Error('Une couleur est requise pour évaluer le matériel.');

        let balance = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(game, row, col);
                if (!piece || piece.type === 'king') continue;

                const value = this.pieceValues[piece.type] || 0;
                balance += this._sameColor(piece.color, color) ? value : -value;
            }
        }
        return balance;
    }

    getDoubledPawnCount(game, color) {
        const pawnsByFile = this._getPawnCountsByFile(game, color);
        return pawnsByFile.reduce((total, count) => total + Math.max(0, count - 1), 0);
    }

    getPawnIslandCount(game, color) {
        const pawnsByFile = this._getPawnCountsByFile(game, color);
        return pawnsByFile.reduce((islands, count, col) =>
            count > 0 && (col === 0 || pawnsByFile[col - 1] === 0) ? islands + 1 : islands, 0);
    }

    getConnectedPawnPairCount(game, color) {
        const supportRowOffset = this._sameColor(color, 'white') ? 1 : -1;
        let pairCount = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const pawn = this.getPiece(game, row, col);
                if (pawn?.type !== 'pawn' || !this._sameColor(pawn.color, color)) continue;

                const supportRow = row + supportRowOffset;
                if (supportRow < 0 || supportRow > 7) continue;
                for (const supportCol of [col - 1, col + 1]) {
                    if (supportCol < 0 || supportCol > 7) continue;
                    const supporter = this.getPiece(game, supportRow, supportCol);
                    if (supporter?.type === 'pawn' && this._sameColor(supporter.color, color)) {
                        pairCount++;
                    }
                }
            }
        }
        return pairCount;
    }

    getIsolatedPawnCount(game, color) {
        const pawnsByFile = this._getPawnCountsByFile(game, color);
        let isolated = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const pawn = this.getPiece(game, row, col);
                if (pawn?.type !== 'pawn' || !this._sameColor(pawn.color, color)) continue;

                const hasLeftSupport = col > 0 && pawnsByFile[col - 1] > 0;
                const hasRightSupport = col < 7 && pawnsByFile[col + 1] > 0;
                if (!hasLeftSupport && !hasRightSupport) isolated++;
            }
        }
        return isolated;
    }

    getDoubledRookFileCount(game, color) {
        const rooksByFile = Array(8).fill(0);
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(game, row, col);
                if (piece?.type === 'rook' && this._sameColor(piece.color, color)) {
                    rooksByFile[col]++;
                }
            }
        }
        return rooksByFile.filter(count => count > 1).length;
    }

    getMajorPieceFileScore(game, color) {
        const ownPawns = this._getPawnCountsByFile(game, color);
        const opponent = this._oppositeColor(color);
        const opponentPawns = this._getPawnCountsByFile(game, opponent);
        let score = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(game, row, col);
                if (!piece || !this._sameColor(piece.color, color)
                    || !['rook', 'queen'].includes(piece.type) || ownPawns[col] > 0) {
                    continue;
                }
                score += opponentPawns[col] === 0 ? 2 : 1;
            }
        }
        return score;
    }

    getAdvancedMajorPieceRankCount(game, color) {
        const firstOpponentRow = this._sameColor(color, 'white') ? 0 : 4;
        const lastOpponentRow = this._sameColor(color, 'white') ? 3 : 7;
        const occupiedRanks = new Set();

        for (let row = firstOpponentRow; row <= lastOpponentRow; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(game, row, col);
                if (piece && this._sameColor(piece.color, color)
                    && ['rook', 'queen'].includes(piece.type)) {
                    occupiedRanks.add(row);
                }
            }
        }
        return occupiedRanks.size;
    }

    getCenterControlScore(game, color) {
        if (!game?.moveValidator?.generateCurrentFEN || typeof ChessEngine === 'undefined') {
            throw new Error('Le validateur et ChessEngine sont requis pour évaluer le centre.');
        }

        const engine = new ChessEngine(game.moveValidator.generateCurrentFEN(color));
        const colorCode = this._sameColor(color, 'white') ? 'w' : 'b';
        let score = 0;
        for (const [row, col] of [[3, 3], [3, 4], [4, 3], [4, 4]]) {
            const piece = this.getPiece(game, row, col);
            if (piece && this._sameColor(piece.color, color)) score++;
            if (engine.isSquareAttacked(row, col, colorCode)) score++;
        }
        return score;
    }

    isPromotionMove(move) {
        return move?.piece?.type === 'pawn'
            && (move.details?.isPromotion || move.toRow === 0 || move.toRow === 7);
    }

    isKingInCheck(game, color) {
        const king = this.findKing(game, color);
        if (!king) return false;
        return this.isSquareAttacked(game, king.row, king.col, this._oppositeColor(color));
    }

    isStalemate(game, colorToMove) {
        if (!game?.moveValidator) return false;

        const legalMoves = this.getAllLegalMoves(game, colorToMove);
        if (legalMoves.length > 0) return false;

        return !this.isKingInCheck(game, colorToMove);
    }

    isStalemateAfterMove(game, move, opponentColor, simulated = null) {
        const afterMove = simulated || this.simulateMove(game, move);
        if (!afterMove) return false;
        return this.isStalemate(afterMove, opponentColor);
    }

    countAttackersOnSquare(game, row, col, byColor) {
        if (!game?.moveValidator || !byColor) return 0;

        let count = 0;
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.getPiece(game, fromRow, fromCol);
                if (!piece || !this._sameColor(piece.color, byColor)) continue;

                const moves = game.moveValidator.getPossibleMoves(piece, fromRow, fromCol) || [];
                if (moves.some(move => move.row === row && move.col === col)) count++;
            }
        }
        return count;
    }

    isKingUnderThreat(game, color) {
        const king = this.findKing(game, color);
        if (!king) return false;

        const oppColor = this._oppositeColor(color);
        const attackers = this.countAttackersOnSquare(game, king.row, king.col, oppColor);
        if (attackers >= 2) return true;

        return king.row === 0 || king.row === 7 || king.col === 0 || king.col === 7;
    }

    opponentCanMateInOne(game, oppColor, myColor, simulated = null) {
        if (!game?.moveValidator) return false;
        const position = simulated || game;

        const oppMoves = this.getAllLegalMoves(position, oppColor);
        for (const oppMove of oppMoves) {
            const afterOpp = this.simulateMove(position, oppMove);
            if (!afterOpp) continue;

            const myMoves = this.getAllLegalMoves(afterOpp, myColor);
            if (myMoves.length !== 0) continue;

            const myKing = this.findKing(afterOpp, myColor);
            if (myKing && this.isSquareAttacked(afterOpp, myKing.row, myKing.col, oppColor)) {
                return true;
            }
        }
        return false;
    }

    simulateMove(game, move) {
        if (typeof BoardPosition === 'undefined' || typeof MoveValidator === 'undefined') {
            throw new Error('BoardPosition et MoveValidator sont requis pour simuler un coup.');
        }
        if (!game?.board || !game.gameState || !move) {
            throw new Error('Un jeu, son état et un coup sont requis pour la simulation.');
        }

        const board = new BoardPosition();
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(game, row, col);
                if (piece) board.setPiece(row, col, { ...piece });
            }
        }

        const previousState = game.gameState;
        const state = {
            ...previousState,
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
            }
        };
        const simulated = { board, gameState: state };
        simulated.moveValidator = new MoveValidator(board, state);

        const movingPiece = board.getPiece(move.fromRow, move.fromCol);
        if (!movingPiece) throw new Error('Pièce absente de la position simulée.');

        const details = move.details || {};
        const toRow = details.kingTo?.row ?? move.toRow;
        const toCol = details.kingTo?.col ?? move.toCol;
        const capturedPiece = board.getPiece(toRow, toCol);
        const isCapture = !!capturedPiece || details.type === 'en-passant';

        if (details.type === 'castling') {
            const rook = board.getPiece(details.rookFrom?.row, details.rookFrom?.col);
            if (!rook || !details.rookTo) {
                throw new Error('Les informations de tour du roque sont incomplètes.');
            }
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
            if (this.isPromotionMove({ ...move, toRow })) {
                movingPiece.type = move.promotion || 'queen';
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
        state.currentPlayer = this._oppositeColor(state.currentPlayer);
        return simulated;
    }

    getImmediateExchangeGain(game, move) {
        const details = move?.details || {};
        const row = details.kingTo?.row ?? move?.toRow;
        const col = details.kingTo?.col ?? move?.toCol;
        const capturedPiece = details.type === 'en-passant'
            ? { type: 'pawn' }
            : this.getPiece(game, row, col);
        const capturedValue = capturedPiece ? this.pieceValues[capturedPiece.type] || 0 : 0;
        const promotionGain = this.isPromotionMove(move)
            ? (this.pieceValues.queen || 0) - (this.pieceValues.pawn || 0)
            : 0;
        return capturedValue + promotionGain;
    }

    bestExchange(game, targetRow, targetCol, capturingColor, depth = 0) {
        if (depth >= this.maxExchangeDepth) return 0;

        const target = this.getPiece(game, targetRow, targetCol);
        if (!target || this._sameColor(target.color, capturingColor)) return 0;

        const capturedValue = this.pieceValues[target.type] || 0;
        let bestScore = 0;
        for (const move of this.getAllLegalMoves(game, capturingColor)) {
            if (move.toRow !== targetRow || move.toCol !== targetCol || !move.isCapture) continue;

            const promotionGain = move.piece.type === 'pawn' && (targetRow === 0 || targetRow === 7)
                ? (this.pieceValues.queen || 0) - (this.pieceValues.pawn || 0)
                : 0;
            const afterCapture = this.simulateMove(game, move);
            const score = capturedValue + promotionGain
                - this.bestExchange(afterCapture, targetRow, targetCol, this._oppositeColor(capturingColor), depth + 1);
            bestScore = Math.max(bestScore, score);
        }
        return bestScore;
    }

    evaluateExchange(game, move, color) {
        const immediateGain = this.getImmediateExchangeGain(game, move);
        if (immediateGain === 0) return 0;

        const details = move.details || {};
        const row = details.kingTo?.row ?? move.toRow;
        const col = details.kingTo?.col ?? move.toCol;
        const afterMove = this.simulateMove(game, move);
        return immediateGain - this.bestExchange(afterMove, row, col, this._oppositeColor(color));
    }

    evaluateMoveExposure(game, move, opponentColor, simulated = null) {
        const afterMove = simulated || this.simulateMove(game, move);
        const row = move.details?.kingTo?.row ?? move.toRow;
        const col = move.details?.kingTo?.col ?? move.toCol;
        return this.bestExchange(afterMove, row, col, opponentColor);
    }

    getKnightForkTargets(game, move, color, includePawns = false, simulated = null) {
        if (move?.piece?.type !== 'knight') return [];

        const afterMove = simulated || this.simulateMove(game, move);
        const knight = this.getPiece(afterMove, move.toRow, move.toCol);
        if (knight?.type !== 'knight' || !this._sameColor(knight.color, color)) return [];

        const opponentColor = this._oppositeColor(color);
        return (afterMove.moveValidator.getPossibleMoves(knight, move.toRow, move.toCol) || [])
            .map(square => ({
                row: square.row,
                col: square.col,
                piece: this.getPiece(afterMove, square.row, square.col)
            }))
            .filter(target => target.piece
                && this._sameColor(target.piece.color, opponentColor)
                && (includePawns || target.piece.type !== 'pawn'));
    }

    getSafeKnightForkBonus(game, move, color, options = {}) {
        if (move?.piece?.type !== 'knight') return 0;

        const simulated = options.simulated || this.simulateMove(game, move);
        const exposure = options.exposure
            ?? this.evaluateMoveExposure(game, move, this._oppositeColor(color), simulated);
        if (exposure > 0) return 0;

        const targets = this.getKnightForkTargets(
            game,
            move,
            color,
            options.includePawns === true,
            simulated
        );
        if (targets.length < (options.minimumTargets ?? 2)) return 0;

        const mostValuableTarget = Math.max(...targets.map(target =>
            this.pieceValues[target.piece.type] || 0
        ));
        const baseBonus = options.baseBonus ?? 150;
        const perExtraTarget = options.perExtraTarget ?? 50;
        const targetValueFactor = options.targetValueFactor ?? 0.1;
        const maximumBonus = options.maximumBonus ?? 300;
        return Math.min(
            maximumBonus,
            baseBonus + (targets.length - 2) * perExtraTarget + mostValuableTarget * targetValueFactor
        );
    }

    getFavorableTradeBonus(game, move, color, advantageThreshold = this.pieceValues.knight, bonus = 100) {
        if (!move?.isCapture || !move.targetPiece || move.piece?.type === 'pawn'
            || move.targetPiece.type === 'pawn'
            || this.getMaterialBalance(game, color) < advantageThreshold) {
            return 0;
        }

        const attackerValue = this.pieceValues[move.piece.type] || 0;
        const targetValue = this.pieceValues[move.targetPiece.type] || 0;
        return targetValue >= attackerValue ? bonus : 0;
    }

    finalize(move) {
        if (!move) return null;
        return {
            fromRow: move.fromRow,
            fromCol: move.fromCol,
            toRow: move.toRow,
            toCol: move.toCol,
            promotion: move.promotion
                || (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)
                    ? 'queen'
                    : undefined)
        };
    }

    countPieces(game) {
        let count = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.getPiece(game, row, col)) count++;
            }
        }
        return count;
    }

    getBestMoves(moves, thresholdRatio = 0.75) {
        if (!moves?.length) return [];
        const sortedMoves = [...moves].sort((a, b) => b._finalScore - a._finalScore);
        const bestScore = sortedMoves[0]._finalScore;
        const threshold = bestScore > 0
            ? bestScore * thresholdRatio
            : bestScore * (2 - thresholdRatio);
        return sortedMoves.filter(move => move._finalScore >= threshold);
    }

    chooseBestMove(moves, thresholdRatio = 0.75) {
        const candidates = this.getBestMoves(moves, thresholdRatio);
        return candidates.length
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : null;
    }

    _updateCastlingState(state, movingPiece, move, capturedPiece) {
        const color = movingPiece.color;
        const homeRow = this._sameColor(color, 'white') ? 7 : 0;

        if (movingPiece.type === 'king') {
            state.hasKingMoved[color] = true;
            if (state.castlingRights[color]) {
                state.castlingRights[color].kingside = false;
                state.castlingRights[color].queenside = false;
            }
        }

        if (movingPiece.type === 'rook' && move.fromRow === homeRow) {
            const side = move.fromCol === 0 ? 'queenside' : move.fromCol === 7 ? 'kingside' : null;
            if (side && state.hasRookMoved[color]) state.hasRookMoved[color][side] = true;
        }

        if (capturedPiece?.type === 'rook') {
            const capturedColor = capturedPiece.color;
            const capturedHomeRow = this._sameColor(capturedColor, 'white') ? 7 : 0;
            const toRow = move.details?.kingTo?.row ?? move.toRow;
            const toCol = move.details?.kingTo?.col ?? move.toCol;
            const side = toRow === capturedHomeRow
                ? (toCol === 0 ? 'queenside' : toCol === 7 ? 'kingside' : null)
                : null;
            if (side && state.hasRookMoved[capturedColor]) state.hasRookMoved[capturedColor][side] = true;
        }
    }

    _getPawnCountsByFile(game, color) {
        const counts = Array(8).fill(0);
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(game, row, col);
                if (piece?.type === 'pawn' && this._sameColor(piece.color, color)) counts[col]++;
            }
        }
        return counts;
    }

    _sameColor(first, second) {
        return typeof first === 'string'
            && typeof second === 'string'
            && first.charAt(0).toLowerCase() === second.charAt(0).toLowerCase();
    }

    _oppositeColor(color) {
        return this._sameColor(color, 'white') ? 'black' : 'white';
    }
}

window.GameFonctions = GameFonctions;