// checkChess.js - Moteur de vérification d'échec simple CORRIGÉ
class ChessEngine {
    constructor(fen) {
        this.fen = fen;
        this.board = this.parseFEN(fen);
        const parts = fen.split(' ');
        this.turn = parts[1]; // 'w' pour blanc, 'b' pour noir
        console.log('🔧 ChessEngine créé avec FEN:', fen);
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
        const king = color === 'w' ? 'K' : 'k';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === king) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    isSquareAttacked(row, col, attackerColor) {
        console.log(`\n🔍🔍🔍 Vérification case [${row},${col}] attaquée par ${attackerColor}`);
        
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

        console.log(`🎯 Directions d'attaque des pions ${attackerColor}:`, pawnAttacks);

        // Vérifier les pions
        for (const [dr, dc] of pawnAttacks) {
            const r = row + dr, c = col + dc;
            console.log(`  → Vérification case [${r},${c}] pour un pion ${attackerColor}`);
            
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                const pawn = attackerColor === 'w' ? 'P' : 'p';
                console.log(`    Pièce trouvée: '${piece}', attendu: '${pawn}'`);
                
                if (piece === pawn) {
                    console.log(`🎯✅✅✅ PION TROUVÉ! Pion ${attackerColor} attaque depuis [${r},${c}] vers [${row},${col}]`);
                    return true;
                } else {
                    console.log(`🎯❌ Pas de pion ${attackerColor} en [${r},${c}] (trouvé: '${piece}')`);
                }
            } else {
                console.log(`🎯❌ Case [${r},${c}] hors plateau`);
            }
        }

        // Vérifier les cavaliers
        for (const [dr, dc] of directions.knight) {
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                const knight = attackerColor === 'w' ? 'N' : 'n';
                if (piece === knight) {
                    console.log(`🐴 Cavalier ${attackerColor} attaque depuis [${r},${c}]`);
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
                                console.log(`🏰 ${type} ${attackerColor} attaque depuis [${r},${c}]`);
                                return true;
                            }
                            if (type === 'bishop' && (pieceType === 'b' || pieceType === 'q')) {
                                console.log(`🗼 ${type} ${attackerColor} attaque depuis [${r},${c}]`);
                                return true;
                            }
                            if (type === 'queen' && pieceType === 'q') {
                                console.log(`👑 ${type} ${attackerColor} attaque depuis [${r},${c}]`);
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

        console.log(`🔍❌❌❌ AUCUNE ATTAQUE détectée sur [${row},${col}]`);
        return false;
    }

    // Vérifie l'échec pour une couleur spécifique
    isKingInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) {
            console.log(`❌ Roi ${color} non trouvé!`);
            return false;
        }
        
        console.log(`\n♔♔♔ Vérification échec pour roi ${color} en [${kingPos.row},${kingPos.col}]`);
        const attackerColor = color === 'w' ? 'b' : 'w';
        const isInCheck = this.isSquareAttacked(kingPos.row, kingPos.col, attackerColor);
        
        console.log(`♔ Roi ${color} en [${kingPos.row},${kingPos.col}] - Échec: ${isInCheck}`);
        return isInCheck;
    }

    areKingsAdjacent() {
        const whiteKing = this.findKing('w');
        const blackKing = this.findKing('b');
        
        if (!whiteKing || !blackKing) return false;
        
        const rowDiff = Math.abs(whiteKing.row - blackKing.row);
        const colDiff = Math.abs(whiteKing.col - blackKing.col);
        
        // Les rois sont adjacents s'ils sont à 1 case de distance
        return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
    }

    // Compatibilité
    isCheck() {
        return this.isKingInCheck(this.turn);
    }

    // NOUVELLE MÉTHODE : Vérifier si une case spécifique est attaquée (pour debug)
    debugSquareAttacked(row, col, attackerColor) {
        console.log(`\n🔍🔍🔍 DEBUG: Case [${row},${col}] attaquée par ${attackerColor}?`);
        return this.isSquareAttacked(row, col, attackerColor);
    }

    // NOUVELLE MÉTHODE : Afficher le plateau complet
    displayBoard() {
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
}

window.ChessEngine = ChessEngine;