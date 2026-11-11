import sys
import json

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "missing_id"}))
        return

    fide_id = sys.argv[1].strip()

    try:
        from python_fide import FidePlayerClient, FidePlayerID
        
        client = FidePlayerClient()
        # On s'assure que l'ID est un entier
        player_id = FidePlayerID(fide_id=int(fide_id)) 
        
        opponents = client.get_opponents(player_id)
        
        games = []
        for opp in opponents:
            games.append({
                "opponent": opp.name,
                "country": opp.country
            })
        
        # On force l'encodage UTF-8 pour éviter les caractères bizarres
        print(json.dumps({"ok": True, "games": games}, ensure_ascii=False))
        
    except ImportError:
        print(json.dumps({"ok": False, "error": "Bibliothèque python_fide introuvable. Lancez : C:\\Python312\\python.exe -m pip install python-fide"}))
    except Exception as e:
        print(json.dumps({"ok": False, "error": f"Erreur Python: {str(e)}"}))

if __name__ == "__main__":
    main()