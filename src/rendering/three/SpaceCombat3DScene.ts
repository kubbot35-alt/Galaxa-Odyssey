import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Bomb, Bullet, Enemy, PlayerState, PowerUp } from '../../game/entities/GameEntities';
import { EnemyType } from '../../types/game';
import { GAME_WIDTH, GAME_HEIGHT, LASER_BEAM_WIDTH } from '../../game/constants';
import { ShipSkinId } from './SpaceHangarScene';
import { Spaceship3D } from './Spaceship3D';
import { CombatEntityFactory } from './CombatEntityFactory';
import { CombatTargetProjector } from './CombatTargetProjector';
import { DisposableScene } from './DisposableScene';
import { EntityViewSync } from './EntityViewSync';
import { TimedEffectPool, type TimedEffect } from './TimedEffectPool';
import { CAMERA_VIEW_STRATEGIES, COMBAT_SKIN_PALETTES } from './combatSceneTypes';
import type { CameraViewMode, CombatSceneSource, ProjectedTarget } from './combatSceneTypes';
import type { SupportedLocale } from '../../config/content/locales';
import { DEFAULT_LOCALE, LOCALES } from '../../config/content/locales';
import { localizeHitNotice } from '../../game/combatText';

export type { CameraViewMode, ProjectedTarget } from './combatSceneTypes';

interface DebrisEffect extends TimedEffect {
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
}

interface SparkEffect extends TimedEffect {
  vx: number;
  vy: number;
  vz: number;
}

interface SmokeEffect extends SparkEffect {
  rotX: number;
  rotY: number;
  scaleRate: number;
  initialOpacity: number;
}

interface ShockwaveEffect extends TimedEffect {
  growthRate: number;
}

export class SpaceCombat3DScene extends DisposableScene {
  private locale: SupportedLocale = DEFAULT_LOCALE;
  private container: HTMLElement;
  protected renderer: THREE.WebGLRenderer;
  protected scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;

  // Camera settings
  public viewMode: CameraViewMode = 'CHASE_3D';
  private targetCameraPos = new THREE.Vector3(0, 3.8, -8.2);
  private targetLookAt = new THREE.Vector3(0, 0.6, 14.0);
  private currentCameraPos = new THREE.Vector3(0, 3.8, -8.2);
  private currentLookAt = new THREE.Vector3(0, 0.6, 14.0);

  // Warp transition state
  public isWarpJumping = false;
  private warpTime = 0;
  private warpDuration = 1.2;
  private warpCallback: (() => void) | null = null;
  private previousWave = 0;

  // 3D Objects
  public p1Spaceship!: Spaceship3D;
  public p2Spaceship!: Spaceship3D;
  private playerShipGroup: THREE.Group;
  private player2ShipGroup: THREE.Group;
  private playerShieldMesh: THREE.Mesh;
  private player2ShieldMesh: THREE.Mesh;
  private playerEnginePlumes: THREE.Mesh[] = [];
  private playerEngineLights: THREE.PointLight[] = [];
  private player2EnginePlumes: THREE.Mesh[] = [];
  private player2EngineLights: THREE.PointLight[] = [];
  private playerBankAngle = 0;
  private player2BankAngle = 0;

  // Dynamic Visual Damage Effects State
  private prevP1Shield = 100;
  private prevP1Lives = 3;
  private p1HitFlashTimer = 0;
  private p1Recoil = new THREE.Vector3();

  private prevP2Shield = 100;
  private prevP2Lives = 3;
  private p2HitFlashTimer = 0;
  private p2Recoil = new THREE.Vector3();

  // Active Dynamic Sparks
  private damageSparks!: TimedEffectPool<SparkEffect>;

  // Active Dynamic Engine / Hull Smoke
  private damageSmoke!: TimedEffectPool<SmokeEffect>;

  // Shockwave Rings (e.g. Shield Break or Hit Ripple)
  private shockwaves!: TimedEffectPool<ShockwaveEffect>;

  // In-World 3D Holographic Health Bars attached directly to ships
  private p1HealthBarCanvas!: HTMLCanvasElement;
  private p1HealthBarTexture!: THREE.CanvasTexture;
  private p1HealthBarMesh!: THREE.Mesh;

  private p2HealthBarCanvas!: HTMLCanvasElement;
  private p2HealthBarTexture!: THREE.CanvasTexture;
  private p2HealthBarMesh!: THREE.Mesh;

  // Timer for continuous trailing engine smoke
  private smokeEmitAccumulator = 0;

  // Laser beam 3D
  private laserBeamGroup: THREE.Group;
  private laserCoreMesh: THREE.Mesh;
  private laserGlowMesh: THREE.Mesh;
  private laserRings: THREE.Mesh[] = [];

  // Environment & Background
  private starfield: THREE.Points;
  private starGeometry: THREE.BufferGeometry;
  private warpLinesGroup: THREE.Group;
  private planetGroup: THREE.Group;
  private nebulaGroup: THREE.Group;
  private asteroidGroup: THREE.Group;

  // Pools / Meshes for dynamic entities
  private enemyViews!: EntityViewSync<Enemy, THREE.Group, number>;
  private bulletViews!: EntityViewSync<Bullet, THREE.Mesh, number>;
  private bombViews!: EntityViewSync<Bomb, THREE.Group, number>;
  private powerUpViews!: EntityViewSync<PowerUp, THREE.Group, number>;
  private readonly entityFactory: CombatEntityFactory;
  private readonly targetProjector = new CombatTargetProjector();

  // Debris & Particle system
  private particleMeshGroup: THREE.Group;
  private debris!: TimedEffectPool<DebrisEffect>;

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private mainSunLight: THREE.DirectionalLight;
  private engineGlowLight: THREE.PointLight;

  // Current Skin & Materials
  public activeSkinId: ShipSkinId = 'titanium';
  private hullMaterials: THREE.MeshStandardMaterial[] = [];
  private trimMaterials: THREE.MeshStandardMaterial[] = [];
  private armorMaterials: THREE.MeshStandardMaterial[] = [];
  private cockpitMaterial: THREE.MeshPhysicalMaterial | null = null;

