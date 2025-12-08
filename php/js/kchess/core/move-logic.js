// core/move-logic.js - Logique de déplacement des pièces
class MoveLogic {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('core/move-logic.js loaded');
        }
    }

    constructor(chessGame) {
        this.chessGame = chessGame;
        
        if (this.constructor.consoleLog) {
            console.log('♟️ [MoveLogic] Logique de déplacement initialisée');
            console.log('♟️ [MoveLogic] ChessGame:', chessGame);
        }
    }

    movePiece(fromSquare, toSquare, promotionType = null) {
        if (this.constructor.consoleLog) {
            console.log('\n♟️ [MoveLogic] === DÉPLACEMENT DE PIÈCE ===');
            console.log(`♟️ [MoveLogic] Départ: [${fromSquare.row},${fromSquare.col}]`);
            console.log(`♟️ [MoveLogic] Arrivée: [${toSquare.row},${toSquare.col}]`);
            
            const fromPiece = fromSquare.piece;
            const toPiece = toSquare.piece;
            
            console.log(`♟️ [MoveLogic] Pièce source: ${fromPiece?.type || '?'} (${fromPiece?.color || '?'})`);
            console.log(`♟️ [MoveLogic] Pièce cible: ${toPiece?.type || 'Aucune'} (${toPiece?.color || '?'})`);
            
            if (promotionType) {
                console.log(`♟️ [MoveLogic] Promotion en: ${promotionType}`);
            }
        }
        
        const fromPiece = fromSquare.piece;
        const toPiece = toSquare.piece;
        
        // Sauvegarder l'état avant le mouvement
        const previousFEN = FENGenerator.generateFEN(this.chessGame.gameState, this.chessGame.board);
        
        if (this.constructor.consoleLog) {
            console.log(`📄 [MoveLogic] FEN avant mouvement: ${previousFEN.substring(0, 50)}...`);
        }
        
        // Déplacer la pièce
        if (this.constructor.consoleLog) {
            console.log('♟️ [MoveLogic] Déplacement de la pièce sur le plateau...');
        }
        
        this.chessGame.board.movePiece(fromSquare, toSquare);
        
        if (this.constructor.consoleLog) {
            console.log('✅ [MoveLogic] Pièce déplacée avec succès');
        }
        
        // Gérer la promotion
        if (promotionType) {
            if (this.constructor.consoleLog) {
                console.log(`♟️ [MoveLogic] Promotion du pion en ${promotionType}...`);
            }
            
            this.chessGame.promotionManager.promotePawn(toSquare, promotionType);
            
            if (this.constructor.consoleLog) {
                console.log(`✅ [MoveLogic] Promotion effectuée: ${fromPiece.type} → ${promotionType}`);
            }
        }
        
        // Mettre à jour le compteur des 50 coups
        this.updateHalfMoveClock(fromPiece, toPiece, toSquare);
        
        // Sauvegarder le mouvement dans l'historique
        const moveData = {
            from: { row: fromSquare.row, col: fromSquare.col },
            to: { row: toSquare.row, col: toSquare.col },
            piece: fromPiece.type,
            color: fromPiece.color,
            captured: toPiece ? toPiece.type : null,
            fen: previousFEN
        };
        
        this.chessGame.gameState.moveHistory.push(moveData);
        
        if (this.constructor.consoleLog) {
            console.log(`📝 [MoveLogic] Mouvement enregistré dans l'historique:`);
            console.log(`   • Mouvement #${this.chessGame.gameState.moveHistory.length}`);
            console.log(`   • Pièce: ${moveData.piece} (${moveData.color})`);
            console.log(`   • Capture: ${moveData.captured || 'Aucune'}`);
            console.log(`   • Départ: [${moveData.from.row},${moveData.from.col}]`);
            console.log(`   • Arrivée: [${moveData.to.row},${moveData.to.col}]`);
        }
        
        // Changer le tour
        const oldTurn = this.chessGame.gameState.currentTurn;
        this.chessGame.gameState.currentTurn = this.chessGame.gameState.currentTurn === 'white' ? 'black' : 'white';
        
        if (this.constructor.consoleLog) {
            console.log(`🔄 [MoveLogic] Changement de tour: ${oldTurn} → ${this.chessGame.gameState.currentTurn}`);
        }
        
        this.chessGame.clearSelection();
        
        if (this.constructor.consoleLog) {
            console.log('🧹 [MoveLogic] Sélection nettoyée');
        }
        
        this.chessGame.gameStatusManager.updateGameStatus();
        
        if (this.constructor.consoleLog) {
            console.log('✅ [MoveLogic] === DÉPLACEMENT TERMINÉ ===\n');
        }
    }

    updateHalfMoveClock(fromPiece, toPiece, toSquare) {
        if (this.constructor.consoleLog) {
            console.log('🕒 [MoveLogic] Mise à jour horloge 50 coups...');
            console.log(`   • Pièce source: ${fromPiece.type}`);
            console.log(`   • Capture possible: ${toPiece ? 'OUI' : 'NON'}`);
            console.log(`   • Horloge avant: ${this.chessGame.gameState.halfMoveClock}`);
        }
        
        // Réinitialiser si coup de pion ou capture
        const isCapture = toPiece && toPiece.color !== fromPiece.color;
        const isPawnMove = fromPiece.type === 'pawn';
        
        if (isCapture || isPawnMove) {
            const reason = isCapture ? 'capture' : 'mouvement pion';
            this.chessGame.gameState.halfMoveClock = 0;
            
            if (this.constructor.consoleLog) {
                console.log(`🔄 [MoveLogic] Horloge réinitialisée à 0 (${reason})`);
            }
        } else {
            this.chessGame.gameState.halfMoveClock++;
            
            if (this.constructor.consoleLog) {
                console.log(`📈 [MoveLogic] Horloge incrémentée: ${this.chessGame.gameState.halfMoveClock}`);
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`🕒 [MoveLogic] Horloge après: ${this.chessGame.gameState.halfMoveClock}/50`);
        }
    }
    
    // NOUVELLE MÉTHODE : Simuler un mouvement (pour vérification)
    simulateMove(fromSquare, toSquare) {
        if (this.constructor.consoleLog) {
            console.log('\n🧪 [MoveLogic] === SIMULATION DE MOUVEMENT ===');
            console.log(`🧪 [MoveLogic] Simulation: [${fromSquare.row},${fromSquare.col}] → [${toSquare.row},${toSquare.col}]`);
        }
        
        const fromPiece = fromSquare.piece;
        const toPiece = toSquare.piece;
        
        if (!fromPiece) {
            if (this.constructor.consoleLog) {
                console.log('❌ [MoveLogic] Simulation: aucune pièce au départ');
            }
            return null;
        }
        
        // Vérifier si le mouvement est valide
        const possibleMoves = this.chessGame.moveValidator.getPossibleMoves(fromPiece, fromSquare.row, fromSquare.col);
        const isValid = possibleMoves.some(move => 
            move.row === toSquare.row && move.col === toSquare.col
        );
        
        if (this.constructor.consoleLog) {
            console.log(`🧪 [MoveLogic] Mouvement ${isValid ? 'VALIDE' : 'INVALIDE'}`);
            if (toPiece) {
                console.log(`🧪 [MoveLogic] Capture possible: ${toPiece.color !== fromPiece.color ? 'OUI' : 'NON (même couleur)'}`);
            }
            console.log(`🧪 [MoveLogic] Mouvements possibles: ${possibleMoves.length}`);
        }
        
        return {
            isValid: isValid,
            fromPiece: fromPiece,
            toPiece: toPiece,
            isCapture: toPiece && toPiece.color !== fromPiece.color,
            possibleMoves: possibleMoves.length
        };
    }
    
    // NOUVELLE MÉTHODE : Obtenir un résumé du mouvement
    getMoveSummary(moveData) {
        const summary = {
            from: `${String.fromCharCode(97 + moveData.from.col)}${8 - moveData.from.row}`,
            to: `${String.fromCharCode(97 + moveData.to.col)}${8 - moveData.to.row}`,
            piece: moveData.piece,
            color: moveData.color,
            captured: moveData.captured,
            moveNumber: Math.floor(moveData.moveHistoryIndex / 2) + 1,
            playerMove: moveData.color === 'white' ? 'Blancs' : 'Noirs'
        };
        
        if (this.constructor.consoleLog) {
            console.log('📋 [MoveLogic] Résumé du mouvement:', summary);
        }
        
        return summary;
    }
}

// Initialisation statique
MoveLogic.init();