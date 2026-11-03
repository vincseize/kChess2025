<?php
require_once __DIR__ . '/config-loader.php';

$config = loadGameConfig();
$lang = htmlspecialchars($config['current_lang'] ?? 'fr', ENT_QUOTES, 'UTF-8');
$clockTitle = ($config['current_lang'] ?? 'fr') === 'fr' ? 'Pendule' : 'Clock';
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
            <button type="button" class="clock-back" id="openTempoSelection" aria-label="Retour au choix des cadences">
                <i class="bi bi-arrow-left" aria-hidden="true"></i>
            </button>
            <h1><?php echo htmlspecialchars($clockTitle, ENT_QUOTES, 'UTF-8'); ?></h1>
            <button type="button" class="clock-menu-button" id="openClockSettings" aria-label="Paramètres de la pendule">
                <i class="bi bi-gear-fill" aria-hidden="true"></i>
            </button>
        </header>

        <section class="clock-players" aria-label="Pendule d'échecs">
            <div class="clock-player black-player" data-player-panel="black">
                <button type="button" class="clock-face" id="blackClock" data-player="black" disabled aria-label="Pendule des Noirs">
                    <span class="clock-player-name">Noirs</span>
                    <span class="clock-time" id="blackTime">10:00</span>
                </button>
            </div>
            <div class="clock-player white-player" data-player-panel="white">
                <button type="button" class="clock-face" id="whiteClock" data-player="white" disabled aria-label="Pendule des Blancs">
                    <span class="clock-player-name">Blancs</span>
                    <span class="clock-time" id="whiteTime">10:00</span>
                </button>
            </div>
        </section>

        <p class="visually-hidden" id="clockStatus" role="status" aria-live="polite">Choisissez une cadence puis démarrez.</p>

        <section class="clock-settings-overlay" id="clockSettings" role="dialog" aria-modal="true" aria-label="<?php echo htmlspecialchars($clockTitle, ENT_QUOTES, 'UTF-8'); ?>">
            <div class="clock-settings-panel">
                <div class="clock-presets" role="group" aria-label="Cadence">
                    <div class="clock-preset-group" aria-label="1 minute">
                        <button type="button" class="clock-preset" data-minutes="1" data-increment="0" aria-pressed="false">1+0</button>
                        <button type="button" class="clock-preset" data-minutes="1" data-increment="2" aria-pressed="false">1+2</button>
                        <button type="button" class="clock-preset" data-minutes="1" data-increment="5" aria-pressed="false">1+5</button>
                        <button type="button" class="clock-preset" data-minutes="1" data-increment="10" aria-pressed="false">1+10</button>
                    </div>
                    <div class="clock-preset-group" aria-label="3 minutes">
                        <button type="button" class="clock-preset" data-minutes="3" data-increment="0" aria-pressed="false">3+0</button>
                        <button type="button" class="clock-preset" data-minutes="3" data-increment="2" aria-pressed="false">3+2</button>
                        <button type="button" class="clock-preset" data-minutes="3" data-increment="5" aria-pressed="false">3+5</button>
                        <button type="button" class="clock-preset" data-minutes="3" data-increment="10" aria-pressed="false">3+10</button>
                    </div>
                    <div class="clock-preset-group" aria-label="5 minutes">
                        <button type="button" class="clock-preset" data-minutes="5" data-increment="0" aria-pressed="false">5+0</button>
                        <button type="button" class="clock-preset" data-minutes="5" data-increment="5" aria-pressed="false">5+5</button>
                        <button type="button" class="clock-preset" data-minutes="5" data-increment="10" aria-pressed="false">5+10</button>
                        <button type="button" class="clock-preset" data-minutes="5" data-increment="15" aria-pressed="false">5+15</button>
                    </div>
                    <div class="clock-preset-group" aria-label="10 minutes">
                        <button type="button" class="clock-preset selected" data-minutes="10" data-increment="0" aria-pressed="true">10+0</button>
                        <button type="button" class="clock-preset" data-minutes="10" data-increment="5" aria-pressed="false">10+5</button>
                        <button type="button" class="clock-preset" data-minutes="10" data-increment="10" aria-pressed="false">10+10</button>
                        <button type="button" class="clock-preset" data-minutes="10" data-increment="15" aria-pressed="false">10+15</button>
                    </div>
                    <div class="clock-preset-group" aria-label="12 minutes">
                        <button type="button" class="clock-preset" data-minutes="12" data-increment="0" aria-pressed="false">12+0</button>
                        <button type="button" class="clock-preset" data-minutes="12" data-increment="5" aria-pressed="false">12+5</button>
                        <button type="button" class="clock-preset" data-minutes="12" data-increment="10" aria-pressed="false">12+10</button>
                        <button type="button" class="clock-preset" data-minutes="12" data-increment="15" aria-pressed="false">12+15</button>
                    </div>
                    <div class="clock-preset-group" aria-label="15 minutes">
                        <button type="button" class="clock-preset" data-minutes="15" data-increment="0" aria-pressed="false">15+0</button>
                        <button type="button" class="clock-preset" data-minutes="15" data-increment="5" aria-pressed="false">15+5</button>
                        <button type="button" class="clock-preset" data-minutes="15" data-increment="10" aria-pressed="false">15+10</button>
                        <button type="button" class="clock-preset" data-minutes="15" data-increment="15" aria-pressed="false">15+15</button>
                    </div>
                </div>
                <form class="clock-custom-form" id="customClockForm" hidden>
                    <label>
                        <span>Minutes</span>
                        <input type="number" id="customMinutes" min="1" max="180" required inputmode="numeric">
                    </label>
                    <label>
                        <span><?php echo $lang === 'fr' ? 'Incrément (secondes)' : 'Increment (seconds)'; ?></span>
                        <input type="number" id="customIncrement" min="0" max="60" required inputmode="numeric">
                    </label>
                    <button type="submit" class="clock-control primary"><?php echo $lang === 'fr' ? 'Appliquer' : 'Apply'; ?></button>
                </form>
                <div class="clock-controls">
                    <button type="button" class="clock-control primary" id="startPause">
                        <i class="bi bi-play-fill" aria-hidden="true"></i>
                        <span>Prêt</span>
                    </button>
                    <button type="button" class="clock-control" id="resetClock">
                        <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                        <span>Réinitialiser</span>
                    </button>
                </div>
                <div class="clock-settings-footer">
                    <button type="button" class="clock-close-button" id="closeClockSettings">Fermer</button>
                    <button type="button" class="clock-close-button" id="customClockButton">Personnalisé</button>
                    <a class="clock-control clock-home-link" id="clockHome" href="./index.php?new=1">Accueil</a>
                </div>
                <p class="clock-help">Les Noirs appuient d’abord sur leur pendule pour lancer la partie. Ensuite, touchez la pendule active après chaque coup.</p>
            </div>
        </section>

        <section class="clock-settings-overlay" id="clockFinished" role="dialog" aria-modal="true" aria-labelledby="clockFinishedTitle" hidden>
            <div class="clock-settings-panel clock-finished-panel">
                <h2 id="clockFinishedTitle">Temps écoulé</h2>
                <p id="clockFinishedMessage" class="clock-finished-message"></p>
                <div class="clock-finished-actions">
                    <button type="button" class="clock-control primary" id="restartClock">Réinitialiser</button>
                    <button type="button" class="clock-control" id="chooseAnotherTempo">Choisir un autre tempo</button>
                    <a class="clock-control clock-home-link" href="./index.php?new=1">Quitter et retourner à l’accueil</a>
                </div>
            </div>
        </section>
    </main>
    <script src="js/kchess/ui/chess-clock.js?v=<?php echo $version; ?>"></script>
</body>
</html>
