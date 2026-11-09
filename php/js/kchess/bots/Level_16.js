/**
 * Level_16 - Level 8 + ouverture + depth-1 + mat en 1 + anti-pat + anti-mat + sécurité roi
 * Version 1.4.0 - Migration complète vers GameFonctions v1.3.0
 *
 * Changelog v1.4.0 :
 *   - Toutes les méthodes communes sont maintenant dans GameFonctions v1.3.0
 *   - Le fichier ne contient plus que :
 *     * le pipeline de décision (getMove)
 *     * les helpers d'ouverture (spécifiques au bot)
 *     * l'heuristique _shouldCheckStalemate
 *   - Compatible avec GameFonctions.attach() v1.3.0 :
 *     _opponentBestReplyPenalty, _getCenterValue, _getBestMove,
 *     _isKingUnderThreatAfterMove, _opponentCanMateInOne,
 *     _countAttackersOnSquare, etc. sont injectés par attach().
 */
class Level_16 {
    // Profondeur de recherche réelle (lue par newGame.php pour l'affichage)
    static SEARCH_DEPTH = 1;

    static VERSION = '1.4.0';

    constructor() {
        this.name = "Bot Level 16 (L8 + ouverture + depth1 + mat/anti-pat/anti-mat)";
        this.level = 16;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        this.centerValues = { 'pawn': 150, 'knight': 135, 'bishop': 100, 'rook': 55, 'queen': 45, 'king': 0 };
        this.gameFonctions = GameFonctions.attach(this);

        // Limite de réponses adverses examinées (passé à GameFonctions via attach)
        this.maxOppCaptures = 8;
    }

    /**
     * Process du niveau, dans l'ordre d'exécution (lu par Bot_Process.php).
     * Étape 1 : les paramètres (maxPlies, stalePieces, replyLimit) sont lus par le code ; les on/off sont descriptifs.
     */
    get PROCESS_CONFIG() {
        return {
            ouverture_livre: { maxPlies: 6 },
            mat_en_1: true,
            echange_statique: true,
            exposition_piece_jouee: true,
            bonus_positionnels: true,
            structure_base: true,
            structure_avancee: true,
            reponse_adverse: { replyLimit: this.maxOppCaptures },
            garde_pat: { stalePieces: 12 },
            securite_roi: true,
            menace_mat_en_1: true,
            promotion_prioritaire: true,
            choix_meilleur: true
        };
    }

    get PIPELINE() {
        return Object.entries(this.PROCESS_CONFIG).map(([id, v]) => id + (id === 'reponse_adverse' ? `(${v.replyLimit})` : ''));
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
                    if (this._opponentCanMateInOne(afterMove, oppColor, myColor)) {
                        score -= 100000;
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
        if (pieceCount <= this.PROCESS_CONFIG.garde_pat.stalePieces) return true;

        const oppKing = this._findKing(afterMove, oppColor);
        if (!oppKing) return false;
        return oppKing.r === 0 || oppKing.r === 7 || oppKing.c === 0 || oppKing.c === 7;
    }

    // =====================================================================
    // OUVERTURE (spécifique au bot)
    // =====================================================================

    _tryOpeningMove(game, color) {
        if (typeof window.GameOuverture === 'undefined') return null;

        const history = game.gameState.moveHistory || [];
        if (history.length >= this.PROCESS_CONFIG.ouverture_livre.maxPlies) return null;

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
}

window.Level_16 = Level_16;