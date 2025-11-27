// bots/Level_0.js - Bot niveau 0 (coups aléatoires)
class Level_0 {
    constructor() {
        this.name = "Bot Level 0";
        this.level = 0;
        console.log('🤖 Level_0 Bot initialized');
    }

    // Méthode principale pour obtenir un coup aléatoire
    getRandomMove(fen) {
        try {
            console.log('🎲 Level_0: Generating random move from FEN:', fen);
            
            // Obtenir tous les coups valides
            const allPossibleMoves = this.getAllValidMoves();
            
            if (allPossibleMoves.length === 0) {
                console.log('❌ Level_0: No valid moves available');
                return null;
            }
            
            // Choisir un coup aléatoire
            const randomIndex = Math.floor(Math.random() * allPossibleMoves.length);
            const selectedMove = allPossibleMoves[randomIndex];
            
            console.log(`🎲 Level_0: Selected random move from ${allPossibleMoves.length} possibilities:`, selectedMove);
            
            return selectedMove;
            
        } catch (error) {
            console.error('❌ Level_0 Error:', error);
            return null;
        }
    }

    // Obtenir tous les coups valides en utilisant votre système existant
    getAllValidMoves() {
        const possibleMoves = [];
        const game = window.chessGame;
        
        if (!game || !game.board || !game.gameState) {
            console.error('❌ Game not initialized');
            return [];
        }
        
        const currentPlayer = game.gameState.currentPlayer; // 'white' ou 'black'
        
        console.log(`🔍 Level_0: Looking for moves for ${currentPlayer}`);
        
        // Parcourir toutes les cases du plateau
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const square = game.board.getSquare(fromRow, fromCol);
                
                // Vérifier si la case contient une pièce du joueur actuel
                if (square && square.piece && square.piece.color === currentPlayer) {
                    console.log(`🔍 Found ${square.piece.color} ${square.piece.type} at ${fromRow},${fromCol}`);
                    
                    // Pour chaque case de destination possible
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            // Utiliser votre validateur existant
                            if (this.isMoveValid(fromRow, fromCol, toRow, toCol)) {
                                possibleMoves.push({
                                    from: { row: fromRow, col: fromCol },
                                    to: { row: toRow, col: toCol },
                                    piece: square.piece
                                });
                                
                                console.log(`✅ Valid move: ${fromRow},${fromCol} -> ${toRow},${toCol}`);
                            }
                        }
                    }
                }
            }
        }
        
        console.log(`📊 Level_0: Found ${possibleMoves.length} valid moves`);
        return possibleMoves;
    }

    // Utiliser votre système de validation existant
    isMoveValid(fromRow, fromCol, toRow, toCol) {
        try {
            const game = window.chessGame;
            
            // Vérifier si le validateur existe
            if (typeof window.moveValidator === 'undefined') {
                console.error('❌ moveValidator not found');
                return false;
            }
            
            // Utiliser le validateur global
            const isValid = window.moveValidator.isValidMove(
                fromRow, fromCol, toRow, toCol, 
                game.board, 
                game.gameState
            );
            
            return isValid;
            
        } catch (error) {
            console.error('❌ Validation error:', error);
            return false;
        }
    }

    // Méthode pour formater le coup pour l'UI
    formatMoveForUI(move) {
        if (!move) return null;
        
        return {
            fromRow: move.from.row,
            fromCol: move.from.col,
            toRow: move.to.row,
            toCol: move.to.col,
            piece: move.piece
        };
    }

    // Méthode principale à appeler depuis l'extérieur
    getMove(fen) {
        console.log('🎯 Level_0: getMove called with FEN:', fen);
        const move = this.getRandomMove(fen);
        const formattedMove = this.formatMoveForUI(move);
        console.log('🎯 Level_0: Returning move:', formattedMove);
        return formattedMove;
    }

    // Méthode simple pour tester
    test() {
        console.log('🧪 Testing Level_0 bot...');
        
        if (!window.chessGame) {
            console.error('❌ chessGame not found in window');
            return null;
        }
        
        const fen = window.FENGenerator.generateFEN(window.chessGame.gameState, window.chessGame.board);
        console.log('🧪 Current FEN:', fen);
        
        const move = this.getMove(fen);
        console.log('🧪 Test move result:', move);
        
        return move;
    }
}

window.Level_0 = Level_0;