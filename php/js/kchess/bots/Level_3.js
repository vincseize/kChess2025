/**
 * Level_3 - Stratégie CCMO optimisée
 * Check -> Capture -> Menace -> Optimisation
 */
class Level_3 {
    constructor() {
        this.pieceValues = { 'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 900 };
    }

    async getMove(fen) {
        // Accès au moteur de jeu
        const game = window.chessGame?.core || window.chessGame;
        if (!game) return { error: 'no_game' };

        const board = game.board;
        const player = game.gameState.currentPlayer;
        
        // 1. Diagnostic de fin de partie (via le moteur unifié)
        const status = window.ChessStatus?.analyze?.(board, player, fen);
        if (status && !status.hasMoves) {
            return { 
                error: 'game_over', 
                reason: status.isCheck ? 'checkmate' : 'draw',
                details: { winner: status.isCheck ? (player === 'white' ? 'black' : 'white') : null }
            };
        }

        // 2. Récupérer tous les coups légaux
        const moves = this.getAllLegalMoves(game, player);
        if (moves.length === 0) return { error: 'game_over' };

        // 3. Application de la stratégie CCMO
        // Priorité 1 : Echecs
        // Priorité 2 : Captures safe
        // Priorité 3 : Menaces
        // Priorité 4 : Développement / Optimisation
        
        // Pour ce soir, on va prendre le meilleur coup trouvé par un tri simple
        moves.sort((a, b) => (b.score || 0) - (a.score || 0));

        return moves[0];
    }

    getAllLegalMoves(game, player) {
        const legalMoves = [];
        const board = game.board;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board.getPiece?.(r, c) || board.getSquare?.(r, c)?.piece;
                if (piece && piece.color === player) {
                    const targets = game.moveValidator.getPossibleMoves(piece, r, c);
                    targets.forEach(t => {
                        let score = 0;
                        // Logique de scoring simplifiée CCMO
                        if (t.isCapture) score += 10;
                        if (t.isCheck) score += 15;
                        
                        legalMoves.push({
                            fromRow: r, fromCol: c,
                            toRow: t.row, toCol: t.col,
                            notation: t.notation || "",
                            score: score
                        });
                    });
                }
            }
        }
        return legalMoves;
    }
}

// CRITIQUE : Exportation pour le BotManager
window.Level_3 = Level_3;