<?php
// newGame.php
function isMobile() {
    return preg_match('/(android|iphone|ipad|ipod|blackberry|opera mini|windows phone|mobile)/i', $_SERVER['HTTP_USER_AGENT']);
}

$isMobile = isMobile();
$targetPage = 'app.php';

require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();
$currentLang = $config['current_lang'] ?? 'fr';
$translations = $config['lang'][$currentLang] ?? [];
$assetVersion = $version ?? getVersion();
$operaGameAlt = $translations['opera_game_alt'] ?? "Partie de l'Opera de Paul Morphy, 1858";
$langFlags = ['fr' => '🇫🇷', 'en' => '🇬🇧', 'es' => '🇪🇸', 'de' => '🇩🇪'];
$langNames = ['fr' => 'Français', 'en' => 'English', 'es' => 'Español', 'de' => 'Deutsch'];
?>

<link rel="stylesheet" href="css/kchess/newGame.css?v=<?php echo htmlspecialchars((string)$assetVersion); ?>">
<link rel="stylesheet" href="css/kchess/variables.css?v=<?php echo htmlspecialchars((string)$assetVersion); ?>">
<style>
    :root { <?php echo getThemeCssVariables($config); ?> }
</style>

<!-- ★ NAVBAR : brand + profil + sélecteur langue -->
<nav class="home-navbar" aria-label="Navigation principale">
    <a href="index.php" class="home-navbar-brand">
        <i class="bi bi-chess-queen" aria-hidden="true"></i>
        <span>CharlyChess</span>
        <small class="home-navbar-version" title="Version"><?php echo htmlspecialchars('v' . ($config['version'] ?? '')); ?></small>
    </a>

    <div class="home-navbar-right">
        <a href="profile.php"
           class="home-navbar-profile"
           id="profileTrigger"
           aria-label="<?php echo htmlspecialchars($translations['profile'] ?? 'Profil'); ?>"
           title="<?php echo htmlspecialchars($translations['profile'] ?? 'Profil'); ?>">
            <i class="bi bi-person-circle" aria-hidden="true"></i>
        </a>

        <div class="home-navbar-lang" id="homeLangPicker">
            <button type="button"
                    class="home-navbar-lang-btn"
                    id="langTrigger"
                    aria-haspopup="listbox"
                    aria-expanded="false"
                    aria-controls="langDropdown"
                    title="<?php echo htmlspecialchars($langNames[$currentLang] ?? 'Langue'); ?>">
                <span class="lang-flag"><?php echo $langFlags[$currentLang] ?? '🌐'; ?></span>
                <i class="bi bi-chevron-down" aria-hidden="true"></i>
            </button>

            <ul class="home-navbar-lang-dropdown"
                id="langDropdown"
                role="listbox"
                aria-label="<?php echo htmlspecialchars($translations['language'] ?? 'Langue'); ?>"
                hidden>
                <?php foreach ($config['lang'] as $langCode => $langData): ?>
                    <li role="option" aria-selected="<?php echo $currentLang === $langCode ? 'true' : 'false'; ?>">
                        <a href="?<?php
                            $q = $_GET;
                            $q['lang'] = $langCode;
                            if (isset($q['new'])) unset($q['new']);
                            echo htmlspecialchars(http_build_query($q));
                        ?>"
                           class="home-navbar-lang-item <?php echo $currentLang === $langCode ? 'is-active' : ''; ?>"
                           data-lang="<?php echo htmlspecialchars($langCode); ?>"
                           title="<?php echo htmlspecialchars($langNames[$langCode] ?? strtoupper($langCode)); ?>"
                           aria-label="<?php echo htmlspecialchars($langNames[$langCode] ?? strtoupper($langCode)); ?>">
                            <span class="lang-flag"><?php echo $langFlags[$langCode] ?? ''; ?></span>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </div>
