/**
 * js/kchess/bots/BotCore.js
 * Classe parente partagée (Base pour tous les bots)
 */
class BotCore {
    constructor() {
        this.gameFonctions = GameFonctions.attach(this);
    }

    // Récupère l'instance de jeu
    getGame() {
        return window.chessGame?.core || window.chessGame;
    }

    // Lecture d'une pièce sur le plateau
    getPiece(board, r, c) {
        try {
            if (typeof board.getPiece === 'function') return board.getPiece(r, c);
            const sq = board.grid ? board.grid[r][c] : board[r][c];
            return (sq && sq.type) ? sq : null;
        } catch (e) { 
            return null; 
        }
    }

    // Liste les coups légaux pour une couleur donnée
    getMoves(game, color) {
        const moves = [];
        if (!game || !game.moveValidator) return moves;
        const myColor = color.charAt(0).toLowerCase();

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.getPiece(game.board, r, c);
                if (p && p.color.charAt(0).toLowerCase() === myColor) {
                    const possible = game.moveValidator.getPossibleMoves(p, r, c);
                    possible?.forEach(m => {
                        const target = this.getPiece(game.board, m.row, m.col);
                        moves.push({
                            fromRow: r, fromCol: c, toRow: m.row, toCol: m.col,
                            piece: p,
                            isCapture: target && target.color.charAt(0).toLowerCase() !== myColor
                        });
                    });
                }
            }
        }
        return moves;
    }

    // Formatage final pour le MoveHandler
    finalize(move) {
        if (!move) return null;
        const res = {
            fromRow: move.fromRow, fromCol: move.fromCol,
            toRow: move.toRow, toCol: move.toCol,
            promotion: null
        };
        // Promotion automatique en Reine si le pion atteint la dernière rangée
        if (move.piece?.type === 'pawn' && (move.toRow === 0 || move.toRow === 7)) {
            res.promotion = 'queen';
        }
        return res;
    }
}

// CRUCIAL : Assignation immédiate pour permettre l'héritage (extends BotBase)
window.BotBase = BotCore;

// Log de confirmation
console.log("🚀 [BotCore] Système initialisé. window.BotBase est prêt.");