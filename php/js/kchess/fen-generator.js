// fen-generator.js - CORRIGÉ avec génération dynamique des droits de roque
class FENGenerator {
    static generateFEN(gameState, board) {
        // 1. Partie position des pièces
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
        
        // 2. Tour actuel
        fen += gameState.currentPlayer === 'white' ? ' w' : ' b';
        
        // 3. CORRECTION : Droits de roque dynamiques
        fen += ' ' + this.generateCastlingRights(gameState, board);
        
        // 4. Case en passant
        fen += ' ' + (gameState.enPassantTarget || '-');
        
        // 5. Nombre de coups pour la règle des 50 coups
        fen += ' ' + (gameState.halfMoveClock || 0);
        
        // 6. Numéro du coup
        fen += ' ' + (Math.floor((gameState.moveHistory?.length || 0) / 2) + 1);
        
        console.log('🔍 FEN généré:', fen);
        
        // ✅ VALIDATION SIMPLE (non bloquante)
        this.validateFEN(fen);
        
        return fen;
    }
    
    /**
     * GÉNÈRE LES DROITS DE ROQUE DYNAMIQUEMENT
     */
    static generateCastlingRights(gameState, board) {
        let castling = '';
        
        // Roque blanc côté roi (K)
        if (this.canWhiteKingsideCastle(gameState, board)) {
            castling += 'K';
        }
        
        // Roque blanc côté dame (Q)
        if (this.canWhiteQueensideCastle(gameState, board)) {
            castling += 'Q';
        }
        
        // Roque noir côté roi (k)
        if (this.canBlackKingsideCastle(gameState, board)) {
            castling += 'k';
        }
        
        // Roque noir côté dame (q)
        if (this.canBlackQueensideCastle(gameState, board)) {
            castling += 'q';
        }
        
        return castling || '-';
    }
    
    static canWhiteKingsideCastle(gameState, board) {
        // Vérifier si le roi a déjà bougé (priorité à gameState)
        if (gameState.hasKingMoved?.white) {
            return false;
        }
        
        // Roi blanc doit être sur e1
        const kingSquare = board.getSquare(7, 4); // e1
        if (!kingSquare || !kingSquare.piece || 
            kingSquare.piece.type !== 'king' || 
            kingSquare.piece.color !== 'white') {
            return false;
        }
        
        // Tour h1 doit être présente
        const rookSquare = board.getSquare(7, 7); // h1
        if (!rookSquare || !rookSquare.piece || 
            rookSquare.piece.type !== 'rook' || 
            rookSquare.piece.color !== 'white') {
            return false;
        }
        
        // Vérifier si la tour a bougé
        if (gameState.hasRookMoved?.white?.kingside) {
            return false;
        }
        
        // Vérifier que les cases entre le roi et la tour sont vides
        if (board.getSquare(7, 5).piece || board.getSquare(7, 6).piece) {
            return false;
        }
        
        return true;
    }
    
    static canWhiteQueensideCastle(gameState, board) {
        if (gameState.hasKingMoved?.white) {
            return false;
        }
        
        const kingSquare = board.getSquare(7, 4); // e1
        if (!kingSquare || !kingSquare.piece || 
            kingSquare.piece.type !== 'king' || 
            kingSquare.piece.color !== 'white') {
            return false;
        }
        
        const rookSquare = board.getSquare(7, 0); // a1
        if (!rookSquare || !rookSquare.piece || 
            rookSquare.piece.type !== 'rook' || 
            rookSquare.piece.color !== 'white') {
            return false;
        }
        
        if (gameState.hasRookMoved?.white?.queenside) {
            return false;
        }
        
        // Vérifier que les cases entre le roi et la tour sont vides
        if (board.getSquare(7, 1).piece || board.getSquare(7, 2).piece || board.getSquare(7, 3).piece) {
            return false;
        }
        
        return true;
    }
    
    static canBlackKingsideCastle(gameState, board) {
        if (gameState.hasKingMoved?.black) {
            return false;
        }
        
        const kingSquare = board.getSquare(0, 4); // e8
        if (!kingSquare || !kingSquare.piece || 
            kingSquare.piece.type !== 'king' || 
            kingSquare.piece.color !== 'black') {
            return false;
        }
        
        const rookSquare = board.getSquare(0, 7); // h8
        if (!rookSquare || !rookSquare.piece || 
            rookSquare.piece.type !== 'rook' || 
            rookSquare.piece.color !== 'black') {
            return false;
        }
        
        if (gameState.hasRookMoved?.black?.kingside) {
            return false;
        }
        
        if (board.getSquare(0, 5).piece || board.getSquare(0, 6).piece) {
            return false;
        }
        
        return true;
    }
    
