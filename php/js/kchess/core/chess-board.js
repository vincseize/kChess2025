/**
 * ChessBoard - Affichage HTML de la position de jeu
 */
class ChessBoard {
    
    static consoleLog = false; 
    static initialized = false;

    /**
     * Initialisation statique du composant
     */
    static init() {
        this.loadConfig();
        this.initialized = true;
        
        if (this.consoleLog) {
            console.log('🚀 [ChessBoard] Système initialisé (Mode Debug)');
        } else {
            console.info('🔇 [ChessBoard] Système initialisé (Mode Silencieux)');
        }
    }

    /**
     * Charge la configuration depuis window.appConfig
     */
    static loadConfig() {
        try {
            let configValue = true;

            if (window.appConfig && window.appConfig.debug) {
                configValue = window.appConfig.debug.console_log;
            } else if (typeof window.getConfig === 'function') {
                configValue = window.getConfig('debug.console_log', true);
            }

            // Conversion stricte pour supporter JSON (string "false") et JS (boolean false)
            this.consoleLog = !(configValue === "false" || configValue === false);
            return true;
        } catch (error) {
            console.error('❌ [ChessBoard] Erreur config:', error);
            return false;
        }
    }

    /**
     * Logger centralisé pour ChessBoard
     */
    static log(message, data = null, type = 'log') {
        if (!this.consoleLog && type === 'log') return;
        
        const prefix = '♟️ [ChessBoard] ';
        if (data) {
            console[type](prefix + message, data);
        } else {
            console[type](prefix + message);
        }
    }

    // --- Méthodes d'instance ---

    constructor(gameState, pieceManager, position = new BoardPosition()) {
        this.gameState = gameState;
        this.pieceManager = pieceManager;
        this.position = position;
        this.squares = [];
        this.squareByPosition = Array.from({ length: 8 }, () => Array(8).fill(null));
        
        // Rafraîchir la config à l'instanciation
        this.constructor.loadConfig();
        
        ChessBoard.log('Plateau instancié', { gameState, pieceManager });
    }

    /**
     * Génère le plateau HTML
     */
    createBoard() {
        const boardElement = document.getElementById('chessBoard');
        if (!boardElement) {
            ChessBoard.log('Élément #chessBoard non trouvé', null, 'error');
            return;
        }

        const flipped = this.gameState.boardFlipped;
        boardElement.setAttribute('data-flipped', flipped);
        boardElement.innerHTML = '';
        this.squares = [];
        this.squareByPosition = Array.from({ length: 8 }, () => Array(8).fill(null));

        ChessBoard.log(`Construction : Mode ${flipped ? 'Retourné (Noir)' : 'Normal (Blanc)'}`);

        for (let displayRow = 0; displayRow < 8; displayRow++) {
            for (let displayCol = 0; displayCol < 8; displayCol++) {
                const { actualRow, actualCol } = this.getActualCoordinates(displayRow, displayCol);
                const squareData = this.createSquare(displayRow, displayCol, actualRow, actualCol);
                
                this.squares.push(squareData);
                this.squareByPosition[actualRow][actualCol] = squareData;
                boardElement.appendChild(squareData.element);
                this.renderPiece(squareData, this.getPiece(actualRow, actualCol));
            }
        }

        ChessBoard.log(`Plateau créé avec ${this.squares.length} cases`);
        this.displayBoardSummary();
    }

    /**
     * Gère la conversion des index selon l'orientation du plateau
     */
    getActualCoordinates(displayRow, displayCol) {
        const actualRow = this.gameState.boardFlipped ? 7 - displayRow : displayRow;
        const actualCol = this.gameState.boardFlipped ? 7 - displayCol : displayCol;
        return { actualRow, actualCol };
    }

    /**
     * Crée un élément d'affichage pour une case.
     */
    createSquare(displayRow, displayCol, actualRow, actualCol) {
        const isWhite = (actualRow + actualCol) % 2 === 0;
        const colorClass = isWhite ? 'white' : 'black';
        
        const squareElement = document.createElement('div');
        squareElement.className = `chess-square ${colorClass}`;
        
        // Datasets pour CSS et Logique
        Object.assign(squareElement.dataset, {
            row: actualRow,
            col: actualCol,
            displayRow: displayRow,
            displayCol: displayCol
        });

        this.addCoordinatesLabels(squareElement, actualRow, actualCol);

        return {
            element: squareElement,
            row: actualRow,
            col: actualCol
        };
    }

