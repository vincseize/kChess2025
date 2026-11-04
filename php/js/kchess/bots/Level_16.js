/**
 * Level_16 - Bot Killer
 * Version 5.1.0 - ECMO depth-1 optimisé + ouverture + mat en 1
 *
 * Pipeline :
 *   0. Ouverture (game_ouverture.js) si phase d'ouverture
 *   1. Mat en 1
 *   2. ECMO depth=1 : score statique + pénalité réponse adverse légère (SEE simplifié)
 *   3. Mat en 2 (désactivé par défaut pour la perf — activable via enableMateInTwo)
 *   4. Sélection finale (promotions > finale > meilleur score)
 *
 * Optimisations perf (v5.1.0) :
 *   - Réponses adverses limitées à 10, skip non-captures/non-échecs
 *   - SEE simplifié (pas de _bestExchange récursif)
 *   - _getCenterControlScore sans ChessEngine
 *   - _isSquareAttacked en fallback manuel
 *   - Mat en 2 désactivé par défaut
 */
class Level_16 extends BotBase {
    static VERSION = '5.1.0';

    constructor() {
        super();
        this.name = "Bot Level 16 (Killer)";
        this.level = 16;
        this.pieceValues = {
            pawn: 1,
            knight: 3.2,
            bishop: 3.3,
            rook: 5,
            queen: 9,
            king: 100
        };
        this.gameFonctions = GameFonctions.attach(this);

        // ---- PERF ----
        this.maxOppRepliesExamined = 10;        // limite de réponses adverses examinées
        this.mateInTwoMaxCandidates = 12;
        this.enableMateInTwo = false;           // désactivé par défaut (coûteux)
        this.useChessEngineForAttack = false;   // fallback manuel plus rapide que parse FEN
    }

    // =====================================================================
    // PIPELINE PRINCIPAL
    // =====================================================================

    async getMove() {
        const game = window.chessGame?.core || window.chessGame;
        if (!game) return { error: 'engine_not_found' };

        const color = game.gameState.currentPlayer;
        const oppColor = this._opposite(color);

        // ---- 0. OUVERTURE ----
        const openingMove = this._tryOpeningMove(game, color);
        if (openingMove) return this._finalize(openingMove);

        // ---- 1. COUPS LÉGAUX ----
        const allMoves = this._getAllLegalMoves(game, color);
        if (allMoves.length === 0) return null;

        // ---- 2. MAT EN 1 ----
        const mateMove = this._findMateInOne(game, color, allMoves);
        if (mateMove) return this._finalize(mateMove);

        // ---- 3. ECMO DEPTH-1 ----
        const scoredMoves = this._scoreDepthOne(game, allMoves, color, oppColor);

        // ---- 4. MAT EN 2 (optionnel) ----
        if (this.enableMateInTwo) {
            const mateInTwo = this._findMateInTwo(game, color, oppColor, scoredMoves);
            if (mateInTwo) return this._finalize(mateInTwo);
        }

        // ---- 5. PROMOTIONS ----
        const promotions = scoredMoves.filter(m => this._isPromotionMove(m));
        if (promotions.length > 0) {
            promotions.sort((a, b) => b._score - a._score);
            return this._finalize(promotions[0]);
        }

        // ---- 6. FINALE ----
        if (this._isEndgame(game)) {
            const endgamePick = this._pickEndgameMove(game, scoredMoves, color, oppColor);
            if (endgamePick) return this._finalize(endgamePick);
        }

        // ---- 7. SÉLECTION FINALE ----
        return this._finalize(this._pickBest(scoredMoves));
    }

    // =====================================================================
    // 0. OUVERTURE
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

        const legal = this._getAllLegalMoves(game, color).find(m =>
            m.fromRow === from.row && m.fromCol === from.col &&
            m.toRow === to.row && m.toCol === to.col
        );
        return legal || null;
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

    // =====================================================================
    // 2. MAT EN 1
    // =====================================================================

    _findMateInOne(game, color, moves) {
        const oppColor = this._opposite(color);
        for (const move of moves) {
            const simulated = this._simulateMove(game, move);
            if (!simulated) continue;
            const oppMoves = this._getAllLegalMoves(simulated, oppColor);
            const inCheck = this._isKingInCheck(simulated, oppColor);
            if (inCheck && oppMoves.length === 0) return move;
        }
        return null;
    }

    // =====================================================================
    // 3. ECMO DEPTH-1
    // =====================================================================

