# Audit des bots d'échecs

**Date :** 3 novembre 2026  
**Périmètre :** bots `Level_1`, `Level_2`, `Level_3`, `Level_4`, `Level_5`, `Level_6` et `Level_16`, ainsi que les confrontations entre niveaux voisins disponibles.

## Résumé

Une campagne de **6 000 parties** a comparé chaque niveau disponible au niveau inférieur le plus proche : 1 000 parties par confrontation, avec les couleurs équilibrées. Aucune erreur de simulation n'a été comptabilisée.

Les résultats ne montrent **pas une progression régulière** des niveaux. Le niveau 6 perd plus de parties qu'il n'en gagne contre le niveau 5. Le niveau 16 perd nettement contre le niveau 6. Les parties nulles représentent **86,4 %** de l'ensemble : ce taux élevé, notamment en raison des limites de durée, réduit la capacité de ces confrontations à départager les bots.

> Ces résultats mesurent les performances dans le protocole décrit ci-dessous. Ils ne constituent ni un classement Elo ni une preuve qu'un bot est toujours supérieur à un autre.

## Résultats des confrontations

Les pourcentages de victoire sont calculés sur les **1 000 parties** de chaque confrontation, nulles comprises. La dernière colonne indique la part des victoires du niveau supérieur parmi les seules parties décisives.

| Confrontation | Victoires du niveau supérieur | Victoires du niveau inférieur | Nulles | Niveau supérieur parmi les parties décisives |
|---|---:|---:|---:|---:|
| Niveau 2 contre niveau 1 | 71 (7,1 %) | 0 (0,0 %) | 929 (92,9 %) | 100,0 % |
| Niveau 3 contre niveau 2 | 38 (3,8 %) | 3 (0,3 %) | 959 (95,9 %) | 92,7 % |
| Niveau 4 contre niveau 3 | 90 (9,0 %) | 71 (7,1 %) | 839 (83,9 %) | 55,9 % |
| Niveau 5 contre niveau 4 | 106 (10,6 %) | 39 (3,9 %) | 855 (85,5 %) | 73,1 % |
| Niveau 6 contre niveau 5 | 49 (4,9 %) | 78 (7,8 %) | 873 (87,3 %) | 38,6 % |
| Niveau 16 contre niveau 6 | 11 (1,1 %) | 261 (26,1 %) | 728 (72,8 %) | 4,0 % |

### Détail des nulles

| Confrontation | Pat | Règle des 50 coups | Matériel insuffisant | Limite de 200 demi-coups | Total nulles |
|---|---:|---:|---:|---:|---:|
| Niveau 2 contre niveau 1 | 350 | 39 | 0 | 540 | 929 |
| Niveau 3 contre niveau 2 | 15 | 592 | 221 | 131 | 959 |
| Niveau 4 contre niveau 3 | 68 | 170 | 575 | 26 | 839 |
| Niveau 5 contre niveau 4 | 221 | 65 | 542 | 27 | 855 |
| Niveau 6 contre niveau 5 | 241 | 15 | 595 | 22 | 873 |
| Niveau 16 contre niveau 6 | 498 | 40 | 124 | 66 | 728 |
| **Total** | **1 393** | **921** | **2 057** | **812** | **5 183** |

## Protocole de test

- Position de départ standard.
- 1 000 parties par confrontation, avec **500 parties où chaque bot joue les Blancs et 500 où il joue les Noirs**.
- Les niveaux disponibles sont 1, 2, 3, 4, 5, 6 et 16. Le niveau 16 a donc été comparé au niveau 6 ; il n'existe pas de niveaux 7 à 15 dans le périmètre de ce test.
- Les coups proposés sont contrôlés par le validateur de coups légaux avant leur exécution.
- Les promotions sont faites en dame.
- Les fins de partie prises en compte sont le mat, le pat, la règle des 50 coups, le matériel insuffisant et la limite de 200 demi-coups.
- La répétition triple n'est pas prise en compte par ce protocole.
- Les détails de chaque partie ne sont pas envoyés dans la console. Les erreurs, si elles se produisent, sont comptabilisées séparément.

Les bots comportent des choix aléatoires (`Math.random`). Les parties d'une campagne ne sont donc pas reproductibles à l'identique avec les mêmes paramètres : le générateur aléatoire n'est pas initialisé avec une graine fixe.

## Lecture des résultats

### Une échelle de niveaux à revoir

- Les niveaux 2 à 5 battent plus souvent leur adversaire inférieur dans ces échantillons, mais les nombreux matchs nuls et l'écart limité entre les niveaux 3 et 2 rendent la hiérarchie peu nette.
- Le niveau 6 perd **49 à 78** contre le niveau 5. Son bonus de contrôle du centre ne se traduit donc pas, dans ce test, par une force supérieure.
- Le niveau 16 perd **11 à 261** contre le niveau 6. Son numéro élevé et son nom « Killer » ne correspondent pas à sa performance mesurée.

### Des noms et stratégies qui peuvent induire en erreur

La lecture du code montre que les bots s'appuient principalement sur des heuristiques de choix de coups : captures, sécurité des pièces, progression des pions, proximité du roi ou contrôle du centre. Le niveau 4 est nommé « Minimax », mais son implémentation observée évalue et trie les coups disponibles ; elle ne réalise pas une recherche minimax de plusieurs demi-coups. Il vaut mieux ne pas interpréter les noms ou numéros comme une garantie de force.

