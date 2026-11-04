/**
 * php/js/kchess/bots/game_ouverture.js
 * Lignes d'ouverture préparées pour une intégration future.
 *
 * Ce fichier ne charge ni ne joue ces coups : il ne fait que décrire les
 * deux lignes classiques, avec six demi-coups chacune.
 */
window.GameOuverture = Object.freeze({
    version: '1.0.0',
    lignes: Object.freeze([
        Object.freeze({
            nom: 'Gambit dame refusé',
            coups: Object.freeze([
                Object.freeze({ couleur: 'white', depart: 'd2', arrivee: 'd4', notation: '1. d4' }),
                Object.freeze({ couleur: 'black', depart: 'd7', arrivee: 'd5', notation: '1... d5' }),
                Object.freeze({ couleur: 'white', depart: 'c2', arrivee: 'c4', notation: '2. c4' }),
                Object.freeze({ couleur: 'black', depart: 'e7', arrivee: 'e6', notation: '2... e6' }),
                Object.freeze({ couleur: 'white', depart: 'b1', arrivee: 'c3', notation: '3. Cc3' }),
                Object.freeze({ couleur: 'black', depart: 'g8', arrivee: 'f6', notation: '3... Cf6' })
            ])
        }),
        Object.freeze({
            nom: 'Partie espagnole',
            coups: Object.freeze([
                Object.freeze({ couleur: 'white', depart: 'e2', arrivee: 'e4', notation: '1. e4' }),
                Object.freeze({ couleur: 'black', depart: 'e7', arrivee: 'e5', notation: '1... e5' }),
                Object.freeze({ couleur: 'white', depart: 'g1', arrivee: 'f3', notation: '2. Cf3' }),
                Object.freeze({ couleur: 'black', depart: 'b8', arrivee: 'c6', notation: '2... Cc6' }),
                Object.freeze({ couleur: 'white', depart: 'f1', arrivee: 'b5', notation: '3. Fb5' }),
                Object.freeze({ couleur: 'black', depart: 'a7', arrivee: 'a6', notation: '3... a6' })
            ])
        })
    ])
});