</nav>

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
                <p class="board-preview-caption">
                    <span class="game-players"><?php echo htmlspecialchars($translations['opera_game_players'] ?? 'Paul Morphy – Duc de Brunswick & comte Isouard'); ?></span>
                    <span class="game-year"><?php echo htmlspecialchars($translations['opera_game_year'] ?? '1858'); ?></span>
                </p>
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

        <section class="new-game-content">
            <header class="setup-header" aria-hidden="true"></header>

            <div class="new-game-buttons" role="group">
                <?php
                $botDir = __DIR__ . '/js/kchess/bots/';
                $botFiles = glob($botDir . 'Level_*.js');
                sort($botFiles, SORT_NATURAL);
                $readBotDepth = function ($file) {
                    $src = @file_get_contents($file);
                    if ($src === false) return null;
                    if (preg_match('/static\s+SEARCH_DEPTH\s*=\s*(\d+)\s*;/', $src, $m)) return (int)$m[1];
                    if (preg_match('/\bdepth\s*:\s*(\d+)/', $src, $m)) return (int)$m[1];
                    return null;
                };

                $levelList = [];
                foreach ($botFiles as $file) {
                    $levelList[] = (int)str_replace(['Level_', '.js'], '', basename($file));
                }

                foreach ($botFiles as $file):
                    $levelNum = str_replace(['Level_', '.js'], '', basename($file));
                    $searchDepth = $readBotDepth($file);
                    $botKey = "bot_" . $levelNum;
                    $botData = $translations['bots'][$botKey] ?? null;
                    if (is_array($botData)) {
                        $botTitle = $botData['title'] ?? "Level $levelNum";
                    } else {
                        $botTitle = $botData ?? "Level $levelNum";
                    }

                    $btnClass = "btn-level-" . $levelNum;
                    $levelNumInt = (int)$levelNum;

                    $prevLevel = 0;
                    $idx = array_search($levelNumInt, $levelList);
                    if ($idx !== false && $idx > 0) {
                        $prevLevel = $levelList[$idx - 1];
                    }
                    ?>
                    <div class="level-accordion"
                         data-level="<?php echo htmlspecialchars($levelNum); ?>"
                         data-prev-level="<?php echo htmlspecialchars((string)$prevLevel); ?>">
                        <button type="button" class="game-mode-btn <?php echo htmlspecialchars($btnClass); ?>"
                                data-mode="bot"
                                data-level="<?php echo htmlspecialchars($levelNum); ?>"
                                data-prev-level="<?php echo htmlspecialchars((string)$prevLevel); ?>"
                                <?php if ($searchDepth !== null): ?>
                                data-profondeur="<?php echo htmlspecialchars((string)$searchDepth); ?>"
                                <?php endif; ?>
                                aria-pressed="false"
                                aria-expanded="false">
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
                            <div class="level-lock" aria-hidden="true" hidden>
                                <i class="bi bi-lock-fill"></i>
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
                            <div class="level-status">
                                <span role="button" tabindex="0"
                                        class="level-reset-btn"
                                        data-level="<?php echo htmlspecialchars($levelNum); ?>"
                                        aria-label="<?php echo htmlspecialchars(($translations['reset_level'] ?? 'Réinitialiser le niveau') . ' ' . $levelNum); ?>"
                                        title="<?php echo htmlspecialchars($translations['reset_level'] ?? 'Réinitialiser le niveau'); ?>"
                                        data-confirm="<?php echo htmlspecialchars($translations['reset_confirm'] ?? "Réinitialiser le Level {level} ?\n\nLes victoires (Blancs, Noirs, Aléatoire) sont remises à 0.\nLe Level {next} sera à nouveau verrouillé."); ?>"
                                        data-done="<?php echo htmlspecialchars($translations['reset_done'] ?? 'Level {level} réinitialisé : victoires remises à 0.'); ?>"
                                        hidden>
                                    R
                                </span>
                            </div>
                        </button>
                        <div class="level-start-container">
                            <button type="button"
                                    class="start-level-btn"
                                    data-mode="bot"
                                    data-level="<?php echo htmlspecialchars($levelNum); ?>"
                                    <?php if ($searchDepth !== null): ?>
                                    data-profondeur="<?php echo htmlspecialchars((string)$searchDepth); ?>"
                                    <?php endif; ?>>
                                <i class="bi bi-play-circle me-2" aria-hidden="true"></i>
                                <?php echo htmlspecialchars($translations['start_game'] ?? 'Démarrer la partie'); ?>
                            </button>
                            <div class="inline-color-picker" role="group" aria-label="<?php echo htmlspecialchars($translations['choose_color'] ?? 'Choisissez votre camp'); ?>">
                                <button type="button" class="inline-color-option selected" data-color="white" aria-pressed="true" title="<?php echo htmlspecialchars($translations['white'] ?? 'Blanc'); ?>">
                                    <img src="img/chesspieces/wikipedia/wK.png" alt="">
                                </button>
                                <button type="button" class="inline-color-option" data-color="black" aria-pressed="false" title="<?php echo htmlspecialchars($translations['black'] ?? 'Noir'); ?>">
                                    <img src="img/chesspieces/wikipedia/bK.png" alt="">
                                </button>
                                <button type="button" class="inline-color-option random" data-color="random" aria-pressed="false" title="<?php echo htmlspecialchars($translations['random'] ?? 'Aléatoire'); ?>">
                                    <i class="bi bi-shuffle" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>

                <div class="level-accordion" data-level="0" data-prev-level="0">
                    <button type="button" class="game-mode-btn btn-human" data-mode="human" data-level="0" data-profondeur="false" aria-pressed="false" aria-expanded="false">
                        <div class="mode-description">
                            <div><i class="bi bi-people-fill mode-icon" aria-hidden="true"></i>
                                <?php echo htmlspecialchars($translations['human_vs_human'] ?? 'Humain vs Humain'); ?>
                            </div>
                        </div>
                        <i class="bi bi-check-lg check-icon" aria-hidden="true"></i>
                    </button>
                    <div class="level-start-container">
                        <button type="button" class="start-level-btn" data-mode="human" data-level="0" data-profondeur="false">
                            <i class="bi bi-play-circle me-2" aria-hidden="true"></i>
                            <?php echo htmlspecialchars($translations['start_game'] ?? 'Démarrer la partie'); ?>
                        </button>
                        <div class="inline-color-picker" role="group" aria-label="<?php echo htmlspecialchars($translations['choose_color'] ?? 'Choisissez votre camp'); ?>">
                            <button type="button" class="inline-color-option selected" data-color="white" aria-pressed="true" title="<?php echo htmlspecialchars($translations['white'] ?? 'Blanc'); ?>">
                                <img src="img/chesspieces/wikipedia/wK.png" alt="">
                            </button>
                            <button type="button" class="inline-color-option" data-color="black" aria-pressed="false" title="<?php echo htmlspecialchars($translations['black'] ?? 'Noir'); ?>">
                                <img src="img/chesspieces/wikipedia/bK.png" alt="">
                            </button>
                        </div>
                    </div>
                </div>

                <div class="level-accordion" data-level="0" data-prev-level="0" data-variant="chess960">
                    <button type="button" class="game-mode-btn btn-human-960" data-mode="human" data-level="0" data-profondeur="false" data-variant="chess960" aria-pressed="false" aria-expanded="false">
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
                    <div class="level-start-container">
                        <button type="button" class="start-level-btn" data-mode="human" data-level="0" data-profondeur="false" data-variant="chess960">
                            <i class="bi bi-play-circle me-2" aria-hidden="true"></i>
                            <?php echo htmlspecialchars($translations['start_game'] ?? 'Démarrer la partie'); ?>
                        </button>
                        <div class="inline-color-picker" role="group" aria-label="<?php echo htmlspecialchars($translations['choose_color'] ?? 'Choisissez votre camp'); ?>">
                            <button type="button" class="inline-color-option selected" data-color="white" aria-pressed="true" title="<?php echo htmlspecialchars($translations['white'] ?? 'Blanc'); ?>">
                                <img src="img/chesspieces/wikipedia/wK.png" alt="">
                            </button>
                            <button type="button" class="inline-color-option" data-color="black" aria-pressed="false" title="<?php echo htmlspecialchars($translations['black'] ?? 'Noir'); ?>">
                                <img src="img/chesspieces/wikipedia/bK.png" alt="">
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
</div>

