// js/kchess/core/game-status-fix.js - VERSION FINALE CORRIGÉE
// CORRECTION DÉFINITIVE POUR L'ORDRE ÉCHEC/MAT

class GameStatusFix {
    
    static VERSION = '1.0.4';
    static isApplied = false;
    static debug = true;
    
    static init() {
        if (this.debug) {
            console.log(`🔧 GameStatusFix v${this.VERSION}: Initialisation`);
        }
        
        // Attendre un peu que tout soit chargé
        setTimeout(() => {
            this.applyFix();
        }, 2000);
    }
    
    static applyFix() {
        if (this.isApplied) {
            if (this.debug) console.log('✅ Déjà appliqué');
            return;
        }
        
        if (this.debug) console.log('🔄 Application correction ordre échec/mat...');
        
        // 1. Trouver ou créer le GameStatusManager
        this.ensureGameStatusManagerExists();
        
        // 2. S'assurer que la méthode updateGameStatus est patchée
        this.patchUpdateGameStatus();
        
        // 3. Ajouter des méthodes utilitaires
        this.addUtilityMethods();
        
        this.isApplied = true;
        
        if (this.debug) {
            console.log('✅✅✅ Correction appliquée avec succès');
            console.log('💡 Testez avec: testCheckmateBug()');
        }
    }
    
    static ensureGameStatusManagerExists() {
        if (this.debug) console.log('🔍 Vérification GameStatusManager...');
        
        // Si chessGame n'existe pas encore, on ne peut rien faire
        if (!window.chessGame) {
            console.warn('⚠️ chessGame non disponible, report du fix');
            return;
        }
        
        // Vérifier si un gameStatusManager existe quelque part
        let manager = null;
        
        // Chercher à différents endroits
        const locations = [
            () => window.chessGame.gameStatusManager,
            () => window.chessGame.core?.gameStatusManager,
            () => window.chessGame.ui?.gameStatusManager,
            () => window.chessGame._gameStatusManager,
            () => {
                // Chercher par nom dans toutes les propriétés
                for (const key in window.chessGame) {
                    if (key.toLowerCase().includes('status') && 
                        window.chessGame[key] && 
                        typeof window.chessGame[key].updateGameStatus === 'function') {
                        return window.chessGame[key];
                    }
                }
                return null;
            }
        ];
        
        for (const location of locations) {
            try {
                manager = location();
                if (manager) break;
            } catch (e) {
                // Continuer
            }
        }
        
        if (manager) {
            if (this.debug) console.log('📍 GameStatusManager existant trouvé');
            
            // Sauvegarder la méthode originale
            if (!manager._originalUpdateGameStatus && typeof manager.updateGameStatus === 'function') {
                manager._originalUpdateGameStatus = manager.updateGameStatus.bind(manager);
            }
            
            window._gameStatusManager = manager;
        } else {
            if (this.debug) console.log('🔧 Création d\'un GameStatusManager');
            
            // Créer un manager minimal
            manager = {
                chessGame: window.chessGame,
                updateGameStatus: function() {
                    return GameStatusFix.updateGameStatusImplementation(this);
                }
            };
            
            window._gameStatusManager = manager;
            
            // L'attacher à chessGame
            if (!window.chessGame.gameStatusManager) {
                window.chessGame.gameStatusManager = manager;
            }
        }
        
        // S'assurer que le manager a toutes les méthodes nécessaires
        this.ensureManagerMethods(manager);
    }
    
    static ensureManagerMethods(manager) {
        const requiredMethods = [
            'determineGameStatus',
            'processGameStatus', 
            'cleanHighlights',
            'showGameNotification'
        ];
        
        requiredMethods.forEach(methodName => {
            if (!manager[methodName]) {
                if (this.debug) console.log(`➕ Ajout méthode: ${methodName}`);
                
                switch(methodName) {
                    case 'determineGameStatus':
                        manager[methodName] = function(fen, player) {
                            return GameStatusFix.determineGameStatusImplementation(fen, player);
                        };
                        break;
                        
                    case 'processGameStatus':
                        manager[methodName] = function(status, currentPlayer) {
                            return GameStatusFix.processGameStatusImplementation(this, status, currentPlayer);
                        };
                        break;
                        
                    case 'cleanHighlights':
                        manager[methodName] = function() {
                            return GameStatusFix.cleanHighlightsImplementation(this);
                        };
                        break;
                        
                    case 'showGameNotification':
                        manager[methodName] = function(message, type = 'info') {
                            return GameStatusFix.showGameNotificationImplementation(message, type);
                        };
                        break;
                }
            }
        });
    }
    
