import tkinter as tk
from classes.MenuUI import *

BOARD_SIZE = 8
SQUARE_SIZE = 60
LIGHT_COLOR = "#EEEED2"
DARK_COLOR = "#769656"

PIECE_SYMBOLS = {
    "wp": "♙", "wr": "♖", "wn": "♘", "wb": "♗", "wq": "♕", "wk": "♔",
    "bp": "♟", "br": "♜", "bn": "♞", "bb": "♝", "bq": "♛", "bk": "♚"
}

FEN_SYMBOLS = {
    "wp": "P", "wr": "R", "wn": "N", "wb": "B", "wq": "Q", "wk": "K",
    "bp": "p", "br": "r", "bn": "n", "bb": "b", "bq": "q", "bk": "k"
}

START_POSITION = [
    ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
    ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
    ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"]
]

if __name__ == "__main__" : 
    canvas_width = SQUARE_SIZE * (BOARD_SIZE + 1)
    canvas_height = SQUARE_SIZE * (BOARD_SIZE + 1)
    root = tk.Tk()
    root.geometry(f"{canvas_width + 400}x{canvas_height + 50}") 
    app = MenuUI(root, board_size=BOARD_SIZE, square_size=SQUARE_SIZE)
    root.mainloop()