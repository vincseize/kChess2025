<?php
// footer.php - VERSION FINALE OPTIMISÉE v1.0.4
// Ordre de chargement : CORE -> CHECK -> VALIDATORS -> BOTS -> FIX -> UI -> EVENTS
?>

<script src="js/kchess/core/pieces.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/game-state.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/chess-board.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/fen-generator.js?version=<?php echo $version; ?>"></script>

<script src="js/kchess/check/checkChess.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/check/chess-status-unified.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/check/checkFenPostion.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/check/checkChessMat.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/check/checkChessPat.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/check/checkChessNulle.js?version=<?php echo $version; ?>"></script>

<script src="js/kchess/validators/move-pieces/move-validator-pawn.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-knight.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-bishop.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-rook.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-queen.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-king.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-sliding.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator.js?version=<?php echo $version; ?>"></script>

<script src="js/kchess/bots/Level_1.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/bots/Level_2.js?version=<?php echo $version; ?>"></script>

<script src="js/kchess/debug/device-logger.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/validator-interface.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-executor.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/special-moves-handler.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-state-manager.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-handler-core.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/bot-manager.js?version=<?php echo $version; ?>"></script>

<script src="js/kchess/core/game-status-manager.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/game-status-fix.js?version=<?php echo $version; ?>"></script>

<script src="js/kchess/core/move-logic.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/chess-game-core.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/promotion-manager.js?version=<?php echo $version; ?>"></script>

<script src="js/kchess/core/chess-game.js?version=<?php echo $version; ?>"></script>

<script src="js/kchess/ui/chess-game-ui-styles.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-timer.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-modals.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-move-history.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-clipboard.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-core.js?version=<?php echo $version; ?>"></script>

<script src="js/kchess/ui/chess-events.js?version=<?php echo $version; ?>"></script>

<?php if ($_SERVER['HTTP_HOST'] === 'localhost' || $_SERVER['HTTP_HOST'] === '127.0.0.1'): ?>
<script src="js/kchess/bots/bot-test-interface.js?version=<?php echo $version; ?>"></script>
<?php endif; ?>

<style id="game-status-fix-styles">
    @keyframes slideInFix {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutFix {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .chess-notification-fix {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        color: white;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        animation: slideInFix 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: sans-serif;
    }
    .king-in-check {
        box-shadow: inset 0 0 15px red, 0 0 15px red !important;
        border: 2px solid #dc3545 !important;
    }
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 K-Chess Engine - Footer chargé');
    
    // Fonction de diagnostic rapide accessible en console
    window.checkSystem = function() {
        console.group('📊 Système K-Chess');
        console.log('Fix Appliqué:', window.GameStatusFix?.isApplied || 'Non');
        console.log('Manager:', !!window._gameStatusManager);
        console.log('Version Fix:', window.GameStatusFix?.VERSION);
        console.groupEnd();
    };

    setTimeout(() => {
        if (window.GameStatusFix) {
            console.log('🚀 GameStatusFix prêt. Tapez testCheckmateBug() pour vérifier.');
        }
    }, 2500);
});
</script>

</body>
</html>