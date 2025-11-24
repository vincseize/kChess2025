<?php
// newGame.php
function isMobile() {
    return preg_match(
        '/(android|iphone|ipad|ipod|blackberry|opera mini|windows phone|mobile)/i',
        $_SERVER['HTTP_USER_AGENT']
    );
}

$isMobile = isMobile();
$targetPage = $isMobile ? 'app_mobile.php' : 'app.php';
?>

<style>
    * {
        box-sizing: border-box;
    }
    
    .new-game-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        padding: 15px;
        overflow-y: auto;
    }

    .new-game-content {
        background: white;
        padding: 2rem;
        border-radius: 20px;
        max-width: 600px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        margin: auto;
        max-height: 95vh;
        overflow-y: auto;
    }

    .new-game-title {
        color: #2c3e50;
        margin-bottom: 1.5rem;
        font-weight: 700;
        font-size: clamp(1.5rem, 4vw, 2rem);
    }

    .new-game-buttons {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin: 2rem 0;
    }

    .game-mode-btn {
        padding: 1rem 1.5rem;
        font-weight: 600;
        text-align: left;
        border: none;
        border-radius: 12px;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
    }

    .game-mode-btn.selected {
        transform: translateY(-3px);
        box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        border: 3px solid currentColor;
        filter: brightness(1.1);
    }

    .game-mode-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    }

    .btn-human {
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
    }

    .btn-human.selected {
        border-color: #2E7D32;
        box-shadow: 0 12px 30px rgba(76, 175, 80, 0.4);
    }

    .btn-level-0 {
        background: linear-gradient(135deg, #2196F3, #1976D2);
        color: white;
    }

    .btn-level-0.selected {
        border-color: #0D47A1;
        box-shadow: 0 12px 30px rgba(33, 150, 243, 0.4);
    }

    .btn-level-1 {
        background: linear-gradient(135deg, #FF9800, #F57C00);
        color: white;
    }

    .btn-level-1.selected {
        border-color: #E65100;
        box-shadow: 0 12px 30px rgba(255, 152, 0, 0.4);
    }

    .color-selection {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 12px;
        margin: 1.5rem 0;
        border: 2px solid #e9ecef;
    }

    .color-options {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .color-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        padding: 1rem 0.5rem;
        border-radius: 10px;
        transition: all 0.3s ease;
        border: 3px solid transparent;
        background: white;
        flex: 1;
        min-width: 0;
    }

    .color-option:hover {
        transform: scale(1.05);
    }

    .color-option.selected {
        border-color: #4CAF50;
        background: rgba(76, 175, 80, 0.1);
        transform: scale(1.05);
        box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
    }

    .color-option.random.selected {
        border-color: #9C27B0;
        background: rgba(156, 39, 176, 0.1);
        box-shadow: 0 5px 15px rgba(156, 39, 176, 0.3);
    }

    .color-piece {
        width: 40px;
        height: 40px;
        margin-bottom: 0.5rem;
    }

    .color-piece img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .start-game-btn {
        padding: 1rem 2rem;
        font-size: 1.2rem;
        font-weight: 700;
        border-radius: 12px;
        background: linear-gradient(135deg, #E91E63, #C2185B);
        border: none;
        color: white;
        transition: all 0.3s ease;
        margin-top: 1rem;
        width: 100%;
        max-width: 300px;
    }

    .start-game-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(233, 30, 99, 0.4);
    }

    .start-game-btn:disabled {
        background: #ccc;
        transform: none;
        box-shadow: none;
        cursor: not-allowed;
    }

    .mode-icon {
        font-size: 1.5rem;
        margin-right: 1rem;
    }

    .mode-description {
        flex-grow: 1;
        text-align: left;
    }

    .mode-difficulty {
        font-size: 0.7rem;
        opacity: 1;
    }

    .check-icon {
        font-size: 1.2rem;
        opacity: 0;
        transition: opacity 0.3s ease;
        min-width: 24px;
    }

    .game-mode-btn.selected .check-icon {
        opacity: 1;
    }

    /* Responsive mobile */
    @media (max-width: 768px) {
        .new-game-content {
            padding: 1.5rem;
            max-height: 90vh;
        }
        
        .game-mode-btn {
            padding: 0.875rem 1rem;
            font-size: 0.9rem;
        }
        
        .color-options {
            gap: 0.3rem;
        }
        
        .color-option {
            padding: 0.75rem 0.3rem;
        }
        
        .color-piece {
            width: 35px;
            height: 35px;
        }
        
        .start-game-btn {
            font-size: 1.1rem;
            padding: 0.875rem 1.5rem;
        }
    }

    @media (max-width: 480px) {
        .new-game-content {
            padding: 1rem;
        }
        
        .color-option {
            padding: 0.5rem 0.2rem;
        }
        
        .color-piece {
            width: 30px;
            height: 30px;
        }
        
        .color-option div:last-child {
            font-size: 0.8rem;
        }
    }
</style>

<div class="new-game-overlay">
    <div class="new-game-content">


        <!-- Sélection du mode de jeu -->
        <div class="new-game-buttons">
            <button class="game-mode-btn btn-human" data-mode="human">
                <div class="mode-description">
                    <div><i class="bi bi-people-fill mode-icon"></i> Humain vs Humain</div>
                </div>
                <i class="bi bi-check-lg check-icon"></i>
            </button>

            <button class="game-mode-btn btn-level-0" data-mode="level0">
                <div class="mode-description">
                    <div><i class="bi bi-cpu mode-icon"></i> Niveau 0 - Aléatoire</div>
                    <div class="mode-difficulty">Bot : Coups aléatoires</div>
                    <div class="mode-difficulty">Profondeur 0</div>
                </div>
                <i class="bi bi-check-lg check-icon"></i>
            </button>

            <button class="game-mode-btn btn-level-1" data-mode="level1">
                <div class="mode-description">
                    <div><i class="bi bi-robot mode-icon"></i> Niveau 1 - CCMO</div>
                    <div class="mode-difficulty">Bot : Check, Captures, Menaces, Optimisation</div>
                    <div class="mode-difficulty">Profondeur 0</div>
                </div>
                <i class="bi bi-check-lg check-icon"></i>
            </button>
        </div>

        <!-- Sélection de la couleur -->
        <div class="color-selection">
           
            <div class="color-options">
                <div class="color-option selected" data-color="white">
                    <div class="color-piece">
                        <img src="img/chesspieces/wikipedia/wK.png" alt="Roi Blanc">
                    </div>
                    <div>Blancs</div>
                </div>
                <div class="color-option" data-color="black">
                    <div class="color-piece">
                        <img src="img/chesspieces/wikipedia/bK.png" alt="Roi Noir">
                    </div>
                    <div>Noirs</div>
                </div>
                <div class="color-option random" data-color="random">
                    <div class="color-piece">
                        <i class="bi bi-shuffle" style="font-size: 1.8rem; color: #9C27B0;"></i>
                    </div>
                    <div>Aléatoire</div>
                </div>
            </div>
        </div>

        <!-- Bouton de validation -->
        <div style="text-align: center; margin-top: 2rem;">
            <button class="start-game-btn" id="startGameBtn" disabled>
                <i class="bi bi-play-circle me-2"></i>Démarrer la Partie
            </button>
        </div>
    </div>
</div>

<script>
let selectedMode = null;
let selectedColor = 'white';

// Gestion de la sélection du mode
document.querySelectorAll('.game-mode-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Retirer la sélection précédente
        document.querySelectorAll('.game-mode-btn').forEach(b => {
            b.classList.remove('selected');
        });
        
        // Sélectionner le nouveau mode
        this.classList.add('selected');
        selectedMode = this.dataset.mode;
        
        // Activer le bouton de démarrage
        document.getElementById('startGameBtn').disabled = false;
    });
});

