<?php
// config-loader.php - VERSION COMPLÈTE CORRIGÉE

function loadGameConfig() {
    $configFile = __DIR__ . '/config/game-config.json';
    
    // Vérifier si le fichier existe
    if (!file_exists($configFile)) {
        die("❌ Fichier de configuration manquant: $configFile");
    }
    
    $json = file_get_contents($configFile);
    $config = json_decode($json, true);
    
    // Vérifier si le JSON est valide
    if (json_last_error() !== JSON_ERROR_NONE) {
        die("❌ Erreur de parsing JSON: " . json_last_error_msg());
    }
    
    // Normaliser la configuration pour compatibilité avec tous les modules
    if (!isset($config['chess_engine'])) {
        $config['chess_engine'] = [];
    }
    
    // Si debug.console_log existe, le copier dans chess_engine pour compatibilité
    if (isset($config['debug']['console_log']) && !isset($config['chess_engine']['console_log'])) {
        $config['chess_engine']['console_log'] = $config['debug']['console_log'];
    }
    
    // Assurer que les valeurs booléennes sont correctes (gérer "true"/"false" strings)
    if (isset($config['debug']['console_log'])) {
        $config['debug']['console_log'] = filter_var($config['debug']['console_log'], FILTER_VALIDATE_BOOLEAN);
    }
    
    if (isset($config['chess_engine']['console_log'])) {
        $config['chess_engine']['console_log'] = filter_var($config['chess_engine']['console_log'], FILTER_VALIDATE_BOOLEAN);
    }
    
    // ========== GESTION DES LANGUES ==========
    $config['current_lang'] = getPreferredLanguage($config);
    
    // Stocker le code de langue pour JavaScript
    $config['lang_code'] = $config['current_lang'];
    
    return $config;
}

function getPreferredLanguage($config) {
    // DEBUG: Log pour voir ce qui se passe
    $debugLog = [];
    
    // 1. Priorité au paramètre GET (si présent)
    if (isset($_GET['lang'])) {
        $lang = $_GET['lang'];
        $debugLog[] = "GET lang: $lang";
        
        if (isset($config['lang'][$lang])) {
            // Stocker dans la session
            if (session_status() === PHP_SESSION_ACTIVE) {
                $_SESSION['charlychess_lang'] = $lang;
                $debugLog[] = "Langue stockée dans SESSION: $lang";
            }
            
            // Définir le cookie pour les prochaines visites
            if (!isset($_COOKIE['charlychess_lang']) || $_COOKIE['charlychess_lang'] !== $lang) {
                setcookie('charlychess_lang', $lang, time() + (86400 * 30), "/");
                $debugLog[] = "Cookie défini: $lang";
            }
            
            logDebug("Langue déterminée: $lang (source: GET)", $debugLog);
            return $lang;
        } else {
            $debugLog[] = "Langue GET invalide, ignorée: $lang";
        }
    }
    
    // 2. Vérifier la session (si active)
    if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['charlychess_lang'])) {
        $lang = $_SESSION['charlychess_lang'];
        $debugLog[] = "SESSION lang: $lang";
        
        if (isset($config['lang'][$lang])) {
            logDebug("Langue déterminée: $lang (source: SESSION)", $debugLog);
            return $lang;
        } else {
            $debugLog[] = "Langue SESSION invalide, ignorée: $lang";
        }
    }
    
    // 3. Vérifier le cookie (pour compatibilité)
    if (isset($_COOKIE['charlychess_lang'])) {
        $lang = $_COOKIE['charlychess_lang'];
        $debugLog[] = "COOKIE lang: $lang";
        
        if (isset($config['lang'][$lang])) {
            // Synchroniser avec la session si active
            if (session_status() === PHP_SESSION_ACTIVE) {
                $_SESSION['charlychess_lang'] = $lang;
                $debugLog[] = "Cookie synchronisé avec SESSION: $lang";
            }
            
            logDebug("Langue déterminée: $lang (source: COOKIE)", $debugLog);
            return $lang;
        } else {
            $debugLog[] = "Langue COOKIE invalide, ignorée: $lang";
        }
    }
    
    // 4. Langue par défaut depuis la config
    $defaultLang = isset($config['default_lang']) ? $config['default_lang'] : 'fr';
    $debugLog[] = "Langue par défaut: $defaultLang";
    
    // Stocker la langue par défaut dans la session si elle est active
    if (session_status() === PHP_SESSION_ACTIVE) {
        $_SESSION['charlychess_lang'] = $defaultLang;
        $debugLog[] = "Langue par défaut stockée dans SESSION";
    }
    
    logDebug("Langue déterminée: $defaultLang (source: DEFAULT)", $debugLog);
    return $defaultLang;
}

