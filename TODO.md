# TODO: All Games - Game Player Only View

## Goal
For ALL games, make sure only the game player is viewable.
Remove the fullscreen button and add a home button.

## Steps
- [x] Update `games/fnaf-1.html` through `games/fnaf-4.html`: remove stylesheet link, add home button, keep only game player
- [x] Create `transform_games_player_only.js` conversion script
- [x] Run script to convert all remaining game wrapper pages to game-player-only view
- [x] Verify converted pages (standard iframe games + special cases: fnf, cookie-clicker, matching-game)
- [x] Update `games/jome.js`: remove fullscreen button code, only add home button when missing
- [x] Update `attach_jome_to_wrappers.js`: skip pages that already have `home-btn` / game-player-only layout
- [x] Add "What's New" entries in `updates_render.js` for the clean game player and FNAF cleanup updates
- [x] Remove "Website renamed" and "New games & bug fixes" from the What's New popup (only the 2 new game-player updates remain)
- [x] Add "New games added" entry back, mentioning the newly added games (1 on 1 Soccer, Drive Mad)
- [x] Add result popup to the Random Game Wheel that shows which game it landed on (with Play Now and Spin Again buttons)

