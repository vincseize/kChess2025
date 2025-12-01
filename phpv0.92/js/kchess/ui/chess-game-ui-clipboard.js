// chess-game-ui-clipboard.js - Gestion de la copie FEN/PNG
class ChessClipboardManager {
    constructor(ui) {
        this.ui = ui;
    }

    copyFENToClipboard() {
        try {
            const fen = FENGenerator.generateFEN(this.ui.game.gameState, this.ui.game.board);
            navigator.clipboard.writeText(fen).then(() => {
                this.ui.showNotification('FEN copié dans le presse-papier !', 'success');
            }).catch(err => {
                console.error('Erreur copie FEN:', err);
                this.ui.showNotification('Erreur lors de la copie du FEN', 'error');
            });
        } catch (error) {
            console.error('Erreur génération FEN:', error);
            this.ui.showNotification('Erreur génération FEN', 'error');
        }
    }

    copyPGNToClipboard() {
        try {
            const pgn = this.ui.game.gameState.getFullPGN();
            navigator.clipboard.writeText(pgn).then(() => {
                this.ui.showNotification('PGN copié dans le presse-papier !', 'success');
            }).catch(err => {
                console.error('Erreur copie PGN:', err);
                this.ui.showNotification('Erreur lors de la copie du PGN', 'error');
            });
        } catch (error) {
            console.error('Erreur génération PGN:', error);
            this.ui.showNotification('Erreur génération PGN', 'error');
        }
    }
}