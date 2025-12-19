// core/fen-generator.js - Version simplifiée
class FENGenerator {
    static consoleLog = true;
    
    static init() {
        if (window.appConfig?.debug) {
            const configValue = window.appConfig.debug.console_log;
            if (configValue === "false" || configValue === false) this.consoleLog = false;
            else if (configValue === "true" || configValue === true) this.consoleLog = true;
            else this.consoleLog = Boolean(configValue);
        }
    }
    
    static generateFEN(gameState, board) {
        let fen = '';
        
        // 1. Position des pièces
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const square = board.getSquare(row, col);
                if (!square?.piece) emptyCount++;
                else {
                    if (emptyCount > 0) fen += emptyCount;
                    fen += this.getPieceChar(square.piece);
                    emptyCount = 0;
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (row < 7) fen += '/';
        }
        
        // 2. Tour actuel
        fen += gameState.currentPlayer === 'white' ? ' w' : ' b';
        
        // 3. Droits de roque
        fen += ' ' + this.generateCastlingRights(gameState, board);
        
        // 4. Case en passant
        fen += ' ' + (gameState.enPassantTarget || '-');
        
        // 5. Demi-coups
        fen += ' ' + (gameState.halfMoveClock || 0);
        
        // 6. Numéro du coup
        fen += ' ' + (Math.floor((gameState.moveHistory?.length || 0) / 2) + 1);
        
        // LOG DU RÉSULTAT FEN (conservé comme demandé)
        if (this.consoleLog) console.log(`✅ FEN généré: ${fen}`);
        
        return fen;
    }
    
    static generateCastlingRights(gameState, board) {
        let castling = '';
        if (this.canWhiteKingsideCastle(gameState, board)) castling += 'K';
        if (this.canWhiteQueensideCastle(gameState, board)) castling += 'Q';
        if (this.canBlackKingsideCastle(gameState, board)) castling += 'k';
        if (this.canBlackQueensideCastle(gameState, board)) castling += 'q';
        return castling || '-';
    }
    
    static canWhiteKingsideCastle(gameState, board) {
        if (gameState.hasKingMoved?.white) return false;
        const king = board.getSquare(7, 4)?.piece;
        const rook = board.getSquare(7, 7)?.piece;
        if (!king || king.type !== 'king' || king.color !== 'white') return false;
        if (!rook || rook.type !== 'rook' || rook.color !== 'white') return false;
        if (gameState.hasRookMoved?.white?.kingside) return false;
        if (board.getSquare(7, 5).piece || board.getSquare(7, 6).piece) return false;
        return true;
    }
    
    static canWhiteQueensideCastle(gameState, board) {
        if (gameState.hasKingMoved?.white) return false;
        const king = board.getSquare(7, 4)?.piece;
        const rook = board.getSquare(7, 0)?.piece;
        if (!king || king.type !== 'king' || king.color !== 'white') return false;
        if (!rook || rook.type !== 'rook' || rook.color !== 'white') return false;
        if (gameState.hasRookMoved?.white?.queenside) return false;
        if (board.getSquare(7, 1).piece || board.getSquare(7, 2).piece || board.getSquare(7, 3).piece) return false;
        return true;
    }
    
    static canBlackKingsideCastle(gameState, board) {
        if (gameState.hasKingMoved?.black) return false;
        const king = board.getSquare(0, 4)?.piece;
        const rook = board.getSquare(0, 7)?.piece;
        if (!king || king.type !== 'king' || king.color !== 'black') return false;
        if (!rook || rook.type !== 'rook' || rook.color !== 'black') return false;
        if (gameState.hasRookMoved?.black?.kingside) return false;
        if (board.getSquare(0, 5).piece || board.getSquare(0, 6).piece) return false;
        return true;
    }
    
    static canBlackQueensideCastle(gameState, board) {
        if (gameState.hasKingMoved?.black) return false;
        const king = board.getSquare(0, 4)?.piece;
        const rook = board.getSquare(0, 0)?.piece;
        if (!king || king.type !== 'king' || king.color !== 'black') return false;
        if (!rook || rook.type !== 'rook' || rook.color !== 'black') return false;
        if (gameState.hasRookMoved?.black?.queenside) return false;
        if (board.getSquare(0, 1).piece || board.getSquare(0, 2).piece || board.getSquare(0, 3).piece) return false;
        return true;
    }
    
    static getPieceChar(piece) {
        const pieces = {
            'white': { 'king': 'K', 'queen': 'Q', 'rook': 'R', 'bishop': 'B', 'knight': 'N', 'pawn': 'P' },
            'black': { 'king': 'k', 'queen': 'q', 'rook': 'r', 'bishop': 'b', 'knight': 'n', 'pawn': 'p' }
        };
        return pieces[piece.color][piece.type];
    }
    
    // Méthode utilitaire simplifiée pour simulation
    static generateFENForSimulation(board, currentPlayer) {
        let fen = this.generateBoardPart(board);
        fen += currentPlayer === 'white' ? ' w' : ' b';
        fen += ' ' + this.generateCastlingRightsForSimulation(board);
        fen += ' - 0 1';
        if (this.consoleLog) console.log(`✅ FEN simulation: ${fen}`);
        return fen;
    }
    
    static generateBoardPart(board) {
        let fen = '';
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const square = board.getSquare(row, col);
                if (!square?.piece) emptyCount++;
                else {
                    if (emptyCount > 0) fen += emptyCount;
                    fen += this.getPieceChar(square.piece);
                    emptyCount = 0;
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (row < 7) fen += '/';
        }
        return fen;
    }
    
    static generateCastlingRightsForSimulation(board) {
        let castling = '';
        if (board.getSquare(7, 4)?.piece?.type === 'king' && board.getSquare(7, 7)?.piece?.type === 'rook') castling += 'K';
        if (board.getSquare(7, 4)?.piece?.type === 'king' && board.getSquare(7, 0)?.piece?.type === 'rook') castling += 'Q';
        if (board.getSquare(0, 4)?.piece?.type === 'king' && board.getSquare(0, 7)?.piece?.type === 'rook') castling += 'k';
        if (board.getSquare(0, 4)?.piece?.type === 'king' && board.getSquare(0, 0)?.piece?.type === 'rook') castling += 'q';
        return castling || '-';
    }
}

FENGenerator.init();
window.FENGenerator = FENGenerator;
if (FENGenerator.consoleLog) console.log('✅ FENGenerator prêt');