    static patchUpdateGameStatus() {
        if (!window._gameStatusManager) return;
        
        const manager = window._gameStatusManager;
        
        // Remplacer updateGameStatus par notre implémentation
        manager.updateGameStatus = function() {
            return GameStatusFix.updateGameStatusImplementation(this);
        };
        
        if (this.debug) {
            console.log('✅ updateGameStatus patchée');
            console.log('Méthodes disponibles:', Object.keys(manager).filter(k => typeof manager[k] === 'function'));
        }
    }
    
    static updateGameStatusImplementation(manager) {
        if (GameStatusFix.debug) {
            console.log('\n🔍 GameStatusFix: Vérification avec ordre correct');
        }
        
        try {
            // Nettoyer les surbrillances
            if (manager.cleanHighlights) {
                manager.cleanHighlights();
            }
            
            // Obtenir FEN actuel
            const fen = this.getCurrentFEN(manager);
            const player = this.getCurrentPlayer(manager);
            
            if (!fen || !player) {
                if (GameStatusFix.debug) console.warn('⚠️ Impossible d\'obtenir FEN ou joueur');
                
                // Appeler l'original si elle existe
                if (manager._originalUpdateGameStatus) {
                    return manager._originalUpdateGameStatus();
                }
                return;
            }
            
            const fenPlayer = player === 'white' ? 'w' : 'b';
            
            if (GameStatusFix.debug) {
                console.log(`📊 Tour: ${player} (${fenPlayer})`);
                console.log(`📄 FEN: ${fen.substring(0, 50)}...`);
            }
            
            // DÉTERMINER LE STATUT AVEC ORDRE CORRECT
            let status;
            if (manager.determineGameStatus) {
                status = manager.determineGameStatus(fen, fenPlayer);
            } else {
                status = this.determineGameStatusImplementation(fen, fenPlayer);
            }
            
            if (GameStatusFix.debug) {
                console.log(`🎯 Résultat: ${status.type.toUpperCase()} - ${status.reason}`);
                console.log(`📡 Source: ${status.source}`);
            }
            
            // TRAITER LE STATUT
            if (manager.processGameStatus) {
                manager.processGameStatus(status, player);
            } else {
                this.processGameStatusImplementation(manager, status, player);
            }
            
        } catch (error) {
            console.error('❌ Erreur dans updateGameStatusImplementation:', error);
            
            // Appeler l'original en cas d'erreur
            if (manager._originalUpdateGameStatus) {
                try {
                    manager._originalUpdateGameStatus();
                } catch (e2) {
                    console.error('❌ L\'original a aussi échoué:', e2);
                }
            }
        }
    }
    
    static getCurrentFEN(manager) {
        // Essayer différentes sources
        const sources = [
            () => manager.chessGame?.getCurrentFEN?.(),
            () => window.chessGame?.getCurrentFEN?.(),
            () => manager.chessGame?.core?.getCurrentFEN?.(),
            () => {
                if (manager.chessGame?.gameState && manager.chessGame?.board) {
                    if (typeof FENGenerator !== 'undefined' && FENGenerator.generateFEN) {
                        return FENGenerator.generateFEN(manager.chessGame.gameState, manager.chessGame.board);
                    }
                }
                return null;
            }
        ];
        
        for (const source of sources) {
            try {
                const fen = source();
                if (fen) return fen;
            } catch (e) {
                // Continuer
            }
        }
        
        return null;
    }
    
    static getCurrentPlayer(manager) {
        return manager.chessGame?.gameState?.currentPlayer || 
               window.chessGame?.gameState?.currentPlayer || 
               'white';
    }
    
