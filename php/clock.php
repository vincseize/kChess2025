<?php
require_once __DIR__ . '/config-loader.php';

$config = loadGameConfig();
$langCode = $config['current_lang'] ?? 'fr';
$lang = htmlspecialchars($langCode, ENT_QUOTES, 'UTF-8');
$clockText = $config['lang'][$langCode]['clock'];
// Textes de la barre centrale : valeurs par défaut (les clés de game-config.json, si présentes, les remplacent)
$clockDefaults = [
    'fr' => [
        'controls_label' => 'Commandes de la pendule',
        'reset_confirm' => 'Remettre la pendule à zéro ?',
        'yes' => 'Oui',
        'no' => 'Non',
        'choose_format' => 'Choisir un autre format de pendule',
        'sound_on' => 'Son activé : cliquer pour couper',
        'sound_off' => 'Son coupé : cliquer pour activer',
    ],
    'en' => [
        'controls_label' => 'Clock controls',
        'reset_confirm' => 'Reset the clock to zero?',
        'yes' => 'Yes',
        'no' => 'No',
        'choose_format' => 'Choose another clock format',
        'sound_on' => 'Sound on: click to mute',
        'sound_off' => 'Sound off: click to enable',
    ],
];
$clockText = array_merge($clockDefaults[$langCode] ?? $clockDefaults['fr'], $clockText);
$clockTitle = htmlspecialchars($clockText['title'], ENT_QUOTES, 'UTF-8');
$translate = static function (string $key) use ($clockText): string {
    return htmlspecialchars($clockText[$key], ENT_QUOTES, 'UTF-8');
};
$version = htmlspecialchars((string) getVersion(), ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title><?php echo $clockTitle; ?> | <?php echo htmlspecialchars($config['app_name'], ENT_QUOTES, 'UTF-8'); ?></title>
    <link rel="icon" type="image/svg+xml" href="img/icon.svg">
    <link rel="manifest" href="manifest.json">
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/bootstrap-icons.css">
    <link rel="stylesheet" href="css/kchess/clock.css?v=<?php echo $version; ?>">
    <style>:root { <?php echo getThemeCssVariables($config); ?> }</style>
</head>
<body>
    <main class="clock-page">
        <header class="clock-header">
            <button type="button" class="clock-back" id="openTempoSelection" aria-label="<?php echo $translate('back_to_tempos'); ?>">
                <i class="bi bi-arrow-left" aria-hidden="true"></i>
            </button>
            <h1><?php echo htmlspecialchars($clockTitle, ENT_QUOTES, 'UTF-8'); ?></h1>
            <button type="button" class="clock-menu-button" id="openClockSettings" aria-label="<?php echo $translate('settings'); ?>">
                <i class="bi bi-gear-fill" aria-hidden="true"></i>
            </button>
        </header>

        <section class="clock-players" aria-label="<?php echo $translate('board_label'); ?>">
            <div class="clock-player black-player" data-player-panel="black">
                <button type="button" class="clock-face" id="blackClock" data-player="black" disabled aria-label="<?php echo $translate('black'); ?>">
                    <span class="clock-time" id="blackTime">10:00</span>
                </button>
            </div>
            <div class="clock-player white-player" data-player-panel="white">
                <button type="button" class="clock-face" id="whiteClock" data-player="white" disabled aria-label="<?php echo $translate('white'); ?>">
                    <span class="clock-time" id="whiteTime">10:00</span>
                </button>
            </div>
        </section>

        <div class="clock-veil" aria-hidden="true"></div>

        <nav class="clock-divider" id="clockDivider" aria-label="<?php echo $translate('controls_label'); ?>" data-sound-src="sounds/clock-click.mp3">
            <div class="clock-divider-actions" id="dividerActions">
                <div class="clock-divider-group start">
                    <button type="button" class="clock-divider-btn" id="dividerReset" aria-label="<?php echo $translate('reset'); ?>" title="<?php echo $translate('reset'); ?>">
                        <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="clock-divider-group center">
                    <button type="button" class="clock-divider-btn primary" id="dividerPlayPause" aria-label="<?php echo $translate('ready'); ?>" title="<?php echo $translate('ready'); ?>">
                        <i class="bi bi-play-fill" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="clock-divider-group end">
                    <button type="button" class="clock-divider-btn" id="dividerTempo" aria-label="<?php echo $translate('choose_format'); ?>" title="<?php echo $translate('choose_format'); ?>">
                        <i class="bi bi-stopwatch" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="clock-divider-btn" id="dividerSound" aria-pressed="true" aria-label="<?php echo $translate('sound_on'); ?>" title="<?php echo $translate('sound_on'); ?>">
                        <i class="bi bi-volume-up-fill" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            <div class="clock-divider-confirm" id="dividerConfirm" role="alertdialog" aria-label="<?php echo $translate('reset_confirm'); ?>" hidden>
                <span class="clock-divider-question"><?php echo $translate('reset_confirm'); ?></span>
                <button type="button" class="clock-divider-choice danger" id="dividerResetYes"><?php echo $translate('yes'); ?></button>
                <button type="button" class="clock-divider-choice" id="dividerResetNo"><?php echo $translate('no'); ?></button>
            </div>
        </nav>

        <p class="visually-hidden" id="clockStatus" role="status" aria-live="polite"><?php echo $translate('initial_status'); ?></p>

        <section class="clock-settings-overlay" id="clockSettings" role="dialog" aria-modal="true" aria-label="<?php echo $clockTitle; ?>" hidden>
            <div class="clock-settings-panel">
                <div class="clock-presets" role="group" aria-label="<?php echo $translate('cadence'); ?>">
                    <div class="clock-preset-group" aria-label="1 <?php echo $translate('minute'); ?>">
                        <button type="button" class="clock-preset" data-minutes="1" data-increment="0" aria-pressed="false">1 +0</button>
                        <button type="button" class="clock-preset" data-minutes="1" data-increment="2" aria-pressed="false">1 +2</button>
                        <button type="button" class="clock-preset" data-minutes="1" data-increment="5" aria-pressed="false">1 +5</button>
                        <button type="button" class="clock-preset" data-minutes="1" data-increment="10" aria-pressed="false">1 +10</button>
                    </div>
                    <div class="clock-preset-group" aria-label="3 <?php echo $translate('minutes'); ?>">
                        <button type="button" class="clock-preset" data-minutes="3" data-increment="0" aria-pressed="false">3 +0</button>
                        <button type="button" class="clock-preset" data-minutes="3" data-increment="2" aria-pressed="false">3 +2</button>
                        <button type="button" class="clock-preset" data-minutes="3" data-increment="5" aria-pressed="false">3 +5</button>
                        <button type="button" class="clock-preset" data-minutes="3" data-increment="10" aria-pressed="false">3 +10</button>
                    </div>
                    <div class="clock-preset-group" aria-label="5 <?php echo $translate('minutes'); ?>">
                        <button type="button" class="clock-preset" data-minutes="5" data-increment="0" aria-pressed="false">5 +0</button>
                        <button type="button" class="clock-preset" data-minutes="5" data-increment="5" aria-pressed="false">5 +5</button>
                        <button type="button" class="clock-preset" data-minutes="5" data-increment="10" aria-pressed="false">5 +10</button>
                        <button type="button" class="clock-preset" data-minutes="5" data-increment="15" aria-pressed="false">5 +15</button>
                    </div>
                    <div class="clock-preset-group" aria-label="10 <?php echo $translate('minutes'); ?>">
                        <button type="button" class="clock-preset selected" data-minutes="10" data-increment="0" aria-pressed="true">10 +0</button>
                        <button type="button" class="clock-preset" data-minutes="10" data-increment="5" aria-pressed="false">10 +5</button>
                        <button type="button" class="clock-preset" data-minutes="10" data-increment="10" aria-pressed="false">10 +10</button>
                        <button type="button" class="clock-preset" data-minutes="10" data-increment="15" aria-pressed="false">10 +15</button>
                    </div>
                    <div class="clock-preset-group" aria-label="12 <?php echo $translate('minutes'); ?>">
                        <button type="button" class="clock-preset" data-minutes="12" data-increment="0" aria-pressed="false">12 +0</button>
                        <button type="button" class="clock-preset" data-minutes="12" data-increment="5" aria-pressed="false">12 +5</button>
                        <button type="button" class="clock-preset" data-minutes="12" data-increment="10" aria-pressed="false">12 +10</button>
                        <button type="button" class="clock-preset" data-minutes="12" data-increment="15" aria-pressed="false">12 +15</button>
                    </div>
                    <div class="clock-preset-group" aria-label="15 <?php echo $translate('minutes'); ?>">
                        <button type="button" class="clock-preset" data-minutes="15" data-increment="0" aria-pressed="false">15 +0</button>
                        <button type="button" class="clock-preset" data-minutes="15" data-increment="5" aria-pressed="false">15 +5</button>
                        <button type="button" class="clock-preset" data-minutes="15" data-increment="10" aria-pressed="false">15 +10</button>
                        <button type="button" class="clock-preset" data-minutes="15" data-increment="15" aria-pressed="false">15 +15</button>
                    </div>
                    <div class="clock-preset-group clock-saved-customs" id="savedCustomTimes" aria-label="<?php echo $translate('saved_custom_times'); ?>" hidden></div>
                </div>
                <form class="clock-custom-form" id="customClockForm" hidden>
                    <label>
                        <span><?php echo $translate('minutes'); ?></span>
                        <input type="number" id="customMinutes" min="1" max="180" required inputmode="numeric">
                    </label>
                    <label>
                        <span><?php echo $translate('increment_seconds'); ?></span>
                        <input type="number" id="customIncrement" min="0" max="60" required inputmode="numeric">
                    </label>
                    <button type="submit" class="clock-control primary"><?php echo $translate('apply'); ?></button>
                </form>
                <div class="clock-controls">
                    <button type="button" class="clock-control primary" id="startPause">
                        <i class="bi bi-play-fill" aria-hidden="true"></i>
                        <span><?php echo $translate('ready'); ?></span>
                    </button>
                    <button type="button" class="clock-control" id="resetClock">
                        <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                        <span><?php echo $translate('reset'); ?></span>
                    </button>
                </div>
                <div class="clock-settings-footer">
                    <button type="button" class="clock-close-button" id="closeClockSettings"><?php echo $translate('close'); ?></button>
                    <button type="button" class="clock-close-button" id="customClockButton"><?php echo $translate('custom'); ?></button>
                    <a class="clock-control clock-home-link" id="clockHome" href="./index.php?new=1"><?php echo $translate('home'); ?></a>
                </div>
                <p class="clock-help"><?php echo $translate('instructions'); ?></p>
            </div>
        </section>

        <section class="clock-settings-overlay" id="clockFinished" role="dialog" aria-modal="true" aria-labelledby="clockFinishedTitle" hidden>
            <div class="clock-settings-panel clock-finished-panel">
                <h2 id="clockFinishedTitle"><?php echo $translate('time_expired'); ?></h2>
                <p id="clockFinishedMessage" class="clock-finished-message"></p>
                <div class="clock-finished-actions">
                    <button type="button" class="clock-control primary" id="restartClock"><?php echo $translate('reset'); ?></button>
                    <button type="button" class="clock-control" id="chooseAnotherTempo"><?php echo $translate('choose_another_tempo'); ?></button>
                    <a class="clock-control clock-home-link" href="./index.php?new=1"><?php echo $translate('quit_home'); ?></a>
                </div>
            </div>
        </section>
    </main>
    <script>window.clockTranslations = <?php echo json_encode($clockText, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE); ?>;</script>
    <script src="js/kchess/ui/chess-clock.js?v=<?php echo $version; ?>"></script>
</body>
</html>