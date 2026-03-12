/**
 * js/bot-helper.js
 * Outils partagés pour tous les niveaux de bots
 */
window.BotHelper = {
    // Récupère l'instance du moteur
    getGame: () => window.chessGame?.core || window.chessGame,

    // Lecture sécurisée d'une pièce
    getPiece: (board, r, c) => {
        try {
            let sq = board.getPiece ? board.getPiece(r, c) : (board.grid ? board.grid[r][c] : board[r][c]);
            if (sq && sq.piece) return sq.piece;
            return (sq && sq.type) ? sq : null;
        } catch (e) { return null; }
    },

    // Formate le coup pour le moteur et gère la promotion
    finalize: (move) => {
        if (!move) return null;
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            move.promotion = 'queen';
        }
        return move;
    },

    // Notation simple
    notation: (fR, fC, tR, tC) => `${'abcdefgh'[fC]}${8 - fR}➔${'abcdefgh'[tC]}${8 - tR}`
};