    static determineGameStatusImplementation(fen, player) {
        // ORDRE CRITIQUE: 1. Mat → 2. Pat → 3. Échec → 4. Normal
        
        // Essayer ChessStatusController d'abord
        if (typeof ChessStatusController !== 'undefined') {
            try {
                const result = ChessStatusController.checkGameStatus(fen, player);
                if (result && result.status) {
                    return {
                        type: result.status,
                        reason: result.reason || 'ChessStatusController',
                        source: 'ChessStatusController'
                    };
                }
            } catch (e) {
                if (GameStatusFix.debug) console.warn('ChessStatusController erreur:', e);
            }
        }
        
        // Essayer ChessMateEngine
        if (typeof ChessMateEngine !== 'undefined') {
            try {
                const engine = new ChessMateEngine(fen);
                
                if (engine.isCheckmate(player)) {
                    return {
                        type: 'checkmate',
                        reason: 'Échec et mat (MateEngine)',
                        source: 'ChessMateEngine'
                    };
                }
                
                if (engine.isStalemate(player)) {
                    return {
                        type: 'stalemate',
                        reason: 'Pat (MateEngine)',
                        source: 'ChessMateEngine'
                    };
                }
                
                if (engine.isKingInCheck(player)) {
                    return {
                        type: 'check',
                        reason: 'Échec simple (MateEngine)',
                        source: 'ChessMateEngine'
                    };
                }
            } catch (e) {
                if (GameStatusFix.debug) console.warn('ChessMateEngine erreur:', e);
            }
        }
        
        // Par défaut
        return {
            type: 'in_progress',
            reason: 'Jeu en cours',
            source: 'fallback'
        };
    }
    
    static processGameStatusImplementation(manager, status, currentPlayer) {
        if (GameStatusFix.debug) {
            console.log(`🎮 Traitement statut: ${status.type} pour ${currentPlayer}`);
        }
        
        // Arrêter le jeu si mat ou pat
        if (status.type === 'checkmate' || status.type === 'stalemate') {
            const gameState = manager.chessGame?.gameState || window.chessGame?.gameState;
            if (gameState) {
                gameState.gameActive = false;
            }
            
            // Afficher notification
            const message = status.type === 'checkmate' 
                ? `🎯 Échec et mat ! ${currentPlayer === 'white' ? 'Les Noirs' : 'Les Blancs'} gagnent.`
                : '⚖️ Match nul par pat !';
            
            this.showGameNotificationImplementation(message, status.type === 'checkmate' ? 'danger' : 'warning');
            
            // Afficher modal si disponible
            setTimeout(() => {
                if (window.chessGame?.ui?.modalManager?.showGameOver) {
                    window.chessGame.ui.modalManager.showGameOver(
                        status.type === 'checkmate' ? (currentPlayer === 'white' ? 'black' : 'white') : 'draw',
                        status.reason
                    );
                } else if (window.chessGame?.core?.ui?.modalManager?.showGameOver) {
                    window.chessGame.core.ui.modalManager.showGameOver(
                        status.type === 'checkmate' ? (currentPlayer === 'white' ? 'black' : 'white') : 'draw',
                        status.reason
                    );
                } else {
                    // Fallback
                    if (confirm(`${message}\n\nVoulez-vous rejouer ?`)) {
                        window.location.href = 'index.php';
                    }
                }
            }, 500);
        }
        
        // Surbrillance pour échec
        if (status.type === 'check') {
            const kingPos = this.findKingPosition(manager, currentPlayer);
            if (kingPos) {
                const square = this.getSquare(manager, kingPos.row, kingPos.col);
                if (square?.element) {
                    square.element.classList.add('king-in-check');
                }
            }
            
            this.showGameNotificationImplementation(`Roi ${currentPlayer === 'white' ? 'blanc' : 'noir'} en échec !`, 'info');
        }
        
        // Continuer le jeu si en cours
        if (status.type === 'in_progress') {
            const botManager = manager.chessGame?.botManager || window.chessGame?.botManager;
            if (botManager?.isBotTurn?.()) {
                setTimeout(() => {
                    botManager.playBotMove();
                }, 100);
            }
        }
    }
    
    static cleanHighlightsImplementation(manager) {
        // Nettoyer les surbrillances du plateau
        const board = manager.chessGame?.board || window.chessGame?.board;
        
        if (board?.squares) {
            board.squares.forEach(square => {
                if (square?.element) {
                    square.element.classList.remove('king-in-check', 'checkmate', 'stalemate');
                }
            });
        }
    }
    
