# AGENTS.md — kChess2025

## Checklist « mode dev app » — toujours vérifier

Au début de chaque session (et avant chaque release), vérifier que ces éléments existent et sont à jour :

1. **Version** — source unique : ds un json
2. **README.md** — à jour : structure, fonctionnalités récentes, conventions (`<?php // /chemin` en tête de fichier).
3. **Manifest PWA** — `manifest.php` (généré depuis `config/app.json`), référencé par
   `includes/header.php` avec les icônes `assets/icon.svg` / `assets/icon-maskable.svg`.
4. **.gitignore** — à jour 
5. **_SANDBOX/** — au minimum `arbo.bat` (cf. les scripts existants du dossier), `.htaccess` interdisant l'accès web.
6. **.htaccess** — racine (`Options -Indexes`, blocage des fichiers cachés, `DirectoryIndex`),
   `_SANDBOX/.htaccess` « deny all », `db/.htaccess` « deny all ».
7. **Audit sécurité** — `AUDIT_SECURITE.md` : à re-vérifier après toute évolution sensible
   (auth, sessions, uploads, CSRF) et à re-dater à chaque version ; sinon le signaler comme périmé.
8. **Doc chmod & déploiement** — `README.md` (droits fichiers/dossiers, URLs local/prod).
9. **Lien GitHub** — ds readme


## Règles dures

- Ne **jamais** committer : `*.sqlite*`, `.env`, 
- Garder la convention d'en-tête de fichier : `<?php // /chemin/du/fichier.php`.


