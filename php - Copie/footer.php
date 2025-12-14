<?php
// footer.php
?>
<!-- footer.php -->

<!-- Charge la config JSON AVANT tout -->
<script>
window.appConfig = <?php echo json_encode($configJSON ?? []); ?>;
</script>

<!-- Charge la langue active AVANT tous les modules JS -->
<script>
window.appTranslations = {};

(function() {
    const lang = window.appConfig?.default_lang || 'fr';

    // Vérification console (pas d'alert)
    console.log("Langue chargée :", lang);

    // Récupération directe depuis le JSON déjà chargé par PHP
    if (window.appConfig?.lang?.[lang]) {
        window.appTranslations = window.appConfig.lang[lang];
        console.log("Traductions chargées :", window.appTranslations);
    } else {
        console.warn("Langue non trouvée dans le fichier JSON.");
        window.appTranslations = {};
    }
})();
</script>

<!-- Scripts CORE -->
<script src="js/kchess/core/pieces.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/game-state.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/chess-board.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/fen-generator.js?version=<?php echo $version; ?>"></script>

<!-- Check Chess - BASE -->
<script src="js/kchess/check/checkChess.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/check/checkFenPostion.js?version=<?php echo $version; ?>"></script>

<!-- Validateurs de mouvements -->
<script src="js/kchess/validators/move-pieces/move-validator-pawn.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-knight.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-bishop.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-rook.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-queen.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-king.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator-sliding.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-pieces/move-validator.js?version=<?php echo $version; ?>"></script>

<!-- BOTS -->
<script src="js/kchess/bots/Level_1.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/bots/Level_2.js?version=<?php echo $version; ?>"></script>

<!-- Check Chess Mat - AVANCÉ -->
<script src="js/kchess/check/checkChessMat.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/check/checkChessPat.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/check/checkChessNulle.js?version=<?php echo $version; ?>"></script>

<!-- ========== ORDRE CRITIQUE POUR MOBILE ========== -->

<!-- 1. Logger -->
<script src="js/kchess/debug/device-logger.js?version=<?php echo $version; ?>"></script>

<!-- 2. Move handlers -->
<script src="js/kchess/validators/validator-interface.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-executor.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/special-moves-handler.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-state-manager.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/validators/move-handler-core.js?version=<?php echo $version; ?>"></script>

<!-- 3. Game core -->
<script src="js/kchess/core/bot-manager.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/game-status-manager.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/move-logic.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/core/chess-game-core.js?version=<?php echo $version; ?>"></script>

<!-- 4. Promotion -->
<script src="js/kchess/validators/promotion-manager.js?version=<?php echo $version; ?>"></script>

<!-- 5. Game -->
<script src="js/kchess/core/chess-game.js?version=<?php echo $version; ?>"></script>

<!-- 6. UI -->
<script src="js/kchess/ui/chess-game-ui-styles.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-timer.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-modals.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-move-history.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-clipboard.js?version=<?php echo $version; ?>"></script>
<script src="js/kchess/ui/chess-game-ui-core.js?version=<?php echo $version; ?>"></script>

<!-- 7. Events -->
<script src="js/kchess/ui/chess-events.js?version=<?php echo $version; ?>"></script>

<!-- Interface de test bot (dev seulement) -->
<?php if ($_SERVER['HTTP_HOST'] === 'localhost' || $_SERVER['HTTP_HOST'] === '127.0.0.1'): ?>
<script src="js/kchess/bots/bot-test-interface.js?version=<?php echo $version; ?>"></script>
<?php endif; ?>

</body>
</html>
