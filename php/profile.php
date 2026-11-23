<?php
// profile.php
require_once __DIR__ . '/config-loader.php';
require_once __DIR__ . '/local-only.php';
$isLocal = kchess_is_local();
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
        <small class="home-navbar-version" title="Version"><?php echo htmlspecialchars('v' . ($config['version'] ?? '')); ?></small>
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
                <p class="profile-game-caption">
                    <span class="profile-game-name" id="profileGameTitle"></span>
                    <span class="game-year" id="profileGameYear"></span>
                </p>
                <div class="profile-board" id="profileBoard" role="img"
                     aria-label="<?php echo htmlspecialchars($translations['profile_preview_alt'] ?? 'Partie d\'échecs'); ?>"></div>
                <p class="profile-game-players" id="profileGamePlayers"></p>

                <button type="button" class="home-feature-btn profile-zoom-btn" id="profileBoardZoom">
                    <i class="bi bi-arrows-fullscreen" aria-hidden="true"></i>
                    <span><?php echo htmlspecialchars($translations['pf_zoom'] ?? 'Voir en grand'); ?></span>
                </button>

                <h2 class="profile-games-title"><?php echo htmlspecialchars($translations['pf_other_games'] ?? 'Autres parties'); ?></h2>
                <ul class="profile-games-list" id="profileGamesList" role="list"></ul>
<?php if ($isLocal): ?>
                <button type="button" class="home-feature-btn profile-add-game-btn" id="profileAddGame">
                    <i class="bi bi-plus-circle" aria-hidden="true"></i>
                    <span><?php echo htmlspecialchars($translations['pf_add_game'] ?? 'Ajouter une partie'); ?></span>
                </button>
<?php endif; ?>
            </div>

        </section>

        <section class="new-game-content profile-content" aria-label="<?php echo htmlspecialchars($translations['profile'] ?? 'Profil'); ?>">

            <div class="profile-search" role="search">
                <div class="profile-mode" role="group" aria-label="<?php echo htmlspecialchars($translations['pf_search_by'] ?? 'Rechercher par'); ?>">
                    <button type="button" class="profile-mode-btn is-active" data-mode="player" aria-pressed="true">
                        <i class="bi bi-person" aria-hidden="true"></i>
                        <span><?php echo htmlspecialchars($translations['pf_mode_player'] ?? 'Joueur'); ?></span>
                    </button>
                    <button type="button" class="profile-mode-btn" data-mode="club" aria-pressed="false">
                        <i class="bi bi-people" aria-hidden="true"></i>
                        <span><?php echo htmlspecialchars($translations['pf_mode_club'] ?? 'Club'); ?></span>
                    </button>
                </div>
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
                    <button type="button" class="profile-search-btn" id="profileSearchBtn">
                        <?php echo htmlspecialchars($translations['profile_search_btn'] ?? 'Rechercher'); ?>
                    </button>
                </div>
                <p class="profile-search-hint">
                    <i class="bi bi-info-circle" aria-hidden="true"></i>
                    <?php echo htmlspecialchars($translations['profile_search_hint'] ?? 'Entrez un code FIDE (chiffres) ou un nom, puis Entrée.'); ?>
                </p>
            </div>

            <div class="profile-history" id="profileHistory" hidden></div>

            <p class="profile-search-adv">
                <a href="https://ratings.fide.com/advanced_search.phtml" target="_blank" rel="noopener noreferrer">
                    <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                    <?php echo htmlspecialchars($translations['fide_advanced'] ?? 'Recherche avancée sur ratings.fide.com'); ?>
                </a>
            </p>

            <div class="profile-fide" id="profileFide" aria-live="polite" hidden></div>
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
<?php if ($isLocal): ?>
<div class="profile-modal" id="profileAddModal" role="dialog" aria-modal="true" aria-labelledby="profileAddTitle" hidden>
    <form class="profile-modal-card profile-add-card" id="profileAddForm" novalidate>
        <header class="profile-modal-head">
            <h2 class="profile-modal-title" id="profileAddTitle"><?php echo htmlspecialchars($translations['pf_add_game'] ?? 'Ajouter une partie'); ?></h2>
            <button type="button" class="profile-modal-close" data-add="close" aria-label="<?php echo htmlspecialchars($translations['pf_close'] ?? 'Fermer'); ?>">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
        </header>
        <label class="profile-add-field">
            <span><?php echo htmlspecialchars($translations['pf_add_pgn'] ?? 'Coups (PGN)'); ?></span>
            <textarea name="pgn" rows="6" spellcheck="false" placeholder="1. e4 e5 2. Nf3 Nc6 ..."></textarea>
        </label>
        <label class="profile-add-field">
            <span><?php echo htmlspecialchars($translations['pf_add_name'] ?? 'Nom de la partie'); ?></span>
            <input type="text" name="title" maxlength="80" autocomplete="off">
        </label>
        <label class="profile-add-field">
            <span><?php echo htmlspecialchars($translations['pf_add_players'] ?? 'Joueurs'); ?></span>
            <input type="text" name="players" maxlength="120" placeholder="Blancs – Noirs" autocomplete="off">
        </label>
        <div class="profile-add-row">
            <label class="profile-add-field">
                <span><?php echo htmlspecialchars($translations['pf_add_place'] ?? 'Lieu'); ?></span>
                <input type="text" name="place" maxlength="80" autocomplete="off">
            </label>
            <label class="profile-add-field profile-add-year">
                <span><?php echo htmlspecialchars($translations['pf_add_year'] ?? 'Année'); ?></span>
                <input type="number" name="year" min="1400" max="2100">
            </label>
            <label class="profile-add-field profile-add-result">
                <span><?php echo htmlspecialchars($translations['pf_add_result'] ?? 'Résultat'); ?></span>
                <select name="result">
                    <option value="1-0">1-0</option>
                    <option value="0-1">0-1</option>
                    <option value="1/2-1/2">½-½</option>
                    <option value="*">*</option>
                </select>
            </label>
        </div>
        <p class="profile-add-msg" id="profileAddMsg" role="status" aria-live="polite"></p>
        <p class="profile-add-note"><i class="bi bi-hdd" aria-hidden="true"></i> <?php echo htmlspecialchars($translations['pf_add_local_note'] ?? 'Visible uniquement en localhost. La partie est enregistrée dans config/parties.json.'); ?></p>
        <div class="profile-add-actions">
            <button type="button" class="profile-add-cancel" data-add="close"><?php echo htmlspecialchars($translations['cancel'] ?? 'Annuler'); ?></button>
            <button type="submit" class="profile-search-btn"><?php echo htmlspecialchars($translations['pf_add_save'] ?? 'Enregistrer'); ?></button>
        </div>
    </form>
