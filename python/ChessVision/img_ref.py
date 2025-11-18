import cv2
import numpy as np
import matplotlib.pyplot as plt

def create_reference_chessboard_image(save_path="reference_chessboard.jpg"):
    """Crée une image de référence parfaite d'un échiquier"""
    size = 800  # Haute résolution
    img = np.ones((size, size, 3), dtype=np.uint8) * 255
    
    # Couleurs des cases (style échiquier classique)
    dark_square = np.array([181, 136, 99])   # Marron
    light_square = np.array([240, 217, 181]) # Beige
    
    # Taille des cases
    square_size = size // 8
    
    # Création de l'échiquier parfait
    for row in range(8):
        for col in range(8):
            if (row + col) % 2 == 0:
                color = light_square
            else:
                color = dark_square
            
            x1 = col * square_size
            y1 = row * square_size
            x2 = (col + 1) * square_size
            y2 = (row + 1) * square_size
            
            img[y1:y2, x1:x2] = color
    
    # Ajouter quelques pièces pour tester la détection
    piece_colors = {
        'white': np.array([255, 255, 255]),
        'black': np.array([50, 50, 50])
    }
    
    # Positionnement des pièces (configuration de début de partie)
    # Pions blancs
    for col in range(8):
        add_piece(img, 6, col, piece_colors['white'], 'pawn', square_size)
    
    # Pièces blanches
    back_row_white = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
    for col, piece_type in enumerate(back_row_white):
        add_piece(img, 7, col, piece_colors['white'], piece_type, square_size)
    
    # Pions noirs
    for col in range(8):
        add_piece(img, 1, col, piece_colors['black'], 'pawn', square_size)
    
    # Pièces noires
    back_row_black = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
    for col, piece_type in enumerate(back_row_black):
        add_piece(img, 0, col, piece_colors['black'], piece_type, square_size)
    
    # Sauvegarder l'image
    cv2.imwrite(save_path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
    print(f"✅ Image de référence sauvegardée: {save_path}")
    
    # Afficher l'image
    plt.figure(figsize=(10, 10))
    plt.imshow(img)
    plt.title("Échiquier de Référence - Vue Optimale")
    plt.axis('off')
    plt.show()
    
    return img

def add_piece(img, row, col, color, piece_type, square_size):
    """Ajoute une pièce stylisée sur l'échiquier"""
    center_x = col * square_size + square_size // 2
    center_y = row * square_size + square_size // 2
    
    # Taille de la pièce basée sur le type
    sizes = {
        'pawn': square_size // 3,
        'knight': square_size // 2,
        'bishop': square_size // 2,
        'rook': square_size // 2,
        'queen': square_size // 2,
        'king': square_size // 2
    }
    
    radius = sizes.get(piece_type, square_size // 3)
    
    # Convertir la couleur en tuple (correction du bug)
    color_tuple = tuple(color.tolist()) if hasattr(color, 'tolist') else tuple(color)
    
    # Dessiner la pièce (cercle pour les pions, formes plus complexes pour autres)
    if piece_type == 'pawn':
        cv2.circle(img, (center_x, center_y), radius, color_tuple, -1)
        # Contour pour la visibilité
        border_color = (0, 0, 0) if color[0] > 128 else (255, 255, 255)
        cv2.circle(img, (center_x, center_y), radius, border_color, 2)
    
    elif piece_type in ['rook', 'queen', 'king']:
        # Forme rectangulaire pour les tours
        size = square_size // 3
        x1, y1 = center_x - size, center_y - size
        x2, y2 = center_x + size, center_y + size
        cv2.rectangle(img, (x1, y1), (x2, y2), color_tuple, -1)
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 0), 2)
    
    else:  # knight, bishop
        # Forme triangulaire
        points = np.array([
            [center_x, center_y - radius],
            [center_x - radius, center_y + radius],
            [center_x + radius, center_y + radius]
        ])
        cv2.fillPoly(img, [points], color_tuple)
        cv2.polylines(img, [points], True, (0, 0, 0), 2)

def create_simple_chessboard(save_path="simple_chessboard.jpg"):
    """Crée un échiquier simple sans pièces (pour tester la détection de base)"""
    size = 600
    img = np.ones((size, size, 3), dtype=np.uint8) * 255
    
    # Couleurs des cases
    dark_square = (120, 80, 50)    # Marron foncé
    light_square = (220, 190, 150) # Beige clair
    
    square_size = size // 8
    
    for row in range(8):
        for col in range(8):
            color = dark_square if (row + col) % 2 else light_square
            
            x1 = col * square_size
            y1 = row * square_size
            x2 = (col + 1) * square_size
            y2 = (row + 1) * square_size
            
            cv2.rectangle(img, (x1, y1), (x2, y2), color, -1)
    
    cv2.imwrite(save_path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
    print(f"✅ Échiquier simple sauvegardé: {save_path}")
    
    plt.figure(figsize=(8, 8))
    plt.imshow(img)
    plt.title("Échiquier Simple - Sans Pièces")
    plt.axis('off')
    plt.show()

# Utilisation
if __name__ == "__main__":
    try:
        # Créer l'image de référence parfaite
        print("Création de l'image de référence...")
        reference_img = create_reference_chessboard_image("reference_chessboard.jpg")
        
        # Créer aussi un échiquier simple (optionnel)
        print("\nCréation d'un échiquier simple...")
        create_simple_chessboard("simple_chessboard.jpg")
        
        print("\n🎯 Images créées avec succès!")
        print("1. reference_chessboard.jpg (avec pièces)")
        print("2. simple_chessboard.jpg (sans pièces)")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        print("Création d'un échiquier basique de secours...")
        
        # Version simplifiée en cas d'erreur
        size = 400
        img = np.ones((size, size, 3), dtype=np.uint8) * 255
        square_size = size // 8
        
        for i in range(8):
            for j in range(8):
                color = (120, 80, 50) if (i + j) % 2 else (220, 190, 150)
                x1, y1 = j * square_size, i * square_size
                x2, y2 = (j + 1) * square_size, (i + 1) * square_size
                cv2.rectangle(img, (x1, y1), (x2, y2), color, -1)
        
        cv2.imwrite("fallback_chessboard.jpg", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        print("✅ Échiquier de secours créé: fallback_chessboard.jpg")