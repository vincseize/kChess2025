/**
 * ChessBoard - Gestion de l'affichage physique et de la grille du jeu
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
            // Par défaut, on reste sur false
            let configValue = false; 

            if (window.appConfig && window.appConfig.debug) {
                configValue = window.appConfig.debug.console_log;
            } else if (typeof window.getConfig === 'function') {
                // Ici, on passe 'false' en valeur de secours (3ème argument)
                configValue = window.getConfig('debug.console_log', false);
            }

            // Conversion stricte
            // On n'active le log QUE si on a explicitement le booléen true ou la string "true"
            this.consoleLog = (configValue === true || configValue === "true");
            
            return true;
        } catch (error) {
            // En cas d'erreur, on reste silencieux
            this.consoleLog = false;
            return false;
        }
    }

    /**
     * Logger centralisé pour ChessBoard
     */
    static log(message, data = null, type = 'log') {
        // Si les logs sont désactivés, on bloque TOUT (log, info, warn, etc.)
        if (!this.consoleLog) return; 
        
        const prefix = '♟️ [ChessBoard] ';
        if (data) {
            console[type](prefix + message, data);
        } else {
            console[type](prefix + message);
        }
    }

    // --- Méthodes d'instance ---

    constructor(gameState, pieceManager) {
        this.gameState = gameState;
        this.pieceManager = pieceManager;
        this.squares = [];
        
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

        ChessBoard.log(`Construction : Mode ${flipped ? 'Retourné (Noir)' : 'Normal (Blanc)'}`);

        for (let displayRow = 0; displayRow < 8; displayRow++) {
            for (let displayCol = 0; displayCol < 8; displayCol++) {
                const { actualRow, actualCol } = this.getActualCoordinates(displayRow, displayCol);
                const squareData = this.createSquare(displayRow, displayCol, actualRow, actualCol);
                
                this.squares.push(squareData);
                boardElement.appendChild(squareData.element);
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
     * Crée une case individuelle (DOM + Données)
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

        const squareData = {
            element: squareElement,
            row: actualRow,
            col: actualCol,
            piece: null
        };

        // Référence circulaire utile pour les événements au clic
        squareElement.__squareData = squareData;
        
        return squareData;
    }

    /**
     * Ajoute les labels 'a-h' et '1-8' à l'intérieur des cases stratégiques
     */
    addCoordinatesLabels(squareElement, row, col) {
        const letters = 'abcdefgh';
        const numbers = '87654321';
        const isFlipped = this.gameState.boardFlipped;

        // 1. On injecte systématiquement les coordonnées dans le dataset de la case
        // Cela permet au CSS d'y accéder via attr(data-file) et attr(data-rank)
        squareElement.dataset.file = letters[col];
        squareElement.dataset.rank = numbers[row];

        // 2. Logique d'affichage visuel (Classes CSS)
        // On ne veut afficher les labels que sur les bords du plateau
        if (!isFlipped) {
            // Vue BLANCS : Chiffres sur la colonne 'a' (col 0), Lettres sur la rangée '1' (row 7)
            if (col === 0) squareElement.classList.add('coord-rank');
            if (row === 7) squareElement.classList.add('coord-file');
        } else {
            // Vue NOIRS : Chiffres sur la colonne 'h' (col 7), Lettres sur la rangée '8' (row 0)
            if (col === 7) squareElement.classList.add('coord-rank');
            if (row === 0) squareElement.classList.add('coord-file');
        }
    }
    
    /**
     * Place visuellement une pièce sur une case (Support Texte ou Image)
     */
    placePiece(piece, squareData) {
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
        squareData.piece = piece;
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
        return this.squares.find(s => s.row === row && s.col === col) || null;
    }

    /**
     * Vide le plateau
     */
    clearBoard() {
        this.squares.forEach(sq => {
            sq.element.innerHTML = '';
            sq.piece = null;
        });
        ChessBoard.log('Plateau vidé', null, 'info');
    }

    // --- Utilitaires de Debug ---

    displayBoardSummary() {
        if (!this.constructor.consoleLog) return;

        const stats = this.squares.reduce((acc, sq) => {
            if (sq.piece) {
                const color = sq.piece.color;
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
                const p = this.getSquare(r, c)?.piece;
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