<?php
// profile.php
require_once __DIR__ . '/config-loader.php';
$config = loadGameConfig();
$currentLang = $config['current_lang'] ?? 'fr';
$translations = $config['lang'][$currentLang] ?? [];
$assetVersion = $version ?? getVersion();
$langFlags = ['fr' => '🇫🇷', 'en' => '🇬🇧', 'es' => '🇪🇸', 'de' => '🇩🇪'];
$langNames = ['fr' => 'Français', 'en' => 'English', 'es' => 'Español', 'de' => 'Deutsch'];
?>
<?php
// Accès direct à profile.php : on ajoute la page HTML autour (comme le fait index.php pour newGame.php)
$profileStandalone = (basename($_SERVER['SCRIPT_NAME'] ?? '') === 'profile.php');
if ($profileStandalone):
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($config['current_lang'] ?? 'fr'); ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title><?php echo htmlspecialchars(($translations['profile'] ?? 'Profil') . ' - ' . ($config['app_name'] ?? 'CharlyChess')); ?></title>
    <link rel="icon" type="image/svg+xml" href="img/icon.svg">
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/bootstrap-icons.css">
    <style>
        html, body { min-height: 100%; margin: 0; padding: 0; background: var(--site-background, #0B2024); }
    </style>
</head>
<body>
<?php endif; ?>

<link rel="stylesheet" href="css/kchess/newGame.css?v=<?php echo htmlspecialchars((string)$assetVersion); ?>">
<link rel="stylesheet" href="css/kchess/variables.css?v=<?php echo htmlspecialchars((string)$assetVersion); ?>">
<link rel="stylesheet" href="css/kchess/profile.css?v=<?php echo htmlspecialchars((string)$assetVersion); ?>">
<style>
    :root { <?php echo getThemeCssVariables($config); ?> }
</style>

<nav class="home-navbar" aria-label="Navigation principale">
    <a href="index.php" class="home-navbar-brand">
        <i class="bi bi-chess-queen" aria-hidden="true"></i>
        <span>CharlyChess</span>
    </a>

    <div class="home-navbar-right">
        <a href="profile.php"
           class="home-navbar-profile is-active"
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
    <main class="new-game-layout profile-layout">

        <section class="new-game-intro profile-intro" aria-labelledby="profile-title">
            <div class="hero-copy">
                <p class="hero-kicker">La Dame de Bellefontaine<br>App Chess Club training</p>
                <h1 id="profile-title">
                    <?php echo htmlspecialchars($translations['profile_title_first'] ?? 'Votre profil,'); ?><br>
                    <span><?php echo htmlspecialchars($translations['profile_title_second'] ?? 'votre progression.'); ?></span>
                </h1>
                <p class="hero-description">
                    <?php echo htmlspecialchars($translations['profile_subtitle'] ?? 'Recherchez un joueur, consultez vos levels, réinitialisez votre progression.'); ?>
                </p>
            </div>

            <div class="board-preview-group profile-board-preview">
                <p class="board-preview-caption">
                    <span class="game-players"><?php echo htmlspecialchars($translations['profile_preview_players'] ?? 'Votre parcours'); ?></span>
                    <span class="game-year"><?php echo htmlspecialchars($translations['profile_preview_year'] ?? '2025'); ?></span>
                </p>
                <div class="board-preview">
                    <picture>
                        <source media="(prefers-reduced-motion: reduce)" srcset="img/opera-game-poster.png?v=<?php echo htmlspecialchars((string)$assetVersion); ?>">
                        <img src="img/opera-game.gif?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"
                             alt="<?php echo htmlspecialchars($translations['profile_preview_alt'] ?? 'Progression'); ?>"
                             width="280" height="280">
                    </picture>
                </div>

                <div class="home-feature-actions" aria-label="Raccourcis">
                    <a class="home-feature-btn" href="index.php">
                        <i class="bi bi-play-circle" aria-hidden="true"></i>
                        <span><?php echo htmlspecialchars($translations['start_game'] ?? 'Démarrer la partie'); ?></span>
                    </a>
                    <a class="home-feature-btn" href="index.php?new=1">
                        <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
                        <span><?php echo htmlspecialchars($translations['new_game'] ?? 'Nouvelle partie'); ?></span>
                    </a>
                </div>
            </div>

            <p class="local-game-note">
                <i class="bi bi-shield-check" aria-hidden="true"></i>
                <?php echo htmlspecialchars($translations['local_game_note'] ?? 'Une partie locale, sans inscription.'); ?>
            </p>
        </section>

        <section class="new-game-content profile-content" aria-label="<?php echo htmlspecialchars($translations['profile'] ?? 'Profil'); ?>">

            <div class="profile-search" role="search">
                <label for="profileSearchInput" class="section-title profile-search-label">
                    <?php echo htmlspecialchars($translations['profile_search_label'] ?? 'Nom, prénom ou code FIDE'); ?>
                </label>
                <div class="profile-search-field">
                    <i class="bi bi-search" aria-hidden="true"></i>
                    <input type="search"
                           id="profileSearchInput"
                           class="profile-search-input"
                           placeholder="<?php echo htmlspecialchars($translations['profile_search_placeholder'] ?? 'Ex. : Dupont, Marie, 1234567'); ?>"
                           autocomplete="off"
                           spellcheck="false">
                    <button type="button"
                            class="profile-search-clear"
                            id="profileSearchClear"
                            aria-label="<?php echo htmlspecialchars($translations['clear'] ?? 'Effacer'); ?>"
                            hidden>
                        <i class="bi bi-x-lg" aria-hidden="true"></i>
                    </button>
                </div>
                <p class="profile-search-hint">
                    <i class="bi bi-info-circle" aria-hidden="true"></i>
                    <?php echo htmlspecialchars($translations['profile_search_hint'] ?? 'La recherche de joueurs sera bientôt disponible.'); ?>
                </p>
            </div>

            <div class="profile-levels" aria-labelledby="profile-levels-title">
                <div class="profile-levels-head">
                    <h2 id="profile-levels-title">
                        <?php echo htmlspecialchars($translations['profile_levels_title'] ?? 'Levels obtenus'); ?>
                    </h2>
                    <span class="profile-levels-count" id="profileLevelsCount">0 / 0</span>
                </div>

                <ul class="profile-levels-list" id="profileLevelsList" role="list"></ul>

                <p class="profile-levels-empty" id="profileLevelsEmpty" hidden>
                    <i class="bi bi-emoji-neutral" aria-hidden="true"></i>
                    <?php echo htmlspecialchars($translations['profile_levels_empty'] ?? 'Aucun level complété pour le moment.'); ?>
                </p>
            </div>

            <div class="profile-actions">
                <button type="button" class="profile-reset-all-btn" id="profileResetAllBtn">
                    <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                    <span><?php echo htmlspecialchars($translations['profile_reset_all'] ?? 'Réinitialiser tous les levels'); ?></span>
                </button>
                <p class="profile-reset-all-note">
                    <?php echo htmlspecialchars($translations['profile_reset_all_note'] ?? 'Cette action efface toute votre progression (levels, victoires, préférences).'); ?>
                </p>
            </div>
        </section>
    </main>
</div>

<script src="js/kchess/ui/bot-training-progress.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
<script src="js/kchess/ui/profile.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const picker = document.getElementById('homeLangPicker');
    const trigger = document.getElementById('langTrigger');
    const dropdown = document.getElementById('langDropdown');
    if (!picker || !trigger || !dropdown) return;

    const close = () => { dropdown.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
    const open  = () => { dropdown.hidden = false; trigger.setAttribute('aria-expanded', 'true'); };

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown.hidden) open(); else close();
    });
    document.addEventListener('click', (e) => {
        if (!dropdown.hidden && !picker.contains(e.target)) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !dropdown.hidden) { close(); trigger.focus(); }
    });
    dropdown.querySelectorAll('.home-navbar-lang-item').forEach(item => {
        item.addEventListener('click', () => close());
    });
});
</script>

<?php if ($profileStandalone): ?>
</body>
</html>
<?php endif; ?>