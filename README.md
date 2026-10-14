# Galaxa Odyssey

Futuristic arcade space shooter web game rebuilt with React, TypeScript, Vite, HTML5 Canvas, and Web Audio API.

## Features

- **Futuristic Main Menu & Hangar**: Retro space arcade styling with artwork, pilot profile, high scores, credits, and interactive Achievement Badges overlay.
- **Weapon Power-Up Tokens & Dynamic Weapon Modes**:
  - **Standard Blaster**: High-velocity forward plasma bolts (Single, Dual, and Triple barrel upgrades).
  - **🔱 Triple Shot**: 3-way wide-angle fan volleys cutting across incoming alien diving trajectories.
  - **⚡ Hyper Laser Beam**: Continuous piercing high-energy coherent laser column that melts through lines of enemies and detonates falling bombs instantly.
  - **🔮 Plasma Spread**: Heavy 5-way destructive arc bolts vaporizing enemy clusters.
  - **Power-Up Tokens**: Enemies drop glowing cyber tokens (`⚡ LSR`, `🔱 3X`, `🔮 SPR`, `🛡️ SHD`, `❤️ 1UP`, `⭐ +LVL`) that unlock and recharge weapon modes in real time.
- **HUD Weapon Selector & Energy Gauge**: Switch between unlocked weapon modes using on-screen selector tabs, number keys (`1`, `2`, `3`, `4`), or cycle keys (`Q` / `E`).
- **Tactical Flight Achievements**: Unlock visual badges (e.g., *First Wave Defeated*, *Laser Overcharge*, *Triple Threat*, *Boss Slayer*, *Bomb Defuser*) with credit rewards displayed in a dedicated Main Menu overlay.
- **Game Modes**: Solo (1 Player) and Co-op Duel (2 Players) on a shared screen.
- **Difficulty Selection**: `EASY`, `NORMAL`, and `HARD` mission profiles adjusting enemy aggression, fire rates, formations, and hazards.
- **Continuous Fire & Weapon Tiers**: Hold `SPACE` (Player 1) or `F` (Player 2) for rapid plasma fire or continuous laser stream.
- **Lethal Falling Bombs**: Heavy red planetary bombs with warning aura that can be destroyed mid-air.
- **Retro Web Audio Synthesizer**: Square-wave looping menu melody, laser beam discharge hum, punchy triple volleys, explosion bursts, and token pickup arpeggios.
- **Visual FX**: Particle spark explosions, dynamic shield aura, laser beam plasma sheath, and scrolling parallax starfield.
- **Tactical Pause & Persistent Save**: Progress auto-saved to `localStorage` upon pausing or exiting, with instant resume.

## Controls

### Desktop Keyboard

| Key | Action |
|---|---|
| `←` / `→` | Move Player 1 Ship |
| `SPACE` | Fire Active Weapon (hold for continuous firing / laser stream) |
| `1`, `2`, `3`, `4` | Select Weapon Mode (Blaster, Triple Shot, Laser Beam, Plasma Spread) |
| `Q` / `E` | Cycle previous / next unlocked weapon mode |
| `A` / `D` | Move Player 2 Ship (Co-op Mode) |
| `F` | Fire Player 2 Weapons (Co-op Mode) |
| `B` | Open Achievement Badges & Commendations overlay |
| `ESC` | Pause game / Resume / Return |
| `↑` / `↓` | Navigate Menu selections |
| `ENTER` | Confirm selection / Save & Return |

*Mouse and touch clicking are also supported across all menus, weapon selector tabs, and gameplay.*

### Mobile & Touch

On-screen virtual arcade touch buttons for steering, firing, weapon mode selection, and tactical pause.

## Tech Stack

- **Runtime**: Node.js 22
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API (realtime synthesizer)
- **Rendering**: HTML5 Canvas (60 FPS)
