// chess-events.js - Initialisation du jeu avec corrections mobile
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Début initialisation');
    
    // Test des boutons mobiles AVANT initialisation
    console.log('🔍 TEST BOUTONS MOBILES:');
    const mobileNewGame = document.getElementById('newGameMobile');
    const mobileFlipBoard = document.getElementById('flipBoardMobile');
    console.log('newGameMobile:', mobileNewGame);
    console.log('flipBoardMobile:', mobileFlipBoard);
    
    // Initialisation du jeu
    try {
        if (typeof ChessGame !== 'undefined') {
            window.chessGame = new ChessGame();
            console.log('✅ Jeu d\'échecs chargé avec succès');
        } else {
            console.error('❌ ChessGame non défini, chargement différé');
            // Retry après un délai
            setTimeout(() => {
                if (typeof ChessGame !== 'undefined') {
                    window.chessGame = new ChessGame();
                    console.log('✅ Jeu d\'échecs chargé avec délai');
                }
            }, 500);
        }
    } catch (error) {
        console.error('❌ Erreur initialisation ChessGame:', error);
    }

    // CORRECTIONS SPÉCIFIQUES POUR MOBILE
    function setupMobileEvents() {
        console.log('📱 Configuration des événements mobiles...');
        
        // Méthode robuste pour les boutons mobiles
        const mobileButtons = [
            { id: 'newGameMobile', action: 'redirectToIndex' },
            { id: 'flipBoardMobile', action: 'flipBoard' }
        ];
        
        mobileButtons.forEach(button => {
            const element = document.getElementById(button.id);
            if (element) {
                console.log(`✅ Configuration de ${button.id}`);
                
                // Nettoyer les anciens événements
                element.replaceWith(element.cloneNode(true));
                const freshElement = document.getElementById(button.id);
                
                // Ajouter plusieurs types d'événements pour mobile
                ['click', 'touchend'].forEach(eventType => {
                    freshElement.addEventListener(eventType, function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        
                        console.log(`📱 ${eventType} sur ${button.id}`);
                        
                        // Vibration mobile si disponible
                        if (navigator.vibrate) {
                            navigator.vibrate(10);
                        }
                        
                        // Exécuter l'action
                        if (button.action === 'redirectToIndex') {
                            // Redirection simple vers index.php
                            console.log('🔄 Redirection vers index.php');
                            window.location.href = 'index.php';
                        } else if (window.chessGame && window.chessGame[button.action]) {
                            console.log(`🚀 Exécution de ${button.action}()`);
                            window.chessGame[button.action]();
                        } else {
                            console.error(`❌ ${button.action} non disponible`);
                            // Fallback pour flipBoard
                            if (button.action === 'flipBoard') {
                                alert('Flip board non disponible. Rechargement de la page...');
                                window.location.reload();
                            }
                        }
                    }, { passive: false });
                });
                
                // Style pour s'assurer que le bouton est cliquable
                freshElement.style.cursor = 'pointer';
                freshElement.style.touchAction = 'manipulation';
                freshElement.style.userSelect = 'none';
                freshElement.setAttribute('data-mobile-bound', 'true');
                
                console.log(`✅ ${button.id} configuré avec succès`);
            } else {
                console.warn(`⚠️ ${button.id} non trouvé`);
            }
        });
    }

    // Événements pour desktop (conservés pour compatibilité)
    function setupDesktopEvents() {
        console.log('🖥️ Configuration des événements desktop...');
        
        const desktopButtons = [
            { selector: '#newGame', action: 'redirectToIndex' },
            { selector: '#flipBoard', action: 'flipBoard' },
            { selector: '.new-game-btn', action: 'redirectToIndex' },
            { selector: '.flip-board-btn', action: 'flipBoard' }
        ];
        
        desktopButtons.forEach(button => {
            const elements = document.querySelectorAll(button.selector);
            elements.forEach(element => {
                element.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log(`🖥️ Click sur ${button.selector}`);
                    
                    if (button.action === 'redirectToIndex') {
                        // Redirection simple vers index.php
                        console.log('🔄 Redirection vers index.php');
                        window.location.href = 'index.php';
                    } else if (window.chessGame && window.chessGame[button.action]) {
                        window.chessGame[button.action]();
                    } else {
                        console.error(`❌ ${button.action} non disponible`);
                    }
                });
            });
        });
    }

    // Initialisation des événements
    setupMobileEvents();
    setupDesktopEvents();

    // Fallback immédiat pour mobile
    setTimeout(() => {
        console.log('🔧 Fallback immédiat mobile...');
        forceMobileSetup();
    }, 100);

    // Fallback supplémentaire
    setTimeout(() => {
        console.log('🔧 Deuxième fallback mobile...');
        forceMobileSetup();
    }, 500);

    console.log('✅ Initialisation terminée');
});

