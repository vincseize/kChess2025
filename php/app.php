<?php
// /php/app.php
session_start();

// 1. PROTECTION CACHE & CHARGEMENT CONFIG
header("Cache-Control: no-cache, no-store, must-revalidate"); 
header("Pragma: no-cache"); 
header("Expires: 0"); 

require_once __DIR__ . '/config-loader.php'; 
$config = loadGameConfig();
$version = getVersion();

// 2. LOGIQUE DE ROUTAGE
$isMobile = preg_match('/(android|iphone|ipad|ipod|blackberry|opera mini|windows phone|mobile)/i', $_SERVER['HTTP_USER_AGENT']);
$gameStarted = isset($_GET['mode']); 

if ($gameStarted) {
    $_SESSION['from_app'] = true;
}

if (isset($_GET['new'])) {
    unset($_SESSION['from_app']);
}
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($config['current_lang']); ?>">
<head>
<?php require_once __DIR__ . '/header.php'; // ★ fragment <head> uniquement ?>
    <style>
        :root { --padding-card: clamp(10px, 3vh, 25px); }
        html, body { height: 100%; margin: 0; padding: 0; background: #f8f9fa; overflow-x: hidden; }
        body { display: flex; flex-direction: column; }
        #gameSetupWrapper { flex: 1; display: flex; justify-content: center; align-items: center; width: 100%; padding: 20px 0; }
        .card-main-container { width: 95%; max-width: 500px; background: white; border-radius: 25px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); overflow: hidden; }

        #splash-screen {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            z-index: 1000000; transition: opacity 0.8s ease-out;
        }
    </style>
</head>
<body>

    <?php if (!$gameStarted): ?>
        <?php 
            $splashVersion = $config['splashscreen']['version'] ?? 0;
            $splashFile = 'splashscreens/splashscreen' . $splashVersion . '.php';
            if (file_exists(__DIR__ . '/' . $splashFile)) {
                require_once $splashFile;
            }
        ?>
        <div id="gameSetupWrapper">
            <div class="card-main-container">
                <div class="card-body-scroll" style="padding: var(--padding-card);">
                    <?php require_once 'newGame.php'; ?>
                </div>
            </div>
        </div>

    <?php else: ?>
        <?php 
            require_once ($isMobile ? 'content_mobile.php' : 'content.php');

            // Injection dynamique des scripts de Bot
            if ($_GET['mode'] === 'bot') {
                $requestedLevel = intval($_GET['level'] ?? 1);
                $botPath = "js/kchess/bots/Level_" . $requestedLevel . ".js";
                
                echo '<script src="js/kchess/bots/game_fonctions.js?v=' . $version . '"></script>';
                echo '<script src="js/kchess/bots/game_ouverture.js?v=' . $version . '"></script>';
                echo '<script src="js/kchess/bots/BotBase.js?v=' . $version . '"></script>';
                echo '<script src="js/kchess/bots/Evaluator.js?v=' . $version . '"></script>';
                echo '<script src="js/kchess/bots/SearchEngine.js?v=' . $version . '"></script>';
                if (file_exists(__DIR__ . "/" . $botPath)) {
                    echo '<script src="' . $botPath . '?v=' . $version . '"></script>';
                }
            }
        ?>

        <script src="js/kchess/core/pieces.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/core/game-state.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/core/board-position.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/core/chess-board.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/core/fen-generator.js?v=<?php echo $version; ?>"></script>

        <script src="js/kchess/check/checkChess.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/check/checkFenPostion.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/check/checkChessNulle.js?v=<?php echo $version; ?>"></script>

        <script src="js/kchess/validators/move-pieces/move-validator-sliding.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/validators/move-pieces/move-validator-pawn.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/validators/move-pieces/move-validator-knight.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/validators/move-pieces/move-validator-bishop.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/validators/move-pieces/move-validator-rook.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/validators/move-pieces/move-validator-queen.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/validators/move-pieces/move-validator-king.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/validators/move-pieces/move-validator.js?v=<?php echo $version; ?>"></script>

        <script src="js/kchess/validators/validator-interface.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/validators/move-executor.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/validators/special-moves-handler.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/validators/move-state-manager.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/validators/move-handler-core.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/validators/promotion-manager.js?v=<?php echo $version; ?>"></script>

        <script src="js/kchess/ui/chess-game-ui-styles.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/ui/chess-game-ui-timer.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/ui/chess-game-ui-modals.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/ui/chess-game-ui-move-history.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/ui/chess-game-ui-clipboard.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/ui/chess-game-ui-core.js?v=<?php echo $version; ?>"></script>

        <script src="js/kchess/core/game-status-manager.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/core/chess-game-core.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/core/chess-game.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/ui/bot-training-progress.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/ui/chess-events.js?v=<?php echo $version; ?>"></script>

        <script src="js/kchess/bots/BotCore.js?v=<?php echo $version; ?>"></script>
        <script src="js/kchess/core/bot-manager.js?v=<?php echo $version; ?>"></script>

        <script src="js/kchess/debug/device-logger.js?v=<?php echo $version; ?>"></script>

        <script src="js/kchess/bots/bot-test-interface.js?v=<?php echo $version; ?>"></script>

        <script>
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🎮 K-Chess Engine - Système prêt');
            if (typeof BotBase !== 'undefined') {
                console.log('🤖 BotBase (via BotCore) : OK');
            } else {
                console.error('🤖 BotBase : MANQUANT. Vérifiez js/kchess/bots/BotCore.js');
            }
        });
        </script>
    <?php endif; ?>

    <script>
        if ('serviceWorker' in navigator) { 
            navigator.serviceWorker.register('sw.js').catch(e => console.error('SW error:', e)); 
        }

        window.addEventListener('load', function() {
            const splash = document.getElementById('splash-screen');
            if (splash) {
                const displayTime = <?php echo $config['splashscreen']['display_time'] ?? 1500; ?>;
                setTimeout(() => {
                    splash.style.opacity = '0';
                    setTimeout(() => splash.remove(), 800);
                }, displayTime);
            }
        });
    </script>
</body>
</html>