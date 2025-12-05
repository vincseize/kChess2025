// bots/Level_0.js - Version simplifiée
class Level_0 {
    constructor() {
        this.name = "Bot Level 0";
        this.level = 0;
    }

    getMove(fen) {
        try {
            const game = window.chessGame;
            if (!game || !game.core || !game.core.moveValidator) {
                return null;
            }

            const validMoves = [];
            const currentPlayer = game.gameState.currentPlayer;

            // Parcourir toutes les pièces
            for (let fromRow = 0; fromRow < 8; fromRow++) {
                for (let fromCol = 0; fromCol < 8; fromCol++) {
                    const square = game.board.getSquare(fromRow, fromCol);
                    
                    if (square && square.piece && square.piece.color === currentPlayer) {
                        const possibleMoves = game.core.moveValidator.getPossibleMoves(
                            square.piece, 
                            fromRow, 
                            fromCol
                        );
                        
                        possibleMoves.forEach(move => {
                            validMoves.push({
                                fromRow: fromRow,
                                fromCol: fromCol,
                                toRow: move.row,
                                toCol: move.col,
                                piece: square.piece
                            });
                        });
                    }
                }
            }

            if (validMoves.length === 0) {
                return null;
            }

            // Choisir aléatoirement
            const randomIndex = Math.floor(Math.random() * validMoves.length);
            return validMoves[randomIndex];

        } catch (error) {
            console.error('Level_0 error:', error);
            return null;
        }
    }
}

window.Level_0 = Level_0;