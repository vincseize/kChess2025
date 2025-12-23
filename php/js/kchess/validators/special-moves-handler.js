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
            enPassant: 0,
            promotions: 0
        };
    }

    /**
     * Point d'entrée principal : aiguille vers le bon mouvement spécial
     */
    handleSpecialMove(move, selectedPiece, fromSquare, toSquare, toRow, toCol) {
        if (!move) return false;

        if (this.constructor.consoleLog) {
            console.log(`✨ Coup spécial détecté : ${move.type || move.special}`);
        }

        // 1. GESTION DU ROQUE
        // Note: move.special est utilisé par certains validateurs, move.type par d'autres
        if (move.special === 'castle' || move.type === 'castling') {
            this.executeCastle(move, selectedPiece);
            const side = move.type.includes('kingside') ? 'kingside' : 'queenside';
            this.stats.castles[side]++;
            return true;
        }

        // 2. GESTION DE LA PRISE EN PASSANT
        if (move.type === 'en-passant') {
            this.executeEnPassant(move, selectedPiece, toRow, toCol);
            this.stats.enPassant++;
            return true;
        }

        return false;
    }

    /**
     * Exécute le roque : déplace à la fois le Roi et la Tour
     */
    executeCastle(move, selectedPiece) {
        const color = selectedPiece.piece.color;
        const row = color === 'white' ? 7 : 0;
        const isKingside = move.type.includes('kingside');

        // Positions cibles pour le Roque
        const kingToCol = isKingside ? 6 : 2;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? 5 : 3;

        // A. Déplacement du Roi (de [row, 4] vers sa nouvelle case)
        this.movePieceInternal(row, 4, row, kingToCol);
        
        // B. Déplacement de la Tour (du coin vers sa nouvelle case)
        this.movePieceInternal(row, rookFromCol, row, rookToCol);

        if (this.constructor.consoleLog) {
            console.log(`🏰 Roque ${isKingside ? 'Petit' : 'Grand'} effectué (${color})`);
        }

        this.finalizeSpecialMove(move, selectedPiece, true);
    }

    /**
     * Exécute la prise en passant
     */
    executeEnPassant(move, selectedPiece, toRow, toCol) {
        // 1. Suppression du pion adverse capturé (derrière la case d'arrivée)
        if (this.game.moveValidator && this.game.moveValidator.executeEnPassant) {
            this.game.moveValidator.executeEnPassant(move);
        }
        
        // 2. Déplacement physique du pion attaquant
        this.movePieceInternal(selectedPiece.row, selectedPiece.col, toRow, toCol);
        
        this.finalizeSpecialMove(move, selectedPiece, false);
    }

    /**
     * Transfert physique de l'élément DOM et mise à jour de la donnée logique
     */
    movePieceInternal(fRow, fCol, tRow, tCol) {
        const from = this.game.board.getSquare(fRow, fCol);
        const to = this.game.board.getSquare(tRow, tCol);
        const pieceElem = from.element.querySelector('.chess-piece');

        if (pieceElem) {
            to.element.innerHTML = '';
            to.element.appendChild(pieceElem);
            to.piece = from.piece;
            from.piece = null;
            from.element.innerHTML = ''; // Nettoyage DOM
        }
    }

    /**
     * Finalisation : Mise à jour des droits, enregistrement et switch de tour
     */
    finalizeSpecialMove(move, selectedPiece, isCastle) {
        const color = selectedPiece.piece.color;

        // Mise à jour des droits de roque dans le State
        if (isCastle || selectedPiece.piece.type === 'king') {
            const state = this.game.gameState;
            if (state.hasKingMoved) {
                state.hasKingMoved[color] = true;
            }
            // Réinitialisation des droits pour cette couleur
            if (state.castlingRights) {
                state.castlingRights[color] = { kingside: false, queenside: false };
            }
        }

        // Enregistrement dans l'historique
        this.game.gameState.recordMove(
            selectedPiece.row, selectedPiece.col, 
            move.row, move.col, 
            selectedPiece.piece, 
            null, 
            move.type
        );

        // Terminer le tour
        this.game.gameState.switchPlayer();
        this.game.clearSelection(); // Important pour nettoyer les points bleus
        this.game.updateUI();
    }
}

window.SpecialMovesHandler = SpecialMovesHandler;
}