/**
 * Level_2 - Stratégie CCMO (Captures, Centre, Mat, Ouverture) - Depth 0
 * Version 2.0.0 : v1.7.0 + mat en 1 + garde anti-pat (sinon L2 stalemate L1 dans 28 % des parties).
 */
class Level_2 {
    // Profondeur de recherche réelle (lue par newGame.php pour l'affichage)
    static SEARCH_DEPTH = 0;

    static VERSION = '2.0.0';

    constructor() {
        this.name = "Bot Level 2 (CCMO)";
        this.level = 2;
        this.pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
        this.gameFonctions = GameFonctions.attach(this);
    }

    get PIPELINE() { return ['mat_en_1', 'captures_rentables', 'garde_pat', 'centre_sur', 'coup_sur', 'repli_aleatoire']; }

    async getMove() {
        try {
            const game = window.chessGame?.core || window.chessGame;
            if (!game) return null;
            const color = game.gameState.currentPlayer;
            const my = color.toLowerCase().startsWith('w') ? 'white' : 'black';
            const oppColor = my === 'white' ? 'black' : 'white';
            const gf = this.gameFonctions;

            const allMoves = this._getAllLegalMoves(game, my);
            if (!allMoves || allMoves.length === 0) return null;

            // --- 0. MAT EN 1 ---
            for (const m of allMoves) {
                const after = this._simulateMove(game, m);
                if (!after) continue;
                if (this._getAllLegalMoves(after, oppColor).length !== 0) continue;
                const k = gf.findKing(after, oppColor);
                if (k && gf.isSquareAttacked(after, k.row, k.col, my)) return this._finalize(m);
            }

            // garde anti-pat (seulement quand il reste peu de pièces : coût limité)
            const few = this._countPieces(game) <= 12;
            const noPat = m => !(few && gf.isStalemateAfterMove(game, m, oppColor));

            // --- 1. CAPTURES RENTABLES ---
            const captureMoves = allMoves.filter(m => m.isCapture);
            if (captureMoves.length > 0) {
                captureMoves.sort((a, b) => this.pieceValues[b.targetPiece.type] - this.pieceValues[a.targetPiece.type]);
                for (let i = 0; i < Math.min(captureMoves.length, 3); i++) {
                    const m = captureMoves[i];
                    const isAttacked = this._isSquareAttacked(game, m.toRow, m.toCol, oppColor);
                    if ((!isAttacked || this.pieceValues[m.targetPiece.type] >= this.pieceValues[m.piece.type]) && noPat(m)) {
                        return this._finalize(m);
                    }
                }
            }

            // --- 2. CENTRE SAFE & DÉVELOPPEMENT ---
            const safeMoves = allMoves.filter(m => !this._isSquareAttacked(game, m.toRow, m.toCol, oppColor)).filter(noPat);
            if (safeMoves.length > 0) {
                const central = safeMoves.filter(m => m.toRow >= 2 && m.toRow <= 5 && m.toCol >= 2 && m.toCol <= 5);
                const pool = central.length > 0 ? central : safeMoves;
                return this._finalize(pool[Math.floor(Math.random() * pool.length)]);
            }

            // --- 3. REPLI ---
            const rest = allMoves.filter(noPat);
            const pool = rest.length > 0 ? rest : allMoves;
            return this._finalize(pool[Math.floor(Math.random() * pool.length)]);
        } catch (e) {
            return null;
        }
    }
}
window.Level_2 = Level_2;
