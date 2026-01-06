<?php
// app.php - DÉBUT
// Démarrer la session TRÈS TÔT
session_start();
$_SESSION['from_app'] = true;

// Déterminer la langue ici, avant d'inclure header.php
$lang = 'fr'; // valeur par défaut

// 1. Priorité à l'URL
if (isset($_GET['lang'])) {
    $lang = $_GET['lang'];
    $_SESSION['charlychess_lang'] = $lang;
}
// 2. Sinon, vérifier la session
elseif (isset($_SESSION['charlychess_lang'])) {
    $lang = $_SESSION['charlychess_lang'];
}
// 3. Sinon, vérifier le cookie (pour compatibilité)
elseif (isset($_COOKIE['charlychess_lang'])) {
    $lang = $_COOKIE['charlychess_lang'];
    $_SESSION['charlychess_lang'] = $lang;
}

// Définir le cookie si possible (AVANT tout output)
if (!isset($_COOKIE['charlychess_lang']) || $_COOKIE['charlychess_lang'] !== $lang) {
    setcookie('charlychess_lang', $lang, time() + (86400 * 30), "/");
}

// Maintenant inclure les fichiers
require_once 'header.php';
require_once 'content.php';
require_once 'footer.php';
?>