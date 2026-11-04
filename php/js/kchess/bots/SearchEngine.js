/**
 * bots/SearchEngine.js
 * Moteur de recherche : orchestre la pipeline de décision d'un bot.
 *
 * Pipeline standard :
 *   0. Ouverture (optionnel)
 *   1. Mat en 1
 *   2. Évaluation depth-1 avec pénalité réponse adverse
 *   3. Mat en 2 (optionnel)
 *   4. Promotions prioritaires
 *   5. Comportement de finale (optionnel)
 *   6. Sélection finale
 *
 * Version : 1.0.0
 */
class SearchEngine {
    static VERSION = '1.0.0';

    /**
     * @param {Evaluator} evaluator
     * @param {Object} gameFonctions  Instance GameFonctions attachée
     * @param {Object} options
     * @param {Boolean} options.enableOpening     Active le livre GameOuverture
     * @param {Boolean} options.enableMateInOne   Active la détection mat en 1
     * @param {Boolean} options.enableMateInTwo   Active la détection mat en 2
     * @param {Number}  options.maxOppReplies     Limite de réponses adverses examinées
     * @param {Boolean} options.enableEndgame     Active le comportement agressif en finale
     * @param {Number}  options.mateInTwoMaxCandidates
     */
    constructor(evaluator, gameFonctions, options = {}) {
        if (!evaluator) throw new Error('SearchEngine: evaluator requis.');
        if (!gameFonctions) throw new Error('SearchEngine: gameFonctions requis.');

        this.evaluator = evaluator;
        this.gf = gameFonctions;

        this.enableOpening = options.enableOpening !== false;
        this.enableMateInOne = options.enableMateInOne !== false;
        this.enableMateInTwo = options.enableMateInTwo === true;
        this.enableEndgame = options.enableEndgame !== false;
        this.maxOppReplies = options.maxOppReplies ?? 10;
        this.mateInTwoMaxCandidates = options.mateInTwoMaxCandidates ?? 12;
    }

    // =====================================================================
    // PIPELINE
    // =====================================================================

