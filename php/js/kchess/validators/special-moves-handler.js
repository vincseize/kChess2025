// validators/special-moves-handler.js - Gestion des mouvements spéciaux
class SpecialMovesHandler {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('validators/special-moves-handler.js loaded');
        }
    }

    constructor(game) {
        this.game = game;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 SpecialMovesHandler initialisé');
            console.log(`  - Game: ${game ? '✓' : '✗'}`);
        }
    }

    handleSpecialMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol) {
        if (!move) return false;

        if (this.constructor.consoleLog) {
            console.log(`⚡ Vérification mouvement spécial: ${move.type}${move.special ? ' (' + move.special + ')' : ''}`);
        }

        if (move.special === 'castle') {
            if (this.constructor.consoleLog) {
                console.log(`🏰 ROQUE DÉTECTÉ: ${move.type}`);
            }
            this.executeCastleMove(move, selectedPiece);
            return true;
        }

        if (move.type === 'en-passant') {
            if (this.constructor.consoleLog) {
                console.log(`🎯 PRISE EN PASSANT DÉTECTÉE`);
            }
            this.executeEnPassantMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol);
            return true;
        }

        if (this.constructor.consoleLog) {
            console.log(`  ❌ Pas un mouvement spécial`);
        }
        
        return false;
    }

    executeCastleMove(move, selectedPiece) {
        if (this.constructor.consoleLog) {
            console.log(`\n🏰 EXÉCUTION ROQUE: ${move.type} pour ${selectedPiece.piece.color}`);
            console.log(`  Position roi: [${selectedPiece.row},${selectedPiece.col}] → [${move.row},${move.col}]`);
        }
        
        this.game.moveHandler.updateGameStateForMove(selectedPiece.piece, selectedPiece.row, selectedPiece.col, move.row, move.col);
        this.executeCastle(move, selectedPiece.piece, selectedPiece.row, selectedPiece.col);
        this.finalizeCastleMove(move, selectedPiece);
    }

    executeEnPassantMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n🎯 EXÉCUTION PRISE EN PASSANT:`);
            console.log(`  Pion: ${selectedPiece.piece.color} de [${selectedPiece.row},${selectedPiece.col}] → [${toRow},${toCol}]`);
            console.log(`  Pion capturé: [${move.capturedPawn.row},${move.capturedPawn.col}]`);
        }
        
        this.game.moveValidator.executeEnPassant(move);
        
        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        this.transferPieceElement(pieceElement, fromSquare, toSquare, selectedPiece.piece);
        
        this.game.moveHandler.updateGameStateForMove(selectedPiece.piece, selectedPiece.row, selectedPiece.col, toRow, toCol);
        this.finalizeNormalMove(toRow, toCol, move, selectedPiece);
    }

    executeCastle(move, king, fromRow, fromCol) {
        const color = king.color;
        const row = color === 'white' ? 7 : 0;
        
        if (this.constructor.consoleLog) {
            console.log(`  📐 Configuration roque ${color}:`);
            console.log(`    - Rangée: ${row} (${color === 'white' ? 'bas' : 'haut'})`);
            console.log(`    - Type: ${move.type.includes('kingside') ? 'côté roi (petit roque)' : 'côté dame (grand roque)'}`);
        }

        if (move.type === 'castle-kingside') {
            if (this.constructor.consoleLog) {
                console.log(`  🔄 Déplacements petit roque:`);
                console.log(`    - Roi: [${fromRow},${fromCol}] → [${row},6]`);
                console.log(`    - Tour: [${row},7] → [${row},5]`);
            }
            
            this.movePiece(fromRow, fromCol, row, 6); // Roi e1→g1 / e8→g8
            this.movePiece(row, 7, row, 5);           // Tour h1→f1 / h8→f8
        } else if (move.type === 'castle-queenside') {
            if (this.constructor.consoleLog) {
                console.log(`  🔄 Déplacements grand roque:`);
                console.log(`    - Roi: [${fromRow},${fromCol}] → [${row},2]`);
                console.log(`    - Tour: [${row},0] → [${row},3]`);
            }
            
            this.movePiece(fromRow, fromCol, row, 2); // Roi e1→c1 / e8→c8
            this.movePiece(row, 0, row, 3);           // Tour a1→d1 / a8→d8
        }
        
        if (this.constructor.consoleLog) {
            console.log(`  ✅ Roque ${move.type} exécuté avec succès`);
        }
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        const fromSquare = this.game.board.getSquare(fromRow, fromCol);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        
        if (!fromSquare || !toSquare || !fromSquare.piece) {
            if (this.constructor.consoleLog) {
                console.error(`❌ Impossible de déplacer la pièce pour le roque`);
                console.error(`  From: [${fromRow},${fromCol}] ${fromSquare ? '✓' : '✗'}`);
                console.error(`  To: [${toRow},${toCol}] ${toSquare ? '✓' : '✗'}`);
                console.error(`  Pièce: ${fromSquare?.piece ? '✓' : '✗'}`);
            }
            return;
        }

        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        if (!pieceElement) {
            if (this.constructor.consoleLog) {
                console.error(`❌ Élément pièce non trouvé en [${fromRow},${fromCol}]`);
            }
            return;
        }

        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(pieceElement);
        toSquare.piece = fromSquare.piece;
        fromSquare.piece = null;
        
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`    ↳ Pièce déplacée: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
            console.log(`      Type: ${fromSquare.piece?.type || '?'}`);
        }
    }

    finalizeCastleMove(move, selectedPiece) {
        if (this.constructor.consoleLog) {
            console.log(`\n🏰 FINALISATION ROQUE ${move.type}:`);
            console.log(`  Joueur: ${selectedPiece.piece.color}`);
            console.log(`  Position finale roi: [${move.row},${move.col}]`);
        }
        
        this.game.gameState.recordMove(
            selectedPiece.row, 
            selectedPiece.col, 
            move.row, 
            move.col,
            selectedPiece.piece,
            null,
            move.type
        );

        if (!this.game.gameState.hasKingMoved) {
            this.game.gameState.hasKingMoved = { white: false, black: false };
        }
        this.game.gameState.hasKingMoved[selectedPiece.piece.color] = true;
        
        if (this.constructor.consoleLog) {
            console.log(`  ✅ Roi ${selectedPiece.piece.color} marqué comme ayant bougé`);
            console.log(`  🔒 Roques désactivés pour ${selectedPiece.piece.color}`);
        }

        this.game.gameState.switchPlayer();
        this.game.clearSelection();
        this.game.updateUI();
    }

    transferPieceElement(pieceElement, fromSquare, toSquare, piece) {
        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(pieceElement);
        toSquare.piece = piece;
        fromSquare.piece = null;
        
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`  🔄 Pièce transférée de ${fromSquare.element.className} vers ${toSquare.element.className}`);
        }
    }

    finalizeNormalMove(toRow, toCol, move, selectedPiece) {
        if (this.constructor.consoleLog) {
            console.log(`✅ Finalisation mouvement normal`);
        }
        
        if (move) {
            this.game.moveValidator.updateEnPassantTarget(
                { 
                    from: { row: selectedPiece.row, col: selectedPiece.col },
                    to: { row: toRow, col: toCol },
                    isDoublePush: move.isDoublePush
                },
                selectedPiece.piece
            );
            
            if (this.constructor.consoleLog && move.isDoublePush) {
                console.log(`  🎯 Cible en passant définie pour prochain coup`);
            }
        }

        this.updateCastlingRights(selectedPiece, toRow, toCol);

        this.game.gameState.recordMove(
            selectedPiece.row, 
            selectedPiece.col, 
            toRow, 
            toCol,
            selectedPiece.piece
        );

        this.game.gameState.switchPlayer();
        this.game.clearSelection();
        this.game.updateUI();
    }

    updateCastlingRights(selectedPiece, toRow, toCol) {
        const piece = selectedPiece.piece;
        const color = piece.color;

        if (piece.type === 'king') {
            if (!this.game.gameState.castlingRights[color]) {
                this.game.gameState.castlingRights[color] = {
                    kingside: false,
                    queenside: false
                };
            }
            this.game.gameState.castlingRights[color] = {
                kingside: false,
                queenside: false
            };
            
            if (this.constructor.consoleLog) {
                console.log(`  🔒 Roques désactivés pour ${color} (roi a bougé)`);
            }
        }

        if (piece.type === 'rook') {
            const startRow = color === 'white' ? 7 : 0;
            
            if (selectedPiece.col === 7 && selectedPiece.row === startRow) {
                if (!this.game.gameState.castlingRights[color]) {
                    this.game.gameState.castlingRights[color] = {
                        kingside: true,
                        queenside: true
                    };
                }
                this.game.gameState.castlingRights[color].kingside = false;
                
                if (this.constructor.consoleLog) {
                    console.log(`  🔒 Roque côté roi désactivé pour ${color}`);
                }
            }
            
            if (selectedPiece.col === 0 && selectedPiece.row === startRow) {
                if (!this.game.gameState.castlingRights[color]) {
                    this.game.gameState.castlingRights[color] = {
                        kingside: true,
                        queenside: true
                    };
                }
                this.game.gameState.castlingRights[color].queenside = false;
                
                if (this.constructor.consoleLog) {
                    console.log(`  🔒 Roque côté dame désactivé pour ${color}`);
                }
            }
        }
    }

    // NOUVELLE MÉTHODE : Log des statistiques des mouvements spéciaux
    logSpecialMoveStats() {
        if (!this.constructor.consoleLog) return;
        
        console.log(`\n📊 STATISTIQUES MOUVEMENTS SPÉCIAUX:`);
        
        const moveHistory = this.game.gameState?.moveHistory || [];
        let castleCount = 0;
        let enPassantCount = 0;
        let promotionCount = 0;
        
        moveHistory.forEach(move => {
            if (move.type?.includes('castle')) castleCount++;
            if (move.type === 'en-passant') enPassantCount++;
            if (move.promotion) promotionCount++;
        });
        
        console.log(`  - Roques: ${castleCount}`);
        console.log(`  - Prises en passant: ${enPassantCount}`);
        console.log(`  - Promotions: ${promotionCount}`);
        console.log(`  - Total mouvements: ${moveHistory.length}`);
        
        if (moveHistory.length > 0) {
            const specialPercentage = ((castleCount + enPassantCount + promotionCount) / moveHistory.length * 100).toFixed(1);
            console.log(`  - Pourcentage mouvements spéciaux: ${specialPercentage}%`);
        }
    }
}

// Initialisation statique
SpecialMovesHandler.init();

window.SpecialMovesHandler = SpecialMovesHandler;