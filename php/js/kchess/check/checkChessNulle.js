// check/checkChessNulle.js - Vérification des autres cas de nullité
class ChessNulleEngine extends ChessEngine {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('check/checkChessNulle.js loaded');
        }
    }

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
        if (this.constructor.consoleLog) {
            console.log(`🔄🔍 Vérification répétition triple`);
        }
        
        const currentFEN = this.getPositionSignature();
        const count = this.positionCount.get(currentFEN) || 0;
        
        if (this.constructor.consoleLog) {
            console.log(`🔄 Position actuelle apparue ${count} fois`);
        }
        
        return count >= 3;
    }

    // Vérifier la règle des 50 coups
    isFiftyMoveRule(halfMoveClock) {
        if (this.constructor.consoleLog) {
            console.log(`🎯🔍 Vérification règle des 50 coups: ${halfMoveClock}/50`);
        }
        
        return halfMoveClock >= 50;
    }

    // Vérifier matériel insuffisant (égalité)
    isInsufficientMaterial() {
        if (this.constructor.consoleLog) {
            console.log(`♜🔍 Vérification matériel insuffisant`);
        }
        
        const pieces = this.getAllPieces();
        
        // Cas 1: Roi contre roi
        if (pieces.length === 2) {
            if (this.constructor.consoleLog) {
                console.log(`♜✅ Roi contre roi - matériel insuffisant`);
            }
            return true;
        }
        
        // Cas 2: Roi + fou contre roi
        if (pieces.length === 3) {
            const bishops = pieces.filter(p => p.piece.toLowerCase() === 'b');
            if (bishops.length === 1) {
                if (this.constructor.consoleLog) {
                    console.log(`♜✅ Roi + fou contre roi - matériel insuffisant`);
                }
                return true;
            }
        }
        
        // Cas 3: Roi + cavalier contre roi  
        if (pieces.length === 3) {
            const knights = pieces.filter(p => p.piece.toLowerCase() === 'n');
            if (knights.length === 1) {
                if (this.constructor.consoleLog) {
                    console.log(`♜✅ Roi + cavalier contre roi - matériel insuffisant`);
                }
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
                        if (this.constructor.consoleLog) {
                            console.log(`♜✅ Roi + fou contre roi + fou (même couleur) - matériel insuffisant`);
                        }
                        return true;
                    }
                }
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`♜❌ Matériel suffisant pour continuer`);
        }
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

    // Vérifier toutes les conditions de nullité avec détection précise
    isDraw(halfMoveClock) {
        if (this.constructor.consoleLog) {
            console.log(`🤝🔍 Vérification globale des conditions de nullité`);
        }
        
        // 1. Matériel insuffisant - LE PLUS RAPIDE À VÉRIFIER
        if (this.isInsufficientMaterial()) {
            if (this.constructor.consoleLog) {
                console.log(`🤝✅ Nullité par matériel insuffisant`);
            }
            return { isDraw: true, reason: 'insufficientMaterial' };
        }
        
        // 2. Règle des 50 coups - SIMPLE COMPARATION
        if (this.isFiftyMoveRule(halfMoveClock)) {
            if (this.constructor.consoleLog) {
                console.log(`🤝✅ Nullité par règle des 50 coups`);
            }
            return { isDraw: true, reason: 'fiftyMoves' };
        }
        
        // 3. Répétition triple - LE PLUS LOURD À CALCULER
        if (this.isThreefoldRepetition()) {
            if (this.constructor.consoleLog) {
                console.log(`🤝✅ Nullité par répétition triple`);
            }
            return { isDraw: true, reason: 'repetition' };
        }
        
        if (this.constructor.consoleLog) {
            console.log(`🤝❌ Aucune condition de nullité détectée`);
        }
        return { isDraw: false, reason: null };
    }

    // NOUVELLE MÉTHODE : Obtenir le message détaillé pour la nullité
    getDrawMessage(reason) {
        const messages = {
            'repetition': 'Partie nulle par répétition triple de position !',
            'fiftyMoves': 'Partie nulle par la règle des 50 coups !',
            'insufficientMaterial': 'Partie nulle par matériel insuffisant !'
        };
        return messages[reason] || 'Partie nulle !';
    }

    // NOUVELLE MÉTHODE : Obtenir la description détaillée
    getDrawDescription(reason) {
        const descriptions = {
            'repetition': 'La même position s\'est répétée trois fois avec le même joueur ayant le trait.',
            'fiftyMoves': '50 coups complets (100 demi-coups) se sont écoulés sans capture ni mouvement de pion.',
            'insufficientMaterial': 'Aucun des deux joueurs ne dispose du matériel suffisant pour donner un échec et mat.'
        };
        return descriptions[reason] || 'La partie est déclarée nulle.';
    }
}

// Initialisation statique
ChessNulleEngine.init();

window.ChessNulleEngine = ChessNulleEngine;