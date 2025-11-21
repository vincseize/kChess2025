// fen-generator.js
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
        fen += gameState.currentPlayer === 'white' ? ' b' : ' w';
        
        // 3. Droits de roque - À AMÉLIORER
        // Pour l'instant, on met toujours KQkq si c'est la position initiale
        // ou après quelques coups simples
        fen += ' KQkq';
        
        // 4. Case en passant (pour l'instant on met '-')
        fen += ' -';
        
        // 5. Nombre de coups pour la règle des 50 coups
        fen += ' 0';
        
        // 6. Numéro du coup
        fen += ' ' + (Math.floor(gameState.moveHistory.length / 2) + 1);
        
        return fen;
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
        // Vérifier si les pièces sont dans leur position initiale
        // À implémenter plus tard
        return false;
    }
}

window.FENGenerator = FENGenerator;