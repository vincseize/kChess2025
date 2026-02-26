/**
 * js/kchess/bots/Level_3.js
 * Level 3 : Tactique & Scoring (CCMO + Positionnel)
 * Version 3.0.0 - Refactorisée sur BotCore
 */
class Level_3 extends BotCore {
    static VERSION = '3.0.0';

    constructor() {
        super();
        this.name = "Bot Level 3 (Tactique+)";
        this.level = 3;
        // Valeurs standards (Echelle 1/100)
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
            
            const allMoves = this.getMoves(game, myColor);
            if (!allMoves || allMoves.length === 0) return null;

            const oppKing = this.findPiece(game, 'king', oppColor);

            // --- ÉVALUATION DES COUPS ---
            allMoves.forEach(m => {
                let score = 0;

                // 1. CAPTURES (C)
                if (m.isCapture && m.targetPiece) {
                    const targetVal = this.pieceValues[m.targetPiece.type] || 0;
                    score += (targetVal * 10); // Gros bonus pour la capture
                }

                // 2. SÉCURITÉ (S)
                const isSafe = !this.isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                if (!isSafe) {
                    const pieceVal = this.pieceValues[m.piece.type] || 0;
                    score -= (pieceVal * 12); // Malus si on s'expose
                }

                // 3. MOBILITÉ & PIONS (M)
                if (m.piece.type === 'pawn') {
                    const progress = (myColor === 'white') ? (7 - m.toRow) : m.toRow;
                    score += (progress * progress * 8); // Bonus d'avancée
                    if (m.toRow === 0 || m.toRow === 7) score += 1500; // Bonus Promotion
                }

                // 4. OPTIMISATION (O) - Pression sur le Roi
                if (oppKing) {
                    const distBefore = Math.abs(m.fromRow - oppKing.r) + Math.abs(m.fromCol - oppKing.c);
                    const distAfter = Math.abs(m.toRow - oppKing.r) + Math.abs(m.toCol - oppKing.c);
                    
                    if (distAfter < distBefore) score += 25; // Se rapproche du roi

                    // Bonus si la pièce pourra attaquer le roi au prochain tour
                    if (this.canAttackTarget(m.piece.type, m.toRow, m.toCol, oppKing.r, oppKing.c)) {
                        score += 60; 
                    }
                }

                // 5. CONTRÔLE DU CENTRE
                if (m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5) {
                    score += 35;
                }

                // Un peu d'aléatoire pour éviter la répétition
                score += Math.random() * 20;
                m._finalScore = score;
            });

            // Tri par score décroissant
            allMoves.sort((a, b) => b._finalScore - a._finalScore);
            
            Level_3.log(`Meilleur coup : ${allMoves[0].piece.type} avec score ${Math.round(allMoves[0]._finalScore)}`);

            return this.finalize(allMoves[0]);

        } catch (err) {
            Level_3.log("Erreur L3", err, 'error');
            return null;
        }
    }

    /**
     * Vérifie si une pièce à une position donnée peut théoriquement atteindre une cible
     */
    canAttackTarget(type, r1, c1, r2, c2) {
        const dr = Math.abs(r1 - r2);
        const dc = Math.abs(c1 - c2);
        switch(type) {
            case 'rook': return r1 === r2 || c1 === c2;
            case 'bishop': return dr === dc;
            case 'queen': return r1 === r2 || c1 === c2 || dr === dc;
            case 'knight': return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
            case 'pawn': return dr === 1 && dc === 1;
            default: return false;
        }
    }
}

window.Level_3 = Level_3;