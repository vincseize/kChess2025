import json

def load_config():
    with open('../config.json') as f:
        config = json.load(f)
    
    # Conversion vers les formats utilisés dans le code
    piece_symbols = {
        "wp": config["PIECE_SYMBOLS"]["WHITE"]["PAWN"],
        "wr": config["PIECE_SYMBOLS"]["WHITE"]["ROOK"],
        "wn": config["PIECE_SYMBOLS"]["WHITE"]["KNIGHT"],
        "wb": config["PIECE_SYMBOLS"]["WHITE"]["BISHOP"],
        "wq": config["PIECE_SYMBOLS"]["WHITE"]["QUEEN"],
        "wk": config["PIECE_SYMBOLS"]["WHITE"]["KING"],
        "bp": config["PIECE_SYMBOLS"]["BLACK"]["PAWN"],
        "br": config["PIECE_SYMBOLS"]["BLACK"]["ROOK"],
        "bn": config["PIECE_SYMBOLS"]["BLACK"]["KNIGHT"],
        "bb": config["PIECE_SYMBOLS"]["BLACK"]["BISHOP"],
        "bq": config["PIECE_SYMBOLS"]["BLACK"]["QUEEN"],
        "bk": config["PIECE_SYMBOLS"]["BLACK"]["KING"]
    }
    
    fen_symbols = {
        "wp": config["FEN_SYMBOLS"]["WHITE"]["PAWN"],
        "wr": config["FEN_SYMBOLS"]["WHITE"]["ROOK"],
        "wn": config["FEN_SYMBOLS"]["WHITE"]["KNIGHT"],
        "wb": config["FEN_SYMBOLS"]["WHITE"]["BISHOP"],
        "wq": config["FEN_SYMBOLS"]["WHITE"]["QUEEN"],
        "wk": config["FEN_SYMBOLS"]["WHITE"]["KING"],
        "bp": config["FEN_SYMBOLS"]["BLACK"]["PAWN"],
        "br": config["FEN_SYMBOLS"]["BLACK"]["ROOK"],
        "bn": config["FEN_SYMBOLS"]["BLACK"]["KNIGHT"],
        "bb": config["FEN_SYMBOLS"]["BLACK"]["BISHOP"],
        "bq": config["FEN_SYMBOLS"]["BLACK"]["QUEEN"],
        "bk": config["FEN_SYMBOLS"]["BLACK"]["KING"]
    }
    
    return {
        'BOARD_SIZE': config["BOARD_SETTINGS"]["SIZE"],
        'SQUARE_SIZE': config["BOARD_SETTINGS"]["SQUARE_SIZE"],
        'LIGHT_COLOR': config["BOARD_SETTINGS"]["COLORS"]["LIGHT"],
        'DARK_COLOR': config["BOARD_SETTINGS"]["COLORS"]["DARK"],
        'PIECE_FONT': (config["BOARD_SETTINGS"]["FONTS"]["PIECE"]["FAMILY"], 
                      config["BOARD_SETTINGS"]["FONTS"]["PIECE"]["SIZE"]),
        'COORD_FONT': (config["BOARD_SETTINGS"]["FONTS"]["COORDS"]["FAMILY"],
                      config["BOARD_SETTINGS"]["FONTS"]["COORDS"]["SIZE"],
                      config["BOARD_SETTINGS"]["FONTS"]["COORDS"]["WEIGHT"]),
        'PIECE_SYMBOLS': piece_symbols,
        'FEN_SYMBOLS': fen_symbols,
        'START_POSITION': config["START_POSITION"]
    }