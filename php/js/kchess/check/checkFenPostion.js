// check/checkFenPosition.js - Ultra-simplifié
class ChessFenPosition {
    
    static isValid(fen) {
        try {
            if (!fen || typeof fen !== 'string') return false;
            
            const parts = fen.trim().split(' ');
            if (parts.length !== 6) return false;
            
            const [board, turn, castling, enPassant, halfMove, fullMove] = parts;
            
            // Vérifications essentielles
            if (!this.validateBoard(board)) return false;
            if (!/^[wb]$/.test(turn)) return false;
            if (!this.validateCastling(castling)) return false;
            if (!this.validateEnPassant(enPassant)) return false;
            if (!this.validateCounters(halfMove, fullMove)) return false;
            
            return true;
            
        } catch {
            return false;
        }
    }
    
    static validateBoard(board) {
        const rows = board.split('/');
        if (rows.length !== 8) return false;
        
        // Vérifier chaque rangée
        for (let i = 0; i < 8; i++) {
            let count = 0;
            for (const char of rows[i]) {
                if (/^[KQRBNPkqrbnp]$/.test(char)) {
                    count++;
                } else if (/^[1-8]$/.test(char)) {
                    count += parseInt(char);
                } else {
                    return false;
                }
            }
            if (count !== 8) return false;
            
            // Pions pas sur rangée 1 ou 8
            if (i === 0 && rows[i].includes('P')) return false;
            if (i === 7 && rows[i].includes('p')) return false;
        }
        
        // Exactement 1 roi par couleur
        const whiteKings = (board.match(/K/g) || []).length;
        const blackKings = (board.match(/k/g) || []).length;
        return whiteKings === 1 && blackKings === 1;
    }
    
    static validateCastling(castling) {
        return castling === '-' || /^[KQkq]+$/.test(castling);
    }
    
    static validateEnPassant(enPassant) {
        return enPassant === '-' || /^[a-h][36]$/.test(enPassant);
    }
    
    static validateCounters(halfMove, fullMove) {
        if (!/^\d+$/.test(halfMove) || !/^\d+$/.test(fullMove)) return false;
        return parseInt(halfMove) >= 0 && parseInt(fullMove) >= 1;
    }
    
    static quickCheck(fen) {
        try {
            return fen && 
                   fen.includes(' ') && 
                   fen.split(' ').length === 6;
        } catch {
            return false;
        }
    }
}

window.ChessFenPosition = ChessFenPosition;