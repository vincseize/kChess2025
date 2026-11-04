// newGame-index.js - JavaScript pour la page d'accueil nouvelle partie

let selectedMode = 'human';
let selectedLevel = 'false';
let selectedProfondeur = 'false';
let selectedColor = 'white';

// Déterminer la page cible
const isMobile = <?php echo $isMobile ? 'true' : 'false'; ?>;
const targetPage = isMobile ? 'templates/templateChess-mobile.php' : 'templates/templateChess-desktop.php';

// Gestion de la sélection du mode
document.querySelectorAll('.game-mode-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Retirer la sélection précédente
        document.querySelectorAll('.game-mode-btn').forEach(b => {
            b.classList.remove('active');
        });
        
        // Sélectionner le nouveau mode
        this.classList.add('active');
        selectedMode = this.dataset.mode;
        selectedLevel = this.dataset.level;
        selectedProfondeur = this.dataset.profondeur;
        
        console.log('Mode sélectionné:', {
            mode: selectedMode,
            level: selectedLevel,
            profondeur: selectedProfondeur
        });
    });
});

// Gestion de la sélection de la couleur
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('active');
        });
        this.classList.add('active');
        selectedColor = this.dataset.color;
        
        console.log('Couleur sélectionnée:', selectedColor);
    });
});

// Gestion du bouton de démarrage
document.getElementById('startGameBtn').addEventListener('click', function() {
    let url = targetPage;
    
    // Gérer la couleur aléatoire
    let finalColor = selectedColor;
    if (selectedColor === 'random') {
        finalColor = Math.random() > 0.5 ? 'white' : 'black';
        console.log(`🎲 Couleur aléatoire: ${finalColor}`);
    }
    
    // Construire l'URL avec tous les paramètres harmonisés
    const params = new URLSearchParams({
        mode: selectedMode,
        level: selectedLevel,
        profondeur: selectedProfondeur,
        color: finalColor
    });
    
    url += '?' + params.toString();
    
    console.log('🚀 Démarrage de la partie:', { 
        mode: selectedMode,
        level: selectedLevel,
        profondeur: selectedProfondeur,
        originalColor: selectedColor,
        finalColor: finalColor,
        url: url,
        device: isMobile ? 'mobile' : 'desktop'
    });
    
    window.location.href = url;
});

// Animation au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('Device détecté:', isMobile ? 'Mobile' : 'Desktop');
    
    // Sélection automatique du mode Humain-Humain au chargement
    const humanBtn = document.querySelector('.btn-human');
    if (humanBtn) {
        humanBtn.classList.add('active');
    }
    
    // Sélection automatique de la couleur Blanc au chargement
    const whiteColor = document.querySelector('.color-option[data-color="white"]');
    if (whiteColor) {
        whiteColor.classList.add('active');
    }
    
    // Assurer que le contenu est visible sur mobile
    setTimeout(() => {
        const newGameContent = document.querySelector('.new-game-content');
        if (newGameContent) {
            newGameContent.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, 100);
    
    // Vérifier que les sélections sont bien initialisées
    console.log('Sélections initiales:', {
        mode: selectedMode,
        level: selectedLevel,
        profondeur: selectedProfondeur,
        color: selectedColor
    });
});

// Fonction utilitaire pour réinitialiser les sélections (optionnel)
function resetSelections() {
    document.querySelectorAll('.game-mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
    selectedMode = 'human';
    selectedLevel = 'false';
    selectedProfondeur = 'false';
    selectedColor = 'white';
    
    // Resélectionner les valeurs par défaut
    const humanBtn = document.querySelector('.btn-human');
    const whiteColor = document.querySelector('.color-option[data-color="white"]');
    
    if (humanBtn) humanBtn.classList.add('active');
    if (whiteColor) whiteColor.classList.add('active');
    
    console.log('Sélections réinitialisées');
}

// Gestion des erreurs
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
});

// Export pour une utilisation externe si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        selectedMode,
        selectedLevel,
        selectedProfondeur,
        selectedColor,
        resetSelections
    };
}