  // Player 2 Materials
  private p2HullMaterials: THREE.MeshStandardMaterial[] = [];
  private p2TrimMaterials: THREE.MeshStandardMaterial[] = [];
  private p2ArmorMaterials: THREE.MeshStandardMaterial[] = [];
  private p2CockpitMaterial: THREE.MeshPhysicalMaterial | null = null;

  constructor(
    container: HTMLElement,
    initialSkin: ShipSkinId = 'titanium',
    entityFactory = new CombatEntityFactory(),
  ) {
    super();
    this.container = container;
    this.activeSkinId = initialSkin;
    this.entityFactory = entityFactory;
    this.clock = new THREE.Clock();

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617); // Deep cosmic void
    this.scene.fog = new THREE.FogExp2(0x020617, 0.0075);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(56, aspect, 0.1, 1000);
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookAt);

    // PBR Environment Map
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    pmremGenerator.dispose();

    // 3. Lighting
    this.ambientLight = new THREE.AmbientLight(0x38bdf8, 0.65);
    this.scene.add(this.ambientLight);

    this.mainSunLight = new THREE.DirectionalLight(0xe0f2fe, 3.2);
    this.mainSunLight.position.set(15, 25, -20);
    this.scene.add(this.mainSunLight);

    const rimLight = new THREE.DirectionalLight(0xec4899, 1.8);
    rimLight.position.set(-20, 10, 30);
    this.scene.add(rimLight);

    this.engineGlowLight = new THREE.PointLight(0x38bdf8, 2.5, 18);
    this.engineGlowLight.position.set(0, 0, -2);
    this.scene.add(this.engineGlowLight);

    // 4. Build Environment
    this.starfield = this.createStarfield();
    this.starGeometry = this.starfield.geometry;
    this.scene.add(this.starfield);

    this.warpLinesGroup = this.createWarpLines();
    this.scene.add(this.warpLinesGroup);

    this.planetGroup = this.createPlanetaryBackdrop();
    this.scene.add(this.planetGroup);

    this.nebulaGroup = this.createCosmicNebulae();
    this.scene.add(this.nebulaGroup);

    this.asteroidGroup = this.createDriftingAsteroids();
    this.scene.add(this.asteroidGroup);

    // 5. Build Player 1 3D Spaceship
    this.p1Spaceship = new Spaceship3D();
    this.playerShipGroup = this.p1Spaceship.mesh;
    this.playerEnginePlumes = this.p1Spaceship.engineFlames;
    this.playerEngineLights = this.p1Spaceship.engineLights;
    this.scene.add(this.playerShipGroup);

    this.playerShieldMesh = this.createShieldBubble(0x38bdf8);
    this.playerShipGroup.add(this.playerShieldMesh);

    // Attach In-World Holographic Health & Shield Bar (P1)
    const p1BarObj = this.createInWorldHealthBarMesh(false);
    this.p1HealthBarCanvas = p1BarObj.canvas;
    this.p1HealthBarTexture = p1BarObj.texture;
    this.p1HealthBarMesh = p1BarObj.mesh;
    this.playerShipGroup.add(this.p1HealthBarMesh);

    // Player 2 3D Spaceship (Co-op)
    this.p2Spaceship = new Spaceship3D({
      hullColor: 0x2e1065,
      wingColor: 0x4c1d95,
      cockpitColor: 0xf43f5e,
      flameColor: 0xf43f5e,
      isPlayer2: true,
    });
    this.player2ShipGroup = this.p2Spaceship.mesh;
    this.player2EnginePlumes = this.p2Spaceship.engineFlames;
    this.player2EngineLights = this.p2Spaceship.engineLights;
    this.player2ShipGroup.visible = false;
    this.scene.add(this.player2ShipGroup);

    this.player2ShieldMesh = this.createShieldBubble(0xf43f5e);
    this.player2ShipGroup.add(this.player2ShieldMesh);

    // Attach In-World Holographic Health & Shield Bar (P2)
    const p2BarObj = this.createInWorldHealthBarMesh(true);
    this.p2HealthBarCanvas = p2BarObj.canvas;
    this.p2HealthBarTexture = p2BarObj.texture;
    this.p2HealthBarMesh = p2BarObj.mesh;
    this.player2ShipGroup.add(this.p2HealthBarMesh);

    // 6. Build 3D Laser Beam Emitter
    const laserObj = this.createLaserBeamObject();
    this.laserBeamGroup = laserObj.group;
    this.laserCoreMesh = laserObj.core;
    this.laserGlowMesh = laserObj.glow;
    this.laserRings = laserObj.rings;
    this.laserBeamGroup.visible = false;
    this.scene.add(this.laserBeamGroup);

    // 7. Particle / Debris Group
    this.particleMeshGroup = new THREE.Group();
    this.scene.add(this.particleMeshGroup);
    this.createEffectPools();
    this.createEntityViews();

    // Apply initial skin
    this.setShipSkin(this.activeSkinId);

    // Window Resize Handler
    window.addEventListener('resize', this.onResize);

    // Initial brief warp arrival into sector
    this.triggerHyperspaceArrival();

    // Start render loop
    this.animate();
  }

  // Create In-World 3D Holographic Health Bar Plane
  private createInWorldHealthBarMesh(isPlayer2 = false): {
    mesh: THREE.Mesh;
    canvas: HTMLCanvasElement;
    texture: THREE.CanvasTexture;
  } {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const geom = new THREE.PlaneGeometry(3.0, 0.75);
    const mesh = new THREE.Mesh(geom, mat);
    // Position slightly above the cockpit, angled backwards to face camera directly
    mesh.position.set(0, 1.45, -0.2);
    mesh.rotation.x = -0.32;
    return { mesh, canvas, texture };
  }

  // Render Dynamic Visual Damage Effects into In-World Canvas
  private updateInWorldHealthBar(
    canvas: HTMLCanvasElement,
    texture: THREE.CanvasTexture,
    player: PlayerState,
    isPlayer2 = false,
    hitFlashTimer = 0
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const t = LOCALES[this.locale];
    const weaponLabel = t.weaponLabels[player.weaponMode];

    ctx.clearRect(0, 0, 512, 128);

    const isHit = hitFlashTimer > 0;
    const shield = Math.max(0, Math.min(100, player.shield));
    const shieldLag = Math.max(shield, Math.min(100, player.shieldLag ?? shield));
    const shieldPct = shield / 100;
    const shieldLagPct = shieldLag / 100;
    const primaryColor = isPlayer2 ? '#f43f5e' : '#38bdf8';
    const accentColor = isPlayer2 ? '#fb7185' : '#7dd3fc';

    // 1. Semi-transparent Holographic Container with Sci-Fi Corner Brackets
    ctx.fillStyle = isHit ? 'rgba(239, 68, 68, 0.3)' : 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 112, 8);
    ctx.fill();

    ctx.strokeStyle = isHit ? '#ef4444' : isPlayer2 ? 'rgba(244, 63, 94, 0.75)' : 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = isHit ? 3 : 1.5;
    ctx.stroke();

    // Corner tech brackets
    ctx.strokeStyle = isHit ? '#ffffff' : primaryColor;
    ctx.lineWidth = 3;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(8, 24); ctx.lineTo(8, 8); ctx.lineTo(24, 8);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(504, 24); ctx.lineTo(504, 8); ctx.lineTo(488, 8);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(8, 104); ctx.lineTo(8, 120); ctx.lineTo(24, 120);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(504, 104); ctx.lineTo(504, 120); ctx.lineTo(488, 120);
    ctx.stroke();

    // 2. Header: Shield Title & Percentage
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = isHit ? '#ffffff' : accentColor;
    ctx.textAlign = 'left';
    ctx.fillText(
      isPlayer2 ? t.spaceCombat3DScene.p2DeflectorShield : t.spaceCombat3DScene.p1DeflectorShield,
      20,
      26
    );

    ctx.textAlign = 'right';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = shield > 50 ? '#38bdf8' : shield > 20 ? '#fbbf24' : '#ef4444';
    ctx.fillText(`${Math.round(shield)}%`, 492, 26);

    // 3. Deflector Shield Bar Track with Depletion Lag Bar Animation
    const barX = 20;
    const barY = 32;
    const barW = 472;
    const barH = 14;

    // Track Background
    ctx.fillStyle = 'rgba(2, 6, 23, 0.95)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Red / Amber Damage Depletion Lag Bar (Ghost Bar that catches up after hits)
    if (shieldLagPct > 0) {
      ctx.fillStyle = isHit ? 'rgba(239, 68, 68, 0.95)' : 'rgba(245, 158, 11, 0.85)';
      ctx.fillRect(barX, barY, barW * shieldLagPct, barH);
    }

    // Active Shield Foreground Bar
    if (shieldPct > 0) {
      const grad = ctx.createLinearGradient(barX, barY, barX + barW * shieldPct, barY);
      if (isPlayer2) {
        grad.addColorStop(0, '#e11d48');
        grad.addColorStop(1, '#fb7185');
      } else {
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(1, '#38bdf8');
      }
      ctx.fillStyle = isHit && Math.floor(Date.now() / 60) % 2 === 0 ? '#ffffff' : grad;
      ctx.fillRect(barX, barY, barW * shieldPct, barH);
    }

    // Tech division ticks on shield bar
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.5)';
    ctx.lineWidth = 1.5;
    for (let x = barX + 47; x < barX + barW; x += 47) {
      ctx.beginPath();
      ctx.moveTo(x, barY);
      ctx.lineTo(x, barY + barH);
      ctx.stroke();
    }

    // 4. Hull Integrity / Pilot Life Units
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(t.spaceCombat3DScene.hullReserves, 20, 68);

    const maxLives = Math.max(3, player.maxLives ?? 3);
    const pipW = 28;
    const pipH = 12;
    const startPipX = 140;
    const pipY = 58;

    for (let i = 0; i < maxLives; i++) {
      const px = startPipX + i * (pipW + 6);
      if (px + pipW > 492) break;

      if (i < player.lives) {
        // Active Life Unit Pip
        ctx.fillStyle = player.lives > 2 ? '#22c55e' : player.lives === 2 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(px, pipY, pipW, pipH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, pipY, pipW, pipH);
      } else {
        // Depleted Life Unit (Red slashed / empty outline)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(px, pipY, pipW, pipH);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, pipY, pipW, pipH);
        ctx.beginPath();
        ctx.moveTo(px, pipY);
        ctx.lineTo(px + pipW, pipY + pipH);
        ctx.stroke();
      }
    }

    // 5. Dynamic Combat Notice or System Status
    ctx.textAlign = 'center';
    if (player.hitNotice) {
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = player.hitNotice.includes('CRITICAL') || player.hitNotice.includes('HULL') ? '#ef4444' : '#fbbf24';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(`⚡ ${localizeHitNotice(player.hitNotice, t)} ⚡`, 256, 100);
      ctx.shadowBlur = 0;
    } else {
      ctx.font = '11px monospace';
      ctx.fillStyle = shield === 0 ? '#ef4444' : 'rgba(148, 163, 184, 0.8)';
      ctx.fillText(
        shield === 0
          ? t.spaceCombat3DScene.shieldCollapsedDirectHull
          : t.spaceCombat3DScene.weaponModeEnergy(weaponLabel.label, Math.round(player.weaponEnergy)),
        256,
        100
      );
    }

    texture.needsUpdate = true;
  }

  // Spawn dynamic visual damage sparks erupting from ship hits
  public spawnDamageSparks(origin: THREE.Vector3, isShield: boolean, count = 35) {
    const geom = new THREE.OctahedronGeometry(0.09, 0);
    const colors = isShield
      ? [0x38bdf8, 0x60a5fa, 0xe0f2fe, 0xffffff]
      : [0xfbbf24, 0xf97316, 0xef4444, 0xffedd5];

    for (let i = 0; i < count; i++) {
      const color = colors[i % colors.length];
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
      });

      const mesh = new THREE.Mesh(geom, mat);
      // Spawn at ship with random offset along fuselage/wings
      mesh.position.set(
        origin.x + (Math.random() - 0.5) * 1.6,
        origin.y + (Math.random() - 0.5) * 0.6,
        origin.z + (Math.random() - 0.5) * 1.4
      );

      const vx = (Math.random() - 0.5) * 8.0;
      const vy = (Math.random() - 0.5) * 6.0 + 1.5;
      const vz = -(Math.random() * 12.0 + 6.0); // sprays backward in space slipstream
      const life = 0.2 + Math.random() * 0.35;

      this.scene.add(mesh);
      this.damageSparks.add({
        mesh,
        vx,
        vy,
        vz,
        life,
        maxLife: life,
      });
    }
  }

  // Spawn volumetric billowing engine / hull smoke puffs
  public spawnSmokePuff(origin: THREE.Vector3, isHeavy = false) {
    const size = (isHeavy ? 0.28 : 0.2) + Math.random() * 0.12;
    const geom = new THREE.DodecahedronGeometry(size, 0);

    const color = isHeavy
      ? (Math.random() < 0.25 ? 0x78350f : 0x1e293b)
      : (Math.random() < 0.3 ? 0x334155 : 0x1e293b);

    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: isHeavy ? 0.75 : 0.55,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(
      origin.x + (Math.random() - 0.5) * 0.4,
      origin.y + (Math.random() - 0.5) * 0.3,
      origin.z + (Math.random() - 0.5) * 0.4
    );

    const vx = (Math.random() - 0.5) * 1.8;
    const vy = Math.random() * 1.2 + 0.2;
    const vz = -(Math.random() * 8.0 + 8.0);
    const life = 0.5 + Math.random() * 0.45;

    this.scene.add(mesh);
    this.damageSmoke.add({
      mesh,
      vx,
      vy,
      vz,
      rotX: (Math.random() - 0.5) * 4.0,
      rotY: (Math.random() - 0.5) * 4.0,
      scaleRate: isHeavy ? 3.2 : 2.2,
      life,
      maxLife: life,
      initialOpacity: mat.opacity,
    });
  }

  // Radial shield break / hit distortion shockwave
  public spawnShieldBreakShockwave(origin: THREE.Vector3, isPlayer2 = false) {
    const geom = new THREE.RingGeometry(0.6, 1.1, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: isPlayer2 ? 0xf43f5e : 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(origin);
    mesh.rotation.x = -Math.PI * 0.3;

    this.scene.add(mesh);
    this.shockwaves.add({
      mesh,
      growthRate: 14.0,
      life: 0.4,
      maxLife: 0.4,
    });
  }

  // Re-apply skin livery colors when not flashing
  private applyLiveries() {
    const { hull: hullColor, armor: armorColor, trim: trimColor, cockpit: cockpitColor } =
      COMBAT_SKIN_PALETTES[this.activeSkinId];

    for (const mat of this.hullMaterials) {
      mat.color.setHex(hullColor);
      mat.emissive.setHex(0x000000);
    }
    for (const mat of this.armorMaterials) {
      mat.color.setHex(armorColor);
      mat.emissive.setHex(0x000000);
    }
    for (const mat of this.trimMaterials) {
      mat.color.setHex(trimColor);
      mat.emissive.setHex(trimColor);
      mat.emissiveIntensity = 0.85;
    }
    if (this.cockpitMaterial) {
      this.cockpitMaterial.color.setHex(cockpitColor);
      this.cockpitMaterial.emissive.setHex(cockpitColor);
      this.cockpitMaterial.emissiveIntensity = 0.45;
    }
  }

  // Set skin liveries
  public setShipSkin(skinId: ShipSkinId) {
    this.activeSkinId = skinId;
    if (this.p1Spaceship) {
      this.p1Spaceship.setSkin(skinId);
    }
    this.applyLiveries();
  }

  // Camera View Toggle
  public setViewMode(mode: CameraViewMode) {
    this.viewMode = mode;
  }

  public setLocale(locale: SupportedLocale) {
    this.locale = locale;
  }

  // Trigger Hyperspace jump between waves or at launch
  public triggerHyperspaceJump(callback?: () => void) {
    this.isWarpJumping = true;
    this.warpTime = 0;
    this.warpDuration = 1.3;
    this.warpCallback = callback || null;
    this.warpLinesGroup.visible = true;

    // Flare thrusters
    for (const light of this.playerEngineLights) light.intensity = 20.0;
    for (const plume of this.playerEnginePlumes) plume.scale.set(3.2, 4.0, 3.2);
  }

  public triggerHyperspaceArrival() {
    this.isWarpJumping = true;
    this.warpTime = 0.5; // Starts mid-warp and exits smoothly
    this.warpDuration = 1.1;
    this.warpLinesGroup.visible = true;
  }

  // Environment: Infinite 3D Starfield
  private createStarfield(): THREE.Points {
    const count = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 240;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 350;

      const shade = 0.75 + Math.random() * 0.25;
      const tint = Math.random();
      if (tint > 0.8) {
        colors[i * 3] = shade * 0.7;
        colors[i * 3 + 1] = shade * 0.9;
        colors[i * 3 + 2] = shade; // Cyan tint
      } else if (tint > 0.6) {
        colors[i * 3] = shade;
        colors[i * 3 + 1] = shade * 0.6;
        colors[i * 3 + 2] = shade * 0.9; // Purple tint
      } else {
        colors[i * 3] = shade;
        colors[i * 3 + 1] = shade;
        colors[i * 3 + 2] = shade; // Pure white
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    return new THREE.Points(geometry, material);
  }

  // Environment: Warp Tunnel Light Streaks
  private createWarpLines(): THREE.Group {
    const group = new THREE.Group();
    const lineCount = 380;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(lineCount * 6);
    const colors = new Float32Array(lineCount * 6);

    for (let i = 0; i < lineCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.5 + Math.random() * 22;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.7;
      const z = -60 + Math.random() * 120;
      const length = 18 + Math.random() * 32;

      // Start vertex
      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;

      // End vertex
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z + length;

      // Bright Cyan/Electric Indigo Color
      const c = i % 2 === 0 ? new THREE.Color(0x38bdf8) : new THREE.Color(0xa855f7);
      colors[i * 6] = c.r;
      colors[i * 6 + 1] = c.g;
      colors[i * 6 + 2] = c.b;
      colors[i * 6 + 3] = c.r * 1.5;
      colors[i * 6 + 4] = c.g * 1.5;
      colors[i * 6 + 5] = c.b * 1.5;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(geom, mat);
    group.add(lines);
    group.visible = false;
    return group;
  }

  // Environment: Distant Gas Giant Planet
  private createPlanetaryBackdrop(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(-65, 30, 160);

    // Planet Sphere
    const planetGeom = new THREE.SphereGeometry(32, 48, 48);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.65,
      metalness: 0.15,
      emissive: 0x0e244d,
      emissiveIntensity: 0.2,
    });
    const planet = new THREE.Mesh(planetGeom, planetMat);
    group.add(planet);

    // Planetary Rings
    const ringGeom = new THREE.RingGeometry(42, 68, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI * 0.42;
    ring.rotation.y = Math.PI * 0.15;
    group.add(ring);

    return group;
  }

  // Environment: Distant Cosmic Nebulae
  private createCosmicNebulae(): THREE.Group {
    const group = new THREE.Group();
    const colors = [0x0284c7, 0x9333ea, 0xec4899];

    for (let i = 0; i < 6; i++) {
      const geom = new THREE.SphereGeometry(18 + Math.random() * 20, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.045,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const nebula = new THREE.Mesh(geom, mat);
      nebula.position.set(
        (Math.random() - 0.5) * 160,
        (Math.random() - 0.5) * 80 + 20,
        80 + Math.random() * 120
      );
      group.add(nebula);
    }
    return group;
  }

  // Environment: Drifting Asteroids
  private createDriftingAsteroids(): THREE.Group {
    const group = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9,
      metalness: 0.1,
    });

    for (let i = 0; i < 28; i++) {
      const size = 1.2 + Math.random() * 3.5;
      const geom = new THREE.DodecahedronGeometry(size, 1);
      const mesh = new THREE.Mesh(geom, rockMat);
      mesh.position.set(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 60,
        20 + Math.random() * 140
      );
      mesh.userData = {
        rotX: (Math.random() - 0.5) * 0.015,
        rotY: (Math.random() - 0.5) * 0.015,
      };
      group.add(mesh);
    }
    return group;
  }

  // Procedural Hull Texture with Carbon Panels
  private createHullTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 512);

      // Tech panel seams
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      for (let i = 0; i < 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }

      // Carbon weave
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      for (let y = 0; y < 512; y += 4) {
        for (let x = 0; x < 512; x += 4) {
          if ((x + y) % 8 === 0) {
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 3D Spaceship Factory
  private buildStarfighter(isPlayer2 = false): THREE.Group {
    const ship = new Spaceship3D(isPlayer2 ? {
      hullColor: 0x2e1065,
      wingColor: 0x4c1d95,
      cockpitColor: 0xf43f5e,
      flameColor: 0xf43f5e,
      isPlayer2: true,
    } : undefined);
    return ship.mesh;
  }

  // 3D Hexagonal Energy Deflector Shield
  private createShieldBubble(colorHex: number): THREE.Mesh {
    const geom = new THREE.SphereGeometry(2.4, 24, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
      blending: THREE.AdditiveBlending,
    });
    const shield = new THREE.Mesh(geom, mat);
    shield.scale.set(1.2, 0.6, 1.25);
    return shield;
  }

  // 3D Volumetric Continuous Laser Beam
  private createLaserBeamObject(): { group: THREE.Group; core: THREE.Mesh; glow: THREE.Mesh; rings: THREE.Mesh[] } {
    const group = new THREE.Group();

    // Laser Core (Intense white cylinder)
    const coreGeom = new THREE.CylinderGeometry(0.12, 0.12, 38, 12);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    core.rotation.x = Math.PI / 2;
    core.position.z = 19;
    group.add(core);

    // Laser Halo Glow (Hot Pink / Magenta)
    const glowGeom = new THREE.CylinderGeometry(0.45, 0.45, 38, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff37a6,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.rotation.x = Math.PI / 2;
    glow.position.z = 19;
    group.add(glow);

    // Revolving Laser Harmonic Energy Rings
    const rings: THREE.Mesh[] = [];
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    for (let i = 0; i < 7; i++) {
      const ringGeom = new THREE.TorusGeometry(0.55, 0.04, 8, 16);
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.z = 4 + i * 5;
      group.add(ring);
      rings.push(ring);
    }

    return { group, core, glow, rings };
  }

  // Map 2D Coordinates (800x600) to 3D Space
  // GAME_WIDTH = 800, GAME_HEIGHT = 600
  // Player at bottom y: 530 -> 3D Z: 0.0 (near camera)
  // Enemies at top y: 40 -> 3D Z: 24.0 (downrange)
  private map2Dto3D(x: number, y: number): THREE.Vector3 {
    const validX = Number.isFinite(x) ? x : GAME_WIDTH / 2;
    const validY = Number.isFinite(y) ? y : GAME_HEIGHT / 2;
    const threeX = ((validX - GAME_WIDTH / 2) / (GAME_WIDTH / 2)) * 12.0;
    // Map y: 0 -> Z: 24.0, y: 600 -> Z: -2.0
    const threeZ = 24.0 - (validY / GAME_HEIGHT) * 26.0;
    return new THREE.Vector3(threeX, 0, threeZ);
  }

  // Synchronize the scene with the current combat state.
  public syncWithFrame(engine: CombatSceneSource) {
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Detect Wave Progression -> Hyperspace Jump Transition!
    if (engine.wave > this.previousWave && this.previousWave > 0) {
      this.triggerHyperspaceJump();
    }
    this.previousWave = engine.wave;

    // 2. Hyperspace Warp Handling
    if (this.isWarpJumping) {
      this.warpTime += delta;

      // Camera sits DIRECTLY BEHIND THE SHIP in full 3D chase view!
      const p1Pos = this.map2Dto3D(engine.player1.x + engine.player1.width / 2, engine.player1.y);
      const shakeX = (Math.random() - 0.5) * 0.08 * (this.warpTime + 0.3);
      const shakeY = (Math.random() - 0.5) * 0.08 * (this.warpTime + 0.3);

      this.currentCameraPos.set(p1Pos.x * 0.3 + shakeX, 1.8 + shakeY, p1Pos.z - 5.5);
      this.currentLookAt.set(p1Pos.x * 0.15, 0.4, p1Pos.z + 40.0);
      this.camera.position.copy(this.currentCameraPos);
      this.camera.lookAt(this.currentLookAt);

      // Camera FOV warp stretch
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 88, 6, delta);
      this.camera.updateProjectionMatrix();

      // Warp Lines streaming backwards
      const posAttr = this.warpLinesGroup.children[0] as THREE.LineSegments;
      if (posAttr) {
        posAttr.position.z -= 180 * delta;
        if (posAttr.position.z < -60) posAttr.position.z = 60;
      }

      // Finish warp jump
      if (this.warpTime >= this.warpDuration) {
        this.isWarpJumping = false;
        this.warpLinesGroup.visible = false;
        if (this.warpCallback) {
          const cb = this.warpCallback;
          this.warpCallback = null;
          cb();
        }
      }
    } else {
      // Normal Camera FOV restoration
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 56, 4, delta);
      this.camera.updateProjectionMatrix();
    }

    if (this.p1Spaceship) this.p1Spaceship.update(delta, true);
    if (this.p2Spaceship) this.p2Spaceship.update(delta, true);

    // 3. Dynamic Visual Damage Detection for Player 1
    if (engine.player1.lives < this.prevP1Lives) {
      // Direct Hull Breach / Lost Life!
      const p1Pos = this.playerShipGroup.position;
      this.spawnDamageSparks(p1Pos, false, 50);
      for (let k = 0; k < 12; k++) {
        this.spawnSmokePuff(p1Pos, true);
      }
      this.p1HitFlashTimer = 1.0;
      this.p1Recoil.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.3, -0.8);
    } else if (engine.player1.shield < this.prevP1Shield) {
      // Deflector Shield Took Hit!
      const p1Pos = this.playerShipGroup.position;
      this.spawnDamageSparks(p1Pos, true, 35);
      for (let k = 0; k < 6; k++) {
        this.spawnSmokePuff(p1Pos, false);
      }
      if (engine.player1.shield === 0) {
        // Shield Collapsed!
        this.spawnShieldBreakShockwave(p1Pos, false);
      }
      this.p1HitFlashTimer = 0.85;
      this.p1Recoil.set((Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.2, -0.4);
    }
    this.prevP1Shield = engine.player1.shield;
    this.prevP1Lives = engine.player1.lives;

    // 4. Dynamic Visual Damage Detection for Player 2 (Co-op)
    if (engine.twoPlayerMode && engine.player2) {
      if (engine.player2.lives < this.prevP2Lives) {
        const p2Pos = this.player2ShipGroup.position;
        this.spawnDamageSparks(p2Pos, false, 50);
        for (let k = 0; k < 12; k++) {
          this.spawnSmokePuff(p2Pos, true);
        }
        this.p2HitFlashTimer = 1.0;
        this.p2Recoil.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.3, -0.8);
      } else if (engine.player2.shield < this.prevP2Shield) {
        const p2Pos = this.player2ShipGroup.position;
        this.spawnDamageSparks(p2Pos, true, 35);
        for (let k = 0; k < 6; k++) {
          this.spawnSmokePuff(p2Pos, false);
        }
        if (engine.player2.shield === 0) {
          this.spawnShieldBreakShockwave(p2Pos, true);
        }
        this.p2HitFlashTimer = 0.85;
        this.p2Recoil.set((Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.2, -0.4);
      }
      this.prevP2Shield = engine.player2.shield;
      this.prevP2Lives = engine.player2.lives;
    }

    // 5. Sync Player 1 Starfighter
    if (engine.player1.lives > 0) {
      this.playerShipGroup.visible = true;
      const p1Pos = this.map2Dto3D(engine.player1.x + engine.player1.width / 2, engine.player1.y);

      // Damp recoil impulse back towards zero
      this.p1Recoil.lerp(new THREE.Vector3(0, 0, 0), delta * 8.0);
      this.playerShipGroup.position.set(
        p1Pos.x + this.p1Recoil.x,
        this.p1Recoil.y,
        p1Pos.z + this.p1Recoil.z
      );

      // Banking lean when steering + hit vibration shudder
      let targetBank = 0;
      if (engine.player1.movingLeft) targetBank = 0.45;
      else if (engine.player1.movingRight) targetBank = -0.45;
      if (this.p1HitFlashTimer > 0) {
        targetBank += Math.sin(time * 45) * 0.25 * this.p1HitFlashTimer;
      }
      this.playerBankAngle = THREE.MathUtils.damp(this.playerBankAngle, targetBank, 10, delta);
      this.playerShipGroup.rotation.z = this.playerBankAngle;
      this.playerShipGroup.rotation.x = Math.sin(time * 2) * 0.02 + this.p1Recoil.z * 0.3;

      // Trailing Engine Smoke when damaged or depleted shield
      if (engine.player1.shield < 50 || engine.player1.lives <= 1 || this.p1HitFlashTimer > 0) {
        this.smokeEmitAccumulator += delta;
        const threshold = engine.player1.lives <= 1 ? 0.04 : engine.player1.shield < 30 ? 0.07 : 0.12;
        if (this.smokeEmitAccumulator >= threshold) {
          this.smokeEmitAccumulator = 0;
          // Left engine nozzle
          this.spawnSmokePuff(
            new THREE.Vector3(this.playerShipGroup.position.x + 0.38, 0, this.playerShipGroup.position.z - 1.8),
            engine.player1.lives <= 1
          );
          // Right engine nozzle
          this.spawnSmokePuff(
            new THREE.Vector3(this.playerShipGroup.position.x - 0.38, 0, this.playerShipGroup.position.z - 1.8),
            engine.player1.lives <= 1
          );
          // Hull fracture smoke if lives are critical
          if (engine.player1.lives <= 1) {
            this.spawnSmokePuff(
              new THREE.Vector3(
                this.playerShipGroup.position.x + (Math.random() - 0.5) * 0.8,
                0.2,
                this.playerShipGroup.position.z - 0.4
              ),
              true
            );
          }
        }
      }

      // Thruster pulse & sputtering engine flicker under damage
      const isSputtering = this.p1HitFlashTimer > 0 || engine.player1.lives <= 1 || engine.player1.shield === 0;
      const sputterPulse = isSputtering && Math.random() < 0.35 ? 0.3 : 1.0;
      const pulse = (1.0 + Math.sin(time * 18) * 0.15) * sputterPulse;

      for (const plume of this.playerEnginePlumes) {
        plume.scale.set(pulse, 1.0 + pulse * 0.4, pulse);
      }
      for (const light of this.playerEngineLights) {
        light.intensity = isSputtering && Math.random() < 0.3 ? 0.6 : 3.5;
      }

      // Dynamic Damage Flash on Starfighter Materials
      if (this.p1HitFlashTimer > 0) {
        this.p1HitFlashTimer = Math.max(0, this.p1HitFlashTimer - delta * 2.8);
        const isRedStrobe = Math.floor(time * 30) % 2 === 0;
        const flashColor = isRedStrobe ? 0xef4444 : 0xffffff;
        for (const m of this.hullMaterials) m.emissive.setHex(flashColor);
        for (const m of this.armorMaterials) m.emissive.setHex(flashColor);
        for (const m of this.trimMaterials) m.emissive.setHex(0xffffff);
        if (this.cockpitMaterial) this.cockpitMaterial.emissive.setHex(0xff0000);
      } else {
        // Re-apply pristine liveries
        this.applyLiveries();
      }

      // Shield Bubble Impact Ripple & Intensity
      if (engine.player1.shield > 0) {
        const mat = this.playerShieldMesh.material as THREE.MeshBasicMaterial;
        const hitShieldBoost = this.p1HitFlashTimer > 0 ? 0.55 : 0;
        mat.opacity = Math.min(0.95, 0.25 + (engine.player1.shield / 100) * 0.35 + Math.sin(time * 8) * 0.1 + hitShieldBoost);
        this.playerShieldMesh.rotation.y = time * 0.8;
      } else {
        (this.playerShieldMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      // Update 3D In-World Holographic Health Bar
      this.updateInWorldHealthBar(
        this.p1HealthBarCanvas,
        this.p1HealthBarTexture,
        engine.player1,
        false,
        this.p1HitFlashTimer
      );
    } else {
      this.playerShipGroup.visible = false;
    }

    // 6. Sync Player 2 Starfighter (Co-op)
    if (engine.twoPlayerMode && engine.player2 && engine.player2.lives > 0) {
      this.player2ShipGroup.visible = true;
      const p2Pos = this.map2Dto3D(engine.player2.x + engine.player2.width / 2, engine.player2.y);

      this.p2Recoil.lerp(new THREE.Vector3(0, 0, 0), delta * 8.0);
      this.player2ShipGroup.position.set(
        p2Pos.x + this.p2Recoil.x,
        this.p2Recoil.y,
        p2Pos.z + this.p2Recoil.z
      );

      let targetBank2 = 0;
      if (engine.player2.movingLeft) targetBank2 = 0.45;
      else if (engine.player2.movingRight) targetBank2 = -0.45;
      if (this.p2HitFlashTimer > 0) {
        targetBank2 += Math.sin(time * 45) * 0.25 * this.p2HitFlashTimer;
      }
      this.player2BankAngle = THREE.MathUtils.damp(this.player2BankAngle, targetBank2, 10, delta);
      this.player2ShipGroup.rotation.z = this.player2BankAngle;

      if (this.p2HitFlashTimer > 0) {
        this.p2HitFlashTimer = Math.max(0, this.p2HitFlashTimer - delta * 2.8);
        const flashColor = Math.floor(time * 30) % 2 === 0 ? 0xf43f5e : 0xffffff;
        for (const m of this.p2HullMaterials) m.emissive.setHex(flashColor);
        for (const m of this.p2ArmorMaterials) m.emissive.setHex(flashColor);
      } else {
        for (const m of this.p2HullMaterials) m.emissive.setHex(0x000000);
        for (const m of this.p2ArmorMaterials) m.emissive.setHex(0x000000);
      }

      if (engine.player2.shield > 0) {
        (this.player2ShieldMesh.material as THREE.MeshBasicMaterial).opacity = 0.35 + (this.p2HitFlashTimer > 0 ? 0.4 : 0);
      } else {
        (this.player2ShieldMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      this.updateInWorldHealthBar(
        this.p2HealthBarCanvas,
        this.p2HealthBarTexture,
        engine.player2,
        true,
        this.p2HitFlashTimer
      );
    } else {
      this.player2ShipGroup.visible = false;
    }

    // 7. Sync Laser Beam
    if (engine.player1.isLaserActive && engine.player1.lives > 0) {
      this.laserBeamGroup.visible = true;
      const p1Pos = this.playerShipGroup.position;
      this.laserBeamGroup.position.set(p1Pos.x, 0.35, p1Pos.z);

      // Animate pulsing laser beam glow
      const laserPulse = 0.8 + Math.sin(time * 24) * 0.2;
      this.laserGlowMesh.scale.set(laserPulse, 1.0, laserPulse);
      for (let i = 0; i < this.laserRings.length; i++) {
        this.laserRings[i].rotation.z = time * (3 + i * 2);
      }
    } else {
      this.laserBeamGroup.visible = false;
    }

    // 8. Dynamic Camera Positioning based on View Mode
    if (!this.isWarpJumping) {
      const p1Pos = this.playerShipGroup.position;
      const strategy = CAMERA_VIEW_STRATEGIES[this.viewMode];
      this.targetCameraPos.set(...strategy.getCameraPosition(p1Pos.x, p1Pos.z));
      this.targetLookAt.set(...strategy.getLookAt(p1Pos.x, p1Pos.z));

      this.currentCameraPos.lerp(this.targetCameraPos, delta * 6.5);
      this.currentLookAt.lerp(this.targetLookAt, delta * 7.5);

      this.camera.position.copy(this.currentCameraPos);
      this.camera.lookAt(this.currentLookAt);
    }

    // 9-12. Sync enemies, bullets, bombs and power-ups
    this.enemyViews.sync(engine.enemies, time);
    this.bulletViews.sync(engine.bullets, time);
    this.bombViews.sync(engine.bombs, time);
    this.powerUpViews.sync(engine.powerUps, time);

    // 13. Update 3D Debris & Exploding Fragments
    this.debris.update(delta, (d) => {
      d.mesh.position.x += d.vx * delta;
      d.mesh.position.y += d.vy * delta;
      d.mesh.position.z += d.vz * delta;
      d.mesh.rotation.x += d.rotX;
      d.mesh.rotation.y += d.rotY;
      (d.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, d.life / d.maxLife);
    });

    // 14. Update Active Dynamic Damage Sparks
    this.damageSparks.update(delta, (s) => {
      s.mesh.position.x += s.vx * delta;
      s.mesh.position.y += s.vy * delta;
      s.mesh.position.z += s.vz * delta;
      s.vx *= 0.94;
      s.vy *= 0.94;
      const scale = Math.max(0.01, s.life / s.maxLife);
      s.mesh.scale.set(scale, scale, scale * 1.8);
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(1.0, s.life / (s.maxLife * 0.6));
    });

    // 15. Update Active Volumetric Damage Smoke
    this.damageSmoke.update(delta, (sm) => {
      sm.mesh.position.x += sm.vx * delta;
      sm.mesh.position.y += sm.vy * delta;
      sm.mesh.position.z += sm.vz * delta;
      sm.mesh.rotation.x += sm.rotX * delta;
      sm.mesh.rotation.y += sm.rotY * delta;
      const progress = 1 - Math.max(0, sm.life / sm.maxLife);
      const curScale = 1.0 + progress * sm.scaleRate;
      sm.mesh.scale.set(curScale, curScale, curScale);
      (sm.mesh.material as THREE.MeshBasicMaterial).opacity = sm.initialOpacity * (1 - progress);
    });

    // 16. Update Shockwave Rings (Shield Breaks & Explosive Rifts)
    this.shockwaves.update(delta, (sw) => {
      const growth = sw.growthRate * delta;
      sw.mesh.scale.x += growth;
      sw.mesh.scale.y += growth;
      const progress = 1 - Math.max(0, sw.life / sw.maxLife);
      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - progress);
    });
    // 17. Cosmic Environment gentle rotation
    this.planetGroup.rotation.y = time * 0.008;
    this.starfield.rotation.y = time * 0.004;

    for (const child of this.asteroidGroup.children) {
      const u = child.userData as { rotX: number; rotY: number };
      if (u) {
        child.rotation.x += u.rotX;
        child.rotation.y += u.rotY;
      }
    }
  }

  protected readonly onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate = () => {
    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.animate);
  };

  public getProjectedTargetData(engine: CombatSceneSource): {
    targets: ProjectedTarget[];
    primaryTarget: ProjectedTarget | null;
  } {
    return this.targetProjector.project(engine, this.camera, this.playerShipGroup.position, {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    });
  }

  protected releaseResources(): void {
    this.damageSparks.clear();
    this.damageSmoke.clear();
    this.shockwaves.clear();
    this.debris.clear();
    [this.enemyViews, this.bulletViews, this.bombViews, this.powerUpViews].forEach((v) => v.dispose());

    this.p1HealthBarTexture?.dispose();
    this.p2HealthBarTexture?.dispose();
  }

  private createEffectPools(): void {
    this.damageSparks = new TimedEffectPool<SparkEffect>(this.scene);
    this.damageSmoke = new TimedEffectPool<SmokeEffect>(this.scene);
    this.shockwaves = new TimedEffectPool<ShockwaveEffect>(this.scene);
    this.debris = new TimedEffectPool<DebrisEffect>(this.particleMeshGroup);
  }

  private createEntityViews(): void {
    this.enemyViews = new EntityViewSync<Enemy, THREE.Group, number>(this.scene, {
      create: (enemy) => this.entityFactory.createEnemy(enemy.type),
      update: (enemy, group, time) => {
        const pos = this.map2Dto3D(enemy.x + 16, enemy.y + 16);
        group.position.set(pos.x, 0, pos.z);

        // Diving swoop animation
        if (enemy.diving) {
          group.rotation.x = Math.PI * 0.25;
          group.rotation.z = Math.sin(time * 6) * 0.4;
        } else {
          group.rotation.x = 0;
          group.rotation.z = Math.sin(time * 3 + enemy.x) * 0.12;
        }
      },
      onRemove: (enemy, group) => this.spawnEnemyDebris(enemy, group.position),
    });

    this.bulletViews = new EntityViewSync<Bullet, THREE.Mesh, number>(this.scene, {
      create: (bullet) => {
        let colorHex = 0x38bdf8;
        if (!bullet.isFromPlayer) colorHex = 0xef4444;
        else if (bullet.color === '#fbbf24') colorHex = 0xfbbf24;
        else if (bullet.color === '#c084fc') colorHex = 0xc084fc;
        return this.entityFactory.createBullet(colorHex, bullet.isFromPlayer);
      },
      update: (bullet, mesh) => {
        const pos = this.map2Dto3D(bullet.x, bullet.y);
        mesh.position.set(pos.x, 0, pos.z);
      },
      onRemove: (_bullet, mesh) => mesh.geometry?.dispose(),
    });

    this.bombViews = new EntityViewSync<Bomb, THREE.Group, number>(this.scene, {
      create: () => this.entityFactory.createBomb(),
      update: (bomb, group, time) => {
        const pos = this.map2Dto3D(bomb.x + 12, bomb.y + 12);
        group.position.set(pos.x, 0, pos.z);
        group.rotation.x = time * 3;
        group.rotation.y = time * 2;
      },
    });

    this.powerUpViews = new EntityViewSync<PowerUp, THREE.Group, number>(this.scene, {
      create: (powerUp) => this.entityFactory.createPowerUp(powerUp.type),
      update: (powerUp, group, time) => {
        const pos = this.map2Dto3D(powerUp.x + 13, powerUp.y + 13);
        group.position.set(pos.x, Math.sin(time * 3 + powerUp.bobAngle) * 0.35, pos.z);
        group.rotation.y = time * 2.5;
      },
    });
  }

  private spawnEnemyDebris(enemy: Enemy, origin: THREE.Vector3): void {
    for (let k = 0; k < 14; k++) {
      const debGeom = new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.2, 0);
      const debMat = new THREE.MeshBasicMaterial({
        color: enemy.type === EnemyType.ELITE ? 0xec4899 : 0xf59e0b,
        transparent: true,
      });
      const deb = new THREE.Mesh(debGeom, debMat);
      deb.position.copy(origin);
      this.particleMeshGroup.add(deb);
      this.debris.add({
        mesh: deb,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.5) * 12,
        vz: (Math.random() - 0.5) * 16,
        rotX: (Math.random() - 0.5) * 0.2,
        rotY: (Math.random() - 0.5) * 0.2,
        life: 0.8,
        maxLife: 0.8,
      });
    }
  }
}