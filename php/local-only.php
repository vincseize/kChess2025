<?php
// local-only.php — vrai uniquement quand le site est ouvert depuis cette machine (localhost).
// Sert à réserver certaines actions (ex. ajouter une partie) au poste de l'administrateur.
function kchess_is_local(): bool {
    $addr = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!in_array($addr, ['127.0.0.1', '::1'], true)) return false;
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR']) || !empty($_SERVER['HTTP_X_REAL_IP'])) return false; // derrière un proxy
    $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
    $host = preg_replace('/:\d+$/', '', $host);
    return in_array($host, ['localhost', '127.0.0.1', '[::1]'], true);
}
