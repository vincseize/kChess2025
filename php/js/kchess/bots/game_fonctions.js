/**
 * php/js/kchess/bots/game_fonctions.js
 * Utilitaires communs candidats à la mutualisation entre les bots.
 *
 * Ce fichier est autonome et n'est pas encore chargé par app.php ni utilisé
 * par les niveaux. Un niveau pourra l'inclure puis créer GameFonctions.
 */
class GameFonctions {
    static VERSION = '1.0.0';

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
    }

    /**
     * Lit une pièce sur le plateau avec compatibilité entre les différentes
     * représentations BoardPosition, ChessBoard et grilles simples.
     */
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

    /**
     * Énumère les coups légaux d'une couleur et conserve leurs détails
     * d'origine pour permettre la simulation (roque, en passant, promotion).
     */
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

    /**
     * Indique si une case est attaquée selon les coups produits par le
     * validateur courant.
     */
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

    /**
     * Recherche le roi d'une couleur et renvoie ses coordonnées, ou null s'il
     * n'est pas présent sur le plateau.
     */
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

    /**
     * Calcule le matériel net d'un camp. Les rois sont exclus, car leur valeur
     * est une sentinelle d'évaluation et non du matériel échangeable.
     */
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

    /**
     * Compte les pions en surplus sur leurs colonnes : deux pions sur la même
     * colonne en comptent un, trois en comptent deux.
     */
    getDoubledPawnCount(game, color) {
        const pawnsByFile = this._getPawnCountsByFile(game, color);
        return pawnsByFile.reduce((total, count) => total + Math.max(0, count - 1), 0);
    }

    /**
     * Compte les groupes de pions occupant des colonnes adjacentes. Une
     * augmentation du nombre de groupes correspond à la création d'un îlot.
     */
    getPawnIslandCount(game, color) {
        const pawnsByFile = this._getPawnCountsByFile(game, color);
        return pawnsByFile.reduce((islands, count, col) =>
            count > 0 && (col === 0 || pawnsByFile[col - 1] === 0) ? islands + 1 : islands, 0);
    }

    /**
     * Compte les paires de pions qui se défendent mutuellement en diagonale.
     */
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

    /**
     * Compte les pions isolés : ceux qui n'ont aucun pion allié sur une
     * colonne adjacente, même si ce pion est situé plusieurs rangées plus loin.
     */
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

    /**
     * Compte les colonnes sur lesquelles le camp possède au moins deux tours.
     */
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

    /**
     * Évalue le placement des tours et dames sur colonnes sans pion allié :
     * bonus supérieur si la colonne ne contient aucun pion adverse.
     */
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

    /**
     * Compte les rangées du camp adverse occupées par au moins une tour ou une
     * dame alliée. La valeur permet de favoriser ces pièces sur plusieurs
     * lignes plutôt que de les empiler sur une seule.
     */
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

    /**
     * Mesure occupation et contrôle des quatre cases centrales avec le moteur
     * d'échecs utilisé par l'application.
     */
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

    /**
     * Reconnaît un coup de promotion même si le validateur n'a pas renseigné
     * explicitement son indicateur isPromotion.
     */
    isPromotionMove(move) {
        return move?.piece?.type === 'pawn'
            && (move.details?.isPromotion || move.toRow === 0 || move.toRow === 7);
    }

    /**
     * Simule un coup sur un plateau indépendant sans altérer la partie réelle.
     * Les droits de roque et le dernier coup d'historique sont copiés pour que
     * le validateur simulé conserve le contexte nécessaire.
     */
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

    /**
     * Calcule la valeur matérielle immédiate d'une prise, en tenant compte de
     * l'en passant et du gain associé à une promotion en dame.
     */
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

    /**
     * Évalue une séquence de prises/reprises sur une case, chaque camp pouvant
     * choisir de ne pas poursuivre l'échange. La profondeur est plafonnée.
     */
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

    /**
     * Retourne le gain net d'une prise après les meilleures reprises légales
     * sur la case d'arrivée.
     */
    evaluateExchange(game, move, color) {
        const immediateGain = this.getImmediateExchangeGain(game, move);
        if (immediateGain === 0) return 0;

        const details = move.details || {};
        const row = details.kingTo?.row ?? move.toRow;
        const col = details.kingTo?.col ?? move.toCol;
        const afterMove = this.simulateMove(game, move);
        return immediateGain - this.bestExchange(afterMove, row, col, this._oppositeColor(color));
    }

    /**
     * Estime la valeur de la pièce déplacée exposée aux prises et reprises
     * adverses après simulation.
     */
    evaluateMoveExposure(game, move, opponentColor, simulated = null) {
        const afterMove = simulated || this.simulateMove(game, move);
        const row = move.details?.kingTo?.row ?? move.toRow;
        const col = move.details?.kingTo?.col ?? move.toCol;
        return this.bestExchange(afterMove, row, col, opponentColor);
    }

    /**
     * Trouve les pièces adverses attaquées par un cavalier après le coup
     * candidat. Les pions peuvent être inclus ou exclus selon la stratégie.
     */
    getKnightForkTargets(game, move, color, includePawns = false) {
        if (move?.piece?.type !== 'knight') return [];

        const simulated = this.simulateMove(game, move);
        const knight = this.getPiece(simulated, move.toRow, move.toCol);
        if (knight?.type !== 'knight' || !this._sameColor(knight.color, color)) return [];

        const opponentColor = this._oppositeColor(color);
        return (simulated.moveValidator.getPossibleMoves(knight, move.toRow, move.toCol) || [])
            .map(square => ({
                row: square.row,
                col: square.col,
                piece: this.getPiece(simulated, square.row, square.col)
            }))
            .filter(target => target.piece
                && this._sameColor(target.piece.color, opponentColor)
                && (includePawns || target.piece.type !== 'pawn'));
    }

    /**
     * Donne un bonus à une fourchette de cavalier seulement si elle attaque au
     * moins deux pièces adverses et si le cavalier ne peut pas être pris selon
     * l'évaluation locale des échanges.
     */
    getSafeKnightForkBonus(game, move, color, options = {}) {
        if (move?.piece?.type !== 'knight') return 0;

        const simulated = this.simulateMove(game, move);
        const exposure = options.exposure
            ?? this.evaluateMoveExposure(game, move, this._oppositeColor(color), simulated);
        if (exposure > 0) return 0;

        const targets = this.getKnightForkTargets(game, move, color, options.includePawns === true);
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

    /**
     * Ajoute un bonus à une prise de pièce au moins aussi précieuse que la
     * pièce attaquante, uniquement si le camp possède déjà un avantage matériel
     * supérieur ou égal au seuil fourni.
     */
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

    /**
     * Finalise un coup au format attendu par l'interface et choisit la dame
     * lorsque le pion atteint la dernière rangée.
     */
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

    /**
     * Compte le nombre total de pièces présentes, rois et pions compris.
     */
    countPieces(game) {
        let count = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.getPiece(game, row, col)) count++;
            }
        }
        return count;
    }

    /**
     * Retourne les coups parmi les meilleurs scores, avec une marge relative
     * configurable pour conserver le style parfois aléatoire des niveaux.
     */
    getBestMoves(moves, thresholdRatio = 0.75) {
        if (!moves?.length) return [];
        const sortedMoves = [...moves].sort((a, b) => b._finalScore - a._finalScore);
        const bestScore = sortedMoves[0]._finalScore;
        const threshold = bestScore > 0
            ? bestScore * thresholdRatio
            : bestScore * (2 - thresholdRatio);
        return sortedMoves.filter(move => move._finalScore >= threshold);
    }

    /**
     * Renvoie un meilleur coup tiré parmi les coups retenus par le seuil fourni.
     */
    chooseBestMove(moves, thresholdRatio = 0.75) {
        const candidates = this.getBestMoves(moves, thresholdRatio);
        return candidates.length
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : null;
    }

    /**
     * Met à jour les droits de roque dans l'état simulé après déplacement ou
     * capture d'un roi ou d'une tour.
     */
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

    /**
     * Compte les pions d'un camp par colonne. Utilisé par les évaluations de
     * pions doublés, d'îlots et de colonnes ouvertes.
     */
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

    /**
     * Compare les couleurs en tolérant les formats white/black et w/b.
     */
    _sameColor(first, second) {
        return typeof first === 'string'
            && typeof second === 'string'
            && first.charAt(0).toLowerCase() === second.charAt(0).toLowerCase();
    }

    /**
     * Renvoie la couleur adverse dans le format long du moteur.
     */
    _oppositeColor(color) {
        return this._sameColor(color, 'white') ? 'black' : 'white';
    }
}

window.GameFonctions = GameFonctions;
