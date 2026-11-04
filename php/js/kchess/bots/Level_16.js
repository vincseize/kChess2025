/**
 * Level_16 - Bot Killer (Simplifié mais efficace)
 * Version 3.2 - Priorité au petit roque
 */
class Level_16 {
    static VERSION = '3.2.0';

    constructor() {
        this.name = "Bot Level 16 (Killer)";
        this.level = 16;
        this.pieceValues = { 
            'pawn': 1, 'knight': 3.2, 'bishop': 3.3, 'rook': 5, 'queen': 9, 'king': 100 
        };
    }

    async getMove() {
        const game = window.chessGame?.core || window.chessGame;
        if (!game) return { error: 'engine_not_found' };

        const color = game.gameState.currentPlayer;
        const oppColor = color === 'white' ? 'black' : 'white';
        
        const allMoves = this._getAllLegalMoves(game, color);
        if (allMoves.length === 0) return null;

        // --- 1. MAT EN 1 COUP ---
        const mateMove = this._findMateInOne(game, color, allMoves);
        if (mateMove) return this._finalize(mateMove);

        // --- 2. ÉVALUATION SIMPLE ---
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of allMoves) {
            const score = this._evaluateMove(game, move, color, oppColor);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
                
                // Bonus supplémentaire pour attaquer le roi en finale
                if (this._isEndgame(game) && this._isMoveAttackingKing(game, move, oppColor)) {
                    bestMove = move;
                    break; // Prendre ce coup immédiatement
                }
            }
        }

        // --- 3. EN FINALE : ÊTRE AGRESSIF ---
        if (this._isEndgame(game)) {
            // Chercher des coups qui avancent les pions
            const pawnMoves = allMoves.filter(m => m.piece?.type === 'pawn');
            if (pawnMoves.length > 0) {
                const safestPawnMoves = this._preferSafestMoves(pawnMoves, game, oppColor);
                // Priorité aux pions proches de la promotion
                safestPawnMoves.sort((a, b) => {
                    const aProgress = color === 'white' ? 7 - a.toRow : a.toRow;
                    const bProgress = color === 'white' ? 7 - b.toRow : b.toRow;
                    return bProgress - aProgress; // Descendant
                });
                return this._finalize(safestPawnMoves[0]);
            }
            
            // En finale, activer le roi
            const kingMoves = this._preferSafestMoves(
                allMoves.filter(m => m.piece?.type === 'king'),
                game,
                oppColor
            );
            if (kingMoves.length > 0) {
                const oppKing = this._findKing(game, oppColor);
                if (oppKing) {
                    // Bouger le roi vers le roi adverse
                    kingMoves.sort((a, b) => {
                        const distA = Math.abs(a.toRow - oppKing.row) + Math.abs(a.toCol - oppKing.col);
                        const distB = Math.abs(b.toRow - oppKing.row) + Math.abs(b.toCol - oppKing.col);
                        return distA - distB; // Ascendant (plus proche)
                    });
                    return this._finalize(kingMoves[0]);
                }
            }
        }

        return bestMove ? this._finalize(bestMove) : this._finalize(allMoves[0]);
    }

    _evaluateMove(game, move, color, oppColor) {
        let score = 0;
        const simulated = this._simulateMove(game, move);
        const exposure = this._evaluateMoveExposure(game, move, oppColor, simulated);
        move._exposure = exposure;
        
        // 1. CAPTURES
        if (move.isCapture) {
            const captureValue = this.pieceValues[move.targetPiece.type] || 0;
            const attackerValue = this.pieceValues[move.piece.type] || 0;
            score += captureValue * 10; // Bonus majeur pour les captures
            
            // Capture rentable (prendre une pièce de plus grande valeur)
            if (captureValue > attackerValue * 0.7) {
                score += 5;
            }
            
            if (exposure === 0) score += 3;
        }
        
        // 2. PROMOTION
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            score += 50; // Énorme bonus pour promotion
        }
        
        // 3. ÉCHEC
        if (simulated && this._isKingInCheck(simulated, oppColor)) {
            score += 15; // Bonus pour échec
        }
        
        // 4. POSITION
        // Centre
        if (move.toRow >= 2 && move.toRow <= 5 && move.toCol >= 2 && move.toCol <= 5) {
            score += 1;
        }
        
        // Développement en début de partie
        if (this._countPieces(game) > 20) {
            if (move.piece?.type === 'knight' || move.piece?.type === 'bishop') {
                score += 0.5;
            }
        }
        
        // 5. SÉCURITÉ APRÈS SIMULATION
        score -= exposure * 5;

        if (move.details?.type === 'castling' && move.details.side === 'kingside') {
            score += 5;
        }
        
        // Sauver une pièce attaquée
        if (this._isSquareAttacked(game, move.fromRow, move.fromCol, oppColor)) {
            const pieceValue = this.pieceValues[move.piece.type] || 0;
            score += pieceValue; // Bonus pour sauver la pièce
        }
        
        return score;
    }

    _preferSafestMoves(moves, game, opponent) {
        moves.forEach(move => {
            if (move._exposure === undefined) {
                move._exposure = this._evaluateMoveExposure(game, move, opponent);
            }
        });
        const minimumExposure = Math.min(...moves.map(move => move._exposure ?? 0));
        return moves.filter(move => (move._exposure ?? 0) === minimumExposure);
    }

    _evaluateMoveExposure(game, move, opponent, simulated = this._simulateMove(game, move)) {
        const toRow = move.details?.kingTo?.row ?? move.toRow;
        const toCol = move.details?.kingTo?.col ?? move.toCol;
        return this._bestExchange(simulated, toRow, toCol, opponent, 0);
    }

    _bestExchange(game, targetRow, targetCol, capturingColor, depth) {
        if (depth >= 8) return 0;
        const target = this._getPiece(game.board, targetRow, targetCol);
        if (!target || target.color.toLowerCase().startsWith(capturingColor[0])) return 0;

        const capturedValue = this.pieceValues[target.type] || 0;
        let bestScore = 0;
        for (const move of this._getAllLegalMoves(game, capturingColor)) {
            if (move.toRow !== targetRow || move.toCol !== targetCol || !move.isCapture) continue;

            const promotionGain = move.piece.type === 'pawn' && (targetRow === 0 || targetRow === 7)
                ? (this.pieceValues.queen || 0) - (this.pieceValues.pawn || 0)
                : 0;
            const afterCapture = this._simulateMove(game, move);
            const nextColor = capturingColor === 'white' ? 'black' : 'white';
            const score = capturedValue + promotionGain
                - this._bestExchange(afterCapture, targetRow, targetCol, nextColor, depth + 1);
            bestScore = Math.max(bestScore, score);
        }
        return bestScore;
    }

    _findMateInOne(game, color, moves) {
        for (const move of moves) {
            const simulated = this._simulateMove(game, move);
            if (!simulated) continue;
            
            const oppMoves = this._getAllLegalMoves(simulated, color === 'white' ? 'black' : 'white');
            const isOppInCheck = this._isKingInCheck(simulated, color === 'white' ? 'black' : 'white');
            
            if (isOppInCheck && oppMoves.length === 0) {
                return move; // Échec et mat !
            }
        }
        return null;
    }

    _isEndgame(game) {
        // Finale = peu de pièces non-pions
        let heavyPieceCount = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this._getPiece(game.board, r, c);
                if (piece && piece.type !== 'pawn' && piece.type !== 'king') {
                    heavyPieceCount++;
                }
            }
        }
        return heavyPieceCount <= 4;
    }

    _isMoveAttackingKing(game, move, oppColor) {
        const simulated = this._simulateMove(game, move);
        if (!simulated) return false;
        return this._isKingInCheck(simulated, oppColor);
    }

    // --- MÉTHODES UTILITAIRES (simplifiées) ---

    _simulateMove(game, move) {
        if (typeof BoardPosition === 'undefined' || typeof MoveValidator === 'undefined') {
            throw new Error('BoardPosition et MoveValidator sont requis pour la recherche Level 16.');
        }

        const board = new BoardPosition();
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this._getPiece(game.board, row, col);
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
        const simulated = { board, gameState: state };
        simulated.moveValidator = new MoveValidator(board, state);

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
            if (details.isPromotion || move.promotion || (movingPiece.type === 'pawn' && (toRow === 0 || toRow === 7))) {
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
        state.currentPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
        return simulated;
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

    _isKingInCheck(game, color) {
        const kingPos = this._findKing(game, color);
        if (!kingPos) return false;
        return this._isSquareAttacked(game, kingPos.row, kingPos.col, color === 'white' ? 'black' : 'white');
    }

    _findKing(game, color) {
        const colorKey = color.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this._getPiece(game.board, r, c);
                if (piece && piece.type === 'king' && 
                    piece.color.charAt(0).toLowerCase() === colorKey) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    }

    _countPieces(game) {
        let count = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this._getPiece(game.board, r, c)) count++;
            }
        }
        return count;
    }

    // --- MÉTHODES DU NIVEAU 3 (conservées) ---

    _isSquareAttacked(game, row, col, byColor) {
        const colorKey = byColor.charAt(0).toLowerCase();
        const board = game.board;
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

    _getAllLegalMoves(game, color) {
        const moves = [];
        const myColorKey = color.charAt(0).toLowerCase();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                let piece = this._getPiece(game.board, r, c);
                if (piece && piece.color.charAt(0).toLowerCase() === myColorKey) {
                    let pieceMoves = game.moveValidator.getPossibleMoves(piece, r, c);
                    if (pieceMoves) {
                        pieceMoves.forEach(m => {
                            let target = this._getPiece(game.board, m.row, m.col);
                            moves.push({
                                fromRow: r, fromCol: c,
                                toRow: m.kingTo?.row ?? m.row,
                                toCol: m.kingTo?.col ?? m.col,
                                piece: piece,
                                targetPiece: target || (m.type === 'en-passant' ? { type: 'pawn' } : null),
                                isCapture: (!!target && target.color.charAt(0).toLowerCase() !== myColorKey)
                                    || m.type === 'en-passant',
                                details: m,
                                promotion: m.isPromotion ? 'queen' : undefined
                            });
                        });
                    }
                }
            }
        }
        return moves;
    }

    _getPiece(board, r, c) {
        try {
            let sq = board.grid ? board.grid[r][c] : (board.getPiece ? board.getPiece(r,c) : board[r][c]);
            if (!sq) return null;
            return sq.piece ? sq.piece : (sq.type ? sq : null);
        } catch(e) { return null; }
    }

    _finalize(move) {
        if (!move) return null;
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            move.promotion = 'queen';
        }
        delete move._exposure;
        return move;
    }
}

window.Level_16 = Level_16;