# Chess Board avec Tkinter

Un échiquier interactif implémenté en Python avec la bibliothèque Tkinter, affichant les coordonnées et la notation FEN ou PGN.

## Fonctionnalités

- Affichage d'un échiquier 8x8 avec les pièces aux positions initiales
- Notation des coordonnées (a-h et 1-8) sur les bords du plateau
- Affichage en temps réel de la notation FEN (Forsyth-Edwards Notation)
- Bouton pour tourner le plateau (changer la perspective)
- Fonctions principales
- draw_board() : dessine l'échiquier
- draw_pieces() : place les pièces sur l'échiquier
- draw_coordinates() : ajoute les coordonnées autour du plateau
- board_to_fen() : convertit la position actuelle en notation FEN
- flip_board() : inverse la perspective du plateau

## Features

- Menu
- Export json
- Gestion des mouvements des pièces
- Validation des règles des échecs
- Historique des coups
- Minuterie de jeu
- Options de sauvegarde/chargement

## Prérequis

- Python 3.x
- Bibliothèque Tkinter (généralement incluse avec Python)
- pip install python-chess

## Installation

1. Clonez ce dépôt :
   ```bash
   git clone [URL_DU_DEPOT]

## Usage

1. Console ou terminal :
   python chess_ui.py

## Licence
Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.