import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, PowerUp, PlayerState, Enemy } from '../game/GameEngine';
import {
  GameState,
  DifficultyLevel,
  DIFFICULTY_CONFIGS,
  EnemyType,
  PowerUpType,
  WeaponMode,
  WEAPON_MODE_CONFIGS,
  UpgradeOption,
  UPGRADE_CONFIGS,
  SettingsOption,
  SoundType,
} from '../types/game';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  BOMB_SIZE,
  POWERUP_TOKEN_SIZE,
  MAX_SHIELD,
  MAX_WEAPON_ENERGY,
  LASER_BEAM_WIDTH,
} from '../game/constants';
import { soundEngine } from '../audio/soundEngine';

interface GameCanvasProps {
  engine: GameEngine;
  onStateUpdate: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, onStateUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Asset images
  const player1Img = useRef<HTMLImageElement | null>(null);
  const player2Img = useRef<HTMLImageElement | null>(null);
  const menuBgImg = useRef<HTMLImageElement | null>(null);

  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload images
  useEffect(() => {
    let loadedCount = 0;
    const total = 3;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= total) setImagesLoaded(true);
    };

    const p1 = new Image();
    p1.src = '/ships/player-ship.png';
    p1.onload = checkLoaded;
    p1.onerror = checkLoaded;
    player1Img.current = p1;

    const p2 = new Image();
    p2.src = '/ships/player-ship-2.png';
    p2.onload = checkLoaded;
    p2.onerror = checkLoaded;
    player2Img.current = p2;

