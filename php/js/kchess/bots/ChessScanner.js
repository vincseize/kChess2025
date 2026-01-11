/**
 * bots/ChessScanner - Analyseur de terrain pour les niveaux CCMO
 */
class ChessScanner {
    /**
     * Analyse complète de la sécurité des cases
     */
    static getAnalysis(game, playerColor, opponentColor) {
        const analysis = {
            unsafeSquares: [], // Cases contrôlées par l'adversaire
            myProtectedPieces: [], // Mes pièces protégées par une autre
            opponentProtectedPieces: [] // Pièces adverses protégées
        };

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                // 1. Détection des menaces adverses (Cases "Pas Safe")
                if (this.isSquareAttacked(game, r, c, opponentColor)) {
                    analysis.unsafeSquares.push({ r, c });
                }
                
                // 2. Détection des protections (Alliées et Ennemies)
                const piece = game.board.getSquare(r, c)?.piece;
                if (piece) {
                    if (this.isSquareAttacked(game, r, c, piece.color)) {
                        if (piece.color === playerColor) analysis.myProtectedPieces.push({ r, c });
                        else analysis.opponentProtectedPieces.push({ r, c });
                    }
                }
            }
        }
        return analysis;
    }

    /**
     * Vérifie si une case est attaquée par une couleur donnée
     * On simule la case vide pour voir les rayons X (Dame, Tour, Fou)
     */
    static isSquareAttacked(game, r, c, attackerColor) {
        const square = game.board.getSquare(r, c);
        const originalPiece = square.piece;
        
        // Simulation : on vide la case pour voir si elle est "dans la ligne de mire"
        square.piece = null;
        const attacked = game.moveValidator.isSquareAttacked?.(r, c, attackerColor);
        
        // Sécurité pour les pions (certains moteurs ignorent les pions en isSquareAttacked)
        let pawnAttack = false;
        const dir = (attackerColor === 'white') ? 1 : -1;
        const pawns = [{r: r + dir, c: c - 1}, {r: r + dir, c: c + 1}];
        for (let p of pawns) {
            const pc = game.board.getSquare(p.r, p.c)?.piece;
            if (pc && pc.type === 'pawn' && pc.color === attackerColor) pawnAttack = true;
        }

        square.piece = originalPiece; // On remet la pièce
        return attacked || pawnAttack;
    }
}