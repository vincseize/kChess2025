# Schémas de décision des bots

Ce document décrit **le comportement actuellement implémenté** par chaque bot disponible. Il sert de base lisible pour discuter des écarts de niveau avant toute modification des stratégies.

Les schémas sont volontairement simplifiés : tous les niveaux s'appuient sur les coups légaux fournis par le moteur, puis appliquent leurs propres critères de sélection. Les numéros de niveau et les noms affichés ne garantissent pas, à eux seuls, une force de jeu croissante.

## Niveau 1 — choix aléatoire

Fichier : [`Level_1.js`](../php/js/kchess/bots/Level_1.js)

```text
Récupérer la partie et le joueur au trait
        |
Demander à BotBase la liste des coups légaux
        |
  Des coups disponibles ?
      /       \
    non        oui
    |           |
retourner     choisir un coup
  null        au hasard
                  |
          promouvoir en dame
          si le pion arrive
          sur la dernière rangée
                  |
             retourner
              le coup
```

Le niveau 1 ne cherche pas à gagner du matériel ni à protéger ses pièces : chaque coup légal a la même chance d'être choisi.

## Niveau 2 — captures, sécurité, centre

Fichier : [`Level_2.js`](../php/js/kchess/bots/Level_2.js)

```text
Lister les coups légaux
        |
Y a-t-il des captures ?
     /          \
   oui           non
    |             |
Trier par       Chercher les coups
valeur de       qui ne finissent pas
la pièce prise  sur une case attaquée
    |             |
Tester jusqu'à       |
3 captures,          |
par ordre de valeur  |
    |             |
Une capture évite une attaque adverse,
ou prend une pièce au moins aussi chère
que la pièce déplacée ?
       /       \
     oui        non
      |           |
retourner        |
la capture       |
       \         /
        Aucun choix retenu
                 |
       Y a-t-il des coups sûrs ?
          /              \
        oui               non
         |                 |
Privilégier les cases      Choisir au hasard
centrales parmi ces coups  parmi tous les coups
sinon choisir un coup sûr  légaux (repli)
au hasard
```

Si une erreur survient pendant le calcul, le bot retourne `null`. Il n'effectue pas de recherche de coups futurs.

## Niveau 3 — heuristique tactique pondérée

Fichier : [`Level_3.js`](../php/js/kchess/bots/Level_3.js)

```text
Lister les coups légaux
        |
Au premier coup de cette couleur ?
        |
Écarter les pions des colonnes a et h,
si d'autres coups légaux restent disponibles
        |
Pour chaque coup, calculer un score :
  + gain net des échanges (prises et reprises légales),
    progression des pions, promotion,
    centre, développement et petite part aléatoire
        |
Bonus de préclassement si le coup attaque le roi adverse
Garder jusqu'aux 8 meilleurs coups préclassés
        |
Simuler chaque candidat sur une position copiée
avec son propre validateur
        |
Énumérer toutes les réponses légales adverses
        |
Pour chaque réponse, réévaluer matériel,
sécurité des rois et position ; corriger les prises
selon les reprises légales sur la case d'échange
        |
Retenir pour chaque candidat sa pire réponse
(mat adverse = victoire immédiate)
        |
Choisir le meilleur résultat minimax à 2 demi-coups
```

Au premier coup propre aux Blancs et aux Noirs, le niveau 3 évite les pions a et h si d'autres coups légaux sont disponibles. L'évaluation d'échange suit les prises successives sur la case visée, chaque camp pouvant s'arrêter plutôt que reprendre ; elle est plafonnée à huit reprises. La recherche générale reste limitée aux huit meilleurs candidats préclassés et à une réponse adverse ; elle ne constitue pas une recherche tactique profonde.

## Niveau 4 — score heuristique et choix parmi les proches

Fichier : [`Level_4.js`](../php/js/kchess/bots/Level_4.js)

```text
Lister les coups légaux
        |
Au premier coup de cette couleur ?
        |
Écarter les pions des colonnes a et h,
si d'autres coups légaux restent disponibles
        |
Pour chaque coup, calculer un score :
  + gain net de la capture après les reprises légales
    (× 20)
  - perte estimée des pièces après simulation du coup
    et des prises/reprises adverses (× 10)
  + proximité du roi adverse
  + progression du pion
  + forte priorité à la promotion
  + bonus si le validateur indique un échec
  + bonus pour le petit roque légal
        |
Trier les coups par score
        |
Garder les coups dans le seuil relatif
du meilleur score (90 % si le meilleur est positif)
        |
Choisir au hasard parmi les candidats
```

Malgré le nom affiché « Minimax », ce fichier n'effectue pas de recherche minimax à plusieurs demi-coups : il classe les coups de la position actuelle.
L'évaluation des échanges suit les prises successives sur la case visée, chaque camp pouvant s'arrêter plutôt que reprendre ; elle est plafonnée à huit reprises. Pour les coups non capturants, la même simulation estime le gain adverse d'une prise de la pièce déplacée.
La règle d'ouverture s'applique séparément au premier coup des Blancs et au premier coup des Noirs.

