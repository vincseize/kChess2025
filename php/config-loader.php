<?php
// config-loader.php - dans le dossier php/
function loadGameConfig() {
    $configFile = __DIR__ . '/config/game-config.json'; // Remonter d'un niveau
    
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
    // Déterminer la langue actuelle
    $config['current_lang'] = getPreferredLanguage($config);
    
    // Stocker le code de langue pour JavaScript
    $config['lang_code'] = $config['current_lang'];
    
    return $config;
}

function getPreferredLanguage($config) {
    // 1. Vérifier si une langue est dans l'URL (paramètre ?lang=)
    if (isset($_GET['lang'])) {
        $lang = $_GET['lang'];
        if (isset($config['lang'][$lang])) {
            // Définir un cookie pour la session
            setcookie('charlychess_lang', $lang, time() + (86400 * 30), "/");
            return $lang;
        }
    }
    
    // 2. Vérifier si une langue est stockée dans les cookies
    if (isset($_COOKIE['charlychess_lang'])) {
        $lang = $_COOKIE['charlychess_lang'];
        if (isset($config['lang'][$lang])) {
            return $lang;
        }
    }
    
    // 3. Retourner la langue par défaut depuis la config (déjà "fr" dans votre JSON)
    return isset($config['default_lang']) ? $config['default_lang'] : 'fr';
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
?>