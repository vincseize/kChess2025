<?php
/**
 * engine-scripts.php - CATALOGUE COMPLET JS (ORDRE DE DÉPENDANCE STRICT)
 */
?>

<script src="js/kchess/core/pieces.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/game-state.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/board-position.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/chess-board.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/fen-generator.js?version=<?= $version; ?>"></script>

<script src="js/kchess/check/checkChess.js?version=<?= $version; ?>"></script>
<script src="js/kchess/check/checkFenPostion.js?version=<?= $version; ?>"></script>
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

<script src="js/kchess/ui/chess-game-ui-styles.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-timer.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-modals.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-move-history.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-clipboard.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-core.js?version=<?= $version; ?>"></script>

<script src="js/kchess/core/game-status-manager.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/chess-game-core.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/chess-game.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/bot-training-progress.js?version=<?= $version; ?>"></script>
<script src="js/kchess/ui/chess-events.js?version=<?= $version; ?>"></script>

<script src="js/kchess/bots/BotCore.js?version=<?= $version; ?>"></script>
<script src="js/kchess/core/bot-manager.js?version=<?= $version; ?>"></script>

<script src="js/kchess/debug/device-logger.js?version=<?= $version; ?>"></script>

<?php if ($_SERVER['HTTP_HOST'] === 'localhost' || $_SERVER['HTTP_HOST'] === '127.0.0.1'): ?>
<script src="js/kchess/bots/bot-test-interface.js?version=<?= $version; ?>"></script>
<?php endif; ?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 K-Chess Engine - Système prêt (v<?= $version; ?>)');
    // Vérification de l'alias BotBase créé par BotCore
    if (typeof BotBase !== 'undefined') {
        console.log('🤖 BotBase (via BotCore) : OK');
    } else {
        console.error('🤖 BotBase : MANQUANT. Vérifiez le chargement de js/kchess/bots/BotCore.js');
    }
});
</script>