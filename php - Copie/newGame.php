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

// Récupérer la langue
$lang = isset($_GET['lang']) ? $_GET['lang'] : 'fr';
if (!in_array($lang, ['fr', 'en'])) {
    $lang = 'fr';
}

// Charger la configuration pour avoir les traductions
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();

// Récupérer les traductions depuis le JSON
$translations = isset($config['lang'][$lang]) ? $config['lang'][$lang] : $config['lang']['fr'];
?>

<link rel="stylesheet" href="css/kchess/newGame.css?version=<?php echo $version; ?>">

<div class="new-game-overlay">
    <div class="new-game-content">
        
        <!-- SÉLECTEUR DE LANGUE - SIMPLE ET VISIBLE -->
        <div style="position: absolute; top: 20px; right: 20px; z-index: 1000;">
            <div style="display: flex; align-items: center; gap: 10px; background: white; 
                        padding: 8px 12px; border-radius: 8px; border: 2px solid #764ba2;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <span style="color: #764ba2; font-weight: bold; font-size: 14px;">
                    <i class="bi bi-translate"></i> 
                    <?php echo $lang === 'fr' ? 'Langue:' : 'Language:'; ?>
                </span>
                <div style="display: flex; gap: 5px;">
                    <button onclick="changeLanguage('fr')" 
                            style="padding: 5px 15px; border: 2px solid <?php echo $lang === 'fr' ? '#764ba2' : '#ddd'; ?>; 
                                   background: <?php echo $lang === 'fr' ? '#764ba2' : 'white'; ?>; 
                                   color: <?php echo $lang === 'fr' ? 'white' : '#764ba2'; ?>; 
                                   border-radius: 5px; cursor: pointer; font-weight: bold;">
                        FR
                    </button>
                    <button onclick="changeLanguage('en')" 
                            style="padding: 5px 15px; border: 2px solid <?php echo $lang === 'en' ? '#764ba2' : '#ddd'; ?>; 
                                   background: <?php echo $lang === 'en' ? '#764ba2' : 'white'; ?>; 
                                   color: <?php echo $lang === 'en' ? 'white' : '#764ba2'; ?>; 
                                   border-radius: 5px; cursor: pointer; font-weight: bold;">
                        EN
                    </button>
                </div>
            </div>
        </div>

<!-- Sélection du mode de jeu -->
<div class="new-game-buttons">
    <button class="game-mode-btn btn-human" data-mode="human" data-level="0" data-profondeur="false">
        <div class="mode-description">
            <div><i class="bi bi-people-fill mode-icon"></i> <?php echo $translations['human_vs_human']; ?></div>
        </div>
        <i class="bi bi-check-lg check-icon"></i>
    </button>

    <button class="game-mode-btn btn-level-0" data-mode="bot" data-level="1" data-profondeur="0">
        <div class="mode-description">
            <div><i class="bi bi-cpu mode-icon"></i> <?php echo $translations['random_bot']; ?></div>
            <div class="mode-difficulty"><?php echo $translations['bot_random_desc']; ?></div>
            <div class="mode-difficulty"><?php echo $translations['Level']; ?> 0</div>
        </div>
        <i class="bi bi-check-lg check-icon"></i>
    </button>

    <button class="game-mode-btn btn-level-1" data-mode="bot" data-level="2" data-profondeur="0">
        <div class="mode-description">
            <div><i class="bi bi-robot mode-icon"></i> <?php echo $translations['ccmo_bot']; ?></div>
            <div class="mode-difficulty">
                <?php 
                // CORRECTION : utiliser la clé correcte 'bot_ccto_desc' au lieu de 'bot_ecmo_desc'
                echo isset($translations['bot_ccto_desc']) 
                     ? $translations['bot_ccto_desc'] 
                     : 'Bot : Échec, Capture, Menace, Optimisation';
                ?>
            </div>
            <div class="mode-difficulty"><?php echo $translations['Level']; ?> 0</div>
        </div>
        <i class="bi bi-check-lg check-icon"></i>
    </button>