</div>
<?php endif; ?>

<div class="profile-modal" id="profileGameModal" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle" hidden>
    <div class="profile-modal-card">
        <header class="profile-modal-head">
            <div>
                <h2 class="profile-modal-title" id="profileModalTitle"></h2>
                <p class="profile-modal-players"></p>
            </div>
            <button type="button" class="profile-modal-close" data-act="close"
                    aria-label="<?php echo htmlspecialchars($translations['pf_close'] ?? 'Fermer'); ?>"
                    title="<?php echo htmlspecialchars($translations['pf_close'] ?? 'Fermer'); ?>">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
        </header>
        <div class="profile-board profile-modal-board"></div>
        <p class="profile-modal-move" aria-live="polite">&nbsp;</p>
        <div class="profile-modal-controls">
            <button type="button" data-act="start" title="<?php echo htmlspecialchars($translations['pf_start'] ?? 'Début'); ?>" aria-label="<?php echo htmlspecialchars($translations['pf_start'] ?? 'Début'); ?>"><i class="bi bi-skip-start-fill" aria-hidden="true"></i></button>
            <button type="button" data-act="prev" title="<?php echo htmlspecialchars($translations['pf_prev'] ?? 'Coup précédent'); ?>" aria-label="<?php echo htmlspecialchars($translations['pf_prev'] ?? 'Coup précédent'); ?>"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>
            <button type="button" data-act="play" class="is-primary"><i class="bi bi-pause-fill" aria-hidden="true"></i></button>
            <button type="button" data-act="next" title="<?php echo htmlspecialchars($translations['pf_next'] ?? 'Coup suivant'); ?>" aria-label="<?php echo htmlspecialchars($translations['pf_next'] ?? 'Coup suivant'); ?>"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>
            <button type="button" data-act="end" title="<?php echo htmlspecialchars($translations['pf_end'] ?? 'Fin'); ?>" aria-label="<?php echo htmlspecialchars($translations['pf_end'] ?? 'Fin'); ?>"><i class="bi bi-skip-end-fill" aria-hidden="true"></i></button>
            <span class="profile-modal-count">0 / 0</span>
        </div>
    </div>
</div>

<?php
// Textes exposés au JavaScript : clés fide_* (sans le préfixe) et pf_* (telles quelles)
$profileI18n = [];
foreach ($translations as $k => $v) {
    if (!is_string($v)) continue;
    if (strpos($k, 'fide_') === 0) $profileI18n[substr($k, 5)] = $v;
    elseif (strpos($k, 'pf_') === 0) $profileI18n[$k] = $v;
}
// Parties affichées à gauche (config/parties.json)
$profileParties = [];
$partiesFile = __DIR__ . '/config/parties.json';
if (is_file($partiesFile)) {
    $decoded = json_decode((string)file_get_contents($partiesFile), true);
    if (isset($decoded['games']) && is_array($decoded['games'])) $profileParties = $decoded['games'];
}
// Clubs et leurs joueurs (config/clubs.json)
$profileClubs = [];
$clubsFile = __DIR__ . '/config/clubs.json';
if (is_file($clubsFile)) {
    $decodedClubs = json_decode((string)file_get_contents($clubsFile), true);
    if (isset($decodedClubs['clubs']) && is_array($decodedClubs['clubs'])) $profileClubs = $decodedClubs['clubs'];
}
$jsonFlags = JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP;
?>
<script>
window.PROFILE_I18N = <?php echo json_encode($profileI18n, $jsonFlags); ?>;
window.PROFILE_PARTIES = <?php echo json_encode($profileParties, $jsonFlags); ?>;
window.PROFILE_LANG = <?php echo json_encode($currentLang); ?>;
window.PROFILE_CLUBS = <?php echo json_encode($profileClubs, $jsonFlags); ?>;
window.PROFILE_LOCAL = <?php echo $isLocal ? 'true' : 'false'; ?>;
</script>
<script src="js/kchess/ui/pgn-parser.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
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
