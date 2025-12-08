// core/fen-generator.js - CORRIGÉ avec génération dynamique des droits de roque
class FENGenerator {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('core/fen-generator.js loaded');
        }
    }

    static generateFEN(gameState, board) {
        if (this.consoleLog) {
            console.log('\n📄 [FENGenerator] === GÉNÉRATION FEN ===');
            console.log('📄 [FENGenerator] Génération du FEN pour l\'état actuel');
            console.log('📄 [FENGenerator] GameState:', gameState);
            console.log('📄 [FENGenerator] Board:', board);
        }
        
        // 1. Partie position des pièces
        let fen = '';
        if (this.consoleLog) {
            console.log('📄 [FENGenerator] Génération de la position des pièces...');
        }
        
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            
            for (let col = 0; col < 8; col++) {
                const square = board.getSquare(row, col);
                
                if (!square || !square.piece) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                        if (this.consoleLog) {
                            console.log(`   📄 [FENGenerator] Case vide x${emptyCount} ajoutée`);
                        }
                    }
                    
                    const pieceChar = this.getPieceChar(square.piece);
                    fen += pieceChar;
                    if (this.consoleLog) {
                        console.log(`   📄 [FENGenerator] Pièce ${pieceChar} en [${row},${col}]`);
                    }
                }
            }
            
            if (emptyCount > 0) {
                fen += emptyCount;
                if (this.consoleLog) {
                    console.log(`   📄 [FENGenerator] Fin ligne: ${emptyCount} case(s) vide(s)`);
                }
            }
            
            if (row < 7) {
                fen += '/';
            }
        }
        
        if (this.consoleLog) {
            console.log(`📄 [FENGenerator] Position des pièces: ${fen.substring(0, 50)}...`);
        }
        
        // 2. Tour actuel
        const currentPlayer = gameState.currentPlayer === 'white' ? ' w' : ' b';
        fen += currentPlayer;
        if (this.consoleLog) {
            console.log(`📄 [FENGenerator] Tour actuel: ${gameState.currentPlayer}`);
        }
        
        // 3. CORRECTION : Droits de roque dynamiques
        const castlingRights = this.generateCastlingRights(gameState, board);
        fen += ' ' + castlingRights;
        if (this.consoleLog) {
            console.log(`📄 [FENGenerator] Droits de roque: ${castlingRights}`);
        }
        
        // 4. Case en passant
        const enPassant = gameState.enPassantTarget || '-';
        fen += ' ' + enPassant;
        if (this.consoleLog) {
            console.log(`📄 [FENGenerator] En passant: ${enPassant}`);
        }
        
        // 5. Nombre de coups pour la règle des 50 coups
        const halfMoves = gameState.halfMoveClock || 0;
        fen += ' ' + halfMoves;
        if (this.consoleLog) {
            console.log(`📄 [FENGenerator] Demi-coups: ${halfMoves}`);
        }
        
        // 6. Numéro du coup
        const moveNumber = Math.floor((gameState.moveHistory?.length || 0) / 2) + 1;
        fen += ' ' + moveNumber;
        if (this.consoleLog) {
            console.log(`📄 [FENGenerator] Numéro coup: ${moveNumber}`);
        }
        
        if (this.consoleLog) {
            console.log(`✅ [FENGenerator] FEN généré: ${fen}`);
            console.log(`📄 [FENGenerator] Longueur: ${fen.length} caractères`);
        }
        
        // ✅ VALIDATION SIMPLE (non bloquante)
        this.validateFEN(fen);
        
        if (this.consoleLog) {
            console.log('✅ [FENGenerator] === GÉNÉRATION TERMINÉE ===\n');
        }
        
        return fen;
    }
    
    /**
     * GÉNÈRE LES DROITS DE ROQUE DYNAMIQUEMENT
     */
    static generateCastlingRights(gameState, board) {
        if (this.consoleLog) {
            console.log('👑 [FENGenerator] Génération des droits de roque...');
        }
        
        let castling = '';
        
        // Roque blanc côté roi (K)
        const whiteKingside = this.canWhiteKingsideCastle(gameState, board);
        if (whiteKingside) {
            castling += 'K';
            if (this.consoleLog) {
                console.log('   👑 [FENGenerator] Roque blanc côté roi (K) ✓');
            }
        }
        
        // Roque blanc côté dame (Q)
        const whiteQueenside = this.canWhiteQueensideCastle(gameState, board);
        if (whiteQueenside) {
            castling += 'Q';
            if (this.consoleLog) {
                console.log('   👑 [FENGenerator] Roque blanc côté dame (Q) ✓');
            }
        }
        
        // Roque noir côté roi (k)
        const blackKingside = this.canBlackKingsideCastle(gameState, board);
        if (blackKingside) {
            castling += 'k';
            if (this.consoleLog) {
                console.log('   👑 [FENGenerator] Roque noir côté roi (k) ✓');
            }
        }
        
        // Roque noir côté dame (q)
        const blackQueenside = this.canBlackQueensideCastle(gameState, board);
        if (blackQueenside) {
            castling += 'q';
            if (this.consoleLog) {
                console.log('   👑 [FENGenerator] Roque noir côté dame (q) ✓');
            }
        }
        
        const result = castling || '-';
        if (this.consoleLog) {
            console.log(`   👑 [FENGenerator] Droits de roque finaux: ${result}`);
            if (result === '-') {
                console.log('   👑 [FENGenerator] Aucun roque disponible');
            }
        }
        
        return result;
    }
    
    static canWhiteKingsideCastle(gameState, board) {
        if (this.consoleLog) {
            console.log('   👑 [FENGenerator] Vérification roque blanc côté roi...');
        }
        
        // Vérifier si le roi a déjà bougé (priorité à gameState)
        if (gameState.hasKingMoved?.white) {
            if (this.consoleLog) {
                console.log('     ❌ [FENGenerator] Roi blanc a déjà bougé');
            }
            return false;
        }
        
        // Roi blanc doit être sur e1
        const kingSquare = board.getSquare(7, 4); // e1
        if (!kingSquare || !kingSquare.piece || 
            kingSquare.piece.type !== 'king' || 
            kingSquare.piece.color !== 'white') {
            if (this.consoleLog) {
                const piece = kingSquare?.piece;
                console.log(`     ❌ [FENGenerator] Roi blanc pas en e1: ${piece?.type || 'vide'} ${piece?.color || ''}`);
            }
            return false;
        }
        
        // Tour h1 doit être présente
        const rookSquare = board.getSquare(7, 7); // h1
        if (!rookSquare || !rookSquare.piece || 
            rookSquare.piece.type !== 'rook' || 
            rookSquare.piece.color !== 'white') {
            if (this.consoleLog) {
                const piece = rookSquare?.piece;
                console.log(`     ❌ [FENGenerator] Tour blanche pas en h1: ${piece?.type || 'vide'} ${piece?.color || ''}`);
            }
            return false;
        }
        
        // Vérifier si la tour a bougé
        if (gameState.hasRookMoved?.white?.kingside) {
            if (this.consoleLog) {
                console.log('     ❌ [FENGenerator] Tour h1 a déjà bougé');
            }
            return false;
        }
        
        // Vérifier que les cases entre le roi et la tour sont vides
        const f1 = board.getSquare(7, 5).piece;
        const g1 = board.getSquare(7, 6).piece;
        if (f1 || g1) {
            if (this.consoleLog) {
                console.log(`     ❌ [FENGenerator] Cases bloquées: f1=${f1?.type || 'vide'}, g1=${g1?.type || 'vide'}`);
            }
            return false;
        }
        
        if (this.consoleLog) {
            console.log('     ✅ [FENGenerator] Roque blanc côté roi possible');
        }
        return true;
    }
    
    static canWhiteQueensideCastle(gameState, board) {
        if (this.consoleLog) {
            console.log('   👑 [FENGenerator] Vérification roque blanc côté dame...');
        }
        
        if (gameState.hasKingMoved?.white) {
            if (this.consoleLog) {
                console.log('     ❌ [FENGenerator] Roi blanc a déjà bougé');
            }
            return false;
        }
        
        const kingSquare = board.getSquare(7, 4); // e1
        if (!kingSquare || !kingSquare.piece || 
            kingSquare.piece.type !== 'king' || 
            kingSquare.piece.color !== 'white') {
            if (this.consoleLog) {
                console.log(`     ❌ [FENGenerator] Roi blanc pas en e1`);
            }
            return false;
        }
        
        const rookSquare = board.getSquare(7, 0); // a1
        if (!rookSquare || !rookSquare.piece || 
            rookSquare.piece.type !== 'rook' || 
            rookSquare.piece.color !== 'white') {
            if (this.consoleLog) {
                console.log(`     ❌ [FENGenerator] Tour blanche pas en a1`);
            }
            return false;
        }
        
        if (gameState.hasRookMoved?.white?.queenside) {
            if (this.consoleLog) {
                console.log('     ❌ [FENGenerator] Tour a1 a déjà bougé');
            }
            return false;
        }
        
        // Vérifier que les cases entre le roi et la tour sont vides
        const b1 = board.getSquare(7, 1).piece;
        const c1 = board.getSquare(7, 2).piece;
        const d1 = board.getSquare(7, 3).piece;
        if (b1 || c1 || d1) {
            if (this.consoleLog) {
                console.log(`     ❌ [FENGenerator] Cases bloquées: b1=${b1?.type || 'vide'}, c1=${c1?.type || 'vide'}, d1=${d1?.type || 'vide'}`);
            }
            return false;
        }
        
        if (this.consoleLog) {
            console.log('     ✅ [FENGenerator] Roque blanc côté dame possible');
        }
        return true;
    }
    
    static canBlackKingsideCastle(gameState, board) {
        if (this.consoleLog) {
            console.log('   👑 [FENGenerator] Vérification roque noir côté roi...');
        }
        
        if (gameState.hasKingMoved?.black) {
            if (this.consoleLog) {
                console.log('     ❌ [FENGenerator] Roi noir a déjà bougé');
            }
            return false;
        }
        
        const kingSquare = board.getSquare(0, 4); // e8
        if (!kingSquare || !kingSquare.piece || 
            kingSquare.piece.type !== 'king' || 
            kingSquare.piece.color !== 'black') {
            if (this.consoleLog) {
                console.log(`     ❌ [FENGenerator] Roi noir pas en e8`);
            }
            return false;
        }
        
        const rookSquare = board.getSquare(0, 7); // h8
        if (!rookSquare || !rookSquare.piece || 
            rookSquare.piece.type !== 'rook' || 
            rookSquare.piece.color !== 'black') {
            if (this.consoleLog) {
                console.log(`     ❌ [FENGenerator] Tour noire pas en h8`);
            }
            return false;
        }
        
        if (gameState.hasRookMoved?.black?.kingside) {
            if (this.consoleLog) {
                console.log('     ❌ [FENGenerator] Tour h8 a déjà bougé');
            }
            return false;
        }
        
        const f8 = board.getSquare(0, 5).piece;
        const g8 = board.getSquare(0, 6).piece;
        if (f8 || g8) {
            if (this.consoleLog) {
                console.log(`     ❌ [FENGenerator] Cases bloquées: f8=${f8?.type || 'vide'}, g8=${g8?.type || 'vide'}`);
            }
            return false;
        }
        
        if (this.consoleLog) {
            console.log('     ✅ [FENGenerator] Roque noir côté roi possible');
        }
        return true;
    }
    
    static canBlackQueensideCastle(gameState, board) {
        if (this.consoleLog) {
            console.log('   👑 [FENGenerator] Vérification roque noir côté dame...');
        }
        
        if (gameState.hasKingMoved?.black) {
            if (this.consoleLog) {
                console.log('     ❌ [FENGenerator] Roi noir a déjà bougé');
            }
            return false;
        }
        
        const kingSquare = board.getSquare(0, 4); // e8
        if (!kingSquare || !kingSquare.piece || 
            kingSquare.piece.type !== 'king' || 
            kingSquare.piece.color !== 'black') {
            if (this.consoleLog) {
                console.log(`     ❌ [FENGenerator] Roi noir pas en e8`);
            }
            return false;
        }
        
        const rookSquare = board.getSquare(0, 0); // a8
        if (!rookSquare || !rookSquare.piece || 
            rookSquare.piece.type !== 'rook' || 
            rookSquare.piece.color !== 'black') {
            if (this.consoleLog) {
                console.log(`     ❌ [FENGenerator] Tour noire pas en a8`);
            }
            return false;
        }
        
        if (gameState.hasRookMoved?.black?.queenside) {
            if (this.consoleLog) {
                console.log('     ❌ [FENGenerator] Tour a8 a déjà bougé');
            }
            return false;
        }
        
        const b8 = board.getSquare(0, 1).piece;
        const c8 = board.getSquare(0, 2).piece;
        const d8 = board.getSquare(0, 3).piece;
        if (b8 || c8 || d8) {
            if (this.consoleLog) {
                console.log(`     ❌ [FENGenerator] Cases bloquées: b8=${b8?.type || 'vide'}, c8=${c8?.type || 'vide'}, d8=${d8?.type || 'vide'}`);
            }
            return false;
        }
        
        if (this.consoleLog) {
            console.log('     ✅ [FENGenerator] Roque noir côté dame possible');
        }
        return true;
    }
    
    /**
     * VALIDATION SIMPLE DU FEN (NON BLOQUANTE)
     */
    static validateFEN(fen) {
        if (!this.consoleLog) return true;
        
        console.log('🔍 [FENGenerator] === VALIDATION FEN ===');
        console.log(`🔍 [FENGenerator] FEN à valider: ${fen.substring(0, 60)}...`);
        
        // 1. Quick check d'abord
        if (window.ChessFenPosition && window.ChessFenPosition.quickCheck) {
            console.log('🔍 [FENGenerator] Quick check en cours...');
            const quickValid = window.ChessFenPosition.quickCheck(fen);
            if (!quickValid) {
                console.warn('⚠️ [FENGenerator] FEN invalide (quick check)');
                console.warn('⚠️ [FENGenerator] Continuer malgré l\'erreur');
                console.log('🔍 [FENGenerator] === FIN VALIDATION (ERREUR) ===\n');
                return false;
            }
            console.log('✅ [FENGenerator] Quick check réussi');
        } else {
            console.log('ℹ️ [FENGenerator] ChessFenPosition.quickCheck non disponible');
        }
        
        // 2. Validation complète ensuite (optionnelle)
        if (window.ChessFenPosition && window.ChessFenPosition.isValid) {
            console.log('🔍 [FENGenerator] Validation complète en cours...');
            const fullValid = window.ChessFenPosition.isValid(fen);
            if (!fullValid) {
                console.warn('⚠️ [FENGenerator] FEN invalide (validation complète)');
                console.warn('⚠️ [FENGenerator] Continuer malgré l\'erreur');
                console.log('🔍 [FENGenerator] === FIN VALIDATION (ERREUR) ===\n');
                return false;
            }
            console.log('✅ [FENGenerator] Validation complète réussie');
        } else {
            console.log('ℹ️ [FENGenerator] ChessFenPosition.isValid non disponible');
        }
        
        console.log('✅ [FENGenerator] FEN validé avec succès');
        console.log('🔍 [FENGenerator] === FIN VALIDATION (SUCCÈS) ===\n');
        return true;
    }
    
    static getPieceChar(piece) {
        const pieces = {
            'white': {
                'king': 'K',
                'queen': 'Q',
                'rook': 'R',
                'bishop': 'B',
                'knight': 'N',
                'pawn': 'P'
            },
            'black': {
                'king': 'k',
                'queen': 'q',
                'rook': 'r',
                'bishop': 'b',
                'knight': 'n',
                'pawn': 'p'
            }
        };
        
        const char = pieces[piece.color][piece.type];
        
        if (this.consoleLog) {
            console.log(`   ♟️ [FENGenerator] Pièce ${piece.type} (${piece.color}) → "${char}"`);
        }
        
        return char;
    }
    
    // Méthode pour détecter si c'est la position initiale
    static isInitialPosition(board) {
        if (this.consoleLog) {
            console.log('🔍 [FENGenerator] Vérification position initiale...');
        }
        
        // Vérifier la position exacte de départ
        const initialFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
        const currentFEN = this.generateBoardPart(board);
        const isInitial = currentFEN === initialFEN;
        
        if (this.consoleLog) {
            console.log(`   🔍 [FENGenerator] Position actuelle: ${currentFEN.substring(0, 30)}...`);
            console.log(`   🔍 [FENGenerator] Position initiale: ${initialFEN.substring(0, 30)}...`);
            console.log(`   🔍 [FENGenerator] Est position initiale? ${isInitial ? '✅ OUI' : '❌ NON'}`);
        }
        
        return isInitial;
    }
    
    static generateBoardPart(board) {
        if (this.consoleLog) {
            console.log('📄 [FENGenerator] Génération de la partie plateau seulement...');
        }
        
        let fen = '';
        
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            
            for (let col = 0; col < 8; col++) {
                const square = board.getSquare(row, col);
                
                if (!square || !square.piece) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    
                    const pieceChar = this.getPieceChar(square.piece);
                    fen += pieceChar;
                }
            }
            
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            
            if (row < 7) {
                fen += '/';
            }
        }
        
        if (this.consoleLog) {
            console.log(`📄 [FENGenerator] Partie plateau générée: ${fen.substring(0, 50)}...`);
        }
        
        return fen;
    }

    // Générer FEN pour simulation
    static generateFENForSimulation(board, currentPlayer) {
        if (this.consoleLog) {
            console.log('\n🧪 [FENGenerator] === GÉNÉRATION FEN POUR SIMULATION ===');
            console.log('🧪 [FENGenerator] Joueur actuel pour simulation:', currentPlayer);
        }
        
        let fen = '';
        
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            
            for (let col = 0; col < 8; col++) {
                const square = board.getSquare(row, col);
                
                if (!square || !square.piece) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    
                    const pieceChar = this.getPieceChar(square.piece);
                    fen += pieceChar;
                }
            }
            
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            
            if (row < 7) {
                fen += '/';
            }
        }
        
        const playerPart = currentPlayer === 'white' ? ' w' : ' b';
        fen += playerPart;
        
        if (this.consoleLog) {
            console.log(`🧪 [FENGenerator] Position + tour: ${fen.substring(0, 50)}...`);
        }
        
        // Utiliser des droits de roque réalistes pour la simulation
        const castling = this.generateCastlingRightsForSimulation(board);
        fen += ' ' + castling;
        if (this.consoleLog) {
            console.log(`🧪 [FENGenerator] Roque simulation: ${castling}`);
        }
        
        fen += ' - 0 1';
        
        if (this.consoleLog) {
            console.log(`✅ [FENGenerator] FEN simulation: ${fen}`);
        }
        
        // ✅ VALIDATION POUR SIMULATION AUSSI
        this.validateFEN(fen);
        
        if (this.consoleLog) {
            console.log('✅ [FENGenerator] === FIN GÉNÉRATION SIMULATION ===\n');
        }
        
        return fen;
    }
    
    static generateCastlingRightsForSimulation(board) {
        if (this.consoleLog) {
            console.log('👑 [FENGenerator] Génération roque pour simulation...');
        }
        
        let castling = '';
        
        // Vérifications simplifiées pour simulation
        const whiteKing = board.getSquare(7, 4)?.piece;
        const blackKing = board.getSquare(0, 4)?.piece;
        const whiteRookKingside = board.getSquare(7, 7)?.piece;
        const whiteRookQueenside = board.getSquare(7, 0)?.piece;
        const blackRookKingside = board.getSquare(0, 7)?.piece;
        const blackRookQueenside = board.getSquare(0, 0)?.piece;
        
        if (whiteKing?.type === 'king' && whiteKing?.color === 'white' && 
            whiteRookKingside?.type === 'rook' && whiteRookKingside?.color === 'white') {
            castling += 'K';
            if (this.consoleLog) {
                console.log('   👑 [FENGenerator] Roque K ajouté pour simulation');
            }
        }
        
        if (whiteKing?.type === 'king' && whiteKing?.color === 'white' && 
            whiteRookQueenside?.type === 'rook' && whiteRookQueenside?.color === 'white') {
            castling += 'Q';
            if (this.consoleLog) {
                console.log('   👑 [FENGenerator] Roque Q ajouté pour simulation');
            }
        }
        
        if (blackKing?.type === 'king' && blackKing?.color === 'black' && 
            blackRookKingside?.type === 'rook' && blackRookKingside?.color === 'black') {
            castling += 'k';
            if (this.consoleLog) {
                console.log('   👑 [FENGenerator] Roque k ajouté pour simulation');
            }
        }
        
        if (blackKing?.type === 'king' && blackKing?.color === 'black' && 
            blackRookQueenside?.type === 'rook' && blackRookQueenside?.color === 'black') {
            castling += 'q';
            if (this.consoleLog) {
                console.log('   👑 [FENGenerator] Roque q ajouté pour simulation');
            }
        }
        
        const result = castling || '-';
        if (this.consoleLog) {
            console.log(`   👑 [FENGenerator] Roque simulation final: ${result}`);
        }
        
        return result;
    }
    
    /**
     * Méthode utilitaire pour obtenir un FEN basique (sans validation)
     */
    static getBasicFEN(board, currentPlayer) {
        if (this.consoleLog) {
            console.log('📄 [FENGenerator] Génération FEN basique...');
        }
        
        let fen = '';
        
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            
            for (let col = 0; col < 8; col++) {
                const square = board.getSquare(row, col);
                
                if (!square || !square.piece) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    
                    const pieceChar = this.getPieceChar(square.piece);
                    fen += pieceChar;
                }
            }
            
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            
            if (row < 7) {
                fen += '/';
            }
        }
        
        const playerPart = currentPlayer === 'white' ? ' w' : ' b';
        fen += playerPart;
        fen += ' - - 0 1'; // Pas de roque, pas de prise en passant
        
        if (this.consoleLog) {
            console.log(`📄 [FENGenerator] FEN basique: ${fen}`);
        }
        
        return fen;
    }
}

// Initialisation statique
FENGenerator.init();

window.FENGenerator = FENGenerator;