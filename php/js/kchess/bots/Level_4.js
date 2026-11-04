/**
 * Level_4 - Stratège UI
 * Version 3.0.0 - Ajout recherche depth-2 (comme L3 mais plus large)
 *
 * v3.0.0 :
 *   - Ajout recherche depth-2 (12 coups au lieu de 10 pour L3)
 *   - Bruit aléatoire à 3 (entre L2:0 et L3:5)
 *   - Conserve l'agressivité sur les captures (×25) et la prudence sur l'exposition (×12)
 *   - Utilise GameFonctions pour toutes les opérations
 */
class Level_4 {
    static VERSION = '3.0.0';

    constructor() {
        this.name = "Bot Level 4 (Minimax)";
        this.level = 4;
        this.pieceValues = { 'pawn': 100, 'knight': 320, 'bishop': 330, 'rook': 500, 'queen': 900, 'king': 20000 };
        this.gameFonctions = GameFonctions.attach(this);
    }

    async getMove() {
        try {
            const game = window.chessGame?.core || window.chessGame;
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
            const oppKing = this._findKing(game, oppColor);

            // Score rapide pour pré-sélectionner
            candidateMoves.forEach(move => {
                move._quickScore = this._scoreMoveQuickly(game, move, myColor, oppKing);
            });
            candidateMoves.sort((a, b) => b._quickScore - a._quickScore);

            // Recherche depth-2 sur les 12 meilleurs coups (vs 10 pour L3)
            const searchMoves = candidateMoves.slice(0, 12);
            let bestMove = null;
            let bestScore = -Infinity;

            for (const move of searchMoves) {
                const afterMove = this._simulateMove(game, move);
                const responses = this._getAllLegalMoves(afterMove, oppColor);

                // Mat en 1
                if (responses.length === 0) {
                    const isCheckmate = afterMove.moveValidator.isKingInCheck(oppColor);
                    const score = isCheckmate ? 100000 : 0;
                    if (score > bestScore) {
                        bestMove = move;
                        bestScore = score;
                    }
                    continue;
                }

                // Évaluer la pire réponse adverse
                let worstResponseScore = Infinity;
                for (const response of responses) {
                    const afterResponse = this._simulateMove(afterMove, response);
                    let responseScore = this._evaluatePosition(afterResponse, myColor);
                    
                    // Si l'adversaire capture, évaluer l'échange
                    if (response.isCapture || response.details?.isPromotion) {
                        const immediateGain = this._getImmediateExchangeGainLocal(afterMove, response);
                        const exchangeScore = this._evaluateExchange(afterMove, response, oppColor);
                        responseScore += immediateGain - exchangeScore;
                    }
                    
                    worstResponseScore = Math.min(worstResponseScore, responseScore);
                    
                    // Pruning : si déjà pire que le meilleur score connu, on arrête
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
            console.error('Level 4 decision error:', err);
            return null;
        }
    }

    _scoreMoveQuickly(game, move, color, opponentKing) {
        // Bruit réduit à 3 pour un jeu plus déterministe que L3 (5) mais moins que L2 (0)
        let score = Math.random() * 3;
        
        if (move.isCapture && move.targetPiece) {
            score += this._evaluateExchange(game, move, color) * 25;  // Aggressif sur les captures
        }
        
        if (move.piece.type === 'pawn') {
            const progress = color === 'white' ? 7 - move.toRow : move.toRow;
            score += progress * progress * 8;
            if (move.toRow === 0 || move.toRow === 7) score += 1500;
        }
        
        // Bonus centre
        if (move.toRow >= 2 && move.toRow <= 5 && move.toCol >= 2 && move.toCol <= 5) {
            score += 30;
        }
        
        // Bonus si la pièce attaque le roi adverse
        if (opponentKing && this._pieceAttacksSquare(game, move, opponentKing.r, opponentKing.c)) {
            score += 50;
        }
        
        // Bonus développement en ouverture
        if (game.gameState.moveHistory.length < 20
            && ['knight', 'bishop'].includes(move.piece.type)
            && (move.fromRow === (color === 'white' ? 7 : 0))) {
            score += 15;
        }
        
        return score;
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
                
                // Pénalité si pièce non défendue
                if (attackEngine.isSquareAttacked(row, col, piece.color === 'white' ? 'b' : 'w')
                    && !attackEngine.isSquareAttacked(row, col, piece.color === 'white' ? 'w' : 'b')) {
                    score -= sign * this.pieceValues[piece.type] * 0.35;
                }

                // Bonus centre
                const centerDistance = Math.min(
                    Math.abs(row - 3) + Math.abs(col - 3),
                    Math.abs(row - 3) + Math.abs(col - 4),
                    Math.abs(row - 4) + Math.abs(col - 3),
                    Math.abs(row - 4) + Math.abs(col - 4)
                );
                const centerWeight = { pawn: 3, knight: 8, bishop: 5, rook: 2, queen: 2, king: 0 }[piece.type] || 0;
                score += sign * Math.max(0, 4 - centerDistance) * centerWeight;

                // Bonus progression des pions
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
            return (absRowDelta === 2 && absColDelta === 1) || (absRowDelta === 1 && absColDelta === 2);
        }
        if (type === 'bishop') {
            return absRowDelta === absColDelta && absRowDelta > 0;
        }
        if (type === 'rook') {
            return (absRowDelta === 0 && absColDelta > 0) || (absColDelta === 0 && absRowDelta > 0);
        }
        if (type === 'queen') {
            return (absRowDelta === absColDelta && absRowDelta > 0) ||
                   (absRowDelta === 0 && absColDelta > 0) ||
                   (absColDelta === 0 && absRowDelta > 0);
        }
        if (type === 'king') {
            return absRowDelta <= 1 && absColDelta <= 1 && (absRowDelta > 0 || absColDelta > 0);
        }
        return false;
    }

    _evaluateExchange(game, move, color) {
        const immediateGain = this._getImmediateExchangeGain(game, move);
        if (immediateGain === 0) return 0;

        const details = move.details || {};
        const toRow = details.kingTo?.row ?? move.toRow;
        const toCol = details.kingTo?.col ?? move.toCol;
        const afterMove = this._simulateMove(game, move);
        const opponent = color === 'white' ? 'black' : 'white';
        return immediateGain - this._bestExchange(afterMove, toRow, toCol, opponent, 0);
    }

    _getImmediateExchangeGain(game, move) {
        const details = move.details || {};
        const toRow = details.kingTo?.row ?? move.toRow;
        const toCol = details.kingTo?.col ?? move.toCol;
        const capturedPiece = (details.type === 'en-passant' || details.isEnPassant || move.isEnPassant)
            ? { type: 'pawn' }
            : this._getPieceCompat(game, toRow, toCol);
        const capturedValue = capturedPiece ? this.pieceValues[capturedPiece.type] || 0 : 0;
        const promotionGain = details.isPromotion || (move.piece.type === 'pawn' && (toRow === 0 || toRow === 7))
            ? this.pieceValues.queen - this.pieceValues.pawn
            : 0;
        return capturedValue + promotionGain;
    }

    _getImmediateExchangeGainLocal(game, move) {
        return this._getImmediateExchangeGain(game, move);
    }

    _bestExchange(game, targetRow, targetCol, capturingColor, depth = 0) {
        if (depth >= (this.gameFonctions.maxExchangeDepth || 8)) return 0;

        const target = this._getPieceCompat(game, targetRow, targetCol);
        if (!target || this._sameColor(target.color, capturingColor)) return 0;

        const capturedValue = this.pieceValues[target.type] || 0;
        let bestScore = 0;
        for (const move of this._getAllLegalMoves(game, capturingColor)) {
            if (move.toRow !== targetRow || move.toCol !== targetCol || !move.isCapture) continue;

            const promotionGain = move.piece.type === 'pawn' && (targetRow === 0 || targetRow === 7)
                ? (this.pieceValues.queen || 0) - (this.pieceValues.pawn || 0)
                : 0;
            const afterCapture = this._simulateMove(game, move);
            const score = capturedValue + promotionGain
                - this._bestExchange(afterCapture, targetRow, targetCol, this._oppositeColor(capturingColor), depth + 1);
            bestScore = Math.max(bestScore, score);
        }
        return bestScore;
    }

    _getAllLegalMoves(game, color) {
        return this.gameFonctions.getAllLegalMoves(game, color);
    }

    _findKing(game, color) {
        return this.gameFonctions._findKing(game, color);
    }

    _simulateMove(game, move) {
        return this.gameFonctions._simulateMove(game, move);
    }

    _getPieceCompat(game, row, col) {
        return this.gameFonctions._getPieceCompat(game, row, col);
    }

    _sameColor(a, b) {
        return this.gameFonctions._sameColor(a, b);
    }

    _oppositeColor(color) {
        return this.gameFonctions._oppositeColor(color);
    }

    _finalize(move) {
        return this.gameFonctions._finalize(move);
    }
}

window.Level_4 = Level_4;