## Niveau 5 — heuristique avec priorité à l'attaque du roi

Fichier : [`Level_5.js`](../php/js/kchess/bots/Level_5.js)

```text
Lister les coups légaux
        |
Pour chaque coup, calculer un score :
  + capture (valeur prise × 20)
  - perte estimée après simulation du coup
    et des prises/reprises adverses (× 12)
  + proximité du roi adverse
  + roi adverse poussé vers le bord
  + progression du pion et promotion
  + bonus si le coup donne échec
  + bonus pour le petit roque légal
  - pénalité de proximité du roi adverse
    pour certains coups sans échec
        |
Trier les coups par score
        |
Garder les coups dans un seuil plus large
(75 % du meilleur score positif)
        |
Choisir au hasard parmi les candidats
```

Le bonus qui dépend seulement de la position actuelle du roi adverse est identique pour tous les coups d'une même position : à lui seul, il ne change donc pas leur ordre relatif.
La sécurité est évaluée sur une position copiée après chaque coup candidat ; le validateur y recherche les prises légales adverses, puis les reprises possibles, jusqu'à huit échanges.

## Niveau 6 — niveau 5 avec préférence centrale

Fichier : [`Level_6.js`](../php/js/kchess/bots/Level_6.js)

```text
Calculer les critères tactiques du niveau 5
        |
Ajouter un bonus pour le petit roque légal
        |
Pour chaque coup, ajouter :
valeur centrale de la case d'arrivée
    moins
valeur centrale de la case de départ
        |
La valeur dépend du type de pièce
et de la distance aux quatre cases centrales
        |
Trier les coups par score
        |
Garder les coups dans le seuil de 75 %
        |
Choisir au hasard parmi les candidats
```

Le bonus mesure l'occupation ou le rapprochement du centre. Le niveau 6 n'effectue pas de recherche plus profonde que le niveau 5. Il évalue lui aussi les pièces exposées après simulation, avec les prises et reprises légales jusqu'à huit échanges.

## Niveau 16 — mat immédiat, score, puis règles de finale

Fichier : [`Level_16.js`](../php/js/kchess/bots/Level_16.js)

```text
Lister les coups légaux
        |
Existe-t-il un mat en un coup ?
      /             \
    oui              non
     |                |
jouer le mat    Évaluer chaque coup :
                 + captures
                 + promotion
                 + échec
                 + centre et développement
                 + bonus pour le petit roque légal
                 - perte estimée après simulation
                   et prises/reprises adverses
                 + sauver une pièce attaquée
                        |
               Position de finale ?
                        |
         Un coup évalué donne échec ?
                -> peut devenir
                   le choix immédiat
                        |
          En finale, existe-t-il un coup de pion ?
                    /             \
                  oui              non
                   |                |
          choisir les pions les   Existe-t-il un coup de roi ?
          moins exposés                    /          \
                   |                     oui           non
          avancer le plus                 |             |
          avancé parmi eux       choisir les rois les jouer le meilleur
                                  moins exposés       score calculé
                                       |
                               rapprocher le roi
                               du roi adverse
```

La finale est définie ici comme une position avec au plus quatre pièces autres que les pions et les rois, tous camps confondus. En finale, la priorité aux coups de pion ou de roi peut remplacer le meilleur score calculé auparavant, mais choisit maintenant les coups les moins exposés de ces catégories.

Après chaque coup candidat, Level 16 évalue aussi si l'adversaire peut capturer la pièce déplacée dans la position simulée, en tenant compte des reprises possibles. Le validateur de la simulation est construit pour le plateau copié.
Les niveaux 4, 5, 6 et 16 ajoutent un bonus de score au petit roque quand le validateur le propose comme coup légal ; ils ne forcent pas le roque face à une meilleure tactique.

## Observations transversales

- Les niveaux 2 à 6 répètent plusieurs opérations : énumération des coups légaux, détection des cases attaquées et calcul de scores. Les critères et leurs pondérations ne sont toutefois pas identiques.
- Les niveaux 2 à 6 choisissent parfois au hasard parmi plusieurs coups. Une partie isolée ne suffit donc pas à caractériser leur niveau.
- Les niveaux 3 à 6 évaluent principalement la position présente ; seul le niveau 16 tente une vérification d'un mat immédiat.
- Ces schémas documentent le code tel qu'il existe aujourd'hui. Ils ne constituent pas une proposition de nouvelle stratégie.

## Sources

- Bots : [`php/js/kchess/bots/`](../php/js/kchess/bots/)
- Génération et validation des coups : [`php/js/kchess/validators/move-pieces/move-validator.js`](../php/js/kchess/validators/move-pieces/move-validator.js)
- Mesures de confrontation : [`Audit des bots`](AUDIT_BOTS.md)
