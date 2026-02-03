<?php
/**
 * Project Flow Mapper - Analyse la hiérarchie d'exécution
 */

$rootFiles = ['index.php', 'app.php']; // Tes points d'entrée
$projectDir = __DIR__;

$flow = [
    'hierarchy' => [],
    'unmapped' => []
];

/**
 * Analyse récursive des dépendances
 */
function traceDependencies($fileName, $projectDir, &$visited = []) {
    if (in_array($fileName, $visited) || !file_exists($projectDir . '/' . $fileName)) return null;
    $visited[] = $fileName;

    $content = file_get_contents($projectDir . '/' . $fileName);
    $node = [
        'name' => $fileName,
        'children' => []
    ];

    // 1. Détecter les include/require PHP
    if (preg_match_all('/(?:include|require)(?:_once)?\s*[\'"](.+?\.php)[\'"]/', $content, $matches)) {
        foreach ($matches[1] as $include) {
            $child = traceDependencies($include, $projectDir, $visited);
            if ($child) $node['children'][] = $child;
        }
    }

    // 2. Détecter les balises <script src="..."> (JS)
    if (preg_match_all('/<script.+?src=["\'](.+?\.js)["\']/', $content, $matches)) {
        foreach ($matches[1] as $jsFile) {
            // Nettoyage du chemin si paramètres (ex: script.js?v=1)
            $jsFile = explode('?', $jsFile)[0];
            // On tente de trouver le fichier localement
            $cleanJsPath = ltrim(str_replace(['./', '../'], '', $jsFile), '/');
            
            // On scanne les classes à l'intérieur du JS
            $classes = [];
            if (file_exists($projectDir . '/' . $cleanJsPath)) {
                $jsContent = file_get_contents($projectDir . '/' . $cleanJsPath);
                if (preg_match_all('/class\s+([a-zA-Z0-9_]+)/', $jsContent, $classMatches)) {
                    $classes = $classMatches[1];
                }
            }

            $node['children'][] = [
                'name' => $jsFile,
                'type' => 'javascript',
                'classes' => $classes
            ];
        }
    }

    return $node;
}

// Lancement sur les fichiers racines
foreach ($rootFiles as $root) {
    $res = traceDependencies($root, $projectDir);
    if ($res) $flow['hierarchy'][] = $res;
}

// --- AFFICHAGE SOUS FORME DE DIAGRAMME TEXTUEL ---
echo "<html><body style='font-family:monospace; background:#1e1e1e; color:#d4d4d4; padding:20px;'>";
echo "<h1>🗺️ Project Execution Flow Map</h1>";

function renderTree($node, $indent = 0) {
    $spacing = str_repeat("&nbsp;", $indent * 4);
    $icon = isset($node['type']) && $node['type'] == 'javascript' ? "📜" : "🏠";
    
    echo "<div>" . $spacing . $icon . " " . $node['name'];
    if (!empty($node['classes'])) {
        echo " <span style='color:#ce9178;'>{Classes: " . implode(', ', $node['classes']) . "}</span>";
    }
    echo "</div>";

    if (!empty($node['children'])) {
        foreach ($node['children'] as $child) {
            renderTree($child, $indent + 1);
        }
    }
}

foreach ($flow['hierarchy'] as $rootNode) {
    renderTree($rootNode);
}
echo "</body></html>";