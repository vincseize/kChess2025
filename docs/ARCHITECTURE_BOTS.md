# Architecture des bots — CharlyChess

**Date :** 4 novembre 2026 

## Portée : Architecture des bots, ordre de chargement, moteurs d'évaluation et de recherche.
Ce document décrit l'architecture du système de bots. Il complète :

`AUDIT_BOTS.md` — Résultats mesurés des confrontations.
`BOTS_DECISION_FLOWS.md` — Fonctionnement détaillé de chaque niveau.
> ⚠️ **Note de version** : `BOTS_DECISION_FLOWS.md` documente encore l'implémentation **avant refactor** de Level 16 (scoring inline dans le bot). Après application des fichiers v6.0.0, la section Level 16 de ce document devra être mise à jour — voir § 6 « Migration en cours ».
---
1. Vue d'ensemble
Le système repose sur quatre blocs aux responsabilités strictement séparées :
```
┌──────────────────────────┐
│     MOTEUR DE RÈGLES     │
│   • BoardPosition        │
│   • MoveValidator        │
│   • GameState            │
│   • FENGenerator         │
└────────────┬─────────────┘
             │ utilisé par
             ▼
┌──────────────────────────┐
│   UTILITAIRES PARTAGÉS   │
│   • GameFonctions        │
│   • GameOuverture        │
└────────────┬─────────────┘
             │ utilisé par
             ▼
┌──────────────────────────┐     ┌──────────────────────────┐
│   MOTEUR D'ÉVALUATION    │     │    MOTEUR DE RECHERCHE   │
│   Evaluator.js           │◄────┤    SearchEngine.js       │
│   • scorePosition()      │     │    • findBestMove()      │
│   • scoreMove()          │     │    (pipeline ECMO)       │
│   • captureBaseline()    │     │                          │
└──────────────────────────┘     └────────────┬─────────────┘
                                              │ utilisé par
                                              ▼
                                 ┌──────────────────────────┐
                                 │    NIVEAUX (profils)     │
                                 │    • Level_16 v6.0.0     │
                                 │    • Level_17, 18, ...   │
                                 │    (configuration seule) │
                                 └──────────────────────────┘
```
Principe directeur
Le moteur de règles est la seule source de vérité sur l'échiquier (coups légaux, état, FEN).
Les utilitaires partagés encapsulent les opérations répétitives (lecture de pièce, simulation de coup, évaluation d'échange, structure de pions).
Le moteur d'évaluation (`Evaluator`) ne fait que du scoring : aucune boucle, aucun parcours d'arbre, aucune simulation en cascade.
Le moteur de recherche (`SearchEngine`) orchestre la pipeline de décision : ouverture, mat en 1, évaluation depth-1, mat en 2, finale.
Les niveaux sont des profils de configuration : ils instancient un `Evaluator` avec certaines pondérations et un `SearchEngine` avec certaines options. La logique n'est plus dans le fichier du niveau.
---
2. Ordre de chargement des scripts
L'ordre est strict : chaque fichier dépend du précédent.
2.1 Mode bot (`?mode=bot&level=16`)
```
Phase 1 — engine-scripts.php (chargé depuis header.php)
┌──────────────────────────────────────────────────────────────┐
│ js/kchess/core/pieces.js                                     │
│ js/kchess/core/game-state.js                                 │
│ js/kchess/core/board-position.js                             │
│ js/kchess/core/chess-board.js                                │
│ js/kchess/core/fen-generator.js                              │
│ js/kchess/check/checkChess.js                                │
│ js/kchess/check/checkFenPostion.js                           │
│ js/kchess/check/checkChessNulle.js                           │
│ js/kchess/validators/move-pieces/*.js                        │
│ js/kchess/validators/*.js                                    │
│ js/kchess/ui/chess-game-ui-*.js                              │
│ js/kchess/core/game-status-manager.js                        │
│ js/kchess/core/chess-game-core.js                            │
│ js/kchess/core/chess-game.js                                 │
│ js/kchess/ui/bot-training-progress.js                        │
│ js/kchess/ui/chess-events.js                                │
│ js/kchess/bots/BotCore.js ← définit window.BotBase          │
│ js/kchess/core/bot-manager.js                                │
│ js/kchess/debug/device-logger.js                             │
└──────────────────────────────────────────────────────────────┘

Phase 2 — app.php (bloc mode bot)
┌──────────────────────────────────────────────────────────────┐
│ js/kchess/bots/game_fonctions.js                             │
│ js/kchess/bots/game_ouverture.js                             │
│ js/kchess/bots/BotBase.js ← ⚠️ écrase window.BotBase         │
│ js/kchess/bots/Evaluator.js ← NOUVEAU (v6.0.0)               │
│ js/kchess/bots/SearchEngine.js ← NOUVEAU (v6.0.0)              │
│ js/kchess/bots/Level_16.js                                   │
└──────────────────────────────────────────────────────────────┘
```
2.2 Mode arène (`Bot_vs_Bot.php`)
```
Phase 1 — engine-scripts.php (include + réécriture chemins)
┌──────────────────────────────────────────────────────────────┐
│ ... identique à Phase 1 du mode bot ...                      │
└──────────────────────────────────────────────────────────────┘

Phase 2 — Scripts bots spécifiques à l'arène
┌──────────────────────────────────────────────────────────────┐
│ ../game_fonctions.js                                         │
│ ../game_ouverture.js                                         │
│ ../BoardAnalyzer.js                                          │
│ ../BotCore.js (réécrase = no-op)                             │
│ ../Evaluator.js ← NOUVEAU                                    │
│ ../SearchEngine.js ← NOUVEAU                                 │
│ ../Level_1.js ... ../Level_16.js                             │
└──────────────────────────────────────────────────────────────┘

Phase 3 — Scripts arène
┌──────────────────────────────────────────────────────────────┐
│ js/ArenaAnalyst.js                                           │
│ js/stress-test-bot.js                                        │
└──────────────────────────────────────────────────────────────┘
```
---
3. Rôles et responsabilités
3.1 `GameFonctions` — utilitaires partagés
Fichier : `php/js/kchess/bots/game_fonctions.js`
Méthode	Rôle
`attach(bot)`	Mixin : ajoute les méthodes au bot et retourne l'instance
`getPiece(game, row, col)`	Lecture compatible multi-représentation
`getAllLegalMoves(game, color)`	Énumération des coups légaux avec détails
`simulateMove(game, move)`	Retourne une copie de la position après le coup
`isSquareAttacked(game, row, col, byColor)`	Test de contrôle de case
`findKing(game, color)`	Localisation du roi
`getMaterialBalance`, `getDoubledPawnCount`, `getPawnIslandCount`, `getConnectedPawnPairCount`, `getDoubledRookFileCount`, `getMajorPieceFileScore`, `getAdvancedMajorPieceRankCount`, `getCenterControlScore`	Heuristiques structurelles
`evaluateExchange`, `evaluateMoveExposure`, `bestExchange`	Évaluation d'échange avec reprises récursives
`getFavorableTradeBonus`, `getSafeKnightForkBonus`	Bonus tactiques
`isPromotionMove`, `finalize`	Utilitaires
Ne fait pas : de recherche, de sélection de coup, de décision. C'est une boîte à outils.
3.2 `GameOuverture` — livre d'ouverture
Fichier : `php/js/kchess/bots/game_ouverture.js`
Objet immuable (`Object.freeze`) contenant deux lignes classiques :
Gambit Dame refusé (6 demi-coups)
Partie espagnole (6 demi-coups)
Format : `{ nom, coups: [{ couleur, depart, arrivee, notation }] }` avec cases en notation algébrique (`'d2'`, `'d5'`...).
Ne fait rien tout seul : doit être consommé par un `SearchEngine` via `_tryOpeningMove`.
3.3 `Evaluator` — moteur d'évaluation
Fichier : `php/js/kchess/bots/Evaluator.js` — version 1.0.0
Responsabilité unique : transformer une position (ou un coup) en score numérique.
Méthode	Entrée	Sortie
`scorePosition(game, color)`	Position statique	Score en centipawns
`scoreMove(game, move, color, baseline, exposure)`	Position avant + coup	Delta de score
`captureBaseline(game, color)`	Position	Objet de référence pour les deltas
Paramétrage :
`pieceValues` — valeur de chaque pièce (`pawn: 100`, `knight: 320`, ...)
`weights` — pondération de chaque heuristique (`centerControl`, `doubledPawns`, `capture`, `exposure`, ...)
Ne fait pas : aucune boucle de recherche, aucun parcours d'arbre, aucune simulation en cascade, aucune décision. Si tu changes les `weights`, tu changes le style du bot, pas son algorithme.
3.4 `SearchEngine` — moteur de recherche
Fichier : `php/js/kchess/bots/SearchEngine.js` — version 1.0.0
Responsabilité unique : orchestrer la pipeline de décision.
```
findBestMove(game)
│
├─ 0. Ouverture (si enableOpening et GameOuverture chargé)
│
├─ 1. Mat en 1 (si enableMateInOne)
│
├─ 2. Évaluation depth-1 (ECMO)
│  ├─ Baseline (structure avant)
│  ├─ Pour chaque coup : simulate + evaluate.scoreMove()
│  └─ Pénalité réponse adverse (limitée à maxOppReplies)
│
├─ 3. Mat en 2 (si enableMateInTwo) — élagué sur coups d'échec
│
├─ 4. Promotions prioritaires
│
├─ 5. Comportement de finale (si enableEndgame)
│
└─ 6. Sélection finale
```
Paramétrage :
`enableOpening`, `enableMateInOne`, `enableMateInTwo`, `enableEndgame` — flags booléens
`maxOppReplies` — nombre max de réponses adverses examinées (défaut : 10)
`mateInTwoMaxCandidates` — nombre max de coups d'échec testés pour le mat en 2 (défaut : 12)
Ne fait pas : d'évaluation elle-même. Elle est déléguée à `Evaluator`. Si tu changes les options, tu changes la profondeur ou le comportement du bot, pas son scoring.
3.5 `Level_16` — profil de configuration
Fichier : `php/js/kchess/bots/Level_16.js` — version 6.0.0
Responsabilité unique : instancier `Evaluator` et `SearchEngine` avec les bons paramètres.
```js
class Level_16 {
    constructor() {
        this.gameFonctions = GameFonctions.attach(this);
        this.evaluator = new Evaluator({ pieceValues, weights, gameFonctions });
        this.search = new SearchEngine(this.evaluator, this.gameFonctions, {
            enableOpening: true,
            enableMateInOne: true,
            enableMateInTwo: false,
            enableEndgame: true,
            maxOppReplies: 10
        });
    }
    async getMove() {
        return this.search.findBestMove(window.chessGame?.core || window.chessGame);
    }
}
```