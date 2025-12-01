// ui/chess-events.js - Correction pour synchroniser le flip
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Début initialisation');
    
    // Initialisation UNIQUE du jeu
    initializeChessGame();
    
    // Configuration des événements
    setupEventListeners();
    
    console.log('✅ Initialisation terminée');
});

// =============================================
// VARIABLES GLOBALES
// =============================================

// État global du flip
let isBoardFlipped = false;

// =============================================
// INITIALISATION DU JEU
// =============================================

// Initialisation simple du jeu
function initializeChessGame() {
    try {
        if (typeof ChessGame !== 'undefined' && !window.chessGame) {
            window.chessGame = new ChessGame();
            console.log('✅ ChessGame initialisé avec succès');
            
        } else if (window.chessGame) {
            console.log('ℹ️ ChessGame déjà initialisé');
        } else {
            console.error('❌ ChessGame non disponible');
            // Retry après délai
            setTimeout(() => {
                if (typeof ChessGame !== 'undefined' && !window.chessGame) {
                    window.chessGame = new ChessGame();
                    console.log('✅ ChessGame initialisé avec délai');
                }
            }, 1000);
        }
    } catch (error) {
        console.error('❌ Erreur initialisation ChessGame:', error);
    }
}

// =============================================
// FONCTIONS DE FLIP - VERSION CORRIGÉE
// =============================================

function flipBoard() {
    console.log('🔄 Flip du plateau - Début');
    
    // Toggle de l'état local
    isBoardFlipped = !isBoardFlipped;
    
    // 1. Intervertir les sections joueurs IMMÉDIATEMENT
    flipPlayerSections();
    
    // 2. Flip de l'échiquier via ChessGameCore
    if (window.chessGame?.core?.flipBoard) {
        console.log('✅ Appel de ChessGameCore.flipBoard()');
        window.chessGame.core.flipBoard();
    } else if (window.chessGame?.flipBoard) {
        console.log('✅ Appel de ChessGame.flipBoard()');
        window.chessGame.flipBoard();
    } else {
        console.warn('⚠️ Flip ChessGame non disponible, fallback manuel');
        manualChessboardFlip();
    }
    
    // 3. Mettre à jour le statut
    updateGameStatus(isBoardFlipped ? 'Plateau tourné (Noir en bas)' : 'Plateau normal (Blanc en bas)');
    console.log('🔄 Flip du plateau - Terminé');
}

function flipPlayerSections() {
    const sectionWhite = document.getElementById('section-white');
    const sectionBlack = document.getElementById('section-black');
    const chessboardContainer = document.querySelector('.chessboard-container');
    const chessboardCol = document.querySelector('.chessboard-col');
    
    if (sectionWhite && sectionBlack && chessboardContainer && chessboardCol) {
        const currentOrder = Array.from(chessboardCol.children).map(child => child.id);
        console.log('Ordre actuel des sections:', currentOrder);
        
        if (currentOrder[0] === 'section-black') {
            // Noir en haut → mettre Blanc en haut
            chessboardCol.innerHTML = '';
            chessboardCol.appendChild(sectionWhite);
            chessboardCol.appendChild(chessboardContainer);
            chessboardCol.appendChild(sectionBlack);
            console.log('✅ Sections: Blanc en haut, Noir en bas');
        } else {
            // Blanc en haut → mettre Noir en haut
            chessboardCol.innerHTML = '';
            chessboardCol.appendChild(sectionBlack);
            chessboardCol.appendChild(chessboardContainer);
            chessboardCol.appendChild(sectionWhite);
            console.log('✅ Sections: Noir en haut, Blanc en bas');
        }
    } else {
        console.error('❌ Éléments non trouvés pour le flip joueurs');
    }
}

function manualChessboardFlip() {
    // Fallback manuel pour l'échiquier si chessGame n'est pas disponible
    const chessBoard = document.getElementById('chessBoard');
    if (chessBoard) {
        // Si ChessBoard a une classe 'flipped', l'utiliser
        if (chessBoard.classList) {
            chessBoard.classList.toggle('flipped');
            console.log('✅ Échiquier flipé manuellement via classe CSS');
        } else {
            // Fallback plus basique - rotation CSS
            const currentRotation = chessBoard.style.transform || 'rotate(0deg)';
            const newRotation = currentRotation.includes('180deg') ? 'rotate(0deg)' : 'rotate(180deg)';
            chessBoard.style.transform = newRotation;
            console.log('✅ Échiquier flipé manuellement via transform');
        }
    }
}

// =============================================
// FONCTION POUR APPLIQUER LE FLIP AUTOMATIQUE
// =============================================

function applyAutoFlipForColorBlack() {
    const params = getUrlParams();
    
    if (params.color === 'black') {
        console.log('🎯 color=black détecté, application du flip automatique');
        
        // Attendre que ChessGame soit initialisé
        const checkInterval = setInterval(() => {
            if (window.chessGame) {
                clearInterval(checkInterval);
                
                // Vérifier si le board n'est pas déjà flipé
                if (!window.chessGame.gameState.boardFlipped) {
                    console.log('🔄 Application du flip automatique...');
                    
                    // Utiliser flipBoard() qui gère à la fois l'échiquier et les sections
                    flipBoard();
                    
                    console.log('✅ Flip automatique appliqué pour color=black');
                } else {
                    console.log('✅ Board déjà flipé, appliquer juste les sections');
                    // Même si l'échiquier est déjà flipé, on doit flip les sections
                    flipPlayerSections();
                    isBoardFlipped = true;
                    updateGameStatus('Plateau orienté pour les Noirs');
                }
            }
        }, 100);
        
        // Timeout de sécurité
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 5000);
    }
}