</div>


        <!-- Sélection de la couleur -->
        <div class="color-selection">
            <h5><?php echo $translations['select_color']; ?></h5>
            <div class="color-options">
                <div class="color-option selected" data-color="white">
                    <div class="color-piece">
                        <img src="img/chesspieces/wikipedia/wK.png" alt="<?php echo $translations['white']; ?>">
                    </div>
                    <div><?php echo $translations['white']; ?></div>
                </div>
                <div class="color-option" data-color="black">
                    <div class="color-piece">
                        <img src="img/chesspieces/wikipedia/bK.png" alt="<?php echo $translations['black']; ?>">
                    </div>
                    <div><?php echo $translations['black']; ?></div>
                </div>
                <div class="color-option random" data-color="random">
                    <div class="color-piece">
                        <i class="bi bi-shuffle" style="font-size: 1.8rem; color: #9C27B0;"></i>
                    </div>
                    <div><?php echo $translations['random']; ?></div>
                </div>
            </div>
        </div>

        <!-- Bouton de validation -->
        <div style="text-align: center; margin-top: 2rem;">
            <button class="start-game-btn" id="startGameBtn" disabled>
                <i class="bi bi-play-circle me-2"></i><?php echo $translations['start_game']; ?>
            </button>
        </div>
    </div>
</div>

<script>
// Fonction pour changer la langue
function changeLanguage(lang) {
    // Mettre à jour l'URL avec la nouvelle langue
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.location.href = url.toString();
}

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
        let botName = '<?php echo $translations['human_vs_human']; ?>';
        if (selectedMode === 'bot') {
            if (selectedLevel === '1') {
                botName = '<?php echo $translations['random_bot']; ?>';
            } else if (selectedLevel === '2') {
                botName = '<?php echo $translations['ccmo_bot']; ?>';
            } else {
                botName = '<?php echo $translations['unknown']; ?>';
            }
        }
        
        console.log('🎮 <?php echo $lang === "fr" ? "Mode sélectionné:" : "Mode selected:"; ?>', {
            mode: selectedMode,
            level: selectedLevel,
            profondeur: selectedProfondeur,
            botName: botName,
            description: '<?php echo $lang === "fr" ? "Niveau 0=désactivé, 1=Aléatoire, 2=CCMO" : "Level 0=disabled, 1=Random, 2=CCMO"; ?>'
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

// Gestion du bouton de démarrage (AJOUTER LA LANGUE)
document.getElementById('startGameBtn').addEventListener('click', function() {
    let url = '<?php echo $targetPage; ?>';
    
    // Gérer la couleur aléatoire
    let finalColor = selectedColor;
    if (selectedColor === 'random') {
        finalColor = Math.random() > 0.5 ? 'white' : 'black';
        console.log(`🎲 <?php echo $lang === "fr" ? "Couleur aléatoire:" : "Random color:"; ?> ${finalColor}`);
    }
    
    // Construire l'URL avec TOUS les paramètres (INCLURE LA LANGUE)
    const params = new URLSearchParams({
        mode: selectedMode,
        level: selectedLevel,
        profondeur: selectedProfondeur,
        color: finalColor,
        lang: '<?php echo $lang; ?>'  // AJOUTER LA LANGUE
    });
    
    url += '?' + params.toString();
    
    // Déterminer le nom du bot
    let botName = '<?php echo $translations['human_vs_human']; ?>';
    if (selectedMode === 'bot') {
        if (selectedLevel === '1') {
            botName = '<?php echo $translations['random_bot']; ?>';
        } else if (selectedLevel === '2') {
            botName = '<?php echo $translations['ccmo_bot']; ?>';
        } else {
            botName = '<?php echo $translations['unknown']; ?>';
        }
    }
    
    console.log('🚀 <?php echo $lang === "fr" ? "Démarrage de la partie:" : "Starting game:"; ?>', { 
        mode: selectedMode,
        level: selectedLevel,
        profondeur: selectedProfondeur,
        originalColor: selectedColor,
        finalColor: finalColor,
        lang: '<?php echo $lang; ?>',
        botName: botName,
        url: url,
        mapping: '<?php echo $lang === "fr" ? "Niveau 0=désactivé, 1=Aléatoire, 2=CCMO" : "Level 0=disabled, 1=Random, 2=CCMO"; ?>'
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