    /**
     * Ajoute les labels 'a-h' et '1-8' sur les bords du plateau
     */
    addCoordinatesLabels(squareElement, row, col) {
        const letters = 'abcdefgh';
        const numbers = '87654321';
        const isFlipped = this.gameState.boardFlipped;

        let hLabel = '', vLabel = '';

        // Logique de placement des labels selon l'orientation
        if (isFlipped) {
            if (row === 0) hLabel = letters[col];
            if (col === 7) vLabel = numbers[row];
        } else {
            if (row === 7) hLabel = letters[col];
            if (col === 0) vLabel = numbers[row];
        }

        if (hLabel) squareElement.dataset.coordHorizontal = hLabel;
        if (vLabel) squareElement.dataset.coordVertical = vLabel;
    }

    /**
     * Rend sur une case la pièce conservée dans BoardPosition.
     */
    renderPiece(squareData, piece) {
        if (!squareData) return;
        squareData.element.replaceChildren();
        if (!piece) return;

        const pieceElement = document.createElement('div');
        pieceElement.className = `chess-piece ${piece.color}`;
        
        // On récupère le chemin depuis la config globale
        const basePath = (window.appConfig && window.appConfig.piece_path) ? window.appConfig.piece_path : '';
        
        // Si on veut utiliser des images (ex: wP.png)
        // Note: Cette logique dépend de si votre pieceManager renvoie du texte ou si vous voulez forcer l'image
        if (basePath) {
            const imgName = `${piece.color[0]}${this.getPieceLetter(piece.type)}.png`;
            pieceElement.style.backgroundImage = `url('${basePath}${imgName}')`;
            pieceElement.style.backgroundSize = 'contain';
            pieceElement.style.backgroundRepeat = 'no-repeat';
        } else {
            // Repli sur le symbole texte si pas de chemin image
            pieceElement.innerHTML = this.pieceManager.getSymbol(piece.type, piece.color);
        }
        
        Object.assign(pieceElement.dataset, {
            pieceType: piece.type,
            pieceColor: piece.color
        });

        squareData.element.appendChild(pieceElement);
    }

    setPiece(row, col, piece) {
        this.position.setPiece(row, col, piece);
        this.renderPiece(this.getSquare(row, col), piece);
    }

    getPiece(row, col) {
        return this.position.getPiece(row, col);
    }

    placePiece(piece, squareData) {
        if (!squareData) return;
        this.setPiece(squareData.row, squareData.col, piece);
    }

    // Utilitaire pour transformer 'pawn' en 'P', 'knight' en 'N', etc.
    getPieceLetter(type) {
        const map = { 'pawn': 'P', 'knight': 'N', 'bishop': 'B', 'rook': 'R', 'queen': 'Q', 'king': 'K' };
        return map[type] || 'P';
    }

    /**
     * Récupère les données d'une case par ses coordonnées réelles
     */
    getSquare(row, col) {
        if (!this.position.isValidSquare(row, col)) return null;
        return this.squareByPosition[row][col];
    }

    /**
     * Vide le plateau
     */
    clearBoard() {
        this.position.clear();
        this.squares.forEach(square => this.renderPiece(square, null));
        ChessBoard.log('Plateau vidé', null, 'info');
    }

    // --- Utilitaires de Debug ---

    displayBoardSummary() {
        if (!this.constructor.consoleLog) return;

        const stats = this.squares.reduce((acc, sq) => {
            const piece = this.getPiece(sq.row, sq.col);
            if (piece) {
                const color = piece.color;
                acc[color] = (acc[color] || 0) + 1;
                acc.total++;
            }
            return acc;
        }, { white: 0, black: 0, total: 0 });

        console.table({
            "Flipped": this.gameState.boardFlipped,
            "Total Pièces": stats.total,
            "Blancs": stats.white,
            "Noirs": stats.black
        });
    }

    displayCoordinatesGrid() {
        if (!this.constructor.consoleLog) return;
        
        let grid = "";
        for (let r = 0; r < 8; r++) {
            let rowStr = `${8-r} | `;
            for (let c = 0; c < 8; c++) {
                const p = this.getPiece(r, c);
                rowStr += p ? ` ${p.type[0]} ` : " . ";
            }
            grid += rowStr + "\n";
        }
        grid += "    -----------------------\n      a  b  c  d  e  f  g  h";
        console.log("%cGrille actuelle :\n" + grid, "font-family: monospace; color: #4CAF50;");
    }
}

// Initialisation au chargement
ChessBoard.init();
window.ChessBoard = ChessBoard;

// Bridge de debug pour la console navigateur
window.ChessBoardUtils = {
    reload: () => ChessBoard.loadConfig(),
    status: () => ({
        debug: ChessBoard.consoleLog,
        source: window.appConfig ? 'Config JSON' : 'Defaults'
    }),
    grid: () => {
        const instance = window.chessGame?.board; // Ajustez selon votre instance globale
        if (instance) instance.displayCoordinatesGrid();
    }
};