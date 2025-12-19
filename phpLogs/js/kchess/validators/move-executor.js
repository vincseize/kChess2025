// validators/move-executor.js - Version utilisant la configuration JSON comme priorité
if (typeof MoveExecutor !== 'undefined') {
    console.warn('⚠️ MoveExecutor existe déjà. Vérifiez les doublons dans les imports.');
} else {

class MoveExecutor {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = true; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('🚀 validators/move-executor.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('🚀 MoveExecutor: Mode silencieux activé (debug désactivé dans config)');
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
                    console.log('🚀 Configuration chargée depuis window.appConfig');
                }
            } else if (window.chessConfig) {
                // Configuration secondaire: window.chessConfig (pour compatibilité)
                if (window.chessConfig.debug !== undefined) {
                    this.consoleLog = window.chessConfig.debug;
                }
                
                if (this.consoleLog) {
                    console.log('🚀 Configuration chargée depuis window.chessConfig (legacy)');
                }
            } else {
                // Fallback: valeurs par défaut
                if (this.consoleLog) {
                    console.log('🚀 Configuration: valeurs par défaut utilisées');
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
            console.log('🔧 MoveExecutor initialisé');
            console.log(`  - Game: ${game ? '✓' : '✗'}`);
            console.log(`  - Configuration: console_log = ${this.constructor.consoleLog}`);
        }
    }

    prepareMoveExecution(toRow, toCol) {
        const selectedPiece = { ...this.game.selectedPiece };
        const fromSquare = this.game.board.getSquare(selectedPiece.row, selectedPiece.col);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        const move = this.game.possibleMoves.find(m => m.row === toRow && m.col === toCol);
        
        if (!fromSquare || !toSquare) {
            if (this.constructor.consoleLog) {
                console.error('❌ Cases source/destination non trouvées');
            }
            return null;
        }

        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        if (!pieceElement) {
            if (this.constructor.consoleLog) {
                console.error('❌ Élément pièce non trouvé');
            }
            return null;
        }
        
        if (this.constructor.consoleLog) {
            console.log(`\n🎯 Préparation exécution mouvement:`);
            console.log(`  - Pièce: ${selectedPiece.piece.color} ${selectedPiece.piece.type}`);
            console.log(`  - De: [${selectedPiece.row},${selectedPiece.col}]`);
            console.log(`  - Vers: [${toRow},${toCol}]`);
            console.log(`  - Move trouvé: ${move ? '✓' : '✗'}`);
            if (move) {
                console.log(`  - Type de mouvement: ${move.type || 'standard'}`);
                if (move.isDoublePush) console.log(`  - Double poussée: OUI`);
                if (move.isPromotion) console.log(`  - Promotion: OUI`);
            }
        }
        
        return { selectedPiece, fromSquare, toSquare, move, pieceElement };
    }

    executeNormalMove(fromSquare, toSquare, selectedPiece, move, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n🚀 EXÉCUTION MOUVEMENT NORMAL:`);
            console.log(`  ${selectedPiece.piece.color} ${selectedPiece.piece.type} de [${selectedPiece.row},${selectedPiece.col}] vers [${toRow},${toCol}]`);
        }
        
        const pieceElement = fromSquare.element.querySelector('.chess-piece');
        this.transferPieceElement(pieceElement, fromSquare, toSquare, selectedPiece.piece);
        
        this.updateGameStateForMove(selectedPiece.piece, selectedPiece.row, selectedPiece.col, toRow, toCol);

        // Gestion promotion
        if (move && this.shouldPromote(move, selectedPiece.piece)) {
            if (this.constructor.consoleLog) {
                console.log(`👑 DÉTECTION PROMOTION`);
            }
            this.handlePromotion(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement);
            return;
        }
        
        this.finalizeNormalMove(toRow, toCol, move, selectedPiece);
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

    shouldPromote(move, piece) {
        const shouldPromote = move && this.game.promotionManager.checkPromotion(move, piece);
        
        if (this.constructor.consoleLog) {
            console.log(`  🔍 Vérification promotion: ${shouldPromote ? 'OUI' : 'NON'}`);
            if (shouldPromote) {
                console.log(`    ↳ Condition de promotion remplie pour ${piece.color} ${piece.type}`);
            }
        }
        
        return shouldPromote;
    }

    handlePromotion(toRow, toCol, selectedPiece, move, fromSquare, toSquare, pieceElement) {
        this.game.moveHandler.isPromoting = true;
        this.game.clearSelection();
        
        if (this.constructor.consoleLog) {
            console.log(`🎭 Démarrage processus de promotion`);
        }
        
        this.game.promotionManager.handlePromotion(
            toRow, toCol, selectedPiece.piece.color,
            (promotedPieceType) => {
                if (promotedPieceType) {
                    if (this.constructor.consoleLog) {
                        console.log(`✅ Promotion choisie: ${promotedPieceType}`);
                    }
                    this.finalizePromotion(toRow, toCol, promotedPieceType, move, selectedPiece);
                } else {
                    if (this.constructor.consoleLog) {
                        console.log(`❌ Promotion annulée`);
                    }
                    this.undoPromotionMove(fromSquare, toSquare, pieceElement, selectedPiece);
                }
                this.game.moveHandler.isPromoting = false;
            }
        );
    }

    finalizeNormalMove(toRow, toCol, move, selectedPiece) {
        if (this.constructor.consoleLog) {
            console.log(`\n✅ Mouvement normal finalisé`);
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
                console.log(`🎯 Cible en passant définie pour prochain coup`);
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
        
        if (this.constructor.consoleLog) {
            console.log(`  🔄 Joueur actuel changé: ${this.game.gameState.currentPlayer}`);
            console.log(`  📝 Coup enregistré dans l'historique`);
        }
    }

    finalizePromotion(toRow, toCol, promotedPieceType, move, selectedPiece) {
        const toSquare = this.game.board.getSquare(toRow, toCol);
        if (!toSquare) return;
        
        const newPiece = {
            type: promotedPieceType,
            color: selectedPiece.piece.color
        };
        
        toSquare.piece = newPiece;
        toSquare.element.innerHTML = '';
        const newPieceElement = this.createPieceElement(newPiece);
        toSquare.element.appendChild(newPieceElement);

        if (this.constructor.consoleLog) {
            console.log(`👑 Promotion finalisée: ${selectedPiece.piece.color} ${selectedPiece.piece.type} → ${promotedPieceType}`);
        }

        this.game.gameState.recordMove(
            selectedPiece.row, 
            selectedPiece.col, 
            toRow, 
            toCol,
            selectedPiece.piece,
            promotedPieceType
        );

        this.game.gameState.switchPlayer();
        this.game.clearSelection();
        this.game.updateUI();
        
        if (this.constructor.consoleLog) {
            console.log(`  🔄 Joueur actuel changé après promotion: ${this.game.gameState.currentPlayer}`);
        }
    }

    undoPromotionMove(fromSquare, toSquare, pieceElement, selectedPiece) {
        toSquare.element.innerHTML = '';
        toSquare.piece = null;
        
        fromSquare.element.appendChild(pieceElement);
        fromSquare.piece = selectedPiece.piece;
        
        this.game.clearSelection();
        
        if (this.constructor.consoleLog) {
            console.log(`↩️ Promotion annulée - retour à la position initiale`);
        }
    }

    updateGameStateForMove(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n🔄 Mise à jour gameState pour ${piece.color} ${piece.type}`);
        }
        
        if (!this.game.gameState.hasKingMoved) {
            this.game.gameState.hasKingMoved = { white: false, black: false };
        }
        
        if (!this.game.gameState.hasRookMoved) {
            this.game.gameState.hasRookMoved = {
                white: { kingside: false, queenside: false },
                black: { kingside: false, queenside: false }
            };
        }

        if (piece.type === 'king') {
            this.game.gameState.hasKingMoved[piece.color] = true;
            
            if (this.constructor.consoleLog) {
                console.log(`  👑 Roi ${piece.color} marqué comme ayant bougé`);
            }
        }
        
        if (piece.type === 'rook') {
            const rookState = this.game.gameState.hasRookMoved[piece.color];
            
            if (fromCol === 7) {
                rookState.kingside = true;
                
                if (this.constructor.consoleLog) {
                    console.log(`  🏰 Tour côté roi ${piece.color} marquée comme ayant bougé`);
                }
            } else if (fromCol === 0) {
                rookState.queenside = true;
                
                if (this.constructor.consoleLog) {
                    console.log(`  🏰 Tour côté dame ${piece.color} marquée comme ayant bougé`);
                }
            }
        }
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
                console.log(`  🏰 Roques désactivés pour ${color} (roi a bougé)`);
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
                    console.log(`  🏰 Roque côté roi désactivé pour ${color}`);
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
                    console.log(`  🏰 Roque côté dame désactivé pour ${color}`);
                }
            }
        }
    }

    createPieceElement(piece) {
        const pieceElement = document.createElement('div');
        pieceElement.className = `chess-piece ${piece.color}`;
        
        const prefix = piece.color === 'white' ? 'w' : 'b';
        const pieceCodes = {
            'king': 'K',
            'queen': 'Q',
            'rook': 'R',
            'bishop': 'B',
            'knight': 'N',
            'pawn': 'P'
        };
        
        const img = document.createElement('img');
        img.src = `img/chesspieces/wikipedia/${prefix}${pieceCodes[piece.type]}.png`;
        img.alt = `${piece.type} ${piece.color}`;
        img.className = 'chess-piece-img';
        
        pieceElement.appendChild(img);
        pieceElement.setAttribute('data-piece', piece.type);
        pieceElement.setAttribute('data-color', piece.color);
        
        return pieceElement;
    }

    // NOUVELLE MÉTHODE : Afficher le résumé de l'exécution
    displayExecutionSummary(selectedPiece, toRow, toCol, move) {
        if (!this.constructor.consoleLog) return;
        
        console.log(`\n📊 RÉSUMÉ EXÉCUTION MOUVEMENT:`);
        console.log(`  Pièce: ${selectedPiece.piece.color} ${selectedPiece.piece.type}`);
        console.log(`  De: [${selectedPiece.row},${selectedPiece.col}]`);
        console.log(`  Vers: [${toRow},${toCol}]`);
        console.log(`  Type: ${move ? move.type || 'standard' : 'inconnu'}`);
        
        if (move) {
            console.log(`  Spécial: ${move.isDoublePush ? 'Double poussée' : move.isPromotion ? 'Promotion' : 'Normal'}`);
        }
        
        console.log(`  Cible en passant: ${this.game.moveValidator.enPassantTarget ? 
            `[${this.game.moveValidator.enPassantTarget.row},${this.game.moveValidator.enPassantTarget.col}]` : 'Aucune'}`);
        
        console.log(`  Joueur suivant: ${this.game.gameState.currentPlayer}`);
    }

    // NOUVELLE MÉTHODE : Vérifier l'état du MoveExecutor
    checkState() {
        if (!this.constructor.consoleLog) return;
        
        console.log(`\n🔍 ÉTAT MOVE EXECUTOR:`);
        console.log(`  Game connecté: ${this.game ? '✓' : '✗'}`);
        console.log(`  Configuration: console_log = ${this.constructor.consoleLog}`);
        
        if (this.game) {
            console.log(`  GameState: ${this.game.gameState ? '✓' : '✗'}`);
            console.log(`  MoveValidator: ${this.game.moveValidator ? '✓' : '✗'}`);
            console.log(`  PromotionManager: ${this.game.promotionManager ? '✓' : '✗'}`);
        }
    }
}

// Initialisation statique
MoveExecutor.init();

window.MoveExecutor = MoveExecutor;

} // Fin du if de protection