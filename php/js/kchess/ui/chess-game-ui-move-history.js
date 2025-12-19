// ui/chess-game-ui-move-history.js - Gestion de l'historique des coups
class ChessMoveHistoryManager {
    
    static consoleLog = true; 
    
    static init() {
        this.loadConfig();
        this.log('Système de log initialisé', 'info');
    }
    
    // --- Système de Log Centralisé ---
    static log(message, type = 'log', data = null) {
        if (!this.consoleLog && type !== 'error' && type !== 'warn') return;
        
        const prefix = `📋 [MoveHistory]`;
        const output = data ? `${message} |` : message;
        
        switch(type) {
            case 'error': console.error(`${prefix} ❌ ${output}`, data || ''); break;
            case 'warn':  console.warn(`${prefix} ⚠️ ${output}`, data || ''); break;
            case 'info':  console.info(`${prefix} ℹ️ ${output}`, data || ''); break;
            default:      console.log(`${prefix} ${output}`, data || '');
        }
    }

    static loadConfig() {
        try {
            if (window.appConfig?.debug) {
                const val = window.appConfig.debug.console_log;
                this.consoleLog = (val === "true" || val === true);
                return true;
            }
            if (typeof window.getConfig === 'function') {
                const val = window.getConfig('debug.console_log', 'true');
                this.consoleLog = (val !== "false" && val !== false);
                return true;
            }
        } catch (error) {
            this.log('Erreur chargement config', 'error', error);
        }
        return false;
    }

    constructor(ui) {
        this.ui = ui;
        this.constructor.loadConfig();
        this.constructor.log('Initialisation de l\'instance', 'log', { ui_present: !!ui });
    }

    updateMoveHistory() {
        this.constructor.log('Mise à jour de l\'historique...');
        
        const moveHistoryElement = document.getElementById('moveHistory');
        if (!moveHistoryElement) {
            this.constructor.log('Élément #moveHistory introuvable', 'error');
            return;
        }
        
        const moves = this.ui.game.gameState.moveHistory;
        moveHistoryElement.innerHTML = '';
        moveHistoryElement.className = 'move-history-container';
        
        if (moves.length === 0) {
            moveHistoryElement.innerHTML = '<div class="text-center text-muted small p-3">Aucun coup joué</div>';
            return;
        }

        for (let i = 0; i < moves.length; i += 2) {
            const moveRowElement = document.createElement('div');
            moveRowElement.className = 'move-row';
            
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = moves[i];
            const blackMove = moves[i + 1];
            
            moveRowElement.addEventListener('click', () => this.selectMoveRow(moveRowElement, i, moveNumber));
            
            let moveHTML = `<span class="move-number">${moveNumber}.</span>`;
            if (whiteMove) moveHTML += `<span class="white-move">${this.getMoveNotation(whiteMove)}</span>`;
            if (blackMove) moveHTML += `<span class="black-move">${this.getMoveNotation(blackMove)}</span>`;
            
            moveRowElement.innerHTML = moveHTML;
            moveHistoryElement.appendChild(moveRowElement);
        }
        
        moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
        this.constructor.log('Historique mis à jour', 'log', { total_moves: moves.length });
    }

    selectMoveRow(rowElement, startIndex, moveNumber) {
        document.querySelectorAll('.move-row').forEach(row => row.classList.remove('selected'));
        rowElement.classList.add('selected');
        
        this.constructor.log(`Ligne ${moveNumber} sélectionnée`, 'log', { 
            index: startIndex 
        });
    }

    getMoveNotation(move) {
        if (!move) return '';
        if (move.notation) return move.notation;
        
        const pieceSymbol = this.getPieceSymbol(move.piece);
        const toSquare = this.coordinatesToAlgebraic(move.to.row, move.to.col);
        let notation = '';

        if (move.piece.toLowerCase() === 'pawn') {
            const fromSquare = this.coordinatesToAlgebraic(move.from.row, move.from.col);
            notation = move.captured ? `${fromSquare.charAt(0)}x${toSquare}` : toSquare;
        } else if (move.piece.toLowerCase() === 'king' && Math.abs(move.to.col - move.from.col) === 2) {
            notation = move.to.col > move.from.col ? 'O-O' : 'O-O-O';
        } else {
            notation = move.captured ? `${pieceSymbol}x${toSquare}` : `${pieceSymbol}${toSquare}`;
        }
        
        return notation;
    }

    coordinatesToAlgebraic(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return '??';
        return ['a','b','c','d','e','f','g','h'][col] + ['8','7','6','5','4','3','2','1'][row];
    }

    getPieceSymbol(pieceType) {
        const symbols = { 'king':'K', 'queen':'Q', 'rook':'R', 'bishop':'B', 'knight':'N', 'pawn':'' };
        return symbols[pieceType?.toLowerCase()] || '';
    }
}

// Initialisation
ChessMoveHistoryManager.init();
window.ChessMoveHistoryManager = ChessMoveHistoryManager;