    static canBlackQueensideCastle(gameState, board) {
        if (gameState.hasKingMoved?.black) {
            return false;
        }
        
        const kingSquare = board.getSquare(0, 4); // e8
        if (!kingSquare || !kingSquare.piece || 
            kingSquare.piece.type !== 'king' || 
            kingSquare.piece.color !== 'black') {
            return false;
        }
        
        const rookSquare = board.getSquare(0, 0); // a8
        if (!rookSquare || !rookSquare.piece || 
            rookSquare.piece.type !== 'rook' || 
            rookSquare.piece.color !== 'black') {
            return false;
        }
        
        if (gameState.hasRookMoved?.black?.queenside) {
            return false;
        }
        
        if (board.getSquare(0, 1).piece || board.getSquare(0, 2).piece || board.getSquare(0, 3).piece) {
            return false;
        }
        
        return true;
    }
    
    /**
     * VALIDATION SIMPLE DU FEN (NON BLOQUANTE)
     */
    static validateFEN(fen) {
        // 1. Quick check d'abord
        console.log('🔍 Quick Validation FEN en cours...');
        if (window.ChessFenPosition && window.ChessFenPosition.quickCheck) {
            const quickValid = window.ChessFenPosition.quickCheck(fen);
            if (!quickValid) {
                console.warn('⚠️ FEN invalide (quick check):', fen);
                // Ne pas bloquer le jeu, juste logger un warning
                return false;
            }
        }
        
        // 2. Validation complète ensuite (optionnelle)
        console.log('🔍 Full Validation FEN en cours...');
        if (window.ChessFenPosition && window.ChessFenPosition.isValid) {
            const fullValid = window.ChessFenPosition.isValid(fen);
            if (!fullValid) {
                console.warn('⚠️ FEN invalide (validation complète):', fen);
                // Ne pas bloquer le jeu, juste logger un warning
                return false;
            }
        }
        
        console.log('✅ FEN validé avec succès');
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
        
        return pieces[piece.color][piece.type];
    }
    
    // Méthode pour détecter si c'est la position initiale
    static isInitialPosition(board) {
        // Vérifier la position exacte de départ
        const initialFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
        const currentFEN = this.generateBoardPart(board);
        return currentFEN === initialFEN;
    }
    
    static generateBoardPart(board) {
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
        
        return fen;
    }

    // Générer FEN pour simulation
    static generateFENForSimulation(board, currentPlayer) {
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
        
        fen += currentPlayer === 'white' ? ' w' : ' b';
        
        // Utiliser des droits de roque réalistes pour la simulation
        fen += ' ' + this.generateCastlingRightsForSimulation(board);
        
        fen += ' - 0 1';
        
        // ✅ VALIDATION POUR SIMULATION AUSSI
        this.validateFEN(fen);
        
        return fen;
    }
    
    static generateCastlingRightsForSimulation(board) {
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
        }
        
        if (whiteKing?.type === 'king' && whiteKing?.color === 'white' && 
            whiteRookQueenside?.type === 'rook' && whiteRookQueenside?.color === 'white') {
            castling += 'Q';
        }
        
        if (blackKing?.type === 'king' && blackKing?.color === 'black' && 
            blackRookKingside?.type === 'rook' && blackRookKingside?.color === 'black') {
            castling += 'k';
        }
        
        if (blackKing?.type === 'king' && blackKing?.color === 'black' && 
            blackRookQueenside?.type === 'rook' && blackRookQueenside?.color === 'black') {
            castling += 'q';
        }
        
        return castling || '-';
    }
    
    /**
     * Méthode utilitaire pour obtenir un FEN basique (sans validation)
     */
    static getBasicFEN(board, currentPlayer) {
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
        
        fen += currentPlayer === 'white' ? ' w' : ' b';
        fen += ' - - 0 1'; // Pas de roque, pas de prise en passant
        
        return fen;
    }
}

window.FENGenerator = FENGenerator;