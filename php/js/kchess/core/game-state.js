// core/game-state.js - Gestion de l'état du jeu et historique AVEC ROQUE
class GameState {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('core/game-state.js loaded');
        }
    }

    constructor() {
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.boardFlipped = false;
        this.gameStartTime = new Date();
        
        if (this.constructor.consoleLog) {
            console.log('\n📋 [GameState] === INITIALISATION ===');
            console.log('📋 [GameState] Création du nouvel état de jeu');
            console.log(`📋 [GameState] Joueur initial: ${this.currentPlayer}`);
            console.log(`📋 [GameState] Plateau retourné: ${this.boardFlipped}`);
        }
        
        // DROITS DE ROQUE - NOUVEAU
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        
        if (this.constructor.consoleLog) {
            console.log('👑 [GameState] Droits de roque initialisés:');
            console.log('   • Blancs: O-O ✓, O-O-O ✓');
            console.log('   • Noirs: O-O ✓, O-O-O ✓');
        }
        
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        
        if (this.constructor.consoleLog) {
            console.log(`📋 [GameState] En passant: ${this.enPassantTarget || 'Aucun'}`);
            console.log(`📋 [GameState] Horloge 50 coups: ${this.halfMoveClock}`);
            console.log(`📋 [GameState] Numéro coup: ${this.fullMoveNumber}`);
            console.log('✅ [GameState] === INITIALISATION TERMINÉE ===\n');
        }
    }

    recordMove(fromRow, fromCol, toRow, toCol, pieceInfo, promotion = null, specialMove = null) {
        if (this.constructor.consoleLog) {
            console.log('\n📝 [GameState] === ENREGISTREMENT DU COUP ===');
            console.log(`📝 [GameState] Départ: [${fromRow},${fromCol}] → Arrivée: [${toRow},${toCol}]`);
            console.log(`📝 [GameState] Pièce: ${pieceInfo?.type} (${pieceInfo?.color})`);
            if (promotion) console.log(`📝 [GameState] Promotion en: ${promotion}`);
            if (specialMove) console.log(`📝 [GameState] Mouvement spécial: ${specialMove}`);
        }
        
        if (!pieceInfo) {
            if (this.constructor.consoleLog) {
                console.error('❌ [GameState] Informations de pièce manquantes pour l\'enregistrement');
            }
            return null;
        }
        
        const moveNumber = Math.floor(this.moveHistory.length / 2) + 1;
        let notation = this.getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo, specialMove);
        
        if (this.constructor.consoleLog) {
            console.log(`📝 [GameState] Notation brute: ${notation}`);
        }
        
        // Ajouter la promotion dans la notation
        if (promotion) {
            const promotionSymbol = this.getPromotionSymbol(promotion);
            notation += `=${promotionSymbol}`;
            if (this.constructor.consoleLog) {
                console.log(`📝 [GameState] Notation avec promotion: ${notation}`);
            }
        }
        
        // Mettre à jour les droits de roque si nécessaire
        this.updateCastlingRightsAfterMove(pieceInfo, fromRow, fromCol);
        
        // VÉRIFIER SI LE COUP MET EN ÉCHEC (APRÈS le coup)
        if (this.constructor.consoleLog) {
            console.log('🔍 [GameState] Vérification si le coup met en échec...');
        }
        const isCheck = this.checkIfMoveCausesCheck();
        if (isCheck) {
            notation += '+';
            if (this.constructor.consoleLog) {
                console.log('✅ [GameState] Coup met en échec - ajout du "+"');
            }
        } else {
            if (this.constructor.consoleLog) {
                console.log('❌ [GameState] Coup ne met pas en échec');
            }
        }
        
        const move = {
            number: moveNumber,
            player: this.currentPlayer,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            notation: notation,
            piece: pieceInfo.type,
            color: pieceInfo.color,
            promotion: promotion,
            specialMove: specialMove,
            isCheck: isCheck,
            timestamp: new Date(),
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
            fen: FENGenerator.generateFEN(this, window.chessGame.board)
        };
        
        this.moveHistory.push(move);
        
        if (this.constructor.consoleLog) {
            console.log(`📝 [GameState] Coup #${moveNumber} enregistré pour ${this.currentPlayer}`);
            console.log(`📝 [GameState] Notation finale: ${notation}`);
        }
        
        // Mettre à jour l'horloge des 50 coups
        this.updateHalfMoveClock(pieceInfo, toRow, toCol);
        
        // Mettre à jour le numéro de coup complet
        if (this.currentPlayer === 'black') {
            this.fullMoveNumber++;
            if (this.constructor.consoleLog) {
                console.log(`📈 [GameState] Numéro coup incrémenté: ${this.fullMoveNumber}`);
            }
        }
        
        // LOG DU PGN COMPLET
        this.logPGN();
        
        if (this.constructor.consoleLog) {
            console.log('✅ [GameState] === COUP ENREGISTRÉ ===\n');
        }
        return move;
    }

    // Mettre à jour les droits de roque après un coup
    updateCastlingRightsAfterMove(pieceInfo, fromRow, fromCol) {
        if (this.constructor.consoleLog) {
            console.log('👑 [GameState] Mise à jour des droits de roque...');
        }
        
        const color = pieceInfo.color;
        
        // Si le roi bouge, perdre tous les droits de roque pour cette couleur
        if (pieceInfo.type === 'king') {
            if (this.constructor.consoleLog) {
                console.log(`♔ [GameState] Roi ${color} bouge depuis [${fromRow},${fromCol}]`);
            }
            
            const hadKingside = this.castlingRights[color].kingside;
            const hadQueenside = this.castlingRights[color].queenside;
            
            this.castlingRights[color].kingside = false;
            this.castlingRights[color].queenside = false;
            
            if (this.constructor.consoleLog) {
                if (hadKingside) console.log(`   🚫 Roque O-O désactivé pour ${color}`);
                if (hadQueenside) console.log(`   🚫 Roque O-O-O désactivé pour ${color}`);
            }
        }
        
        // Si une tour bouge, perdre le droit de roque de ce côté
        if (pieceInfo.type === 'rook') {
            const startRow = color === 'white' ? 7 : 0;
            
            // Tour côté roi (colonne 7/h)
            if (fromCol === 7 && fromRow === startRow) {
                if (this.castlingRights[color].kingside) {
                    this.castlingRights[color].kingside = false;
                    if (this.constructor.consoleLog) {
                        console.log(`🏰 [GameState] Tour côté roi ${color} bouge depuis h${color === 'white' ? '1' : '8'}`);
                        console.log(`   🚫 Roque O-O désactivé pour ${color}`);
                    }
                }
            }
            
            // Tour côté dame (colonne 0/a)
            if (fromCol === 0 && fromRow === startRow) {
                if (this.castlingRights[color].queenside) {
                    this.castlingRights[color].queenside = false;
                    if (this.constructor.consoleLog) {
                        console.log(`🏰 [GameState] Tour côté dame ${color} bouge depuis a${color === 'white' ? '1' : '8'}`);
                        console.log(`   🚫 Roque O-O-O désactivé pour ${color}`);
                    }
                }
            }
        }
        
        if (this.constructor.consoleLog) {
            const summary = this.getCastlingSummary();
            console.log('👑 [GameState] Résumé droits de roque après coup:');
            console.log('   • Blancs:', summary.white);
            console.log('   • Noirs:', summary.black);
        }
    }

    // Mettre à jour l'horloge des 50 coups
    updateHalfMoveClock(pieceInfo, toRow, toCol) {
        if (this.constructor.consoleLog) {
            console.log('🕒 [GameState] Mise à jour horloge 50 coups...');
        }
        
        // Réinitialiser si coup de pion ou capture
        const targetSquare = window.chessGame?.board?.getSquare(toRow, toCol);
        const isCapture = targetSquare && targetSquare.piece && targetSquare.piece.color !== pieceInfo.color;
        
        if (pieceInfo.type === 'pawn' || isCapture) {
            this.halfMoveClock = 0;
            const reason = pieceInfo.type === 'pawn' ? 'mouvement pion' : 'capture';
            if (this.constructor.consoleLog) {
                console.log(`🕒 [GameState] Horloge réinitialisée (${reason})`);
            }
        } else {
            this.halfMoveClock++;
            if (this.constructor.consoleLog) {
                console.log(`🕒 [GameState] Horloge incrémentée: ${this.halfMoveClock}`);
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`🕒 [GameState] Horloge 50 coups actuelle: ${this.halfMoveClock}/50`);
        }
    }

    // Obtenir la notation FEN pour les droits de roque
    getCastlingRightsFEN() {
        let fen = '';
        
        if (this.castlingRights.white.kingside) fen += 'K';
        if (this.castlingRights.white.queenside) fen += 'Q';
        if (this.castlingRights.black.kingside) fen += 'k';
        if (this.castlingRights.black.queenside) fen += 'q';
        
        const result = fen || '-';
        
        if (this.constructor.consoleLog) {
            console.log(`👑 [GameState] Droits de roque FEN: ${result}`);
        }
        
        return result;
    }

    // MÉTHODE CORRIGÉE : Vérifier l'échec APRÈS le coup
    checkIfMoveCausesCheck() {
        if (this.constructor.consoleLog) {
            console.log('🔍 [GameState] Vérification échec après coup...');
        }
        
        try {
            // Utiliser le FEN actuel (qui inclut déjà le coup joué)
            const currentFEN = FENGenerator.generateFEN(this, window.chessGame.board);
            
            if (this.constructor.consoleLog) {
                console.log(`🔍 [GameState] FEN pour vérification: ${currentFEN.substring(0, 50)}...`);
            }
            
            const engine = new ChessEngine(currentFEN);
            const opponentColor = this.currentPlayer === 'white' ? 'b' : 'w';
            const isCheck = engine.isKingInCheck(opponentColor);
            
            if (this.constructor.consoleLog) {
                console.log(`🔍 [GameState] Échec? ${isCheck ? '✅ OUI' : '❌ NON'} (couleur opposée: ${opponentColor})`);
            }
            
            return isCheck;
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.log(`❌ [GameState] Erreur lors de la vérification d'échec: ${error.message}`);
            }
            return false;
        }
    }

    getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo, specialMove = null) {
        // NOTATION SPÉCIALE POUR LE ROQUE
        if (specialMove === 'castle-kingside') {
            return 'O-O'; // Petit roque
        }
        if (specialMove === 'castle-queenside') {
            return 'O-O-O'; // Grand roque
        }
        
        const fromFile = String.fromCharCode(97 + fromCol);
        const fromRank = 8 - fromRow;
        const toFile = String.fromCharCode(97 + toCol);
        const toRank = 8 - toRow;
        
        // Notation améliorée avec symbole de pièce
        let pieceSymbol = '';
        if (pieceInfo.type !== 'pawn') {
            pieceSymbol = this.getPieceSymbol(pieceInfo.type);
        }
        
        const notation = `${pieceSymbol}${fromFile}${fromRank}-${toFile}${toRank}`;
        
        if (this.constructor.consoleLog) {
            console.log(`📝 [GameState] Notation algébrique: ${notation}`);
            console.log(`   • Pièce: ${pieceSymbol || 'Pion'}`);
            console.log(`   • Départ: ${fromFile}${fromRank}`);
            console.log(`   • Arrivée: ${toFile}${toRank}`);
        }
        
        return notation;
    }

    // Symboles des pièces
    getPieceSymbol(pieceType) {
        const symbols = {
            'king': 'K',
            'queen': 'Q',
            'rook': 'R',
            'bishop': 'B',
            'knight': 'N'
        };
        
        const symbol = symbols[pieceType] || '';
        
        if (this.constructor.consoleLog) {
            console.log(`♟️ [GameState] Symbole pour ${pieceType}: "${symbol}"`);
        }
        
        return symbol;
    }

    getPromotionSymbol(promotionType) {
        const symbols = {
            'queen': 'Q',
            'rook': 'R',
            'bishop': 'B',
            'knight': 'N'
        };
        
        const symbol = symbols[promotionType] || 'Q';
        
        if (this.constructor.consoleLog) {
            console.log(`♟️ [GameState] Symbole promotion ${promotionType}: "${symbol}"`);
        }
        
        return symbol;
    }

    // Log du PGN complet
    logPGN() {
        const pgn = this.getPGN();
        
        if (this.constructor.consoleLog) {
            console.log('\n📜 [GameState] === PGN COMPLET ===');
            console.log('📜 [GameState] PGN:', pgn);
            
            if (this.moveHistory.length > 0) {
                console.log('📜 [GameState] Dernier coup:');
                const lastMove = this.moveHistory[this.moveHistory.length - 1];
                console.log(`   • ${lastMove.number}. ${lastMove.notation}`);
            }
            console.log('📜 [GameState] === FIN PGN ===\n');
        }
    }

    // Obtenir l'historique au format PGN
    getPGN() {
        let pgn = '';
        let movePairs = [];
        
        // Grouper les coups par paires (blancs + noirs)
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const whiteMove = this.moveHistory[i];
            const blackMove = this.moveHistory[i + 1];
            
            let movePair = `${whiteMove.number}. ${whiteMove.notation}`;
            if (blackMove) {
                movePair += ` ${blackMove.notation}`;
            }
            
            movePairs.push(movePair);
        }
        
        pgn = movePairs.join(' ');
        
        if (this.constructor.consoleLog) {
            console.log(`📜 [GameState] PGN généré (${movePairs.length} paire(s) de coups)`);
        }
        
        return pgn;
    }

    switchPlayer() {
        const oldPlayer = this.currentPlayer;
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        if (this.constructor.consoleLog) {
            console.log(`\n🔄 [GameState] Changement de joueur: ${oldPlayer} → ${this.currentPlayer}`);
            console.log(`🔄 [GameState] Coup #${Math.floor(this.moveHistory.length / 2) + 1} pour ${this.currentPlayer}`);
        }
        
        return this.currentPlayer;
    }

    resetGame() {
        if (this.constructor.consoleLog) {
            console.log('\n🔄 [GameState] === RÉINITIALISATION ===');
            console.log('🔄 [GameState] Réinitialisation du jeu...');
            console.log(`🔄 [GameState] Avant: ${this.moveHistory.length} coup(s), joueur ${this.currentPlayer}`);
        }
        
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.boardFlipped = false;
        this.gameStartTime = new Date();
        
        // Réinitialiser les droits de roque
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        
        if (this.constructor.consoleLog) {
            console.log('✅ [GameState] Réinitialisation terminée:');
            console.log(`   • Joueur: ${this.currentPlayer}`);
            console.log(`   • Coups: ${this.moveHistory.length}`);
            console.log(`   • Roque: O-O/O-O-O réactivés`);
            console.log(`   • Horloge 50: ${this.halfMoveClock}`);
            console.log('✅ [GameState] === RÉINITIALISATION TERMINÉE ===\n');
        }
    }

    getGameStatus() {
        const gameDuration = Math.floor((new Date() - this.gameStartTime) / 1000);
        const minutes = Math.floor(gameDuration / 60);
        const seconds = gameDuration % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const status = {
            currentPlayer: this.currentPlayer,
            moveCount: this.moveHistory.length,
            isActive: this.gameActive,
            isFlipped: this.boardFlipped,
            pgn: this.getPGN(),
            gameTime: formattedTime,
            startTime: this.gameStartTime,
            castlingRights: this.castlingRights,
            halfMoveClock: this.halfMoveClock,
            fullMoveNumber: this.fullMoveNumber
        };
        
        if (this.constructor.consoleLog) {
            console.log('📊 [GameState] Statut du jeu:', status);
        }
        
        return status;
    }

    // Vérifier si un roque est possible pour une couleur et un côté donnés
    canCastle(color, side) {
        const canCastle = this.castlingRights[color] && this.castlingRights[color][side];
        
        if (this.constructor.consoleLog) {
            console.log(`👑 [GameState] Roque ${side} pour ${color}? ${canCastle ? '✅ OUI' : '❌ NON'}`);
        }
        
        return canCastle;
    }

    // Désactiver un roque spécifique
    disableCastle(color, side) {
        if (this.castlingRights[color]) {
            if (this.castlingRights[color][side]) {
                this.castlingRights[color][side] = false;
                if (this.constructor.consoleLog) {
                    console.log(`🚫 [GameState] Roque ${side} désactivé pour ${color}`);
                }
            } else {
                if (this.constructor.consoleLog) {
                    console.log(`ℹ️ [GameState] Roque ${side} déjà désactivé pour ${color}`);
                }
            }
        }
    }

    // Obtenir le résumé des droits de roque
    getCastlingSummary() {
        const summary = {
            white: {
                kingside: this.castlingRights.white.kingside ? 'O-O possible' : 'O-O impossible',
                queenside: this.castlingRights.white.queenside ? 'O-O-O possible' : 'O-O-O impossible'
            },
            black: {
                kingside: this.castlingRights.black.kingside ? 'O-O possible' : 'O-O impossible',
                queenside: this.castlingRights.black.queenside ? 'O-O-O possible' : 'O-O-O impossible'
            }
        };
        
        if (this.constructor.consoleLog) {
            console.log('👑 [GameState] Résumé roque:', summary);
        }
        
        return summary;
    }
    
    // NOUVELLE MÉTHODE : Statistiques détaillées
    getDetailedStats() {
        const stats = {
            whiteMoves: this.moveHistory.filter(m => m.player === 'white').length,
            blackMoves: this.moveHistory.filter(m => m.player === 'black').length,
            checks: this.moveHistory.filter(m => m.isCheck).length,
            promotions: this.moveHistory.filter(m => m.promotion).length,
            castles: this.moveHistory.filter(m => m.specialMove && m.specialMove.includes('castle')).length,
            enPassants: this.moveHistory.filter(m => m.specialMove === 'en-passant').length,
            averageTimePerMove: this.getAverageMoveTime()
        };
        
        if (this.constructor.consoleLog) {
            console.log('📈 [GameState] Statistiques détaillées:', stats);
        }
        
        return stats;
    }
    
    // NOUVELLE MÉTHODE : Temps moyen par coup
    getAverageMoveTime() {
        if (this.moveHistory.length < 2) return 0;
        
        const firstTime = this.gameStartTime.getTime();
        const lastTime = this.moveHistory[this.moveHistory.length - 1].timestamp.getTime();
        const totalTime = lastTime - firstTime;
        
        return Math.round(totalTime / this.moveHistory.length / 1000); // secondes
    }
}

// Initialisation statique
GameState.init();

window.GameState = GameState;