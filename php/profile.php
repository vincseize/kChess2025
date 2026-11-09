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

// Vue active : me (défaut) | players | clubs
$rawView = isset($_GET['view']) ? (string)$_GET['view'] : 'me';
$view = in_array($rawView, ['me', 'players', 'clubs'], true) ? $rawView : 'me';

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
<link rel="stylesheet" href="css/kchess/profile-views.css?v=<?php echo htmlspecialchars((string)$assetVersion); ?>">
<style>
    :root { <?php echo getThemeCssVariables($config); ?> }
</style>

<!-- ★ NAVBAR : brand + [onglets + profil + langue] collés à droite -->
<nav class="home-navbar" aria-label="Navigation principale">
    <a href="index.php" class="home-navbar-brand">
        <i class="bi bi-chess-queen" aria-hidden="true"></i>
        <span>CharlyChess</span>
        <small class="home-navbar-version" title="Version"><?php echo htmlspecialchars('v' . ($config['version'] ?? '')); ?></small>
    </a>

    <div class="home-navbar-right">
        <!-- ★ Onglets collés à gauche de l'icône profil -->
        <div class="home-navbar-tabs" role="tablist" aria-label="Sections du profil">
            <a href="profile.php?view=me"
               class="home-navbar-tab <?php echo $view === 'me' ? 'is-active' : ''; ?>"
               role="tab"
               aria-selected="<?php echo $view === 'me' ? 'true' : 'false'; ?>"
               data-tab="me">
                <i class="bi bi-person-circle" aria-hidden="true"></i>
                <span>Mon profil</span>
            </a>
            <a href="profile.php?view=players"
               class="home-navbar-tab <?php echo $view === 'players' ? 'is-active' : ''; ?>"
               role="tab"
               aria-selected="<?php echo $view === 'players' ? 'true' : 'false'; ?>"
               data-tab="players">
                <i class="bi bi-search" aria-hidden="true"></i>
                <span>Joueurs</span>
            </a>
            <a href="profile.php?view=clubs"
               class="home-navbar-tab <?php echo $view === 'clubs' ? 'is-active' : ''; ?>"
               role="tab"
               aria-selected="<?php echo $view === 'clubs' ? 'true' : 'false'; ?>"
               data-tab="clubs">
                <i class="bi bi-people" aria-hidden="true"></i>
                <span>Clubs</span>
            </a>
        </div>

        <a href="profile.php?view=me"
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
    <main class="new-game-layout profile-layout" id="profileMain" data-view="<?php echo htmlspecialchars($view); ?>">

        <!-- ═══════════════════════════════════════════════════════
             ★ VUE MON PROFIL (par défaut)
             ═══════════════════════════════════════════════════════ -->
        <div class="profile-view" id="profileViewMe" data-view="me" <?php echo $view !== 'me' ? 'hidden' : ''; ?>>
            <section class="new-game-intro profile-intro" aria-labelledby="profile-title-me">
                <div class="hero-copy">
                    <p class="hero-kicker">La Dame de Bellefontaine<br>App Chess Club training</p>
                    <h1 id="profile-title-me">
                        Mon profil,<br>
                        <span>ma progression.</span>
                    </h1>
                    <p class="hero-description">
                        Recherchez votre nom ou votre code FIDE pour associer votre profil. Vous serez automatiquement ajouté au club La Dame de Bellefontaine.
                    </p>
                    <div class="profile-hero-badges" aria-label="Levels effectués"></div>
                </div>

                <div class="profile-me-search" role="search">
                    <label for="profileMeSearchInput" class="section-title profile-search-label">
                        Rechercher mon profil par nom ou code FIDE
                    </label>
                    <div class="profile-search-field">
                        <i class="bi bi-search" aria-hidden="true"></i>
                        <input type="search"
                               id="profileMeSearchInput"
                               class="profile-search-input"
                               placeholder="Ex. : Pottier, Charles ou 36009172"
                               autocomplete="off"
                               spellcheck="false">
                        <button type="button"
                                class="profile-search-clear"
                                id="profileMeSearchClear"
                                aria-label="Effacer"
                                hidden>
                            <i class="bi bi-x-lg" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="profile-search-btn" id="profileMeSearchBtn">
                            Rechercher
                        </button>
                    </div>
                    <p class="profile-search-hint">
                        <i class="bi bi-info-circle" aria-hidden="true"></i>
                        Le joueur trouvé sera associé à votre profil et ajouté au club La Dame de Bellefontaine.
                    </p>
                </div>
            </section>

            <section class="profile-me-col" aria-label="Ma fiche joueur">
                <div class="profile-me-results" id="profileMeResults" aria-live="polite" hidden></div>

                <div class="profile-me-card" id="profileMeCard">
                    <div class="profile-me-loading" id="profileMeLoading">
                        <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                        <span>Chargement de votre fiche…</span>
                    </div>
                    <div class="profile-me-empty" id="profileMeEmpty" hidden>
                        <i class="bi bi-person-plus" aria-hidden="true"></i>
                        <p>Aucune fiche joueur enregistrée sur cet appareil.</p>
                        <p class="profile-me-empty-hint">Recherchez votre nom ou votre code FIDE ci-dessus pour associer votre profil.</p>
                    </div>
                    <div class="profile-me-content" id="profileMeContent" hidden></div>
                </div>
            </section>

            <section class="new-game-content profile-content" aria-label="Mon profil">
                <div class="profile-history" hidden></div>

                <div class="profile-levels" aria-labelledby="profile-levels-title-me">
                    <div class="profile-levels-head">
                        <h2 id="profile-levels-title-me">Mes levels obtenus</h2>
                        <span class="profile-levels-count" id="profileLevelsCount">0 / 0</span>
                    </div>
                    <ul class="profile-levels-list" id="profileLevelsList" role="list"></ul>
                    <p class="profile-levels-empty" id="profileLevelsEmpty" hidden>
                        <i class="bi bi-emoji-neutral" aria-hidden="true"></i>
                        Aucun level complété pour le moment.
                    </p>
                </div>

                <div class="profile-me-clubs" aria-labelledby="profile-me-clubs-title">
                    <h2 id="profile-me-clubs-title" class="profile-levels-head" style="margin:0 0 12px;">
                        <span>Mes clubs</span>
                    </h2>
                    <div id="profileMeClubs"></div>
                </div>

                <div class="profile-actions">
                    <button type="button" class="profile-reset-all-btn" id="profileResetAllBtn">
                        <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                        <span>Réinitialiser mes levels</span>
                    </button>
                    <p class="profile-reset-all-note">
                        Cette action efface toute votre progression (levels, victoires, préférences).
                    </p>
                </div>
            </section>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             ★ VUE JOUEURS
             ═══════════════════════════════════════════════════════ -->
        <div class="profile-view" id="profileViewPlayers" data-view="players" <?php echo $view !== 'players' ? 'hidden' : ''; ?>>
            <section class="new-game-intro profile-intro" aria-labelledby="profile-title-players">
                <div class="hero-copy">
                    <p class="hero-kicker">La Dame de Bellefontaine<br>App Chess Club training</p>
                    <h1 id="profile-title-players">
                        Rechercher,<br>
                        <span>un joueur.</span>
                    </h1>
                    <p class="hero-description">
                        Entrez un nom ou un code FIDE. La fiche du joueur s’ouvre avec ses classements et son historique.
                    </p>
                    <div class="profile-hero-badges" aria-label="Levels effectués"></div>
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

            <section class="new-game-content profile-content" aria-label="Joueur">
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

                <div class="profile-known" id="profileKnown" hidden></div>

                <p class="profile-search-adv">
                    <a href="https://ratings.fide.com/advanced_search.phtml" target="_blank" rel="noopener noreferrer">
                        <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                        <?php echo htmlspecialchars($translations['fide_advanced'] ?? 'Recherche avancée sur ratings.fide.com'); ?>
                    </a>
                </p>

                <div class="profile-fide" id="profileFide" aria-live="polite" hidden></div>
            </section>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             ★ VUE CLUBS
             ═══════════════════════════════════════════════════════ -->
        <div class="profile-view" id="profileViewClubs" data-view="clubs" <?php echo $view !== 'clubs' ? 'hidden' : ''; ?>>
            <section class="new-game-intro profile-intro" aria-labelledby="profile-title-clubs">
                <div class="hero-copy">
                    <p class="hero-kicker">La Dame de Bellefontaine<br>App Chess Club training</p>
                    <h1 id="profile-title-clubs">
                        Les clubs,<br>
                        <span>leurs joueurs.</span>
                    </h1>
                    <p class="hero-description">
                        Recherchez un club par nom, ville, région ou pays. Cliquez sur un club pour voir ses joueurs.
                    </p>
                    <div class="profile-hero-badges" aria-label="Levels effectués"></div>
                </div>

                <div class="profile-club-stats" id="profileClubStats">
                    <span class="profile-club-stat">
                        <i class="bi bi-people" aria-hidden="true"></i>
                        <strong id="profileClubStatsCount">0</strong>
                        club(s)
                    </span>
                    <span class="profile-club-stat">
                        <i class="bi bi-person-badge" aria-hidden="true"></i>
                        <strong id="profileClubStatsPlayers">0</strong>
                        joueur(s)
                    </span>
                </div>
            </section>

            <section class="new-game-content profile-content" aria-label="Club">
                <div class="profile-search" role="search">
                    <label for="profileClubSearchInput" class="section-title profile-search-label">
                        Nom du club, ville, région ou pays
                    </label>
                    <div class="profile-search-field">
                        <i class="bi bi-search" aria-hidden="true"></i>
                        <input type="search"
                               id="profileClubSearchInput"
                               class="profile-search-input"
                               placeholder="Ex. : Bellefontaine, Martinique, France"
                               autocomplete="off"
                               spellcheck="false">
                        <button type="button"
                                class="profile-search-clear"
                                id="profileClubSearchClear"
                                aria-label="Effacer"
                                hidden>
                            <i class="bi bi-x-lg" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="profile-search-btn" id="profileClubSearchBtn">
                            Rechercher
                        </button>
                    </div>
                    <div class="profile-club-filters">
                        <label class="profile-club-filter">
                            <span>Région / Département</span>
                            <input type="text"
                                   id="profileClubRegion"
                                   class="profile-club-filter-input"
                                   placeholder="Ex. : Martinique, 972"
                                   autocomplete="off"
                                   spellcheck="false">
                        </label>
                        <label class="profile-club-filter">
                            <span>Pays</span>
                            <input type="text"
                                   id="profileClubCountry"
                                   class="profile-club-filter-input"
                                   placeholder="Ex. : France"
                                   autocomplete="off"
                                   spellcheck="false">
                        </label>
                    </div>
                </div>

                <div class="profile-history" hidden></div>

            </section>

            <section class="new-game-content profile-content" aria-label="Résultats clubs">
                <div class="profile-fide" id="profileClubResults" aria-live="polite" hidden></div>

                <?php if ($isLocal): ?>
                <div class="profile-actions">
                    <button type="button" class="home-feature-btn profile-club-edit-btn" id="profileClubEditPlayers">
                        <i class="bi bi-pencil-square" aria-hidden="true"></i>
                        <span>Gérer les clubs &amp; joueurs</span>
                    </button>
                </div>

                <div class="profile-club-import" id="profileClubImport" hidden>
                    <h3 class="profile-club-import-title">Clubs &amp; joueurs (config/clubs.json &amp; players.json)</h3>

                    <div class="profile-club-tabs" role="tablist" aria-label="Gestion clubs et joueurs">
                        <button type="button"
                                class="profile-club-tab is-active"
                                id="profileClubTabClubs"
                                role="tab"
                                aria-selected="true"
                                aria-controls="profileClubTabPanelClubs"
                                data-tab="clubs">
                            <i class="bi bi-people" aria-hidden="true"></i>
                            <span>Clubs</span>
                        </button>
                        <button type="button"
                                class="profile-club-tab"
                                id="profileClubTabPlayers"
                                role="tab"
                                aria-selected="false"
                                aria-controls="profileClubTabPanelPlayers"
                                data-tab="players">
                            <i class="bi bi-person-badge" aria-hidden="true"></i>
                            <span>Joueurs</span>
                        </button>
                    </div>

                    <div class="profile-club-tab-panel"
                         id="profileClubTabPanelClubs"
                         role="tabpanel"
                         aria-labelledby="profileClubTabClubs"
                         data-panel="clubs">
                        <div class="profile-club-tab-head">
                            <span>Clubs enregistrés (<strong id="profileClubCount">0</strong>)</span>
                            <button type="button" class="profile-club-import-link" id="profileClubImportNew">+ Nouveau club</button>
                        </div>
                        <ul class="profile-club-import-list" id="profileClubImportList" role="list"></ul>

                        <div class="profile-club-editor" id="profileClubEditor" hidden>
                            <h4 class="profile-club-editor-title" id="profileClubEditorTitle">Nouveau club</h4>
                            <div class="profile-club-import-grid">
                                <label class="profile-club-import-field">
                                    <span>Nom du club</span>
                                    <input type="text" id="profileClubName" placeholder="Ex. : La Dame de Bellefontaine">
                                </label>
                                <label class="profile-club-import-field">
                                    <span>Ville</span>
                                    <input type="text" id="profileClubCity" placeholder="Ex. : Bellefontaine">
                                </label>
                                <label class="profile-club-import-field">
                                    <span>Région / Département</span>
                                    <input type="text" id="profileClubRegionField" placeholder="Ex. : Martinique, 972">
                                </label>
                                <label class="profile-club-import-field">
                                    <span>Pays</span>
                                    <input type="text" id="profileClubCountryField" placeholder="Ex. : France">
                                </label>
                            </div>
                            <p class="profile-club-import-msg" id="profileClubMsg" role="status"></p>
                            <div class="profile-club-import-actions">
                                <button type="button" class="profile-add-cancel" id="profileClubCancel">Annuler</button>
                                <button type="button" class="profile-search-btn" id="profileClubSave">Enregistrer</button>
                            </div>
                        </div>
                    </div>

                    <div class="profile-club-tab-panel"
                         id="profileClubTabPanelPlayers"
                         role="tabpanel"
                         aria-labelledby="profileClubTabPlayers"
                         data-panel="players"
                         hidden>
                        <div class="profile-club-tab-head">
                            <span>Joueurs du club : <strong id="profileClubPlayersLabel">—</strong></span>
                            <select id="profileClubPlayersSelect" class="profile-club-import-select"></select>
                        </div>
                        <label class="profile-club-import-field profile-club-import-field--wide">
                            <span>Un joueur par ligne : <code>Nom, Prénom</code> ou <code>Nom, Prénom, FIDE_ID</code></span>
                            <textarea id="profileClubImportInput" rows="10" spellcheck="false"
                                      placeholder="Ney-Alexandre, Ylan, 551009013&#10;Nardol, Fred, 26043165&#10;..."></textarea>
                        </label>
                        <p class="profile-club-import-msg" id="profileClubPlayersMsg" role="status"></p>
                        <div class="profile-club-import-actions">
                            <button type="button" class="profile-search-btn" id="profileClubPlayersSave">Enregistrer les joueurs</button>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </section>
        </div>
    </main>