// =============================================
// CONFIGURATION DES ÉVÉNEMENTS
// =============================================

// Configuration simple des événements
function setupEventListeners() {
    console.log('📱 Configuration des événements...');
    
    // Boutons mobiles
    setupMobileButtons();
    
    // Boutons desktop
    setupDesktopButtons();
    
    // Appliquer le flip automatique si color=black
    setTimeout(() => {
        applyAutoFlipForColorBlack();
    }, 500);
}

// Configuration des boutons mobiles SIMPLIFIÉE
function setupMobileButtons() {
    const mobileButtons = [
        { 
            id: 'newGame', 
            action: () => confirmNewGame()
        },
        { 
            id: 'flipBoard', 
            action: () => flipBoard()
        }
    ];
    
    mobileButtons.forEach(button => {
        const element = document.getElementById(button.id);
        if (element) {
            console.log(`✅ Configuration de ${button.id}`);
            
            // Nettoyer et réattacher les événements
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Événements simples
            newElement.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`📱 Click sur ${button.id}`);
                button.action();
            });
            
            newElement.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`📱 Touch sur ${button.id}`);
                button.action();
            });
            
            // Style mobile
            newElement.style.cursor = 'pointer';
            newElement.style.touchAction = 'manipulation';
            
        } else {
            console.warn(`⚠️ ${button.id} non trouvé`);
        }
    });
}

// Configuration des boutons desktop
function setupDesktopButtons() {
    const desktopButtons = [
        { 
            selector: '#newGame', 
            action: () => confirmNewGame()
        },
        { 
            selector: '#flipBoard', 
            action: () => flipBoard()
        },
        { 
            selector: '.new-game-btn:not(#newGame)', 
            action: () => confirmNewGame()
        },
        { 
            selector: '.flip-board-btn:not(#flipBoard)', 
            action: () => flipBoard()
        }
    ];
    
    desktopButtons.forEach(button => {
        const elements = document.querySelectorAll(button.selector);
        elements.forEach(element => {
            // Nettoyer les anciens événements
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Nouvel événement
            newElement.addEventListener('click', function(e) {
                e.preventDefault();
                console.log(`🖥️ Click sur ${button.selector}`);
                button.action();
            });
        });
    });
}

// =============================================
// FONCTIONS UTILITAIRES
// =============================================

// FONCTION HELPER POUR NOUVELLE PARTIE (compatible avec les deux architectures)
function confirmNewGame() {
    if (window.chessGame) {
        // Nouvelle architecture modulaire
        if (window.chessGame.core && window.chessGame.core.ui && window.chessGame.core.ui.modalManager) {
            return window.chessGame.core.ui.modalManager.confirmNewGame();
        }
        // Ancienne architecture
        else if (window.chessGame.core && window.chessGame.core.ui && typeof window.chessGame.core.ui.confirmNewGame === 'function') {
            return window.chessGame.core.ui.confirmNewGame();
        }
        // Fallback
        else {
            console.error('❌ Aucune méthode confirmNewGame disponible');
            redirectToIndex();
        }
    } else {
        console.error('❌ Jeu non initialisé');
        redirectToIndex();
    }
}

function newGame() {
    console.log('🔄 Nouvelle partie');
    if (window.chessGame && typeof window.chessGame.newGame === 'function') {
        window.chessGame.newGame();
    } else {
        console.error('❌ newGame non disponible');
    }
}

function redirectToIndex() {
    console.log('🔄 Redirection vers index.php');
    window.location.href = '../index.php';
}

// Fonction pour récupérer les paramètres de l'URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        mode: params.get('mode') || 'human',
        level: params.get('level') || 'false',
        profondeur: params.get('profondeur') || 'false',
        color: params.get('color') || 'white'
    };
}

// Mise à jour du statut du jeu (commun aux deux versions)
function updateGameStatus(message) {
    console.log('Statut jeu:', message);
    
    // Mise à jour du footer desktop si présent
    const footerInfo = document.querySelector('.footer-info');
    if (footerInfo) {
        footerInfo.textContent = message + ' • Temps restant: 08:45';
    }
    
    // Mise à jour visuelle de l'échiquier
    const gameContent = document.getElementById('gameContent');
    if (gameContent) {
        gameContent.textContent = 'Zone de jeu: ' + message;
    }
}

// =============================================
// EXPORT POUR DEBUG
// =============================================

// Export pour debug
window.debugChess = {
    game: () => window.chessGame,
    botStatus: () => window.chessGame?.getBotStatus?.(),
    forceBot: (level = 1, color = 'black') => window.chessGame?.setBotLevel?.(level, color),
    testFlip: () => flipBoard(),
    testNewGame: () => newGame(),
    testConfirmation: () => confirmNewGame(),
    // Test de flip spécifique
    testFlipForBlack: () => {
        console.log('🔄 Test flip pour Noir');
        flipBoard();
    },
    // Vérifier l'état
    getFlipState: () => {
        return {
            isFlipped: isBoardFlipped,
            params: getUrlParams(),
            chessGame: !!window.chessGame,
            chessGameFlip: window.chessGame ? typeof window.chessGame.flipBoard : 'undefined',
            gameStateFlipped: window.chessGame?.gameState?.boardFlipped
        };
    },
    // Appliquer flip basé sur paramètres
    applyAutoFlip: () => {
        applyAutoFlipForColorBlack();
    },
    // Forcer le flip des sections uniquement
    flipSectionsOnly: () => {
        flipPlayerSections();
        console.log('✅ Sections flipées manuellement');
    }
};

// =============================================
// EXPORT DES FONCTIONS GLOBALES
// =============================================

window.flipBoard = flipBoard;
window.flipPlayerSections = flipPlayerSections;
window.getUrlParams = getUrlParams;