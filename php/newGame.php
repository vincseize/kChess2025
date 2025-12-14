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

// Récupérer la configuration pour accéder aux langues
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();
?>

<link rel="stylesheet" href="css/kchess/newGame.css?version=<?php echo $version; ?>">

<div class="new-game-overlay">
    <div class="new-game-content">

        <!-- AJOUT : Sélecteur de langue en haut à droite -->
        <div class="lang-selector-top-right">
            <form method="GET" class="d-inline">
                <select name="lang" class="form-select form-select-sm w-auto d-inline lang-select" 
                        onchange="this.form.submit()">
                    <?php foreach ($config['lang'] as $langCode => $langData): ?>
                        <option value="<?php echo $langCode; ?>" 
                                <?php echo $config['current_lang'] === $langCode ? 'selected' : ''; ?>>
                            <?php 
                                // Afficher le nom de la langue dans sa propre langue
                                echo $langCode === 'fr' ? '🇫🇷 Français' : '🇬🇧 English';
                            ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </form>
        </div>

        <!-- Sélection du mode de jeu -->
        <div class="new-game-buttons">
            <button class="game-mode-btn btn-human" data-mode="human" data-level="0" data-profondeur="false">
                <div class="mode-description">
                    <div><i class="bi bi-people-fill mode-icon"></i> 
                        <?php echo $config['lang'][$config['current_lang']]['human_vs_human'] ?? 'Humain vs Humain'; ?>
                    </div>
                </div>
                <i class="bi bi-check-lg check-icon"></i>
            </button>

            <button class="game-mode-btn btn-level-0" data-mode="bot" data-level="1" data-profondeur="0">
                <div class="mode-description">
                    <div><i class="bi bi-cpu mode-icon"></i> 
                        <?php echo $config['lang'][$config['current_lang']]['random_bot'] ?? 'Niveau 1 - Aléatoire'; ?>
                    </div>
                    <div class="mode-difficulty">
                        <?php echo $config['lang'][$config['current_lang']]['bot_random_desc'] ?? 'Bot : Coups aléatoires'; ?>
                    </div>
                    <div class="mode-difficulty">
                        <?php echo $config['lang'][$config['current_lang']]['Level'] ?? 'Niveau'; ?> 0
                    </div>
                </div>
                <i class="bi bi-check-lg check-icon"></i>
            </button>

            <button class="game-mode-btn btn-level-1" data-mode="bot" data-level="2" data-profondeur="0">
                <div class="mode-description">
                    <div><i class="bi bi-robot mode-icon"></i> 
                        <?php echo $config['lang'][$config['current_lang']]['ccmo_bot'] ?? 'Niveau 2 - CCMO'; ?>
                    </div>
                    <div class="mode-difficulty">
                        <?php echo $config['lang'][$config['current_lang']]['bot_ecmo_desc'] ?? 'Bot : Échec, Capture, Menace, Optimisation'; ?>
                    </div>
                    <div class="mode-difficulty">
                        <?php echo $config['lang'][$config['current_lang']]['Level'] ?? 'Niveau'; ?> 0
                    </div>
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
                    <div><?php echo $config['lang'][$config['current_lang']]['white'] ?? 'Blancs'; ?></div>
                </div>
                <div class="color-option" data-color="black">
                    <div class="color-piece">
                        <img src="img/chesspieces/wikipedia/bK.png" alt="Roi Noir">
                    </div>
                    <div><?php echo $config['lang'][$config['current_lang']]['black'] ?? 'Noirs'; ?></div>
                </div>
                <div class="color-option random" data-color="random">
                    <div class="color-piece">
                        <i class="bi bi-shuffle" style="font-size: 1.8rem; color: #9C27B0;"></i>
                    </div>
                    <div><?php echo $config['lang'][$config['current_lang']]['random'] ?? 'Aléatoire'; ?></div>
                </div>
            </div>
        </div>

        <!-- Bouton de validation -->
        <div style="text-align: center; margin-top: 2rem;">
            <button class="start-game-btn" id="startGameBtn" disabled>
                <i class="bi bi-play-circle me-2"></i>
                <?php echo $config['lang'][$config['current_lang']]['start_game'] ?? 'Démarrer la Partie'; ?>
            </button>
        </div>
    </div>
</div>

<script>
let selectedMode = null;
let selectedLevel = null;
let selectedProfondeur = null;
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
        selectedLevel = this.dataset.level;
        selectedProfondeur = this.dataset.profondeur;
        
        // Activer le bouton de démarrage
        document.getElementById('startGameBtn').disabled = false;
        
        // Déterminer le nom du bot basé sur le niveau
        let botName = 'Humain';
        if (selectedMode === 'bot') {
            if (selectedLevel === '1') {
                botName = 'Level_0 (Aléatoire)';
            } else if (selectedLevel === '2') {
                botName = 'Level_1 (CCMO)';
            } else {
                botName = 'Inconnu';
            }
        }
        
        console.log('🎮 Mode sélectionné:', {
            mode: selectedMode,
            level: selectedLevel,
            profondeur: selectedProfondeur,
            botName: botName,
            description: 'Level 0=désactivé, 1=Aléatoire, 2=CCMO'
        });
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
    
    // Construire l'URL avec tous les paramètres harmonisés
    const params = new URLSearchParams({
        mode: selectedMode,
        level: selectedLevel,
        profondeur: selectedProfondeur,
        color: finalColor
    });
    
    url += '?' + params.toString();
    
    // Déterminer le nom du bot
    let botName = 'Humain';
    if (selectedMode === 'bot') {
        if (selectedLevel === '1') {
            botName = 'Level_0 (Aléatoire)';
        } else if (selectedLevel === '2') {
            botName = 'Level_1 (CCMO)';
        } else {
            botName = 'Inconnu';
        }
    }
    
    console.log('🚀 Démarrage de la partie:', { 
        mode: selectedMode,
        level: selectedLevel,
        profondeur: selectedProfondeur,
        originalColor: selectedColor,
        finalColor: finalColor,
        botName: botName,
        url: url,
        mapping: 'Niveau 0=désactivé, 1=Aléatoire, 2=CCMO'
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