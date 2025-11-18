import cv2
import numpy as np
import matplotlib.pyplot as plt

class AdvancedChessVision:
    def __init__(self):
        self.min_confidence = 0.8  # Seuil de confiance pour la détection
        
    def evaluate_angle_quality(self, image):
        """Évalue la qualité de l'angle de prise de vue"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Détection des lignes avec Hough
        edges = cv2.Canny(gray, 50, 150)
        lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
        
        if lines is None:
            return {"quality": "poor", "score": 0, "issues": ["Aucune ligne détectée"]}
        
        # Analyse des angles des lignes
        horizontal_angles = []
        vertical_angles = []
        
        for rho, theta in lines[:, 0]:
            angle = theta * 180 / np.pi
            if 0 <= angle <= 30 or 150 <= angle <= 180:
                horizontal_angles.append(angle)
            elif 60 <= angle <= 120:
                vertical_angles.append(angle)
        
        angle_score = self.calculate_angle_score(horizontal_angles, vertical_angles)
        
        # Évaluation de la symétrie
        symmetry_score = self.evaluate_symmetry(image)
        
        overall_score = (angle_score + symmetry_score) / 2
        
        issues = []
        if overall_score < 0.6:
            issues.append("Angle trop incliné - rapprochez-vous du centre")
        if symmetry_score < 0.5:
            issues.append("Photo asymétrique - centrez l'échiquier")
        if angle_score < 0.5:
            issues.append("Lignes déformées - prenez une vue plus verticale")
            
        quality = "excellent" if overall_score > 0.8 else "good" if overall_score > 0.6 else "poor"
        
        return {
            "quality": quality,
            "score": overall_score,
            "angle_score": angle_score,
            "symmetry_score": symmetry_score,
            "issues": issues
        }
    
    def calculate_angle_score(self, horizontal_angles, vertical_angles):
        """Calcule un score basé sur la régularité des angles"""
        if len(horizontal_angles) < 2 or len(vertical_angles) < 2:
            return 0.3
        
        # Écart-type des angles (plus c'est bas, mieux c'est)
        h_std = np.std(horizontal_angles)
        v_std = np.std(vertical_angles)
        
        # Score basé sur la régularité
        angle_std_score = max(0, 1 - (h_std + v_std) / 30)
        
        # Score basé sur le nombre de lignes détectées
        line_count_score = min(1, (len(horizontal_angles) + len(vertical_angles)) / 20)
        
        return (angle_std_score + line_count_score) / 2
    
    def evaluate_symmetry(self, image):
        """Évalue la symétrie de l'image"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        h, w = gray.shape
        
        # Compare les quarts de l'image
        top_left = gray[:h//2, :w//2]
        top_right = gray[:h//2, w//2:]
        bottom_left = gray[h//2:, :w//2]
        bottom_right = gray[h//2:, w//2:]
        
        # Calcul de la similarité entre les régions symétriques
        similarity1 = self.compare_regions(top_left, cv2.flip(top_right, 1))
        similarity2 = self.compare_regions(bottom_left, cv2.flip(bottom_right, 1))
        similarity3 = self.compare_regions(top_left, cv2.flip(bottom_left, 0))
        similarity4 = self.compare_regions(top_right, cv2.flip(bottom_right, 0))
        
        return np.mean([similarity1, similarity2, similarity3, similarity4])
    
    def compare_regions(self, region1, region2):
        """Compare deux régions d'image"""
        if region1.shape != region2.shape:
            region2 = cv2.resize(region2, (region1.shape[1], region1.shape[0]))
        
        # Correlation pour mesurer la similarité
        correlation = np.corrcoef(region1.flatten(), region2.flatten())[0, 1]
        return max(0, correlation)  # Retourne entre 0 et 1
    
    def correct_perspective(self, image, corners):
        """Correction avancée de la perspective"""
        # Ordre des points : haut-gauche, haut-droit, bas-droit, bas-gauche
        ordered_corners = self.order_points(corners)
        
        # Calcul de l'angle d'inclinaison
        angle = self.calculate_tilt_angle(ordered_corners)
        
        # Ajustement dynamique de la taille de sortie basé sur l'angle
        base_size = 400
        size_adjustment = int(base_size * (1 - abs(angle) / 90))
        output_size = max(300, size_adjustment)
        
        # Points de destination avec compensation d'angle
        dst_points = np.array([
            [0, 0],
            [output_size - 1, 0],
            [output_size - 1, output_size - 1],
            [0, output_size - 1]
        ], dtype="float32")
        
        # Application de la transformation
        M = cv2.getPerspectiveTransform(ordered_corners, dst_points)
        warped = cv2.warpPerspective(image, M, (output_size, output_size))
        
        return warped, angle
    
    def calculate_tilt_angle(self, corners):
        """Calcule l'angle d'inclinaison de l'échiquier"""
        # Vecteurs des côtés
        top_vector = corners[1] - corners[0]
        left_vector = corners[3] - corners[0]
        
        # Angles par rapport à l'horizontal/vertical
        top_angle = np.arctan2(top_vector[1], top_vector[0]) * 180 / np.pi
        left_angle = np.arctan2(left_vector[1], left_vector[0]) * 180 / np.pi - 90
        
        # Moyenne des angles
        avg_angle = (top_angle + left_angle) / 2
        
        return avg_angle
    
    def order_points(self, pts):
        """Ordonne les points dans le bon ordre"""
        rect = np.zeros((4, 2), dtype="float32")
        
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]  # haut-gauche
        rect[2] = pts[np.argmax(s)]  # bas-droit
        
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]  # haut-droit
        rect[3] = pts[np.argmax(diff)]  # bas-gauche
        
        return rect
    
    def get_photography_guidance(self, quality_report):
        """Donne des conseils pour améliorer la photo"""
        guidance = []
        
        if quality_report["quality"] == "poor":
            guidance.append("📸 **CONSEILS DE PRISE DE VUE :**")
            guidance.append("• Tenez la camera PERPENDICULAIRE à l'échiquier")
            guidance.append("• Placez-vous au-dessus du centre de l'échiquier")
            guidance.append("• Assurez-vous que tout l'échiquier est visible")
            guidance.append("• Évitez les reflets sur les pièces")
            
        for issue in quality_report["issues"]:
            if "incliné" in issue.lower():
                guidance.append("→ Redressez la camera")
            if "asymétrique" in issue.lower():
                guidance.append("→ Centrez l'échiquier dans le cadre")
            if "lignes déformées" in issue.lower():
                guidance.append("→ Approchez-vous d'une vue de dessus")
        
        return guidance

# Exemple d'utilisation complète
def complete_example():
    vision = AdvancedChessVision()
    
    # Charger l'image
    image1 = cv2.imread("APCS_1_large.jpg")
    image2 = cv2.imread("APCS_1_large.jpg")
    image_rgb = cv2.cvtColor(image2, cv2.COLOR_BGR2RGB)
    

    test_images = {
        "votre_image": image_rgb
    }

    # Pour la démo, créons une image avec différents angles
    # test_images = {
    #     "bon_angle": create_good_angle_image(),
    #     "angle_incliné": create_tilted_angle_image(),
    #     "angle_latéral": create_side_angle_image()
    # }
    
    for name, test_image in test_images.items():
        print(f"\n{'='*50}")
        print(f"Analyse : {name}")
        print(f"{'='*50}")
        
        # Évaluation de la qualité
        quality_report = vision.evaluate_angle_quality(test_image)
        
        print(f"Qualité: {quality_report['quality']} (score: {quality_report['score']:.2f})")
        print(f"Score angle: {quality_report['angle_score']:.2f}")
        print(f"Score symétrie: {quality_report['symmetry_score']:.2f}")
        
        if quality_report['issues']:
            print("Problèmes détectés:")
            for issue in quality_report['issues']:
                print(f"  • {issue}")
        
        # Conseils de prise de vue
        if quality_report['quality'] in ['poor', 'good']:
            guidance = vision.get_photography_guidance(quality_report)
            for advice in guidance:
                print(advice)

def create_good_angle_image():
    """Crée une image avec un bon angle (vue de dessus)"""
    size = 400
    img = np.ones((size, size, 3), dtype=np.uint8) * 255
    
    # Échiquier bien carré
    square_size = size // 8
    for i in range(8):
        for j in range(8):
            color = [181, 136, 99] if (i + j) % 2 else [240, 217, 181]
            x1, y1 = j * square_size, i * square_size
            x2, y2 = (j + 1) * square_size, (i + 1) * square_size
            img[y1:y2, x1:x2] = color
    
    return img

def create_tilted_angle_image():
    """Crée une image avec un angle incliné"""
    size = 400
    img = np.ones((size, size, 3), dtype=np.uint8) * 255
    
    # Échiquier avec perspective
    for i in range(8):
        for j in range(8):
            color = [181, 136, 99] if (i + j) % 2 else [240, 217, 181]
            # Ajout d'une distortion de perspective
            x1 = int(j * (size//8) * (0.8 + 0.2 * i/8))
            y1 = int(i * (size//8) * (0.9 + 0.1 * j/8))
            x2 = int((j + 1) * (size//8) * (0.8 + 0.2 * i/8))
            y2 = int((i + 1) * (size//8) * (0.9 + 0.1 * j/8))
            
            if x1 < size and y1 < size and x2 < size and y2 < size:
                img[y1:y2, x1:x2] = color
    
    return img

def create_side_angle_image():
    """Crée une image avec un angle latéral"""
    size = 400
    img = np.ones((size, size, 3), dtype=np.uint8) * 255
    
    # Forte perspective
    for i in range(8):
        for j in range(8):
            color = [181, 136, 99] if (i + j) % 2 else [240, 217, 181]
            x1 = int(j * (size//8) * (0.5 + 0.5 * i/8))
            y1 = int(i * (size//8) * 0.7)
            x2 = int((j + 1) * (size//8) * (0.5 + 0.5 * i/8))
            y2 = int((i + 1) * (size//8) * 0.7)
            
            if x1 < size and y1 < size and x2 < size and y2 < size:
                img[y1:y2, x1:x2] = color
    
    return img

if __name__ == "__main__":
    complete_example()