<?php
/**
 * SERVEUR DE LOGS - K-CHESS STRESS TESTER
 * Emplacement : php/js/kchess/bots/unitTests/log_error.php
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
    // Changé 'clear_all' en 'clear' pour correspondre au JS
    case 'clear':
        $files = glob($directory . '*.json'); 
        $count = 0;
        foreach ($files as $file) { 
            if (is_file($file)) {
                unlink($file); 
                $count++;
            }
        }
        echo json_encode(["status" => "cleared", "deleted_count" => $count]);
        break;

    case 'save':
        $filename = isset($data['filename']) ? basename($data['filename']) : 'test_default.json';
        $finalPath = $directory . $filename;

        // On écrase le fichier existant
        $jsonFlags = JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
        
        if (file_put_contents($finalPath, json_encode($data['stats'], $jsonFlags)) !== false) {
            echo json_encode(["status" => "saved", "file" => $filename]);
        } else {
            echo json_encode(["status" => "error", "message" => "Echec ecriture"]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Action inconnue: " . $action]);
}