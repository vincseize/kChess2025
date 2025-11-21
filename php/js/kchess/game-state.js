// game-state.js - Gestion de l'état du jeu et historique AVEC ROQUE
class GameState {
    constructor() {
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.boardFlipped = false;
        this.gameStartTime = new Date();
        
        // DROITS DE ROQUE - NOUVEAU
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
    }

    recordMove(fromRow, fromCol, toRow, toCol, pieceInfo, promotion = null, specialMove = null) {
        if (!pieceInfo) {
            console.error('Informations de pièce manquantes pour l\'enregistrement');
            return null;
        }
        
        const moveNumber = Math.floor(this.moveHistory.length / 2) + 1;
        let notation = this.getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo, specialMove);
        
        // Ajouter la promotion dans la notation
        if (promotion) {
            const promotionSymbol = this.getPromotionSymbol(promotion);
            notation += `=${promotionSymbol}`;
        }
        
        // Mettre à jour les droits de roque si nécessaire
        this.updateCastlingRightsAfterMove(pieceInfo, fromRow, fromCol);
        
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
            specialMove: specialMove, // 'castle-kingside', 'castle-queenside', 'en-passant'
            isCheck: isCheck,
            timestamp: new Date(),
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights)) // Sauvegarde des droits
        };
        
        this.moveHistory.push(move);
        
        // Mettre à jour l'horloge des 50 coups
        this.updateHalfMoveClock(pieceInfo, toRow, toCol);
        
        // Mettre à jour le numéro de coup complet
        if (this.currentPlayer === 'black') {
            this.fullMoveNumber++;
        }
        
        // LOG DU PGN COMPLET
        this.logPGN();
        
        console.log('📝 Coup enregistré:', notation, isCheck ? '(ÉCHEC)' : '', specialMove ? `(${specialMove})` : '');
        return move;
    }

    // Mettre à jour les droits de roque après un coup
    updateCastlingRightsAfterMove(pieceInfo, fromRow, fromCol) {
        const color = pieceInfo.color;
        
        // Si le roi bouge, perdre tous les droits de roque pour cette couleur
        if (pieceInfo.type === 'king') {
            this.castlingRights[color].kingside = false;
            this.castlingRights[color].queenside = false;
            console.log(`♔ Roi ${color} a bougé - tous les roques désactivés`);
        }
        
        // Si une tour bouge, perdre le droit de roque de ce côté
        if (pieceInfo.type === 'rook') {
            const startRow = color === 'white' ? 7 : 0;
            
            // Tour côté roi (colonne 7/h)
            if (fromCol === 7 && fromRow === startRow) {
                this.castlingRights[color].kingside = false;
                console.log(`🏰 Tour côté roi ${color} a bougé - roque côté roi désactivé`);
            }
            
            // Tour côté dame (colonne 0/a)
            if (fromCol === 0 && fromRow === startRow) {
                this.castlingRights[color].queenside = false;
                console.log(`🏰 Tour côté dame ${color} a bougé - roque côté dame désactivé`);
            }
        }
        
        // Si une tour est capturée, vérifier si elle affecte les droits de roque
        // (Cette partie serait implémentée dans la logique de capture)
    }

    // Mettre à jour l'horloge des 50 coups
    updateHalfMoveClock(pieceInfo, toRow, toCol) {
        // Réinitialiser si coup de pion ou capture
        const targetSquare = window.chessGame?.board?.getSquare(toRow, toCol);
        const isCapture = targetSquare && targetSquare.piece && targetSquare.piece.color !== pieceInfo.color;
        
        if (pieceInfo.type === 'pawn' || isCapture) {
            this.halfMoveClock = 0;
            console.log('🕒 Horloge 50 coups réinitialisée');
        } else {
            this.halfMoveClock++;
        }
        
        console.log(`🕒 Horloge 50 coups: ${this.halfMoveClock}`);
    }

    // Obtenir la notation FEN pour les droits de roque
    getCastlingRightsFEN() {
        let fen = '';
        
        if (this.castlingRights.white.kingside) fen += 'K';
        if (this.castlingRights.white.queenside) fen += 'Q';
        if (this.castlingRights.black.kingside) fen += 'k';
        if (this.castlingRights.black.queenside) fen += 'q';
        
        return fen || '-';
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

    getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo, specialMove = null) {
        // NOTATION SPÉCIALE POUR LE ROQUE
        if (specialMove === 'castle-kingside') {
            return 'O-O'; // Petit roque
        }
        if (specialMove === 'castle-queenside') {
            return 'O-O-O'; // Grand roque
        }
        
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
            `[Result "${this.getGameResult()}"]`,
            ''
        ].join('\n');
        
        const moves = this.getPGN();
        
        return headers + moves + ' ' + this.getGameResult();
    }

    // Déterminer le résultat de la partie
    getGameResult() {
        // Pour l'instant, retourner "*" (partie en cours)
        // À compléter avec la logique d'échec et mat
        return '*';
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
        console.log(`🔄 Tour au joueur: ${this.currentPlayer}`);
        return this.currentPlayer;
    }

    resetGame() {
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.boardFlipped = false;
        this.gameStartTime = new Date();
        
        // Réinitialiser les droits de roque
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        
        console.log('🔄 PGN réinitialisé - droits de roque réactivés');
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
            startTime: this.gameStartTime,
            castlingRights: this.castlingRights,
            halfMoveClock: this.halfMoveClock,
            fullMoveNumber: this.fullMoveNumber
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
            specialMove: move.specialMove || null,
            timestamp: move.timestamp,
            castlingRights: move.castlingRights
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
        try {
            const currentFEN = FENGenerator.generateFEN(this, window.chessGame.board);
            const engine = new ChessEngine(currentFEN);
            
            // Vérifier l'échec et mat (à implémenter dans checkChessMat.js)
            // Pour l'instant, vérifier seulement l'échec
            const currentColor = this.currentPlayer === 'white' ? 'w' : 'b';
            const isInCheck = engine.isKingInCheck(currentColor);
            
            return {
                isOver: false, // À compléter avec la logique d'échec et mat
                result: null,
                reason: isInCheck ? 'check' : null
            };
            
        } catch (error) {
            console.error('❌ Erreur lors de la vérification de fin de partie:', error);
            return {
                isOver: false,
                result: null,
                reason: null
            };
        }
    }

    // Statistiques de la partie
    getGameStats() {
        const whiteMoves = this.moveHistory.filter(move => move.player === 'white');
        const blackMoves = this.moveHistory.filter(move => move.player === 'black');
        const castles = this.moveHistory.filter(move => move.specialMove && move.specialMove.includes('castle'));
        const enPassants = this.moveHistory.filter(move => move.specialMove === 'en-passant');
        
        return {
            totalMoves: this.moveHistory.length,
            whiteMoves: whiteMoves.length,
            blackMoves: blackMoves.length,
            checks: this.moveHistory.filter(move => move.isCheck).length,
            promotions: this.moveHistory.filter(move => move.promotion).length,
            castles: castles.length,
            enPassants: enPassants.length,
            gameDuration: this.getGameDuration(),
            currentPlayer: this.currentPlayer,
            castlingRights: this.castlingRights,
            halfMoveClock: this.halfMoveClock
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
            castlingRights: this.castlingRights,
            enPassantTarget: this.enPassantTarget,
            halfMoveClock: this.halfMoveClock,
            fullMoveNumber: this.fullMoveNumber,
            pgn: this.getFullPGN(),
            saveTime: new Date()
        };
        
        localStorage.setItem('chessGameSave', JSON.stringify(gameData));
        console.log('💾 Partie sauvegardée avec droits de roque:', this.castlingRights);
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
                this.castlingRights = gameData.castlingRights || {
                    white: { kingside: true, queenside: true },
                    black: { kingside: true, queenside: true }
                };
                this.enPassantTarget = gameData.enPassantTarget;
                this.halfMoveClock = gameData.halfMoveClock || 0;
                this.fullMoveNumber = gameData.fullMoveNumber || 1;
                
                console.log('📂 Partie chargée avec droits de roque:', this.castlingRights);
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

    // Vérifier si un roque est possible pour une couleur et un côté donnés
    canCastle(color, side) {
        return this.castlingRights[color] && this.castlingRights[color][side];
    }

    // Désactiver un roque spécifique
    disableCastle(color, side) {
        if (this.castlingRights[color]) {
            this.castlingRights[color][side] = false;
            console.log(`🚫 Roque ${side} désactivé pour ${color}`);
        }
    }

    // Obtenir le résumé des droits de roque
    getCastlingSummary() {
        return {
            white: {
                kingside: this.castlingRights.white.kingside ? 'O-O possible' : 'O-O impossible',
                queenside: this.castlingRights.white.queenside ? 'O-O-O possible' : 'O-O-O impossible'
            },
            black: {
                kingside: this.castlingRights.black.kingside ? 'O-O possible' : 'O-O impossible',
                queenside: this.castlingRights.black.queenside ? 'O-O-O possible' : 'O-O-O impossible'
            }
        };
    }
}

window.GameState = GameState;