// Gestion de la sélection de la couleur
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        this.classList.add('selected');
        selectedColor = this.dataset.color;
    });
});

// Gestion du bouton de démarrage
document.getElementById('startGameBtn').addEventListener('click', function() {
    let url = '<?php echo $targetPage; ?>';
    
    // Gérer la couleur aléatoire
    let finalColor = selectedColor;
    if (selectedColor === 'random') {
        finalColor = Math.random() > 0.5 ? 'white' : 'black';
        console.log(`🎲 Couleur aléatoire: ${finalColor}`);
    }
    
    // Ajouter les paramètres selon le mode
    if (selectedMode === 'human') {
        url += `?mode=human&color=${finalColor}`;
    } else {
        url += `?level=${selectedMode.replace('level', '')}&color=${finalColor}`;
    }
    
    console.log('🚀 Démarrage de la partie:', { 
        mode: selectedMode, 
        originalColor: selectedColor,
        finalColor: finalColor,
        url: url
    });
    window.location.href = url;
});

// Sélection automatique du mode Humain-Humain au chargement
document.addEventListener('DOMContentLoaded', function() {
    const humanBtn = document.querySelector('.btn-human');
    if (humanBtn) {
        humanBtn.click();
    }
    
    // Assurer que le contenu est visible sur mobile
    setTimeout(() => {
        document.querySelector('.new-game-content').scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
    }, 100);
});
</script>