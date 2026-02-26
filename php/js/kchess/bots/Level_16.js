/**
 * js/kchess/bots/Level_16.js
 * Version 3.2 - Killer (Optimisé pour l'ouverture et la stabilité)
 */
class Level_16 extends BotCore {
    static VERSION = '3.2.0';

    constructor() {
        super();
        this.name = "Bot Level 16 (Killer)";
        this.level = 16;
        this.pieceValues = { 
            'pawn': 1, 'knight': 3.2, 'bishop': 3.3, 
            'rook': 5, 'queen': 9, 'king': 100 
        };
    }

    async getMove() {
        try {
            const game = this.getGame();
            if (!game) return null;

            const color = game.gameState.currentPlayer;
            const oppColor = color.startsWith('w') ? 'black' : 'white';
            const allMoves = this.getMoves(game, color);
            if (!allMoves || allMoves.length === 0) return null;

            // 1. MAT EN 1 (Priorité absolue)
            const mateMove = this.findMateInOne(game, color, allMoves);
            if (mateMove) return this.finalize(mateMove);

            // 2. ÉVALUATION
            let bestMoves = [];
            let maxScore = -Infinity;
            const isEndgame = this.checkEndgame(game);
            
            for (const move of allMoves) {
                let score = this._evaluateMove(game, move, color, oppColor, isEndgame);
                
                // --- LE SECRET : UN PEU DE BRUIT ALÉATOIRE ---
                // Ajoute un micro-bonus aléatoire pour que, à score égal, 
                // il ne choisisse pas toujours le même coup "débile".
                score += Math.random() * 0.1;

                if (score > maxScore) {
                    maxScore = score;
                    bestMoves = [move];
                } else if (Math.abs(score - maxScore) < 0.01) {
                    bestMoves.push(move);
                }
            }

            // On choisit au hasard parmi les meilleurs coups équivalents
            const chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            return this.finalize(chosenMove);

        } catch (err) { 
            BotCore.log("Erreur L16", err, 'error');
            return null; 
        }
    }

    _evaluateMove(game, move, color, oppColor, isEndgame) {
        let score = 0;
        const isWhite = color.startsWith('w');
        
        // 1. TACTIQUE (Captures / Promotions)
        if (move.isCapture && move.targetPiece) {
            score += (this.pieceValues[move.targetPiece.type] * 10);
        }
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            score += 50;
        }

        // 2. SÉCURITÉ
        if (this.isSquareAttacked(game, move.toRow, move.toCol, oppColor)) {
            score -= (this.pieceValues[move.piece.type] * 8);
        }

        // 3. DÉVELOPPEMENT & CENTRE (Seulement en début/milieu de partie)
        if (!isEndgame) {
            // Bonus de poussée : on veut avancer !
            const direction = isWhite ? -1 : 1;
            if ((move.toRow - move.fromRow) * direction > 0) {
                score += 0.3; // Encourage à avancer vers l'adversaire
            }

            // Bonus de centralisation (Cavaliers/Fous/Pions)
            if (move.toRow >= 2 && move.toRow <= 5 && move.toCol >= 2 && move.toCol <= 5) {
                score += 0.5;
            }

            // --- PROTECTION DU ROQUE ---
            // On pénalise fortement les mouvements de Tour/Roi inutiles au début
            if ((move.piece.type === 'rook' || move.piece.type === 'king') && !game.gameState.history?.length > 20) {
                // Si on bouge la tour alors qu'on n'a pas encore roqué, c'est mal (sauf capture)
                if (!move.isCapture) score -= 2.0;
            }
        }

        // 4. FIN DE PARTIE (Chasse au Roi)
        if (isEndgame) {
            const oppKing = this.findPiece(game, 'king', oppColor);
            if (oppKing) {
                const dist = Math.abs(move.toRow - oppKing.r) + Math.abs(move.toCol - oppKing.c);
                score += (14 - dist) * 0.5;
            }
        }

        return score;
    }

    checkEndgame(game) {
        let heavyPieces = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.getPiece(game.board, r, c);
                if (p && p.type !== 'pawn' && p.type !== 'king') heavyPieces++;
            }
        }
        return heavyPieces <= 4;
    }
}
window.Level_16 = Level_16;