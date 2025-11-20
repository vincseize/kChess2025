// game-state.js - Gestion de l'état du jeu et historique
class GameState {
    constructor() {
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.boardFlipped = false;
        this.gameStartTime = new Date();
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
        const isCheck = this.checkIfMoveCausesCheck();
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
            isCheck: isCheck,
            timestamp: new Date()
        };
        
        this.moveHistory.push(move);
        
        // LOG DU PGN COMPLET
        this.logPGN();
        
        console.log('📝 Coup enregistré:', notation, isCheck ? '(ÉCHEC)' : '');
        return move;
    }

    // MÉTHODE CORRIGÉE : Vérifier l'échec APRÈS le coup
    checkIfMoveCausesCheck() {
        try {
            // Utiliser le FEN actuel (qui inclut déjà le coup joué)
            const currentFEN = FENGenerator.generateFEN(this, window.chessGame.board);
            
            const engine = new ChessEngine(currentFEN);
            const opponentColor = this.currentPlayer === 'white' ? 'b' : 'w';
            const isCheck = engine.isKingInCheck(opponentColor);
            
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

    // Symboles des pièces
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

    // Log du PGN complet
    logPGN() {
        const pgn = this.getPGN();
        console.log('📜 PGN COMPLET:', pgn);
    }

    // Obtenir l'historique au format PGN
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

    // Obtenir le PGN avec en-tête
    getFullPGN() {
        const headers = [
            '[Event "Partie d\'échecs"]',
            '[Site "KChess"]',
            `[Date "${new Date().toISOString().split('T')[0]}"]`,
            '[Round "1"]',
            '[White "Joueur Blanc"]',
            '[Black "Joueur Noir"]',
            '[Result "*"]',
            ''
        ].join('\n');
        
        const moves = this.getPGN();
        
        return headers + moves + ' *';
    }

    // Obtenir le PGN formaté pour affichage
    getFormattedPGN() {
        const pgn = this.getPGN();
        const movePairs = pgn.split(' ');
        let formatted = '';
        
        for (let i = 0; i < movePairs.length; i++) {
            if (i > 0 && i % 3 === 0) {
                formatted += '\n';
            }
            formatted += movePairs[i] + ' ';
        }
        
        return formatted.trim();
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
        this.gameStartTime = new Date();
        console.log('🔄 PGN réinitialisé');
    }

    getGameStatus() {
        const gameDuration = Math.floor((new Date() - this.gameStartTime) / 1000);
        const minutes = Math.floor(gameDuration / 60);
        const seconds = gameDuration % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        return {
            currentPlayer: this.currentPlayer,
            moveCount: this.moveHistory.length,
            isActive: this.gameActive,
            isFlipped: this.boardFlipped,
            pgn: this.getPGN(),
            gameTime: formattedTime,
            startTime: this.gameStartTime
        };
    }

    // Obtenir l'historique formaté pour l'affichage
    getFormattedMoveHistory() {
        return this.moveHistory.map(move => ({
            number: move.number,
            player: move.player,
            notation: move.notation,
            piece: move.piece,
            from: `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row}`,
            to: `${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`,
            isCheck: move.isCheck || false,
            timestamp: move.timestamp
        }));
    }

    // Calculer le temps écoulé depuis le début de la partie
    getGameDuration() {
        const now = new Date();
        const diff = Math.floor((now - this.gameStartTime) / 1000); // en secondes
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Calculer le temps entre deux coups
    getMoveTime(moveIndex) {
        if (moveIndex === 0) {
            const firstMoveTime = this.moveHistory[0].timestamp;
            const diff = Math.floor((firstMoveTime - this.gameStartTime) / 1000);
            return `${diff}s`;
        }
        
        if (moveIndex > 0 && moveIndex < this.moveHistory.length) {
            const currentMove = this.moveHistory[moveIndex].timestamp;
            const previousMove = this.moveHistory[moveIndex - 1].timestamp;
            const diff = Math.floor((currentMove - previousMove) / 1000);
            return `${diff}s`;
        }
        
        return '0s';
    }

    // Exporter le PGN (téléchargement)
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

    // Vérifier si la partie est terminée (pour échec et mat futur)
    checkGameOver() {
        // À implémenter plus tard pour l'échec et mat
        return {
            isOver: false,
            result: null,
            reason: null
        };
    }

    // Statistiques de la partie
    getGameStats() {
        const whiteMoves = this.moveHistory.filter(move => move.player === 'white');
        const blackMoves = this.moveHistory.filter(move => move.player === 'black');
        
        return {
            totalMoves: this.moveHistory.length,
            whiteMoves: whiteMoves.length,
            blackMoves: blackMoves.length,
            checks: this.moveHistory.filter(move => move.isCheck).length,
            promotions: this.moveHistory.filter(move => move.promotion).length,
            gameDuration: this.getGameDuration(),
            currentPlayer: this.currentPlayer
        };
    }

    // Sauvegarder l'état de la partie
    saveGame() {
        const gameData = {
            currentPlayer: this.currentPlayer,
            moveHistory: this.moveHistory,
            gameActive: this.gameActive,
            boardFlipped: this.boardFlipped,
            gameStartTime: this.gameStartTime,
            pgn: this.getFullPGN(),
            saveTime: new Date()
        };
        
        localStorage.setItem('chessGameSave', JSON.stringify(gameData));
        console.log('💾 Partie sauvegardée');
        return gameData;
    }

    // Charger une partie sauvegardée
    loadGame() {
        try {
            const savedData = localStorage.getItem('chessGameSave');
            if (savedData) {
                const gameData = JSON.parse(savedData);
                
                this.currentPlayer = gameData.currentPlayer;
                this.moveHistory = gameData.moveHistory.map(move => ({
                    ...move,
                    timestamp: new Date(move.timestamp)
                }));
                this.gameActive = gameData.gameActive;
                this.boardFlipped = gameData.boardFlipped;
                this.gameStartTime = new Date(gameData.gameStartTime);
                
                console.log('📂 Partie chargée:', gameData);
                return true;
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement:', error);
        }
        return false;
    }

    // Effacer la sauvegarde
    clearSave() {
        localStorage.removeItem('chessGameSave');
        console.log('🗑️ Sauvegarde effacée');
    }
}

window.GameState = GameState;