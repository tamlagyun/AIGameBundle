# HeroBattleBeasts Game Design

## 1. Project Direction

`HeroBattleBeasts` is a cartoon 2D side-scrolling action game prototype. The first playable version should combine:

- Contra-style run-and-gun action: fast movement, jumping, shooting, enemy waves, and weapon pickups.
- MapleStory-style platform adventure: layered platforms, cute monsters, coins, simple exploration, and a clear stage goal.

The first version should be small, playable, and easy to expand.

## 2. Technical Route

The first implementation should use a pure Web prototype:

- HTML for the game shell.
- CSS for layout and cartoon presentation.
- JavaScript with Canvas for gameplay rendering.
- No external runtime dependency for the first playable version.

Reasoning:

- It can run quickly in a browser.
- It avoids blocking on a full Cocos Creator project setup.
- It keeps the first prototype easy to inspect, test, and revise.
- Cocos Creator can still be considered later if the prototype direction is approved.

## 3. First Playable Scope

The first playable version should include one short level with these behaviors:

- Player can move left and right.
- Player can jump and land on platforms.
- Player can shoot horizontally.
- Basic enemies patrol or move toward the player.
- Bullets can defeat enemies.
- Enemy contact damages the player.
- Coins or gems can be collected.
- A weapon pickup temporarily improves shooting.
- Reaching the exit or defeating enough enemies completes the level.
- Losing all health shows a retry state.

This scope is intentionally narrow. It proves the combined gameplay loop before adding menus, multiple levels, bosses, mobile controls, audio, or persistent progression.

## 4. Cartoon Visual Direction

The first visual theme should be a bright beast forest:

- Hero: small cartoon adventurer with a toy-like blaster.
- Enemies: cute beast monsters, such as round slimes, horned critters, and flying bugs.
- Level: grass platforms, tree roots, wooden bridges, and soft cloud shapes.
- Pickups: shiny coins, colorful energy gems, and a glowing weapon badge.
- Tone: cheerful, readable, and action-focused.

This theme supports both MapleStory-like platform charm and Contra-like combat readability.

## 5. Core Game Loop

1. Player enters a short side-scrolling level.
2. Player jumps across platforms while avoiding enemies.
3. Player shoots enemies and collects coins.
4. Player picks up a temporary weapon boost.
5. Player reaches the exit after clearing the main encounter.
6. Game shows win, lose, or retry state.

## 6. Controls

Desktop controls for the first prototype:

- `A` / `ArrowLeft`: move left.
- `D` / `ArrowRight`: move right.
- `W` / `ArrowUp` / `Space`: jump.
- `J` / `Z`: shoot.
- `R`: restart after win or loss.

Mobile touch controls are out of scope for the first playable version unless confirmed in a later step.

## 7. Main Entities

### Player

- Position, velocity, facing direction.
- Health.
- Grounded state.
- Weapon state.
- Invulnerability window after damage.

### Enemy

- Position, size, health.
- Movement behavior.
- Contact damage.
- Defeated state.

### Bullet

- Position and velocity.
- Owner.
- Damage.
- Lifetime.

### Pickup

- Type: coin, gem, weapon boost, health.
- Position.
- Collected state.

### Level

- Platforms.
- Spawn points.
- Enemy list.
- Pickup list.
- Exit area.

## 8. UI Requirements

The first prototype should display:

- Player health.
- Coin count.
- Enemy defeat count or objective progress.
- Current weapon state.
- Win/lose overlay with restart instruction.

The UI should stay compact and not block gameplay.

## 9. Implementation Steps After This Design

Recommended next steps:

1. Create the Web project skeleton: `index.html`, `src/`, `assets/`, and a local preview command or simple static file path.
2. Implement the core game loop and canvas renderer.
3. Add player movement, gravity, jumping, and platform collision.
4. Add shooting, bullets, enemies, and hit detection.
5. Add coins, weapon pickup, health, win/lose states, and HUD.
6. Add simple cartoon placeholder art using Canvas drawing or lightweight local assets.
7. Add repeatable verification for core gameplay logic where practical.

Each step must be planned and confirmed before implementation.

## 10. Out of Scope for First Playable Version

- Multiple levels.
- Boss fights.
- Save data.
- Mobile touch controls.
- Network features.
- Full Cocos Creator integration.
- Final production art.
- Audio and music.

These can be added after the first playable loop is working and approved.