// Fonction de fallback forcé pour mobile
function forceMobileSetup() {
    console.log('🔄 Setup forcé des boutons mobiles...');
    
    const mobileButtons = [
        { id: 'newGameMobile', action: 'redirectToIndex' },
        { id: 'flipBoardMobile', action: 'flipBoard' }
    ];
    
    mobileButtons.forEach(button => {
        const element = document.getElementById(button.id);
        if (element) {
            // Méthode directe sans clone
            element.onclick = function(e) {
                e?.preventDefault();
                e?.stopPropagation();
                console.log(`📱 FORCÉ: ${button.id} cliqué`);
                
                if (button.action === 'redirectToIndex') {
                    // Redirection simple vers index.php
                    console.log('🔄 FORCÉ: Redirection vers index.php');
                    window.location.href = 'index.php';
                    return false;
                } else if (window.chessGame && window.chessGame[button.action]) {
                    console.log(`🚀 FORCÉ: Exécution de ${button.action}()`);
                    window.chessGame[button.action]();
                    return false;
                } else {
                    console.error(`❌ FORCÉ: ${button.action} non disponible`);
                    return false;
                }
            };
            
            // Événement touch
            element.ontouchend = function(e) {
                e?.preventDefault();
                e?.stopPropagation();
                console.log(`📱 FORCÉ: ${button.id} touché`);
                
                if (button.action === 'redirectToIndex') {
                    // Redirection simple vers index.php
                    console.log('🔄 FORCÉ: Redirection vers index.php');
                    window.location.href = 'index.php';
                    return false;
                } else if (window.chessGame && window.chessGame[button.action]) {
                    window.chessGame[button.action]();
                    return false;
                } else {
                    console.error(`❌ FORCÉ: ${button.action} non disponible`);
                    return false;
                }
            };
            
            console.log(`✅ ${button.id} forcé avec succès`);
        }
    });
}

// Fallback global avec délai
setTimeout(() => {
    console.log('🔧 Fallback global final...');
    forceMobileSetup();
    
    // Test manuel des fonctions
    console.log('🧪 Test final des fonctions:');
    console.log('chessGame:', window.chessGame);
    console.log('newGame:', window.chessGame?.newGame);
    console.log('flipBoard:', window.chessGame?.flipBoard);
    
    // Vérification finale des boutons
    const finalCheck = document.querySelectorAll('[id*="Mobile"]');
    console.log('🔍 Boutons mobiles finaux:', finalCheck);
}, 1000);

// Fonction de débogage manuel
window.debugMobileButtons = function() {
    console.log('🐛 DÉBOGAGE BOUTONS MOBILES:');
    
    const mobileNewGame = document.getElementById('newGameMobile');
    const mobileFlipBoard = document.getElementById('flipBoardMobile');
    
    console.log('Boutons trouvés:', {
        newGameMobile: mobileNewGame,
        flipBoardMobile: mobileFlipBoard
    });
    
    console.log('Styles newGameMobile:', mobileNewGame ? window.getComputedStyle(mobileNewGame) : 'null');
    console.log('Styles flipBoardMobile:', mobileFlipBoard ? window.getComputedStyle(mobileFlipBoard) : 'null');
    
    // Test de simulation de clic
    if (mobileNewGame) {
        console.log('🧪 Test simulation clic newGameMobile...');
        mobileNewGame.click();
    }
};

// Fonction de test manuel
window.testMobileActions = function() {
    console.log('🧪 TEST MANUEL ACTIONS MOBILES');
    
    if (window.chessGame) {
        console.log('🚀 Test newGame()...');
        window.chessGame.newGame();
        
        setTimeout(() => {
            console.log('🔄 Test flipBoard()...');
            window.chessGame.flipBoard();
        }, 1000);
    } else {
        console.error('❌ chessGame non disponible');
        
        // Test de redirection
        console.log('🔄 Test redirection...');
        window.location.href = 'index.php';
    }
};

// Fonction de redirection manuelle
window.redirectToIndex = function() {
    console.log('🔄 Redirection manuelle vers index.php');
    window.location.href = 'index.php';
};

// Fonction de flip manuel
window.manualFlipBoard = function() {
    console.log('🔄 Flip manuel du plateau');
    if (window.chessGame && window.chessGame.flipBoard) {
        window.chessGame.flipBoard();
    } else {
        console.error('❌ Flip non disponible');
        alert('Flip board non disponible. Rechargement...');
        window.location.reload();
    }
};

// Détection mobile
window.isMobile = function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Re-configuration au cas où les boutons seraient ajoutés dynamiquement
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    if (node.id === 'newGameMobile' || node.id === 'flipBoardMobile') {
                        console.log('🔄 Bouton mobile détecté dynamiquement:', node.id);
                        setTimeout(forceMobileSetup, 100);
                    }
                }
            });
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('👀 Observateur de boutons mobiles activé');

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('🚨 ERREUR GLOBALE:', e.error);
    console.error('Fichier:', e.filename);
    console.error('Ligne:', e.lineno);
});

// Export pour compatibilité
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        forceMobileSetup,
        debugMobileButtons,
        testMobileActions,
        redirectToIndex,
        manualFlipBoard,
        isMobile
    };
}