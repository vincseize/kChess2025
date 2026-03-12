// validators/validator-interface.js
if (typeof ValidatorInterface !== 'undefined') {
    console.warn('⚠️ ValidatorInterface existe déjà.');
} else {

class ValidatorInterface {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('🔗 ValidatorInterface: Façade de validation prête');
    }
    
    static loadConfig() {
        try {
            const config = window.appConfig?.chess_engine || window.appConfig?.debug;
            if (config?.console_log !== undefined) {
                this.consoleLog = String(config.console_log).toLowerCase() !== "false";
            }
        } catch (e) { this.consoleLog = true; }
    }

    constructor(game) {
        this.game = game;
    }

    /**
     * Sécurité : garantit qu'on travaille sur une instance de pièce valide
     */
    _ensurePiece(piece, row, col) {
        if (piece && piece.type) return piece;
        return this.game.board?.getPiece?.(row, col) || null;
    }

    /**
     * Interface vers le moteur de règles (MoveValidator)
     */
    getPossibleMoves(piece, row, col) {
        const activePiece = this._ensurePiece(piece, row, col);
        
        if (!activePiece || !this.game.moveValidator) {
            if (this.constructor.consoleLog) console.error("❌ Moteur de règles non lié");
            return [];
        }

        // Récupération et normalisation des mouvements
        const moves = this.game.moveValidator.getPossibleMoves(activePiece, row, col);
        return (moves || []).map(m => ({
            ...m,
            type: m.type || m.special // Normalisation castling/castle
        }));
    }

    /**
     * Analyse un coup spécifique pour l'exécution
     */
    getMoveDetails(piece, fromRow, fromCol, toRow, toCol) {
        const activePiece = this._ensurePiece(piece, fromRow, fromCol);
        const moves = this.getPossibleMoves(activePiece, fromRow, fromCol);
        const move = moves.find(m => m.row === toRow && m.col === toCol);
        
        if (!move) return { isValid: false };
        
        // Enrichissement des données du coup
        return {
            isValid: true,
            type: move.type, 
            isPromotion: move.isPromotion || (activePiece.type === 'pawn' && (toRow === 0 || toRow === 7)),
            notation: this.generateNotation(move, activePiece, fromRow, fromCol, toRow, toCol),
            piece: activePiece,
            originalMoveData: move
        };
    }

    /**
     * Génère la notation algébrique standard (ex: Nf3, exd5, O-O)
     */
    generateNotation(move, piece, fromRow, fromCol, toRow, toCol) {
        // 1. Gestion du Roque
        if (move.type === 'castling' || move.type === 'castle') {
            return toCol > fromCol ? 'O-O' : 'O-O-O';
        }

        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const targetSquare = `${files[toCol]}${8 - toRow}`;
        
        // 2. Lettre de la pièce (Figurine)
        const pieceLetters = { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: '' };
        let pieceLetter = pieceLetters[piece.type] || '';

        // 3. Gestion de la capture
        const isCapture = move.type === 'capture' || move.type === 'en-passant';
        
        if (piece.type === 'pawn') {
            // Un pion qui capture montre sa colonne d'origine (ex: exd5)
            return isCapture ? `${files[fromCol]}x${targetSquare}` : targetSquare;
        }

        const captureSign = isCapture ? 'x' : '';
        return `${pieceLetter}${captureSign}${targetSquare}`;
    }

    /**
     * Vérification rapide des limites du plateau
     */
    quickValidate(fromRow, fromCol, toRow, toCol) {
        return (
            toRow >= 0 && toRow < 8 && 
            toCol >= 0 && toCol < 8 && 
            !(fromRow === toRow && fromCol === toCol)
        );
    }
}

ValidatorInterface.init();
window.ValidatorInterface = ValidatorInterface;

}