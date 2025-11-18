import tkinter as tk
from tkinter import PhotoImage
import os

class ChessApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Mon Application d'Échecs")
        self.root.geometry("600x400")
        self.root.resizable(False, False)

        # ✅ Barre de menu personnalisée (25 px de haut)
        self.menu_frame = tk.Frame(root, bg="#ddd", height=25)
        self.menu_frame.pack(fill="x", side="top")
        self.menu_frame.pack_propagate(False)

        # ✅ Chargement du logo
        logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../", "images", "icon.png"))
        try:
            original_img = PhotoImage(file=logo_path)
            self.logo_img = original_img.subsample(
                max(original_img.width() // 32, 1),
                max(original_img.height() // 32, 1)
            )
        except Exception as e:
            print(f"Erreur de chargement du logo : {e}")
            self.logo_img = None

        # ✅ Affichage du logo
        if self.logo_img:
            logo_label = tk.Label(self.menu_frame, image=self.logo_img, bg="#ddd")
            logo_label.pack(side="left", padx=5)
        else:
            logo_label = tk.Label(self.menu_frame, text="[Logo]", bg="#ddd")
            logo_label.pack(side="left", padx=5)

        # ✅ Menus cliquables
        for label in ["Menu1", "Menu2", "Menu3"]:
            menu_btn = tk.Menubutton(self.menu_frame, text=label, bg="#ddd", relief="flat")
            menu_btn.menu = tk.Menu(menu_btn, tearoff=0)
            menu_btn.menu.add_command(label=f"Action {label}")
            menu_btn.config(menu=menu_btn.menu)
            menu_btn.pack(side="left", padx=10)

        # ✅ Frame grise sous le menu
        self.content_frame = tk.Frame(root, bg="#ccc")
        self.content_frame.pack(fill="both", expand=True)

if __name__ == "__main__":
    root = tk.Tk()
    app = ChessApp(root)
    root.mainloop()
