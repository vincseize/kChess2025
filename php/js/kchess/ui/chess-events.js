// ui/chess-events.js - Initialisation du jeu SIMPLIFIÉE

// ============================================
// FONCTION GLOBALE POUR METTRE À JOUR LES LABELS
// ============================================
function updatePlayerLabels() {
    console.log('🔄 Mise à jour des labels des joueurs...');
    
    const topLabel = document.getElementById('topPlayerLabel');
    const bottomLabel = document.getElementById('bottomPlayerLabel');
    
    if (!topLabel || !bottomLabel) {
        console.warn('⚠️ Labels des joueurs non trouvés');
        return;
    }
    
    try {
        // Récupérer l'état du plateau depuis le jeu
        let isFlipped = false;
        
        if (window.chessGame) {
            // Essayer d'obtenir l'état depuis le core
            if (window.chessGame.core && window.chessGame.core.gameState) {
                isFlipped = window.chessGame.core.gameState.boardFlipped;
            }
        }
        
        console.log(`🔧 État du plateau: flipped=${isFlipped}`);
        
        // Récupérer le statut du bot
        const botStatus = window.chessGame && window.chessGame.getBotStatus ? 
                         window.chessGame.getBotStatus() : 
                         { active: false, level: 0, color: '' };
        
        // Déterminer le texte pour chaque joueur
        let topText, bottomText, topClass, bottomClass;
        
        if (isFlipped) {
            // Plateau inversé: blancs en haut, noirs en bas
            topText = 'Blancs';
            bottomText = 'Noirs';
            
            // Ajouter "Bot" si le bot joue cette couleur
            if (botStatus.active && botStatus.color === 'white') {
                topText = `Blancs (Bot Niv.${botStatus.level})`;
                topClass = 'bot-player bot-color-white';
            }
            if (botStatus.active && botStatus.color === 'black') {
                bottomText = `Noirs (Bot Niv.${botStatus.level})`;
                bottomClass = 'bot-player bot-color-black';
            }
            
            // Classes CSS
            topClass = (topClass || '') + ' badge bg-white text-dark border border-dark p-2';
            bottomClass = (bottomClass || '') + ' badge bg-dark text-white p-2';
            
        } else {
            // Plateau normal: noirs en haut, blancs en bas
            topText = 'Noirs';
            bottomText = 'Blancs';
            
            // Ajouter "Bot" si le bot joue cette couleur
            if (botStatus.active && botStatus.color === 'black') {
                topText = `Noirs (Bot Niv.${botStatus.level})`;
                topClass = 'bot-player bot-color-black';
            }
            if (botStatus.active && botStatus.color === 'white') {
                bottomText = `Blancs (Bot Niv.${botStatus.level})`;
                bottomClass = 'bot-player bot-color-white';
            }
            
            // Classes CSS
            topClass = (topClass || '') + ' badge bg-dark text-white p-2';
            bottomClass = (bottomClass || '') + ' badge bg-white text-dark border border-dark p-2';
        }
        
        // Mettre à jour les labels
        topLabel.innerHTML = `${botStatus.active && (
            (isFlipped && botStatus.color === 'white') || 
            (!isFlipped && botStatus.color === 'black')
        ) ? '<i class="bi bi-cpu me-1"></i>' : '<i class="bi bi-person me-1"></i>'} ${topText}`;
        topLabel.className = topClass;
        
        bottomLabel.innerHTML = `${botStatus.active && (
            (isFlipped && botStatus.color === 'black') || 
            (!isFlipped && botStatus.color === 'white')
        ) ? '<i class="bi bi-cpu me-1"></i>' : '<i class="bi bi-person me-1"></i>'} ${bottomText}`;
        bottomLabel.className = bottomClass;
        
        console.log('✅ Labels mis à jour avec succès', { 
            topText, 
            bottomText, 
            botActive: botStatus.active,
            botLevel: botStatus.level,
            botColor: botStatus.color 
        });
        
    } catch (error) {
        console.error('❌ Erreur updatePlayerLabels:', error);
    }
}

// Exporter la fonction globale
window.updatePlayerLabels = updatePlayerLabels;

// ============================================
// INITIALISATION PRINCIPALE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Début initialisation');
    
    // Initialiser le jeu
    initializeChessGame();
    
    // Configurer les événements
    setupEventListeners();
    
    // Mettre à jour les labels initiaux après un délai
    setTimeout(() => {
        updatePlayerLabels();
        console.log('✅ Labels initiaux mis à jour');
    }, 800);
    
    console.log('✅ Initialisation terminée');
});

