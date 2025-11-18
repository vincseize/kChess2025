import tkinter as tk
from classes.ChessUI import ChessUI  # Interface principale du jeu d'échecs
from PIL import Image, ImageTk       # Pour afficher des images (logo)
import os

# --- Paramètres du plateau ---
BOARD_SIZE = 8         # Nombre de cases sur une ligne (échiquier standard)
SQUARE_SIZE = 60       # Taille d'une case en pixels

canvas_width = SQUARE_SIZE * (BOARD_SIZE + 1)
canvas_height = SQUARE_SIZE * (BOARD_SIZE + 1)

class MenuUI:
    """
    Classe représentant le menu principal de l'application d'échecs.
    Permet de lancer une partie ou de quitter le jeu.
    """
    
    def __init__(self, root, board_size=BOARD_SIZE, square_size=SQUARE_SIZE):
        """
        Initialise le menu principal avec un titre, un logo et deux boutons : Jouer et Quitter.
        """
        self.root = root  # Fenêtre principale
        self.root.title("Menu principal")  # Titre de la fenêtre
        self.board_size = board_size       # Taille du plateau (8x8)
        self.square_size = square_size     # Taille des cases

        # --- Cadre du menu principal ---
        self.menu_frame = tk.Frame(root, bg="black")  # Cadre noir pour un style sobre
        self.menu_frame.pack(fill="both", expand=True)  # Prend toute la place disponible

        # --- Chargement du logo du jeu ---
        try:
            logo_path = r"..\images\chess.png"
            logo_image = Image.open(logo_path)  # Ouverture de l'image
            logo_photo = ImageTk.PhotoImage(logo_image)  # Conversion en image Tkinter
            self.root.iconphoto(True, logo_photo)  # Définir l'icône de la fenêtre

            # Alternative pour Windows (nécessite une icône .ico pour iconbitmap)
            # self.root.iconbitmap(r"..\images\chess.ico")
        except Exception as e:
            print(f"Logo could not be loaded: {e}")  # Affiche l'erreur si le logo échoue
        #gcbjdhbcd
        # --- Titre de l'application ---
        self.title_label = tk.Label(
            self.menu_frame,
            text="Bienvenue dans le jeu chess game ICEA",
            font=("Arial", 18, "bold"),
            fg="white", bg="black"
        )
        self.title_label.pack(pady=10)  # Espacement vertical

        # --- Bouton "Jouer" ---
        self.bouton_jouer = tk.Button(
            self.menu_frame,
            text="Jouer", width=20,
            command=self.start_game,  # Appelle start_game quand on clique
            bg="#222", fg="white", activebackground="#444", activeforeground="white"
        )
        self.bouton_jouer.pack(pady=5)

        # --- Bouton "Quitter" ---
        self.bouton_quitter = tk.Button(
            self.menu_frame,
            text="Quitter", width=20,
            command=root.quit,  # Ferme l'application
            bg="#222", fg="white", activebackground="#444", activeforeground="white"
        )
        self.bouton_quitter.pack(pady=5)

        # --- Cadre pour l’interface de jeu (échiquier) ---
        self.jeu_frame = tk.Frame(root)
        self.chess_ui = None  # L'interface du jeu sera initialisée plus tard

    def start_game(self):
        """
        Lance une nouvelle partie en masquant le menu et en affichant l’échiquier.
        """
        self.menu_frame.pack_forget()  # Cache le menu
        self.jeu_frame.pack()          # Affiche le cadre de jeu

        # Si l'échiquier n'a pas encore été créé, on l’instancie
        if self.chess_ui is None:
            self.chess_ui = ChessUI(
                self.root,
                self.jeu_frame,
                retour_menu_callback=self.show_menu,  # Permet de revenir au menu
                board_size=self.board_size,
                square_size=self.square_size
            )

    def show_menu(self):
        """
        Affiche à nouveau le menu principal (utilisé depuis le bouton 'Retour au menu').
        """
        self.jeu_frame.pack_forget()   # Cache le jeu
        self.menu_frame.pack()         # Affiche le menu
