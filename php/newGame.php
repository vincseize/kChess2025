<?php
// newGame.php
function isMobile() {
    return preg_match('/(android|iphone|ipad|ipod|blackberry|opera mini|windows phone|mobile)/i', $_SERVER['HTTP_USER_AGENT']);
}

$isMobile = isMobile();
$targetPage = 'app.php';

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
                $botTitle = $translations['bots'][$botKey] ?? "Level $levelNum";
                
                // On détermine la classe CSS pour le style (ex: btn-level-5)
                $btnClass = "btn-level-" . $levelNum;
                ?>
                <button class="game-mode-btn <?php echo $btnClass; ?>" 
                        data-mode="bot" 
                        data-level="<?php echo $levelNum; ?>" 
                        data-profondeur="<?php echo ($levelNum >= 3) ? '1' : '0'; ?>">
                    <div class="mode-description">
                        <div>
                            <i class="bi bi-robot mode-icon"></i> 
                            <?php echo $botTitle; ?>
                        </div>
                        <div class="mode-difficulty">
                            <?php 
                                // On peut ajouter des descriptions spécifiques si besoin
                                echo $translations['computer_player'] . " " . $levelNum; 
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
                    <div><?php echo $translations['white'] ?? 'White'; ?></div>
                </div>
                <div class="color-option" data-color="black">
                    <div class="color-piece"><img src="img/chesspieces/wikipedia/bK.png" alt="Black King"></div>
                    <div><?php echo $translations['black'] ?? 'Black'; ?></div>
                </div>
                <div class="color-option random" data-color="random">
                    <div class="color-piece"><i class="bi bi-shuffle" style="font-size: 1.8rem; color: #9C27B0;"></i></div>
                    <div><?php echo $translations['random'] ?? 'Random'; ?></div>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
            <button class="start-game-btn" id="startGameBtn" disabled>
                <i class="bi bi-play-circle me-2"></i>
                <?php echo $translations['start_game'] ?? 'Start Game'; ?>
            </button>
        </div>
    </div>
</div>

<script src="js/kchess/ui/new-game-handler.js?version=<?php echo $version; ?>"></script>
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