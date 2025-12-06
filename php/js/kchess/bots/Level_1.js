// bots/Level_1.js - Version CORRIGÉE (sans Promise)
class Level_1 {
    constructor() {
        this.name = "Bot Level 1 (CCMO)";
        this.level = 1;
        console.log('🤖 Level_1 Bot initialized');
    }

    // Méthode principale pour obtenir un coup - NE DOIT PAS retourner de Promise!
    getMove(fen) {
        try {
            const game = window.chessGame;
            if (!game || !game.core || !game.core.moveValidator) {
                console.log('❌ Level_1: chessGame or core not found');
                return null; // Retourne null, PAS une Promise!
            }

            // Obtenir tous les coups valides
            const allMoves = this.getAllValidMoves();
            
            if (allMoves.length === 0) {
                console.log('❌ Level_1: No valid moves available');
                return null;
            }

            // Étape 1: CHECK - Rechercher un coup qui met en échec
            const checkMoves = this.getCheckMoves(allMoves);
            if (checkMoves.length > 0) {
                console.log(`✅ Level_1 (CHECK): Found ${checkMoves.length} check moves`);
                return this.selectRandomMove(checkMoves);
            }

            // Étape 2: CAPTURE - Rechercher un coup de capture
            const captureMoves = this.getCaptureMoves(allMoves);
            if (captureMoves.length > 0) {
                console.log(`✅ Level_1 (CAPTURE): Found ${captureMoves.length} capture moves`);
                return this.selectRandomMove(captureMoves);
            }

            // Étape 3: MENACE - Déplacer une pièce vers une case menacante
            const threatMoves = this.getThreatMoves(allMoves);
            if (threatMoves.length > 0) {
                console.log(`✅ Level_1 (MENACE): Found ${threatMoves.length} threat moves`);
                return this.selectRandomMove(threatMoves);
            }

            // Étape 4: OPTIMISATION - Mouvement normal (développement)
            console.log(`✅ Level_1 (OPTIMIZATION): Using random move from ${allMoves.length} moves`);
            return this.selectRandomMove(allMoves);

        } catch (error) {
            console.error('❌ Level_1 Error:', error);
            return null;
        }
    }

    // Obtenir tous les coups valides
    getAllValidMoves() {
        const game = window.chessGame;
        const validMoves = [];
        
        if (!game || !game.core || !game.core.moveValidator) {
            console.log('❌ Level_1 getAllValidMoves: Game components not available');
            return validMoves;
        }
        
        const currentPlayer = game.gameState.currentPlayer;
        console.log(`🔍 Level_1: Looking for moves for ${currentPlayer}`);

        // Parcourir toutes les pièces du joueur actuel
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const square = game.board.getSquare(fromRow, fromCol);
                
                if (square && square.piece && square.piece.color === currentPlayer) {
                    // Obtenir les mouvements possibles pour cette pièce
                    const possibleMoves = game.core.moveValidator.getPossibleMoves(
                        square.piece, 
                        fromRow, 
                        fromCol
                    );
                    
                    // Ajouter tous les mouvements possibles
                    possibleMoves.forEach(move => {
                        validMoves.push({
                            fromRow: fromRow,
                            fromCol: fromCol,
                            toRow: move.row,
                            toCol: move.col,
                            piece: square.piece,
                            moveData: move,
                            targetPiece: game.board.getSquare(move.row, move.col)?.piece
                        });
                    });
                }
            }
        }

        console.log(`📊 Level_1: Found ${validMoves.length} total valid moves`);
        return validMoves;
    }

    // Filtrer les coups qui mettent en échec
    getCheckMoves(moves) {
        const game = window.chessGame;
        const checkMoves = [];
        
        if (!game || !game.core) return checkMoves;
        
        moves.forEach(move => {
            // Pour simplifier, on vérifie si c'est une capture de roi (échec)
            if (move.targetPiece && move.targetPiece.type === 'king') {
                checkMoves.push(move);
                console.log(`♚ CHECK move (capture roi): ${move.fromRow},${move.fromCol} -> ${move.toRow},${move.toCol}`);
            }
            // Note: Dans une vraie implémentation, il faudrait simuler le coup
        });
        
        return checkMoves;
    }

    // Filtrer les coups de capture
    getCaptureMoves(moves) {
        return moves.filter(move => {
            const isCapture = move.targetPiece && move.targetPiece.color !== move.piece.color;
            if (isCapture) {
                console.log(`⚔️ CAPTURE move: ${move.piece.type} takes ${move.targetPiece.type} at ${move.toRow},${move.toCol}`);
            }
            return isCapture;
        });
    }

    // Filtrer les coups de menace (se déplacer vers des cases "intéressantes")
    getThreatMoves(moves) {
        const threatMoves = [];
        const game = window.chessGame;
        
        if (!game || !game.core) return threatMoves;
        
        moves.forEach(move => {
            // Éviter les mouvements dangereux (case attaquée par l'adversaire)
            if (this.isSquareAttacked(move.toRow, move.toCol, move.piece.color === 'white' ? 'black' : 'white')) {
                return; // Éviter cette case
            }
            
            // Se déplacer vers le centre (bon pour le développement)
            const isCenterMove = this.isCenterSquare(move.toRow, move.toCol);
            
            // Se déplacer avec une pièce mineure (cavalier, fou) en premier
            const isMinorPiece = move.piece.type === 'knight' || move.piece.type === 'bishop';
            
            // Prioriser les mouvements vers le centre ou avec des pièces mineures
            if (isCenterMove || isMinorPiece) {
                threatMoves.push(move);
                const reason = isCenterMove ? "center" : "minor piece";
                console.log(`🎯 THREAT move (${reason}): ${move.piece.type} to ${move.toRow},${move.toCol}`);
            }
        });
        
        return threatMoves;
    }

    // Vérifier si une case est attaquée par l'adversaire
    isSquareAttacked(row, col, attackerColor) {
        const game = window.chessGame;
        if (!game || !game.core) return false;
        
        // Vérifier toutes les pièces adverses
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = game.board.getSquare(r, c);
                if (square && square.piece && square.piece.color === attackerColor) {
                    const possibleMoves = game.core.moveValidator.getPossibleMoves(square.piece, r, c);
                    
                    // Vérifier si cette pièce peut attaquer la case cible
                    const canAttack = possibleMoves.some(move => 
                        move.row === row && move.col === col
                    );
                    
                    if (canAttack) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    // Vérifier si une case est au centre de l'échiquier
    isCenterSquare(row, col) {
        // Cases centrales (d4, d5, e4, e5)
        const centerRows = [3, 4]; // 0-indexed
        const centerCols = [3, 4]; // 0-indexed
        
        return centerRows.includes(row) && centerCols.includes(col);
    }

    // Sélectionner un coup aléatoire
    selectRandomMove(moves) {
        if (!moves || moves.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * moves.length);
        const selectedMove = moves[randomIndex];
        
        console.log(`🎲 Level_1: Selected ${selectedMove.piece.type} from ${selectedMove.fromRow},${selectedMove.fromCol} to ${selectedMove.toRow},${selectedMove.toCol}`);
        if (selectedMove.targetPiece) {
            console.log(`🎯 Target: ${selectedMove.targetPiece.color} ${selectedMove.targetPiece.type}`);
        }
        
        return selectedMove;
    }
}

// Exporter la classe
window.Level_1 = Level_1;