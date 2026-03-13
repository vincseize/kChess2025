<?php
// newGame.php
function isMobile() {
    return preg_match('/(android|iphone|ipad|ipod|blackberry|opera mini|windows phone|mobile)/i', $_SERVER['HTTP_USER_AGENT']);
}

$isMobile = isMobile();
$targetPage = 'app.php';

require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();
$currentLang = $config['current_lang'] ?? 'fr'; // Défaut fr si vide
$translations = $config['lang'][$currentLang] ?? [];
?>

<link rel="stylesheet" href="css/kchess/newGame.css?v=<?php echo $config['version'] ?? time(); ?>">

<div class="new-game-overlay">
    <div class="new-game-content">

        <div class="lang-selector-top-right">
            <form method="GET" action="index.php" class="d-inline">
                <?php if(isset($_GET['new'])): ?><input type="hidden" name="new" value="1"><?php endif; ?>
                <select name="lang" class="form-select form-select-sm w-auto d-inline lang-select" onchange="this.form.submit()">
                    <?php foreach ($config['lang'] as $langCode => $langData): ?>
                        <option value="<?php echo $langCode; ?>" <?php echo $currentLang === $langCode ? 'selected' : ''; ?>>
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

            <?php 
            $botDir = __DIR__ . '/js/kchess/bots/';
            $botFiles = glob($botDir . 'Level_*.js');
            sort($botFiles, SORT_NATURAL);

            foreach ($botFiles as $file):
                $levelNum = str_replace(['Level_', '.js'], '', basename($file));
                $botKey = "bot_" . $levelNum;
                
                // --- CORRECTION DU BUG DE TRADUCTION ---
                // On vérifie si la clé bot_X existe et si c'est un tableau (comme dans votre JSON)
                $botData = $translations['bots'][$botKey] ?? null;
                if (is_array($botData)) {
                    $botTitle = $botData['title'] ?? "Level $levelNum";
                } else {
                    $botTitle = $botData ?? "Level $levelNum";
                }
                
                $btnClass = "btn-level-" . $levelNum;
                ?>
                <button class="game-mode-btn <?php echo $btnClass; ?>" 
                        data-mode="bot" 
                        data-level="<?php echo $levelNum; ?>" 
                        data-profondeur="<?php echo ($levelNum >= 3) ? '1' : '0'; ?>">
                    <div class="mode-description">
                        <div>
                            <i class="bi bi-robot mode-icon"></i> 
                            <?php echo htmlspecialchars($botTitle); ?>
                        </div>
                        <div class="mode-difficulty">
                            <?php 
                                // Utilise la description du JSON si elle existe, sinon texte par défaut
                                echo $botData['description'] ?? ($translations['computer_player'] ?? 'Ordinateur') . " " . $levelNum; 
                            ?>
                        </div>
                    </div>
                    <i class="bi bi-check-lg check-icon"></i>
                </button>
            <?php endforeach; ?>
        </div>

        <div class="color-selection">
            <div class="color-options">
                <div class="color-option selected" data-color="white">
                    <div class="color-piece"><img src="img/chesspieces/wikipedia/wK.png" alt="White King"></div>
                    <div><?php echo $translations['white'] ?? 'Blanc'; ?></div>
                </div>
                <div class="color-option" data-color="black">
                    <div class="color-piece"><img src="img/chesspieces/wikipedia/bK.png" alt="Black King"></div>
                    <div><?php echo $translations['black'] ?? 'Noir'; ?></div>
                </div>
                <div class="color-option random" data-color="random">
                    <div class="color-piece"><i class="bi bi-shuffle" style="font-size: 1.8rem; color: #9C27B0;"></i></div>
                    <div><?php echo $translations['random'] ?? 'Aléatoire'; ?></div>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
            <button class="start-game-btn" id="startGameBtn" disabled>
                <i class="bi bi-play-circle me-2"></i>
                <?php echo $translations['start_game'] ?? 'Démarrer la partie'; ?>
            </button>
        </div>
    </div>
</div>

<script src="js/kchess/ui/new-game-handler.js?v=<?php echo $config['version'] ?? time(); ?>"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('new')) {
        localStorage.clear();
        sessionStorage.clear();
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) startBtn.disabled = true;
    }
    if (typeof NewGameHandler !== 'undefined') {
        NewGameHandler.init('<?php echo $targetPage; ?>');
    }
});
</script>