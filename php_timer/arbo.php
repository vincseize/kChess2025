<?php
// ultra_simple.php - Pour copier-coller rapidement

$exclude = ['node_modules', '.git', 'vendor', 'logs', 'tmp', 'arbo.txt', 'arbo.php', 'bootstrap', 'TEMPLATE_LAYOUT','templateOLD','fonts','tests','webfonts'];
$output = 'arbo.txt';

$h = fopen($output, 'w');
function scan($dir, $exclude, $depth=0, $h) {
    $items = array_diff(scandir($dir), ['.', '..']);
    foreach ($items as $item) {
        $path = $dir . '/' . $item;
        if (is_dir($path) && !in_array($item, $exclude)) {
            fwrite($h, str_repeat('  ', $depth) . '📁 ' . $item . "\n");
            scan($path, $exclude, $depth+1, $h);
        } elseif (!is_dir($path)) {
            fwrite($h, str_repeat('  ', $depth) . '📄 ' . $item . "\n");
        }
    }
}

fwrite($h, "Arborescence du dossier : " . __DIR__ . "\n");
scan(__DIR__, $exclude, 0, $h);
fclose($h);

echo "Fichier '$output' créé !\n";
?>