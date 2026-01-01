// validators/move-state-manager.js
if (typeof MoveStateManager !== 'undefined') {
    console.warn('⚠️ MoveStateManager existe déjà.');
} else {

class MoveStateManager {
    static consoleLog = true;
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('📋 MoveStateManager : Prêt');
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
        // On garde une trace des cases marquées pour un nettoyage rapide
        this.highlightedSquares = []; 
    }

    // ========== GESTION DE LA SÉLECTION ==========

    handlePieceSelection(row, col, square) {
        const currentPlayer = this.game.gameState.currentPlayer;
        
        if (square.piece && square.piece.color === currentPlayer) {
            this.clearSelection(); 
            
            this.game.selectedPiece = { row, col, piece: square.piece };
            
            // Calcul des mouvements légaux
            try {
                this.game.possibleMoves = this.game.moveValidator.getPossibleMoves(square.piece, row, col);
            } catch (error) {
                console.error("❌ Erreur lors du calcul des mouvements:", error);
                this.game.possibleMoves = [];
            }
            
            // Visuel : Case sélectionnée
            square.element.classList.add('selected');
            this.highlightedSquares.push(square.element);

            // Visuel : Points de destination
            this.highlightPossibleMoves();
            
            if (this.constructor.consoleLog) {
                console.log(`✅ Sélection : ${square.piece.type} (${this.game.possibleMoves.length} coups)`);
            }
        }
    }

    // ========== LOGIQUE VISUELLE (CSS) ==========

    highlightPossibleMoves() {
        if (!this.game.possibleMoves || !this.game.board) return;

        this.game.possibleMoves.forEach(move => {
            const square = this.game.board.getSquare(move.row, move.col);
            if (!square || !square.element) return;

            const el = square.element;
            el.classList.add('possible-move');
            
            // Typage précis pour le CSS (ex: cercle rouge pour capture)
            if (move.type === 'capture' || move.type === 'en-passant') {
                el.classList.add('possible-capture');
            } else if (move.type === 'castling') {
                el.classList.add('possible-castle');
            }

            this.highlightedSquares.push(el);
        });
    }

    /**
     * Nettoyage chirurgical des styles CSS
     */
    clearSelection() {
        // Au lieu de boucler sur 64 cases, on ne nettoie que celles qu'on a touchées
        this.highlightedSquares.forEach(el => {
            el.classList.remove(
                'selected', 
                'possible-move', 
                'possible-capture', 
                'possible-en-passant', 
                'possible-castle'
            );
        });
        
        // Reset de la liste de suivi
        this.highlightedSquares = [];

        // Reset des données logiques
        this.game.selectedPiece = null;
        this.game.possibleMoves = [];
    }

    // ========== ERGONOMIE ==========

    isMovePossible(toRow, toCol) {
        return this.game.possibleMoves?.some(m => m.row === toRow && m.col === toCol) ?? false;
    }

    /**
     * Analyse si on doit changer de sélection ou tout annuler
     */
    handleInvalidMove(toRow, toCol, toSquare) {
        const isOwnPiece = toSquare.piece?.color === this.game.gameState.currentPlayer;
        
        if (isOwnPiece) {
            // L'utilisateur a cliqué sur une autre de ses pièces : on change le focus
            this.handlePieceSelection(toRow, toCol, toSquare);
        } else {
            // Clic dans le vide ou sur l'adversaire (hors mouvement possible) : on annule
            this.clearSelection();
        }
    }
}

MoveStateManager.init();
window.MoveStateManager = MoveStateManager;
}