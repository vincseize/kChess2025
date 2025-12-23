// check/checkChessNulle.js - Moteur de vérification des nullités (Draw)
class ChessNulleEngine extends ChessEngine {
    
    static VERSION = '1.3.1';
    static consoleLog = true;

    /**
     * Initialisation statique
     */
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log(`🤝 ChessNulleEngine v${this.VERSION} prêt (${this.getConfigSource()})`);
        }
    }

    static loadConfig() {
        try {
            const rawValue = window.appConfig?.debug?.console_log ?? true;
            this.consoleLog = rawValue === "false" ? false : Boolean(rawValue);
        } catch (e) {
            this.consoleLog = true;
        }
    }

    static getConfigSource() {
        return window.appConfig ? 'JSON config' : 'default';
    }

    constructor(fen, moveHistory = []) {
        super(fen);
        this.moveHistory = moveHistory; 
        this.positionCount = new Map();
        
        this.initializePositionCount();
    }

    /**
     * Analyse l'historique pour détecter les répétitions
     */
    initializePositionCount() {
        // Ajouter la position actuelle
        const currentSig = this.getPositionSignature();
        this.positionCount.set(currentSig, 1);

        // Ajouter l'historique
        for (const pastFen of this.moveHistory) {
            const sig = this.getFENSignature(pastFen);
            this.positionCount.set(sig, (this.positionCount.get(sig) || 0) + 1);
        }
    }

    /**
     * Règle de la répétition triple
     */
    isThreefoldRepetition() {
        const count = this.positionCount.get(this.getPositionSignature()) || 0;
        const detected = count >= 3;
        
        if (detected && this.constructor.consoleLog) {
            console.log("🔄 Nullité : Position répétée 3 fois.");
        }
        return detected;
    }

    /**
     * Règle des 50 coups (100 demi-coups sans capture ni mouvement de pion)
     */
    isFiftyMoveRule(halfMoveClock) {
        return halfMoveClock >= 100; // FIDE: 50 coups complets = 100 demi-coups
    }

    /**
     * Matériel insuffisant (Impossibilité de mater)
     */
    isInsufficientMaterial() {
        const pieces = this.getAllPieces();
        const count = pieces.length;

        // 1. Roi vs Roi
        if (count === 2) return true;

        // 2. Roi + Fou vs Roi OU Roi + Cavalier vs Roi
        if (count === 3) {
            const type = pieces.find(p => p.piece.toLowerCase() !== 'k').piece.toLowerCase();
            if (type === 'b' || type === 'n') return true;
        }

        // 3. Roi + Fou vs Roi + Fou (Fous sur même couleur de case)
        if (count === 4) {
            const whiteBishops = pieces.filter(p => p.piece === 'B');
            const blackBishops = pieces.filter(p => p.piece === 'b');

            if (whiteBishops.length === 1 && blackBishops.length === 1) {
                const wColor = (whiteBishops[0].row + whiteBishops[0].col) % 2;
                const bColor = (blackBishops[0].row + blackBishops[0].col) % 2;
                return wColor === bColor;
            }
        }

        return false;
    }

    /**
     * Vérification globale
     */
    isDraw(halfMoveClock) {
        let reason = null;

        if (this.isInsufficientMaterial()) reason = 'insufficientMaterial';
        else if (this.isFiftyMoveRule(halfMoveClock)) reason = 'fiftyMoves';
        else if (this.isThreefoldRepetition()) reason = 'repetition';

        const result = { isDraw: !!reason, reason: reason };

        if (result.isDraw && this.constructor.consoleLog) {
            console.log(`🤝 MATCH NUL : ${this.getDrawMessage(reason)}`);
        }

        return result;
    }

    // --- Utilitaires de signature ---

    getPositionSignature() {
        return this.getFENSignature(this.fen);
    }

    getFENSignature(fen) {
        // On ne garde que la position, le tour, le roque et l'en-passant
        // On ignore les compteurs de coups pour la répétition
        return fen.split(' ').slice(0, 4).join(' ');
    }

    getAllPieces() {
        const pieces = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.getPiece(r, c);
                if (p) pieces.push({ piece: p, row: r, col: c });
            }
        }
        return pieces;
    }

    getDrawMessage(reason) {
        const msg = {
            repetition: 'Répétition triple',
            fiftyMoves: 'Règle des 50 coups',
            insufficientMaterial: 'Matériel insuffisant'
        };
        return msg[reason] || 'Nullité';
    }
}

// Lancement
ChessNulleEngine.init();
window.ChessNulleEngine = ChessNulleEngine;