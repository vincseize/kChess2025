/**
 * js/kchess/bots/Level_2.js
 * Niveau 2 : Stratégie CCMO (Check, Capture, Menace, Optimisation)
 * Version 3.0.0 - Refactorisée sur BotCore
 */
class Level_2 extends BotCore {
    static VERSION = '3.0.0';

    constructor() {
        super();
        this.name = "Bot Level 2 (CCMO)";
        this.level = 2;
        // Valeurs pour l'échange de pièces
        this.pieceValues = { 
            'pawn': 1, 'knight': 3, 'bishop': 3, 
            'rook': 5, 'queen': 9, 'king': 100 
        };
    }

    async getMove() {
        try {
            const game = this.getGame();
            if (!game) return null;

            const myColor = game.gameState.currentPlayer.toLowerCase().startsWith('w') ? 'white' : 'black';
            const oppColor = myColor === 'white' ? 'black' : 'white';
            
            // 1. Récupération des coups via BotCore
            const allMoves = this.getMoves(game, myColor);
            if (!allMoves || allMoves.length === 0) return null;

            // --- STRATÉGIE 1 : CAPTURES RENTABLES ---
            // On filtre les captures
            const captureMoves = allMoves.filter(m => m.isCapture && m.targetPiece);
            
            if (captureMoves.length > 0) {
                // Trier par valeur de la cible (la plus grosse pièce d'abord)
                captureMoves.sort((a, b) => (this.pieceValues[b.targetPiece.type] || 0) - (this.pieceValues[a.targetPiece.type] || 0));
                
                for (let m of captureMoves) {
                    const isAttacked = this.isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                    const targetVal = this.pieceValues[m.targetPiece.type] || 0;
                    const attackerVal = this.pieceValues[m.piece.type] || 0;

                    // On capture si la case est sûre OU si on gagne au change (ex: mon pion prend sa tour)
                    if (!isAttacked || targetVal >= attackerVal) {
                        Level_2.log(`Capture rentable détectée : ${m.piece.type} prend ${m.targetPiece.type}`);
                        return this.finalize(m);
                    }
                }
            }

            // --- STRATÉGIE 2 : CENTRE ET SÉCURITÉ ---
            // On cherche les coups qui n'exposent pas la pièce
            const safeMoves = allMoves.filter(m => !this.isSquareAttacked(game, m.toRow, m.toCol, oppColor));
            
            if (safeMoves.length > 0) {
                // Priorité au carré central (lignes/colonnes 2 à 5)
                const centralMoves = safeMoves.filter(m => m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5);
                const source = centralMoves.length > 0 ? centralMoves : safeMoves;
                
                const selected = source[Math.floor(Math.random() * source.length)];
                return this.finalize(selected);
            }

            // --- STRATÉGIE 3 : FALLBACK (Coups désespérés) ---
            return this.finalize(allMoves[Math.floor(Math.random() * allMoves.length)]);

        } catch (e) {
            Level_2.log("Erreur L2", e, 'error');
            return null;
        }
    }
}

// Enregistrement global
window.Level_2 = Level_2;