    _scoreDepthOne(game, allMoves, color, oppColor) {
        const baseline = this._captureBaseline(game, color);

        for (const move of allMoves) {
            const simulated = this._simulateMove(game, move);
            if (!simulated) { move._score = -Infinity; continue; }

            const exposure = this._evaluateMoveExposure(game, move, oppColor, simulated);
            move._exposure = exposure;

            let score = this._evaluateStatic(simulated, move, color, oppColor, baseline, exposure);
            score -= this._opponentBestReplyPenalty(simulated, oppColor, color);

            move._score = score;
        }
        return allMoves;
    }

    _captureBaseline(game, color) {
        return {
            center: this._getCenterControlScore(game, color),
            doubledPawns: this._getDoubledPawnCount(game, color),
            islands: this._getPawnIslandCount(game, color),
            majorFiles: this._getMajorPieceFileScore(game, color),
            connectedPawns: this._getConnectedPawnPairCount(game, color),
            doubledRooks: this._getDoubledRookFileCount(game, color),
            advancedRanks: this._getAdvancedMajorPieceRankCount(game, color)
        };
    }

    _evaluateStatic(simulated, move, color, oppColor, baseline, exposure) {
        let score = 0;

        // 1. Captures
        if (move.isCapture && move.targetPiece) {
            const captureValue = this.pieceValues[move.targetPiece.type] || 0;
            const attackerValue = this.pieceValues[move.piece.type] || 0;
            score += captureValue * 10;
            score += this._getFavorableTradeBonus(
                simulated, move, color, this.pieceValues.knight, 2
            );
            if (captureValue > attackerValue * 0.7) score += 0.5;
            if (exposure === 0) score += 0.3;
        }

        // 2. Promotion
        if (this._isPromotionMove(move)) score += 1000;

        // 3. Échec
        if (this._isKingInCheck(simulated, oppColor)) score += 1.5;

        // 4. Centre
        if (move.toRow >= 2 && move.toRow <= 5 && move.toCol >= 2 && move.toCol <= 5) {
            score += 0.1;
        }

        // 5. Développement en ouverture
        if (this._countPieces(simulated) > 20
            && (move.piece?.type === 'knight' || move.piece?.type === 'bishop')) {
            score += 0.05;
        }

        // 6. Sécurité & structure (deltas)
        score -= exposure * 0.5;
        score += (this._getCenterControlScore(simulated, color) - baseline.center) * 0.2;
        score -= (this._getDoubledPawnCount(simulated, color) - baseline.doubledPawns) * 0.5;
        score -= (this._getPawnIslandCount(simulated, color) - baseline.islands) * 0.5;
        score += (this._getMajorPieceFileScore(simulated, color) - baseline.majorFiles) * 0.2;
        move._linkedPawnDelta = this._getConnectedPawnPairCount(simulated, color) - baseline.connectedPawns;
        score += move._linkedPawnDelta * 0.3;
        score += (this._getDoubledRookFileCount(simulated, color) - baseline.doubledRooks) * 0.8;
        score += (this._getAdvancedMajorPieceRankCount(simulated, color) - baseline.advancedRanks) * 0.5;

        // 7. Fourchette de cavalier
        score += this.gameFonctions.getSafeKnightForkBonus(simulated, move, color, {
            simulated,
            exposure,
            baseBonus: 1.2,
            perExtraTarget: 0.4,
            targetValueFactor: 0.1,
            maximumBonus: 2.5
        });

        // 8. Roque
        if (move.details?.type === 'castling') score += 0.5;

        // 9. Sauver une pièce attaquée
        if (this._isSquareAttacked(simulated, move.fromRow, move.fromCol, oppColor)) {
            score += (this.pieceValues[move.piece.type] || 0) * 0.5;
        }

        return score;
    }

    /**
     * Pénalité légère basée sur la meilleure réponse adverse.
     * Version rapide v5.1.0 :
     *   - skip les réponses non-capturantes et non-échecs
     *   - SEE simplifié (pas de récursion _bestExchange)
     *   - limite maxOppRepliesExamined
     */
    _opponentBestReplyPenalty(simulatedGame, oppColor, myColor) {
        const replies = this._getAllLegalMoves(simulatedGame, oppColor);
        if (replies.length === 0) return 0;

        let worst = 0;
        let examined = 0;

        for (const reply of replies) {
            if (!reply.isCapture && !reply.isCheck) continue;
            if (++examined > this.maxOppRepliesExamined) break;

            let penalty = 0;

            if (reply.isCapture && reply.targetPiece) {
                const attackVal = this.pieceValues[reply.piece.type] || 0;
                const targetVal = this.pieceValues[reply.targetPiece.type] || 0;
                const defended = this._isSquareAttacked(
                    simulatedGame, reply.toRow, reply.toCol, myColor
                );
                const gain = defended ? (targetVal - attackVal) : targetVal;
                if (gain > 0) penalty += gain * 1.5;
            }

            if (reply.isCheck) penalty += 1.5;
            if (this._isPromotionMove(reply)) penalty += 50;

            if (penalty > worst) worst = penalty;
            if (worst > 20) break;
        }
        return worst * 2;
    }

