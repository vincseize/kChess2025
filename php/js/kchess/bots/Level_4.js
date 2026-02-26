/**
 * js/kchess/bots/Level_4.js
 * Level 4 - Stratège (Scoring Multicritères + Randomisation Contrôlée)
 * Version 3.0.0 - Refactorisée sur BotCore
 */
class Level_4 extends BotCore {
    static VERSION = '3.0.0';

    constructor() {
        super();
        this.name = "Bot Level 4 (Stratège)";
        this.level = 4;
        this.pieceValues = { 
            'pawn': 100, 'knight': 320, 'bishop': 330, 
            'rook': 500, 'queen': 900, 'king': 20000 
        };
    }

    async getMove() {
        try {
            const game = this.getGame();
            if (!game) return null;

            const myColor = game.gameState.currentPlayer.toLowerCase().startsWith('w') ? 'white' : 'black';
            const oppColor = myColor === 'white' ? 'black' : 'white';
            const isWhite = myColor === 'white';
            
            const allMoves = this.getMoves(game, myColor);
            if (!allMoves || allMoves.length === 0) return null;

            const oppKing = this.findPiece(game, 'king', oppColor);

            // --- ÉVALUATION DES COUPS ---
            allMoves.forEach(m => {
                let score = 0;

                // 1. CAPTURES AGRESSIVES (Bonus plus fort que L3)
                if (m.isCapture && m.targetPiece) {
                    const targetVal = this.pieceValues[m.targetPiece.type] || 0;
                    score += (targetVal * 20);
                }

                // 2. SÉCURITÉ (Malus si on se déplace sur une case attaquée)
                if (this.isSquareAttacked(game, m.toRow, m.toCol, oppColor)) {
                    const pieceVal = this.pieceValues[m.piece.type] || 0;
                    score -= (pieceVal * 10);
                }

                // 3. CHASSE AU ROI (Bonus de proximité)
                if (oppKing) {
                    const distAfter = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    score += (10 - distAfter) * 15;
                }

                // 4. PERCÉE DES PIONS
                if (m.piece.type === 'pawn') {
                    const rank = isWhite ? (7 - m.toRow) : m.toRow;
                    score += (rank * rank * 5);
                    if (m.toRow === 0 || m.toRow === 7) score += 5000; // Priorité absolue Promotion
                }

                // 5. BONUS ÉCHEC & CENTRE
                if (m.isCheck) score += 150;
                
                if (m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5) {
                    score += 25;
                }

                m._finalScore = score;
            });

            // 3. Sélection intelligente avec variabilité contrôlée (90% du top score)
            const selectedMove = this.getBestMoveRandomized(allMoves);
            
            Level_4.log(`Coup sélectionné parmi les meilleurs (Score: ${Math.round(selectedMove._finalScore)})`);

            return this.finalize(selectedMove);

        } catch (err) { 
            Level_4.log("Erreur L4", err, 'error');
            return null; 
        }
    }

    /**
     * Sélectionne un coup aléatoirement parmi ceux qui sont proches du score maximum
     */
    getBestMoveRandomized(moves) {
        moves.sort((a, b) => b._finalScore - a._finalScore);
        const bestScore = moves[0]._finalScore;

        // Seuil à 90% du meilleur score (ou 110% si le score est négatif)
        const threshold = bestScore > 0 ? bestScore * 0.90 : bestScore * 1.10;
        const candidates = moves.filter(m => m._finalScore >= threshold);

        return candidates[Math.floor(Math.random() * candidates.length)];
    }
}

window.Level_4 = Level_4;