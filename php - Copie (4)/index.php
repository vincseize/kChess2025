<?php
// Démarrer la session
session_start();

// Charger la configuration JSON
$config = json_decode(file_get_contents('config/game-config.json'), true);

// Inclure les fichiers nécessaires
require_once 'header.php';
require_once 'content.php';
require_once 'footer.php';
?>&#9818;