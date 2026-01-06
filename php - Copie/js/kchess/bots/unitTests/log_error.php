<?php
/**
 * SERVEUR DE LOGS - K-CHESS STRESS TESTER
 * Gère le nettoyage automatique des anciens tests et la sauvegarde du dernier rapport.
 */

header('Content-Type: application/json');

// 1. Configuration du dossier de stockage
$directory = __DIR__ . '/results/';

// Création du dossier si inexistant
if (!is_dir($directory)) {
    mkdir($directory, 0777, true);
}

// 2. Récupération des données JSON
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (!$data) {
    echo json_encode([
        "status" => "error", 
        "message" => "Aucune donnée reçue ou JSON corrompu."
    ]);
    exit;
}

// 3. Traitement des actions
$action = isset($data['action']) ? $data['action'] : '';

switch ($action) {

    case 'clear_all':
        // Nettoyage manuel via le bouton "CLEAR SERVER"
        $files = glob($directory . '*.json'); 
        $count = 0;
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
                $count++;
            }
        }
        echo json_encode([
            "status" => "cleared", 
            "count" => $count,
            "directory" => "results/"
        ]);
        break;

    case 'save':
        // --- AUTO-PURGE : On supprime les anciens fichiers avant de sauvegarder le nouveau ---
        $existingFiles = glob($directory . '*.json');
        foreach ($existingFiles as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }

        // Sécurisation du nom de fichier (on garde un timestamp pour le nom unique du fichier courant)
        $rawFilename = isset($data['filename']) ? basename($data['filename']) : 'test_' . date('Y-m-d_H-i-s') . '.json';
        $finalPath = $directory . $rawFilename;

        /**
         * JSON_PRETTY_PRINT : Rendre le fichier lisible.
         * JSON_UNESCAPED_SLASHES : Important pour ne pas corrompre les FEN.
         */
        $jsonFlags = JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
        $jsonContent = json_encode($data, $jsonFlags);

        if (file_put_contents($finalPath, $jsonContent) !== false) {
            
            // --- Génération de l'URL de téléchargement ---
            $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
            $host = $_SERVER['HTTP_HOST'];
            $currentDir = str_replace(basename($_SERVER['SCRIPT_NAME']), '', $_SERVER['SCRIPT_NAME']);
            $downloadUrl = $protocol . "://" . $host . $currentDir . "results/" . $rawFilename;

            echo json_encode([
                "status" => "saved", 
                "message" => "Dossier nettoyé. Nouveau rapport sauvegardé.",
                "file" => $rawFilename,
                "path" => "results/" . $rawFilename,
                "downloadUrl" => $downloadUrl
            ]);
        } else {
            echo json_encode([
                "status" => "error", 
                "message" => "Erreur d'écriture dans le dossier results/."
            ]);
        }
        break;

    default:
        echo json_encode([
            "status" => "error", 
            "message" => "Action '$action' inconnue."
        ]);
        break;
}