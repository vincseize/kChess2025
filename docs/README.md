# CharlyChess web application

This directory contains supporting chess reference material. The web application documentation is maintained here alongside those resources; the repository setup overview is in the root [README](../README.md).

## Launching the application

1. Put the repository under XAMPP's `htdocs` directory.
2. Start Apache.
3. Open `http://localhost/kChess2025/php/`.

The application uses PHP, JavaScript, and browser storage. It does not require a database or a package installation.

## Game modes and clocks

- **Bot:** the selected bot level determines the initial clock in minutes: level 1 gets 1 minute, level 2 gets 2 minutes, and so forth. Bot games use a zero-second increment.
- **Human vs Human:** select a cadence before starting; the clocks remain stopped until the start button is pressed.
- **Human vs Human 960:** select a side (or a random side), then select a cadence and explicitly start the game. A random Chess960 starting position is generated for each new game.
- The Chess960 button below **Clock** on the home page opens a game with a random starting position.
- **Clock:** the standalone clock offers built-in and custom cadences. Black starts by pressing their clock; after a move, press the active player's clock.

Human vs Human and Chess960 remember their last selected cadence in browser local storage. The standalone clock remembers its selected cadence and custom cadences separately; saved custom cadences can be removed from its settings.

## Languages

The interface supports French (`fr`), English (`en`), Spanish (`es`), and German (`de`). The home-page language selector changes the language and saves it in the PHP session and a cookie. The `<html lang>` attribute follows the selected locale.

Translations live in `php/config/game-config.json`, under `lang`. Each locale has the same keys, including a nested `clock` group and nested bot titles/descriptions. When adding or editing a locale:

1. Keep the key structure aligned with the other locales.
2. Translate the home page, game controls, statuses, promotion choices, bot descriptions, and every clock message.
3. Keep placeholders such as `{player}`, `{minutes}`, and `{increment}` unchanged.
4. Add its native name and flag to the language-name map in `php/newGame.php`.
5. Validate that the JSON parses and that all locales have matching key paths.

Bot durations are defined by the game level in `php/js/kchess/ui/chess-game-ui-timer.js`; `bots_clock` is not used to select the bot game's initial time.

## Main files

- `php/index.php` — home page and game setup.
- `php/app.php` — game page and responsive layouts.
- `php/clock.php` — standalone chess clock.
- `php/config/game-config.json` — settings, theme, locales, and bot metadata.
- `php/js/kchess/` — game engine, move validation, bots, and interface.
- `php/css/kchess/` — board, clock, responsive, and modal styles.
