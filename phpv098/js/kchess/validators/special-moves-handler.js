/**
 * validators/special-moves-handler.js - Version 1.4.2
 * GESTIONNAIRE DES COUPS SPÉCIAUX (Roque, Prise en passant)
 * Intègre le système de logs unifié et la synchronisation avec appConfig.
 */

if (typeof window.SpecialMovesHandler !== 'undefined') {
    console.warn('⚠️ SpecialMovesHandler déjà chargé, skip.');
} else {

class SpecialMovesHandler {
    
    static VERSION = '1.4.2';
    static consoleLog = true;

    // ============================================
    // 1. SYSTÈME DE LOGS UNIFIÉ
    // ============================================
    static log(message, type = 'info', data = null) {
        if (!this.consoleLog && (type === 'info' || type === 'config')) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const icons = { 
            info: '🧩', success: '✅', warn: '⚠️', 
            error: '❌', action: '⚡', config: '⚙️' 
        };
        const icon = icons[type] || '⚪';
        
        console.log(`${icon} [SpecialMoves ${timestamp}] ${message}`);
        if (data && this.consoleLog) console.dir(data);
    }

    // ============================================
    // 2. CONSTRUCTEUR ET CONFIGURATION
    // ============================================
    constructor(game) {
        this.game = game;
        this.constructor.loadConfig();
        
        this.stats = {
            castles: { kingside: 0, queenside: 0 },
            enPassant: 0
        };
        
        this.constructor.log(`Initialisé v${this.constructor.VERSION}`, 'success');
    }

    static loadConfig() {
        try {
            const config = window.appConfig?.debug || window.appConfig?.chess_engine;
            if (config?.console_log !== undefined) {
                this.consoleLog = String(config.console_log).toLowerCase() !== "false";
            }
        } catch (e) {
            this.consoleLog = true;
        }
    }

    // ============================================
    // 3. ORCHESTRATION DES COUPS
    // ============================================
    handleSpecialMove(move, selectedPiece, toRow, toCol) {
        if (!move) return false;

        const type = move.type || move.special;
        
        // 1. GESTION DU ROQUE
        if (type === 'castling' || type === 'castle' || type === 'kingside' || type === 'queenside') {
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
        
        // Détection intelligente du côté
        const isKingside = move.isKingside || 
                           move.type?.includes('kingside') || 
                           move.special === 'kingside' ||
                           move.col === 6;

        const kingToCol = isKingside ? 6 : 2;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? 5 : 3;

        this.constructor.log(`🏰 Exécution Roque : ${isKingside ? 'Petit' : 'Grand'} (${color})`, 'action');

        // A. Déplacement logique et visuel du Roi
        this.movePieceInternal(row, 4, row, kingToCol);
        
        // B. Déplacement logique et visuel de la Tour
        this.movePieceInternal(row, rookFromCol, row, rookToCol);

        // C. Mise à jour des statistiques et finalisation
        this.stats.castles[isKingside ? 'kingside' : 'queenside']++;
        this.finalizeSpecialMove(move, selectedPiece, true);
    }

    /**
     * Déplace le pion et retire le pion adverse capturé
     */
    executeEnPassant(move, selectedPiece, toRow, toCol) {
        this.constructor.log('♟️ Exécution Prise en Passant', 'action');
        
        const direction = selectedPiece.piece.color === 'white' ? 1 : -1;
        const capturedPawnRow = toRow + direction; 
        
        // 1. Retrait visuel et logique du pion capturé
        const board = this.game.board || this.game.core?.board;
        const capturedSq = board.getSquare(capturedPawnRow, toCol);
        
        if (capturedSq) {
            capturedSq.piece = null;
            capturedSq.element.innerHTML = '';
            this.constructor.log(`Pion adverse retiré en ${capturedPawnRow},${toCol}`, 'info');
        }

        // 2. Déplacement du pion attaquant
        this.movePieceInternal(selectedPiece.row, selectedPiece.col, toRow, toCol);
        
        this.stats.enPassant++;
        this.finalizeSpecialMove(move, selectedPiece, false);
    }

    // ============================================
    // 4. MOTEUR DE TRANSFERT PHYSIQUE
    // ============================================
    movePieceInternal(fRow, fCol, tRow, tCol) {
        const board = this.game.board || this.game.core?.board;
        const from = board.getSquare(fRow, fCol);
        const to = board.getSquare(tRow, tCol);
        const piece = from.piece;

        if (piece) {
            // Mise à jour de l'objet pièce
            piece.row = tRow;
            piece.col = tCol;
            piece.hasMoved = true;

            // Transfert logique
            to.piece = piece;
            from.piece = null;

            // Transfert visuel (DOM)
            if (board.placePiece) {
                board.placePiece(piece, to);
                from.element.innerHTML = ''; 
            }
        }
    }

    /**
     * Nettoyage, changement de tour et mise à jour UI
     */
    finalizeSpecialMove(move, selectedPiece, isCastle) {
        const state = this.game.gameState || this.game.core?.gameState;
        const color = selectedPiece.piece.color;

        // 1. Verrouillage des droits de roque (Si le roi bouge, fini le roque)
        if (isCastle || selectedPiece.piece.type === 'king') {
            if (state.castlingRights && state.castlingRights[color]) {
                state.castlingRights[color].kingside = false;
                state.castlingRights[color].queenside = false;
            }
        }

        // 2. Enregistrement historique (Utilise SAN pour PGN propre)
        if (state.recordMove) {
            state.recordMove(
                selectedPiece.row, 
                selectedPiece.col, 
                move.row || move.toRow, 
                move.col || move.toCol, 
                selectedPiece.piece, 
                null, 
                move.type
            );
        }

        // 3. Finalisation du cycle de jeu
        state.switchPlayer();
        
        if (this.game.clearSelection) this.game.clearSelection();
        
        // Mise à jour globale (Badges, Historique, etc.)
        if (this.game.updateUI) {
            this.game.updateUI();
        } else if (window.updatePlayerLabels) {
            window.updatePlayerLabels();
        }
    }
}

window.SpecialMovesHandler = SpecialMovesHandler;
}