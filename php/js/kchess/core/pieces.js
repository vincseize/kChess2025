// pieces.js - Définitions des pièces et leurs mouvements
class PieceManager {
    constructor() {
        this.pieceSymbols = {
            white: {
                king: '<img src="img/chesspieces/wikipedia/wK.png" alt="Roi Blanc" class="chess-piece-img">',
                queen: '<img src="img/chesspieces/wikipedia/wQ.png" alt="Dame Blanche" class="chess-piece-img">',
                rook: '<img src="img/chesspieces/wikipedia/wR.png" alt="Tour Blanche" class="chess-piece-img">',
                bishop: '<img src="img/chesspieces/wikipedia/wB.png" alt="Fou Blanc" class="chess-piece-img">',
                knight: '<img src="img/chesspieces/wikipedia/wN.png" alt="Cavalier Blanc" class="chess-piece-img">',
                pawn: '<img src="img/chesspieces/wikipedia/wP.png" alt="Pion Blanc" class="chess-piece-img">'
            },
            black: {
                king: '<img src="img/chesspieces/wikipedia/bK.png" alt="Roi Noir" class="chess-piece-img">',
                queen: '<img src="img/chesspieces/wikipedia/bQ.png" alt="Dame Noire" class="chess-piece-img">',
                rook: '<img src="img/chesspieces/wikipedia/bR.png" alt="Tour Noire" class="chess-piece-img">',
                bishop: '<img src="img/chesspieces/wikipedia/bB.png" alt="Fou Noir" class="chess-piece-img">',
                knight: '<img src="img/chesspieces/wikipedia/bN.png" alt="Cavalier Noir" class="chess-piece-img">',
                pawn: '<img src="img/chesspieces/wikipedia/bP.png" alt="Pion Noir" class="chess-piece-img">'
            }
        };
    }

    getSymbol(type, color) {
        return this.pieceSymbols[color][type];
    }

    getInitialPosition() {
        return {
            // Pions noirs
            ...this.createPieces('pawn', 'black', 1),
            // Pièces noires
            ...this.createBackRow('black', 0),
            // Pions blancs
            ...this.createPieces('pawn', 'white', 6),
            // Pièces blanches
            ...this.createBackRow('white', 7)
        };
    }

    createPieces(type, color, row) {
        const pieces = {};
        for (let col = 0; col < 8; col++) {
            pieces[`${row}-${col}`] = { type, color };
        }
        return pieces;
    }

    createBackRow(color, row) {
        return {
            [`${row}-0`]: { type: 'rook', color },
            [`${row}-1`]: { type: 'knight', color },
            [`${row}-2`]: { type: 'bishop', color },
            [`${row}-3`]: { type: 'queen', color },
            [`${row}-4`]: { type: 'king', color },
            [`${row}-5`]: { type: 'bishop', color },
            [`${row}-6`]: { type: 'knight', color },
            [`${row}-7`]: { type: 'rook', color }
        };
    }
}

window.PieceManager = PieceManager;