// ============================================
// INITIALISATION DU JEU
// ============================================
function initializeChessGame() {
    try {
        if (typeof ChessGame !== 'undefined' && !window.chessGame) {
            window.chessGame = new ChessGame();
            console.log('✅ ChessGame initialisé avec succès');
            
            // Attacher la fonction updatePlayerLabels au jeu pour y accéder facilement
            if (window.chessGame.core) {
                window.chessGame.core.updatePlayerLabels = updatePlayerLabels;
                console.log('✅ updatePlayerLabels attaché au core');
            }
        } else if (window.chessGame) {
            console.log('ℹ️ ChessGame déjà initialisé');
        } else {
            console.error('❌ ChessGame non disponible');
            // Réessayer après délai
            setTimeout(() => {
                if (typeof ChessGame !== 'undefined' && !window.chessGame) {
                    window.chessGame = new ChessGame();
                    console.log('✅ ChessGame initialisé avec délai');
                }
            }, 1500);
        }
    } catch (error) {
        console.error('❌ Erreur initialisation ChessGame:', error);
    }
}

// ============================================
// CONFIGURATION DES ÉVÉNEMENTS
// ============================================
function setupEventListeners() {
    console.log('📱 Configuration des événements...');
    
    // Configurer les boutons mobiles
    setupMobileButtons();
    
    // Configurer les boutons desktop
    setupDesktopButtons();
    
    // Observer les changements de l'URL
    setupURLObserver();
    
    // Mettre à jour les labels lors du redimensionnement
    window.addEventListener('resize', () => {
        setTimeout(updatePlayerLabels, 100);
    });
}

// ============================================
// CONFIGURATION DES BOUTONS MOBILES
// ============================================
function setupMobileButtons() {
    const mobileButtons = [
        { 
            id: 'newGameMobile', 
            action: () => confirmNewGame()
        },
        { 
            id: 'flipBoardMobile', 
            action: () => flipBoardWithLabelsUpdate()
        }
    ];
    
    mobileButtons.forEach(button => {
        const element = document.getElementById(button.id);
        if (element) {
            console.log(`✅ Configuration bouton mobile: ${button.id}`);
            
            // Cloner pour nettoyer les événements
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Événement click
            newElement.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`📱 Click sur ${button.id}`);
                button.action();
            });
            
            // Événement touch pour mobile
            newElement.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`📱 Touch sur ${button.id}`);
                button.action();
            });
            
            // Style pour meilleure expérience mobile
            newElement.style.cursor = 'pointer';
            newElement.style.touchAction = 'manipulation';
            newElement.style.userSelect = 'none';
            
        } else {
            console.warn(`⚠️ Bouton mobile ${button.id} non trouvé`);
        }
    });
}

// ============================================
// CONFIGURATION DES BOUTONS DESKTOP
// ============================================
function setupDesktopButtons() {
    const desktopButtons = [
        { 
            selector: '#newGame', 
            action: () => confirmNewGame()
        },
        { 
            selector: '#flipBoard', 
            action: () => flipBoardWithLabelsUpdate()
        },
        { 
            selector: '.new-game-btn:not(#newGameMobile)', 
            action: () => confirmNewGame()
        },
        { 
            selector: '.flip-board-btn:not(#flipBoardMobile)', 
            action: () => flipBoardWithLabelsUpdate()
        }
    ];
    
    desktopButtons.forEach(button => {
        const elements = document.querySelectorAll(button.selector);
        elements.forEach(element => {
            // Cloner pour nettoyer les anciens événements
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Événement click
            newElement.addEventListener('click', function(e) {
                e.preventDefault();
                console.log(`🖥️ Click sur ${button.selector}`);
                button.action();
            });
        });
    });
    
    // Boutons de copie
    document.getElementById('copyPGN')?.addEventListener('click', () => copyPGN());
    document.getElementById('copyFEN')?.addEventListener('click', () => copyFEN());
}

