/**
 * Level_3 - Stratégie CCMO (Version Sécurité Maximale)
 * Logique : Ne jamais donner de pièce gratuitement (Anti-Suicide).
 */
class Level_3 {
    constructor() {}

    async getMove(fen) {
        const game = window.chessGame?.core || window.chessGame;
        if (!game) return { error: 'no_game' };

        const player = game.gameState.currentPlayer;
        const opponent = player === 'white' ? 'black' : 'white';
        
        let moves = this.getAllLegalMoves(game, player);
        if (moves.length === 0) return { error: 'game_over' };

        moves = moves.sort(() => Math.random() - 0.5);

        // --- 1. DÉFENSE (Sauver une pièce réellement menacée) ---
        const defenseMoves = moves.filter(move => {
            const isCurrentlyAttacked = game.moveValidator.isSquareAttacked?.(move.fromRow, move.fromCol, opponent);
            if (isCurrentlyAttacked) {
                return this.isSafe(move.toRow, move.toCol, opponent, game);
            }
            return false;
        });
        if (defenseMoves.length > 0) return defenseMoves[0];

        // --- 2. CAPTURE SAFE (Prendre sans se suicider) ---
        const captureMoves = moves.filter(move => {
            if (!move.isCapture) return false;
            return this.isSafe(move.toRow, move.toCol, opponent, game);
        });
        if (captureMoves.length > 0) return captureMoves[0];

        // --- 3. MENACE / CHECK SAFE ---
        const threatMoves = moves.filter(move => {
            if (!move.isCheck) return false;
            return this.isSafe(move.toRow, move.toCol, opponent, game);
        });
        if (threatMoves.length > 0) return threatMoves[0];

        // --- 4. OPTIMISATION (Développement sans danger) ---
        const optimizationMoves = moves.filter(move => {
            return this.isSafe(move.toRow, move.toCol, opponent, game);
        });
        if (optimizationMoves.length > 0) return optimizationMoves[0];

        // --- 5. PAR DÉFAUT (Si tout est dangereux, on limite la casse) ---
        return moves[0];
    }

    /**
     * Vérifie si une case est réellement sûre (Anti-Suicide)
     */
    isSafe(row, col, opponentColor, game) {
        // A. Vérification via le moteur (Tours, Fous, Cavaliers, Reine)
        const attackedByEngine = game.moveValidator.isSquareAttacked?.(row, col, opponentColor);
        if (attackedByEngine) return false;

        // B. Vérification manuelle des pions (pour éviter b5 face à c4)
        // Un pion adverse peut-il manger sur cette case au prochain tour ?
        const direction = opponentColor === 'white' ? 1 : -1; // Sens d'attaque des pions
        const pawnAttackers = [
            { r: row + direction, c: col - 1 },
            { r: row + direction, c: col + 1 }
        ];

        for (let pos of pawnAttackers) {
            if (pos.r >= 0 && pos.r < 8 && pos.c >= 0 && pos.c < 8) {
                const square = game.board.getSquare ? game.board.getSquare(pos.r, pos.c) : game.board[pos.r][pos.c];
                const piece = square?.piece || square;
                if (piece && piece.type === 'pawn' && piece.color === opponentColor) {
                    return false; // Danger ! Un pion adverse nous attend.
                }
            }
        }

        return true;
    }

    getAllLegalMoves(game, player) {
        const legalMoves = [];
        const board = game.board;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = board.getSquare ? board.getSquare(r, c) : board[r][c];
                const piece = square?.piece || square;

                if (piece && piece.type && piece.color === player) {
                    const targets = game.moveValidator.getPossibleMoves(piece, r, c);
                    targets.forEach(t => {
                        const targetSq = board.getSquare ? board.getSquare(t.row, t.col) : board[t.row][t.col];
                        const targetPiece = targetSq?.piece || targetSq;
                        
                        const isRealCapture = targetPiece && targetPiece.type && targetPiece.color !== player;

                        legalMoves.push({
                            fromRow: r, fromCol: c,
                            toRow: t.row, toCol: t.col,
                            notation: t.notation || `${piece.type[0].toUpperCase()}${t.col}${t.row}`,
                            isCapture: isRealCapture,
                            isCheck: t.isCheck || false
                        });
                    });
                }
            }
        }
        return legalMoves;
    }
}

window.Level_3 = Level_3;