    static showGameNotificationImplementation(message, type = 'info') {
        if (!GameStatusFix.debug) return;
        
        console.log(`🔔 Notification ${type}: ${message}`);
        
        // Créer notification visuelle
        const notification = document.createElement('div');
        notification.className = 'chess-notification-fix';
        notification.textContent = message;
        
        // Couleurs selon type
        const colors = {
            danger: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8',
            success: '#28a745'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Auto-suppression
        setTimeout(() => {
            notification.style.animation = 'slideOutFix 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
    
    static findKingPosition(manager, color) {
        const board = manager.chessGame?.board || window.chessGame?.board;
        if (!board?.squares) return null;
        
        for (const square of board.squares) {
            if (square.piece && 
                square.piece.type === 'king' && 
                square.piece.color === color) {
                return { row: square.row, col: square.col };
            }
        }
        return null;
    }
    
    static getSquare(manager, row, col) {
        const board = manager.chessGame?.board || window.chessGame?.board;
        return board?.getSquare?.(row, col);
    }
    
    static addUtilityMethods() {
        // Test de bug échec/mat
        window.testCheckmateBug = function() {
            console.group('🧪 TEST BUG ÉCHEC/MAT');
            
            // Position problématique connue
            const testFEN = "1R4k1/8/6K1/4p3/1p2P2P/1P1P4/2P2PP1/1NB3N1 b - - 22 37";
            console.log('🎯 Position test critique:', testFEN);
            
            // Tester avec tous les moteurs disponibles
            const engines = [];
            
            if (typeof ChessMateEngine !== 'undefined') {
                try {
                    const engine = new ChessMateEngine(testFEN);
                    engines.push({
                        name: 'ChessMateEngine',
                        isKingInCheck: engine.isKingInCheck('b'),
                        isCheckmate: engine.isCheckmate('b'),
                        isStalemate: engine.isStalemate('b')
                    });
                } catch (e) {
                    console.warn('ChessMateEngine erreur:', e);
                }
            }
            
            if (typeof ChessStatusController !== 'undefined') {
                try {
                    const status = ChessStatusController.checkGameStatus(testFEN, 'b');
                    engines.push({
                        name: 'ChessStatusController',
                        status: status.status,
                        reason: status.reason
                    });
                } catch (e) {
                    console.warn('ChessStatusController erreur:', e);
                }
            }
            
            console.table(engines);
            console.groupEnd();
        };
        
        // Vérifier l'état du fix
        window.checkGameStatusFix = function() {
            console.group('🔧 État du GameStatusFix');
            console.log(`Version: ${GameStatusFix.VERSION}`);
            console.log(`Applied: ${GameStatusFix.isApplied}`);
            console.log(`Manager disponible: ${!!window._gameStatusManager}`);
            
            if (window._gameStatusManager) {
                console.log('Méthodes:', Object.keys(window._gameStatusManager).filter(k => typeof window._gameStatusManager[k] === 'function'));
            }
            
            console.groupEnd();
        };
        
        // Forcer une vérification
        window.forceStatusCheck = function() {
            if (window._gameStatusManager?.updateGameStatus) {
                console.log('🔧 Forçage vérification statut...');
                window._gameStatusManager.updateGameStatus();
            } else if (window.chessGame?.gameStatusManager?.updateGameStatus) {
                console.log('🔧 Utilisation gameStatusManager de chessGame...');
                window.chessGame.gameStatusManager.updateGameStatus();
            } else {
                console.log('🔧 Pas de manager disponible');
            }
        };
        
        // Version simple pour tester
        window.simpleStatusTest = function() {
            console.log('🧪 Test simple de statut');
            if (typeof ChessMateEngine !== 'undefined') {
                const testFEN = "1R4k1/8/6K1/4p3/1p2P2P/1P1P4/2P2PP1/1NB3N1 b - - 22 37";
                const engine = new ChessMateEngine(testFEN);
                console.log('Roi noir en échec?', engine.isKingInCheck('b'));
                console.log('Échec et mat noir?', engine.isCheckmate('b'));
                console.log('Pat noir?', engine.isStalemate('b'));
            }
        };
    }
}

// Ajouter styles CSS
(function() {
    if (!document.querySelector('#game-status-fix-styles')) {
        const style = document.createElement('style');
        style.id = 'game-status-fix-styles';
        style.textContent = `
            @keyframes slideInFix {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutFix {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .chess-notification-fix {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                color: white;
                border-radius: 8px;
                font-weight: bold;
                z-index: 9999;
                animation: slideInFix 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .king-in-check {
                box-shadow: 0 0 15px red !important;
                border: 3px solid #dc3545 !important;
            }
            .checkmate {
                box-shadow: 0 0 20px purple !important;
                border: 4px solid #6f42c1 !important;
                animation: pulse 1s infinite;
            }
            .stalemate {
                box-shadow: 0 0 15px orange !important;
                border: 3px solid #fd7e14 !important;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
})();

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        GameStatusFix.init();
    }, 1500);
});

// Exposer globalement
window.GameStatusFix = GameStatusFix;

console.log('🔧 GameStatusFix v1.0.4 chargé - Prêt à corriger l\'ordre échec/mat');