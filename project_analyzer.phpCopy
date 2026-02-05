<?php
/**
 * Project Analyzer V7 - Filtrage Strict (Nom exact + Contient)
 * S'applique aux dossiers et aux fichiers.
 */

// --- 1. CONFIGURATION ---
$targetDir = __DIR__;

// Exclusion par NOM EXACT (Dossiers ou Fichiers)
$excludeExact = [
    'node_modules', '.git', 'vendor', 'logs', 'tmp', 'img', 'css', 
    'fonts', 'webfonts', 'TEMPLATE_LAYOUT', 'templateOLD', 'unitTests',
    'arbo.txt', 'project_analyzer.php', 'project_report.json', 'arbo.php'
];

// Exclusion si le nom CONTIENT (Dossiers ou Fichiers)
// "bootstrap" exclura "bootstrap.min.css", "folder-bootstrap", etc.
$excludeIfContains = [
    'bootstrap', 
    'jquery',
    'dist',
    'min.js',
    'min.css',
    'DES',
];

$results = ['definitions' => [], 'usages' => []];

/**
 * Logique de test d'exclusion globale
 */
function isBlacklisted($name, $excludeExact, $excludeContains) {
    // 1. Test nom exact
    if (in_array($name, $excludeExact)) return true;

    // 2. Test "Contient" (insensible à la casse)
    foreach ($excludeContains as $keyword) {
        if (stripos($name, $keyword) !== false) return true;
    }
    
    return false;
}

// --- 2. GÉNÉRATION DE L'ARBORESCENCE (TXT) ---
$arboFile = 'arbo.txt';
$h = fopen($arboFile, 'w');
fwrite($h, "Arborescence du projet (Filtrée) : " . $targetDir . "\n");

function generateArbo($dir, $exExact, $exContains, $depth, $h) {
    $items = array_diff(scandir($dir), ['.', '..']);
    foreach ($items as $item) {
        // Si le nom du dossier ou du fichier est blacklisté, on skip
        if (isBlacklisted($item, $exExact, $exContains)) continue;

        $path = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_dir($path)) {
            fwrite($h, str_repeat('  ', $depth) . '📁 ' . $item . "\n");
            generateArbo($path, $exExact, $exContains, $depth + 1, $h);
        } else {
            fwrite($h, str_repeat('  ', $depth) . '📄 ' . $item . "\n");
        }
    }
}
generateArbo($targetDir, $excludeExact, $excludeIfContains, 0, $h);
fclose($h);

// --- 3. ANALYSE DES CLASSES ET USAGES ---
$filesToScan = [];
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($targetDir));

foreach ($it as $file) {
    if ($file->isDir()) continue;
    
    $fileName = $file->getFilename();
    $path = $file->getPathname();
    $relative = str_replace($targetDir, '', $path);
    
    // On vérifie chaque segment du chemin (pour exclure si un parent est blacklisté)
    // ET on vérifie le nom du fichier lui-même
    $parts = explode(DIRECTORY_SEPARATOR, ltrim($relative, DIRECTORY_SEPARATOR));
    $shouldSkip = false;
    foreach ($parts as $part) {
        if (isBlacklisted($part, $excludeExact, $excludeIfContains)) {
            $shouldSkip = true;
            break;
        }
    }

    if ($shouldSkip) continue;

    // On ne scanne que le code source pour les définitions
    if (in_array($file->getExtension(), ['js', 'php'])) {
        $filesToScan[] = $path;
    }
}

// Extraction (Classes)
foreach ($filesToScan as $file) {
    $content = file_get_contents($file);
    $rel = str_replace($targetDir, '', $file);
    if (preg_match_all('/class\s+([a-zA-Z0-9_]+)/', $content, $matches)) {
        foreach ($matches[1] as $name) {
            $results['definitions'][$name] = ['file' => $rel];
        }
    }
}

// Analyse des Usages
foreach ($results['definitions'] as $name => $info) {
    $results['usages'][$name] = [];
    foreach ($filesToScan as $file) {
        $rel = str_replace($targetDir, '', $file);
        if ($rel === $info['file']) continue;
        if (preg_match('/\b' . preg_quote($name) . '\b/', file_get_contents($file))) {
            $results['usages'][$name][] = $rel;
        }
    }
}

file_put_contents('project_report.json', json_encode($results, JSON_PRETTY_PRINT));

// --- 4. AFFICHAGE HTML ---
echo "<html><head><title>K-Chess Master Analyzer</title><style>
    body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; padding: 20px; }
    .container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { padding: 12px; border: 1px solid #e2e8f0; text-align: left; }
    th { background: #2d3748; color: white; }
    .orphan { background: #fff5f5; color: #c53030; }
    .usage-item { display: block; font-size: 0.85em; color: #4a5568; margin-top: 2px; }
</style></head><body>
<div class='container'>
<h1>🔍 Analyseur V7 (Filtrage Global)</h1>
<p>✅ <strong>arbo.txt</strong> et <strong>project_report.json</strong> générés.</p>
<p>🚫 Exclusions actives : Nom exact ou contenant <em>" . implode(", ", $excludeIfContains) . "</em></p>
<table><tr><th>Classe</th><th>Source</th><th>Utilisée par</th><th>Score</th></tr>";

foreach ($results['definitions'] as $name => $info) {
    $u = $results['usages'][$name];
    $count = count($u);
    echo "<tr " . ($count === 0 ? "class='orphan'" : "") . ">
        <td><strong>$name</strong></td>
        <td><small>{$info['file']}</small></td>
        <td>" . (empty($u) ? '<em>Chargement dynamique</em>' : implode('', array_map(fn($x) => "<span class='usage-item'>📍 $x</span>", $u))) . "</td>
        <td><strong>" . ($count > 0 ? "✅ $count" : "⚠️ 0") . "</strong></td>
    </tr>";
}
echo "</table></div></body></html>";