<?php
/**
 * core/app_mobile.php - Version Mobile avec Bot Dynamique
 * Version : 7.2.5 - Optimized Pathing
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

// Mise à jour du cookie de langue (30 jours)
if (!isset($_COOKIE['charlychess_lang']) || $_COOKIE['charlychess_lang'] !== $lang) {
    setcookie('charlychess_lang', $lang, time() + (86400 * 30), "/");
}

// 3. LOGIQUE DYNAMIQUE DES BOTS (LEVEL 1 à N)
$requestedLevel = isset($_GET['level']) ? intval($_GET['level']) : 1;
$botFileName = "Level_" . $requestedLevel . ".js";

// Chemins synchronisés avec la structure réelle validée dans les logs
$botRelativePath = "js/kchess/bots/" . $botFileName;
$botAbsolutePath = __DIR__ . "/" . $botRelativePath;

// 4. INCLUSION DU HEADER (Contient engine-scripts.php sans les bots fixes)
require_once 'header.php';

// 5. INJECTION DU SCRIPT DU BOT
echo "\n\n";
if (file_exists($botAbsolutePath)) {
    echo '<script src="' . $botRelativePath . '?v=' . time() . '"></script>' . "\n";
} else {
    // Repli sécurisé vers le Level_1 si le niveau demandé est introuvable
    $fallbackPath = "js/kchess/bots/Level_1.js";
    echo "\n";
    echo '<script src="' . $fallbackPath . '"></script>' . "\n";
}

// 6. INCLUSION DES COMPOSANTS SPÉCIFIQUES MOBILE
require_once 'content_mobile.php';
require_once 'footer.php';
?>