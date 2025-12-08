// bots/Level_1.js - Version simplifiée
class Level_1 {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('bots/Level_1.js loaded');
        }
    }

    constructor() {
        this.name = "Bot Level 0";
        this.level = 0;
        
        if (this.constructor.consoleLog) {
            console.log(`🤖 [Level_1] Bot Level 0 initialisé - "Random Move Bot"`);
        }
    }

    getMove(fen) {
        if (this.constructor.consoleLog) {
            console.log(`🎲 [Level_1] Début calcul du coup pour FEN: ${fen}`);
            console.log(`⚪ [Level_1] Joueur actuel: ${window.chessGame?.gameState?.currentPlayer || 'inconnu'}`);
        }

        try {
            const game = window.chessGame;
            if (!game || !game.core || !game.core.moveValidator) {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [Level_1] Jeu ou moteur de mouvement non disponible`);
                }
                return null;
            }

            const validMoves = [];
            const currentPlayer = game.gameState.currentPlayer;

            if (this.constructor.consoleLog) {
                console.log(`🔍 [Level_1] Recherche des coups valides pour ${currentPlayer === 'white' ? 'Blancs' : 'Noirs'}`);
            }

            // Parcourir toutes les pièces
            for (let fromRow = 0; fromRow < 8; fromRow++) {
                for (let fromCol = 0; fromCol < 8; fromCol++) {
                    const square = game.board.getSquare(fromRow, fromCol);
                    
                    if (square && square.piece && square.piece.color === currentPlayer) {
                        const pieceType = square.piece.type;
                        const pieceChar = pieceType.charAt(0).toUpperCase();
                        
                        if (this.constructor.consoleLog) {
                            console.log(`  👉 [Level_1] Pièce ${pieceChar} en [${fromRow},${fromCol}] (${currentPlayer})`);
                        }
                        
                        const possibleMoves = game.core.moveValidator.getPossibleMoves(
                            square.piece, 
                            fromRow, 
                            fromCol
                        );
                        
                        if (this.constructor.consoleLog && possibleMoves.length > 0) {
                            console.log(`    📍 [Level_1] ${possibleMoves.length} mouvement(s) possible(s)`);
                        }
                        
                        possibleMoves.forEach(move => {
                            validMoves.push({
                                fromRow: fromRow,
                                fromCol: fromCol,
                                toRow: move.row,
                                toCol: move.col,
                                piece: square.piece
                            });
                            
                            if (this.constructor.consoleLog) {
                                console.log(`      → [${fromRow},${fromCol}] → [${move.row},${move.col}]`);
                            }
                        });
                    }
                }
            }

            if (this.constructor.consoleLog) {
                console.log(`📊 [Level_1] Total coups valides trouvés: ${validMoves.length}`);
            }

            if (validMoves.length === 0) {
                if (this.constructor.consoleLog) {
                    console.log(`🚫 [Level_1] Aucun coup valide disponible!`);
                }
                return null;
            }

            // Choisir aléatoirement
            const randomIndex = Math.floor(Math.random() * validMoves.length);
            const selectedMove = validMoves[randomIndex];
            
            if (this.constructor.consoleLog) {
                console.log(`🎯 [Level_1] Coup sélectionné (aléatoire):`);
                console.log(`    📍 Départ: [${selectedMove.fromRow},${selectedMove.fromCol}]`);
                console.log(`    📍 Arrivée: [${selectedMove.toRow},${selectedMove.toCol}]`);
                console.log(`    ♟️ Pièce: ${selectedMove.piece.type} (${selectedMove.piece.color})`);
                console.log(`    🎲 Index choisi: ${randomIndex + 1}/${validMoves.length}`);
                
                // Convertir en notation échecs si possible
                const colToLetter = col => String.fromCharCode(97 + col);
                const rowToNumber = row => 8 - row;
                console.log(`    📝 Notation: ${colToLetter(selectedMove.fromCol)}${rowToNumber(selectedMove.fromRow)} → ${colToLetter(selectedMove.toCol)}${rowToNumber(selectedMove.toRow)}`);
            }

            return selectedMove;

        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [Level_1] ERREUR lors du calcul du coup: ${error.message}`);
                console.error('Level_1 error:', error);
            }
            return null;
        }
    }
    
    // NOUVELLE MÉTHODE : Obtenir le statut du bot
    getStatus() {
        return {
            name: this.name,
            level: this.level,
            type: "Random Move Bot",
            description: "Effectue des coups aléatoires parmi les mouvements légaux"
        };
    }
    
    // NOUVELLE MÉTHODE : Simuler un coup pour test
    simulateMove(fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`🧪 [Level_1] Simulation de coup: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        // Vérifier si le coup est dans la liste des mouvements possibles
        const game = window.chessGame;
        if (!game) return false;
        
        const square = game.board.getSquare(fromRow, fromCol);
        if (!square || !square.piece) return false;
        
        const possibleMoves = game.core.moveValidator.getPossibleMoves(square.piece, fromRow, fromCol);
        const isValid = possibleMoves.some(move => move.row === toRow && move.col === toCol);
        
        if (this.constructor.consoleLog) {
            console.log(`  ✅ [Level_1] Coup ${isValid ? 'VALIDE' : 'INVALIDE'}`);
        }
        
        return isValid;
    }
}

// Initialisation statique
Level_1.init();

window.Level_1 = Level_1;