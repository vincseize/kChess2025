// core/pieces.js - Définitions des pièces et leurs mouvements
class PieceManager {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('core/pieces.js loaded');
        }
    }

    constructor() {
        if (this.constructor.consoleLog) {
            console.log('\n🎨 [PieceManager] === INITIALISATION DES PIÈCES ===');
            console.log('🎨 [PieceManager] Création du gestionnaire de pièces...');
        }
        
        this.pieceSymbols = {
            white: {
                king: '<img src="img/chesspieces/wikipedia/wK.png" alt="Roi Blanc" class="chess-piece-img">',
                queen: '<img src="img/chesspieces/wikipedia/wQ.png" alt="Dame Blanche" class="chess-piece-img">',
                rook: '<img src="img/chesspieces/wikipedia/wR.png" alt="Tour Blanche" class="chess-piece-img">',
                bishop: '<img src="img/chesspieces/wikipedia/wB.png" alt="Fou Blanc" class="chess-piece-img">',
                knight: '<img src="img/chesspieces/wikipedia/wN.png" alt="Cavalier Blanc" class="chess-piece-img">',
                pawn: '<img src="img/chesspieces/wikipedia/wP.png" alt="Pion Blanc" class="chess-piece-img">'
            },
            black: {
                king: '<img src="img/chesspieces/wikipedia/bK.png" alt="Roi Noir" class="chess-piece-img">',
                queen: '<img src="img/chesspieces/wikipedia/bQ.png" alt="Dame Noire" class="chess-piece-img">',
                rook: '<img src="img/chesspieces/wikipedia/bR.png" alt="Tour Noire" class="chess-piece-img">',
                bishop: '<img src="img/chesspieces/wikipedia/bB.png" alt="Fou Noir" class="chess-piece-img">',
                knight: '<img src="img/chesspieces/wikipedia/bN.png" alt="Cavalier Noir" class="chess-piece-img">',
                pawn: '<img src="img/chesspieces/wikipedia/bP.png" alt="Pion Noir" class="chess-piece-img">'
            }
        };
        
        if (this.constructor.consoleLog) {
            console.log('✅ [PieceManager] Symboles de pièces chargés:');
            console.log('   • 6 types de pièces pour chaque couleur');
            console.log('   • Images: /img/chesspieces/wikipedia/');
            console.log('✅ [PieceManager] === INITIALISATION TERMINÉE ===\n');
        }
    }

    getSymbol(type, color) {
        if (this.constructor.consoleLog) {
            console.log(`♟️ [PieceManager] Demande symbole: ${type} (${color})`);
        }
        
        if (!this.pieceSymbols[color]) {
            if (this.constructor.consoleLog) {
                console.error(`❌ [PieceManager] Couleur invalide: ${color}`);
            }
            return '';
        }
        
        if (!this.pieceSymbols[color][type]) {
            if (this.constructor.consoleLog) {
                console.error(`❌ [PieceManager] Type de pièce invalide: ${type}`);
            }
            return '';
        }
        
        const symbol = this.pieceSymbols[color][type];
        
        if (this.constructor.consoleLog) {
            const fileName = symbol.match(/src="([^"]+)"/)?.[1] || 'inconnu';
            console.log(`✅ [PieceManager] Symbole trouvé: ${fileName}`);
        }
        
        return symbol;
    }

    getInitialPosition() {
        if (this.constructor.consoleLog) {
            console.log('\n🎲 [PieceManager] === POSITION INITIALE ===');
            console.log('🎲 [PieceManager] Création de la position initiale...');
        }
        
        const initialPosition = {
            // Pions noirs (rangée 1)
            ...this.createPieces('pawn', 'black', 1),
            // Pièces noires (rangée 0)
            ...this.createBackRow('black', 0),
            // Pions blancs (rangée 6)
            ...this.createPieces('pawn', 'white', 6),
            // Pièces blanches (rangée 7)
            ...this.createBackRow('white', 7)
        };
        
        if (this.constructor.consoleLog) {
            const totalPieces = Object.keys(initialPosition).length;
            const whitePieces = Object.values(initialPosition).filter(p => p.color === 'white').length;
            const blackPieces = Object.values(initialPosition).filter(p => p.color === 'black').length;
            
            console.log(`🎲 [PieceManager] Position initiale créée:`);
            console.log(`   • Total pièces: ${totalPieces}`);
            console.log(`   • Pièces blanches: ${whitePieces}`);
            console.log(`   • Pièces noires: ${blackPieces}`);
            console.log(`   • Configuration standard FEN`);
            console.log('🎲 [PieceManager] === POSITION TERMINÉE ===\n');
        }
        
        return initialPosition;
    }

    createPieces(type, color, row) {
        if (this.constructor.consoleLog) {
            console.log(`   🎨 [PieceManager] Création ${type}s ${color} en rangée ${row}...`);
        }
        
        const pieces = {};
        for (let col = 0; col < 8; col++) {
            const key = `${row}-${col}`;
            pieces[key] = { type, color };
            
            if (this.constructor.consoleLog && (col === 0 || col === 7)) {
                const file = String.fromCharCode(97 + col);
                const rank = 8 - row;
                console.log(`     ♟️ ${type.charAt(0).toUpperCase()} en ${file}${rank} (${color})`);
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`   ✅ [PieceManager] 8 ${type}s ${color} créés`);
        }
        
        return pieces;
    }

    createBackRow(color, row) {
        if (this.constructor.consoleLog) {
            console.log(`   🏰 [PieceManager] Création rangée de pièces ${color} en rangée ${row}...`);
        }
        
        const backRow = {
            [`${row}-0`]: { type: 'rook', color },
            [`${row}-1`]: { type: 'knight', color },
            [`${row}-2`]: { type: 'bishop', color },
            [`${row}-3`]: { type: 'queen', color },
            [`${row}-4`]: { type: 'king', color },
            [`${row}-5`]: { type: 'bishop', color },
            [`${row}-6`]: { type: 'knight', color },
            [`${row}-7`]: { type: 'rook', color }
        };
        
        if (this.constructor.consoleLog) {
            const rowName = color === 'white' ? '1' : '8';
            console.log(`   🏰 [PieceManager] Rangée ${rowName} (${color}):`);
            console.log(`     • a${rowName}: Tour (${backRow[`${row}-0`].type})`);
            console.log(`     • b${rowName}: Cavalier (${backRow[`${row}-1`].type})`);
            console.log(`     • c${rowName}: Fou (${backRow[`${row}-2`].type})`);
            console.log(`     • d${rowName}: Dame (${backRow[`${row}-3`].type})`);
            console.log(`     • e${rowName}: Roi (${backRow[`${row}-4`].type})`);
            console.log(`     • f${rowName}: Fou (${backRow[`${row}-5`].type})`);
            console.log(`     • g${rowName}: Cavalier (${backRow[`${row}-6`].type})`);
            console.log(`     • h${rowName}: Tour (${backRow[`${row}-7`].type})`);
        }
        
        return backRow;
    }
    
    // NOUVELLE MÉTHODE : Obtenir toutes les pièces disponibles
    getAllPiecesInfo() {
        const info = {
            white: Object.keys(this.pieceSymbols.white),
            black: Object.keys(this.pieceSymbols.black),
            totalTypes: 6,
            colors: ['white', 'black']
        };
        
        if (this.constructor.consoleLog) {
            console.log('📋 [PieceManager] Informations sur les pièces:', info);
        }
        
        return info;
    }
    
    // NOUVELLE MÉTHODE : Vérifier si un type de pièce existe
    isValidPieceType(type, color) {
        const isValid = this.pieceSymbols[color] && this.pieceSymbols[color][type] !== undefined;
        
        if (this.constructor.consoleLog) {
            console.log(`🔍 [PieceManager] Type ${type} (${color}) valide? ${isValid ? '✅ OUI' : '❌ NON'}`);
        }
        
        return isValid;
    }
    
    // NOUVELLE MÉTHODE : Obtenir l'emoji d'une pièce (pour debug)
    getPieceEmoji(type, color) {
        const emojis = {
            'king': { white: '♔', black: '♚' },
            'queen': { white: '♕', black: '♛' },
            'rook': { white: '♖', black: '♜' },
            'bishop': { white: '♗', black: '♝' },
            'knight': { white: '♘', black: '♞' },
            'pawn': { white: '♙', black: '♟' }
        };
        
        const emoji = emojis[type]?.[color] || '?';
        
        if (this.constructor.consoleLog) {
            console.log(`🎭 [PieceManager] Emoji pour ${type} (${color}): ${emoji}`);
        }
        
        return emoji;
    }
    
    // NOUVELLE MÉTHODE : Générer un tableau ASCII de la position initiale
    displayAsciiPosition() {
        if (!this.constructor.consoleLog) return;
        
        console.log('\n🎨 [PieceManager] === TABLEAU ASCII POSITION INITIALE ===');
        const initialPosition = this.getInitialPosition();
        
        console.log('   a b c d e f g h');
        for (let row = 0; row < 8; row++) {
            let rowStr = `${8 - row} `;
            for (let col = 0; col < 8; col++) {
                const piece = initialPosition[`${row}-${col}`];
                if (piece) {
                    const emoji = this.getPieceEmoji(piece.type, piece.color);
                    rowStr += emoji + ' ';
                } else {
                    rowStr += '. ';
                }
            }
            rowStr += ` ${8 - row}`;
            console.log(rowStr);
        }
        console.log('   a b c d e f g h');
        console.log('🎨 [PieceManager] === FIN TABLEAU ASCII ===\n');
    }
}

// Initialisation statique
PieceManager.init();

window.PieceManager = PieceManager;