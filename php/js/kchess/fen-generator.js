// fen-generator.js - CORRIGÉ avec validation simple
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
        
        // CORRECTION : Tour actuel - blanc = 'w', noir = 'b'
        fen += gameState.currentPlayer === 'white' ? ' w' : ' b';
        
        // 3. Droits de roque
        fen += ' KQkq';
        
        // 4. Case en passant
        fen += ' -';
        
        // 5. Nombre de coups pour la règle des 50 coups
        fen += ' 0';
        
        // 6. Numéro du coup
        fen += ' ' + (Math.floor(gameState.moveHistory.length / 2) + 1);
        
        console.log('🔍 FEN généré:', fen);
        
        // ✅ VALIDATION SIMPLE
        this.validateFEN(fen);
        
        return fen;
    }
    
    /**
     * VALIDATION SIMPLE DU FEN
     */
    static validateFEN(fen) {
        // 1. Quick check d'abord
        console.log('🔍 Quick Validation FEN en cours...');
        if (window.ChessFenPosition && window.ChessFenPosition.quickCheck) {
            const quickValid = window.ChessFenPosition.quickCheck(fen);
            if (!quickValid) {
                console.error('🚨 FEN invalide (quick check):', fen);
                return false;
            }
        }
        
        // 2. Validation complète ensuite
        console.log('🔍 Full Validation FEN en cours...');
        if (window.ChessFenPosition && window.ChessFenPosition.isValid) {
            const fullValid = window.ChessFenPosition.isValid(fen);
            if (!fullValid) {
                console.error('🚨 FEN invalide (validation complète):', fen);
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
        return false;
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
        fen += ' KQkq - 0 1';
        
        // ✅ VALIDATION POUR SIMULATION AUSSI
        this.validateFEN(fen);
        
        return fen;
    }
}

window.FENGenerator = FENGenerator;