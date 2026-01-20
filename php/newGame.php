<?php
// newGame.php

function isMobile() {
    return preg_match(
        '/(android|iphone|ipad|ipod|blackberry|opera mini|windows phone|mobile)/i',
        $_SERVER['HTTP_USER_AGENT']
    );
}

$isMobile = isMobile();
// On définit la page cible pour la redirection après configuration
$targetPage = $isMobile ? 'app.php' : 'app.php';

// Récupérer la configuration pour accéder aux langues
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();
$currentLang = $config['current_lang'];
$translations = $config['lang'][$currentLang];
?>

<link rel="stylesheet" href="css/kchess/newGame.css?version=<?php echo $version; ?>">

<div class="new-game-overlay">
    <div class="new-game-content">

        <div class="lang-selector-top-right">
            <form method="GET" class="d-inline">
                <?php if(isset($_GET['new'])): ?>
                    <input type="hidden" name="new" value="1">
                <?php endif; ?>
                <select name="lang" class="form-select form-select-sm w-auto d-inline lang-select" 
                        onchange="this.form.submit()">
                    <?php foreach ($config['lang'] as $langCode => $langData): ?>
                        <option value="<?php echo $langCode; ?>" 
                                <?php echo $currentLang === $langCode ? 'selected' : ''; ?>>
                            <?php echo $langCode === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'; ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </form>
        </div>

        <div class="new-game-buttons">
            <button class="game-mode-btn btn-human" data-mode="human" data-level="0" data-profondeur="false">
                <div class="mode-description">
                    <div><i class="bi bi-people-fill mode-icon"></i> 
                        <?php echo $translations['human_vs_human'] ?? 'Humain vs Humain'; ?>
                    </div>
                </div>
                <i class="bi bi-check-lg check-icon"></i>
            </button>

            <button class="game-mode-btn btn-level-0" data-mode="bot" data-level="1" data-profondeur="0">
                <div class="mode-description">
                    <div><i class="bi bi-cpu mode-icon"></i> 
                        <?php echo $translations['random_bot'] ?? 'Niveau 1 - Aléatoire'; ?>
                    </div>
                    <div class="mode-difficulty">
                        <?php echo $translations['bot_random_desc'] ?? 'Bot : Coups aléatoires'; ?>
                    </div>
                </div>
                <i class="bi bi-check-lg check-icon"></i>
            </button>

            <button class="game-mode-btn btn-level-1" data-mode="bot" data-level="2" data-profondeur="0">
                <div class="mode-description">
                    <div><i class="bi bi-robot mode-icon"></i> 
                        <?php echo $translations['ccmo_bot'] ?? 'Niveau 2 - CCMO'; ?>
                    </div>
                    <div class="mode-difficulty">
                        <?php echo $translations['bot_ecmo_desc'] ?? 'Bot : Échec, Capture, Menace, Optimisation'; ?>
                    </div>
                </div>
                <i class="bi bi-check-lg check-icon"></i>
            </button>

            <button class="game-mode-btn btn-level-1" 
                    data-mode="bot" 
                    data-level="3" 
                    data-profondeur="1" 
                    style="background: #d45d00 !important; border-left-color: #8a4d02 !important;">
                <div class="mode-description" style="background: transparent !important;">
                    <div style="color: white !important;"> 
                        <i class="bi bi-robot mode-icon" style="color: white !important;"></i> 
                        <?php echo $translations['ccmo_bot3'] ?? 'Niveau 3 - CCMO'; ?>
                    </div>
                    <div class="mode-difficulty" style="color: rgba(255,255,255,0.8) !important;"> 
                        <?php echo $translations['bot_ecmo_desc3'] ?? 'Bot : ECMO, pas de pièce en prise directe'; ?>
                    </div>
                </div>
                <i class="bi bi-check-lg check-icon" style="color: white !important;"></i>
            </button>
        </div>

        <div class="color-selection">
            <div class="color-options">
                <div class="color-option selected" data-color="white">
                    <div class="color-piece">
                        <img src="img/chesspieces/wikipedia/wK.png" alt="Roi Blanc">
                    </div>
                    <div><?php echo $translations['white'] ?? 'Blancs'; ?></div>
                </div>
                <div class="color-option" data-color="black">
                    <div class="color-piece">
                        <img src="img/chesspieces/wikipedia/bK.png" alt="Roi Noir">
                    </div>
                    <div><?php echo $translations['black'] ?? 'Noirs'; ?></div>
                </div>
                <div class="color-option random" data-color="random">
                    <div class="color-piece">
                        <i class="bi bi-shuffle" style="font-size: 1.8rem; color: #9C27B0;"></i>
                    </div>
                    <div><?php echo $translations['random'] ?? 'Aléatoire'; ?></div>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
            <button class="start-game-btn" id="startGameBtn" disabled>
                <i class="bi bi-play-circle me-2"></i>
                <?php echo $translations['start_game'] ?? 'Démarrer la Partie'; ?>
            </button>
        </div>
    </div>
</div>

<script src="js/kchess/ui/new-game-handler.js?version=<?php echo $version; ?>"></script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // 1. GESTION DU RESET
    const params = new URLSearchParams(window.location.search);
    if (params.has('new')) {
        console.log("🎲 Nouvelle partie demandée : nettoyage des données...");
        
        localStorage.clear();
        sessionStorage.clear();
        
        // Sécurité pour forcer le bouton à rester désactivé au chargement
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) startBtn.disabled = true;
    }

    // 2. INITIALISATION DU HANDLER
    if (typeof NewGameHandler !== 'undefined') {
        NewGameHandler.init('<?php echo $targetPage; ?>');
    } else {
        console.error("❌ Erreur : NewGameHandler n'a pas pu être chargé.");
    }
});
</script>