    // =====================================================================
    // 4. MAT EN 2 (élagué, optionnel)
    // =====================================================================

    _findMateInTwo(game, color, oppColor, candidateMoves) {
        const checkingMoves = [];
        for (const move of candidateMoves) {
            const sim = this._simulateMove(game, move);
            if (sim && this._isKingInCheck(sim, oppColor)) {
                checkingMoves.push({ move, sim });
            }
            if (checkingMoves.length >= this.mateInTwoMaxCandidates) break;
        }
        if (checkingMoves.length === 0) return null;

        for (const { move, sim } of checkingMoves) {
            const oppReplies = this._getAllLegalMoves(sim, oppColor);
            if (oppReplies.length === 0) continue;

            let allLeadToMate = true;
            for (const reply of oppReplies) {
                const afterReply = this._simulateMove(sim, reply);
                if (!afterReply) { allLeadToMate = false; break; }

                const myMoves = this._getAllLegalMoves(afterReply, color);
                const mate = this._findMateInOne(afterReply, color, myMoves);
                if (!mate) { allLeadToMate = false; break; }
            }
            if (allLeadToMate) return move;
        }
        return null;
    }

    // =====================================================================
    // 5/6. FINALE + SÉLECTION FINALE
    // =====================================================================

    _pickEndgameMove(game, scoredMoves, color, oppColor) {
        const pawnMoves = scoredMoves.filter(m => m.piece?.type === 'pawn');
        if (pawnMoves.length > 0) {
            const safest = this._preferSafestMoves(pawnMoves, game, oppColor);
            safest.sort((a, b) => {
                const linkedDelta = (b._linkedPawnDelta || 0) - (a._linkedPawnDelta || 0);
                if (linkedDelta !== 0) return linkedDelta;
                const aProgress = color === 'white' ? 7 - a.toRow : a.toRow;
                const bProgress = color === 'white' ? 7 - b.toRow : b.toRow;
                return bProgress - aProgress;
            });
            return safest[0];
        }

        const kingMoves = this._preferSafestMoves(
            scoredMoves.filter(m => m.piece?.type === 'king'),
            game,
            oppColor
        );
        if (kingMoves.length > 0) {
            const oppKing = this._findKing(game, oppColor);
            if (oppKing) {
                kingMoves.sort((a, b) => {
                    const dA = Math.abs(a.toRow - oppKing.row) + Math.abs(a.toCol - oppKing.col);
                    const dB = Math.abs(b.toRow - oppKing.row) + Math.abs(b.toCol - oppKing.col);
                    return dA - dB;
                });
                return kingMoves[0];
            }
        }
        return null;
    }

    _pickBest(scoredMoves) {
        if (!scoredMoves || scoredMoves.length === 0) return null;

        scoredMoves.sort((a, b) => b._score - a._score);
        const best = scoredMoves[0];

        if (this._isEndgame(window.chessGame?.core || window.chessGame)) {
            const oppColor = this._opposite(best.piece?.color);
            if (this._isMoveAttackingKing(window.chessGame?.core || window.chessGame, best, oppColor)) {
                return best;
            }
        }

        return best;
    }

    _preferSafestMoves(moves, game, opponent) {
        moves.forEach(move => {
            if (move._exposure === undefined) {
                move._exposure = this._evaluateMoveExposure(game, move, opponent);
            }
        });
        const minExposure = Math.min(...moves.map(m => m._exposure ?? 0));
        return moves.filter(m => (m._exposure ?? 0) === minExposure);
    }

    // =====================================================================
    // ÉVALUATIONS PARTAGÉES (GameFonctions)
    // =====================================================================

    _evaluateMoveExposure(game, move, opponentColor, simulated = null) {
        return this.gameFonctions.evaluateMoveExposure(game, move, opponentColor, simulated);
    }

    _isPromotionMove(move) {
        return this.gameFonctions.isPromotionMove(move);
    }

