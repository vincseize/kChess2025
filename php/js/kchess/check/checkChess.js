// check/checkChess.js - Moteur de vérification d'échec simple CORRIGÉ
class ChessEngine {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('check/checkChess.js loaded');
        }
    }

    constructor(fen) {
        this.fen = fen;
        this.board = this.parseFEN(fen);
        const parts = fen.split(' ');
        this.turn = parts[1]; // 'w' pour blanc, 'b' pour noir
        
        if (this.constructor.consoleLog) {
            console.log('🔧 ChessEngine créé avec FEN:', fen);
            this.displayBoard(); // Afficher le plateau à la création
        }
    }

    parseFEN(fen) {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        const boardPart = fen.split(' ')[0];
        let row = 0, col = 0;
        
        for (const char of boardPart) {
            if (char === '/') {
                row++;
                col = 0;
            } else if (isNaN(char)) {
                board[row][col] = char;
                col++;
            } else {
                col += parseInt(char);
            }
        }
        return board;
    }

    getPiece(row, col) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
        return this.board[row][col];
    }

    findKing(color) {
        if (this.constructor.consoleLog) {
            console.log(`👑 Recherche du roi ${color === 'w' ? 'blanc' : 'noir'}`);
        }
        
        const king = color === 'w' ? 'K' : 'k';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === king) {
                    if (this.constructor.consoleLog) {
                        console.log(`👑✅ Roi ${color === 'w' ? 'blanc' : 'noir'} trouvé en [${row},${col}]`);
                    }
                    return { row, col };
                }
            }
        }
        
        if (this.constructor.consoleLog) {
            console.log(`👑❌ Roi ${color === 'w' ? 'blanc' : 'noir'} NON TROUVÉ!`);
        }
        return null;
    }

    isSquareAttacked(row, col, attackerColor) {
        if (this.constructor.consoleLog) {
            console.log(`\n🔍🔍🔍 Vérification case [${row},${col}] attaquée par ${attackerColor === 'w' ? 'blancs' : 'noirs'}`);
        }
        
        const directions = {
            rook: [[-1,0], [1,0], [0,-1], [0,1]],
            bishop: [[-1,-1], [-1,1], [1,-1], [1,1]],
            queen: [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]],
            knight: [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]]
        };

        // CORRECTION CRITIQUE : Système de coordonnées inversé
        // Pions blancs (en bas) attaquent vers le BAS (lignes croissantes)
        // Pions noirs (en haut) attaquent vers le HAUT (lignes décroissantes)
        const pawnAttacks = attackerColor === 'w' 
            ? [[1, -1], [1, 1]]   // Pions blancs attaquent vers le bas
            : [[-1, -1], [-1, 1]]; // Pions noirs attaquent vers le haut

        if (this.constructor.consoleLog) {
            console.log(`🎯 Directions d'attaque des pions ${attackerColor}:`, pawnAttacks);
        }

        // Vérifier les pions
        for (const [dr, dc] of pawnAttacks) {
            const r = row + dr, c = col + dc;
            
            if (this.constructor.consoleLog) {
                console.log(`  → Vérification case [${r},${c}] pour un pion ${attackerColor}`);
            }
            
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                const pawn = attackerColor === 'w' ? 'P' : 'p';
                
                if (this.constructor.consoleLog) {
                    console.log(`    Pièce trouvée: '${piece}', attendu: '${pawn}'`);
                }
                
                if (piece === pawn) {
                    if (this.constructor.consoleLog) {
                        console.log(`🎯✅✅✅ PION TROUVÉ! Pion ${attackerColor} attaque depuis [${r},${c}] vers [${row},${col}]`);
                    }
                    return true;
                } else {
                    if (this.constructor.consoleLog) {
                        console.log(`🎯❌ Pas de pion ${attackerColor} en [${r},${c}] (trouvé: '${piece}')`);
                    }
                }
            } else {
                if (this.constructor.consoleLog) {
                    console.log(`🎯❌ Case [${r},${c}] hors plateau`);
                }
            }
        }

        // Vérifier les cavaliers
        for (const [dr, dc] of directions.knight) {
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                const knight = attackerColor === 'w' ? 'N' : 'n';
                if (piece === knight) {
                    if (this.constructor.consoleLog) {
                        console.log(`🐴✅ Cavalier ${attackerColor} attaque depuis [${r},${c}]`);
                    }
                    return true;
                }
            }
        }

        // Vérifier les directions (tours, fous, dame)
        for (const [type, dirs] of [['rook', directions.rook], ['bishop', directions.bishop], ['queen', directions.queen]]) {
            for (const [dr, dc] of dirs) {
                let r = row + dr, c = col + dc;
                
                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const piece = this.getPiece(r, c);
                    if (piece) {
                        const pieceType = piece.toLowerCase();
                        const isAttackerColor = (attackerColor === 'w') === (piece === piece.toUpperCase());
                        
                        if (isAttackerColor) {
                            if (type === 'rook' && (pieceType === 'r' || pieceType === 'q')) {
                                if (this.constructor.consoleLog) {
                                    console.log(`🏰✅ ${type} ${attackerColor} attaque depuis [${r},${c}]`);
                                }
                                return true;
                            }
                            if (type === 'bishop' && (pieceType === 'b' || pieceType === 'q')) {
                                if (this.constructor.consoleLog) {
                                    console.log(`🗼✅ ${type} ${attackerColor} attaque depuis [${r},${c}]`);
                                }
                                return true;
                            }
                            if (type === 'queen' && pieceType === 'q') {
                                if (this.constructor.consoleLog) {
                                    console.log(`👑✅ ${type} ${attackerColor} attaque depuis [${r},${c}]`);
                                }
                                return true;
                            }
                        }
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            }
        }

        if (this.constructor.consoleLog) {
            console.log(`🔍❌❌❌ AUCUNE ATTAQUE détectée sur [${row},${col}]`);
        }
        return false;
    }

    // Vérifie l'échec pour une couleur spécifique
    isKingInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) {
            if (this.constructor.consoleLog) {
                console.log(`❌ Roi ${color} non trouvé!`);
            }
            return false;
        }
        
        if (this.constructor.consoleLog) {
            console.log(`\n♔♔♔ Vérification échec pour roi ${color === 'w' ? 'blanc' : 'noir'} en [${kingPos.row},${kingPos.col}]`);
        }
        
        const attackerColor = color === 'w' ? 'b' : 'w';
        const isInCheck = this.isSquareAttacked(kingPos.row, kingPos.col, attackerColor);
        
        if (this.constructor.consoleLog) {
            const pieceNotation = color === 'w' ? '♔' : '♚';
            const checkStatus = isInCheck ? 'EN ÉCHEC ⚠️' : 'sans échec ✓';
            console.log(`♔ ${pieceNotation} Roi ${color === 'w' ? 'blanc' : 'noir'} en [${kingPos.row},${kingPos.col}] - ${checkStatus}`);
        }
        
        return isInCheck;
    }

    areKingsAdjacent() {
        const whiteKing = this.findKing('w');
        const blackKing = this.findKing('b');
        
        if (!whiteKing || !blackKing) return false;
        
        const rowDiff = Math.abs(whiteKing.row - blackKing.row);
        const colDiff = Math.abs(whiteKing.col - blackKing.col);
        
        // Les rois sont adjacents s'ils sont à 1 case de distance
        const areAdjacent = rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
        
        if (this.constructor.consoleLog) {
            console.log(`👑↔️👑 Rois adjacents? Blanc[${whiteKing.row},${whiteKing.col}] ↔ Noir[${blackKing.row},${blackKing.col}] = ${areAdjacent ? 'OUI ⚠️' : 'NON ✓'}`);
        }
        
        return areAdjacent;
    }

    // Compatibilité
    isCheck() {
        const isCheck = this.isKingInCheck(this.turn);
        
        if (this.constructor.consoleLog) {
            console.log(`⚠️ Vérification échec pour ${this.turn === 'w' ? 'Blancs' : 'Noirs'} (tour actuel): ${isCheck ? 'EN ÉCHEC' : 'Pas d\'échec'}`);
        }
        
        return isCheck;
    }

    // NOUVELLE MÉTHODE : Vérifier si une case spécifique est attaquée (pour debug)
    debugSquareAttacked(row, col, attackerColor) {
        if (this.constructor.consoleLog) {
            console.log(`\n🔍🔍🔍 DEBUG: Case [${row},${col}] attaquée par ${attackerColor === 'w' ? 'blancs' : 'noirs'}?`);
        }
        return this.isSquareAttacked(row, col, attackerColor);
    }

    // NOUVELLE MÉTHODE : Afficher le plateau complet
    displayBoard() {
        if (!this.constructor.consoleLog) return;
        
        console.log('\n📊📊📊 PLATEAU COMPLET:');
        console.log('   a b c d e f g h');
        for (let row = 0; row < 8; row++) {
            let line = `${8 - row} `;
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                line += (piece || '.') + ' ';
            }
            console.log(line + ` ${8 - row}`);
        }
        console.log('   a b c d e f g h\n');
    }

    // NOUVELLE MÉTHODE : Vérifier les positions spécifiques
    checkSpecificPositions() {
        if (!this.constructor.consoleLog) return;
        
        console.log('\n📍📍📍 POSITIONS SPÉCIFIQUES:');
        console.log('Case f4 (roi blanc):', this.getPiece(4, 5), 'en [4,5]');
        console.log('Case e5 (pion noir):', this.getPiece(3, 4), 'en [3,4]');
        console.log('Case g5 (autre):', this.getPiece(3, 6), 'en [3,6]');
        console.log('Case d5 (autre):', this.getPiece(3, 3), 'en [3,3]');
        
        // Test des cases que le pion devrait attaquer
        console.log('\n🎯🎯🎯 TEST ATTAQUES PION:');
        console.log('Pion en [3,4] devrait attaquer [2,3] et [2,5]');
        console.log('Case [2,3] contient:', this.getPiece(2, 3));
        console.log('Case [2,5] contient:', this.getPiece(2, 5));
    }

    // NOUVELLE MÉTHODE : Obtenir un résumé du plateau
    getBoardSummary() {
        if (!this.constructor.consoleLog) return '';
        
        const summary = {
            turn: this.turn === 'w' ? 'Blancs' : 'Noirs',
            whiteKing: this.findKing('w'),
            blackKing: this.findKing('b'),
            whiteInCheck: this.isKingInCheck('w'),
            blackInCheck: this.isKingInCheck('b'),
            kingsAdjacent: this.areKingsAdjacent()
        };
        
        return summary;
    }

    // NOUVELLE MÉTHODE : Afficher le résumé
    displaySummary() {
        if (!this.constructor.consoleLog) return;
        
        console.log('\n📋📋📋 RÉSUMÉ DU PLATEAU:');
        const summary = this.getBoardSummary();
        
        console.log(`Tour actuel: ${summary.turn}`);
        console.log(`Roi blanc: ${summary.whiteKing ? `[${summary.whiteKing.row},${summary.whiteKing.col}]` : 'NON TROUVÉ'}`);
        console.log(`Roi noir: ${summary.blackKing ? `[${summary.blackKing.row},${summary.blackKing.col}]` : 'NON TROUVÉ'}`);
        console.log(`Échec blanc: ${summary.whiteInCheck ? 'OUI ⚠️' : 'NON ✓'}`);
        console.log(`Échec noir: ${summary.blackInCheck ? 'OUI ⚠️' : 'NON ✓'}`);
        console.log(`Rois adjacents: ${summary.kingsAdjacent ? 'OUI ⚠️' : 'NON ✓'}`);
    }
}

// Initialisation statique
ChessEngine.init();

window.ChessEngine = ChessEngine;