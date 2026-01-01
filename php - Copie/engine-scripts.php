<?php
// engine-scripts.php - CATALOGUE COMPLET JS + CSS INTERNE (ORDRE CORRIGÉ)
?>

<script src="js/kchess/core/pieces.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/game-state.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/chess-board.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/fen-generator.js?version=<?= $version; ?>"></script>

<script src="js/kchess/check/checkChess.js?version=<?= $version; ?>"></script>
<script src="js/kchess/check/chess-status-unified.js?version=<?= $version; ?>"></script>
<script src="js/kchess/check/checkFenPostion.js?version=<?= $version; ?>"></script>
<script src="js/kchess/check/checkChessMat.js?version=<?= $version; ?>"></script>
<script src="js/kchess/check/checkChessPat.js?version=<?= $version; ?>"></script>
<script src="js/kchess/check/checkChessNulle.js?version=<?= $version; ?>"></script>

<script src="js/kchess/validators/move-pieces/move-validator-sliding.js?version=<?= $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-pawn.js?version=<?= $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-knight.js?version=<?= $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-bishop.js?version=<?= $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-rook.js?version=<?= $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-queen.js?version=<?= $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-king.js?version=<?= $version; ?>"></script>

<script src="js/kchess/validators/move-pieces/move-validator.js?version=<?= $version; ?>"></script>

<script src="js/kchess/validators/validator-interface.js?version=<?= $version; ?>"></script>
<script src="js/kchess/validators/move-executor.js?version=<?= $version; ?>"></script>
<script src="js/kchess/validators/special-moves-handler.js?version=<?= $version; ?>"></script>
<script src="js/kchess/validators/move-state-manager.js?version=<?= $version; ?>"></script>
<script src="js/kchess/validators/move-handler-core.js?version=<?= $version; ?>"></script>
<script src="js/kchess/validators/promotion-manager.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/move-logic.js?version=<?= $version; ?>"></script>

<script src="js/kchess/bots/Level_1.js?version=<?= $version; ?>"></script>
<script src="js/kchess/bots/Level_2.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/bot-manager.js?version=<?= $version; ?>"></script>

<script src="js/kchess/ui/chess-game-ui-styles.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-timer.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-modals.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-move-history.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-clipboard.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-core.js?version=<?= $version; ?>"></script>

<script src="js/kchess/core/game-status-manager.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/game-status-fix.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/chess-game-core.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/chess-game.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/chess-events.js?version=<?= $version; ?>"></script>
<script src="js/kchess/debug/device-logger.js?version=<?= $version; ?>"></script>

<?php if ($_SERVER['HTTP_HOST'] === 'localhost' || $_SERVER['HTTP_HOST'] === '127.0.0.1'): ?>
<script src="js/kchess/bots/bot-test-interface.js?version=<?= $version; ?>"></script>
<?php endif; ?>

<style id="game-status-fix-styles">
    @keyframes slideInFix { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .chess-notification-fix {
        position: fixed; top: 20px; right: 20px; padding: 12px 20px;
        color: white; border-radius: 8px; font-weight: bold; z-index: 10000;
        animation: slideInFix 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: sans-serif; background: #333;
    }
    .king-in-check { box-shadow: inset 0 0 15px red, 0 0 15px red !important; border: 2px solid #dc3545 !important; }
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 K-Chess Engine - Système prêt (v<?= $version; ?>)');
});
</script>