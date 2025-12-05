// move-logic.js - Logique de déplacement des pièces
class MoveLogic {
    constructor(chessGame) {
        this.chessGame = chessGame;
    }

    movePiece(fromSquare, toSquare, promotionType = null) {
        const fromPiece = fromSquare.piece;
        const toPiece = toSquare.piece;
        
        // Sauvegarder l'état avant le mouvement
        const previousFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
        
        // Déplacer la pièce
        this.chessGame.board.movePiece(fromSquare, toSquare);
        
        // Gérer la promotion
        if (promotionType) {
            this.chessGame.promotionManager.promotePawn(toSquare, promotionType);
        }
        
        // Mettre à jour le compteur des 50 coups
        this.updateHalfMoveClock(fromPiece, toPiece, toSquare);
        
        // Sauvegarder le mouvement dans l'historique
        this.chessGame.gameState.moveHistory.push({
            from: { row: fromSquare.row, col: fromSquare.col },
            to: { row: toSquare.row, col: toSquare.col },
            piece: fromPiece.type,
            color: fromPiece.color,
            captured: toPiece ? toPiece.type : null,
            fen: previousFEN
        });
        
        // Changer le tour
        this.chessGame.gameState.currentTurn = this.chessGame.gameState.currentTurn === 'white' ? 'black' : 'white';
        
        this.chessGame.clearSelection();
        this.chessGame.gameStatusManager.updateGameStatus();
    }

    updateHalfMoveClock(fromPiece, toPiece, toSquare) {
        if (toPiece || fromPiece.type === 'pawn') {
            this.chessGame.gameState.halfMoveClock = 0;
            console.log(`🔄 HalfMoveClock réinitialisé à 0 (${toPiece ? 'capture' : 'mouvement pion'})`);
        } else {
            this.chessGame.gameState.halfMoveClock++;
            console.log(`📈 HalfMoveClock incrémenté: ${this.chessGame.gameState.halfMoveClock}`);
        }
    }
}