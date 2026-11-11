<?php
// fide_games.php — Appel de Python avec chemin absolu
header('Content-Type: application/json; charset=utf-8');

if (!isset($_GET['id']) || !preg_match('/^\d+$/', $_GET['id'])) {
    echo json_encode(['ok' => false, 'error' => 'missing_id']);
    exit;
}

$fideId = $_GET['id'];

// Le chemin exact vers ton Python
$pythonPath = 'C:\Python312\python.exe'; 

// Le script Python
$pythonScript = dirname(__DIR__) . '/python/get_opponents.py';

// On construit la commande.
// - escapeshellarg sécurise les chemins
// - chcp 65001 force l'UTF-8 pour la console Windows
// - 2>&1 capture les erreurs Python
$command = 'chcp 65001 >nul && ' . escapeshellarg($pythonPath) . ' ' . escapeshellarg($pythonScript) . ' ' . escapeshellarg($fideId) . ' 2>&1';

// On exécute
$output = shell_exec($command);

if (!$output) {
    echo json_encode(['ok' => false, 'error' => 'no_output', 'command' => $command]);
    exit;
}

$data = json_decode($output, true);
if ($data === null) {
    // Si le JSON est invalide, on affiche la sortie brute pour comprendre
    echo json_encode([
        'ok' => false, 
        'error' => 'python_error', 
        'raw' => substr($output, 0, 500) // Affiche les 500 premiers caractères
    ]);
    exit;
}

// Si Python a renvoyé une erreur, on la propage
if (isset($data['ok']) && $data['ok'] === false) {
    echo json_encode($data);
    exit;
}

echo $output;