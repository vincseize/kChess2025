// game-state.js - Version corrigée
class GameState {
    constructor() {
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.boardFlipped = false;
        this.gameStartTime = new Date();
        
        // Simple flag pour le flip
        this.urlColor = 'white';
        this.autoFlipDone = false;
        
        // Droits de roque
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        
        console.log('🎮 GameState initialisé');
    }
    
    // Mettre à jour depuis URL
    updateFromUrlParams(params) {
        this.urlColor = params.color || 'white';
        console.log(`🎯 GameState: urlColor = ${this.urlColor}`);
    }
    
    // Toggle flip - utilisé par ChessGame.flipBoard()
    toggleFlip() {
        this.boardFlipped = !this.boardFlipped;
        console.log(`🔄 GameState: boardFlipped = ${this.boardFlipped}`);
        return this.boardFlipped;
    }
    
    // Marquer le flip auto comme fait
    markAutoFlipDone() {
        this.autoFlipDone = true;
        console.log('✅ GameState: autoFlipDone = true');
    }
    
    // Méthodes existantes (conservées)
    recordMove(fromRow, fromCol, toRow, toCol, pieceInfo, promotion = null, specialMove = null) {
        if (!pieceInfo) {
            console.error('Informations de pièce manquantes');
            return null;
        }
        
        const moveNumber = Math.floor(this.moveHistory.length / 2) + 1;
        let notation = this.getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo, specialMove);
        
        if (promotion) {
            const promotionSymbol = this.getPromotionSymbol(promotion);
            notation += `=${promotionSymbol}`;
        }
        
        this.updateCastlingRightsAfterMove(pieceInfo, fromRow, fromCol);
        
        const isCheck = this.checkIfMoveCausesCheck();
        if (isCheck) {
            notation += '+';
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
            specialMove: specialMove,
            isCheck: isCheck,
            timestamp: new Date(),
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
            fen: FENGenerator.generateFEN(this, window.chessGame.board)
        };
        
        this.moveHistory.push(move);
        this.updateHalfMoveClock(pieceInfo, toRow, toCol);
        
        if (this.currentPlayer === 'black') {
            this.fullMoveNumber++;
        }
        
        console.log('📝 Coup enregistré:', notation);
        return move;
    }
    
    updateCastlingRightsAfterMove(pieceInfo, fromRow, fromCol) {
        const color = pieceInfo.color;
        
        if (pieceInfo.type === 'king') {
            this.castlingRights[color].kingside = false;
            this.castlingRights[color].queenside = false;
        }
        
        if (pieceInfo.type === 'rook') {
            const startRow = color === 'white' ? 7 : 0;
            
            if (fromCol === 7 && fromRow === startRow) {
                this.castlingRights[color].kingside = false;
            }
            
            if (fromCol === 0 && fromRow === startRow) {
                this.castlingRights[color].queenside = false;
            }
        }
    }
    
    updateHalfMoveClock(pieceInfo, toRow, toCol) {
        const targetSquare = window.chessGame?.board?.getSquare(toRow, toCol);
        const isCapture = targetSquare && targetSquare.piece && targetSquare.piece.color !== pieceInfo.color;
        
        if (pieceInfo.type === 'pawn' || isCapture) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }
    }
    
    checkIfMoveCausesCheck() {
        try {
            const currentFEN = FENGenerator.generateFEN(this, window.chessGame.board);
            const engine = new ChessEngine(currentFEN);
            const opponentColor = this.currentPlayer === 'white' ? 'b' : 'w';
            return engine.isKingInCheck(opponentColor);
        } catch (error) {
            console.error('❌ Erreur vérification échec:', error);
            return false;
        }
    }
    
    getAlgebraicNotation(fromRow, fromCol, toRow, toCol, pieceInfo, specialMove = null) {
        if (specialMove === 'castle-kingside') return 'O-O';
        if (specialMove === 'castle-queenside') return 'O-O-O';
        
        const fromFile = String.fromCharCode(97 + fromCol);
        const fromRank = 8 - fromRow;
        const toFile = String.fromCharCode(97 + toCol);
        const toRank = 8 - toRow;
        
        let pieceSymbol = '';
        if (pieceInfo.type !== 'pawn') {
            pieceSymbol = this.getPieceSymbol(pieceInfo.type);
        }
        
        return `${pieceSymbol}${fromFile}${fromRank}-${toFile}${toRank}`;
    }
    
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
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        console.log(`🔄 Tour au joueur: ${this.currentPlayer}`);
        return this.currentPlayer;
    }
    
    resetGame() {
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameActive = true;
        this.gameStartTime = new Date();
        
        // Réinitialiser les états de flip
        this.autoFlipDone = false;
        
        // Réinitialiser les droits de roque
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        
        console.log('🔄 Jeu réinitialisé');
    }
}

window.GameState = GameState;