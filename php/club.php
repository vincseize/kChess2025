<?php
require_once __DIR__ . '/config-loader.php';
require_once __DIR__ . '/local-only.php';
$config = loadGameConfig();
$currentLang = $config['current_lang'] ?? 'fr';
$translations = $config['lang'][$currentLang] ?? [];
$assetVersion = $version ?? getVersion();

// Récupération du nom du club depuis l'URL
$clubName = isset($_GET['nom']) ? trim((string)$_GET['nom']) : '';

$clubsFile = __DIR__ . '/config/clubs.json';
$clubs = [];
if (is_file($clubsFile)) {
    $decoded = json_decode((string)file_get_contents($clubsFile), true);
    if (isset($decoded['clubs']) && is_array($decoded['clubs'])) $clubs = $decoded['clubs'];
}

// On cherche le club
$currentClub = null;
foreach ($clubs as $c) {
    if ($c['name'] === $clubName) {
        $currentClub = $c;
        break;
    }
}

// Si le club n'existe pas dans clubs.json, on affiche une erreur
if (!$currentClub) {
    header('HTTP/1.1 404 Not Found');
    echo "<h1>Club introuvable</h1><p>Le club « " . htmlspecialchars($clubName) . " » n'existe pas dans la base.</p>";
    echo '<p><a href="profile.php?view=clubs">Retour aux clubs</a></p>';
    exit;
}

$profileStandalone = (basename($_SERVER['SCRIPT_NAME'] ?? '') === 'club.php');
if ($profileStandalone):
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($config['current_lang'] ?? 'fr'); ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title><?php echo htmlspecialchars($currentClub['name']); ?> | <?php echo htmlspecialchars($config['app_name']); ?></title>
    <link rel="icon" type="image/svg+xml" href="img/icon.svg">
    <link href="css/vendor/bootstrap/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/vendor/bootstrap/bootstrap-icons.css">
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

<nav class="home-navbar" aria-label="Navigation principale">
    <a href="index.php" class="home-navbar-brand">
        <i class="bi bi-chess-queen" aria-hidden="true"></i>
        <span>CharlyChess</span>
        <small class="home-navbar-version" title="Version"><?php echo htmlspecialchars('v' . ($config['version'] ?? '')); ?></small>
    </a>

    <div class="home-navbar-right">
        <div class="home-navbar-tabs" role="tablist" aria-label="Sections du profil">
            <a href="profile.php?view=me" class="home-navbar-tab"><i class="bi bi-person-circle"></i> <span>Mon profil</span></a>
            <a href="profile.php?view=players" class="home-navbar-tab"><i class="bi bi-search"></i> <span>Joueurs</span></a>
            <a href="profile.php?view=clubs" class="home-navbar-tab is-active"><i class="bi bi-people"></i> <span>Clubs</span></a>
        </div>

        <a href="profile.php?view=me" class="home-navbar-profile is-active" title="Profil">
            <i class="bi bi-person-circle" aria-hidden="true"></i>
        </a>
    </div>
</nav>

<div class="new-game-overlay">
    <main class="new-game-layout profile-layout" id="profileMain">
        
        <section class="new-game-intro profile-intro">
            <div class="hero-copy">
                <p class="hero-kicker">Détails du club</p>
                <h1><?php echo htmlspecialchars($currentClub['name']); ?></h1>
                <p class="hero-description">
                    <?php echo htmlspecialchars(implode(' · ', array_filter([$currentClub['city'] ?? '', $currentClub['region'] ?? '', $currentClub['country'] ?? '']))); ?>
                </p>
                <div class="profile-club-stats" style="margin-top: 20px;">
                    <span class="profile-club-stat">
                        <i class="bi bi-person-badge" aria-hidden="true"></i>
                        <strong><?php echo count($currentClub['players'] ?? []); ?></strong> joueur(s)
                    </span>
                </div>
                
                <?php if (!empty($currentClub['email']) || !empty($currentClub['phone'])): ?>
                <div class="profile-fide-card" style="margin-top: 20px; padding: 15px; font-size: 0.85rem;">
                    <h3 style="margin-top:0; font-size:1rem;">Contact</h3>
                    <?php if (!empty($currentClub['email'])): ?>
                        <p style="margin:0 0 5px 0;"><i class="bi bi-envelope"></i> <a href="mailto:<?php echo htmlspecialchars($currentClub['email']); ?>" style="color: var(--success-color);"><?php echo htmlspecialchars($currentClub['email']); ?></a></p>
                    <?php endif; ?>
                    <?php if (!empty($currentClub['phone'])): ?>
                        <p style="margin:0 0 5px 0;"><i class="bi bi-telephone"></i> <?php echo htmlspecialchars($currentClub['phone']); ?></p>
                    <?php endif; ?>
                    <?php if (!empty($currentClub['website'])): ?>
                        <p style="margin:0;"><i class="bi bi-globe"></i> <a href="https://<?php echo htmlspecialchars($currentClub['website']); ?>" target="_blank" style="color: var(--success-color);"><?php echo htmlspecialchars($currentClub['website']); ?></a></p>
                    <?php endif; ?>
                </div>
                <?php endif; ?>
            </div>
        </section>

        <section class="new-game-content profile-content">
            <div class="profile-levels" style="margin-bottom: 20px;">
                <div class="profile-levels-head">
                    <h2>Joueurs du club</h2>
                </div>
                <ul class="profile-club-list" id="clubPageList">
                    <!-- Rempli par JS pour gérer les surcharges localStorage -->
                    <li style="color: var(--site-text-muted); font-size: 0.85rem;">Chargement des joueurs…</li>
                </ul>
            </div>
        </section>
        
    </main>
</div>

<script>
window.CLUB_NAME = <?php echo json_encode($currentClub['name']); ?>;
window.CLUB_BASE_PLAYERS = <?php echo json_encode($currentClub['players'] ?? [], JSON_UNESCAPED_UNICODE); ?>;
</script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    // On lit les modifications dans le localStorage (si un joueur a été ajouté manuellement)
    const CLUBS_KEY = 'kchess.clubs.v1';
    let localClubs = { clubs: [], overrides: {} };
    try {
        const raw = localStorage.getItem(CLUBS_KEY);
        if (raw) localClubs = JSON.parse(raw);
    } catch (e) {}

    const clubName = window.CLUB_NAME;
    let players = window.CLUB_BASE_PLAYERS || [];

    // On applique les surcharges locales
    if (localClubs.overrides && localClubs.overrides[clubName]) {
        players = localClubs.overrides[clubName].players || players;
    } else {
        const localClub = (localClubs.clubs || []).find(c => c.name === clubName);
        if (localClub) players = localClub.players || players;
    }

    const list = document.getElementById('clubPageList');
    if (!list) return;
    list.innerHTML = '';

    if (!players.length) {
        list.innerHTML = '<li style="color:var(--site-text-muted);">Aucun joueur dans ce club.</li>';
        return;
    }

    // Tri alphabétique
    players.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));

    players.forEach(p => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'profile-club-player';
        
        // Si on a un code FIDE, on fait un lien vers la recherche Joueurs
        if (p.fide && /^\d+$/.test(p.fide)) {
            a.href = 'profile.php?view=players&fide=' + encodeURIComponent(p.fide);
        } else {
            a.href = 'profile.php?view=players'; 
        }

        const name = document.createElement('span');
        name.textContent = p.name;
        
        const meta = document.createElement('small');
        meta.textContent = p.fide ? String(p.fide) : '';
        
        a.append(name, meta);
        li.appendChild(a);
        list.appendChild(li);
    });
});
</script>
</body>
</html>