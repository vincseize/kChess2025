<?php
/**
 * SERVEUR DE LOGS - K-CHESS STRESS TESTER
 * Gère le nettoyage des anciens tests et la sauvegarde des nouveaux.
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
        // Nettoyage du dossier results
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
        // Sécurisation du nom de fichier
        $rawFilename = isset($data['filename']) ? basename($data['filename']) : 'test_' . date('Y-m-d_H-i-s') . '.json';
        $finalPath = $directory . $rawFilename;

        /**
         * JSON_PRETTY_PRINT : Rendre le fichier lisible.
         * JSON_UNESCAPED_SLASHES : Important pour ne pas corrompre les FEN (ex: r/n/b...).
         * JSON_UNESCAPED_UNICODE : Garder les caractères spéciaux.
         */
        $jsonFlags = JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
        $jsonContent = json_encode($data, $jsonFlags);

        if (file_put_contents($finalPath, $jsonContent) !== false) {
            
            // --- Génération de l'URL de téléchargement pour le JS ---
            $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
            $host = $_SERVER['HTTP_HOST'];
            // On récupère le chemin du script actuel pour pointer vers /results/
            $currentDir = str_replace(basename($_SERVER['SCRIPT_NAME']), '', $_SERVER['SCRIPT_NAME']);
            $downloadUrl = $protocol . "://" . $host . $currentDir . "results/" . $rawFilename;

            echo json_encode([
                "status" => "saved", 
                "file" => $rawFilename,
                "path" => "results/" . $rawFilename,
                "downloadUrl" => $downloadUrl
            ]);
        } else {
            echo json_encode([
                "status" => "error", 
                "message" => "Erreur d'écriture : Vérifiez les permissions du dossier results/."
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