// validators/move-state-manager.js
if (typeof MoveStateManager !== 'undefined') {
    console.warn('⚠️ MoveStateManager existe déjà.');
} else {

class MoveStateManager {
    static consoleLog = true;
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('📋 MoveStateManager : Gestionnaire d\'état visuel prêt');
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

    // ========== GESTION DE LA SÉLECTION ==========

    /**
     * Pilote la sélection d'une pièce : logique + visuel
     */
    handlePieceSelection(row, col, square) {
        // Sécurité : Vérification du tour via GameState
        const currentPlayer = this.game.gameState.currentPlayer;
        
        if (square.piece && square.piece.color === currentPlayer) {
            // 1. Nettoyage de l'état précédent
            this.clearSelection(); 
            
            // 2. Stockage de la nouvelle sélection
            this.game.selectedPiece = { row, col, piece: square.piece };
            
            // 3. Calcul des mouvements via le Master Validator
            this.game.possibleMoves = this.game.moveValidator.getPossibleMoves(square.piece, row, col);
            
            // 4. Mise à jour UI
            square.element.classList.add('selected');
            this.highlightPossibleMoves();
            
            if (this.constructor.consoleLog) {
                console.log(`✅ Sélection : ${square.piece.type} [${row},${col}] | ${this.game.possibleMoves.length} coups trouvés`);
            }
        }
    }

    // ========== LOGIQUE VISUELLE (CSS) ==========

    /**
     * Applique les styles aux cases de destination
     */
    highlightPossibleMoves() {
        if (!this.game.possibleMoves) return;

        this.game.possibleMoves.forEach(move => {
            const square = this.game.board.getSquare(move.row, move.col);
            if (!square) return;

            // Ajout de la classe de base pour le point de mouvement
            square.element.classList.add('possible-move');

            // Surbrillance spécifique selon la nature du coup
            if (move.type === 'capture' || move.type === 'en-passant') {
                square.element.classList.add('possible-capture');
            }
            
            if (move.type === 'castling') {
                square.element.classList.add('possible-castle');
            }
        });
    }

/**
     * Supprime tous les indicateurs visuels de mouvement
     */
    clearSelection() {
        // Suppression de la condition "if (this.game.selectedPiece...)"
        // car elle empêche le nettoyage si les variables sont désynchronisées du DOM
        
        if (this.game.board && this.game.board.squares) {
            this.game.board.squares.forEach(sq => {
                if (sq.element) {
                    sq.element.classList.remove(
                        'selected', 
                        'possible-move', 
                        'possible-capture', 
                        'possible-en-passant', 
                        'possible-castle'
                    );
                }
            });
        }
        
        // On réinitialise les variables logiques après le nettoyage visuel
        this.game.selectedPiece = null;
        this.game.possibleMoves = [];
    }

    // ========== VÉRIFICATIONS & ERGONOMIE ==========

    /**
     * Vérifie si une coordonnée cible est valide pour la pièce sélectionnée
     */
    isMovePossible(toRow, toCol) {
        if (!this.game.possibleMoves) return false;
        return this.game.possibleMoves.some(m => m.row === toRow && m.col === toCol);
    }

    /**
     * Gestion intelligente du clic "hors zone" ou sur une autre pièce
     */
    handleInvalidMove(toRow, toCol, toSquare) {
        // Si le joueur clique sur une autre de ses pièces, on change la sélection directement
        const isOwnPiece = toSquare.piece?.color === this.game.gameState.currentPlayer;
        
        if (isOwnPiece) {
            this.handlePieceSelection(toRow, toCol, toSquare);
        } else {
            this.clearSelection();
        }
    }
}

MoveStateManager.init();
window.MoveStateManager = MoveStateManager;

}