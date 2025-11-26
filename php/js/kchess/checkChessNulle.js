// checkChessNulle.js - Vérification des autres cas de nullité
class ChessNulleEngine extends ChessEngine {
    constructor(fen, moveHistory = []) {
        super(fen);
        this.moveHistory = moveHistory; // Historique des coups pour la répétition
        this.positionCount = new Map(); // Compteur de positions pour répétition triple
        this.initializePositionCount();
    }

    // Initialiser le compteur de positions
    initializePositionCount() {
        const currentFEN = this.getPositionSignature();
        this.positionCount.set(currentFEN, 1);
        
        // Compter les positions précédentes
        for (const fen of this.moveHistory) {
            const signature = this.getFENSignature(fen);
            this.positionCount.set(signature, (this.positionCount.get(signature) || 0) + 1);
        }
    }

    // Vérifier la répétition triple
    isThreefoldRepetition() {
        console.log(`🔄🔍 Vérification répétition triple`);
        
        const currentFEN = this.getPositionSignature();
        const count = this.positionCount.get(currentFEN) || 0;
        
        console.log(`🔄 Position actuelle apparue ${count} fois`);
        
        return count >= 3;
    }

    // Vérifier la règle des 50 coups
    isFiftyMoveRule(halfMoveClock) {
        console.log(`🎯🔍 Vérification règle des 50 coups: ${halfMoveClock}/50`);
        
        return halfMoveClock >= 50;
    }

    // Vérifier matériel insuffisant (égalité)
    isInsufficientMaterial() {
        console.log(`♜🔍 Vérification matériel insuffisant`);
        
        const pieces = this.getAllPieces();
        
        // Cas 1: Roi contre roi
        if (pieces.length === 2) {
            console.log(`♜✅ Roi contre roi - matériel insuffisant`);
            return true;
        }
        
        // Cas 2: Roi + fou contre roi
        if (pieces.length === 3) {
            const bishops = pieces.filter(p => p.piece.toLowerCase() === 'b');
            if (bishops.length === 1) {
                console.log(`♜✅ Roi + fou contre roi - matériel insuffisant`);
                return true;
            }
        }
        
        // Cas 3: Roi + cavalier contre roi  
        if (pieces.length === 3) {
            const knights = pieces.filter(p => p.piece.toLowerCase() === 'n');
            if (knights.length === 1) {
                console.log(`♜✅ Roi + cavalier contre roi - matériel insuffisant`);
                return true;
            }
        }
        
        // Cas 4: Roi + fou contre roi + fou (même couleur de cases)
        if (pieces.length === 4) {
            const bishops = pieces.filter(p => p.piece.toLowerCase() === 'b');
            if (bishops.length === 2) {
                const whiteBishop = bishops.find(b => b.piece === 'B');
                const blackBishop = bishops.find(b => b.piece === 'b');
                
                if (whiteBishop && blackBishop) {
                    const whiteSquareColor = (whiteBishop.row + whiteBishop.col) % 2;
                    const blackSquareColor = (blackBishop.row + blackBishop.col) % 2;
                    
                    if (whiteSquareColor === blackSquareColor) {
                        console.log(`♜✅ Roi + fou contre roi + fou (même couleur) - matériel insuffisant`);
                        return true;
                    }
                }
            }
        }
        
        console.log(`♜❌ Matériel suffisant pour continuer`);
        return false;
    }

    // Obtenir toutes les pièces sur le plateau
    getAllPieces() {
        const pieces = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece) {
                    pieces.push({
                        piece: piece,
                        row: row,
                        col: col
                    });
                }
            }
        }
        return pieces;
    }

    // Obtenir la signature de position (FEN sans compteurs)
    getPositionSignature() {
        // Utiliser le FEN fourni au constructeur
        const parts = this.fen.split(' ');
        // Retourner seulement la position des pièces, le tour et les droits de roque
        return parts.slice(0, 4).join(' ');
    }

    // Obtenir la signature d'un FEN donné
    getFENSignature(fen) {
        const parts = fen.split(' ');
        return parts.slice(0, 4).join(' ');
    }

    // Vérifier toutes les conditions de nullité
    isDraw(halfMoveClock) {
        console.log(`🤝🔍 Vérification globale des conditions de nullité`);
        
        // 1. Répétition triple
        if (this.isThreefoldRepetition()) {
            console.log(`🤝✅ Nullité par répétition triple`);
            return true;
        }
        
        // 2. Règle des 50 coups
        if (this.isFiftyMoveRule(halfMoveClock)) {
            console.log(`🤝✅ Nullité par règle des 50 coups`);
            return true;
        }
        
        // 3. Matériel insuffisant
        if (this.isInsufficientMaterial()) {
            console.log(`🤝✅ Nullité par matériel insuffisant`);
            return true;
        }
        
        console.log(`🤝❌ Aucune condition de nullité détectée`);
        return false;
    }
}

window.ChessNulleEngine = ChessNulleEngine;