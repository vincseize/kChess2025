#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
arbo.py - Générateur d'arborescence 100% ASCII (compatible Windows).
"""
import os
import sys

# Dossiers à ignorer
EXCLUDE_DIRS = {
    'node_modules', '.git', '.idea', '.vscode',
    'vendor', 'logs', 'tmp', 'cache',
    'TEMPLATE_LAYOUT', 'templateOLD', 'tests',
    'fonts', 'webfonts', '__pycache__', 'venv', 'env',
    '_SANDBOX'
}

# Fichiers à ignorer
EXCLUDE_FILES = {
    'arbo.txt', 'arbo.php', 'arbo.py', 'arbo.bat',
    '.DS_Store', 'Thumbs.db', 'desktop.ini'
}

OUTPUT_FILE = "arbo.txt"

def print_tree(directory, out_file, prefix=""):
    if os.path.islink(directory):
        return

    try:
        entries = sorted(
            [e for e in os.listdir(directory) 
             if e not in EXCLUDE_DIRS and e not in EXCLUDE_FILES],
            key=lambda x: (not os.path.isdir(os.path.join(directory, x)), x.lower())
        )
    except PermissionError:
        return

    for i, entry in enumerate(entries):
        path = os.path.join(directory, entry)
        is_last = (i == len(entries) - 1)
        
        # ASCII uniquement
        branch = "\\-- " if is_last else "|-- "
        
        if os.path.isdir(path) and not os.path.islink(path):
            out_file.write(f"{prefix}{branch}[D] {entry}\n")
            next_prefix = prefix + ("    " if is_last else "|   ")
            print_tree(path, out_file, next_prefix)
        else:
            out_file.write(f"{prefix}{branch}[F] {entry}\n")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))
    output_path = os.path.join(script_dir, OUTPUT_FILE)
    
    try:
        with open(output_path, 'w', encoding='ascii', errors='replace') as f:
            f.write(f"Arborescence du dossier : {project_root}\n\n")
            f.write(f"[ROOT] {os.path.basename(project_root)}/\n")
            print_tree(project_root, f)
        print(f"OK - Fichier '{OUTPUT_FILE}' cree.")
    except Exception as e:
        print(f"ERREUR : {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()