// check/checkChess.js - Moteur de vérification d'échec unifié
class ChessEngine {
    
    static consoleLog = true;
    
    static init() {
        this.loadConfig();
        
        if (this.consoleLog) {
            console.log('✅ check/checkChess.js chargé - VERSION UNIFIÉE');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog}`);
        }
    }
    
    static loadConfig() {
        try {
            if (window.appConfig?.chess_engine?.console_log !== undefined) {
                const val = window.appConfig.chess_engine.console_log;
                this.consoleLog = val === "false" ? false : Boolean(val);
            }
            else if (window.appConfig?.debug?.console_log !== undefined) {
                const val = window.appConfig.debug.console_log;
                this.consoleLog = val === "false" ? false : Boolean(val);
            }
            return true;
        } catch (error) {
            console.error('❌ ChessEngine: Erreur config:', error);
            return false;
        }
    }

    constructor(fen) {
        this.fen = fen;
        this.board = this.parseFEN(fen);
        const parts = fen.split(' ');
        this.turn = parts[1]; // 'w' ou 'b'
        
        if (ChessEngine.consoleLog) {
            console.log('🔧 ChessEngine créé avec FEN:', fen);
            this.displayBoard();
        }
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
        // Normalisation : 'white' -> 'w', 'black' -> 'b'
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        const kingChar = side === 'w' ? 'K' : 'k';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === kingChar) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    isSquareAttacked(row, col, attackerColor) {
        // Normalisation de la couleur de l'attaquant
        const att = (attackerColor === 'white' || attackerColor === 'w') ? 'w' : 'b';
        
        const directions = {
            rook: [[-1, 0], [1, 0], [0, -1], [0, 1]],
            bishop: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
            knight: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
            king: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
        };

        // 1. ROI
        for (const [dr, dc] of directions.king) {
            const r = row + dr, c = col + dc;
            if (this.isValidSquare(r, c)) {
                const piece = this.getPiece(r, c);
                if (piece === (att === 'w' ? 'K' : 'k')) return true;
            }
        }

        // 2. PIONS
        // Si on cherche si une case est attaquée par un pion blanc, 
        // on regarde en "bas" (row + 1) s'il y a un pion blanc (pour un board standard 0-7)
        const pawnAttacks = att === 'w' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
        for (const [dr, dc] of pawnAttacks) {
            const r = row + dr, c = col + dc;
            if (this.isValidSquare(r, c)) {
                const piece = this.getPiece(r, c);
                if (piece === (att === 'w' ? 'P' : 'p')) return true;
            }
        }

        // 3. CAVALIERS
        for (const [dr, dc] of directions.knight) {
            const r = row + dr, c = col + dc;
            if (this.isValidSquare(r, c)) {
                const piece = this.getPiece(r, c);
                if (piece === (att === 'w' ? 'N' : 'n')) return true;
            }
        }

        // 4. PIÈCES GLISSANTES (Tours, Fous, Dames)
        const slidingConfigs = [
            { dirs: directions.rook, targets: att === 'w' ? ['R', 'Q'] : ['r', 'q'] },
            { dirs: directions.bishop, targets: att === 'w' ? ['B', 'Q'] : ['b', 'q'] }
        ];

        for (const config of slidingConfigs) {
            for (const [dr, dc] of config.dirs) {
                let r = row + dr, c = col + dc;
                while (this.isValidSquare(r, c)) {
                    const piece = this.getPiece(r, c);
                    if (piece) {
                        if (config.targets.includes(piece)) return true;
                        break; 
                    }
                    r += dr; c += dc;
                }
            }
        }
        return false;
    }

    isKingInCheck(color) {
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        const kingPos = this.findKing(side);
        if (!kingPos) return false;
        
        const opponent = side === 'w' ? 'b' : 'w';
        return this.isSquareAttacked(kingPos.row, kingPos.col, opponent);
    }

    checkGameStatus(color = null) {
        const playerColor = color || this.turn;
        
        if (ChessEngine.consoleLog) {
            console.log(`\n🎮 VÉRIFICATION STATUT (${playerColor === 'w' ? 'Blancs' : 'Noirs'})`);
        }
        
        if (this.isCheckmate(playerColor)) return 'checkmate';
        if (this.isStalemate(playerColor)) return 'stalemate';
        
        return 'in_progress';
    }

    isCheckmate(color = null) {
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        if (!this.isKingInCheck(side)) return false;
        return !this.hasAnyLegalMoves(side);
    }

    isStalemate(color = null) {
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        if (this.isKingInCheck(side)) return false;
        return !this.hasAnyLegalMoves(side);
    }

    hasAnyLegalMoves(color) {
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && this.isPieceColor(piece, side)) {
                    const possibleMoves = this.getPossibleMovesForPiece(piece, row, col);
                    for (const move of possibleMoves) {
                        if (this.isMoveLegal(side, row, col, move.row, move.col)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    isPieceColor(piece, color) {
        if (!piece) return false;
        const isWhite = piece === piece.toUpperCase();
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        return (side === 'w' && isWhite) || (side === 'b' && !isWhite);
    }

    isMoveLegal(color, fromRow, fromCol, toRow, toCol) {
        const side = (color === 'white' || color === 'w') ? 'w' : 'b';
        const opponent = side === 'w' ? 'b' : 'w';

        // Simulation
        const originalTarget = this.board[toRow][toCol];
        const originalSource = this.board[fromRow][fromCol];

        this.board[toRow][toCol] = originalSource;
        this.board[fromRow][fromCol] = null;

        const kingPos = this.findKing(side);
        let stillInCheck = false;
        if (kingPos) {
            stillInCheck = this.isSquareAttacked(kingPos.row, kingPos.col, opponent);
        }

        // Backtrack
        this.board[fromRow][fromCol] = originalSource;
        this.board[toRow][toCol] = originalTarget;

        return !stillInCheck;
    }

    getPossibleMovesForPiece(piece, row, col) {
        const type = piece.toLowerCase();
        const moves = [];
        switch(type) {
            case 'p': this.getPawnMoves(moves, piece, row, col); break;
            case 'n': this.getKnightMoves(moves, row, col); break;
            case 'b': this.getBishopMoves(moves, row, col); break;
            case 'r': this.getRookMoves(moves, row, col); break;
            case 'q': this.getQueenMoves(moves, row, col); break;
            case 'k': this.getKingMoves(moves, row, col); break;
        }
        return moves;
    }

    // --- Générateurs de mouvements simplifiés pour la simulation ---
    getPawnMoves(moves, piece, row, col) {
        const dir = (piece === 'P') ? -1 : 1;
        const start = (piece === 'P') ? 6 : 1;
        if (this.isValidSquare(row + dir, col) && !this.getPiece(row + dir, col)) {
            moves.push({ row: row + dir, col: col });
            if (row === start && !this.getPiece(row + 2 * dir, col)) moves.push({ row: row + 2 * dir, col: col });
        }
        [[dir, -1], [dir, 1]].forEach(([dr, dc]) => {
            const nr = row + dr, nc = col + dc;
            if (this.isValidSquare(nr, nc)) {
                const target = this.getPiece(nr, nc);
                if (target && !this.isPieceColor(target, piece === 'P' ? 'w' : 'b')) moves.push({ row: nr, col: nc });
            }
        });
    }

    getKnightMoves(moves, row, col) {
        [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
            const nr = row + dr, nc = col + dc;
            if (this.isValidSquare(nr, nc)) {
                const target = this.getPiece(nr, nc);
                if (!target || !this.isPieceColor(target, this.isPieceColor(this.getPiece(row, col), 'w') ? 'w' : 'b')) moves.push({ row: nr, col: nc });
            }
        });
    }

    getSlidingMoves(moves, row, col, directions) {
        const side = this.isPieceColor(this.getPiece(row, col), 'w') ? 'w' : 'b';
        directions.forEach(([dr, dc]) => {
            let nr = row + dr, nc = col + dc;
            while (this.isValidSquare(nr, nc)) {
                const target = this.getPiece(nr, nc);
                if (!target) moves.push({ row: nr, col: nc });
                else {
                    if (!this.isPieceColor(target, side)) moves.push({ row: nr, col: nc });
                    break;
                }
                nr += dr; nc += dc;
            }
        });
    }

    getBishopMoves(moves, row, col) { this.getSlidingMoves(moves, row, col, [[-1,-1],[-1,1],[1,-1],[1,1]]); }
    getRookMoves(moves, row, col) { this.getSlidingMoves(moves, row, col, [[-1,0],[1,0],[0,-1],[0,1]]); }
    getQueenMoves(moves, row, col) { this.getSlidingMoves(moves, row, col, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]); }
    getKingMoves(moves, row, col) {
        [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => {
            const nr = row + dr, nc = col + dc;
            if (this.isValidSquare(nr, nc)) {
                const target = this.getPiece(nr, nc);
                if (!target || !this.isPieceColor(target, this.isPieceColor(this.getPiece(row, col), 'w') ? 'w' : 'b')) moves.push({ row: nr, col: nc });
            }
        });
    }

    isValidSquare(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

    displayBoard() {
        if (!ChessEngine.consoleLog) return;
        console.log('\n📊 PLATEAU:');
        for (let r = 0; r < 8; r++) {
            let line = `${8-r} `;
            for (let c = 0; c < 8; c++) line += (this.getPiece(r,c) || '.') + ' ';
            console.log(line);
        }
        console.log('  a b c d e f g h');
    }
}

ChessEngine.init();
window.ChessEngine = ChessEngine;