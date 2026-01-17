/**
 * js/kchess/check/checkChessNulle.js - Version 1.4.0
 * MOTEUR DE VÉRIFICATION DES LOGIQUES DE MATCH NUL (DRAW)
 */

class ChessNulleEngine extends ChessEngine {
    
    static VERSION = '1.4.0';
    static consoleLog = true;

    static log(message, type = 'info') {
        if (!this.consoleLog && type === 'info') return;
        const icons = { info: '🤝', success: '✅', warn: '⚠️', draw: '⚖️' };
        console.log(`${icons[type] || '⚪'} [NulleEngine] ${message}`);
    }

    static init() {
        this.loadConfig();
        this.log(`v${this.VERSION} prêt. (Règle des 50 coups activée)`, 'success');
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.debug || window.appConfig?.chess_engine;
            if (config?.console_log !== undefined) {
                this.consoleLog = String(config.console_log).toLowerCase() !== "false";
            }
        } catch (e) { this.consoleLog = true; }
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

        // Ajouter l'historique (signatures FEN simplifiées)
        if (Array.isArray(this.moveHistory)) {
            this.moveHistory.forEach(pastFen => {
                const sig = this.getFENSignature(pastFen);
                this.positionCount.set(sig, (this.positionCount.get(sig) || 0) + 1);
            });
        }
    }

    /**
     * Règle 1 : Répétition triple
     */
    isThreefoldRepetition() {
        const count = this.positionCount.get(this.getPositionSignature()) || 0;
        return count >= 3;
    }

    /**
     * Règle 2 : 50 coups (100 demi-coups)
     */
    isFiftyMoveRule(halfMoveClock) {
        // halfMoveClock est le 5ème champ du FEN
        return parseInt(halfMoveClock) >= 100;
    }

    /**
     * Règle 3 : Matériel insuffisant
     */
    isInsufficientMaterial() {
        const pieces = this.getAllPieces();
        const count = pieces.length;

        // Roi vs Roi
        if (count === 2) return true;

        // Roi + (Fou ou Cavalier) vs Roi
        if (count === 3) {
            const extraPiece = pieces.find(p => p.piece.toLowerCase() !== 'k').piece.toLowerCase();
            if (extraPiece === 'b' || extraPiece === 'n') return true;
        }

        // Roi + Fou vs Roi + Fou (Fous sur même couleur)
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
     * Vérification globale de nullité
     */
    isDraw(halfMoveClock) {
        let reason = null;

        if (this.isInsufficientMaterial()) reason = 'insufficient';
        else if (this.isFiftyMoveRule(halfMoveClock)) reason = 'fiftyMoves';
        else if (this.isThreefoldRepetition()) reason = 'repetition';

        if (reason) {
            const message = this.getDrawMessage(reason);
            this.constructor.log(`Match Nul détecté : ${message}`, 'draw');
            return { isDraw: true, reason: reason, text: message };
        }

        return { isDraw: false, reason: null };
    }

    // --- Utilitaires ---

    getPositionSignature() {
        return this.getFENSignature(this.fen);
    }

    getFENSignature(fen) {
        // On ignore les compteurs (5ème et 6ème champs) pour la répétition
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
            repetition: 'Triple répétition',
            fiftyMoves: 'Règle des 50 coups',
            insufficient: 'Matériel insuffisant'
        };
        return msg[reason] || 'Partie nulle';
    }
}

ChessNulleEngine.init();
window.ChessNulleEngine = ChessNulleEngine;