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
$assetVersion = $version ?? getVersion();
$operaGameAlt = $translations['opera_game_alt'] ?? "Partie de l'Opera de Paul Morphy, 1858";
?>

<link rel="stylesheet" href="css/kchess/newGame.css?v=<?php echo htmlspecialchars((string)$assetVersion); ?>">
<link rel="stylesheet" href="css/kchess/variables.css?v=<?php echo htmlspecialchars((string)$assetVersion); ?>">
<style>
    :root { <?php echo getThemeCssVariables($config); ?> }
</style>

<div class="new-game-overlay">
    <main class="new-game-layout">
        <section class="new-game-intro" aria-labelledby="home-title">
            <div class="hero-copy">
                <p class="hero-kicker">La Dame de Bellefontaine<br>App Chess Club training</p>
                <h1 id="home-title">
                    <?php echo htmlspecialchars($translations['home_title_first'] ?? 'Les échecs,'); ?><br>
                    <span><?php echo htmlspecialchars($translations['home_title_second'] ?? 'à votre façon.'); ?></span>
                </h1>
                <p class="hero-description">
                    <?php echo htmlspecialchars($translations['home_tagline'] ?? 'Jouez à deux sur le même écran ou défiez un bot. Choisissez votre camp et lancez la partie.'); ?>
                </p>
            </div>

            <div class="board-preview-group">
                <div class="board-preview">
                    <picture>
                        <source media="(prefers-reduced-motion: reduce)" srcset="img/opera-game-poster.png?v=<?php echo htmlspecialchars((string)$assetVersion); ?>">
                        <img src="img/opera-game.gif?v=<?php echo htmlspecialchars((string)$assetVersion); ?>" alt="<?php echo htmlspecialchars($operaGameAlt); ?>" width="280" height="280">
                    </picture>
                </div>

                <div class="home-feature-actions" aria-label="Modes de jeu supplémentaires">
                    <a class="home-feature-btn" href="clock.php">
                        <i class="bi bi-clock" aria-hidden="true"></i>
                        <span>Clock</span>
                    </a>
                    <button class="home-feature-btn" type="button" id="startChess960">
                        <i class="bi bi-shuffle" aria-hidden="true"></i>
                        <span><?php echo htmlspecialchars($translations['random_chess960_position'] ?? 'Random Chess960 position'); ?></span>
                    </button>
                </div>
            </div>

            <p class="local-game-note">
                <i class="bi bi-shield-check" aria-hidden="true"></i>
                <?php echo htmlspecialchars($translations['local_game_note'] ?? 'Une partie locale, sans inscription.'); ?>
            </p>
        </section>

        <section class="new-game-content" aria-labelledby="setup-title">
            <header class="setup-header">
                <div>
                    <h2 id="setup-title"><?php echo htmlspecialchars($translations['setup_title'] ?? 'Préparez votre partie'); ?></h2>
                </div>
                <div class="lang-selector">
                    <form method="GET" action="index.php">
                        <?php if(isset($_GET['new'])): ?><input type="hidden" name="new" value="1"><?php endif; ?>
                        <label class="visually-hidden" for="languageSelect"><?php echo htmlspecialchars($translations['language'] ?? 'Langue'); ?></label>
                        <select id="languageSelect" name="lang" class="form-select form-select-sm lang-select" onchange="this.form.submit()">
                            <?php foreach ($config['lang'] as $langCode => $langData): ?>
                                <option value="<?php echo htmlspecialchars($langCode); ?>" <?php echo $currentLang === $langCode ? 'selected' : ''; ?>>
                                    <?php
                                    $languageNames = [
                                        'fr' => '🇫🇷 Français',
                                        'en' => '🇬🇧 English',
                                        'es' => '🇪🇸 Español',
                                        'de' => '🇩🇪 Deutsch',
                                    ];
                                    echo htmlspecialchars($languageNames[$langCode] ?? strtoupper($langCode));
                                    ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </form>
                </div>
            </header>

            <div class="new-game-buttons" role="group" aria-labelledby="setup-title">
                <?php
                $botDir = __DIR__ . '/js/kchess/bots/';
                $botFiles = glob($botDir . 'Level_*.js');
                sort($botFiles, SORT_NATURAL);
                $botSearchDepths = [
                    1 => 0,
                    2 => 0,
                    3 => 0,
                    4 => 0,
                    5 => 0,
                    6 => 0,
                    7 => 0,
                    8 => 0,
                    16 => 1,
                ];

                foreach ($botFiles as $file):
                    $levelNum = str_replace(['Level_', '.js'], '', basename($file));
                    $searchDepth = $botSearchDepths[(int)$levelNum] ?? null;
                    $botKey = "bot_" . $levelNum;
                    $botData = $translations['bots'][$botKey] ?? null;
                    if (is_array($botData)) {
                        $botTitle = $botData['title'] ?? "Level $levelNum";
                    } else {
                        $botTitle = $botData ?? "Level $levelNum";
                    }

                    $btnClass = "btn-level-" . $levelNum;
                    ?>
                    <button type="button" class="game-mode-btn <?php echo htmlspecialchars($btnClass); ?>"
                            data-mode="bot"
                            data-level="<?php echo htmlspecialchars($levelNum); ?>"
                            <?php if ($searchDepth !== null): ?>
                            data-profondeur="<?php echo htmlspecialchars((string)$searchDepth); ?>"
                            <?php endif; ?>
                            aria-pressed="false">
                        <?php if ($searchDepth !== null): ?>
                        <span class="bot-search-depth"
                              title="<?php echo htmlspecialchars('Profondeur de recherche indiquée : ' . $searchDepth); ?>"
                              aria-label="<?php echo htmlspecialchars('Profondeur de recherche indiquée : ' . $searchDepth); ?>">
                            <?php echo htmlspecialchars((string)$searchDepth); ?>
                        </span>
                        <?php endif; ?>
                        <div class="mode-description">
                            <div>
                                <i class="bi bi-robot mode-icon" aria-hidden="true"></i>
                                <?php echo htmlspecialchars($botTitle); ?>
                            </div>
                            <div class="mode-difficulty">
                                <?php
                                    echo htmlspecialchars($botData['description'] ?? ($translations['computer_player'] ?? 'Ordinateur') . " " . $levelNum);
                                ?>
                            </div>
                        </div>
                        <div class="bot-training-progress"
                             data-training-level="<?php echo htmlspecialchars($levelNum); ?>"
                             role="group"
                             aria-label="<?php echo htmlspecialchars($translations['training_progress'] ?? 'Victoires d’entraînement'); ?>">
                            <span class="training-mark" data-training-type="white"
                                  data-label="<?php echo htmlspecialchars($translations['training_white_win'] ?? 'Victoire avec les Blancs'); ?>"
                                  data-done-label="<?php echo htmlspecialchars($translations['training_done'] ?? 'terminé'); ?>"
                                  data-pending-label="<?php echo htmlspecialchars($translations['training_pending'] ?? 'à faire'); ?>"
                                  role="img"
                                  aria-label="<?php echo htmlspecialchars($translations['training_white_win'] ?? 'Victoire avec les Blancs'); ?>">
                                <span class="training-symbol" aria-hidden="true">♔</span>
                                <i class="bi bi-check-lg training-check" aria-hidden="true"></i>
                            </span>
                            <span class="training-mark" data-training-type="black"
                                  data-label="<?php echo htmlspecialchars($translations['training_black_win'] ?? 'Victoire avec les Noirs'); ?>"
                                  data-done-label="<?php echo htmlspecialchars($translations['training_done'] ?? 'terminé'); ?>"
                                  data-pending-label="<?php echo htmlspecialchars($translations['training_pending'] ?? 'à faire'); ?>"
                                  role="img"
                                  aria-label="<?php echo htmlspecialchars($translations['training_black_win'] ?? 'Victoire avec les Noirs'); ?>">
                                <span class="training-symbol" aria-hidden="true">♚</span>
                                <i class="bi bi-check-lg training-check" aria-hidden="true"></i>
                            </span>
                            <span class="training-mark" data-training-type="random"
                                  data-label="<?php echo htmlspecialchars($translations['training_random_win'] ?? 'Victoire en choisissant Aléatoire'); ?>"
                                  data-done-label="<?php echo htmlspecialchars($translations['training_done'] ?? 'terminé'); ?>"
                                  data-pending-label="<?php echo htmlspecialchars($translations['training_pending'] ?? 'à faire'); ?>"
                                  role="img"
                                  aria-label="<?php echo htmlspecialchars($translations['training_random_win'] ?? 'Victoire en choisissant Aléatoire'); ?>">
                                <i class="bi bi-shuffle training-symbol" aria-hidden="true"></i>
                                <i class="bi bi-check-lg training-check" aria-hidden="true"></i>
                            </span>
                        </div>
                        <i class="bi bi-check-lg check-icon" aria-hidden="true"></i>
                    </button>
                <?php endforeach; ?>

                <button type="button" class="game-mode-btn btn-human" data-mode="human" data-level="0" data-profondeur="false" aria-pressed="false">
                    <div class="mode-description">
                        <div><i class="bi bi-people-fill mode-icon" aria-hidden="true"></i>
                            <?php echo htmlspecialchars($translations['human_vs_human'] ?? 'Humain vs Humain'); ?>
                        </div>
                    </div>
                    <i class="bi bi-check-lg check-icon" aria-hidden="true"></i>
                </button>

                <button type="button" class="game-mode-btn btn-human-960" data-mode="human" data-level="0" data-profondeur="false" data-variant="chess960" aria-pressed="false">
                    <div class="mode-description">
                        <div><i class="bi bi-people-fill mode-icon" aria-hidden="true"></i>
                            <?php echo htmlspecialchars($translations['human_vs_human_960'] ?? 'Humain vs Humain 960'); ?>
                        </div>
                        <div class="mode-difficulty">
                            <?php echo htmlspecialchars($translations['random_chess960_position'] ?? 'Position Chess960 aléatoire'); ?>
                        </div>
                    </div>
                    <i class="bi bi-check-lg check-icon" aria-hidden="true"></i>
                </button>
            </div>

            <div class="color-selection">
                <h3 class="section-title"><?php echo htmlspecialchars($translations['choose_color'] ?? '2. Choisissez votre camp'); ?></h3>
                <div class="color-options" role="group" aria-label="<?php echo htmlspecialchars($translations['choose_color'] ?? 'Choisissez votre camp'); ?>">
                    <button type="button" class="color-option selected" data-color="white" aria-pressed="true">
                        <span class="color-piece"><img src="img/chesspieces/wikipedia/wK.png" alt=""></span>
                        <span><?php echo htmlspecialchars($translations['white'] ?? 'Blanc'); ?></span>
                    </button>
                    <button type="button" class="color-option" data-color="black" aria-pressed="false">
                        <span class="color-piece"><img src="img/chesspieces/wikipedia/bK.png" alt=""></span>
                        <span><?php echo htmlspecialchars($translations['black'] ?? 'Noir'); ?></span>
                    </button>
                    <button type="button" class="color-option random" data-color="random" aria-pressed="false">
                        <span class="color-piece"><i class="bi bi-shuffle" aria-hidden="true"></i></span>
                        <span><?php echo htmlspecialchars($translations['random'] ?? 'Aléatoire'); ?></span>
                    </button>
                </div>
            </div>

            <button type="button" class="start-game-btn" id="startGameBtn" disabled>
                <i class="bi bi-play-circle me-2" aria-hidden="true"></i>
                <?php echo htmlspecialchars($translations['start_game'] ?? 'Démarrer la partie'); ?>
            </button>
        </section>
    </main>
</div>

<script src="js/kchess/ui/new-game-handler.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
<script src="js/kchess/ui/bot-training-progress.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('new')) {
        try {
            const savedBotLevel = localStorage.getItem('kchess.selectedBotLevel');
            const savedTrainingProgress = localStorage.getItem(BotTrainingProgress.storageKey);
            localStorage.clear();
            if (savedBotLevel) localStorage.setItem('kchess.selectedBotLevel', savedBotLevel);
            if (savedTrainingProgress) localStorage.setItem(BotTrainingProgress.storageKey, savedTrainingProgress);
        } catch (error) {
            console.warn('Impossible de réinitialiser les préférences locales.', error);
        }
        sessionStorage.clear();
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) startBtn.disabled = true;
    }
    if (typeof NewGameHandler !== 'undefined') {
        NewGameHandler.init('<?php echo $targetPage; ?>');
    }
    BotTrainingProgress.render();
});
</script>
