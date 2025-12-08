// validators/validator-interface.js - Interface avec les validateurs de mouvements
class ValidatorInterface {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('validators/validator-interface.js loaded');
        }
    }

    constructor(game) {
        this.game = game;
        
        if (this.constructor.consoleLog) {
            console.log('🔧 ValidatorInterface initialisé');
            console.log(`  - Game: ${game ? '✓' : '✗'}`);
            console.log(`  - MoveValidator: ${game?.moveValidator ? '✓' : '✗'}`);
            console.log(`  - Board: ${game?.board ? '✓' : '✗'}`);
        }
    }

    getPossibleMoves(piece, row, col) {
        if (this.constructor.consoleLog) {
            console.log(`\n🔍 INTERFACE: Recherche mouvements pour ${piece.color} ${piece.type} en [${row},${col}]`);
        }
        
        const moves = this.game.moveValidator.getPossibleMoves(piece, row, col);
        
        if (this.constructor.consoleLog) {
            console.log(`  ✅ Résultat: ${moves.length} mouvement(s) possible(s)`);
            
            if (moves.length > 0) {
                console.log(`  Détail des mouvements:`);
                moves.forEach((move, index) => {
                    const typeIcon = move.type === 'capture' ? '⚔️' : 
                                   move.type === 'en-passant' ? '🎯' : 
                                   move.special === 'castle' ? '🏰' : '➡️';
                    const specialInfo = move.special ? ` (${move.special})` : '';
                    console.log(`    ${index + 1}. [${move.row},${move.col}] ${typeIcon} ${move.type}${specialInfo}`);
                });
            }
        }
        
        return moves;
    }

    validateMove(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n✅ INTERFACE: Validation mouvement`);
            console.log(`  Pièce: ${piece.color} ${piece.type}`);
            console.log(`  De: [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        const isValid = possibleMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
        
        if (this.constructor.consoleLog) {
            console.log(`  Résultat validation: ${isValid ? '✓ VALIDE' : '✗ INVALIDE'}`);
            if (!isValid) {
                console.log(`  Raison: mouvement non présent dans ${possibleMoves.length} mouvements possibles`);
            }
        }
        
        return isValid;
    }

    isCheckAfterMove(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n♔ INTERFACE: Vérification échec après mouvement`);
            console.log(`  Simulation: ${piece.color} ${piece.type} de [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        // Simulation du mouvement pour vérifier l'échec
        const fromSquare = this.game.board.getSquare(fromRow, fromCol);
        const toSquare = this.game.board.getSquare(toRow, toCol);
        
        if (!fromSquare || !toSquare) {
            if (this.constructor.consoleLog) {
                console.error(`❌ Cases non trouvées:`);
                console.error(`  - From [${fromRow},${fromCol}]: ${fromSquare ? '✓' : '✗'}`);
                console.error(`  - To [${toRow},${toCol}]: ${toSquare ? '✓' : '✗'}`);
            }
            return false;
        }

        // Sauvegarder l'état
        const originalToPiece = toSquare.piece;
        const originalFromPiece = fromSquare.piece;
        
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`  📋 État original:`);
            console.log(`    - From: ${originalFromPiece ? originalFromPiece.color + ' ' + originalFromPiece.type : 'vide'}`);
            console.log(`    - To: ${originalToPiece ? originalToPiece.color + ' ' + originalToPiece.type : 'vide'}`);
        }

        // Simuler le mouvement
        toSquare.piece = fromSquare.piece;
        fromSquare.piece = null;
        
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`  🔄 État simulé:`);
            console.log(`    - From: ${fromSquare.piece ? fromSquare.piece.color + ' ' + fromSquare.piece.type : 'vide'}`);
            console.log(`    - To: ${toSquare.piece ? toSquare.piece.color + ' ' + toSquare.piece.type : 'vide'}`);
        }

        // Vérifier l'échec
        const isInCheck = this.game.moveValidator.isKingInCheck(piece.color);
        
        if (this.constructor.consoleLog) {
            console.log(`  🛡️ Résultat échec: ${isInCheck ? '✓ ROI EN ÉCHEC' : '✗ roi en sécurité'}`);
        }

        // Restaurer l'état
        fromSquare.piece = originalFromPiece;
        toSquare.piece = originalToPiece;
        
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`  🔙 État restauré`);
        }
        
        return isInCheck;
    }

    getMoveType(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n📝 INTERFACE: Identification type de mouvement`);
            console.log(`  Pièce: ${piece.color} ${piece.type} de [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);
        const moveType = move ? move.type : null;
        
        if (this.constructor.consoleLog) {
            if (moveType) {
                const typeDescriptions = {
                    'move': 'déplacement simple',
                    'capture': 'prise',
                    'en-passant': 'prise en passant',
                    'castle-kingside': 'roque côté roi',
                    'castle-queenside': 'roque côté dame'
                };
                const description = typeDescriptions[moveType] || moveType;
                console.log(`  ✅ Type identifié: ${moveType} (${description})`);
                
                if (move.special) {
                    console.log(`  🎯 Mouvement spécial: ${move.special}`);
                }
                if (move.isDoublePush) {
                    console.log(`  🎯 Double poussée de pion`);
                }
                if (move.isPromotion) {
                    console.log(`  👑 Promotion possible`);
                }
            } else {
                console.log(`  ❌ Type non identifié (mouvement invalide)`);
            }
        }
        
        return moveType;
    }

    isSpecialMove(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log(`\n🎯 INTERFACE: Vérification mouvement spécial`);
            console.log(`  Pièce: ${piece.color} ${piece.type} de [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);
        const isSpecial = move ? (move.special || move.type === 'en-passant') : false;
        
        if (this.constructor.consoleLog) {
            console.log(`  Résultat: ${isSpecial ? '✓ MOUVEMENT SPÉCIAL' : '✗ mouvement normal'}`);
            if (isSpecial && move) {
                if (move.special === 'castle') {
                    console.log(`  🏰 Type: Roque (${move.type})`);
                } else if (move.type === 'en-passant') {
                    console.log(`  🎯 Type: Prise en passant`);
                }
            }
        }
        
        return isSpecial;
    }

    // NOUVELLE MÉTHODE : Vérification rapide de validité
    quickValidate(piece, fromRow, fromCol, toRow, toCol) {
        if (this.constructor.consoleLog && this.constructor.consoleLog) {
            console.log(`  ↳ Validation rapide pour [${fromRow},${fromCol}] → [${toRow},${toCol}]`);
        }
        
        // Validation basique des coordonnées
        if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) {
            if (this.constructor.consoleLog && this.constructor.consoleLog) {
                console.log(`    ❌ Coordonnées hors plateau`);
            }
            return false;
        }
        
        // Même case
        if (fromRow === toRow && fromCol === toCol) {
            if (this.constructor.consoleLog && this.constructor.consoleLog) {
                console.log(`    ❌ Même case (déplacement nul)`);
            }
            return false;
        }
        
        return true;
    }

    // NOUVELLE MÉTHODE : Obtention des informations détaillées du mouvement
    getMoveDetails(piece, fromRow, fromCol, toRow, toCol) {
        if (!this.constructor.consoleLog) return null;
        
        console.log(`\n📋 INTERFACE: Informations détaillées du mouvement`);
        
        const possibleMoves = this.getPossibleMoves(piece, fromRow, fromCol);
        const move = possibleMoves.find(m => m.row === toRow && m.col === toCol);
        
        if (!move) {
            console.log(`  ❌ Mouvement non valide`);
            return null;
        }
        
        const details = {
            isValid: true,
            type: move.type,
            special: move.special,
            coordinates: {
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol }
            },
            piece: {
                type: piece.type,
                color: piece.color
            },
            flags: {
                isDoublePush: move.isDoublePush || false,
                isPromotion: move.isPromotion || false,
                isCapture: move.type === 'capture' || move.type === 'en-passant',
                isSpecial: !!(move.special || move.type === 'en-passant')
            }
        };
        
        console.log(`  ✅ Mouvement valide - Détails:`);
        console.log(`    - Type: ${details.type}`);
        console.log(`    - Spécial: ${details.special || 'non'}`);
        console.log(`    - Double poussée: ${details.flags.isDoublePush ? 'oui' : 'non'}`);
        console.log(`    - Promotion: ${details.flags.isPromotion ? 'oui' : 'non'}`);
        console.log(`    - Capture: ${details.flags.isCapture ? 'oui' : 'non'}`);
        
        return details;
    }
}

// Initialisation statique
ValidatorInterface.init();

window.ValidatorInterface = ValidatorInterface;