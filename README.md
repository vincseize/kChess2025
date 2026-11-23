# CharlyChess

CharlyChess V1.7 is a responsive, local chess application built with PHP, JavaScript, and CSS.
It supports human-vs-human games, chess bots, Chess960, and a standalone chess clock.
The web app is available in French, English, Spanish, and German.

## Run locally with XAMPP

1. Place the repository in the XAMPP `htdocs` directory.
2. Start Apache from the XAMPP Control Panel.
3. Open `http://localhost/kChess2025/php/` in a browser.

No separate package installation or database setup is required for the web app.
The application uses PHP, JavaScript, and browser storage.

## Game modes and clocks

- **Human vs Human:** choose a time control before starting. The clock stays stopped until **Start Game** is pressed.
- **Human vs Human 960:** choose either side or a random side; the board uses a randomized Chess960 starting position and the same time-control selector and explicit start behavior.
- **Chess960 home shortcut:** opens a game with a newly randomized Chess960 position.
- **Bots:** choose a bot level and side. The level sets the game duration in minutes (level 1 = 1 minute, level 2 = 2 minutes, and so on), with no increment.
- **Level 6:** builds on Level 5's positional strategy and additionally rewards control of the central squares.
- **Clock:** open the standalone clock from the home page. Choose a preset or enter a custom time control. Black presses their clock to start; players tap the active clock after each move.

Preset and custom time controls use the `minutes + increment in seconds` format.
The most recently selected control is remembered in browser local storage and reused by Human vs Human, Chess960, and the standalone clock.
Custom time controls are also saved locally and can be removed from the standalone clock's settings.

Human vs Human and Chess960 remember their last selected cadence in browser local storage.
The standalone clock remembers its selected cadence and custom cadences separately; saved custom cadences can be removed from its settings.

Bot durations are defined by the game level in `php/js/kchess/ui/chess-game-ui-timer.js`; `bots_clock` is not used to select the bot game's initial time.

## Languages and documentation

The interface supports French (`fr`), English (`en`), Spanish (`es`), and German (`de`).
The home-page language selector changes the language and saves it in the PHP session and a cookie.
The `<html lang>` attribute follows the selected locale.

Translations live in `php/config/game-config.json`, under `lang`.
Each locale has the same keys, including a nested `clock` group and nested bot titles/descriptions.
When adding or editing a locale:

1. Keep the key structure aligned with the other locales.
2. Translate the home page, game controls, statuses, promotion choices, bot descriptions, and every clock message.
3. Keep placeholders such as `{player}`, `{minutes}`, and `{increment}` unchanged.
4. Add its native name and flag to the language-name map in `php/newGame.php`.
5. Validate that the JSON parses and that all locales have matching key paths.

## Project layout

- `php/index.php` — web app home and new-game setup.
- `php/app.php` — game page and responsive layouts.
- `php/clock.php` — standalone chess clock.
- `php/config/game-config.json` — app settings, colors, translations, and bot metadata.
- `php/js/kchess/` — chess engine, validators, bot logic, and UI.
- `php/css/kchess/` — board, clock, responsive, and modal styles.
- `python/` — separate Tkinter/Python chess project and image-to-FEN utilities; see [python/README.md](python/README.md).
- `docs/` — application guide, audits, bot decision flows, and chess reference material.

## How a move is played

The regular game uses one move path for both human clicks and bot moves:

1. The board interface forwards the selected squares to `ChessGameCore.handleSquareClick`.
2. `ChessGameMoveHandler` checks the move against the legal moves from `MoveValidator`.
3. `MoveExecutor` applies the move, updates the game state, and completes the turn.

Use this path when adding a new way to play a move.
Do not update the board or switch turns directly.
The bot stress-test harness has its own isolated simulation code and is not the regular game path.

`MoveValidator` is also the single source for the side-to-move legal moves and the check, checkmate, and stalemate decision.
`ChessEngine` only parses FEN positions and detects attacked squares/checks; it does not generate legal moves.
`GameStatusManager` uses the validator's result for end-of-game and UI behavior.

## Board position and display

`BoardPosition` is the source of truth for the 8 × 8 grid and the pieces on it.
It can be read or changed without a board element in the page, which keeps rules, FEN generation, and simulations independent from HTML.

`ChessBoard` owns only the board's square elements and rendering.
`ChessGame` creates one `BoardPosition` and passes it to `ChessBoard`; normal game moves use the board's `getPiece`/`setPiece` interface so the position and display stay synchronized.
Use `renderPiece` only to refresh a square's appearance, not to change the position.

## Audits and reference documentation

- [Audit des bots d'échecs](docs/AUDIT_BOTS.md) — résultats des confrontations entre niveaux, protocole, limites et recommandations.
- [Schémas de décision des bots](docs/BOTS_DECISION_FLOWS.md) — fonctionnement actuel des niveaux 1, 2, 3, 4, 5, 6 et 16, sans changement de stratégie.