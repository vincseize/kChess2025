// check/checkFenPosition.js - Validateur de notation FEN (Forsyth-Edwards Notation)
class ChessFenPosition {
    
    static VERSION = '1.4.0';
    static consoleLog = true;

    /**
     * Initialisation et chargement de la configuration
     */
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log(`✅ ChessFenPosition v${this.VERSION} chargé (${this.getConfigSource()})`);
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

    /**
     * Validation complète d'une chaîne FEN
     */
    static isValid(fen) {
        try {
            if (!fen || typeof fen !== 'string') return false;
            
            const parts = fen.trim().split(/\s+/);
            if (parts.length !== 6) {
                if (this.consoleLog) console.warn('❌ FEN invalide: doit contenir 6 segments séparés par des espaces');
                return false;
            }
            
            const [board, turn, castling, enPassant, halfMove, fullMove] = parts;
            
            // Suite de tests logiques
            const checks = [
                { test: () => this.validateBoard(board), msg: "Plateau invalide" },
                { test: () => /^[wb]$/.test(turn), msg: "Trait (tour) invalide" },
                { test: () => this.validateCastling(castling), msg: "Droits de roque invalides" },
                { test: () => this.validateEnPassant(enPassant), msg: "Case en passant invalide" },
                { test: () => this.validateCounters(halfMove, fullMove), msg: "Compteurs de coups invalides" }
            ];

            for (const check of checks) {
                if (!check.test()) {
                    if (this.consoleLog) console.error(`❌ Validation FEN échouée: ${check.msg}`);
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Valide la structure du plateau (8x8 et pièces valides)
     */
    static validateBoard(board) {
        const rows = board.split('/');
        if (rows.length !== 8) return false;
        
        for (let i = 0; i < 8; i++) {
            let count = 0;
            for (const char of rows[i]) {
                if (/^[KQRBNPkqrbnp]$/.test(char)) {
                    count++;
                } else if (/^[1-8]$/.test(char)) {
                    count += parseInt(char);
                } else {
                    return false; // Caractère inconnu
                }
            }
            if (count !== 8) return false;

            // Sécurité : Pions sur les rangées de promotion
            if (i === 0 && rows[i].toLowerCase().includes('p')) return false;
            if (i === 7 && rows[i].toLowerCase().includes('p')) return false;
        }
        
        // Présence obligatoire des rois
        if ((board.match(/K/g) || []).length !== 1) return false;
        if ((board.match(/k/g) || []).length !== 1) return false;
        
        return true;
    }
    
    static validateCastling(castling) {
        return castling === '-' || /^(?!.*(.).*\1)[KQkq]{1,4}$/.test(castling);
    }
    
    static validateEnPassant(enPassant) {
        return enPassant === '-' || /^[a-h][36]$/.test(enPassant);
    }
    
    static validateCounters(halfMove, fullMove) {
        const h = parseInt(halfMove);
        const f = parseInt(fullMove);
        return !isNaN(h) && h >= 0 && h <= 100 && !isNaN(f) && f > 0;
    }

    /**
     * Analyse sémantique du FEN pour retour UI
     */
    static analyze(fen) {
        const valid = this.isValid(fen);
        if (!valid) return { isValid: false };

        const parts = fen.split(/\s+/);
        return {
            isValid: true,
            turn: parts[1] === 'w' ? 'Blancs' : 'Noirs',
            castling: parts[2],
            enPassant: parts[3],
            halfMoveClock: parseInt(parts[4]),
            fullMoveNumber: parseInt(parts[5]),
            isNearDraw: parseInt(parts[4]) >= 90
        };
    }

    static quickCheck(fen) {
        if (!fen) return false;
        const p = fen.split(' ');
        return p.length === 6 && p[0].includes('/') && /^[wb]$/.test(p[1]);
    }
}

// Initialisation et exposition
ChessFenPosition.init();
window.ChessFenPosition = ChessFenPosition;

// Utilitaires de test pour la console
window.ChessFenPositionUtils = {
    test: (fen) => ChessFenPosition.analyze(fen),
    isValid: (fen) => ChessFenPosition.isValid(fen),
    toggleDebug: (state) => { 
        ChessFenPosition.consoleLog = state; 
        return `Debug: ${state}`;
    }
};