<?php
// js/kchess/bots/unitTests/log_error.php
header('Content-Type: application/json');

$json = file_get_contents('php://input');
if ($json) {
    $data = json_decode($json, true);
    $filename = 'test_results_' . date('Y-m-d_H-i-s') . '.json';
    
    // On garde les 5 dernières sessions de test
    file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));
    
    echo json_encode(["status" => "success", "file" => $filename]);
} else {
    echo json_encode(["status" => "error", "message" => "No data"]);
}