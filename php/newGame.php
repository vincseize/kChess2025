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

<script src="js/kchess/ui/new-game-handler.js?version=<?php echo $version; ?>"></script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Vérification de sécurité avant initialisation
    if (typeof NewGameHandler !== 'undefined') {
        NewGameHandler.init('<?php echo $targetPage; ?>');
    } else {
        console.error("❌ Erreur : NewGameHandler n'a pas pu être chargé. Vérifiez le chemin du fichier.");
    }
});
</script>