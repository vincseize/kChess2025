/**
 * Level_16 - Bot Killer (Simplifié mais efficace)
 * Version 3.0 - Fini de patteur !
 */
class Level_16 {
    static VERSION = '3.0.0';

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
                // Priorité aux pions proches de la promotion
                pawnMoves.sort((a, b) => {
                    const aProgress = color === 'white' ? 7 - a.toRow : a.toRow;
                    const bProgress = color === 'white' ? 7 - b.toRow : b.toRow;
                    return bProgress - aProgress; // Descendant
                });
                return this._finalize(pawnMoves[0]);
            }
            
            // En finale, activer le roi
            const kingMoves = allMoves.filter(m => m.piece?.type === 'king');
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
        
        // 1. CAPTURES
        if (move.isCapture) {
            const captureValue = this.pieceValues[move.targetPiece.type] || 0;
            const attackerValue = this.pieceValues[move.piece.type] || 0;
            score += captureValue * 10; // Bonus majeur pour les captures
            
            // Capture rentable (prendre une pièce de plus grande valeur)
            if (captureValue > attackerValue * 0.7) {
                score += 5;
            }
            
            // Capture sûre (pas attaquée en retour)
            if (!this._isSquareAttacked(game, move.toRow, move.toCol, oppColor)) {
                score += 3;
            }
        }
        
        // 2. PROMOTION
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            score += 50; // Énorme bonus pour promotion
        }
        
        // 3. ÉCHEC
        const simulated = this._simulateMove(game, move);
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
        
        // 5. SÉCURITÉ
        // Éviter de mettre une pièce en danger
        if (this._isSquareAttacked(game, move.toRow, move.toCol, oppColor)) {
            const pieceValue = this.pieceValues[move.piece.type] || 0;
            score -= pieceValue * 0.5;
        }
        
        // Sauver une pièce attaquée
        if (this._isSquareAttacked(game, move.fromRow, move.fromCol, oppColor)) {
            const pieceValue = this.pieceValues[move.piece.type] || 0;
            score += pieceValue; // Bonus pour sauver la pièce
        }
        
        return score;
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
        try {
            // Copie rapide
            const simulated = {
                board: { grid: [] },
                gameState: { currentPlayer: game.gameState.currentPlayer },
                moveValidator: game.moveValidator
            };
            
            // Copier le board
            for (let r = 0; r < 8; r++) {
                simulated.board.grid[r] = [];
                for (let c = 0; c < 8; c++) {
                    const piece = this._getPiece(game.board, r, c);
                    simulated.board.grid[r][c] = piece ? { piece: {...piece} } : null;
                }
            }
            
            // Appliquer le coup
            const fromPiece = this._getPiece(simulated.board, move.fromRow, move.fromCol);
            if (!fromPiece) return null;
            
            simulated.board.grid[move.fromRow][move.fromCol] = null;
            simulated.board.grid[move.toRow][move.toCol] = { piece: {...fromPiece} };
            
            // Promotion
            if (move.promotion && simulated.board.grid[move.toRow][move.toCol]?.piece) {
                simulated.board.grid[move.toRow][move.toCol].piece.type = move.promotion;
            }
            
            simulated.gameState.currentPlayer = game.gameState.currentPlayer === 'white' ? 'black' : 'white';
            
            return simulated;
        } catch (e) {
            console.error("Erreur simulation:", e);
            return null;
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
                                fromRow: r, fromCol: c, toRow: m.row, toCol: m.col,
                                piece: piece, targetPiece: target,
                                isCapture: !!target && target.color.charAt(0).toLowerCase() !== myColorKey
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
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            move.promotion = 'queen'; // Toujours promouvoir en dame
        }
        return move;
    }
}

window.Level_16 = Level_16;