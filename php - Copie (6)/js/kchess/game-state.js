// game-state.js - Gestion de l'état du jeu et historique
class GameState {
    constructor() {
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.boardFlipped = false;
    }

    recordMove(fromRow, fromCol, toRow, toCol, pieceInfo, promotion = null) {
        if (!pieceInfo) {
            console.error('Informations de pièce manquantes pour l\'enregistrement');
            return null;
        }
        
        const moveNumber = Math.floor(this.moveHistory.length / 2) + 1;
        let notation = this.getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo);
        
        // Ajouter la promotion dans la notation
        if (promotion) {
            const promotionSymbol = this.getPromotionSymbol(promotion);
            notation += `=${promotionSymbol}`;
        }
        
        const move = {
            number: moveNumber,
            player: this.currentPlayer,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            notation: notation,
            piece: pieceInfo.type,
            color: pieceInfo.color,
            promotion: promotion // ← NOUVEAU
        };
        
        this.moveHistory.push(move);
        return move;
    }

    getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo) {
        const fromFile = String.fromCharCode(97 + fromCol);
        const fromRank = 8 - fromRow;
        const toFile = String.fromCharCode(97 + toCol);
        const toRank = 8 - toRow;
        
        return `${fromFile}${fromRank}-${toFile}${toRank}`;
    }

    getPromotionSymbol(promotionType) {
        const symbols = {
            'queen': 'Q',
            'rook': 'R',
            'bishop': 'B',
            'knight': 'N'
        };
        return symbols[promotionType] || 'Q';
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        return this.currentPlayer;
    }

    resetGame() {
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.boardFlipped = false;
    }

    getGameStatus() {
        return {
            currentPlayer: this.currentPlayer,
            moveCount: this.moveHistory.length,
            isActive: this.gameActive,
            isFlipped: this.boardFlipped
        };
    }
}

window.GameState = GameState;