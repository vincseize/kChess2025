<?php
require_once __DIR__ . '/config-loader.php';

$config = loadGameConfig();
$lang = htmlspecialchars($config['current_lang'] ?? 'fr', ENT_QUOTES, 'UTF-8');
$version = htmlspecialchars((string) getVersion(), ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>Clock | <?php echo htmlspecialchars($config['app_name'], ENT_QUOTES, 'UTF-8'); ?></title>
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/bootstrap-icons.css">
    <link rel="stylesheet" href="css/kchess/clock.css?v=<?php echo $version; ?>">
    <style>:root { <?php echo getThemeCssVariables($config); ?> }</style>
</head>
<body>
    <main class="clock-page">
        <header class="clock-header">
            <a class="clock-back" href="index.php">
                <i class="bi bi-arrow-left" aria-hidden="true"></i>
                <span>Accueil</span>
            </a>
            <h1>Clock</h1>
            <span class="clock-header-spacer" aria-hidden="true"></span>
        </header>

        <section class="clock-panel" aria-label="Pendule d'échecs">
            <div class="clock-presets" role="group" aria-label="Cadence">
                <button type="button" class="clock-preset" data-minutes="3" data-increment="2" aria-pressed="false">3 + 2</button>
                <button type="button" class="clock-preset" data-minutes="5" data-increment="0" aria-pressed="false">5 + 0</button>
                <button type="button" class="clock-preset selected" data-minutes="10" data-increment="0" aria-pressed="true">10 + 0</button>
                <button type="button" class="clock-preset" data-minutes="15" data-increment="10" aria-pressed="false">15 + 10</button>
            </div>

            <div class="clock-players">
                <button type="button" class="clock-player" id="blackClock" data-player="black" disabled>
                    <span class="clock-player-name">Noirs</span>
                    <span class="clock-time" id="blackTime">10:00</span>
                </button>
                <button type="button" class="clock-player active" id="whiteClock" data-player="white" disabled>
                    <span class="clock-player-name">Blancs</span>
                    <span class="clock-time" id="whiteTime">10:00</span>
                </button>
            </div>

            <p class="clock-status" id="clockStatus" role="status" aria-live="polite">Choisissez une cadence puis démarrez.</p>

            <div class="clock-controls">
                <button type="button" class="clock-control primary" id="startPause">
                    <i class="bi bi-play-fill" aria-hidden="true"></i>
                    <span>Démarrer</span>
                </button>
                <button type="button" class="clock-control" id="resetClock">
                    <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                    <span>Réinitialiser</span>
                </button>
            </div>
            <p class="clock-help">Appuyez sur le bouton de votre camp après chaque coup. Espace : changer de tour, Échap : pause.</p>
        </section>
    </main>
    <script src="js/kchess/ui/chess-clock.js?v=<?php echo $version; ?>"></script>
</body>
</html>
