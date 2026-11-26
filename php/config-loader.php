<?php
// config-loader.php - VERSION COMPLÈTE avec chargement des langues depuis /lang/

function loadGameConfig() {
    $configFile = __DIR__ . '/config/game-config.json';

    if (!file_exists($configFile)) {
        die("❌ Fichier de configuration manquant: $configFile");
    }

    $json = file_get_contents($configFile);
    $config = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        die("❌ Erreur de parsing JSON: " . json_last_error_msg());
    }

    // Normaliser chess_engine
    if (!isset($config['chess_engine'])) {
        $config['chess_engine'] = [];
    }
    if (isset($config['debug']['console_log']) && !isset($config['chess_engine']['console_log'])) {
        $config['chess_engine']['console_log'] = $config['debug']['console_log'];
    }
    if (isset($config['debug']['console_log'])) {
        $config['debug']['console_log'] = filter_var($config['debug']['console_log'], FILTER_VALIDATE_BOOLEAN);
    }
    if (isset($config['chess_engine']['console_log'])) {
        $config['chess_engine']['console_log'] = filter_var($config['chess_engine']['console_log'], FILTER_VALIDATE_BOOLEAN);
    }

    // ========== CHARGEMENT DES LANGUES DEPUIS /lang/ ==========
    $config['lang'] = loadTranslations($config);

    // ========== GESTION DE LA LANGUE COURANTE ==========
    $config['current_lang'] = getPreferredLanguage($config);
    $config['lang_code']    = $config['current_lang'];

    return $config;
}

/**
 * Charge toutes les traductions depuis le dossier /lang/ à la racine du projet.
 * Retourne un tableau [code => translations].
 */
function loadTranslations(array $config): array {
    $translations = [];
    $available = $config['available_langs'] ?? [];

    if (empty($available)) {
        return $translations;
    }

    // /lang/ est à la racine, deux niveaux au-dessus de php/config-loader.php
    $langDir = dirname(__DIR__, 2) . '/lang';

    foreach ($available as $code) {
        $file = $langDir . '/' . $code . '.json';
        if (!is_file($file)) {
            error_log("⚠️ Fichier de langue manquant: $file");
            continue;
        }
        $raw = file_get_contents($file);
        $data = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("⚠️ Erreur JSON dans $file: " . json_last_error_msg());
            continue;
        }
        if (is_array($data)) {
            $translations[$code] = $data;
        }
    }

    return $translations;
}

function getPreferredLanguage($config) {
    $debugLog = [];
    $available = $config['available_langs'] ?? array_keys($config['lang'] ?? []);

    // 1. GET
    if (isset($_GET['lang'])) {
        $lang = $_GET['lang'];
        $debugLog[] = "GET lang: $lang";
        if (in_array($lang, $available, true)) {
            if (session_status() === PHP_SESSION_ACTIVE) {
                $_SESSION['charlychess_lang'] = $lang;
                $debugLog[] = "Langue stockée dans SESSION: $lang";
            }
            if (!isset($_COOKIE['charlychess_lang']) || $_COOKIE['charlychess_lang'] !== $lang) {
                setcookie('charlychess_lang', $lang, time() + (86400 * 30), "/");
                $debugLog[] = "Cookie défini: $lang";
            }
            logDebug("Langue déterminée: $lang (source: GET)", $debugLog);
            return $lang;
        }
        $debugLog[] = "Langue GET invalide, ignorée: $lang";
    }

    // 2. SESSION
    if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['charlychess_lang'])) {
        $lang = $_SESSION['charlychess_lang'];
        $debugLog[] = "SESSION lang: $lang";
        if (in_array($lang, $available, true)) {
            logDebug("Langue déterminée: $lang (source: SESSION)", $debugLog);
            return $lang;
        }
        $debugLog[] = "Langue SESSION invalide, ignorée: $lang";
    }

    // 3. COOKIE
    if (isset($_COOKIE['charlychess_lang'])) {
        $lang = $_COOKIE['charlychess_lang'];
        $debugLog[] = "COOKIE lang: $lang";
        if (in_array($lang, $available, true)) {
            if (session_status() === PHP_SESSION_ACTIVE) {
                $_SESSION['charlychess_lang'] = $lang;
                $debugLog[] = "Cookie synchronisé avec SESSION: $lang";
            }
            logDebug("Langue déterminée: $lang (source: COOKIE)", $debugLog);
            return $lang;
        }
        $debugLog[] = "Langue COOKIE invalide, ignorée: $lang";
    }

    // 4. DÉFAUT
    $defaultLang = $config['default_lang'] ?? 'fr';
    if (!in_array($defaultLang, $available, true) && !empty($available)) {
        $defaultLang = $available[0];
    }
    $debugLog[] = "Langue par défaut: $defaultLang";
    if (session_status() === PHP_SESSION_ACTIVE) {
        $_SESSION['charlychess_lang'] = $defaultLang;
        $debugLog[] = "Langue par défaut stockée dans SESSION";
    }
    logDebug("Langue déterminée: $defaultLang (source: DEFAULT)", $debugLog);
    return $defaultLang;
}

