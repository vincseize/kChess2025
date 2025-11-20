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
        
        // VÉRIFIER SI LE COUP MET EN ÉCHEC (APRÈS le coup)
        const isCheck = this.checkIfMoveCausesCheck(toRow, toCol, pieceInfo);
        if (isCheck) {
            notation += '+';
            console.log('➕ Ajout du "+" pour échec');
        }
        
        const move = {
            number: moveNumber,
            player: this.currentPlayer,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            notation: notation,
            piece: pieceInfo.type,
            color: pieceInfo.color,
            promotion: promotion,
            isCheck: isCheck
        };
        
        this.moveHistory.push(move);
        
        // LOG DU PGN COMPLET
        this.logPGN();
        
        console.log('📝 Coup enregistré:', notation, isCheck ? '(ÉCHEC)' : '');
        return move;
    }

    // MÉTHODE CORRIGÉE : Vérifier l'échec APRÈS le coup
    checkIfMoveCausesCheck(toRow, toCol, pieceInfo) {
        try {
            // Utiliser le FEN actuel (qui inclut déjà le coup joué)
            const currentFEN = FENGenerator.generateFEN(this, window.chessGame.board);
            console.log('🎯 FEN pour vérification échec:', currentFEN);
            
            const engine = new ChessEngine(currentFEN);
            const opponentColor = this.currentPlayer === 'white' ? 'b' : 'w';
            const isCheck = engine.isKingInCheck(opponentColor);
            
            console.log('🔍 Vérification échec pour', opponentColor + ':', isCheck);
            return isCheck;
            
        } catch (error) {
            console.error('❌ Erreur lors de la vérification d\'échec:', error);
            return false;
        }
    }

    getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo) {
        const fromFile = String.fromCharCode(97 + fromCol);
        const fromRank = 8 - fromRow;
        const toFile = String.fromCharCode(97 + toCol);
        const toRank = 8 - toRow;
        
        // Notation améliorée avec symbole de pièce
        let pieceSymbol = '';
        if (pieceInfo.type !== 'pawn') {
            pieceSymbol = this.getPieceSymbol(pieceInfo.type);
        }
        
        return `${pieceSymbol}${fromFile}${fromRank}-${toFile}${toRank}`;
    }

    // NOUVELLE MÉTHODE : Symboles des pièces
    getPieceSymbol(pieceType) {
        const symbols = {
            'king': 'K',
            'queen': 'Q',
            'rook': 'R',
            'bishop': 'B',
            'knight': 'N'
        };
        return symbols[pieceType] || '';
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

    // NOUVELLE MÉTHODE : Log du PGN complet
    logPGN() {
        const pgn = this.getPGN();
        console.log('📜 PGN COMPLET:', pgn);
    }

    // MÉTHODE AMÉLIORÉE : Obtenir l'historique au format PGN
    getPGN() {
        let pgn = '';
        let movePairs = [];
        
        // Grouper les coups par paires (blancs + noirs)
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const whiteMove = this.moveHistory[i];
            const blackMove = this.moveHistory[i + 1];
            
            let movePair = `${whiteMove.number}. ${whiteMove.notation}`;
            if (blackMove) {
                movePair += ` ${blackMove.notation}`;
            }
            
            movePairs.push(movePair);
        }
        
        pgn = movePairs.join(' ');
        return pgn;
    }

    // NOUVELLE MÉTHODE : Obtenir le PGN avec en-tête
    getFullPGN() {
        const headers = [
            '[Event "Partie d\'échecs"]',
            '[Site "KChess"]',
            '[Date "' + new Date().toISOString().split('T')[0] + '"]',
            '[Round "1"]',
            '[White "Joueur Blanc"]',
            '[Black "Joueur Noir"]',
            '[Result "*"]',
            ''
        ].join('\n');
        
        const moves = this.getPGN();
        
        return headers + moves + ' *';
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
        console.log('🔄 PGN réinitialisé');
    }

    getGameStatus() {
        return {
            currentPlayer: this.currentPlayer,
            moveCount: this.moveHistory.length,
            isActive: this.gameActive,
            isFlipped: this.boardFlipped,
            pgn: this.getPGN() // ← Ajout du PGN dans le statut
        };
    }

    // NOUVELLE MÉTHODE : Obtenir l'historique formaté pour l'affichage
    getFormattedMoveHistory() {
        return this.moveHistory.map(move => ({
            number: move.number,
            player: move.player,
            notation: move.notation,
            piece: move.piece,
            from: `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row}`,
            to: `${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`,
            isCheck: move.isCheck || false
        }));
    }

    // NOUVELLE MÉTHODE : Exporter le PGN
    exportPGN() {
        const pgn = this.getFullPGN();
        console.log('💾 PGN à exporter:', pgn);
        
        // Créer un blob pour téléchargement
        const blob = new Blob([pgn], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `partie-${new Date().toISOString().split('T')[0]}.pgn`;
        a.click();
        URL.revokeObjectURL(url);
        
        return pgn;
    }
}

window.GameState = GameState;