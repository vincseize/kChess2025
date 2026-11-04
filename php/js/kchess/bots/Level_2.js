/**
 * Level_2 - Stratégie CCMO optimisée
 * Version 1.7.0 - Migration partielle vers GameFonctions
 *
 * v1.7.0 : utilise _getAllLegalMoves, _isSquareAttacked via GameFonctions.
 *          Conserve ses propres pieceValues (échelle 1-9) pour la comparaison
 *          de captures (logique locale, pas de calcul d'échange).
 */
class Level_2 {
    static VERSION = '1.7.0';

    constructor() {
        this.name = "Bot Level 2 (CCMO)";
        this.level = 2;
        this.pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
        this.gameFonctions = GameFonctions.attach(this);
    }

    async getMove() {
        try {
            const game = window.chessGame?.core || window.chessGame;
            if (!game) return null;

            const color = game.gameState.currentPlayer;
            const oppColor = color.toLowerCase().startsWith('w') ? 'black' : 'white';

            const allMoves = this._getAllLegalMoves(game, color);
            if (!allMoves || allMoves.length === 0) return null;

            // --- 1. CAPTURES RENTABLES ---
            const captureMoves = allMoves.filter(m => m.isCapture);
            if (captureMoves.length > 0) {
                captureMoves.sort((a, b) => this.pieceValues[b.targetPiece.type] - this.pieceValues[a.targetPiece.type]);

                for (let i = 0; i < Math.min(captureMoves.length, 3); i++) {
                    const m = captureMoves[i];
                    const isAttacked = this._isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                    if (!isAttacked || this.pieceValues[m.targetPiece.type] >= this.pieceValues[m.piece.type]) {
                        return this._finalize(m);
                    }
                }
            }

            // --- 2. CENTRE SAFE & DÉVELOPPEMENT ---
            const safeMoves = allMoves.filter(m => !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor));

            if (safeMoves.length > 0) {
                const central = safeMoves.filter(m => m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5);
                if (central.length > 0) {
                    return this._finalize(central[Math.floor(Math.random() * central.length)]);
                }
                return this._finalize(safeMoves[Math.floor(Math.random() * safeMoves.length)]);
            }

            // --- 3. FALLBACK ---
            return this._finalize(allMoves[Math.floor(Math.random() * allMoves.length)]);
        } catch (e) {
            return null;
        }
    }
}
window.Level_2 = Level_2;