<script src="js/kchess/ui/new-game-handler.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
<script src="js/kchess/ui/bot-training-progress.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);

    // ★ CORRECTION : ?new ne doit JAMAIS effacer la progression des levels
    if (params.has('new')) {
        try {
            const PROGRESS_FALLBACK_KEY = 'kchess_training_progress';
            const progressKey = (typeof BotTrainingProgress !== 'undefined' && BotTrainingProgress.storageKey)
                ? BotTrainingProgress.storageKey
                : PROGRESS_FALLBACK_KEY;

            const savedBotLevel = localStorage.getItem('kchess.selectedBotLevel');
            const savedTrainingProgress = localStorage.getItem(progressKey);

            const keptLabEntries = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('kchess_process_lab') || key.startsWith('kchess_arena'))) {
                    keptLabEntries.push([key, localStorage.getItem(key)]);
                }
            }

            localStorage.clear();

            keptLabEntries.forEach(([key, value]) => localStorage.setItem(key, value));
            if (savedBotLevel) localStorage.setItem('kchess.selectedBotLevel', savedBotLevel);
            // ★ On restaure la progression sous la clé réellement utilisée
            if (savedTrainingProgress) localStorage.setItem(progressKey, savedTrainingProgress);
        } catch (error) {
            console.warn('Impossible de réinitialiser les préférences locales.', error);
        }
        sessionStorage.clear();
    }

    if (typeof NewGameHandler !== 'undefined') {
        NewGameHandler.init('<?php echo $targetPage; ?>');
    }
    if (typeof BotTrainingProgress !== 'undefined' && typeof BotTrainingProgress.render === 'function') {
        BotTrainingProgress.render();
    }
});

// ★ Lang selector
document.addEventListener('DOMContentLoaded', function() {
    const picker = document.getElementById('homeLangPicker');
    const trigger = document.getElementById('langTrigger');
    const dropdown = document.getElementById('langDropdown');
    if (!picker || !trigger || !dropdown) return;

    const close = () => {
        dropdown.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
    };
    const open = () => {
        dropdown.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
    };

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown.hidden) open(); else close();
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.hidden && !picker.contains(e.target)) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !dropdown.hidden) {
            close();
            trigger.focus();
        }
    });

    dropdown.querySelectorAll('.home-navbar-lang-item').forEach(item => {
        item.addEventListener('click', () => close());
    });
});
</script>