# CharlyChess

CharlyChess V1.2 is a responsive, local chess application built with PHP, JavaScript, and CSS. It supports human-vs-human games, chess bots, Chess960, and a standalone chess clock.

## Run locally with XAMPP

1. Place the repository in the XAMPP `htdocs` directory.
2. Start Apache from the XAMPP Control Panel.
3. Open `http://localhost/kChess2025/php/` in a browser.

No separate package installation or database setup is required for the web app.

## Game modes

- **Human vs Human:** choose a time control before starting. The clock stays stopped until **Start Game** is pressed.
- **Human vs Human 960:** choose either side or a random side; the board uses a randomized Chess960 starting position and the same time-control selector and explicit start behavior.
- **Chess960 home shortcut:** opens a game with a newly randomized Chess960 position.
- **Bots:** choose a bot level and side. The level sets the game duration in minutes (level 1 = 1 minute, level 2 = 2 minutes, and so on), with no increment.
- **Clock:** open the standalone clock from the home page. Choose a preset or enter a custom time control. Black presses their clock to start; players tap the active clock after each move.

Preset and custom time controls use the `minutes + increment in seconds` format. The most recently selected control is remembered in browser local storage and reused by Human vs Human, Chess960, and the standalone clock. Custom time controls are also saved locally and can be removed from the standalone clock's settings.

## Configuration and project layout

- `php/index.php` — web app home and new-game setup.
- `php/app.php` — game page.
- `php/clock.php` — standalone chess clock.
- `php/config/game-config.json` — app settings, colors, translations, and bot metadata.
- `php/js/kchess/` — chess engine, validators, bot logic, and UI.
- `python/` — separate Tkinter/Python chess project and image-to-FEN utilities; see [python/README.md](python/README.md).

## Languages and documentation

The web app is available in French, English, Spanish, and German. Select a language from the home-page menu; the choice is remembered in the session and a cookie. All interface strings, bot descriptions, pawn promotion, and the standalone clock are maintained in the `lang` section of `php/config/game-config.json`.

See [docs/README.md](docs/README.md) for the application guide, language configuration notes, and documentation for the web app.
