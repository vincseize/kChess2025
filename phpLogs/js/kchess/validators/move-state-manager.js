// validators/move-state-manager.js - Version utilisant la configuration JSON comme priorité
if (typeof MoveStateManager !== 'undefined') {
    console.warn('⚠️ MoveStateManager existe déjà. Vérifiez les doublons dans les imports.');
} else {

class MoveStateManager {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('📋 validators/move-state-manager.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('📋 MoveStateManager: Mode silencieux activé (debug désactivé dans config)');
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
                    console.log('📋 Configuration chargée depuis window.appConfig');
                }
            } else if (window.chessConfig) {
                // Configuration secondaire: window.chessConfig (pour compatibilité)
                if (window.chessConfig.debug !== undefined) {
                    this.consoleLog = window.chessConfig.debug;
                }
                
                if (this.consoleLog) {
                    console.log('📋 Configuration chargée depuis window.chessConfig (legacy)');
                }
            } else {
                // Fallback: valeurs par défaut
                if (this.consoleLog) {
                    console.log('📋 Configuration: valeurs par défaut utilisées');
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
            console.log('🔧 MoveStateManager initialisé');
            console.log(`  - Game: ${game ? '✓' : '✗'}`);
            console.log(`  - Configuration: console_log = ${this.constructor.consoleLog}`);
        }
    }

    handlePieceSelection(row, col, square) {
        if (square.piece && square.piece.color === this.game.gameState.currentPlayer) {
            this.clearSelection();
            square.element.classList.add('selected');
            this.setSelection(row, col, square.piece);
            
            if (this.constructor.consoleLog) {
                console.log(`\n✅ Pièce sélectionnée: ${square.piece.color} ${square.piece.type} en [${row},${col}]`);
                console.log(`  Joueur: ${this.game.gameState.currentPlayer}`);
                console.log(`  Couleur valide: ${square.piece.color === this.game.gameState.currentPlayer ? '✓' : '✗'}`);
            }
            
            if (this.constructor.consoleLog) {
                console.log(`  Mouvements possibles: ${this.game.possibleMoves.length}`);
                if (this.game.possibleMoves.length > 0) {
                    this.game.possibleMoves.forEach((move, index) => {
                        const typeIcon = move.type === 'capture' ? '⚔️' : 
                                       move.type === 'en-passant' ? '🎯' : 
                                       move.special === 'castle' ? '🏰' : '➡️';
                        console.log(`    ${index + 1}. [${move.row},${move.col}] ${typeIcon} (${move.type}${move.special ? ', ' + move.special : ''})`);
                    });
                }
            }
        } else if (this.constructor.consoleLog) {
            console.log(`\n❌ Sélection impossible:`);
            console.log(`  - Pièce présente: ${square.piece ? '✓' : '✗'}`);
            if (square.piece) {
                console.log(`  - Couleur: ${square.piece.color} vs Joueur: ${this.game.gameState.currentPlayer}`);
                console.log(`  - Accès autorisé: ${square.piece.color === this.game.gameState.currentPlayer ? '✓' : '✗'}`);
            }
        }
    }

    setSelection(row, col, piece, possibleMoves = null) {
        this.game.selectedPiece = { row, col, piece };
        
        if (possibleMoves) {
            this.game.possibleMoves = possibleMoves;
            
            if (this.constructor.consoleLog) {
                console.log(`📋 Sélection avec mouvements fournis: ${possibleMoves.length} mouvements`);
            }
        } else {
            this.game.possibleMoves = this.game.moveValidator.getPossibleMoves(piece, row, col);
            
            if (this.constructor.consoleLog) {
                console.log(`📋 Sélection avec validation: ${this.game.possibleMoves.length} mouvements générés`);
            }
        }
        
        this.highlightPossibleMoves();
    }

    isMovePossible(toRow, toCol) {
        const isPossible = this.game.possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
        
        if (this.constructor.consoleLog) {
            console.log(`  ↳ Vérification mouvement vers [${toRow},${toCol}]: ${isPossible ? '✓ possible' : '✗ impossible'}`);
            
            if (isPossible) {
                const move = this.game.possibleMoves.find(m => m.row === toRow && m.col === toCol);
                if (move) {
                    const typeDesc = move.special === 'castle' ? '🏰 Roque' : 
                                   move.type === 'en-passant' ? '🎯 En passant' : 
                                   move.type === 'capture' ? '⚔️ Capture' : 'Déplacement';
                    console.log(`    Type: ${typeDesc}`);
                }
            }
        }
        
        return isPossible;
    }

    handleInvalidMove(toRow, toCol, toSquare) {
        if (this.constructor.consoleLog) {
            console.log(`\n❌ Mouvement non valide vers [${toRow},${toCol}]`);
        }
        
        if (this.shouldReselectOnInvalid(toSquare)) {
            if (this.constructor.consoleLog) {
                console.log(`  🔄 Resélection automatique (mobile)`);
            }
            this.handlePieceSelection(toRow, toCol, toSquare);
        } else {
            if (this.constructor.consoleLog) {
                console.log(`  🧹 Désélection simple`);
            }
            this.clearSelection();
        }
    }

    shouldReselectOnInvalid(toSquare) {
        const shouldReselect = window.innerWidth <= 768 && 
               toSquare.piece && 
               toSquare.piece.color === this.game.gameState.currentPlayer;
               
        if (this.constructor.consoleLog) {
            console.log(`  ↳ Resélection sur mobile: ${shouldReselect ? '✓ OUI' : '✗ NON'}`);
            console.log(`    - Mobile: ${window.innerWidth <= 768} (${window.innerWidth}px)`);
            console.log(`    - Pièce présente: ${toSquare.piece ? '✓' : '✗'}`);
            if (toSquare.piece) {
                console.log(`    - Couleur valide: ${toSquare.piece.color === this.game.gameState.currentPlayer ? '✓' : '✗'}`);
            }
        }
        
        return shouldReselect;
    }

    highlightPossibleMoves() {
        if (this.constructor.consoleLog) {
            console.log(`\n💡 Mise en surbrillance des ${this.game.possibleMoves.length} mouvements possibles`);
        }
        
        // Réinitialiser tous les styles
        this.game.board.squares.forEach(square => {
            square.element.classList.remove(
                'selected', 
                'possible-move', 
                'possible-capture', 
                'possible-en-passant', 
                'possible-castle'
            );
        });
        
        // Compter par type
        let moveCount = 0;
        let captureCount = 0;
        let enPassantCount = 0;
        let castleCount = 0;
        
        // Appliquer les styles selon le type de mouvement
        this.game.possibleMoves.forEach(move => {
            const square = this.game.board.getSquare(move.row, move.col);
            if (square) {
                if (move.special === 'castle') {
                    square.element.classList.add('possible-castle');
                    castleCount++;
                    
                    if (this.constructor.consoleLog) {
                        console.log(`  🏰 Roque possible: [${move.row},${move.col}]`);
                    }
                } else if (move.type === 'en-passant') {
                    square.element.classList.add('possible-en-passant');
                    enPassantCount++;
                    
                    if (this.constructor.consoleLog) {
                        console.log(`  🎯 En passant possible: [${move.row},${move.col}]`);
                    }
                } else if (move.type === 'capture') {
                    square.element.classList.add('possible-capture');
                    captureCount++;
                    
                    if (this.constructor.consoleLog) {
                        console.log(`  ⚔️ Capture possible: [${move.row},${move.col}]`);
                    }
                } else {
                    square.element.classList.add('possible-move');
                    moveCount++;
                }
            }
        });
        
        if (this.constructor.consoleLog) {
            console.log(`  📊 Statistiques de surbrillance:`);
            console.log(`    - Déplacements: ${moveCount} 📍`);
            console.log(`    - Captures: ${captureCount} ⚔️`);
            console.log(`    - En passant: ${enPassantCount} 🎯`);
            console.log(`    - Roques: ${castleCount} 🏰`);
            console.log(`    - TOTAL: ${this.game.possibleMoves.length} ✅`);
        }
    }

    clearSelection() {
        if (this.constructor.consoleLog) {
            const hadSelection = !!this.game.selectedPiece;
            console.log(`\n🧹 Nettoyage sélection: ${hadSelection ? 'avec sélection précédente' : 'aucune sélection'}`);
            
            if (hadSelection && this.game.selectedPiece.piece) {
                console.log(`  Pièce précédente: ${this.game.selectedPiece.piece.color} ${this.game.selectedPiece.piece.type}`);
                console.log(`  Position: [${this.game.selectedPiece.row},${this.game.selectedPiece.col}]`);
                console.log(`  Mouvements précédents: ${this.game.possibleMoves.length}`);
            }
        }
        
        this.game.board.squares.forEach(square => {
            square.element.classList.remove(
                'selected', 
                'possible-move', 
                'possible-capture', 
                'possible-en-passant', 
                'possible-castle'
            );
        });
        
        this.game.selectedPiece = null;
        this.game.possibleMoves = [];
        
        if (this.constructor.consoleLog) {
            console.log(`  ✅ Sélection effacée`);
            console.log(`  ✅ Styles de surbrillance retirés`);
        }
    }

    // NOUVELLE MÉTHODE : Vérifier l'état actuel
    checkCurrentState() {
        if (!this.constructor.consoleLog) return;
        
        console.log(`\n🔍 ÉTAT ACTUEL MOVE STATE MANAGER:`);
        console.log(`  Pièce sélectionnée: ${this.game.selectedPiece ? '✓ OUI' : '✗ NON'}`);
        
        if (this.game.selectedPiece) {
            console.log(`    Type: ${this.game.selectedPiece.piece.color} ${this.game.selectedPiece.piece.type}`);
            console.log(`    Position: [${this.game.selectedPiece.row},${this.game.selectedPiece.col}]`);
        }
        
        console.log(`  Mouvements possibles: ${this.game.possibleMoves.length}`);
        console.log(`  Joueur actuel: ${this.game.gameState.currentPlayer}`);
        console.log(`  Jeu actif: ${this.game.gameState.gameActive ? '✓ OUI' : '✗ NON'}`);
    }

    // NOUVELLE MÉTHODE : Afficher les détails de la sélection
    displaySelectionDetails() {
        if (!this.constructor.consoleLog) return;
        
        console.log(`\n📊 DÉTAILS DE LA SÉLECTION:`);
        
        if (this.game.selectedPiece) {
            console.log(`  Pièce: ${this.game.selectedPiece.piece.color} ${this.game.selectedPiece.piece.type}`);
            console.log(`  Position: [${this.game.selectedPiece.row},${this.game.selectedPiece.col}]`);
            console.log(`  Cases éclairées: ${this.game.possibleMoves.length}`);
            
            // Détail des mouvements par type
            const movesByType = {
                'move': [],
                'capture': [],
                'en-passant': [],
                'castle': []
            };
            
            this.game.possibleMoves.forEach(move => {
                if (move.special === 'castle') {
                    movesByType.castle.push(move);
                } else if (move.type === 'en-passant') {
                    movesByType['en-passant'].push(move);
                } else if (move.type === 'capture') {
                    movesByType.capture.push(move);
                } else {
                    movesByType.move.push(move);
                }
            });
            
            console.log(`  Répartition:`);
            console.log(`    - Déplacements: ${movesByType.move.length} 📍`);
            console.log(`    - Captures: ${movesByType.capture.length} ⚔️`);
            console.log(`    - En passant: ${movesByType['en-passant'].length} 🎯`);
            console.log(`    - Roques: ${movesByType.castle.length} 🏰`);
        } else {
            console.log(`  Aucune pièce sélectionnée`);
        }
    }
}

// Initialisation statique
MoveStateManager.init();

window.MoveStateManager = MoveStateManager;

} // Fin du if de protection