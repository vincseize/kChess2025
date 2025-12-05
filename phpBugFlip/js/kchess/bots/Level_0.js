// bots/Level_0.js - Bot niveau 0 (coups aléatoires)
class Level_0 {
    constructor() {
        this.name = "Bot Level 0";
        this.level = 0;
        console.log('🤖 Level_0 Bot initialized');
    }

    // Méthode principale pour obtenir un coup
    getMove(fen) {
        try {
            console.log('🎯 Level_0: getMove called with FEN:', fen);
            
            const game = window.chessGame;
            if (!game || !game.core) {
                console.error('❌ chessGame or core not found');
                return null;
            }

            // Obtenir tous les coups valides
            const validMoves = [];
            const currentPlayer = game.gameState.currentPlayer;

            console.log(`🔍 Level_0: Looking for moves for ${currentPlayer}`);

            // Parcourir toutes les pièces du joueur actuel
            for (let fromRow = 0; fromRow < 8; fromRow++) {
                for (let fromCol = 0; fromCol < 8; fromCol++) {
                    const square = game.board.getSquare(fromRow, fromCol);
                    
                    if (square && square.piece && square.piece.color === currentPlayer) {
                        console.log(`🔍 Found ${square.piece.color} ${square.piece.type} at ${fromRow},${fromCol}`);
                        
                        // UTILISER LA BONNE MÉTHODE : getPossibleMoves du moveValidator
                        const possibleMoves = game.core.moveValidator.getPossibleMoves(
                            square.piece, 
                            fromRow, 
                            fromCol
                        );
                        
                        console.log(`📋 Possible moves for ${square.piece.type}:`, possibleMoves);
                        
                        // Ajouter tous les mouvements possibles
                        possibleMoves.forEach(move => {
                            validMoves.push({
                                fromRow: fromRow,
                                fromCol: fromCol,
                                toRow: move.row,
                                toCol: move.col,
                                piece: square.piece,
                                moveData: move // Conserver les données du mouvement
                            });
                            
                            console.log(`✅ Valid move: ${fromRow},${fromCol} -> ${move.row},${move.col} (${move.type || 'normal'})`);
                        });
                    }
                }
            }

            console.log(`📊 Level_0: Found ${validMoves.length} valid moves`);

            if (validMoves.length === 0) {
                console.log('❌ Level_0: No valid moves available');
                return null;
            }

            // Choisir un coup aléatoire
            const randomIndex = Math.floor(Math.random() * validMoves.length);
            const selectedMove = validMoves[randomIndex];
            
            console.log(`🎲 Level_0: Selected move: ${selectedMove.fromRow},${selectedMove.fromCol} -> ${selectedMove.toRow},${selectedMove.toCol}`);
            console.log(`🎲 Move details:`, selectedMove.moveData);
            
            return selectedMove;

        } catch (error) {
            console.error('❌ Level_0 Error:', error);
            return null;
        }
    }

    // Méthode de test simple
    test() {
        console.log('🧪 Testing Level_0 bot...');
        
        if (!window.chessGame) {
            console.error('❌ chessGame not found in window');
            return null;
        }
        
        const fen = window.FENGenerator.generateFEN(window.chessGame.gameState, window.chessGame.board);
        const move = this.getMove(fen);
        
        console.log('🧪 Test move result:', move);
        return move;
    }
}

// Exporter la classe
window.Level_0 = Level_0;