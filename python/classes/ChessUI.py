import tkinter as tk
from tkinter import filedialog
import io
import chess
from datetime import date
from PIL import Image, ImageTk
from chess_ICEA_main import *  # Contient probablement les constantes (ex : START_POSITION)
from classes.Check_pieces import CheckPieces  # Classe pour vérifier les mouvements valides
import random

class ChessUI:
    def __init__(self, main_window, root_frame, board_size, square_size, retour_menu_callback=None):
        # Initialisation de l’interface utilisateur pour le jeu d’échecs
        self.root = root_frame
        self.main_window = main_window
        self.retour_menu_callback = retour_menu_callback
        
        # Constantes graphiques et symboliques
        self.LIGHT_COLOR = LIGHT_COLOR
        self.DARK_COLOR = DARK_COLOR
        self.PIECE_SYMBOLS = PIECE_SYMBOLS
        self.FEN_SYMBOLS = FEN_SYMBOLS
        self.START_POSITION = START_POSITION
        self.board = [row[:] for row in self.START_POSITION]  # Copie de la position initiale

        # Dimensions de l’échiquier
        self.BOARD_SIZE = board_size
        self.SQUARE_SIZE = square_size

        # Titre de la fenêtre
        self.main_window.title("Échiquier avec coordonnées externes et FEN")

        canvas_width = square_size * (board_size + 1)
        canvas_height = square_size * (board_size + 1)

        # Création du cadre principal
        frame = tk.Frame(self.root)
        frame.pack()

        # Étiquette du minuteur
        self.timer_label = tk.Label(frame, text="Temps : 00:00", font=("Arial", 12, "bold"))
        self.timer_label.grid(row=1, column=0, sticky="n", padx=10, pady=5)

        self.elapsed_seconds = 0  # Temps écoulé en secondes
        self.update_timer()  # Lance le minuteur

        # Initialisation du vérificateur de coups
        self.checker = CheckPieces()

        #historique des coups
        self.move_history = []
        # Chargement du logo de la fenêtre
        try:
            logo_path = r"..\images\chess.png"
            logo_image = Image.open(logo_path)
            logo_photo = ImageTk.PhotoImage(logo_image)
            self.main_window.iconphoto(True, logo_photo)
            self.main_window.iconbitmap(r"..\images\chess.png")
        except Exception as e:
            print(f"Logo non chargé : {e}")

        # Création du canvas pour l’échiquier
        self.canvas = tk.Canvas(frame, width=canvas_width, height=canvas_height)
        self.canvas.grid(row=0, column=0)

        # Zone d’affichage de la notation FEN
        self.fen_label = tk.Label(frame, text="FEN :", font=("Arial", 12, "bold"))
        self.fen_label.grid(row=0, column=1, sticky="nw", padx=10)
 
        #
        self.fen_text = tk.Text(frame, height=3, width=50, font=("Courier", 10))
        self.fen_text.grid(row=0, column=1, sticky="n", padx=10, pady=30)
       
       
        #Zone affichage tour joueur
        self.turn_label = tk.Label(frame, text="Tour : Blanc", font=("Arial", 12, "bold"))
        self.turn_label.grid(row=1, column=1, sticky="nw", padx=10)
        
        # Bouton pour inverser l’échiquier
        self.flip_button = tk.Button(frame, text="Tourner le plateau", command=self.flip_board)
        self.flip_button.grid(row=1, column=1, sticky="n", padx=10, pady=5)

        # Gestion de la sélection de pièce
        self.selected_piece = None
        self.canvas.bind("<Button-1>", self.on_click)  # Associe le clic gauche à on_click()

        # Dessin initial
        self.draw_board()
        self.draw_pieces()
        self.draw_coordinates()
        self.update_fen_display()
        self.current_turn = "w"

    def draw_board(self):
        """Dessine le plateau avec les cases claires et foncées."""
        for row in range(self.BOARD_SIZE):
            for col in range(self.BOARD_SIZE):
                color = self.LIGHT_COLOR if (row + col) % 2 == 0 else self.DARK_COLOR
                x1 = (col + 1) * self.SQUARE_SIZE
                y1 = row * self.SQUARE_SIZE
                x2 = x1 + self.SQUARE_SIZE
                y2 = y1 + self.SQUARE_SIZE
                self.canvas.create_rectangle(x1, y1, x2, y2, fill=color, outline="")

    def draw_pieces(self):
        """Place les pièces sur le plateau à partir de self.board."""
        for row in range(self.BOARD_SIZE):
            for col in range(self.BOARD_SIZE):
                piece = self.board[row][col]
                if piece:
                    symbol = self.PIECE_SYMBOLS.get(piece, "")
                    x = (col + 1) * self.SQUARE_SIZE + self.SQUARE_SIZE // 2
                    y = row * self.SQUARE_SIZE + self.SQUARE_SIZE // 2
                    self.canvas.create_text(x, y, text=symbol, font=("Arial", 32))

    def draw_coordinates(self):
        """Dessine les lettres et chiffres autour du plateau."""
        for col in range(self.BOARD_SIZE):
            letter = chr(ord('a') + col)
            x = (col + 1) * self.SQUARE_SIZE + self.SQUARE_SIZE // 2
            y = self.BOARD_SIZE * self.SQUARE_SIZE + self.SQUARE_SIZE // 2
            self.canvas.create_text(x, y, text=letter, font=("Arial", 12, "bold"))

        for row in range(self.BOARD_SIZE):
            number = str(8 - row)
            x = self.SQUARE_SIZE // 2
            y = row * self.SQUARE_SIZE + self.SQUARE_SIZE // 2
            self.canvas.create_text(x, y, text=number, font=("Arial", 12, "bold"))

    def update_fen_display(self):
        """Met à jour l'affichage de la position FEN dans le champ texte."""
        fen = self.board_to_fen()
        self.fen_text.delete("1.0", tk.END)
        self.fen_text.insert(tk.END, fen)

    def board_to_fen(self):
        """Convertit self.board en notation FEN."""
        fen_rows = []
        for row in self.board:
            fen_row = ""
            empty = 0
            for piece in row:
                if piece == "":
                    empty += 1
                else:
                    if empty:
                        fen_row += str(empty)
                        empty = 0
                    fen_row += self.FEN_SYMBOLS.get(piece, "")
            if empty:
                fen_row += str(empty)
            fen_rows.append(fen_row)
        return "/".join(fen_rows) + " w KQkq - 0 1"
        # return "/".join(fen_rows) + f" {self.current_turn} KQkq - 0 1"


    def flip_board(self):
        """Inverse l’échiquier (haut <-> bas, gauche <-> droite)."""
        self.board = [row[::-1] for row in self.board[::-1]]
        self.canvas.delete("all")
        self.draw_board()
        self.draw_pieces()
        self.draw_coordinates()
        self.update_fen_display()

    def on_click(self, event):
        """Gère les clics pour déplacer une pièce."""
        col = (event.x // self.SQUARE_SIZE) - 1
        row = event.y // self.SQUARE_SIZE

        if 0 <= row < self.BOARD_SIZE and 0 <= col < self.BOARD_SIZE:
            if self.selected_piece is None:
                # Sélectionner une pièce si c’est le bon tour
                if self.board[row][col] and self.board[row][col][0] == self.current_turn:
                    self.selected_piece = (row, col)
            else:
                target_row, target_col = row, col
                src_row, src_col = self.selected_piece
                piece = self.board[src_row][src_col]

                if not self.board[target_row][target_col] or self.board[target_row][target_col][0] != self.current_turn:
                    if self.is_legal_move(piece, src_row, src_col, target_row, target_col):
                        # Déplacement valide
                        self.board[src_row][src_col] = ""
                        self.board[target_row][target_col] = piece

                        move_str = self.format_move(piece, src_row, src_col, target_row, target_col)
                        self.move_history.append(move_str)
                        # Changer tour
                        self.current_turn = "b"
                        self.turn_label.config(text="Tour : Noir")


                        self.canvas.delete("all")
                        self.draw_board()
                        self.draw_pieces()
                        self.draw_coordinates()
                        self.update_fen_display()

                        self.selected_piece = None

                        
                        self.root.after(500, self.play_random_black_move)
                        return  
                self.selected_piece = None
 

    def fen_to_board(self, fen):
        """Convertit une chaîne FEN en matrice self.board."""
        board = []
        rows = fen.split(" ")[0].split("/")
        for row in rows:
            board_row = []
            for char in row:
                if char.isdigit():
                    board_row.extend([""] * int(char))
                else:
                    piece = next((k for k, v in self.FEN_SYMBOLS.items() if v == char), "")
                    board_row.append(piece)
            board.append(board_row)
        return board

    def show_fen(self, fen):
        """Affiche une position spécifique à partir d’une FEN donnée."""
        self.board = self.fen_to_board(fen)
        self.canvas.delete("all")
        self.draw_board()
        self.draw_pieces()
        self.draw_coordinates()
        self.update_fen_display()

    def pgn_to_fens(self, pgn_text):
        """Extrait les positions FEN depuis un texte PGN (partie d’échecs)."""
        fens = []
        game = chess.pgn.read_game(io.StringIO(pgn_text))
        board = game.board()
        fens.append(board.fen())
        for move in game.mainline_moves():
            board.push(move)
            fens.append(board.fen())
        return fens

    def next_move(self):
        """Affiche le coup suivant dans une partie PGN."""
        if self.current_move_index + 1 < len(self.pgn_moves):
            self.current_move_index += 1
            self.show_fen(self.pgn_moves[self.current_move_index])
            self.update_fen_display()
            self.prev_button.config(state="normal")
            if self.current_move_index == len(self.pgn_moves) - 1:
                self.next_button.config(state="disabled")

    def prev_move(self):
        """Affiche le coup précédent dans une partie PGN."""
        if self.current_move_index > 0:
            self.current_move_index -= 1
            self.show_fen(self.pgn_moves[self.current_move_index])
            self.update_fen_display()
            self.next_button.config(state="normal")
            if self.current_move_index == 0:
                self.prev_button.config(state="disabled")

    def start_game(self):
        """Lance la boucle principale de l’interface Tkinter."""
        self.root.mainloop()

    def update_timer(self):
        """Met à jour l’étiquette du chronomètre chaque seconde."""
        minutes = self.elapsed_seconds // 60
        seconds = self.elapsed_seconds % 60
        time_str = f"Temps : {minutes:02d}:{seconds:02d}"
        self.timer_label.config(text=time_str)
        self.elapsed_seconds += 1
        self.root.after(1000, self.update_timer)  # Mise à jour chaque seconde
    def is_legal_move(self, piece, start_row, start_col, end_row, end_col):
        """
        Vérifie si un mouvement est légal selon les règles classiques d’échecs.
        :param piece: identifiant comme "wp", "br", etc.
        :return: True si le coup est autorisé
        """
        piece_type = self.checker.get_piece_type(piece)
        dr = end_row - start_row
        dc = end_col - start_col
        target = self.board[end_row][end_col]

        # Empêche de capturer sa propre pièce
        if target and target[0] == piece[0]:
            return False

        direction = 1 if piece.startswith('w') else -1  # Blanc vers le haut (-1), noir vers le bas (+1)

        if piece_type == "pion":
            # Avance simple
            if dc == 0 and dr == -direction and target == "":
                return True
            # Premier coup (2 cases)
            if dc == 0 and dr == -2 * direction and start_row in (6, 1) and \
            self.board[start_row - direction][start_col] == "" and target == "":
                return True
            # Capture diagonale
            if abs(dc) == 1 and dr == -direction and target != "" and target[0] != piece[0]:
                return True
            return False

        elif piece_type == "cavalier":
            return (abs(dr), abs(dc)) in [(2, 1), (1, 2)]

        elif piece_type.startswith("fou"):
            if abs(dr) != abs(dc):
                return False
            return self.is_path_clear(start_row, start_col, end_row, end_col)

        elif piece_type == "tour":
            if dr != 0 and dc != 0:
                return False
            return self.is_path_clear(start_row, start_col, end_row, end_col)

        elif piece_type == "reine":
            if abs(dr) == abs(dc) or dr == 0 or dc == 0:
                return self.is_path_clear(start_row, start_col, end_row, end_col)
            return False

        elif piece_type == "roi":
            return max(abs(dr), abs(dc)) == 1

        return False
    def is_path_clear(self, start_row, start_col, end_row, end_col):
        """Vérifie que les cases intermédiaires sont vides entre start et end (pour tour, fou, reine)."""
        dr = end_row - start_row
        dc = end_col - start_col
        step_row = (dr // abs(dr)) if dr != 0 else 0
        step_col = (dc // abs(dc)) if dc != 0 else 0

        row, col = start_row + step_row, start_col + step_col
        while (row, col) != (end_row, end_col):
            if self.board[row][col] != "":
                return False
            row += step_row
            col += step_col
        return True
    
    def play_random_black_move(self):
        """Joue un coup aléatoire pour les noirs."""
        possible_moves = []

        for row in range(self.BOARD_SIZE):
            for col in range(self.BOARD_SIZE):
                piece = self.board[row][col]
                if piece.startswith("b"):
                    for r in range(self.BOARD_SIZE):
                        for c in range(self.BOARD_SIZE):
                            if self.board[r][c] == "" or self.board[r][c][0] == "w":
                                if self.is_legal_move(piece, row, col, r, c):
                                    possible_moves.append(((row, col), (r, c)))

        if possible_moves:
            (src_row, src_col), (dst_row, dst_col) = random.choice(possible_moves)
            piece = self.board[src_row][src_col]
            self.board[src_row][src_col] = ""
            self.board[dst_row][dst_col] = piece

            # Changer de tour
            self.current_turn = "w"
            self.turn_label.config(text="Tour : Blanc")

            # Redessiner l'échiquier
            self.canvas.delete("all")
            self.draw_board()
            self.draw_pieces()
            self.draw_coordinates()
            self.update_fen_display()
    
    def format_move(self, piece, src_row, src_col, dest_row, dest_col):
        """Retourne une notation simple du coup joué."""
        cols = "abcdefgh"
        rows = "87654321"
        start = cols[src_col] + rows[src_row]
        end = cols[dest_col] + rows[dest_row]
        #affichage console du coup jouer
        print("\n".join(self.move_history))
        return f"{piece}:{start}->{end}"
    
    