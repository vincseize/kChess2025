// pieces.js - Définitions des pièces et leurs mouvements
class PieceManager {
    constructor() {
        this.pieceSymbols = {
            white: {
                king: '\u2654',    // ♔
                queen: '\u2655',   // ♕
                rook: '\u2656',    // ♖
                bishop: '\u2657',  // ♗
                knight: '\u2658',  // ♘
                pawn: '\u2659'     // ♙
            },
            black: {
                king: '\u265A',    // ♚
                queen: '\u265B',   // ♛
                rook: '\u265C',    // ♜
                bishop: '\u265D',  // ♝
                knight: '\u265E',  // ♞
                pawn: '\u265F'     // ♟
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