// ============================================
// FONCTION POUR TOURNER LE PLATEAU
// ============================================
function flipBoardWithLabelsUpdate() {
    console.log('🔄 Flip du plateau avec mise à jour des labels');
    
    if (window.chessGame && typeof window.chessGame.flipBoard === 'function') {
        // Appeler la fonction flip du jeu
        window.chessGame.flipBoard();
        
        // Mettre à jour les labels après un court délai
        setTimeout(() => {
            updatePlayerLabels();
            console.log('✅ Labels mis à jour après flip (via ChessGame)');
        }, 100);
    } else if (window.chessGame && window.chessGame.core && typeof window.chessGame.core.flipBoard === 'function') {
        // Alternative: appeler via core
        window.chessGame.core.flipBoard();
        
        setTimeout(() => {
            updatePlayerLabels();
            console.log('✅ Labels mis à jour après flip (via core)');
        }, 100);
    } else {
        console.error('❌ flipBoard non disponible');
        // Fallback: juste mettre à jour les labels visuellement
        updatePlayerLabels();
        console.log('⚠️ Flip simulé (labels seulement)');
    }
}

// ============================================
// CONFIRMATION NOUVELLE PARTIE
// ============================================
function confirmNewGame() {
    if (window.chessGame) {
        // Nouvelle architecture modulaire
        if (window.chessGame.core && window.chessGame.core.ui && window.chessGame.core.ui.modalManager) {
            const result = window.chessGame.core.ui.modalManager.confirmNewGame();
            if (result) {
                // Mettre à jour les labels après une nouvelle partie
                setTimeout(() => {
                    updatePlayerLabels();
                    console.log('✅ Labels mis à jour après nouvelle partie');
                }, 800);
            }
            return result;
        }
        // Ancienne architecture
        else if (window.chessGame.core && window.chessGame.core.ui && typeof window.chessGame.core.ui.confirmNewGame === 'function') {
            const result = window.chessGame.core.ui.confirmNewGame();
            if (result) {
                setTimeout(() => {
                    updatePlayerLabels();
                    console.log('✅ Labels mis à jour après nouvelle partie');
                }, 800);
            }
            return result;
        }
        // Fallback
        else {
            console.error('❌ Aucune méthode confirmNewGame disponible');
            redirectToIndex();
            return false;
        }
    } else {
        console.error('❌ Jeu non initialisé');
        redirectToIndex();
        return false;
    }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================
function redirectToIndex() {
    console.log('🔄 Redirection vers index.php');
    window.location.href = 'index.php';
}

function copyPGN() {
    if (window.chessGame && typeof window.chessGame.copyPGN === 'function') {
        window.chessGame.copyPGN();
    } else {
        console.warn('❌ copyPGN non disponible');
    }
}

function copyFEN() {
    if (window.chessGame && typeof window.chessGame.copyFEN === 'function') {
        window.chessGame.copyFEN();
    } else {
        console.warn('❌ copyFEN non disponible');
    }
}

// ============================================
// OBSERVATEUR D'URL
// ============================================
function setupURLObserver() {
    let lastURL = window.location.href;
    
    // Vérifier les changements d'URL toutes les 500ms
    const urlObserver = setInterval(() => {
        if (window.location.href !== lastURL) {
            lastURL = window.location.href;
            console.log('🔗 URL changée, mise à jour des labels');
            setTimeout(updatePlayerLabels, 500);
        }
    }, 500);
    
    // Nettoyer l'observateur si la page est déchargée
    window.addEventListener('beforeunload', () => {
        clearInterval(urlObserver);
    });
}

// ============================================
// ÉVÉNEMENTS DE VISIBILITÉ DE PAGE
// ============================================
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        console.log('👀 Page visible, mise à jour des labels');
        setTimeout(updatePlayerLabels, 200);
    }
});

// ============================================
// DEBUG ET EXPORTS
// ============================================
window.debugChess = {
    game: () => window.chessGame,
    updateLabels: () => updatePlayerLabels(),
    testFlip: () => flipBoardWithLabelsUpdate(),
    testNewGame: () => confirmNewGame(),
    getBoardState: () => {
        if (window.chessGame && window.chessGame.core && window.chessGame.core.gameState) {
            return {
                flipped: window.chessGame.core.gameState.boardFlipped,
                currentPlayer: window.chessGame.core.gameState.currentPlayer,
                gameActive: window.chessGame.core.gameState.gameActive
            };
        }
        return { flipped: false, currentPlayer: 'white', gameActive: false };
    },
    getBotStatus: () => {
        if (window.chessGame && window.chessGame.getBotStatus) {
            return window.chessGame.getBotStatus();
        }
        return { active: false, level: 0, color: '' };
    },
    forceUpdateLabels: () => {
        console.log('🔧 Forçage mise à jour des labels');
        updatePlayerLabels();
    }
};

console.log('✅ chess-events.js chargé avec fonction updatePlayerLabels globale');