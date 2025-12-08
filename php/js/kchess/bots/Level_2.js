// bots/Level_2.js - Version CORRIGÉE (sans Promise)
class Level_2 {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('bots/Level_2.js loaded');
        }
    }

    constructor() {
        this.name = "Bot Level 1 (CCMO)";
        this.level = 1;
        
        if (this.constructor.consoleLog) {
            console.log(`🤖 [Level_2] Bot Level 1 initialisé - "CCMO Strategy Bot"`);
            console.log(`🎯 [Level_2] Stratégie: Check → Capture → Menace → Optimisation`);
        }
    }

    // Méthode principale pour obtenir un coup - NE DOIT PAS retourner de Promise!
    getMove(fen) {
        if (this.constructor.consoleLog) {
            console.log(`\n🎲 [Level_2] === DÉBUT CALCUL DU COUP ===`);
            console.log(`📋 [Level_2] FEN reçu: ${fen.substring(0, 50)}...`);
            console.log(`🔄 [Level_2] Application de la stratégie CCMO`);
        }

        try {
            const game = window.chessGame;
            if (!game || !game.core || !game.core.moveValidator) {
                if (this.constructor.consoleLog) {
                    console.log(`❌ [Level_2] Jeu ou moteur de mouvement non disponible`);
                }
                return null; // Retourne null, PAS une Promise!
            }

            // Obtenir tous les coups valides
            const allMoves = this.getAllValidMoves();
            
            if (allMoves.length === 0) {
                if (this.constructor.consoleLog) {
                    console.log(`🚫 [Level_2] Aucun coup valide disponible!`);
                }
                return null;
            }

            if (this.constructor.consoleLog) {
                console.log(`📊 [Level_2] Base de coups: ${allMoves.length} mouvement(s) légal(aux)`);
            }

            // Étape 1: CHECK - Rechercher un coup qui met en échec
            const checkMoves = this.getCheckMoves(allMoves);
            if (checkMoves.length > 0) {
                if (this.constructor.consoleLog) {
                    console.log(`✅ [Level_2] CHECK: ${checkMoves.length} coup(s) d'échec trouvé(s)`);
                }
                const selected = this.selectRandomMove(checkMoves);
                this.logMoveSelection(selected, 'CHECK');
                return selected;
            }

            // Étape 2: CAPTURE - Rechercher un coup de capture
            const captureMoves = this.getCaptureMoves(allMoves);
            if (captureMoves.length > 0) {
                if (this.constructor.consoleLog) {
                    console.log(`✅ [Level_2] CAPTURE: ${captureMoves.length} coup(s) de capture trouvé(s)`);
                }
                const selected = this.selectRandomMove(captureMoves);
                this.logMoveSelection(selected, 'CAPTURE');
                return selected;
            }

            // Étape 3: MENACE - Déplacer une pièce vers une case menacante
            const threatMoves = this.getThreatMoves(allMoves);
            if (threatMoves.length > 0) {
                if (this.constructor.consoleLog) {
                    console.log(`✅ [Level_2] MENACE: ${threatMoves.length} coup(s) de menace trouvé(s)`);
                }
                const selected = this.selectRandomMove(threatMoves);
                this.logMoveSelection(selected, 'MENACE');
                return selected;
            }

            // Étape 4: OPTIMISATION - Mouvement normal (développement)
            if (this.constructor.consoleLog) {
                console.log(`✅ [Level_2] OPTIMISATION: Utilisation d'un coup aléatoire`);
            }
            const selected = this.selectRandomMove(allMoves);
            this.logMoveSelection(selected, 'OPTIMISATION');
            return selected;

        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [Level_2] ERREUR lors du calcul du coup: ${error.message}`);
                console.error('Level_2 error:', error);
            }
            return null;
        }
    }

    // Obtenir tous les coups valides
    getAllValidMoves() {
        const game = window.chessGame;
        const validMoves = [];
        
        if (!game || !game.core || !game.core.moveValidator) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [Level_2] getAllValidMoves: Composants du jeu non disponibles`);
            }
            return validMoves;
        }
        
        const currentPlayer = game.gameState.currentPlayer;
        
        if (this.constructor.consoleLog) {
            console.log(`🔍 [Level_2] Recherche des coups pour ${currentPlayer === 'white' ? 'Blancs' : 'Noirs'}`);
        }

        // Parcourir toutes les pièces du joueur actuel
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const square = game.board.getSquare(fromRow, fromCol);
                
                if (square && square.piece && square.piece.color === currentPlayer) {
                    const piece = square.piece;
                    
                    if (this.constructor.consoleLog) {
                        console.log(`  👉 [Level_2] Pièce ${piece.type.charAt(0).toUpperCase()} en [${fromRow},${fromCol}]`);
                    }
                    
                    const possibleMoves = game.core.moveValidator.getPossibleMoves(
                        piece, 
                        fromRow, 
                        fromCol
                    );
                    
                    if (this.constructor.consoleLog && possibleMoves.length > 0) {
                        console.log(`    📍 ${possibleMoves.length} mouvement(s) possible(s)`);
                    }
                    
                    possibleMoves.forEach(move => {
                        const targetSquare = game.board.getSquare(move.row, move.col);
                        const targetPiece = targetSquare?.piece;
                        
                        validMoves.push({
                            fromRow: fromRow,
                            fromCol: fromCol,
                            toRow: move.row,
                            toCol: move.col,
                            piece: piece,
                            moveData: move,
                            targetPiece: targetPiece,
                            isCapture: targetPiece && targetPiece.color !== piece.color
                        });
                        
                        if (this.constructor.consoleLog) {
                            const captureInfo = targetPiece ? 
                                ` → capture ${targetPiece.type}` : 
                                '';
                            console.log(`      → [${fromRow},${fromCol}] → [${move.row},${move.col}]${captureInfo}`);
                        }
                    });
                }
            }
        }

        if (this.constructor.consoleLog) {
            console.log(`📊 [Level_2] Total coups valides: ${validMoves.length}`);
        }
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
                if (this.constructor.consoleLog) {
                    console.log(`♚ [Level_2] MOVE CHECK: ${move.piece.type} → roi adverse en [${move.toRow},${move.toCol}]`);
                }
            }
            // Note: Dans une vraie implémentation, il faudrait simuler le coup
        });
        
        if (this.constructor.consoleLog) {
            console.log(`📋 [Level_2] Coups CHECK identifiés: ${checkMoves.length}`);
        }
        
        return checkMoves;
    }

    // Filtrer les coups de capture
    getCaptureMoves(moves) {
        const captureMoves = moves.filter(move => {
            const isCapture = move.targetPiece && move.targetPiece.color !== move.piece.color;
            if (isCapture && this.constructor.consoleLog) {
                console.log(`⚔️ [Level_2] MOVE CAPTURE: ${move.piece.type} → ${move.targetPiece.type} en [${move.toRow},${move.toCol}]`);
            }
            return isCapture;
        });
        
        if (this.constructor.consoleLog) {
            console.log(`📋 [Level_2] Coups CAPTURE identifiés: ${captureMoves.length}`);
        }
        
        return captureMoves;
    }

    // Filtrer les coups de menace (se déplacer vers des cases "intéressantes")
    getThreatMoves(moves) {
        const threatMoves = [];
        const game = window.chessGame;
        
        if (!game || !game.core) return threatMoves;
        
        moves.forEach(move => {
            // Éviter les mouvements dangereux (case attaquée par l'adversaire)
            const opponentColor = move.piece.color === 'white' ? 'black' : 'white';
            if (this.isSquareAttacked(move.toRow, move.toCol, opponentColor)) {
                if (this.constructor.consoleLog) {
                    console.log(`⚠️ [Level_2] Case [${move.toRow},${move.toCol}] attaquée - mouvement évité`);
                }
                return; // Éviter cette case
            }
            
            // Se déplacer vers le centre (bon pour le développement)
            const isCenterMove = this.isCenterSquare(move.toRow, move.toCol);
            
            // Se déplacer avec une pièce mineure (cavalier, fou) en premier
            const isMinorPiece = move.piece.type === 'knight' || move.piece.type === 'bishop';
            
            // Prioriser les mouvements vers le centre ou avec des pièces mineures
            if (isCenterMove || isMinorPiece) {
                threatMoves.push(move);
                const reason = isCenterMove ? "centre" : "pièce mineure";
                if (this.constructor.consoleLog) {
                    console.log(`🎯 [Level_2] MOVE MENACE (${reason}): ${move.piece.type} → [${move.toRow},${move.toCol}]`);
                }
            }
        });
        
        if (this.constructor.consoleLog) {
            console.log(`📋 [Level_2] Coups MENACE identifiés: ${threatMoves.length}`);
        }
        
        return threatMoves;
    }

    // Vérifier si une case est attaquée par l'adversaire
    isSquareAttacked(row, col, attackerColor) {
        const game = window.chessGame;
        if (!game || !game.core) return false;
        
        if (this.constructor.consoleLog) {
            console.log(`  🔍 [Level_2] Vérification case [${row},${col}] attaquée par ${attackerColor}`);
        }
        
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
                    
                    if (canAttack && this.constructor.consoleLog) {
                        console.log(`    ⚠️ [Level_2] Case attaquée par ${square.piece.type} en [${r},${c}]`);
                        return true;
                    }
                }
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`    ✅ [Level_2] Case [${row},${col}] non attaquée`);
        }
        
        return false;
    }

    // Vérifier si une case est au centre de l'échiquier
    isCenterSquare(row, col) {
        // Cases centrales (d4, d5, e4, e5)
        const centerRows = [3, 4]; // 0-indexed
        const centerCols = [3, 4]; // 0-indexed
        
        const isCenter = centerRows.includes(row) && centerCols.includes(col);
        
        if (this.constructor.consoleLog) {
            console.log(`    🎯 [Level_2] Case [${row},${col}] ${isCenter ? 'est au centre' : 'n\'est pas au centre'}`);
        }
        
        return isCenter;
    }

    // Sélectionner un coup aléatoire
    selectRandomMove(moves) {
        if (!moves || moves.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * moves.length);
        const selectedMove = moves[randomIndex];
        
        if (this.constructor.consoleLog) {
            console.log(`🎲 [Level_2] Sélection aléatoire: index ${randomIndex + 1}/${moves.length}`);
        }
        
        return selectedMove;
    }

    // Logger la sélection du coup
    logMoveSelection(move, strategyType) {
        if (!move) return;
        
        if (this.constructor.consoleLog) {
            console.log(`\n✅ [Level_2] === COUP SÉLECTIONNÉ ===`);
            console.log(`📝 Stratégie: ${strategyType}`);
            console.log(`♟️ Pièce: ${move.piece.type} (${move.piece.color})`);
            console.log(`📍 Départ: [${move.fromRow},${move.fromCol}]`);
            console.log(`📍 Arrivée: [${move.toRow},${move.toCol}]`);
            
            // Convertir en notation échecs
            const colToLetter = col => String.fromCharCode(97 + col);
            const rowToNumber = row => 8 - row;
            console.log(`📝 Notation: ${colToLetter(move.fromCol)}${rowToNumber(move.fromRow)} → ${colToLetter(move.toCol)}${rowToNumber(move.toRow)}`);
            
            if (move.targetPiece) {
                console.log(`🎯 Capture: ${move.targetPiece.type} (${move.targetPiece.color})`);
            }
            
            console.log(`✅ [Level_2] === FIN CALCUL DU COUP ===\n`);
        }
    }

    // NOUVELLE MÉTHODE : Obtenir des statistiques sur les coups
    getMoveStatistics(moves) {
        const stats = {
            total: moves.length,
            captures: moves.filter(m => m.targetPiece && m.targetPiece.color !== m.piece.color).length,
            centerMoves: moves.filter(m => this.isCenterSquare(m.toRow, m.toCol)).length,
            minorPieceMoves: moves.filter(m => m.piece.type === 'knight' || m.piece.type === 'bishop').length
        };
        
        if (this.constructor.consoleLog) {
            console.log(`📈 [Level_2] Statistiques des coups:`, stats);
        }
        
        return stats;
    }
}

// Initialisation statique
Level_2.init();

// Exporter la classe
window.Level_2 = Level_2;