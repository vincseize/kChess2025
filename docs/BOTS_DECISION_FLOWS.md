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
  + bonus pour le roque légal (petit ou grand)
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
  + bonus pour le roque légal (petit ou grand)
  + variation du contrôle et de l'occupation
    des quatre cases centrales après simulation
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
Le contrôle du centre compte les quatre cases d4, e4, d5 et e5 attaquées et occupées par le bot, puis valorise leur progression par rapport à la position initiale.

## Niveau 6 — niveau 5 avec préférence centrale

Fichier : [`Level_6.js`](../php/js/kchess/bots/Level_6.js)

```text
Calculer les critères tactiques du niveau 5
        |
Ajouter un bonus pour le roque légal
        |
Si une promotion est légale, privilégier
la promotion en dame avec le meilleur score tactique
        |
Après simulation de chaque coup, ajouter la variation
de l'occupation et du contrôle des cases d4, e4, d5, e5
        |
Ajouter aussi le bonus positionnel d'approche
du centre selon le type de pièce
        |
Pénaliser toute augmentation du nombre de pions
en surplus sur une même colonne
        |
Favoriser les tours et dames sur colonnes
ouvertes ou semi-ouvertes après le coup
        |
Trier les coups par score
        |
Garder les coups dans le seuil de 75 %
        |
Choisir au hasard parmi les candidats
```

Le niveau 6 privilégie désormais à la fois l'occupation et le contrôle effectif des quatre cases centrales. Il n'effectue pas de recherche plus profonde que le niveau 5 et évalue lui aussi les pièces exposées après simulation, avec les prises et reprises légales jusqu'à huit échanges.
Il pénalise aussi les pions doublés en comparant leur nombre avant et après le coup simulé ; les doublons déjà présents ne pénalisent pas davantage un coup qui ne les aggrave pas.
Il valorise également les tours et dames placées sur une colonne sans pion allié : bonus supérieur si la colonne ne contient aucun pion adverse.
Si une promotion est légale, il privilégie la promotion en dame dont le score tactique est le meilleur.

## Niveau 7 — niveau 6 avec priorité aux pions liés et aux tours doublées

Fichier : [`Level_7.js`](../php/js/kchess/bots/Level_7.js)