function getVersion() {
    return time();
}

function getAppConfigJson($config) {
    return json_encode($config, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE);
}

function getThemeCssVariables($config) {
    $colorVariables = [
        '--site-background' => 'background',
        '--site-surface' => 'surface',
        '--site-surface-alt' => 'surface_alt',
        '--site-text' => 'text',
        '--site-text-muted' => 'text_muted',
        '--site-border' => 'border',
        '--primary-color' => 'primary',
        '--success-color' => 'success',
        '--chess-square-white' => 'square_white',
        '--chess-square-black' => 'square_black',
        '--chess-selected' => 'selected',
        '--chess-move-indicator' => 'move_indicator',
        '--chess-capture-indicator' => 'capture_indicator',
        '--chess-clock-white' => 'clock_white',
        '--chess-clock-black' => 'clock_black',
        '--chess-clock-active' => 'clock_active',
        '--chess-clock-expired' => 'clock_expired',
    ];

    $declarations = [
        '--chess-brown-dark: var(--site-border);',
        '--chess-brown-light: var(--chess-square-white);',
    ];

    foreach ($colorVariables as $cssVariable => $configKey) {
        $color = $config['colors'][$configKey] ?? null;
        if (is_string($color) && preg_match('/^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/', $color)) {
            $declarations[] = $cssVariable . ': ' . $color . ';';
        }
    }

    return implode("\n", $declarations);
}

function logConfigInfo($config) {
    if (isset($config['debug']['console_log']) && $config['debug']['console_log'] === true) {
        error_log("⚙️ Configuration chargée - debug: " .
                 ($config['debug']['console_log'] ? 'true' : 'false') .
                 ", chess_engine: " .
                 (isset($config['chess_engine']['console_log']) ?
                  ($config['chess_engine']['console_log'] ? 'true' : 'false') : 'non défini') .
                 ", langue: " . $config['current_lang'] .
                 ", default_lang: " . $config['default_lang'] .
                 ", langues chargées: " . implode(',', array_keys($config['lang'] ?? [])));
    }
}

function logDebug($message, $details = []) {
    $logMessage = "🌐 [Langue] $message";
    if (!empty($details)) {
        $logMessage .= " - Détails: " . implode(', ', $details);
    }
    error_log($logMessage);
}

function getTranslation($key, $lang = null, $config = null) {
    static $cachedConfig = null;
    static $cachedLang = null;

    if ($config === null) {
        if ($cachedConfig === null) $cachedConfig = loadGameConfig();
        $config = $cachedConfig;
    }
    if ($lang === null) {
        if ($cachedLang === null) $cachedLang = $config['current_lang'];
        $lang = $cachedLang;
    }
    if (isset($config['lang'][$lang][$key])) {
        return $config['lang'][$lang][$key];
    } elseif (isset($config['lang']['fr'][$key])) {
        return $config['lang']['fr'][$key];
    }
    return $key;
}

function setLanguage($langCode) {
    if (session_status() === PHP_SESSION_ACTIVE) {
        $_SESSION['charlychess_lang'] = $langCode;
    }
    setcookie('charlychess_lang', $langCode, time() + (86400 * 30), "/");
    return loadGameConfig();
}

// Test en ligne de commande
if (basename($_SERVER['PHP_SELF']) === 'config-loader.php') {
    $config = loadGameConfig();
    echo "=== CONFIG-LOADER TEST ===\n";
    echo "Langue actuelle: " . $config['current_lang'] . "\n";
    echo "Langue par défaut: " . $config['default_lang'] . "\n";
    echo "Traductions disponibles: " . implode(', ', array_keys($config['lang'])) . "\n";
    echo "\n=== TRADUCTIONS TEST ===\n";
    echo "new_game (fr): " . getTranslation('new_game', 'fr', $config) . "\n";
    echo "new_game (en): " . getTranslation('new_game', 'en', $config) . "\n";
    echo "flip_board (fr): " . getTranslation('flip_board', 'fr', $config) . "\n";
    echo "flip_board (en): " . getTranslation('flip_board', 'en', $config) . "\n";
}
?>