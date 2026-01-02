/**
 * Level_3 - Stratégie CCMO Sécurisée (V1.6.4)
 * Correction : Détection spécifique des captures de pions
 */
class Level_3 {
    static VERSION = '1.6.4';
    static consoleLog = true;

    static init() {
        if (this.consoleLog) console.log(`🧠 Level_3 v${this.VERSION} prêt`);
    }

    constructor() {
        this.name = "Bot Level 3 (CCMO+)";
        this.level = 3;
        this.pieceValues = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 100 };
    }

    async getMove(fen) {
        const game = window.chessGame?.core || window.chessGame;
        const oppColor = game.gameState.currentPlayer === 'white' ? 'black' : 'white';
        const allMoves = this.getAllValidMoves(game);
        
        if (allMoves.length === 0) return { error: 'game_over' };

        await new Promise(r => setTimeout(r, 600));

        // FILTRAGE : On retire les coups qui mènent à une case contrôlée par l'ennemi
        const safeMoves = allMoves.filter(m => !this.isSquareAttacked(game, m.toRow, m.toCol, oppColor));

        if (safeMoves.length > 0) {
            const captures = safeMoves.filter(m => m.isCapture);
            if (captures.length > 0) return this.finalizeMove(captures, 'CAPTURE SÛRE');
            
            // Priorité aux pièces mineures pour ne pas sortir la Dame pour rien
            const development = safeMoves.filter(m => m.piece.type !== 'queen');
            return this.finalizeMove(development.length > 0 ? development : safeMoves, 'DÉVELOPPEMENT SÛR');
        }

        // Si rien n'est sûr, on cherche l'échange ou la survie
        return this.finalizeMove(allMoves, 'SURVIE (AUCUN COUP SÛR)');
    }

    // --- SCANNER DE MENACE AMÉLIORÉ ---
    isSquareAttacked(game, row, col, byColor) {
        const board = game.board;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board.getPiece?.(r, c) || board.getSquare?.(r, c)?.piece;
                if (p && p.color === byColor) {
                    
                    // Cas critique : Le PION
                    if (p.type === 'pawn') {
                        const direction = (byColor === 'white') ? -1 : 1;
                        // Un pion attaque TOUJOURS ses deux diagonales devant lui
                        if (r + direction === row && (c - 1 === col || c + 1 === col)) {
                            return true;
                        }
                    } else {
                        // Pour les autres pièces, on utilise le validateur
                        const moves = game.moveValidator.getPossibleMoves(p, r, c);
                        if (moves.some(m => m.row === row && m.col === col)) return true;
                    }
                }
            }
        }
        return false;
    }

    getAllValidMoves(game) {
        const moves = [];
        const player = game.gameState.currentPlayer;
        const board = game.board;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board.getPiece?.(r, c) || board.getSquare?.(r, c)?.piece;
                if (p && p.color === player) {
                    const targets = game.moveValidator.getPossibleMoves(p, r, c);
                    targets.forEach(t => {
                        const targetPiece = board.getPiece?.(t.row, t.col) || board.getSquare?.(t.row, t.col)?.piece;
                        moves.push({
                            fromRow: r, fromCol: c, toRow: t.row, toCol: t.col,
                            piece: p, targetPiece: targetPiece,
                            isCapture: !!targetPiece && targetPiece.color !== player,
                            notation: `${'abcdefgh'[c]}${8-r} ➔ ${'abcdefgh'[t.col]}${8-t.row}`
                        });
                    });
                }
            }
        }
        return moves;
    }

    finalizeMove(list, strategy) {
        const move = list[Math.floor(Math.random() * list.length)];
        if (Level_3.consoleLog) console.log(`🎯 [${strategy}] ${move.notation} (${move.piece.type})`);
        return move;
    }
}

Level_3.init();
window.Level_3 = Level_3;