    const bg = new Image();
    bg.src = '/menu/menu-background.png';
    bg.onload = checkLoaded;
    bg.onerror = checkLoaded;
    menuBgImg.current = bg;
  }, []);

  // Main animation frame loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      engine.update();
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          draw(ctx);
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine, imagesLoaded]);

  // Click & Mouse interaction for Menu, Upgrades, Settings, Weapon Switching, etc.
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (engine.isAchievementsOpen) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;
      const scaleY = GAME_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // Handle weapon selector clicks during gameplay
      if (engine.gameState === GameState.PLAYING) {
        // Weapon Selector pills in HUD: y: 58..82, starting around x: 315
        if (y >= 56 && y <= 82) {
          const unlocked = engine.player1.unlockedWeaponModes;
          let currentX = 315;
          for (let i = 0; i < unlocked.length; i++) {
            const mode = unlocked[i];
            const cfg = WEAPON_MODE_CONFIGS[mode];
            const width = 80;
            if (x >= currentX && x <= currentX + width) {
              engine.setWeaponMode(mode);
              soundEngine.playSound(SoundType.SHOOT);
              onStateUpdate();
              return;
            }
            currentX += width + 6;
          }
        }
        return;
      }

      // Handle interactions per game state
      if (engine.gameState === GameState.MENU) {
        // Pilot bar badges button click (x: 380..525, y: 172..208)
        if (x >= 380 && x <= 525 && y >= 172 && y <= 208) {
          engine.openAchievements();
          onStateUpdate();
          return;
        }

        const hasSave = engine.hasSavedGame();
        const menuCount = hasSave ? 6 : 5;
        const cardStartY = hasSave ? 228 : 235;
        const cardGap = hasSave ? 58 : 64;

        for (let i = 0; i < menuCount; i++) {
          const cy = cardStartY + i * cardGap;
          if (x >= 140 && x <= 660 && y >= cy && y <= cy + 50) {
            handleMenuSelect(i, hasSave);
            return;
          }
        }
      } else if (engine.gameState === GameState.PLAYER_MODE_SELECTION) {
        if (x >= 140 && x <= 660) {
          if (y >= 210 && y <= 290) {
            engine.twoPlayerMode = false;
            engine.playerModeSelection = 0;
            engine.gameState = GameState.DIFFICULTY_SELECTION;
            onStateUpdate();
          } else if (y >= 310 && y <= 390) {
            engine.twoPlayerMode = true;
            engine.playerModeSelection = 1;
            engine.gameState = GameState.DIFFICULTY_SELECTION;
            onStateUpdate();
          } else if (y >= 490) {
            engine.gameState = GameState.MENU;
            onStateUpdate();
          }
        }
      } else if (engine.gameState === GameState.DIFFICULTY_SELECTION) {
        const levels = [DifficultyLevel.EASY, DifficultyLevel.NORMAL, DifficultyLevel.HARD];
        for (let i = 0; i < levels.length; i++) {
          const cy = 190 + i * 78;
          if (x >= 140 && x <= 660 && y >= cy && y <= cy + 60) {
            engine.difficultyLevel = levels[i];
            engine.difficultySelection = i;
            engine.startNewGame();
            onStateUpdate();
            return;
          }
        }
        if (y >= 500) {
          engine.gameState = GameState.MENU;
          onStateUpdate();
        }
      } else if (engine.gameState === GameState.UPGRADES) {
        for (let i = 0; i < UPGRADE_CONFIGS.length; i++) {
          const cy = 170 + i * 62;
          if (x >= 140 && x <= 660 && y >= cy && y <= cy + 52) {
            const up = UPGRADE_CONFIGS[i];
            if (up.id === UpgradeOption.RETURN) {
              engine.gameState = GameState.MENU;
            } else {
              engine.buyUpgrade(up.id);
            }
            onStateUpdate();
            return;
          }
        }
      } else if (engine.gameState === GameState.SETTINGS) {
        const opts = [SettingsOption.AUDIO, SettingsOption.PARTICLES, SettingsOption.RETURN];
        const ys = [205, 275, 345];
        for (let i = 0; i < opts.length; i++) {
          if (x >= 140 && x <= 660 && y >= ys[i] && y <= ys[i] + 55) {
            if (i === 0) engine.toggleAudio();
            else if (i === 1) engine.toggleParticles();
            else engine.gameState = GameState.MENU;
            onStateUpdate();
            return;
          }
        }
      } else if (engine.gameState === GameState.HOW_TO_PLAY) {
        if (y >= 490 || (x >= 140 && x <= 660 && y >= 435 && y <= 495)) {
          engine.gameState = GameState.MENU;
          onStateUpdate();
        }
      } else if (engine.gameState === GameState.PAUSED) {
        if (y >= 300 && y <= 335) {
          engine.resumeGame();
          onStateUpdate();
        } else if (y >= 340 && y <= 375) {
          engine.returnToMenu();
          onStateUpdate();
        }
      } else if (engine.gameState === GameState.GAMEOVER) {
        engine.returnToMenu();
        onStateUpdate();
      }
    },
    [engine, onStateUpdate]
  );

  const handleMenuSelect = (index: number, hasSave: boolean) => {
    let action = index;
    if (hasSave) {
      if (index === 0) {
        engine.loadSavedGame();
        onStateUpdate();
        return;
      }
      action = index - 1;
    }

    if (action === 0) {
      engine.gameState = GameState.PLAYER_MODE_SELECTION;
    } else if (action === 1) {
      engine.openAchievements();
    } else if (action === 2) {
      engine.gameState = GameState.UPGRADES;
    } else if (action === 3) {
      engine.gameState = GameState.SETTINGS;
    } else if (action === 4) {
      engine.gameState = GameState.HOW_TO_PLAY;
    }
    onStateUpdate();
  };

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (engine.soundEnabled && engine.gameState === GameState.MENU) {
        soundEngine.startMenuMusic();
      }

      if (engine.isAchievementsOpen) {
        if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
          engine.closeAchievements();
          onStateUpdate();
        }
        return;
      }

      if ((e.key === 'b' || e.key === 'B') && engine.gameState === GameState.MENU) {
        engine.toggleAchievements();
        onStateUpdate();
        return;
      }

      // In-game weapon mode switching
      if (engine.gameState === GameState.PLAYING) {
        if (e.key === '1') {
          engine.setWeaponMode(WeaponMode.STANDARD);
          onStateUpdate();
        } else if (e.key === '2') {
          engine.setWeaponMode(WeaponMode.TRIPLE_SHOT);
          onStateUpdate();
        } else if (e.key === '3') {
          engine.setWeaponMode(WeaponMode.LASER_BEAM);
          onStateUpdate();
        } else if (e.key === '4') {
          engine.setWeaponMode(WeaponMode.PLASMA_SPREAD);
          onStateUpdate();
        } else if (e.key === 'q' || e.key === 'Q') {
          engine.cycleWeaponMode(-1);
          onStateUpdate();
        } else if (e.key === 'e' || e.key === 'E') {
          engine.cycleWeaponMode(1);
          onStateUpdate();
        }
      }

      if (e.key === 'ArrowLeft') {
        engine.player1.movingLeft = true;
      } else if (e.key === 'ArrowRight') {
        engine.player1.movingRight = true;
      } else if (e.key === ' ' || e.code === 'Space') {
        engine.spaceHeld = true;
        if (engine.gameState === GameState.PLAYING && engine.fireCooldown === 0) {
          engine.firePlayer1();
        }
        e.preventDefault();
      }

      // Player 2 controls (A / D / F)
      if (e.key === 'a' || e.key === 'A') {
        if (engine.player2) engine.player2.movingLeft = true;
      } else if (e.key === 'd' || e.key === 'D') {
        if (engine.player2) engine.player2.movingRight = true;
      } else if (e.key === 'f' || e.key === 'F') {
        engine.secondPlayerFireHeld = true;
        if (engine.gameState === GameState.PLAYING && engine.secondPlayerFireCooldown === 0) {
          engine.firePlayer2();
        }
      }

      // Pause toggle
      if (e.key === 'Escape') {
        if (engine.gameState === GameState.PLAYING) {
          engine.pauseGame();
          onStateUpdate();
        } else if (engine.gameState === GameState.PAUSED) {
          engine.resumeGame();
          onStateUpdate();
        } else if (
          engine.gameState === GameState.PLAYER_MODE_SELECTION ||
          engine.gameState === GameState.DIFFICULTY_SELECTION ||
          engine.gameState === GameState.UPGRADES ||
          engine.gameState === GameState.SETTINGS ||
          engine.gameState === GameState.HOW_TO_PLAY
        ) {
          engine.gameState = GameState.MENU;
          onStateUpdate();
        }
      }

      // Enter key actions
      if (e.key === 'Enter') {
        if (engine.gameState === GameState.PAUSED) {
          engine.returnToMenu();
          onStateUpdate();
        } else if (engine.gameState === GameState.GAMEOVER) {
          engine.returnToMenu();
          onStateUpdate();
        } else if (engine.gameState === GameState.MENU) {
          const hasSave = engine.hasSavedGame();
          handleMenuSelect(engine.menuSelection, hasSave);
        } else if (engine.gameState === GameState.PLAYER_MODE_SELECTION) {
          engine.twoPlayerMode = engine.playerModeSelection === 1;
          engine.gameState = GameState.DIFFICULTY_SELECTION;
          onStateUpdate();
        } else if (engine.gameState === GameState.DIFFICULTY_SELECTION) {
          const levels = [DifficultyLevel.EASY, DifficultyLevel.NORMAL, DifficultyLevel.HARD];
          engine.difficultyLevel = levels[engine.difficultySelection] || DifficultyLevel.NORMAL;
          engine.startNewGame();
          onStateUpdate();
        } else if (engine.gameState === GameState.UPGRADES) {
          const selected = UPGRADE_CONFIGS[engine.upgradeSelection];
          if (selected) {
            if (selected.id === UpgradeOption.RETURN) {
              engine.gameState = GameState.MENU;
            } else {
              engine.buyUpgrade(selected.id);
            }
            onStateUpdate();
          }
        } else if (engine.gameState === GameState.SETTINGS) {
          if (engine.settingsSelection === 0) engine.toggleAudio();
          else if (engine.settingsSelection === 1) engine.toggleParticles();
          else engine.gameState = GameState.MENU;
          onStateUpdate();
        } else if (engine.gameState === GameState.HOW_TO_PLAY) {
          engine.gameState = GameState.MENU;
          onStateUpdate();
        }
      }

      // Menu arrow navigation
      if (e.key === 'ArrowUp') {
        if (engine.gameState === GameState.MENU) {
          const count = engine.hasSavedGame() ? 6 : 5;
          engine.menuSelection = (engine.menuSelection - 1 + count) % count;
        } else if (engine.gameState === GameState.DIFFICULTY_SELECTION) {
          engine.difficultySelection = (engine.difficultySelection - 1 + 3) % 3;
        } else if (engine.gameState === GameState.PLAYER_MODE_SELECTION) {
          engine.playerModeSelection = (engine.playerModeSelection - 1 + 2) % 2;
        } else if (engine.gameState === GameState.UPGRADES) {
          engine.upgradeSelection = (engine.upgradeSelection - 1 + UPGRADE_CONFIGS.length) % UPGRADE_CONFIGS.length;
        } else if (engine.gameState === GameState.SETTINGS) {
          engine.settingsSelection = (engine.settingsSelection - 1 + 3) % 3;
        }
      } else if (e.key === 'ArrowDown') {
        if (engine.gameState === GameState.MENU) {
          const count = engine.hasSavedGame() ? 6 : 5;
          engine.menuSelection = (engine.menuSelection + 1) % count;
        } else if (engine.gameState === GameState.DIFFICULTY_SELECTION) {
          engine.difficultySelection = (engine.difficultySelection + 1) % 3;
        } else if (engine.gameState === GameState.PLAYER_MODE_SELECTION) {
          engine.playerModeSelection = (engine.playerModeSelection + 1) % 2;
        } else if (engine.gameState === GameState.UPGRADES) {
          engine.upgradeSelection = (engine.upgradeSelection + 1) % UPGRADE_CONFIGS.length;
        } else if (engine.gameState === GameState.SETTINGS) {
          engine.settingsSelection = (engine.settingsSelection + 1) % 3;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        engine.player1.movingLeft = false;
      } else if (e.key === 'ArrowRight') {
        engine.player1.movingRight = false;
      } else if (e.key === ' ' || e.code === 'Space') {
        engine.spaceHeld = false;
        engine.player1.isLaserActive = false;
      }

      if (e.key === 'a' || e.key === 'A') {
        if (engine.player2) engine.player2.movingLeft = false;
      } else if (e.key === 'd' || e.key === 'D') {
        if (engine.player2) engine.player2.movingRight = false;
      } else if (e.key === 'f' || e.key === 'F') {
        engine.secondPlayerFireHeld = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, onStateUpdate]);

  // Canvas drawing routines
  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.imageSmoothingEnabled = true;

    // 1. Background
    const bgGrad = ctx.createLinearGradient(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bgGrad.addColorStop(0, '#03081c');
    bgGrad.addColorStop(1, '#0e082a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Nebula glows
    const rad1 = ctx.createRadialGradient(100, 290, 0, 100, 290, 300);
    rad1.addColorStop(0, 'rgba(35, 90, 190, 0.12)');
    rad1.addColorStop(1, 'rgba(35, 90, 190, 0)');
    ctx.fillStyle = rad1;
    ctx.beginPath();
    ctx.arc(100, 290, 300, 0, Math.PI * 2);
    ctx.fill();

    const rad2 = ctx.createRadialGradient(700, 450, 0, 700, 450, 280);
    rad2.addColorStop(0, 'rgba(160, 50, 210, 0.1)');
    rad2.addColorStop(1, 'rgba(160, 50, 210, 0)');
    ctx.fillStyle = rad2;
    ctx.beginPath();
    ctx.arc(700, 450, 280, 0, Math.PI * 2);
    ctx.fill();

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (const star of engine.stars) {
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // Particles
    if (engine.particlesEnabled) {
      for (const p of engine.particles) {
        const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // State rendering switch
    switch (engine.gameState) {
      case GameState.MENU:
        renderMenu(ctx);
        break;
      case GameState.PLAYER_MODE_SELECTION:
        renderPlayerModeSelection(ctx);
        break;
      case GameState.DIFFICULTY_SELECTION:
        renderDifficultySelection(ctx);
        break;
      case GameState.PLAYING:
        renderGameplay(ctx);
        break;
      case GameState.PAUSED:
        renderGameplay(ctx);
        renderPauseOverlay(ctx);
        break;
      case GameState.GAMEOVER:
        renderGameplay(ctx);
        renderGameOver(ctx);
        break;
      case GameState.UPGRADES:
        renderUpgrades(ctx);
        break;
      case GameState.SETTINGS:
        renderSettings(ctx);
        break;
      case GameState.HOW_TO_PLAY:
        renderHowToPlay(ctx);
        break;
    }
  };

  const renderGameplay = (ctx: CanvasRenderingContext2D) => {
    // 1. Draw Laser Beam if active
    if (engine.player1.isLaserActive && engine.player1.lives > 0) {
      drawLaserBeam(ctx, engine.player1.x + engine.player1.width / 2, engine.player1.y);
    }

    // 2. Draw Player 1
    if (engine.player1.lives > 0) {
      drawPlayerShip(ctx, engine.player1, player1Img.current, '#37f5ff');
    }

    // 3. Draw Player 2
    if (engine.twoPlayerMode && engine.player2 && engine.player2.lives > 0) {
      drawPlayerShip(ctx, engine.player2, player2Img.current, '#ff5fb4');
    }

    // 4. Draw Bullets
    for (const b of engine.bullets) {
      const color = b.color || (b.isFromPlayer ? '#41f0ff' : '#ff4b91');
      const size = b.size || 4;

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y + 6, size, size * 2.2, (b.vx || 0) * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner bright core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y + 6, size * 0.4, size * 1.2, (b.vx || 0) * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Draw Bombs
    for (const bomb of engine.bombs) {
      ctx.fillStyle = 'rgba(255, 55, 85, 0.25)';
      ctx.beginPath();
      ctx.arc(bomb.x + 12, bomb.y + 12, 19, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#23232d';
      ctx.beginPath();
      ctx.arc(bomb.x + 12, bomb.y + 12, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ff4b5f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bomb.x + 12, bomb.y + 12, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffdc5a';
      ctx.beginPath();
      ctx.arc(bomb.x + 12, bomb.y + 12, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Draw Enemies
    for (const e of engine.enemies) {
      drawEnemy(ctx, e);
    }

    // 7. Draw Power-Up Tokens
    for (const p of engine.powerUps) {
      drawPowerUpToken(ctx, p);
    }

    // 8. Draw In-Game Weapon Pickup Announcement Banner
    if (engine.weaponAnnouncement) {
      const wa = engine.weaponAnnouncement;
      const alpha = Math.min(1, wa.timer / 25);
      ctx.save();
      ctx.globalAlpha = alpha;

      ctx.fillStyle = 'rgba(8, 15, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(GAME_WIDTH / 2 - 210, 88, 420, 48, 12);
      ctx.fill();

      ctx.strokeStyle = wa.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = wa.color;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = wa.color;
      ctx.font = '900 16px Orbitron, Rajdhani, sans-serif';
      ctx.fillText(wa.title, GAME_WIDTH / 2, 104);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 12px Rajdhani, sans-serif';
      ctx.fillText(wa.subtitle, GAME_WIDTH / 2, 122);

      ctx.restore();
    }

    // 9. HUD Header & Weapon Selector
    renderHud(ctx);
  };

  const drawLaserBeam = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();

    // 1. Outer high-energy glow
    const outerGrad = ctx.createLinearGradient(x - 24, 0, x + 24, 0);
    outerGrad.addColorStop(0, 'rgba(255, 55, 166, 0)');
    outerGrad.addColorStop(0.5, 'rgba(255, 55, 166, 0.45)');
    outerGrad.addColorStop(1, 'rgba(255, 55, 166, 0)');
    ctx.fillStyle = outerGrad;
    ctx.fillRect(x - 24, 0, 48, y);

    // 2. Mid laser column
    const midGrad = ctx.createLinearGradient(x - 8, 0, x + 8, 0);
    midGrad.addColorStop(0, 'rgba(255, 120, 220, 0.3)');
    midGrad.addColorStop(0.5, 'rgba(255, 70, 180, 0.9)');
    midGrad.addColorStop(1, 'rgba(255, 120, 220, 0.3)');
    ctx.fillStyle = midGrad;
    ctx.fillRect(x - 8, 0, 16, y);

    // 3. Ultra-hot pure white laser core
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff37a6';
    ctx.shadowBlur = 14;
    ctx.fillRect(x - 2.5, 0, 5, y);
    ctx.shadowBlur = 0;

    // 4. Ship emitter lens glow
    ctx.fillStyle = '#ff7dc8';
    ctx.beginPath();
    ctx.arc(x, y + 2, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y + 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawPowerUpToken = (ctx: CanvasRenderingContext2D, p: PowerUp) => {
    let color = '#37f5ff';
    let iconLabel = 'W';
    let badgeTitle = 'GUN';

    switch (p.type) {
      case PowerUpType.TOKEN_TRIPLE_SHOT:
        color = '#fbbf24';
        iconLabel = '3X';
        badgeTitle = 'TRIPLE';
        break;
      case PowerUpType.TOKEN_LASER_BEAM:
        color = '#ff37a6';
        iconLabel = '⚡';
        badgeTitle = 'LASER';
        break;
      case PowerUpType.TOKEN_PLASMA_SPREAD:
        color = '#c084fc';
        iconLabel = 'SPR';
        badgeTitle = 'SPREAD';
        break;
      case PowerUpType.SHIELD_BOOST:
        color = '#38bdf8';
        iconLabel = '🛡️';
        badgeTitle = 'SHIELD';
        break;
      case PowerUpType.EXTRA_LIFE:
        color = '#4ade80';
        iconLabel = '♥';
        badgeTitle = '+LIFE';
        break;
      case PowerUpType.WEAPON:
      default:
        color = '#22d3ee';
        iconLabel = '⭐';
        badgeTitle = 'CANNON';
        break;
    }

    const cx = p.x + POWERUP_TOKEN_SIZE / 2;
    const cy = p.y + POWERUP_TOKEN_SIZE / 2;

    // Pulsing outer aura
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Cyber token body
    ctx.fillStyle = '#090f28';
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, POWERUP_TOKEN_SIZE, POWERUP_TOKEN_SIZE, 8);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Icon & Label
    ctx.fillStyle = color;
    ctx.font = 'bold 12px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iconLabel, cx, cy - 1);

    // Mini sub-label
    ctx.font = 'bold 8px Rajdhani, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(badgeTitle, cx, cy + 9);
  };

  const drawPlayerShip = (
    ctx: CanvasRenderingContext2D,
    p: PlayerState,
    img: HTMLImageElement | null,
    glowColor: string
  ) => {
    // Engine glow
    ctx.fillStyle = glowColor === '#37f5ff' ? 'rgba(55, 245, 255, 0.25)' : 'rgba(255, 95, 180, 0.25)';
    ctx.beginPath();
    ctx.arc(p.x + p.width / 2, p.y + p.height / 2 + 10, p.width * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Shield glow when active
    if (p.shield > 0) {
      ctx.strokeStyle = `rgba(80, 220, 255, ${0.15 + (p.shield / MAX_SHIELD) * 0.35})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 0.65, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, p.x - 6, p.y - 9, 60, 66);
    } else {
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.moveTo(p.x + p.width / 2, p.y);
      ctx.lineTo(p.x + 4, p.y + p.height - 4);
      ctx.lineTo(p.x + p.width / 2, p.y + p.height - 12);
      ctx.lineTo(p.x + p.width - 4, p.y + p.height - 4);
      ctx.closePath();
      ctx.fill();
    }
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, e: Enemy) => {
    const isElite = e.type === EnemyType.ELITE;
    const accent = isElite ? '#ff46af' : '#ffb441';

    ctx.fillStyle = isElite ? 'rgba(255, 70, 175, 0.18)' : 'rgba(255, 180, 65, 0.18)';
    ctx.beginPath();
    ctx.arc(e.x + 16, e.y + 16, 22, 0, Math.PI * 2);
    ctx.fill();

    // Enemy body
    ctx.fillStyle = '#14193c';
    ctx.beginPath();
    ctx.roundRect(e.x, e.y, ENEMY_WIDTH, ENEMY_HEIGHT, 10);
    ctx.fill();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wings / cyber highlights
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(e.x + 5, e.y + 8, 6, 9, 2);
    ctx.roundRect(e.x + 21, e.y + 8, 6, 9, 2);
    ctx.fill();

    // Cockpit eyes
    ctx.fillStyle = '#e6faff';
    ctx.beginPath();
    ctx.arc(e.x + 8, e.y + 12, 2, 0, Math.PI * 2);
    ctx.arc(e.x + 24, e.y + 12, 2, 0, Math.PI * 2);
    ctx.fill();

    // Elite mini health bar
    if (isElite && e.hp < e.maxHp) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(e.x + 4, e.y - 6, 24, 3);
      ctx.fillStyle = '#ff46af';
      ctx.fillRect(e.x + 4, e.y - 6, (24 * e.hp) / e.maxHp, 3);
    }
  };

  const renderHud = (ctx: CanvasRenderingContext2D) => {
    // Top Cyber HUD bar
    ctx.fillStyle = 'rgba(8, 15, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(16, 12, GAME_WIDTH - 32, 44, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(80, 210, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 15px Rajdhani, Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaf0ff';
    ctx.fillText(`SCORE  ${engine.player1.score}`, 32, 34);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#37f5ff';
    ctx.fillText(`WAVE  ${engine.wave}`, GAME_WIDTH / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff7dc8';
    const livesLabel = engine.infiniteLives ? '∞' : `${engine.player1.lives}`;
    ctx.fillText(`LIVES  ${livesLabel}`, GAME_WIDTH - 36, 34);

    // Sub-HUD Row: Shields, Gun Level, Active Weapon & Selectors
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px Rajdhani, Orbitron, sans-serif';
    ctx.fillStyle = '#78ebff';
    ctx.fillText('SHIELD', 32, 70);

    ctx.fillStyle = 'rgba(30, 45, 75, 0.85)';
    ctx.beginPath();
    ctx.roundRect(78, 63, 80, 10, 4);
    ctx.fill();

    const shieldPct = Math.max(0, Math.min(1, engine.player1.shield / MAX_SHIELD));
    ctx.fillStyle = '#46dcff';
    ctx.beginPath();
    ctx.roundRect(78, 63, 80 * shieldPct, 10, 4);
    ctx.fill();

    // Weapon Energy Bar
    const activeCfg = WEAPON_MODE_CONFIGS[engine.player1.weaponMode];
    ctx.fillStyle = activeCfg.color;
    ctx.fillText('PWR', 168, 70);

    ctx.fillStyle = 'rgba(30, 45, 75, 0.85)';
    ctx.beginPath();
    ctx.roundRect(196, 63, 70, 10, 4);
    ctx.fill();

    const energyPct = Math.max(0, Math.min(1, engine.player1.weaponEnergy / MAX_WEAPON_ENERGY));
    ctx.fillStyle = activeCfg.color;
    ctx.beginPath();
    ctx.roundRect(196, 63, 70 * energyPct, 10, 4);
    ctx.fill();

    // Unlocked Weapon Selector Pills
    const unlocked = engine.player1.unlockedWeaponModes;
    let pillX = 276;
    for (let i = 0; i < unlocked.length; i++) {
      const mode = unlocked[i];
      const cfg = WEAPON_MODE_CONFIGS[mode];
      const isCurrent = engine.player1.weaponMode === mode;
      const pillW = 86;

      ctx.fillStyle = isCurrent ? cfg.glow : 'rgba(10, 18, 45, 0.85)';
      ctx.beginPath();
      ctx.roundRect(pillX, 58, pillW, 20, 6);
      ctx.fill();

      ctx.strokeStyle = isCurrent ? cfg.color : 'rgba(80, 210, 255, 0.3)';
      ctx.lineWidth = isCurrent ? 1.8 : 1;
      ctx.stroke();

      ctx.fillStyle = isCurrent ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 10px Rajdhani, Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}:${cfg.label}`, pillX + pillW / 2, 69);

      pillX += pillW + 6;
    }

    // Second player stats if active
    if (engine.twoPlayerMode && engine.player2) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ff5fb4';
      ctx.fillText(`P2: ${engine.player2.lives} LIVES`, GAME_WIDTH - 36, 70);
    }
  };

  const renderMenu = (ctx: CanvasRenderingContext2D) => {
    if (menuBgImg.current && menuBgImg.current.complete && menuBgImg.current.naturalWidth > 0) {
      ctx.drawImage(menuBgImg.current, 0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = 'rgba(2, 5, 25, 0.45)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#37f5ff';
    ctx.font = '900 48px Orbitron, Rajdhani, sans-serif';
    ctx.fillText('GALAXIA', GAME_WIDTH / 2, 74);

    ctx.fillStyle = '#af7dff';
    ctx.font = '900 44px Orbitron, Rajdhani, sans-serif';
    ctx.fillText('ODYSSEY', GAME_WIDTH / 2, 122);

    ctx.fillStyle = '#78ebff';
    ctx.font = '600 13px Rajdhani, sans-serif';
    ctx.fillText('FUTURISTIC SPACE SHOOTER', GAME_WIDTH / 2, 152);

    // Profile Top bar
    ctx.fillStyle = 'rgba(5, 15, 40, 0.88)';
    ctx.beginPath();
    ctx.roundRect(55, 168, 690, 36, 18);
    ctx.fill();

    ctx.strokeStyle = 'rgba(80, 210, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 13px Rajdhani, Orbitron, sans-serif';
    ctx.fillStyle = '#a0ebff';
    ctx.textAlign = 'left';
    ctx.fillText('PILOT 01', 75, 191);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffeb96';
    ctx.fillText(`CREDITS  ${engine.credits}`, 250, 191);

    // Clickable Badges Chip in Pilot Bar
    ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
    ctx.beginPath();
    ctx.roundRect(390, 174, 136, 24, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Rajdhani, Orbitron, sans-serif';
    ctx.fillText(`🏆 BADGES  ${engine.getUnlockedCount()}/${engine.getTotalCount()}`, 458, 191);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#64ffb4';
    ctx.font = 'bold 13px Rajdhani, Orbitron, sans-serif';
    ctx.fillText(`BEST SCORE  ${engine.highScore}`, 725, 191);

    // Menu Options
    const hasSave = engine.hasSavedGame();
    const options = [
      ...(hasSave ? [{ title: 'RESUME SAVED MISSION', subtitle: `Continue from Wave ${engine.wave + 1}`, accent: '#64ffb4' }] : []),
      { title: 'START MISSION', subtitle: 'Embark on a new interstellar combat run', accent: '#37f5ff' },
      {
        title: 'ACHIEVEMENT BADGES',
        subtitle: `Inspect combat honors (${engine.getUnlockedCount()}/${engine.getTotalCount()} Unlocked)`,
        accent: '#ffeb96',
      },
      { title: 'SHIP UPGRADES', subtitle: 'Reinforce weaponry, shields & hull armor', accent: '#af7dff' },
      { title: 'SETTINGS', subtitle: 'Audio synthesizer & particle visual FX', accent: '#37f5ff' },
      { title: 'HOW TO PLAY', subtitle: 'Flight manual and keyboard/touch bindings', accent: '#ff5fb4' },
    ];

    const startY = hasSave ? 222 : 230;
    const gap = hasSave ? 56 : 62;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const y = startY + i * gap;
      const isSelected = engine.menuSelection === i;

      drawInteractiveCard(ctx, 140, y, 520, isSelected ? 52 : 48, opt.title, opt.subtitle, '>', opt.accent, isSelected);
    }
  };

  const renderPlayerModeSelection = (ctx: CanvasRenderingContext2D) => {
    renderHeader(ctx, 'SELECT PLAY MODE', 'SOLO OR CO-OP DUEL MISSION', '#37f5ff');

    const modes = [
      { title: '1 PLAYER SOLO', subtitle: 'Solo run with keyboard arrow keys and spacebar', accent: '#64ffb4' },
      { title: '2 PLAYERS CO-OP', subtitle: 'Co-op dual ship mission (P1: Arrows+Space, P2: A/D+F)', accent: '#af7dff' },
    ];

    for (let i = 0; i < modes.length; i++) {
      const y = 220 + i * 100;
      const selected = engine.playerModeSelection === i;
      drawInteractiveCard(
        ctx,
        140,
        y,
        520,
        64,
        modes[i].title,
        modes[i].subtitle,
        selected ? 'SELECTED' : 'CHOOSE',
        modes[i].accent,
        selected
      );
    }

    renderFooterControls(ctx, 'UP / DOWN  SELECT', 'ENTER / CLICK  CONFIRM', 'ESC  BACK');
  };

  const renderDifficultySelection = (ctx: CanvasRenderingContext2D) => {
    renderHeader(ctx, 'SELECT DIFFICULTY', 'CHOOSE YOUR MISSION PROFILE', '#37f5ff');

    const diffs = [
      {
        level: DifficultyLevel.EASY,
        desc: 'Fewer enemy waves, slower projectile attacks, reduced damage',
        accent: '#64ffb4',
      },
      {
        level: DifficultyLevel.NORMAL,
        desc: 'Balanced arcade parameters, standard aggression and reward',
        accent: '#37f5ff',
      },
      {
        level: DifficultyLevel.HARD,
        desc: 'Relentless alien waves, fast dive-bombers and lethal bombs',
        accent: '#ff5fb4',
      },
    ];

    for (let i = 0; i < diffs.length; i++) {
      const y = 190 + i * 82;
      const selected = engine.difficultySelection === i;
      drawInteractiveCard(
        ctx,
        140,
        y,
        520,
        60,
        diffs[i].level,
        diffs[i].desc,
        selected ? 'READY' : 'SELECT',
        diffs[i].accent,
        selected
      );
    }

    renderFooterControls(ctx, 'UP / DOWN  SELECT', 'ENTER / CLICK  LAUNCH', 'ESC  BACK');
  };

  const renderUpgrades = (ctx: CanvasRenderingContext2D) => {
    renderHeader(ctx, 'SHIP UPGRADES', 'REINFORCE YOUR ARSENAL AT THE HANGAR', '#af7dff');

    ctx.fillStyle = '#ffeb96';
    ctx.font = 'bold 15px Rajdhani, Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`AVAILABLE POINTS:  ${engine.profileScore} PTS`, GAME_WIDTH / 2, 142);

    for (let i = 0; i < UPGRADE_CONFIGS.length; i++) {
      const u = UPGRADE_CONFIGS[i];
      const y = 168 + i * 62;
      const selected = engine.upgradeSelection === i;

      let valueText = `${u.cost} PTS`;
      let accent = '#37f5ff';

      if (u.id === UpgradeOption.DUAL_CANNONS) {
        if (engine.ownedWeaponLevel >= 2) valueText = 'OWNED';
      } else if (u.id === UpgradeOption.TRIPLE_CANNONS) {
        if (engine.ownedWeaponLevel >= 3) valueText = 'OWNED';
      } else if (u.id === UpgradeOption.DOUBLE_LIVES) {
        accent = '#64ffb4';
        if (engine.doubleLives) valueText = 'OWNED';
      } else if (u.id === UpgradeOption.INFINITE_LIVES) {
        accent = '#ffeb96';
        if (engine.infiniteLives) valueText = 'OWNED';
      } else if (u.id === UpgradeOption.RETURN) {
        accent = '#ff5fb4';
        valueText = 'BACK';
      }

      drawInteractiveCard(ctx, 140, y, 520, 52, u.name, u.subtitle, valueText, accent, selected);
    }
  };

  const renderSettings = (ctx: CanvasRenderingContext2D) => {
    renderHeader(ctx, 'SETTINGS', 'SYSTEM CONFIGURATION & HARDWARE DIAGNOSTICS', '#37f5ff');

    const opts = [
      {
        title: 'AUDIO OUTPUT',
        subtitle: 'Synthesizer sound effects and looping menu music',
        val: engine.soundEnabled ? 'ONLINE' : 'MUTED',
        accent: engine.soundEnabled ? '#64ffb4' : '#888',
      },
      {
        title: 'PARTICLE FX',
        subtitle: 'High-speed particle explosions and plasma sparks',
        val: engine.particlesEnabled ? 'ONLINE' : 'REDUCED',
        accent: engine.particlesEnabled ? '#37f5ff' : '#888',
      },
      {
        title: 'RETURN TO HANGAR',
        subtitle: 'Save configurations and return to main menu',
        val: 'EXIT',
        accent: '#ff5fb4',
      },
    ];

    const ys = [205, 275, 345];
    for (let i = 0; i < opts.length; i++) {
      const selected = engine.settingsSelection === i;
      drawInteractiveCard(ctx, 140, ys[i], 520, 56, opts[i].title, opts[i].subtitle, opts[i].val, opts[i].accent, selected);
    }
  };

  const renderHowToPlay = (ctx: CanvasRenderingContext2D) => {
    renderHeader(ctx, 'HOW TO PLAY', 'MISSION CONTROL // FLIGHT MANUAL', '#ff5fb4');

    const guides = [
      { title: 'MOVE SHIP 1', subtitle: 'Left / Right thrusters', key: '← / →', accent: '#37f5ff' },
      { title: 'FIRE ACTIVE WEAPON', subtitle: 'Hold for continuous firing / Laser stream', key: 'SPACE', accent: '#af7dff' },
      { title: 'SWITCH WEAPON MODES', subtitle: 'Switch between Blaster, Triple Shot, Laser Beam, Spread', key: '1, 2, 3, 4 / Q, E', accent: '#fbbf24' },
      { title: 'COLLECT TOKENS', subtitle: 'Pick up enemy drops to unlock special weapons & recharge', key: '⚡ 🔱 🔮', accent: '#ff37a6' },
      { title: 'MOVE & FIRE SHIP 2', subtitle: 'Co-op thruster controls & firing', key: 'A / D + F', accent: '#64ffb4' },
      { title: 'TACTICAL PAUSE', subtitle: 'Pause game, save profile or resume battle', key: 'ESC', accent: '#ff5fb4' },
    ];

    for (let i = 0; i < guides.length; i++) {
      const y = 148 + i * 58;
      drawInteractiveCard(ctx, 140, y, 520, 48, guides[i].title, guides[i].subtitle, guides[i].key, guides[i].accent, false);
    }

    renderFooterControls(ctx, 'CLICK / ENTER  RETURN TO MENU', '', 'ESC  BACK');
  };

  const renderPauseOverlay = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(2, 5, 25, 0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#37f5ff';
    ctx.font = 'bold 52px Orbitron, Rajdhani, sans-serif';
    ctx.fillText('PAUSED', GAME_WIDTH / 2, 230);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Rajdhani, sans-serif';
    ctx.fillText('ESC  -  RESUME MISSION', GAME_WIDTH / 2, 310);

    ctx.fillStyle = '#ff7dc8';
    ctx.fillText('ENTER  -  SAVE & RETURN TO MENU', GAME_WIDTH / 2, 355);
  };

  const renderGameOver = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(2, 5, 25, 0.88)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5596';
    ctx.font = '900 52px Orbitron, Rajdhani, sans-serif';
    ctx.fillText('MISSION FAILED', GAME_WIDTH / 2, 220);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 22px Rajdhani, sans-serif';
    ctx.fillText(`FINAL SCORE:  ${engine.player1.score}`, GAME_WIDTH / 2, 290);
    ctx.fillText(`WAVES SURVIVED:  ${engine.wave}`, GAME_WIDTH / 2, 330);

    ctx.fillStyle = '#37f5ff';
    ctx.font = 'bold 18px Rajdhani, Orbitron, sans-serif';
    ctx.fillText('PRESS ENTER OR CLICK TO RETURN TO MENU', GAME_WIDTH / 2, 410);
  };

  const renderHeader = (ctx: CanvasRenderingContext2D, title: string, subtitle: string, color: string) => {
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = 'bold 36px Orbitron, Rajdhani, sans-serif';
    ctx.fillText(title, GAME_WIDTH / 2, 74);

    ctx.fillStyle = '#b4dcf0';
    ctx.font = '600 13px ui-monospace, Rajdhani, monospace';
    ctx.fillText(subtitle, GAME_WIDTH / 2, 100);
  };

  const renderFooterControls = (ctx: CanvasRenderingContext2D, left: string, center: string, right: string) => {
    ctx.font = 'bold 12px ui-monospace, Rajdhani, monospace';
    ctx.fillStyle = 'rgba(120, 170, 200, 0.7)';

    ctx.textAlign = 'left';
    ctx.fillText(left, 40, 545);

    ctx.textAlign = 'center';
    ctx.fillText(center, GAME_WIDTH / 2, 545);

    ctx.textAlign = 'right';
    ctx.fillText(right, GAME_WIDTH - 40, 545);
  };

  const drawInteractiveCard = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    subtitle: string,
    badge: string,
    accent: string,
    selected: boolean
  ) => {
    ctx.fillStyle = selected ? 'rgba(55, 245, 255, 0.18)' : 'rgba(5, 16, 43, 0.88)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();

    ctx.strokeStyle = selected ? accent : 'rgba(80, 210, 255, 0.35)';
    ctx.lineWidth = selected ? 2.5 : 1.2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = selected ? '#ffffff' : '#dcebfa';
    ctx.font = 'bold 16px Rajdhani, sans-serif';
    ctx.fillText(title, x + 24, y + h * 0.36);

    ctx.fillStyle = selected ? '#aae6ff' : '#9bb4d7';
    ctx.font = '500 11.5px Rajdhani, sans-serif';
    ctx.fillText(subtitle, x + 24, y + h * 0.72);

    ctx.textAlign = 'right';
    ctx.fillStyle = selected ? accent : '#b9dceb';
    ctx.font = 'bold 15px Orbitron, ui-monospace, monospace';
    ctx.fillText(badge, x + w - 24, y + h * 0.5);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full max-w-[900px] aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-2xl border border-cyan-500/30"
    >
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        onClick={handleCanvasClick}
        className="w-full h-full object-contain cursor-pointer select-none"
      />
    </div>
  );
};
