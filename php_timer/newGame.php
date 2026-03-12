<?php
// newGame.php
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();
$currentLang = $config['current_lang'];
$translations = $config['lang'][$currentLang];
$version = getVersion();
$targetPage = 'app.php';

/**
 * Génère le bouton d'un bot avec ses métadonnées
 */
function renderBotButton($levelNum, $translations) {
    $botKey = "bot_{$levelNum}";
    if (!isset($translations['bots'][$botKey])) return '';
    
    $bot = $translations['bots'][$botKey];
    $title = $bot['title'] ?? "Level $levelNum";
    $desc = $bot['description'] ?? "";
    $clock = $bot['clock'] ?? "";
    $inc = $bot['increment'] ?? "00:00:00";
    
    // Extraction propre des secondes d'incrément
    $parts = explode(':', $inc);
    $incSec = (int)end($parts);
    ?>
    <button class="game-mode-btn btn-level-<?php echo $levelNum; ?>" 
            data-mode="bot" 
            data-level="<?php echo $levelNum; ?>"
            data-title="<?php echo htmlspecialchars($title); ?>">
        <div class="mode-description">
            <i class="bi bi-robot mode-icon"></i> 
            <span><?php echo htmlspecialchars($title); ?></span>
            
            <div class="info-tooltip-wrapper" onclick="event.stopPropagation();">
                <i class="bi bi-info-circle info-btn-icon"></i>
                <div class="info-tooltip-text">
                    <div class="mb-2"><?php echo htmlspecialchars($desc); ?></div>
                    <?php if ($clock): ?>
                        <div class="info-clock-line text-nowrap">
                            <i class="bi bi-stopwatch me-1"></i> <?php echo htmlspecialchars($clock); ?>
                            <?php if ($incSec > 0): ?>
                                <span class="ms-1 text-success">
                                    (+<?php echo $incSec; ?>s inc)
                                </span>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </button>
    <?php
}
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
                <button class="game-mode-btn btn-human" data-mode="human" data-level="0" data-title="<?php echo $translations['human_vs_human'] ?? 'Humain'; ?>">
                    <div class="mode-description">
                        <i class="bi bi-people-fill mode-icon"></i> 
                        <span><?php echo $translations['human_vs_human'] ?? 'Humain'; ?></span>
                    </div>
                </button>

                <?php if (file_exists(__DIR__ . '/js/kchess/bots/Level_1.js')) renderBotButton(1, $translations); ?>
                <?php if (file_exists(__DIR__ . '/js/kchess/bots/Level_2.js')) renderBotButton(2, $translations); ?>
                <?php if (file_exists(__DIR__ . '/js/kchess/bots/Level_3.js')) renderBotButton(3, $translations); ?>
            </div>

            <div class="mode-row-bottom">
                <?php 
                $botFiles = glob(__DIR__ . '/js/kchess/bots/Level_*.js');
                sort($botFiles, SORT_NATURAL);
                foreach ($botFiles as $file):
                    $levelNum = (int)str_replace(['Level_', '.js'], '', basename($file));
                    if ($levelNum <= 3) continue; 
                    renderBotButton($levelNum, $translations);
                endforeach; 
                ?>
            </div>
        </div>

        <div class="color-selection">
            <div id="mode-reminder" class="mode-reminder">
                <i class="bi bi-info-circle me-1"></i>
                <span id="mode-reminder-text">Choisissez un mode de jeu</span>
            </div>

            <div class="color-options">
                <div class="color-option" data-color="white">
                    <div class="color-piece-wrapper">
                        <img src="img/chesspieces/wikipedia/wK.png" alt="W" class="color-piece-img">
                    </div>
                    <div class="color-label"><?php echo $translations['white'] ?? 'Blancs'; ?></div>
                </div>

                <div class="color-option selected" data-color="random">
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

<script>
/**
 * Gestionnaire UI pour la création de partie
 */
document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startGameBtn');
    const reminderText = document.getElementById('mode-reminder-text');
    let selectedMode = null;
    let selectedLevel = null;
    let selectedColor = 'random';

    // 1. Gestion des boutons de mode (Humain / Bots)
    document.querySelectorAll('.game-mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // UI : Toggle classe sélection
            document.querySelectorAll('.game-mode-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');

            // Data : Récupération des infos
            selectedMode = this.dataset.mode;
            selectedLevel = this.dataset.level;
            
            // Update UI
            reminderText.textContent = this.dataset.title;
            startBtn.disabled = false;
        });
    });

    // 2. Gestion des options de couleur
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            selectedColor = this.dataset.color;
        });
    });

    // 3. Lancement de la partie
    startBtn.addEventListener('click', function() {
        if (!selectedMode) return;

        // Si random, on tire au sort
        let finalColor = selectedColor;
        if (selectedColor === 'random') {
            finalColor = Math.random() < 0.5 ? 'white' : 'black';
        }

        // Nettoyage stockage local précédent
        if (window.localStorage) localStorage.clear();

        // Construction URL et redirection
        const target = '<?php echo $targetPage; ?>';
        const url = `${target}?mode=${selectedMode}&level=${selectedLevel}&color=${finalColor}`;
        
        window.location.href = url;
    });
});
</script>