    /**
     * Version rapide sans ChessEngine (parse FEN coûteux).
     * Occupation + contrôle via _isSquareAttacked (fallback manuel).
     */
    _getCenterControlScore(game, color) {
        const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
        let score = 0;
        for (const [row, col] of centerSquares) {
            const piece = this.gameFonctions.getPiece(game, row, col);
            if (piece && this._sameColor(piece.color, color)) score += 1;
            if (this._isSquareAttacked(game, row, col, color)) score += 1;
        }
        return score;
    }

    _getDoubledPawnCount(game, color) {
        return this.gameFonctions.getDoubledPawnCount(game, color);
    }

    _getPawnIslandCount(game, color) {
        return this.gameFonctions.getPawnIslandCount(game, color);
    }

    _getConnectedPawnPairCount(game, color) {
        return this.gameFonctions.getConnectedPawnPairCount(game, color);
    }

    _getDoubledRookFileCount(game, color) {
        return this.gameFonctions.getDoubledRookFileCount(game, color);
    }

    _getMajorPieceFileScore(game, color) {
        return this.gameFonctions.getMajorPieceFileScore(game, color);
    }

    _getAdvancedMajorPieceRankCount(game, color) {
        return this.gameFonctions.getAdvancedMajorPieceRankCount(game, color);
    }

    _getMaterialBalance(game, color) {
        return this.gameFonctions.getMaterialBalance(game, color);
    }

    _getFavorableTradeBonus(game, move, color, threshold, bonus) {
        return this.gameFonctions.getFavorableTradeBonus(game, move, color, threshold, bonus);
    }

    _countPieces(game) {
        return this.gameFonctions.countPieces(game);
    }

    // =====================================================================
    // SIMULATION & COUPS LÉGAUX
    // =====================================================================

    _simulateMove(game, move) {
        try {
            return this.gameFonctions.simulateMove(game, move);
        } catch (e) {
            return null;
        }
    }

    _getAllLegalMoves(game, color) {
        try {
            return this.gameFonctions.getAllLegalMoves(game, color);
        } catch (e) {
            return [];
        }
    }

    // =====================================================================
    // SÉCURITÉ / ROI
    // =====================================================================

    _isKingInCheck(game, color) {
        const king = this._findKing(game, color);
        if (!king) return false;
        return this._isSquareAttacked(game, king.row, king.col, this._opposite(color));
    }

    _isSquareAttacked(game, row, col, byColor) {
        if (this.useChessEngineForAttack && game.moveValidator?.generateCurrentFEN) {
            try {
                const fen = game.moveValidator.generateCurrentFEN(byColor);
                const engine = new ChessEngine(fen);
                return engine.isSquareAttacked(row, col, byColor.charAt(0).toLowerCase());
            } catch (e) {
                // fallback ci-dessous
            }
        }

        const key = byColor.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.gameFonctions.getPiece(game, r, c);
                if (!piece || piece.color.charAt(0).toLowerCase() !== key) continue;
                const moves = game.moveValidator.getPossibleMoves(piece, r, c) || [];
                if (moves.some(m => m.row === row && m.col === col)) return true;
            }
        }
        return false;
    }

    _findKing(game, color) {
        const king = this.gameFonctions.findKing(game, color);
        return king ? { row: king.row, col: king.col, r: king.row, c: king.col } : null;
    }

    _isMoveAttackingKing(game, move, oppColor) {
        const sim = this._simulateMove(game, move);
        return sim ? this._isKingInCheck(sim, oppColor) : false;
    }

    // =====================================================================
    // UTILITAIRES
    // =====================================================================

    _isEndgame(game) {
        if (!game) return false;
        let heavy = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.gameFonctions.getPiece(game, r, c);
                if (piece && piece.type !== 'pawn' && piece.type !== 'king') heavy++;
            }
        }
        return heavy <= 4;
    }

    _opposite(color) {
        return (color || '').toLowerCase().startsWith('w') ? 'black' : 'white';
    }

    _sameColor(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') return false;
        return a.charAt(0).toLowerCase() === b.charAt(0).toLowerCase();
    }

    _finalize(move) {
        if (!move) return null;

        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            move.promotion = 'queen';
        }

        delete move._exposure;
        delete move._score;
        delete move._linkedPawnDelta;

        return {
            fromRow: move.fromRow,
            fromCol: move.fromCol,
            toRow: move.toRow,
            toCol: move.toCol,
            promotion: move.promotion || undefined
        };
    }
}

window.Level_16 = Level_16;