function getVersion() {
    return time(); // Version basée sur le timestamp pour éviter le cache
}

function getAppConfigJson($config) {
    // Convertir en JSON sécurisé pour JavaScript
    return json_encode($config, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE);
}

function logConfigInfo($config) {
    if (isset($config['debug']['console_log']) && $config['debug']['console_log'] === true) {
        error_log("⚙️ Configuration chargée - debug: " . 
                 ($config['debug']['console_log'] ? 'true' : 'false') . 
                 ", chess_engine: " . 
                 (isset($config['chess_engine']['console_log']) ? 
                  ($config['chess_engine']['console_log'] ? 'true' : 'false') : 'non défini') .
                 ", langue: " . $config['current_lang'] .
                 ", default_lang: " . $config['default_lang']);
    }
}

// Fonction de debug pour la gestion de la langue
function logDebug($message, $details = []) {
    // Toujours logger dans error_log pour debug
    $logMessage = "🌐 [Langue] $message";
    
    if (!empty($details)) {
        $logMessage .= " - Détails: " . implode(', ', $details);
    }
    
    error_log($logMessage);
    
    // Également afficher dans la console si debug activé
    // Cette partie sera utilisée plus tard quand nous chargerons la config
}

// Fonction utilitaire pour obtenir les traductions rapidement
function getTranslation($key, $lang = null, $config = null) {
    static $cachedConfig = null;
    static $cachedLang = null;
    
    // Charger la configuration si non fournie
    if ($config === null) {
        if ($cachedConfig === null) {
            $cachedConfig = loadGameConfig();
        }
        $config = $cachedConfig;
    }
    
    // Déterminer la langue si non fournie
    if ($lang === null) {
        if ($cachedLang === null) {
            $cachedLang = $config['current_lang'];
        }
        $lang = $cachedLang;
    }
    
    // Retourner la traduction ou la clé si non trouvée
    if (isset($config['lang'][$lang][$key])) {
        return $config['lang'][$lang][$key];
    } elseif (isset($config['lang']['fr'][$key])) {
        // Fallback en français
        return $config['lang']['fr'][$key];
    } else {
        // Fallback : retourner la clé
        return $key;
    }
}

// Fonction pour forcer une langue spécifique (utile pour les tests)
function setLanguage($langCode) {
    if (session_status() === PHP_SESSION_ACTIVE) {
        $_SESSION['charlychess_lang'] = $langCode;
    }
    
    setcookie('charlychess_lang', $langCode, time() + (86400 * 30), "/");
    
    // Recharger la configuration pour refléter le changement
    return loadGameConfig();
}

// Initialisation automatique si appelé directement
if (basename($_SERVER['PHP_SELF']) === 'config-loader.php') {
    // Pour les tests en ligne de commande
    $config = loadGameConfig();
    echo "=== CONFIG-LOADER TEST ===\n";
    echo "Langue actuelle: " . $config['current_lang'] . "\n";
    echo "Langue par défaut: " . $config['default_lang'] . "\n";
    echo "Traductions disponibles: " . implode(', ', array_keys($config['lang'])) . "\n";
    
    // Tester quelques traductions
    echo "\n=== TRADUCTIONS TEST ===\n";
    echo "new_game (fr): " . getTranslation('new_game', 'fr', $config) . "\n";
    echo "new_game (en): " . getTranslation('new_game', 'en', $config) . "\n";
    echo "flip_board (fr): " . getTranslation('flip_board', 'fr', $config) . "\n";
    echo "flip_board (en): " . getTranslation('flip_board', 'en', $config) . "\n";
}
?>