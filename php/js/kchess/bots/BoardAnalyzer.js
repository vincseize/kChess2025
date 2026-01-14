/**
 * bots/BoardAnalyzer - Analyseur de terrain pour les niveaux CCMO
 */
class BoardAnalyzer {
    static getCCMOData(fen, playerColor) {
        const engine = new ChessEngine(fen);
        const pSide = playerColor.toLowerCase().startsWith('w') ? 'w' : 'b';
        const oSide = pSide === 'w' ? 'b' : 'w';

        const data = {
            unsafeSquares: [],         // Cases contrôlées par l'adversaire
            opponentProtected: [],     // Pièces adverses protégées par une autre
        };

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                // 1. Case attaquée par l'opposant
                if (engine.isSquareAttacked(r, c, oSide)) {
                    data.unsafeSquares.push({ r, c });
                }

                // 2. Détection Kamikaze : Pièce adverse protégée par une autre
                const piece = engine.getPiece(r, c);
                if (piece && engine.isPieceColor(piece, oSide)) {
                    const original = engine.board[r][c];
                    engine.board[r][c] = null; // Simulation de capture (case vide)
                    
                    // Si après avoir "enlevé" la pièce, la case est toujours attaquée par l'opposant
                    if (engine.isSquareAttacked(r, c, oSide)) {
                        data.opponentProtected.push({ r, c });
                    }
                    
                    engine.board[r][c] = original; // Backtrack
                }
            }
        }
        return data;
    }
}