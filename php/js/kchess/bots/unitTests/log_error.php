<?php
/**
 * SERVEUR DE LOGS - K-CHESS STRESS TESTER
 * Sauvegarde dynamique par nomenclature de niveau.
 */

header('Content-Type: application/json');

$directory = __DIR__ . '/results/';
if (!is_dir($directory)) {
    mkdir($directory, 0777, true);
}

$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (!$data) {
    exit(json_encode(["status" => "error", "message" => "Données invalides"]));
}

$action = $data['action'] ?? '';

switch ($action) {
    case 'clear_all':
        $files = glob($directory . '*.json'); 
        foreach ($files as $file) { if (is_file($file)) unlink($file); }
        echo json_encode(["status" => "cleared"]);
        break;

    case 'save':
        // Utilise le nom envoyé par JS (ex: stress_test-L1vsL2.json)
        $filename = isset($data['filename']) ? basename($data['filename']) : 'test_default.json';
        $finalPath = $directory . $filename;

        // On remplace uniquement le fichier du même type
        if (is_file($finalPath)) unlink($finalPath);

        $jsonFlags = JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
        
        if (file_put_contents($finalPath, json_encode($data, $jsonFlags)) !== false) {
            echo json_encode(["status" => "saved", "file" => $filename]);
        } else {
            echo json_encode(["status" => "error", "message" => "Echec ecriture"]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Action inconnue"]);
}