</div>

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
$profileI18n = [];
foreach ($translations as $k => $v) {
    if (!is_string($v)) continue;
    if (strpos($k, 'fide_') === 0) $profileI18n[substr($k, 5)] = $v;
    elseif (strpos($k, 'pf_') === 0) $profileI18n[$k] = $v;
}
$profileParties = [];
$partiesFile = __DIR__ . '/config/parties.json';
if (is_file($partiesFile)) {
    $decoded = json_decode((string)file_get_contents($partiesFile), true);
    if (isset($decoded['games']) && is_array($decoded['games'])) $profileParties = $decoded['games'];
}
$profileClubs = [];
$clubsFile = __DIR__ . '/config/clubs.json';
if (is_file($clubsFile)) {
    $decodedClubs = json_decode((string)file_get_contents($clubsFile), true);
    if (isset($decodedClubs['clubs']) && is_array($decodedClubs['clubs'])) $profileClubs = $decodedClubs['clubs'];
}
// Joueurs connus (config/players.json) : lisibles par tout le monde
$profilePlayers = [];
$playersFile = __DIR__ . '/config/players.json';
if (is_file($playersFile)) {
    $decodedPlayers = json_decode((string)file_get_contents($playersFile), true);
    if (isset($decodedPlayers['players']) && is_array($decodedPlayers['players'])) $profilePlayers = $decodedPlayers['players'];
}
$jsonFlags = JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP;
?>
<script>
window.PROFILE_I18N = <?php echo json_encode($profileI18n, $jsonFlags); ?>;
window.PROFILE_PARTIES = <?php echo json_encode($profileParties, $jsonFlags); ?>;
window.PROFILE_LANG = <?php echo json_encode($currentLang); ?>;
window.PROFILE_CLUBS = <?php echo json_encode($profileClubs, $jsonFlags); ?>;
window.PROFILE_PLAYERS = <?php echo json_encode($profilePlayers, $jsonFlags); ?>;
window.PROFILE_LOCAL = <?php echo $isLocal ? 'true' : 'false'; ?>;
window.PROFILE_VIEW = <?php echo json_encode($view); ?>;
</script>
<script src="js/kchess/ui/bot-training-progress.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
<script src="js/kchess/ui/pgn-parser.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
<script src="js/kchess/ui/profile-core.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
<script src="js/kchess/ui/profile-me.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
<script src="js/kchess/ui/profile-players.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
<script src="js/kchess/ui/profile-clubs.js?v=<?php echo htmlspecialchars((string)$assetVersion); ?>"></script>
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