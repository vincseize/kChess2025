<?php
// newGame.php
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();
$currentLang = $config['current_lang'];
$translations = $config['lang'][$currentLang];
$version = getVersion();
$targetPage = 'app.php';
?>

<link rel="stylesheet" href="css/kchess/newGame.css?version=<?php echo $version; ?>">

<div class="lang-selector-screen-edge">
    <form method="GET" class="d-inline">
        <?php if(isset($_GET['new'])): ?><input type="hidden" name="new" value="1"><?php endif; ?>
        <select name="lang" class="form-select form-select-sm lang-select-minimal" onchange="this.form.submit()">
            <?php foreach ($config['lang'] as $langCode => $langData): ?>
                <option value="<?php echo $langCode; ?>" <?php echo $currentLang === $langCode ? 'selected' : ''; ?>>
                    <?php echo $langCode === 'fr' ? '🇫🇷' : '🇬🇧'; ?>
                </option>
            <?php endforeach; ?>
        </select>
    </form>
</div>

<div class="new-game-overlay">
    <div class="new-game-content">
        <div class="new-game-buttons">
            
            <div class="mode-grid">
                <button class="game-mode-btn btn-human" data-mode="human" data-level="0">
                    <div class="mode-description">
                        <i class="bi bi-people-fill mode-icon"></i> 
                        <span><?php echo $translations['human_vs_human'] ?? 'Humain'; ?></span>
                    </div>
                </button>

                <?php 
                if (file_exists(__DIR__ . '/js/kchess/bots/Level_1.js')): 
                    $botTitle = $translations['bots']["bot_1"] ?? "Level 1";
                ?>
                <button class="game-mode-btn btn-level-1" data-mode="bot" data-level="1">
                    <div class="mode-description">
                        <i class="bi bi-robot mode-icon"></i> 
                        <span><?php echo $botTitle; ?></span>
                        <?php if (isset($translations['bots']["bot_1_info"])): ?>
                            <div class="info-tooltip-wrapper" onclick="event.stopPropagation();">
                                <i class="bi bi-info-circle info-btn-icon"></i>
                                <span class="info-tooltip-text"><?php echo htmlspecialchars($translations['bots']["bot_1_info"]); ?></span>
                            </div>
                        <?php endif; ?>
                    </div>
                </button>
                <?php endif; ?>
            </div>

            <div class="mode-grid">
                <?php for($i=2; $i<=3; $i++): 
                    if (file_exists(__DIR__ . '/js/kchess/bots/Level_'.$i.'.js')): 
                        $botTitle = $translations['bots']["bot_$i"] ?? "Level $i";
                ?>
                    <button class="game-mode-btn btn-level-<?php echo $i; ?>" data-mode="bot" data-level="<?php echo $i; ?>">
                        <div class="mode-description">
                            <i class="bi bi-robot mode-icon"></i> 
                            <span><?php echo $botTitle; ?></span>
                            <?php if (isset($translations['bots']["bot_{$i}_info"])): ?>
                                <div class="info-tooltip-wrapper" onclick="event.stopPropagation();">
                                    <i class="bi bi-info-circle info-btn-icon"></i>
                                    <span class="info-tooltip-text"><?php echo htmlspecialchars($translations['bots']["bot_{$i}_info"]); ?></span>
                                </div>
                            <?php endif; ?>
                        </div>
                    </button>
                <?php endif; endfor; ?>
            </div>

            <?php 
            $botFiles = glob(__DIR__ . '/js/kchess/bots/Level_*.js');
            sort($botFiles, SORT_NATURAL);
            foreach ($botFiles as $file):
                $levelNum = str_replace(['Level_', '.js'], '', basename($file));
                if ((int)$levelNum <= 3) continue; 
                $botTitle = $translations['bots']["bot_$levelNum"] ?? "Level $levelNum";
            ?>
                <button class="game-mode-btn btn-level-<?php echo $levelNum; ?>" data-mode="bot" data-level="<?php echo $levelNum; ?>">
                    <div class="mode-description">
                        <i class="bi bi-robot mode-icon"></i> 
                        <span><?php echo $botTitle; ?></span>
                        <?php if (isset($translations['bots']["bot_{$levelNum}_info"])): ?>
                            <div class="info-tooltip-wrapper" onclick="event.stopPropagation();">
                                <i class="bi bi-info-circle info-btn-icon"></i>
                                <span class="info-tooltip-text"><?php echo htmlspecialchars($translations['bots']["bot_{$levelNum}_info"]); ?></span>
                            </div>
                        <?php endif; ?>
                    </div>
                </button>
            <?php endforeach; ?>
        </div>

        <div class="color-selection">
            <div id="mode-reminder" class="mode-reminder">
                <i class="bi bi-info-circle me-1"></i>
                <span id="mode-reminder-text"><?php echo $translations['human_vs_human'] ?? 'Humain vs Humain'; ?></span>
            </div>

            <div class="color-options">
                <div class="color-option selected" data-color="white">
                    <div class="color-piece-wrapper">
                        <img src="img/chesspieces/wikipedia/wK.png" alt="W" class="color-piece-img">
                    </div>
                    <div class="color-label"><?php echo $translations['white'] ?? 'Blancs'; ?></div>
                </div>

                <div class="color-option" data-color="random">
                    <div class="color-piece-wrapper">
                        <i class="bi bi-shuffle color-piece-icon"></i>
                    </div>
                    <div class="color-label"><?php echo $translations['random'] ?? 'Auto'; ?></div>
                </div>

                <div class="color-option" data-color="black">
                    <div class="color-piece-wrapper">
                        <img src="img/chesspieces/wikipedia/bK.png" alt="B" class="color-piece-img">
                    </div>
                    <div class="color-label"><?php echo $translations['black'] ?? 'Noirs'; ?></div>
                </div>
            </div>
        </div>

        <div class="mt-4 text-center">
            <button class="start-game-btn" id="startGameBtn" disabled>
                <i class="bi bi-play-circle me-2"></i>
                <?php echo $translations['start_game'] ?? 'Jouer'; ?>
            </button>
        </div>
    </div>
</div>

<script src="js/kchess/ui/new-game-handler.js?v=<?php echo $version; ?>"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    if (typeof NewGameHandler !== 'undefined') {
        NewGameHandler.init('<?php echo $targetPage; ?>');
    }
    const modeButtons = document.querySelectorAll('.game-mode-btn');
    const reminderText = document.getElementById('mode-reminder-text');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const title = this.querySelector('.mode-description span').innerText;
            if (reminderText) reminderText.innerText = title;
        });
    });
});
</script>