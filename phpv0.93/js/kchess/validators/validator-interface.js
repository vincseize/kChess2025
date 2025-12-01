// validator-interface.js - Interface avec les validateurs de mouvements
class ValidatorInterface {
    constructor(game) {
        this.game = game;
    }

    getPossibleMoves(piece, row, col) {
        return this.game.moveValidator.getPossibleMoves(piece, row, col);
    }

    validateMove(piece, fromRow, fromCol, toRow, toCol) {
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        return possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
    }

    isCheckAfterMove(piece, fromRow, fromCol, toRow, toCol) {
        // Simulation du mouvement pour vérifier l'échec
        const fromSquare = this.game.board.getSquare(fromRow, fromCol);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        
        if (!fromSquare || !toSquare) return false;

        // Sauvegarder l'état
        const originalToPiece = toSquare.piece;
        const originalFromPiece = fromSquare.piece;

        // Simuler le mouvement
        toSquare.piece = fromSquare.piece;
        fromSquare.piece = null;

        // Vérifier l'échec
        const isInCheck = this.game.moveValidator.isKingInCheck(piece.color);

        // Restaurer l'état
        fromSquare.piece = originalFromPiece;
        toSquare.piece = originalToPiece;

        return isInCheck;
    }

    getMoveType(piece, fromRow, fromCol, toRow, toCol) {
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);
        return move ? move.type : null;
    }

    isSpecialMove(piece, fromRow, fromCol, toRow, toCol) {
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);
        return move ? (move.special || move.type === 'en-passant') : false;
    }
}

window.ValidatorInterface = ValidatorInterface;