Les niveaux 2 à 6 répètent aussi une partie du travail de génération des coups et d'évaluation des cases attaquées. Cette logique dupliquée complique la comparaison et la maintenance : une évolution commune des règles peut être appliquée différemment selon le bot.

## Nouveau test Level 3 contre Level 2 après ajustement

**Date :** 4 novembre 2026  
**Modification testée :** Level 3 évite les pions a et h au premier coup de chaque couleur et son bonus d'attaque du roi vérifie la géométrie des pièces et les cases intermédiaires des pièces glissantes.

| Confrontation | Victoires Level 3 | Victoires Level 2 | Nulles | Score Level 3 |
|---|---:|---:|---:|---:|
| Level 3 contre Level 2, 500 parties | 21 (4,2 %) | 1 (0,2 %) | 478 (95,6 %) | 52,0 % |

Score calculé selon la convention échecs : victoire = 1, nulle = 0,5, défaite = 0. Parmi les 22 parties décisives, Level 3 en gagne 21 (95,5 %).

| Résultat des parties nulles | Nombre |
|---|---:|
| Pat | 8 |
| Règle des 50 coups | 369 |
| Matériel insuffisant | 24 |
| Limite de 200 demi-coups | 77 |
| **Total** | **478** |

- Les couleurs ont été équilibrées : chaque bot a joué 250 fois les Blancs et 250 fois les Noirs.
- Les 22 parties décisives se sont terminées par mat ; aucune erreur de simulation n'a été comptabilisée.
- Les 500 parties ont totalisé 96 055 demi-coups, soit 192,1 par partie en moyenne.
- Les détails des parties n'ont pas été affichés ; la console de progression ne donnait que le compteur de parties.

### Interprétation

La campagne précédente de 1 000 parties donnait à Level 3 un score de 51,75 % contre Level 2 (38 victoires, 3 défaites et 959 nulles). Le nouveau résultat de 52,0 % ne représente qu'une différence de **0,25 point de pourcentage**. Avec 95,6 % de nulles et seulement 22 parties décisives, ce test ne permet pas de conclure que Level 3 s'est réellement amélioré. La restriction des pions de bord est respectée, mais son apport en force de jeu n'est pas démontré. Il faudrait des campagnes répétées et idéalement des positions de départ variées pour isoler l'effet de l'ajustement.

## Level 3 avec recherche de la réponse adverse

**Modification testée :** présélection des huit coups les mieux notés, simulation de chaque candidat sur une position indépendante, puis choix selon la pire réponse légale de Level 2. L'évaluation regarde le matériel, les pièces attaquées sans défense, le centre et la sécurité des rois. La recherche est limitée à deux demi-coups.

| Confrontation | Victoires Level 3 | Victoires Level 2 | Nulles | Score Level 3 |
|---|---:|---:|---:|---:|
| Level 3 contre Level 2, 200 parties | 8 (4,0 %) | 1 (0,5 %) | 191 (95,5 %) | 51,75 % |

Score échiquéen : victoire = 1, nulle = 0,5, défaite = 0. Les couleurs ont été équilibrées (100 parties par bot avec les Blancs et 100 avec les Noirs). Les 200 parties se sont terminées sans erreur de simulation et ont totalisé 38 386 demi-coups. Les 191 nulles se répartissent en 188 parties arrêtées à la limite de 200 demi-coups et 3 pats.

**Conclusion : l'objectif de 60 % n'est pas atteint.** Le score de 51,75 % est inférieur de 0,25 point au test de référence de 500 parties (52,0 %) et identique au test antérieur de 1 000 parties. Avec 95,5 % de nulles, cette campagne de 200 parties ne démontre ni progrès ni recul significatif. La recherche fonctionne techniquement, mais son apport en force de jeu n'est pas établi.

## Recommandations

1. **Ne pas présenter les numéros comme un classement de force garanti.** Renommer ou réordonner les bots après des mesures répétées.
2. **Ajouter un protocole reproductible**, avec une graine aléatoire enregistrée, et répéter les campagnes pour vérifier que les écarts se maintiennent.
3. **Réduire les nulles artificielles** en documentant la limite de coups, en étudiant les parties arrêtées à cette limite et en prenant en charge la répétition si le moteur le permet.
4. **Évaluer les bots sur plusieurs positions de départ**, des positions tactiques ciblées et des positions de finale, en complément des parties complètes.
5. **Mutualiser les fonctions communes** (coups légaux, évaluation des captures et de la sécurité, critères de fin) afin que les niveaux ne divergent pas sur des détails techniques.
6. **Aligner les noms avec le comportement réel.** Réserver, par exemple, « Minimax » à un bot qui effectue effectivement une recherche minimax.

## Fichier de test

La campagne a utilisé l'arène de test [`Bot_vs_Bot.php`](../php/js/kchess/bots/unitTests/Bot_vs_Bot.php) et son simulateur [`stress-test-bot.js`](../php/js/kchess/bots/unitTests/js/stress-test-bot.js). Le simulateur vérifie maintenant qu'un bot propose un coup légal et signale les coups absents, invalides ou dont l'exécution échoue, plutôt que de les remplacer par un coup aléatoire.
