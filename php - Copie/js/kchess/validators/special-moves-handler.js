// validators/special-moves-handler.js - Version utilisant la configuration JSON comme priorité
if (typeof SpecialMovesHandler !== 'undefined') {
    console.warn('⚠️ SpecialMovesHandler existe déjà. Vérifiez les doublons dans les imports.');
} else {

class SpecialMovesHandler {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('⚡ validators/special-moves-handler.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('⚡ SpecialMovesHandler: Mode silencieux activé (debug désactivé dans config)');
        }
    }
    
    // Méthode pour charger la configuration
    static loadConfig() {
        try {
            if (window.appConfig && window.appConfig.chess_engine) {
                // Configuration prioritaire: window.appConfig
                if (window.appConfig.chess_engine.console_log !== undefined) {
                    this.consoleLog = window.appConfig.chess_engine.console_log;
                }
                
                if (this.consoleLog) {
                    console.log('⚡ Configuration chargée depuis window.appConfig');
                }
            } else if (window.chessConfig) {
                // Configuration secondaire: window.chessConfig (pour compatibilité)
                if (window.chessConfig.debug !== undefined) {
                    this.consoleLog = window.chessConfig.debug;
                }
                
                if (this.consoleLog) {
                    console.log('⚡ Configuration chargée depuis window.chessConfig (legacy)');
                }
            } else {
                // Fallback: valeurs par défaut
                if (this.consoleLog) {
                    console.log('⚡ Configuration: valeurs par défaut utilisées');
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de la configuration:', error);
            // Garder les valeurs par défaut en cas d'erreur
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig && window.appConfig.chess_engine) {
            return 'window.appConfig';
        } else if (window.chessConfig) {
            return 'window.chessConfig (legacy)';
        } else {
            return 'valeur par défaut';
        }
    }

    constructor(game) {
        this.game = game;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 SpecialMovesHandler initialisé');
            console.log(`  - Game: ${game ? '✓' : '✗'}`);
            console.log(`  - Configuration: console_log = ${this.constructor.consoleLog}`);
        }
        
        // Statistiques des mouvements spéciaux
        this.stats = {
            castles: { kingside: 0, queenside: 0 },
            enPassant: 0,
            promotions: 0
        };
    }

    handleSpecialMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol) {
        if (!move) {
            if (this.constructor.consoleLog) {
                console.log(`❌ Pas de mouvement à traiter`);
            }
            return false;
        }

        if (this.constructor.consoleLog) {
            console.log(`\n⚡ Vérification mouvement spécial: ${move.type}${move.special ? ' (' + move.special + ')' : ''}`);
        }

        if (move.special === 'castle') {
            if (this.constructor.consoleLog) {
                console.log(`🏰 ROQUE DÉTECTÉ: ${move.type}`);
            }
            this.executeCastleMove(move, selectedPiece);
            this.stats.castles[move.type.includes('kingside') ? 'kingside' : 'queenside']++;
            return true;
        }

        if (move.type === 'en-passant') {
            if (this.constructor.consoleLog) {
                console.log(`🎯 PRISE EN PASSANT DÉTECTÉE`);
            }
            this.executeEnPassantMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol);
            this.stats.enPassant++;
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
            console.log(`  Type: ${move.type.includes('kingside') ? 'Petit roque' : 'Grand roque'}`);
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
        const isKingside = move.type.includes('kingside');
        
        if (this.constructor.consoleLog) {
            console.log(`  📐 Configuration roque ${color}:`);
            console.log(`    - Rangée: ${row} (${color === 'white' ? 'haut' : 'bas'})`);
            console.log(`    - Type: ${isKingside ? 'côté roi (petit roque)' : 'côté dame (grand roque)'}`);
            console.log(`    - Notation: ${isKingside ? '0-0' : '0-0-0'}`);
        }

        if (isKingside) {
            if (this.constructor.consoleLog) {
                console.log(`  🔄 Déplacements petit roque (0-0):`);
                console.log(`    - Roi: [${fromRow},4] → [${row},6]`);
                console.log(`    - Tour: [${row},7] → [${row},5]`);
            }
            
            this.movePiece(row, 4, row, 6); // Roi e1→g1 / e8→g8
            this.movePiece(row, 7, row, 5); // Tour h1→f1 / h8→f8
        } else {
            if (this.constructor.consoleLog) {
                console.log(`  🔄 Déplacements grand roque (0-0-0):`);
                console.log(`    - Roi: [${fromRow},4] → [${row},2]`);
                console.log(`    - Tour: [${row},0] → [${row},3]`);
            }
            
            this.movePiece(row, 4, row, 2); // Roi e1→c1 / e8→c8
            this.movePiece(row, 0, row, 3); // Tour a1→d1 / a8→d8
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
        
        if (this.constructor.consoleLog) {
            const pieceType = fromSquare.piece ? fromSquare.piece.type : 'inconnue';
            console.log(`    ↳ Pièce déplacée: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
            console.log(`      Type: ${pieceType}`);
        }
    }

    finalizeCastleMove(move, selectedPiece) {
        if (this.constructor.consoleLog) {
            console.log(`\n🏰 FINALISATION ROQUE ${move.type}:`);
            console.log(`  Joueur: ${selectedPiece.piece.color}`);
            console.log(`  Position finale roi: [${move.row},${move.col}]`);
            console.log(`  Notation: ${move.type.includes('kingside') ? '0-0' : '0-0-0'}`);
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
        
        if (this.constructor.consoleLog) {
            console.log(`  🔄 Joueur changé: ${this.game.gameState.currentPlayer}`);
        }
    }

    transferPieceElement(pieceElement, fromSquare, toSquare, piece) {
        toSquare.element.innerHTML = '';
        toSquare.element.appendChild(pieceElement);
        toSquare.piece = piece;
        fromSquare.piece = null;
        
        if (this.constructor.consoleLog) {
            console.log(`  🔄 Pièce transférée de ${fromSquare.element.className} vers ${toSquare.element.className}`);
        }
    }

    finalizeNormalMove(toRow, toCol, move, selectedPiece) {
        if (this.constructor.consoleLog) {
            console.log(`\n✅ Finalisation mouvement normal`);
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
        
        console.log(`\n📊 STATISTIQUES MOUVEMENTS SPÉCIAUX (cette session):`);
        
        const totalCastles = this.stats.castles.kingside + this.stats.castles.queenside;
        
        console.log(`  🏰 Roques: ${totalCastles}`);
        console.log(`    - Petit roque (0-0): ${this.stats.castles.kingside}`);
        console.log(`    - Grand roque (0-0-0): ${this.stats.castles.queenside}`);
        console.log(`  🎯 Prises en passant: ${this.stats.enPassant}`);
        console.log(`  👑 Promotions: ${this.stats.promotions}`);
        
        const totalSpecial = totalCastles + this.stats.enPassant + this.stats.promotions;
        console.log(`  📈 Total mouvements spéciaux: ${totalSpecial}`);
        
        // Statistiques de la partie
        const moveHistory = this.game.gameState?.moveHistory || [];
        if (moveHistory.length > 0) {
            console.log(`\n📊 STATISTIQUES PARTIE ACTUELLE:`);
            
            let gameCastleCount = 0;
            let gameEnPassantCount = 0;
            let gamePromotionCount = 0;
            
            moveHistory.forEach(move => {
                if (move.type?.includes('castle')) gameCastleCount++;
                if (move.type === 'en-passant') gameEnPassantCount++;
                if (move.promotion) gamePromotionCount++;
            });
            
            console.log(`  - Roques: ${gameCastleCount}`);
            console.log(`  - Prises en passant: ${gameEnPassantCount}`);
            console.log(`  - Promotions: ${gamePromotionCount}`);
            console.log(`  - Total mouvements: ${moveHistory.length}`);
            
            if (moveHistory.length > 0) {
                const specialPercentage = ((gameCastleCount + gameEnPassantCount + gamePromotionCount) / moveHistory.length * 100).toFixed(1);
                console.log(`  - Pourcentage mouvements spéciaux: ${specialPercentage}%`);
            }
        }
    }

    // NOUVELLE MÉTHODE : Incrémenter les statistiques de promotion
    incrementPromotionCount() {
        this.stats.promotions++;
        
        if (this.constructor.consoleLog) {
            console.log(`📈 Promotion comptabilisée: ${this.stats.promotions} promotion(s) cette session`);
        }
    }

    // NOUVELLE MÉTHODE : Obtenir un résumé des statistiques
    getStatsSummary() {
        const totalCastles = this.stats.castles.kingside + this.stats.castles.queenside;
        const totalSpecial = totalCastles + this.stats.enPassant + this.stats.promotions;
        
        return {
            castles: { ...this.stats.castles, total: totalCastles },
            enPassant: this.stats.enPassant,
            promotions: this.stats.promotions,
            totalSpecial: totalSpecial
        };
    }

    // NOUVELLE MÉTHODE : Réinitialiser les statistiques
    resetStats() {
        if (this.constructor.consoleLog) {
            console.log(`🔄 Réinitialisation statistiques mouvements spéciaux`);
        }
        
        this.stats = {
            castles: { kingside: 0, queenside: 0 },
            enPassant: 0,
            promotions: 0
        };
        
        if (this.constructor.consoleLog) {
            console.log(`✅ Statistiques réinitialisées`);
        }
    }
}

// Initialisation statique
SpecialMovesHandler.init();

window.SpecialMovesHandler = SpecialMovesHandler;

} // Fin du if de protection