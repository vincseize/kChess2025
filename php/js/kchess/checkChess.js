// checkChess.js - Moteur de vérification d'échec simple
class ChessEngine {
    constructor(fen) {
        this.board = this.parseFEN(fen);
        const parts = fen.split(' ');
        this.turn = parts[1]; // 'w' pour blanc, 'b' pour noir
    }

    parseFEN(fen) {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        const boardPart = fen.split(' ')[0];
        let row = 0, col = 0;
        
        for (const char of boardPart) {
            if (char === '/') {
                row++;
                col = 0;
            } else if (isNaN(char)) {
                board[row][col] = char;
                col++;
            } else {
                col += parseInt(char);
            }
        }
        return board;
    }

    getPiece(row, col) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
        return this.board[row][col];
    }

    findKing(color) {
        const king = color === 'w' ? 'K' : 'k';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === king) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    isSquareAttacked(row, col, attackerColor) {
        const directions = {
            rook: [[-1,0], [1,0], [0,-1], [0,1]],
            bishop: [[-1,-1], [-1,1], [1,-1], [1,1]],
            queen: [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]],
            knight: [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]]
        };

        const pawnDirection = attackerColor === 'w' ? -1 : 1;
        const pawnAttacks = [[pawnDirection, -1], [pawnDirection, 1]];

        // Vérifier les pions
        for (const [dr, dc] of pawnAttacks) {
            const r = row + dr, c = col + dc;
            const piece = this.getPiece(r, c);
            const pawn = attackerColor === 'w' ? 'P' : 'p';
            if (piece === pawn) return true;
        }

        // Vérifier les cavaliers
        for (const [dr, dc] of directions.knight) {
            const r = row + dr, c = col + dc;
            const piece = this.getPiece(r, c);
            const knight = attackerColor === 'w' ? 'N' : 'n';
            if (piece === knight) return true;
        }

        // Vérifier les directions (tours, fous, dame)
        for (const [type, dirs] of [['rook', directions.rook], ['bishop', directions.bishop], ['queen', directions.queen]]) {
            for (const [dr, dc] of dirs) {
                let r = row + dr, c = col + dc;
                
                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const piece = this.getPiece(r, c);
                    if (piece) {
                        const pieceType = piece.toLowerCase();
                        const isAttackerColor = (attackerColor === 'w') === (piece === piece.toUpperCase());
                        
                        if (isAttackerColor) {
                            if (type === 'rook' && (pieceType === 'r' || pieceType === 'q')) return true;
                            if (type === 'bishop' && (pieceType === 'b' || pieceType === 'q')) return true;
                            if (type === 'queen' && pieceType === 'q') return true;
                        }
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            }
        }

        return false;
    }

    // Vérifie l'échec pour une couleur spécifique
    isKingInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;
        
        const attackerColor = color === 'w' ? 'b' : 'w';
        return this.isSquareAttacked(kingPos.row, kingPos.col, attackerColor);
    }

    areKingsAdjacent() {
        const whiteKing = this.findKing('w');
        const blackKing = this.findKing('b');
        
        if (!whiteKing || !blackKing) return false;
        
        const rowDiff = Math.abs(whiteKing.row - blackKing.row);
        const colDiff = Math.abs(whiteKing.col - blackKing.col);
        
        // Les rois sont adjacents s'ils sont à 1 case de distance
        return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
    }

    // Compatibilité
    isCheck() {
        return this.isKingInCheck(this.turn);
    }
}

window.ChessEngine = ChessEngine;