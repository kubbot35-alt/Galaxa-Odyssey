import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import {
  GameState,
  DifficultyLevel,
  DIFFICULTY_CONFIGS,
  EnemyType,
  PowerUpType,
  UpgradeOption,
  UPGRADE_CONFIGS,
  SettingsOption,
} from '../types/game';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  BOMB_SIZE,
  POWERUP_SIZE,
  MAX_SHIELD,
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

  // Click & Mouse interaction for Menu, Upgrades, Settings, etc.
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
      // Start Mission -> Mode Select
      engine.gameState = GameState.PLAYER_MODE_SELECTION;
    } else if (action === 1) {
      // Achievement Badges
      engine.openAchievements();
    } else if (action === 2) {
      // Ship Upgrades
      engine.gameState = GameState.UPGRADES;
    } else if (action === 3) {
      // Settings
      engine.gameState = GameState.SETTINGS;
    } else if (action === 4) {
      // How To Play
      engine.gameState = GameState.HOW_TO_PLAY;
    }
    onStateUpdate();
  };

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Audio resume on first user interaction
      if (engine.soundEnabled && engine.gameState === GameState.MENU) {
        soundEngine.startMenuMusic();
      }

      // Achievement modal escape handling
      if (engine.isAchievementsOpen) {
        if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
          engine.closeAchievements();
          onStateUpdate();
        }
        return;
      }

      // Quick toggle achievements with 'B' in Menu
      if ((e.key === 'b' || e.key === 'B') && engine.gameState === GameState.MENU) {
        engine.toggleAchievements();
        onStateUpdate();
        return;
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
    // Draw Player 1
    if (engine.player1.lives > 0) {
      drawPlayerShip(ctx, engine.player1, player1Img.current, '#37f5ff');
    }

    // Draw Player 2
    if (engine.twoPlayerMode && engine.player2 && engine.player2.lives > 0) {
      drawPlayerShip(ctx, engine.player2, player2Img.current, '#ff5fb4');
    }

    // Draw Bullets
    for (const b of engine.bullets) {
      const color = b.isFromPlayer ? '#41f0ff' : '#ff4b91';
      ctx.fillStyle = b.isFromPlayer ? 'rgba(65, 240, 255, 0.3)' : 'rgba(255, 75, 145, 0.3)';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y + 6, 4, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(b.x - 2, b.y, 4, 12, 2);
      ctx.fill();
    }

    // Draw Bombs
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

    // Draw Enemies
    for (const e of engine.enemies) {
      drawEnemy(ctx, e);
    }

    // Draw PowerUps
    for (const p of engine.powerUps) {
      const color = p.type === PowerUpType.EXTRA_LIFE ? '#4bffb4' : '#b473ff';
      const label = p.type === PowerUpType.EXTRA_LIFE ? 'L' : 'W';

      ctx.fillStyle = p.type === PowerUpType.EXTRA_LIFE ? 'rgba(75, 255, 180, 0.2)' : 'rgba(180, 115, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(p.x + 11, p.y + 11, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#12193c';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, POWERUP_SIZE, POWERUP_SIZE, 6);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, p.x + 11, p.y + 11);
    }

    // HUD Header
    renderHud(ctx);
  };

  const drawPlayerShip = (
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number; width: number; height: number; shield: number },
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
      // Procedural fallback ship
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

  const drawEnemy = (ctx: CanvasRenderingContext2D, e: { x: number; y: number; type: EnemyType; diving: boolean }) => {
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
  };

  const renderHud = (ctx: CanvasRenderingContext2D) => {
    // Top Cyber HUD bar
    ctx.fillStyle = 'rgba(8, 15, 42, 0.88)';
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

    // Shield Bar
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px Rajdhani, Orbitron, sans-serif';
    ctx.fillStyle = '#78ebff';
    ctx.fillText('SHIELD', 32, 70);

    ctx.fillStyle = 'rgba(30, 45, 75, 0.85)';
    ctx.beginPath();
    ctx.roundRect(85, 63, 110, 10, 4);
    ctx.fill();

    const shieldPct = Math.max(0, Math.min(1, engine.player1.shield / MAX_SHIELD));
    ctx.fillStyle = '#46dcff';
    ctx.beginPath();
    ctx.roundRect(85, 63, 110 * shieldPct, 10, 4);
    ctx.fill();

    // Weapon Level badge
    ctx.fillStyle = 'rgba(8, 15, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(210, 60, 90, 18, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80, 210, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffeb96';
    ctx.font = 'bold 11px Rajdhani, sans-serif';
    ctx.fillText(`GUN LVL ${engine.player1.weaponLevel}`, 220, 71);

    // Second player stats if active
    if (engine.twoPlayerMode && engine.player2) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ff5fb4';
      ctx.fillText(`P2 LIVES: ${engine.player2.lives} | SHIELD: ${engine.player2.shield}%`, GAME_WIDTH - 36, 70);
    }
  };

  const renderMenu = (ctx: CanvasRenderingContext2D) => {
    // Menu background
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
      { title: 'MOVE SHIP 1', subtitle: 'Left / Right thrusters (or touch Left/Right buttons)', key: '← / →', accent: '#37f5ff' },
      { title: 'FIRE CANNONS 1', subtitle: 'Hold for continuous plasma rapid fire', key: 'SPACE', accent: '#af7dff' },
      { title: 'MOVE SHIP 2 (CO-OP)', subtitle: 'P2 Thruster movement controls', key: 'A / D', accent: '#64ffb4' },
      { title: 'FIRE CANNONS 2', subtitle: 'P2 Continuous plasma weapon fire', key: 'F', accent: '#ffeb96' },
      { title: 'TACTICAL PAUSE', subtitle: 'Pause game, save profile or resume battle', key: 'ESC', accent: '#ff5fb4' },
    ];

    for (let i = 0; i < guides.length; i++) {
      const y = 155 + i * 66;
      drawInteractiveCard(ctx, 140, y, 520, 52, guides[i].title, guides[i].subtitle, guides[i].key, guides[i].accent, false);
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
    // Card background
    ctx.fillStyle = selected ? 'rgba(55, 245, 255, 0.18)' : 'rgba(5, 16, 43, 0.88)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();

    // Border
    ctx.strokeStyle = selected ? accent : 'rgba(80, 210, 255, 0.35)';
    ctx.lineWidth = selected ? 2.5 : 1.2;
    ctx.stroke();

    // Title
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = selected ? '#ffffff' : '#dcebfa';
    ctx.font = 'bold 16px Rajdhani, sans-serif';
    ctx.fillText(title, x + 24, y + h * 0.36);

    // Subtitle
    ctx.fillStyle = selected ? '#aae6ff' : '#9bb4d7';
    ctx.font = '500 11.5px Rajdhani, sans-serif';
    ctx.fillText(subtitle, x + 24, y + h * 0.72);

    // Right Badge / Value
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
