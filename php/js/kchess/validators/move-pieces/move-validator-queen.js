// validators/move-pieces/move-validator-queen.js - Validateur des mouvements de reine CORRIGÉ
class QueenMoveValidator {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('validators/move-pieces/move-validator-queen.js loaded');
        }
    }

    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 QueenMoveValidator initialisé');
            console.log(`  - Board: ${board ? '✓' : '✗'}`);
            console.log(`  - GameState: ${gameState ? '✓' : '✗'}`);
        }
    }

    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.log(`\n👑🔍 Recherche mouvements pour reine ${piece.color} en [${row},${col}]`);
        }
        
        const pieceColor = piece.color;

        // La reine combine les mouvements du fou et de la tour
        const bishopValidator = new BishopMoveValidator(this.board, this.gameState);
        const rookValidator = new RookMoveValidator(this.board, this.gameState);
        
        if (this.constructor.consoleLog) {
            console.log(`👑 Composition: Fou + Tour`);
        }
        
        const bishopMoves = bishopValidator.getPossibleMoves(piece, row, col);
        const rookMoves = rookValidator.getPossibleMoves(piece, row, col);
        
        const allMoves = [...bishopMoves, ...rookMoves];
        
        if (this.constructor.consoleLog) {
            console.log(`👑 Reine ${pieceColor} en [${row},${col}]:`);
            console.log(`  - Mouvements diagonaux (Fou): ${bishopMoves.length}`);
            console.log(`  - Mouvements orthogonaux (Tour): ${rookMoves.length}`);
            console.log(`  - TOTAL: ${allMoves.length} mouvements valides`);
        }
        
        return allMoves;
    }
}

// Initialisation statique
QueenMoveValidator.init();

window.QueenMoveValidator = QueenMoveValidator;