    async findBestMove(game) {
        if (!game) return null;

        const color = game.gameState.currentPlayer;
        const oppColor = this._opposite(color);

        // 0. Ouverture
        if (this.enableOpening) {
            const openingMove = this._tryOpeningMove(game, color);
            if (openingMove) return this._finalize(openingMove);
        }

        // 1. Coups légaux
        const allMoves = this.gf.getAllLegalMoves(game, color);
        if (allMoves.length === 0) return null;

        // 2. Mat en 1
        if (this.enableMateInOne) {
            const mateMove = this._findMateInOne(game, color, allMoves);
            if (mateMove) return this._finalize(mateMove);
        }

        // 3. Depth-1 avec pénalité réponse adverse
        const scoredMoves = this._scoreDepthOne(game, allMoves, color, oppColor);

        // 4. Mat en 2
        if (this.enableMateInTwo) {
            const mateInTwo = this._findMateInTwo(game, color, oppColor, scoredMoves);
            if (mateInTwo) return this._finalize(mateInTwo);
        }

        // 5. Promotions
        const promotions = scoredMoves.filter(m => this.gf.isPromotionMove(m));
        if (promotions.length > 0) {
            promotions.sort((a, b) => b._score - a._score);
            return this._finalize(promotions[0]);
        }

        // 6. Finale
        if (this.enableEndgame && this._isEndgame(game)) {
            const endgamePick = this._pickEndgameMove(game, scoredMoves, color, oppColor);
            if (endgamePick) return this._finalize(endgamePick);
        }

        // 7. Sélection finale
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

        return this.gf.getAllLegalMoves(game, color).find(m =>
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

    // =====================================================================
    // 2. MAT EN 1
    // =====================================================================

    _findMateInOne(game, color, moves) {
        const oppColor = this._opposite(color);
        for (const move of moves) {
            const simulated = this.gf.simulateMove(game, move);
            if (!simulated) continue;
            const oppMoves = this.gf.getAllLegalMoves(simulated, oppColor);
            const inCheck = this._isKingInCheck(simulated, oppColor);
            if (inCheck && oppMoves.length === 0) return move;
        }
        return null;
    }

    // =====================================================================
    // 3. ECMO DEPTH-1
    // =====================================================================

    _scoreDepthOne(game, allMoves, color, oppColor) {
        const baseline = this.evaluator.captureBaseline(game, color);

        for (const move of allMoves) {
            const simulated = this.gf.simulateMove(game, move);
            if (!simulated) { move._score = -Infinity; continue; }

            const exposure = this.gf.evaluateMoveExposure(game, move, oppColor, simulated);
            move._exposure = exposure;

            let score = this.evaluator.scoreMove(game, move, color, baseline, exposure);
            score -= this._opponentBestReplyPenalty(simulated, oppColor, color);

            move._score = score;
        }
        return allMoves;
    }

    _opponentBestReplyPenalty(simulatedGame, oppColor, myColor) {
        const replies = this.gf.getAllLegalMoves(simulatedGame, oppColor);
        if (replies.length === 0) return 0;

        let worst = 0;
        let examined = 0;

        for (const reply of replies) {
            if (!reply.isCapture && !reply.isCheck) continue;
            if (++examined > this.maxOppReplies) break;

            let penalty = 0;

            if (reply.isCapture && reply.targetPiece) {
                const attackVal = this.evaluator.pieceValues[reply.piece.type] || 0;
                const targetVal = this.evaluator.pieceValues[reply.targetPiece.type] || 0;
                const defended = this._isSquareAttacked(
                    simulatedGame, reply.toRow, reply.toCol, myColor
                );
                const gain = defended ? (targetVal - attackVal) : targetVal;
                if (gain > 0) penalty += (gain / 100) * 1.5;
            }

            if (reply.isCheck) penalty += 1.5;
            if (this.gf.isPromotionMove(reply)) penalty += 50;

            if (penalty > worst) worst = penalty;
            if (worst > 20) break;
        }
        return worst * 2;
    }

    // =====================================================================
    // 4. MAT EN 2
    // =====================================================================

    _findMateInTwo(game, color, oppColor, candidateMoves) {
        const checkingMoves = [];
        for (const move of candidateMoves) {
            const sim = this.gf.simulateMove(game, move);
            if (sim && this._isKingInCheck(sim, oppColor)) {
                checkingMoves.push({ move, sim });
            }
            if (checkingMoves.length >= this.mateInTwoMaxCandidates) break;
        }
        if (checkingMoves.length === 0) return null;

        for (const { move, sim } of checkingMoves) {
            const oppReplies = this.gf.getAllLegalMoves(sim, oppColor);
            if (oppReplies.length === 0) continue;

            let allLeadToMate = true;
            for (const reply of oppReplies) {
                const afterReply = this.gf.simulateMove(sim, reply);
                if (!afterReply) { allLeadToMate = false; break; }
                const myMoves = this.gf.getAllLegalMoves(afterReply, color);
                if (!this._findMateInOne(afterReply, color, myMoves)) {
                    allLeadToMate = false;
                    break;
                }
            }
            if (allLeadToMate) return move;
        }
        return null;
    }

    // =====================================================================
    // 5/6. FINALE + SÉLECTION
    // =====================================================================

    _pickEndgameMove(game, scoredMoves, color, oppColor) {
        const pawnMoves = scoredMoves.filter(m => m.piece?.type === 'pawn');
        if (pawnMoves.length > 0) {
            const safest = this._preferSafestMoves(pawnMoves, game, oppColor);
            safest.sort((a, b) => {
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
            const oppKing = this.gf.findKing(game, oppColor);
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
        return scoredMoves[0];
    }

    _preferSafestMoves(moves, game, opponent) {
        moves.forEach(move => {
            if (move._exposure === undefined) {
                move._exposure = this.gf.evaluateMoveExposure(game, move, opponent);
            }
        });
        const minExposure = Math.min(...moves.map(m => m._exposure ?? 0));
        return moves.filter(m => (m._exposure ?? 0) === minExposure);
    }

    // =====================================================================
    // HELPERS
    // =====================================================================

    _isEndgame(game) {
        if (!game) return false;
        let heavy = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.gf.getPiece(game, r, c);
                if (piece && piece.type !== 'pawn' && piece.type !== 'king') heavy++;
            }
        }
        return heavy <= 4;
    }

    _isKingInCheck(game, color) {
        const king = this.gf.findKing(game, color);
        if (!king) return false;
        return this._isSquareAttacked(game, king.row, king.col, this._opposite(color));
    }

    _isSquareAttacked(game, row, col, byColor) {
        const key = byColor.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.gf.getPiece(game, r, c);
                if (!piece || piece.color.charAt(0).toLowerCase() !== key) continue;
                const moves = game.moveValidator.getPossibleMoves(piece, r, c) || [];
                if (moves.some(m => m.row === row && m.col === col)) return true;
            }
        }
        return false;
    }

    _sameColor(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') return false;
        return a.charAt(0).toLowerCase() === b.charAt(0).toLowerCase();
    }

    _opposite(color) {
        return (color || '').toLowerCase().startsWith('w') ? 'black' : 'white';
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

window.SearchEngine = SearchEngine;