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
            if (window.appConfig?.chess_engine) {
                this.consoleLog = window.appConfig.chess_engine.console_log ?? true;
            }
        } catch (e) { this.consoleLog = true; }
    }

    constructor(game) {
        this.game = game;
    }

    /**
     * Sécurité : garantit qu'on travaille sur une pièce valide.
     */
    _ensurePiece(piece, row, col) {
        if (piece && piece.type) return piece;
        if (this.game.board?.getPiece) {
            return this.game.board.getPiece(row, col);
        }
        return null;
    }

    /**
     * Récupère la liste des coups légaux filtrés.
     */
    getPossibleMoves(piece, row, col) {
        const activePiece = this._ensurePiece(piece, row, col);
        
        if (!activePiece || !this.game.moveValidator) {
            if (this.constructor.consoleLog) console.error("❌ Validation impossible : pièce ou moteur manquant");
            return [];
        }

        // On appelle le moteur de calcul (MoveValidator)
        const moves = this.game.moveValidator.getPossibleMoves(activePiece, row, col);
        
        return moves || [];
    }

    /**
     * Détermine si un mouvement est spécial pour aiguiller l'exécution.
     */
    isSpecialMove(piece, fromRow, fromCol, toRow, toCol) {
        const moves = this.getPossibleMoves(piece, fromRow, fromCol);
        const move = moves.find(m => m.row === toRow && m.col === toCol);
        
        // Un coup est spécial s'il s'agit d'un roque ou d'une prise en passant
        return !!(move && (move.type === 'en-passant' || move.type === 'castling' || move.special === 'castle'));
    }

    /**
     * Analyse complète d'un coup avant exécution.
     * Utile pour déclencher des sons (capture vs move) ou enregistrer l'historique.
     */
    getMoveDetails(piece, fromRow, fromCol, toRow, toCol) {
        const activePiece = this._ensurePiece(piece, fromRow, fromCol);
        const moves = this.getPossibleMoves(activePiece, fromRow, fromCol);
        const move = moves.find(m => m.row === toRow && m.col === toCol);
        
        if (!move) return { isValid: false };
        
        return {
            isValid: true,
            type: move.type, // 'move', 'capture', 'en-passant', 'castling'
            isPromotion: move.isPromotion || (activePiece.type === 'pawn' && (toRow === 0 || toRow === 7)),
            notation: this.generateNotation(move, activePiece, fromRow, fromCol, toRow, toCol),
            piece: activePiece
        };
    }

    /**
     * Génère la notation algébrique standard (ex: Nf3, exd5, O-O)
     */
    generateNotation(move, piece, fromRow, fromCol, toRow, toCol) {
        // 1. Gestion du Roque
        if (move.type === 'castling' || move.special === 'castle') {
            return toCol > fromCol ? 'O-O' : 'O-O-O';
        }

        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const targetSquare = `${files[toCol]}${8 - toRow}`;
        
        // 2. Lettre de la pièce (Vide pour le pion)
        const pieceLetters = { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: '' };
        let pieceLetter = pieceLetters[piece.type];

        // 3. Gestion de la capture
        const isCapture = move.type === 'capture' || move.type === 'en-passant';
        let captureSign = isCapture ? 'x' : '';
        
        // Cas particulier du pion : il affiche sa colonne de départ lors d'une capture (ex: exd5)
        if (piece.type === 'pawn' && isCapture) {
            pieceLetter = files[fromCol];
        }

        return `${pieceLetter}${captureSign}${targetSquare}`;
    }

    /**
     * Vérification de sécurité rapide hors règles d'échecs
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