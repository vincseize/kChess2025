/**
 * validators/move-state-manager.js
 * Gère l'état visuel du plateau : sélections, suggestions de coups et historique du dernier mouvement.
 */
if (typeof MoveStateManager !== 'undefined') {
    console.warn('⚠️ MoveStateManager existe déjà.');
} else {

class MoveStateManager {
    static consoleLog = true;
    
    static init() {
        this.loadConfig();
        if (this.consoleLog) console.log('📋 MoveStateManager : Prêt (v2.0 - Highlight Focus)');
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
        // Stocke les éléments DOM ayant des classes de suggestion (points, cercles)
        this.highlightedSquares = []; 
    }

    // ========== GESTION DE LA SÉLECTION (TEMP) ==========

    /**
     * Gère la sélection d'une pièce et affiche les suggestions
     */
    handlePieceSelection(row, col, square) {
        const currentPlayer = this.game.gameState.currentPlayer;
        
        const piece = this.game.board.getPiece(row, col);
        if (piece && piece.color === currentPlayer) {
            // On nettoie les suggestions précédentes avant d'en afficher de nouvelles
            this.clearSelection(); 
            
            this.game.selectedPiece = { row, col, piece };
            
            // Calcul des mouvements légaux via le validateur
            try {
                this.game.possibleMoves = this.game.moveValidator.getPossibleMoves(piece, row, col);
            } catch (error) {
                console.error("❌ Erreur lors du calcul des mouvements:", error);
                this.game.possibleMoves = [];
            }
            
            // Applique le style de sélection
            square.element.classList.add('selected');
            this.highlightedSquares.push(square.element);

            // Affiche les points/cercles de destination
            this.highlightPossibleMoves();
            
            if (this.constructor.consoleLog) {
                console.log(`✅ Sélection : ${piece.type} (${this.game.possibleMoves.length} coups possibles)`);
            }
        }
    }

    /**
     * Ajoute les classes CSS pour les suggestions de coups
     */
    highlightPossibleMoves() {
        if (!this.game.possibleMoves || !this.game.board) return;

        this.game.possibleMoves.forEach(move => {
            const square = this.game.board.getSquare(move.row, move.col);
            if (!square || !square.element) return;

            const el = square.element;
            
            // Ajout des classes selon le type de mouvement (défini dans ton CSS)
            if (move.type === 'capture' || move.type === 'en-passant') {
                el.classList.add('possible-capture');
            } else if (move.type === 'castling') {
                el.classList.add('possible-castle');
            } else {
                el.classList.add('possible-move');
            }

            this.highlightedSquares.push(el);
        });
    }

    /**
     * Nettoyage chirurgical : supprime uniquement les suggestions de coups
     */
    clearSelection() {
        this.highlightedSquares.forEach(el => {
            el.classList.remove(
                'selected', 
                'possible-move', 
                'possible-capture', 
                'possible-en-passant', 
                'possible-castle'
            );
        });
        
        this.highlightedSquares = [];
        this.game.selectedPiece = null;
        this.game.possibleMoves = [];
    }

    // ========== GESTION DU DERNIER COUP (PERSISTANT) ==========

    /**
     * Marque visuellement d'où vient la pièce et où elle arrive.
     * Appelé juste après l'exécution d'un coup.
     */
    highlightLastMove(fromRow, fromCol, toRow, toCol) {
        // 1. Supprime les anciens highlights de mouvement sur tout le plateau
        const boardEl = document.getElementById('chessBoard') || document.querySelector('.chess-board');
        if (boardEl) {
            boardEl.querySelectorAll('.last-move-source, .last-move-dest').forEach(el => {
                el.classList.remove('last-move-source', 'last-move-dest');
            });
        }

        // 2. Récupère les nouvelles cases
        const startSq = this.game.board.getSquare(fromRow, fromCol);
        const endSq = this.game.board.getSquare(toRow, toCol);

        // 3. Applique les classes (Source = départ, Dest = arrivée)
        if (startSq?.element) startSq.element.classList.add('last-move-source');
        if (endSq?.element) endSq.element.classList.add('last-move-dest');
        
        // 4. On s'assure que les points de suggestion sont effacés
        this.clearSelection();
    }

    // ========== UTILITAIRES ==========

    isMovePossible(toRow, toCol) {
        return this.game.possibleMoves?.some(m => m.row === toRow && m.col === toCol) ?? false;
    }

    /**
     * Analyse si on change de pièce sélectionnée ou si on annule tout
     */
    handleInvalidMove(toRow, toCol, toSquare) {
        const isOwnPiece = this.game.board.getPiece(toRow, toCol)?.color === this.game.gameState.currentPlayer;
        
        if (isOwnPiece) {
            // Change la sélection vers la nouvelle pièce alliée
            this.handlePieceSelection(toRow, toCol, toSquare);
        } else {
            // Clic dans le vide ou ennemi invalide : on nettoie
            this.clearSelection();
        }
    }
}

MoveStateManager.init();
window.MoveStateManager = MoveStateManager;
}