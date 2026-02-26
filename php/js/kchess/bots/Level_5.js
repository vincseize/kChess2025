/**
 * js/kchess/bots/Level_5.js
 * Level 5 - Grand Maître GM
 */
class Level_5 extends BotCore {
    static VERSION = '3.1.0';

    constructor() {
        super();
        this.name = "Bot Level 5 (GM Pro)";
        this.level = 5;
        
        // Variables de pondération modifiables pour ce niveau spécifique
        this.pieceValues = { 
            'pawn': 100, 
            'knight': 320, 
            'bishop': 330, 
            'rook': 500, 
            'queen': 900, 
            'king': 20000 
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
            
            // On utilise les valeurs propres à cette classe
            const myMaterial = this.getMaterialScore(game, myColor, this.pieceValues);
            const oppMaterial = this.getMaterialScore(game, oppColor, this.pieceValues);

            allMoves.forEach(m => {
                let score = 0;

                // A. CAPTURES (Utilise this.pieceValues)
                if (m.isCapture && m.targetPiece) {
                    const targetVal = this.pieceValues[m.targetPiece.type] || 0;
                    score += (targetVal * 25);
                }
                
                // B. SÉCURITÉ
                if (this.isSquareAttacked(game, m.toRow, m.toCol, oppColor)) {
                    const pieceVal = this.pieceValues[m.piece.type] || 0;
                    score -= (pieceVal * 15); 
                }

                // C. GÉOMÉTRIE ET CENTRE
                const centerDist = Math.abs(m.toRow - 3.5) + Math.abs(m.toCol - 3.5);
                score += (5 - centerDist) * 12;

                // D. ÉTRANGLEMENT DU ROI ADVERSE
                if (oppKing) {
                    const distToOppKing = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    score += (10 - distToOppKing) * 30; 
                    const oppKingCenterDist = Math.abs(oppKing.r - 3.5) + Math.abs(oppKing.c - 3.5);
                    score += oppKingCenterDist * 45; 
                }

                // E. PROMOTION
                if (m.piece.type === 'pawn') {
                    const rank = isWhite ? (7 - m.toRow) : m.toRow;
                    score += (rank * rank * 15); 
                    if (m.toRow === 0 || m.toRow === 7) score += 15000;
                }

                // F. ANTI-PAT DYNAMIQUE
                if (m.isCheck) {
                    score += 800; 
                } else if (oppKing && (myMaterial > oppMaterial + 300)) {
                    const dist = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    if (dist <= 1.5) score -= 5000; 
                }

                m._finalScore = score;
            });

            const selectedMove = this.getBestMoveStrict(allMoves);
            return this.finalize(selectedMove);

        } catch (err) { 
            Level_5.log("Erreur L5", err, 'error');
            return null; 
        }
    }

    getBestMoveStrict(moves) {
        moves.sort((a, b) => b._finalScore - a._finalScore);
        const bestScore = moves[0]._finalScore;
        const threshold = bestScore > 0 ? bestScore * 0.95 : bestScore * 1.05;
        const candidates = moves.filter(m => m._finalScore >= threshold);
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
}

window.Level_5 = Level_5;