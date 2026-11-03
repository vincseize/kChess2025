# CharlyChess

CharlyChess is a responsive, local chess application built with PHP, JavaScript, and CSS. It supports human-vs-human games, chess bots, Chess960, and a standalone chess clock.

## Run locally with XAMPP

1. Place the repository in the XAMPP `htdocs` directory.
2. Start Apache from the XAMPP Control Panel.
3. Open `http://localhost/kChess2025/php/` in a browser.

No separate package installation or database setup is required for the web app.

## Game modes

- **Human vs Human:** choose a time control before starting. The clock stays stopped until **Start Game** is pressed.
- **Chess960:** displays the randomized position number and uses the same time-control selector and explicit start behavior.
- **Bots:** choose a bot level and side; bot clock settings come from `php/config/game-config.json`.
- **Clock:** open the standalone clock from the home page. Choose a preset or enter a custom time control. Black presses their clock to start; players tap the active clock after each move.

Preset and custom time controls use the `minutes + increment in seconds` format. The most recently selected control is remembered in browser local storage and reused by Human vs Human, Chess960, and the standalone clock. Custom time controls are also saved locally and can be removed from the standalone clock's settings.

## Configuration and project layout

- `php/index.php` — web app home and new-game setup.
- `php/app.php` — game page.
- `php/clock.php` — standalone chess clock.
- `php/config/game-config.json` — app settings, colors, translations, and bot clocks.
- `php/js/kchess/` — chess engine, validators, bot logic, and UI.
- `python/` — separate Tkinter/Python chess project and image-to-FEN utilities; see [python/README.md](python/README.md).

## Languages

The web app's French and English text is maintained in the `lang` section of `php/config/game-config.json`. The standalone clock has its own `clock` translation group in each language.
