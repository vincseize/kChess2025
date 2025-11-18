class CheckPieces:
    def __init__(self):
        """
        Initialise la classe avec le dictionnaire des mouvements possibles.
        :param pieces_dict: Dictionnaire contenant les mouvements possibles pour chaque type de pièce.
        """
        self.pieces_dict = {  
            'pion' : ('a2','b1','a4','b3','c2','d1','a6','b5','c4','d3','e2','f1','a8','b7','c6','d5','e4','f3','g2','h1','c8','d7','e6','f5','g4','h3','e8','f7','g6','h5','g8','h7','a1','a3','b2','c1','a5','b4','c3','d2','e1','a7','b6','c5','d4','e3','f2','g1','b8','c7','d6','e5','f4','g3','h2','d8','e7','f6','g5','h4','f8','g7','h6','h8'),
            'fou blanc' : ('a2','b1','a4','b3','c2','d1','a6','b5','c4','d3','e2','f1','a8','b7','c6','d5','e4','f3','g2','h1','c8','d7','e6','f5','g4','h3','e8','f7','g6','h5','g8','h7'),
            'fou noir' : ('a1','a3','b2','c1','a5','b4','c3','d2','e1','a7','b6','c5','d4','e3','f2','g1','b8','c7','d6','e5','f4','g3','h2','d8','e7','f6','g5','h4','f8','g7','h6','h8'),
            'cavalier' : ('a2','b1','a4','b3','c2','d1','a6','b5','c4','d3','e2','f1','a8','b7','c6','d5','e4','f3','g2','h1','c8','d7','e6','f5','g4','h3','e8','f7','g6','h5','g8','h7','a1','a3','b2','c1','a5','b4','c3','d2','e1','a7','b6','c5','d4','e3','f2','g1','b8','c7','d6','e5','f4','g3','h2','d8','e7','f6','g5','h4','f8','g7','h6','h8'),
            'tour' : ('a2','b1','a4','b3','c2','d1','a6','b5','c4','d3','e2','f1','a8','b7','c6','d5','e4','f3','g2','h1','c8','d7','e6','f5','g4','h3','e8','f7','g6','h5','g8','h7','a1','a3','b2','c1','a5','b4','c3','d2','e1','a7','b6','c5','d4','e3','f2','g1','b8','c7','d6','e5','f4','g3','h2','d8','e7','f6','g5','h4','f8','g7','h6','h8'),
            'reine' : ('a2','b1','a4','b3','c2','d1','a6','b5','c4','d3','e2','f1','a8','b7','c6','d5','e4','f3','g2','h1','c8','d7','e6','f5','g4','h3','e8','f7','g6','h5','g8','h7','a1','a3','b2','c1','a5','b4','c3','d2','e1','a7','b6','c5','d4','e3','f2','g1','b8','c7','d6','e5','f4','g3','h2','d8','e7','f6','g5','h4','f8','g7','h6','h8'),
            'roi' : ('a2','b1','a4','b3','c2','d1','a6','b5','c4','d3','e2','f1','a8','b7','c6','d5','e4','f3','g2','h1','c8','d7','e6','f5','g4','h3','e8','f7','g6','h5','g8','h7','a1','a3','b2','c1','a5','b4','c3','d2','e1','a7','b6','c5','d4','e3','f2','g1','b8','c7','d6','e5','f4','g3','h2','d8','e7','f6','g5','h4','f8','g7','h6','h8')}

    def is_valid_move(self, piece_type, target_square):
        """
        Vérifie si le déplacement est valide pour une pièce donnée.
        :param piece_type: Type de la pièce (par exemple, 'fou blanc', 'pion', etc.).
        :param target_square: La case cible sous forme de chaîne (par exemple, 'a3').
        :return: True si le déplacement est valide, False sinon.
        """
        if piece_type in self.pieces_dict:
            return target_square in self.pieces_dict[piece_type]
        return False

    def get_piece_type(self, piece):
        """
        Retourne le type de la pièce en fonction de son identifiant.
        :param piece: Identifiant de la pièce (par exemple, 'wp', 'bp').
        :return: Type de la pièce (par exemple, 'pion', 'fou blanc', etc.).
        """
        if piece.startswith('w'):  # Pièces blanches
            if piece == "wp":
                return "pion"
            elif piece == "wr":
                return "tour"
            elif piece == "wn":
                return "cavalier"
            elif piece == "wb":
                return "fou blanc"
            elif piece == "wq":
                return "reine"
            elif piece == "wk":
                return "roi"
        elif piece.startswith('b'):  # Pièces noires
            if piece == "bp":
                return "pion"
            elif piece == "br":
                return "tour"
            elif piece == "bn":
                return "cavalier"
            elif piece == "bb":
                return "fou noir"
            elif piece == "bq":
                return "reine"
            elif piece == "bk":
                return "roi"
        return None

    def get_square_name(self, row, col):
        """
        Retourne le nom de la case (par exemple, 'a3') en fonction de ses coordonnées.
        :param row: Ligne de la case.
        :param col: Colonne de la case.
        :return: Nom de la case sous forme de chaîne.
        """
        letter = chr(ord('a') + col)
        number = str(8 - row)
        return f"{letter}{number}"

    # Fonction résumé pour ChessUI (en gros pour pas vous casser la tête)
    def verify_move(self, piece, target_row, target_col):
        piece_type = self.get_piece_type(piece)  # Obtenir le type de la pièce
        target_square = self.get_square_name(target_row, target_col)  # Obtenir le nom de la case cible
        if self.is_valid_move(piece_type, target_square): # Vérifier si le mouvement est valide
            return True
        return False

# Code à ajouter dans Chess UI


# A ajouter au début
"""
self.checker = CheckPiece()
"""

# A remplacer dans on_click
"""
# Deuxième clic : déplacer la pièce
target_row, target_col = row, col
piece = self.board[self.selected_piece[0]][self.selected_piece[1]]

# Vérification CheckPiece
if self.checker.verify_move(piece, target_row, target_col):
    self.board[self.selected_piece[0]][self.selected_piece[1]] = ""
    self.board[target_row][target_col] = piece

self.selected_piece = None
"""