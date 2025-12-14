<?php
// config-loader.php - VERSION CORRIGÉE
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
    // La langue est maintenant déterminée dans app.php et stockée dans $_SESSION
    if (isset($_SESSION['charlychess_lang']) && isset($config['lang'][$_SESSION['charlychess_lang']])) {
        $config['current_lang'] = $_SESSION['charlychess_lang'];
    } else {
        // Langue par défaut depuis la config
        $config['current_lang'] = isset($config['default_lang']) ? $config['default_lang'] : 'fr';
    }
    
    // Stocker le code de langue pour JavaScript
    $config['lang_code'] = $config['current_lang'];
    
    return $config;
}

// Les autres fonctions restent inchangées
function getVersion() {
    return time();
}

function getAppConfigJson($config) {
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