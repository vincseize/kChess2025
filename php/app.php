<?php
/**
 * core/app.php - Point d'entrée principal
 * Version : 7.2.5 - Dynamic Bot System & Lang Manager
 */

// 1. GESTION DES SESSIONS (AVANT TOUT OUTPUT)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$_SESSION['from_app'] = true;

// 2. GESTION DE LA LANGUE
$lang = 'fr'; // Valeur par défaut

if (isset($_GET['lang'])) {
    $lang = preg_replace('/[^a-z]/', '', $_GET['lang']); // Sécurité
    $_SESSION['charlychess_lang'] = $lang;
} elseif (isset($_SESSION['charlychess_lang'])) {
    $lang = $_SESSION['charlychess_lang'];
} elseif (isset($_COOKIE['charlychess_lang'])) {
    $lang = $_COOKIE['charlychess_lang'];
    $_SESSION['charlychess_lang'] = $lang;
}

// Mise à jour du cookie (30 jours)
if (!isset($_COOKIE['charlychess_lang']) || $_COOKIE['charlychess_lang'] !== $lang) {
    setcookie('charlychess_lang', $lang, time() + (86400 * 30), "/");
}

// 3. LOGIQUE DYNAMIQUE DES BOTS (LEVEL 1 à N)
// On récupère le niveau depuis l'URL (?level=3, ?level=4, etc.)
$requestedLevel = isset($_GET['level']) ? intval($_GET['level']) : 1;
$botFileName = "Level_" . $requestedLevel . ".js";

// Chemins basés sur ton arborescence : /php/js/kchess/bots/
$botRelativePath = "js/kchess/bots/" . $botFileName; 
$botAbsolutePath = __DIR__ . "/" . $botRelativePath;

// 4. INCLUSION DES COMPOSANTS UI
// Note : header.php appelle engine-scripts.php (assure-toi d'avoir supprimé les bots de engine-scripts.php !)
require_once 'header.php';

// 5. INJECTION DU BOT DYNAMIQUE
echo "\n\n";
if (file_exists($botAbsolutePath)) {
    // Injection du bot demandé avec anti-cache (time)
    echo '<script src="' . $botRelativePath . '?v=' . time() . '"></script>' . "\n";
} else {
    // Fallback de sécurité vers Level_1 si le fichier n'existe pas
    $fallbackPath = "js/kchess/bots/Level_1.js";
    echo "\n";
    echo '<script src="' . $fallbackPath . '"></script>' . "\n";
}
echo "\n\n";

// 6. INCLUSION DU RESTE DU LAYOUT
require_once 'content.php';
require_once 'footer.php';
?>