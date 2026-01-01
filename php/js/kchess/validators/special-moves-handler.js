// validators/special-moves-handler.js
if (typeof SpecialMovesHandler !== 'undefined') {
    console.warn('⚠️ SpecialMovesHandler déjà chargé.');
} else {

class SpecialMovesHandler {
    static consoleLog = true;

    constructor(game) {
        this.game = game;
        this.stats = {
            castles: { kingside: 0, queenside: 0 },
            enPassant: 0
        };
    }

    /**
     * Orchestre les coups qui sortent du cadre standard (1 pièce = 1 mouvement)
     */
    handleSpecialMove(move, selectedPiece, toRow, toCol) {
        if (!move) return false;

        const type = move.type || move.special;
        
        // 1. GESTION DU ROQUE
        if (type === 'castling' || type === 'castle') {
            this.executeCastle(move, selectedPiece);
            return true;
        }

        // 2. GESTION DE LA PRISE EN PASSANT
        if (type === 'en-passant') {
            this.executeEnPassant(move, selectedPiece, toRow, toCol);
            return true;
        }

        return false;
    }

    /**
     * Déplace le Roi et la Tour simultanément
     */
    executeCastle(move, selectedPiece) {
        const color = selectedPiece.piece.color;
        const row = color === 'white' ? 7 : 0;
        const isKingside = move.isKingside || move.type?.includes('kingside');

        // Définition des colonnes
        const kingFromCol = 4;
        const kingToCol = isKingside ? 6 : 2;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? 5 : 3;

        if (SpecialMovesHandler.consoleLog) console.log(`🏰 Exécution Roque : ${isKingside ? 'Petit' : 'Grand'}`);

        // A. Déplacement physique et logique du Roi
        this.movePieceInternal(row, kingFromCol, row, kingToCol);
        
        // B. Déplacement physique et logique de la Tour
        this.movePieceInternal(row, rookFromCol, row, rookToCol);

        // C. Mise à jour des statistiques
        this.stats.castles[isKingside ? 'kingside' : 'queenside']++;

        this.finalizeSpecialMove(move, selectedPiece, true);
    }

    /**
     * Déplace le pion et retire le pion adverse capturé "en passant"
     */
    executeEnPassant(move, selectedPiece, toRow, toCol) {
        const direction = selectedPiece.piece.color === 'white' ? 1 : -1;
        const capturedPawnRow = toRow + direction; // Le pion adverse est derrière
        
        // 1. Nettoyage de la case du pion capturé
        const capturedSq = this.game.board.getSquare(capturedPawnRow, toCol);
        if (capturedSq) {
            capturedSq.piece = null;
            capturedSq.element.innerHTML = '';
        }

        // 2. Déplacement du pion attaquant
        this.movePieceInternal(selectedPiece.row, selectedPiece.col, toRow, toCol);
        
        this.stats.enPassant++;
        this.finalizeSpecialMove(move, selectedPiece, false);
    }

    /**
     * Transfère la pièce dans le moteur et dans le DOM
     */
    movePieceInternal(fRow, fCol, tRow, tCol) {
        const from = this.game.board.getSquare(fRow, fCol);
        const to = this.game.board.getSquare(tRow, tCol);
        const piece = from.piece;

        if (piece) {
            // Mise à jour de l'objet pièce
            piece.row = tRow;
            piece.col = tCol;
            piece.hasMoved = true;

            // Mise à jour logique du plateau
            to.piece = piece;
            from.piece = null;

            // Mise à jour visuelle (DOM)
            if (this.game.board.placePiece) {
                this.game.board.placePiece(piece, to);
                from.element.innerHTML = ''; 
            }
        }
    }

    /**
     * Nettoyage et changement de tour
     */
    finalizeSpecialMove(move, selectedPiece, isCastle) {
        const state = this.game.gameState;
        const color = selectedPiece.piece.color;

        // 1. Verrouillage des droits de roque
        if (isCastle || selectedPiece.piece.type === 'king') {
            if (state.castlingRights && state.castlingRights[color]) {
                state.castlingRights[color].kingside = false;
                state.castlingRights[color].queenside = false;
            }
        }

        // 2. Historique
        if (state.recordMove) {
            state.recordMove(selectedPiece.row, selectedPiece.col, move.row, move.col, selectedPiece.piece, null, move.type);
        }

        // 3. Finalisation du cycle
        state.switchPlayer();
        this.game.clearSelection();
        this.game.updateUI();
    }
}

window.SpecialMovesHandler = SpecialMovesHandler;
}