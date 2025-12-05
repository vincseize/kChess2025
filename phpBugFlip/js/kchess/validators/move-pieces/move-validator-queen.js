// move-validator-queen.js - Validateur des mouvements de reine CORRIGÉ
class QueenMoveValidator {
    constructor(board, gameState) {
        this.board = board;
        this.gameState = gameState;
    }

    getPossibleMoves(piece, row, col) {
        const pieceColor = piece.color;

        // La reine combine les mouvements du fou et de la tour
        const bishopValidator = new BishopMoveValidator(this.board, this.gameState);
        const rookValidator = new RookMoveValidator(this.board, this.gameState);
        
        const bishopMoves = bishopValidator.getPossibleMoves(piece, row, col);
        const rookMoves = rookValidator.getPossibleMoves(piece, row, col);
        
        const allMoves = [...bishopMoves, ...rookMoves];
        
        console.log(`👑 Reine ${pieceColor} en [${row},${col}]: ${allMoves.length} mouvements valides`);
        return allMoves;
    }
}

window.QueenMoveValidator = QueenMoveValidator;