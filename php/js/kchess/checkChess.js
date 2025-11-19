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

    isCheck() {
        const kingPos = this.findKing(this.turn);
        if (!kingPos) return false;
        
        const attackerColor = this.turn === 'w' ? 'b' : 'w';
        return this.isSquareAttacked(kingPos.row, kingPos.col, attackerColor);
    }
}

// Utilisation
// const fen = '7r/3pkpp1/p1bRpn1p/2p5/N3P3/1P3P2/P1P1B1PP/3R2K1 w - - 3 19';
// const game = new ChessEngine(fen);
// const isKingInCheck = game.isCheck(); // true

// console.log(isKingInCheck); // true