Le niveau 7 reprend les règles du niveau 6. Il favorise aussi, après simulation, les coups qui créent ou conservent des paires de pions liées (un pion défend l'autre en diagonale), ainsi que les positions où deux tours alliées occupent la même colonne.
Quand il possède au moins l'équivalent matériel d'un cavalier d'avance, il favorise aussi les captures de pièces (hors pions) d'une valeur au moins égale à celle de la pièce attaquante.
Il ajoute une forte préférence pour un coup de cavalier qui, après simulation, attaque au moins deux pièces adverses autres que des pions, si le cavalier ne peut pas être capturé au prochain échange.

## Niveau 8 — niveau 7 avec priorité aux fourchettes de cavalier

Fichier : [`Level_8.js`](../php/js/kchess/bots/Level_8.js)

Le niveau 8 reprend les règles du niveau 7 et pénalise la création d'îlots de pions supplémentaires : un îlot est un groupe de pions sur des colonnes adjacentes. Il favorise aussi le placement de tours ou de dames dans le camp adverse sur plusieurs rangées différentes.

## Niveau 16 — mat immédiat, score, puis règles de finale

Fichier : [`Level_16.js`](../php/js/kchess/bots/Level_16.js)

```text
Lister les coups légaux
        |
Existe-t-il un mat en un coup ?
      /             \
    oui              non
     |                |
jouer le mat    Évaluer tous les coups légaux :
                 + captures
                 + promotion
                 + échec
                 + centre et développement
                 + variation du contrôle/occupation
                   des quatre cases centrales
                 - augmentation des pions en surplus
                   sur une même colonne
                 + tours et dames sur colonnes
                   ouvertes ou semi-ouvertes
                 + créer ou conserver des paires
                   de pions liés (défense en diagonale)
                 + placer deux tours alliées
                   sur la même colonne
                 + fourchette de cavalier sûre
                   sur au moins deux pièces adverses
                 - création d'îlots de pions supplémentaires
                 + tour ou dame avancée sur une rangée
                   différente dans le camp adverse
                 + bonus pour le roque légal (petit ou grand)
                 - perte estimée après simulation
                   et prises/reprises adverses
                 + sauver une pièce attaquée
                        |
              Une promotion est-elle légale ?
                    /             \
                  oui              non
                   |                |
       choisir la promotion en dame choisir le meilleur
       au meilleur score tactique   coup évalué
```

```text
Si aucune promotion n'est disponible :
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
Il pénalise une augmentation du nombre de pions en surplus sur une colonne par rapport à la position de départ.
Il favorise aussi les coups qui créent ou conservent des paires de pions liés (un pion défend l'autre en diagonale) ; en finale, ce critère départage les coups de pion les moins exposés avant leur progression.
Il préfère également les positions où deux tours alliées occupent la même colonne.
Quand il possède au moins l'équivalent matériel d'un cavalier d'avance, il favorise les prises de pièces (hors pions) d'une valeur au moins égale à celle de la pièce attaquante.
Il privilégie aussi un coup de cavalier qui attaque au moins deux pièces adverses autres que des pions, à condition que l'évaluation des échanges n'indique pas que le cavalier peut être capturé.
Il pénalise chaque îlot de pions supplémentaire, où un îlot désigne un groupe de pions sur des colonnes adjacentes, et valorise les tours/dames présentes sur des rangées distinctes dans le camp adverse.
Si une promotion légale existe, après la recherche du mat en un coup, Level 16 privilégie la promotion en dame ayant le meilleur score tactique.
Après avoir vérifié le mat en un coup, Level 16 privilégie une promotion légale en dame et choisit celle qui présente le meilleur score tactique.
Il valorise les tours et dames sur une colonne ouverte (sans pions des deux camps) ou semi-ouverte (sans pion allié), avec une préférence pour les colonnes ouvertes.
Les niveaux 4, 5, 6 et 16 ajoutent un bonus de score au petit roque ; les niveaux 5, 6 et 16 ajoutent aussi ce bonus au grand roque, quand le validateur le propose comme coup légal. Le roque n'est pas forcé face à une meilleure tactique.

### Profondeur indiquée dans le choix du bot

L'interface affiche `0` pour les niveaux 1 à 8 et `1` pour le niveau 16 ; la même valeur est transmise dans le paramètre `profondeur`. Ce paramètre n'est actuellement pas lu par le démarrage de la partie : les algorithmes gardent leur profondeur fixe. Le badge représente donc la valeur configurée, et non le nombre de demi-coups de toutes les simulations tactiques :

- Les niveaux 1, 2 et 4 à 8 ne font pas de recherche générale sur les réponses adverses. Les niveaux 4 à 8 simulent toutefois localement les prises et reprises sur la case visée, jusqu'à huit échanges.
- Le niveau 3 conserve son examen des réponses légales après chaque coup candidat parmi les huit meilleurs, malgré la valeur affichée `0`.
- Le niveau 16 vérifie le mat en un coup ; il simule également les séquences locales de prises et reprises jusqu'à huit échanges.

## Observations transversales

- Les niveaux 2 à 8 répètent plusieurs opérations : énumération des coups légaux, détection des cases attaquées et calcul de scores. Les critères et leurs pondérations ne sont toutefois pas identiques.
- Les niveaux 2 à 8 choisissent parfois au hasard parmi plusieurs coups. Une partie isolée ne suffit donc pas à caractériser leur niveau.
- Les niveaux 3 à 8 évaluent principalement la position présente ; seul le niveau 16 tente une vérification d'un mat immédiat.
- Ces schémas documentent le code tel qu'il existe aujourd'hui. Ils ne constituent pas une proposition de nouvelle stratégie.

## Sources

- Bots : [`php/js/kchess/bots/`](../php/js/kchess/bots/)
- Génération et validation des coups : [`php/js/kchess/validators/move-pieces/move-validator.js`](../php/js/kchess/validators/move-pieces/move-validator.js)
- Mesures de confrontation : [`Audit des bots`](AUDIT_BOTS.md)
