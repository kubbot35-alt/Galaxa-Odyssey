# Galaxa Odyssey

Futuristic arcade space shooter web game rebuilt with React, TypeScript, Vite, HTML5 Canvas, and Web Audio API.

## Features

- **Futuristic Main Menu**: Retro space arcade styling with artwork, pilot profile, high scores, and credits.
- **Game Modes**: Solo (1 Player) and Co-op Duel (2 Players) on a shared screen.
- **Difficulty Selection**: `EASY`, `NORMAL`, and `HARD` mission profiles adjusting enemy aggression, fire rates, formations, and hazards.
- **Continuous Fire & Weapon Tiers**:
  - Hold `SPACE` (Player 1) or `F` (Player 2) for rapid-fire plasma cannons.
  - Upgrades for Dual Cannons and Triple Spread Cannons.
- **Hangar Ship Upgrades**: Purchase weapon upgrades, Double Lives, and Infinite Lives using earned mission points.
- **Alien Formations & Dive Bombers**: Standard and Elite alien fighters with oscillating formations, dynamic dive sweeps, and laser attacks.
- **Lethal Falling Bombs**: Heavy red planetary bombs with warning aura that can be destroyed with gunfire.
- **Power-Ups**: Drops for Extra Lives (`L`) and Weapon Upgrades (`W`).
- **Retro Web Audio Synthesizer**: Square-wave 16-note looping menu music, laser shoot sweep, explosion noise bursts, and power-up arpeggios.
- **Visual FX**: Particle spark explosions, dynamic shield aura, and scrolling parallax starfield.
- **Tactical Pause & Persistent Save**: Progress auto-saved to `localStorage` upon pausing or exiting, with instant resume.

## Controls

### Desktop Keyboard

| Key | Action |
|---|---|
| `←` / `→` | Move Player 1 Ship |
| `SPACE` | Fire Player 1 Weapons (hold for continuous fire) |
| `A` / `D` | Move Player 2 Ship (Co-op Mode) |
| `F` | Fire Player 2 Weapons (Co-op Mode) |
| `ESC` | Pause game / Resume / Return |
| `↑` / `↓` | Navigate Menu selections |
| `ENTER` | Confirm selection / Save & Return |

*Mouse and touch clicking are also supported across all menus and gameplay.*

### Mobile & Touch

On-screen virtual arcade touch buttons for steering, continuous firing, and tactical pause.

## Tech Stack

- **Runtime**: Node.js 22
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API (realtime synthesizer)
- **Rendering**: HTML5 Canvas (60 FPS)
