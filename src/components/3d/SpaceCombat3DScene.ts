import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GameEngine, Enemy, Bullet, Bomb, PowerUp, Particle, PlayerState } from '../../game/GameEngine';
import { EnemyType, WeaponMode, PowerUpType, GameState } from '../../types/game';
import { GAME_WIDTH, GAME_HEIGHT, LASER_BEAM_WIDTH } from '../../game/constants';
import { ShipSkinId } from './SpaceHangarScene';
import { Spaceship3D } from './Spaceship3D';

export type CameraViewMode = 'CHASE_3D' | 'TACTICAL_3D' | 'COCKPIT_3D';

export interface ProjectedTarget {
  id: string;
  type: EnemyType;
  screenX: number;
  screenY: number;
  screenPercentX: number;
  screenPercentY: number;
  inView: boolean;
  distanceUnits: number;
  distanceMeters: number;
  relativeVelocity: number;
  radarX: number;
  radarZ: number;
  hp: number;
  maxHp: number;
  isDiving: boolean;
  enemyRef: Enemy;
}

export class SpaceCombat3DScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private animFrameId: number | null = null;

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
  private damageSparkMeshes: {
    mesh: THREE.Mesh;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
  }[] = [];

  // Active Dynamic Engine / Hull Smoke
  private damageSmokeMeshes: {
    mesh: THREE.Mesh;
    vx: number;
    vy: number;
    vz: number;
    rotX: number;
    rotY: number;
    scaleRate: number;
    life: number;
    maxLife: number;
    initialOpacity: number;
  }[] = [];

  // Shockwave Rings (e.g. Shield Break or Hit Ripple)
  private shockwaveRings: {
    mesh: THREE.Mesh;
    growthRate: number;
    life: number;
    maxLife: number;
  }[] = [];

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
  private enemyMeshMap = new Map<Enemy, THREE.Group>();
  private bulletMeshMap = new Map<Bullet, THREE.Mesh>();
  private bombMeshMap = new Map<Bomb, THREE.Group>();
  private powerUpMeshMap = new Map<PowerUp, THREE.Group>();

  // Debris & Particle system
  private particleMeshGroup: THREE.Group;
  private debrisMeshes: {
    mesh: THREE.Mesh;
    vx: number;
    vy: number;
    vz: number;
    rotX: number;
    rotY: number;
    life: number;
    maxLife: number;
  }[] = [];

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

  constructor(container: HTMLElement, initialSkin: ShipSkinId = 'titanium') {
    this.container = container;
    this.activeSkinId = initialSkin;
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
    ctx.fillText(isPlayer2 ? 'P2 DEFLECTOR SHIELD' : 'P1 DEFLECTOR SHIELD', 20, 26);

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
    ctx.fillText('HULL RESERVES:', 20, 68);

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
      ctx.fillText(`⚡ ${player.hitNotice} ⚡`, 256, 100);
      ctx.shadowBlur = 0;
    } else {
      ctx.font = '11px monospace';
      ctx.fillStyle = shield === 0 ? '#ef4444' : 'rgba(148, 163, 184, 0.8)';
      ctx.fillText(
        shield === 0
          ? '⚠️ SHIELD COLLAPSED - DIRECT HULL VULNERABILITY'
          : `WEAPON MODE: ${player.weaponMode} • ENERGY: ${Math.round(player.weaponEnergy)}%`,
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
      this.damageSparkMeshes.push({
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
    this.damageSmokeMeshes.push({
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
    this.shockwaveRings.push({
      mesh,
      growthRate: 14.0,
      life: 0.4,
      maxLife: 0.4,
    });
  }

  // Re-apply skin livery colors when not flashing
  private applyLiveries() {
    let hullColor = 0x0f172a;
    let armorColor = 0x1e293b;
    let trimColor = 0x38bdf8;
    let cockpitColor = 0x0284c7;

    switch (this.activeSkinId) {
      case 'stealth':
        hullColor = 0x050508;
        armorColor = 0x0f0f15;
        trimColor = 0x818cf8;
        cockpitColor = 0x4f46e5;
        break;
      case 'titanium':
        hullColor = 0x1e293b;
        armorColor = 0x334155;
        trimColor = 0x38bdf8;
        cockpitColor = 0x0284c7;
        break;
      case 'cyberpunk':
        hullColor = 0x18181b;
        armorColor = 0x27272a;
        trimColor = 0xf43f5e;
        cockpitColor = 0xf59e0b;
        break;
      case 'hyperion':
        hullColor = 0xf8fafc;
        armorColor = 0xe2e8f0;
        trimColor = 0xeab308;
        cockpitColor = 0x06b6d4;
        break;
    }

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

  // 3D Enemy Models
  private createEnemy3DMesh(type: EnemyType): THREE.Group {
    const group = new THREE.Group();
    const isElite = type === EnemyType.ELITE;

    const baseColor = isElite ? 0x9333ea : 0xef4444;
    const accentColor = isElite ? 0xf43f5e : 0xf59e0b;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.85,
      roughness: 0.25,
      emissive: accentColor,
      emissiveIntensity: 0.35,
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.9,
    });

    if (isElite) {
      // Heavy Dreadnought Cruiser
      const mainGeom = new THREE.BoxGeometry(1.6, 0.6, 1.8);
      const main = new THREE.Mesh(mainGeom, bodyMat);
      group.add(main);

      // Angled Prow Blades
      const bladeGeom = new THREE.ConeGeometry(0.5, 1.4, 4);
      const leftBlade = new THREE.Mesh(bladeGeom, bodyMat);
      leftBlade.rotation.x = -Math.PI / 2;
      leftBlade.position.set(0.9, 0, -0.6);
      group.add(leftBlade);

      const rightBlade = leftBlade.clone();
      rightBlade.position.x = -0.9;
      group.add(rightBlade);

      // Rotating Alien Core
      const coreGeom = new THREE.OctahedronGeometry(0.45, 0);
      const core = new THREE.Mesh(coreGeom, glowMat);
      core.position.set(0, 0.35, 0);
      group.add(core);

      // Twin Plasma Turbines
      const turbineGeom = new THREE.CylinderGeometry(0.18, 0.24, 0.8, 10);
      const t1 = new THREE.Mesh(turbineGeom, glowMat);
      t1.rotation.x = Math.PI / 2;
      t1.position.set(0.5, 0, 1.0);
      group.add(t1);

      const t2 = t1.clone();
      t2.position.x = -0.5;
      group.add(t2);
    } else {
      // Standard Aggressive Stinger Drone
      const geom = new THREE.TetrahedronGeometry(1.0, 1);
      const drone = new THREE.Mesh(geom, bodyMat);
      drone.rotation.x = Math.PI;
      drone.scale.set(1.2, 0.6, 1.4);
      group.add(drone);

      // Bio-mechanical Visor Eye
      const eyeGeom = new THREE.BoxGeometry(0.6, 0.14, 0.14);
      const eye = new THREE.Mesh(eyeGeom, glowMat);
      eye.position.set(0, 0, -0.7);
      group.add(eye);
    }

    return group;
  }

  // 3D Energy Projectiles
  private createBulletMesh(colorHex: number, isPlayer: boolean): THREE.Mesh {
    const geom = new THREE.CylinderGeometry(0.08, 0.08, isPlayer ? 1.4 : 1.0, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const bullet = new THREE.Mesh(geom, mat);
    bullet.rotation.x = Math.PI / 2;
    return bullet;
  }

  // 3D Orbital Mine / Bomb
  private createBombMesh(): THREE.Group {
    const group = new THREE.Group();
    const coreGeom = new THREE.SphereGeometry(0.55, 12, 12);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    group.add(core);

    // Spikes
    const spikeGeom = new THREE.ConeGeometry(0.12, 0.6, 6);
    const spikeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 6; i++) {
      const spike = new THREE.Mesh(spikeGeom, spikeMat);
      const angle = (i / 6) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 0.55, Math.sin(angle) * 0.55, 0);
      spike.rotation.z = angle - Math.PI / 2;
      group.add(spike);
    }
    return group;
  }

  // 3D Holographic Token Power-Up
  private createPowerUpMesh(type: PowerUpType): THREE.Group {
    const group = new THREE.Group();

    let colorHex = 0x38bdf8;
    if (type === PowerUpType.TOKEN_TRIPLE_SHOT) colorHex = 0xfbbf24;
    else if (type === PowerUpType.TOKEN_LASER_BEAM) colorHex = 0xff37a6;
    else if (type === PowerUpType.TOKEN_PLASMA_SPREAD) colorHex = 0xc084fc;
    else if (type === PowerUpType.EXTRA_LIFE) colorHex = 0x4ade80;

    // Glowing Hexagonal Hologram Crystal
    const hexGeom = new THREE.CylinderGeometry(0.65, 0.65, 0.25, 6);
    const hexMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.75,
      metalness: 0.95,
      roughness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    const token = new THREE.Mesh(hexGeom, hexMat);
    token.rotation.x = Math.PI / 2;
    group.add(token);

    // Rotating Energy Ring
    const ringGeom = new THREE.TorusGeometry(0.9, 0.05, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    group.add(ring);

    return group;
  }

  // Map 2D Coordinates (800x600) to 3D Space
  // GAME_WIDTH = 800, GAME_HEIGHT = 600
  // Player at bottom y: 530 -> 3D Z: 0.0 (near camera)
  // Enemies at top y: 40 -> 3D Z: 24.0 (downrange)
  private map2Dto3D(x: number, y: number): THREE.Vector3 {
    const threeX = ((x - GAME_WIDTH / 2) / (GAME_WIDTH / 2)) * 12.0;
    // Map y: 0 -> Z: 24.0, y: 600 -> Z: -2.0
    const threeZ = 24.0 - (y / GAME_HEIGHT) * 26.0;
    return new THREE.Vector3(threeX, 0, threeZ);
  }

  // Main Frame Synchronizer with GameEngine
  public syncWithEngine(engine: GameEngine) {
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

      switch (this.viewMode) {
        case 'CHASE_3D':
          // Behind-the-ship dynamic 3rd person chase view
          this.targetCameraPos.set(p1Pos.x * 0.55, 3.8, p1Pos.z - 7.5);
          this.targetLookAt.set(p1Pos.x * 0.45, 0.6, p1Pos.z + 18.0);
          break;

        case 'COCKPIT_3D':
          // Close tight chase view right over canopy
          this.targetCameraPos.set(p1Pos.x, 1.25, p1Pos.z - 1.8);
          this.targetLookAt.set(p1Pos.x, 0.8, p1Pos.z + 24.0);
          break;

        case 'TACTICAL_3D':
          // High panoramic tactical combat angle
          this.targetCameraPos.set(p1Pos.x * 0.2, 14.5, p1Pos.z - 8.0);
          this.targetLookAt.set(p1Pos.x * 0.1, 0, 10.0);
          break;
      }

      this.currentCameraPos.lerp(this.targetCameraPos, delta * 6.5);
      this.currentLookAt.lerp(this.targetLookAt, delta * 7.5);

      this.camera.position.copy(this.currentCameraPos);
      this.camera.lookAt(this.currentLookAt);
    }

    // 9. Sync Enemies
    const activeEnemies = new Set(engine.enemies);
    for (const [enemy, group] of this.enemyMeshMap.entries()) {
      if (!activeEnemies.has(enemy)) {
        // Spawn 3D debris explosion
        for (let k = 0; k < 14; k++) {
          const debGeom = new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.2, 0);
          const debMat = new THREE.MeshBasicMaterial({
            color: enemy.type === EnemyType.ELITE ? 0xec4899 : 0xf59e0b,
            transparent: true,
          });
          const deb = new THREE.Mesh(debGeom, debMat);
          deb.position.copy(group.position);
          this.particleMeshGroup.add(deb);
          this.debrisMeshes.push({
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

        this.scene.remove(group);
        this.enemyMeshMap.delete(enemy);
      }
    }

    for (const enemy of engine.enemies) {
      let group = this.enemyMeshMap.get(enemy);
      if (!group) {
        group = this.createEnemy3DMesh(enemy.type);
        this.scene.add(group);
        this.enemyMeshMap.set(enemy, group);
      }

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
    }

    // 10. Sync Bullets
    const activeBullets = new Set(engine.bullets);
    for (const [bullet, mesh] of this.bulletMeshMap.entries()) {
      if (!activeBullets.has(bullet)) {
        this.scene.remove(mesh);
        mesh.geometry?.dispose();
        this.bulletMeshMap.delete(bullet);
      }
    }

    for (const bullet of engine.bullets) {
      let mesh = this.bulletMeshMap.get(bullet);
      if (!mesh) {
        let colorHex = 0x38bdf8;
        if (!bullet.isFromPlayer) colorHex = 0xef4444;
        else if (bullet.color === '#fbbf24') colorHex = 0xfbbf24;
        else if (bullet.color === '#c084fc') colorHex = 0xc084fc;

        mesh = this.createBulletMesh(colorHex, bullet.isFromPlayer);
        this.scene.add(mesh);
        this.bulletMeshMap.set(bullet, mesh);
      }

      const pos = this.map2Dto3D(bullet.x, bullet.y);
      mesh.position.set(pos.x, 0, pos.z);
    }

    // 11. Sync Bombs
    const activeBombs = new Set(engine.bombs);
    for (const [bomb, group] of this.bombMeshMap.entries()) {
      if (!activeBombs.has(bomb)) {
        this.scene.remove(group);
        this.bombMeshMap.delete(bomb);
      }
    }

    for (const bomb of engine.bombs) {
      let group = this.bombMeshMap.get(bomb);
      if (!group) {
        group = this.createBombMesh();
        this.scene.add(group);
        this.bombMeshMap.set(bomb, group);
      }

      const pos = this.map2Dto3D(bomb.x + 12, bomb.y + 12);
      group.position.set(pos.x, 0, pos.z);
      group.rotation.x = time * 3;
      group.rotation.y = time * 2;
    }

    // 12. Sync Power-Ups
    const activePowerUps = new Set(engine.powerUps);
    for (const [powerUp, group] of this.powerUpMeshMap.entries()) {
      if (!activePowerUps.has(powerUp)) {
        this.scene.remove(group);
        this.powerUpMeshMap.delete(powerUp);
      }
    }

    for (const powerUp of engine.powerUps) {
      let group = this.powerUpMeshMap.get(powerUp);
      if (!group) {
        group = this.createPowerUpMesh(powerUp.type);
        this.scene.add(group);
        this.powerUpMeshMap.set(powerUp, group);
      }

      const pos = this.map2Dto3D(powerUp.x + 13, powerUp.y + 13);
      group.position.set(pos.x, Math.sin(time * 3 + powerUp.bobAngle) * 0.35, pos.z);
      group.rotation.y = time * 2.5;
    }

    // 13. Update 3D Debris & Exploding Fragments
    for (let i = this.debrisMeshes.length - 1; i >= 0; i--) {
      const d = this.debrisMeshes[i];
      d.life -= delta;
      d.mesh.position.x += d.vx * delta;
      d.mesh.position.y += d.vy * delta;
      d.mesh.position.z += d.vz * delta;
      d.mesh.rotation.x += d.rotX;
      d.mesh.rotation.y += d.rotY;

      const alpha = Math.max(0, d.life / d.maxLife);
      (d.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;

      if (d.life <= 0) {
        this.particleMeshGroup.remove(d.mesh);
        d.mesh.geometry?.dispose();
        this.debrisMeshes.splice(i, 1);
      }
    }

    // 14. Update Active Dynamic Damage Sparks
    for (let i = this.damageSparkMeshes.length - 1; i >= 0; i--) {
      const s = this.damageSparkMeshes[i];
      s.life -= delta;
      s.mesh.position.x += s.vx * delta;
      s.mesh.position.y += s.vy * delta;
      s.mesh.position.z += s.vz * delta;
      s.vx *= 0.94;
      s.vy *= 0.94;
      const scale = Math.max(0.01, s.life / s.maxLife);
      s.mesh.scale.set(scale, scale, scale * 1.8);
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(1.0, s.life / (s.maxLife * 0.6));
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.Material).dispose();
        this.damageSparkMeshes.splice(i, 1);
      }
    }

    // 15. Update Active Volumetric Damage Smoke
    for (let i = this.damageSmokeMeshes.length - 1; i >= 0; i--) {
      const sm = this.damageSmokeMeshes[i];
      sm.life -= delta;
      sm.mesh.position.x += sm.vx * delta;
      sm.mesh.position.y += sm.vy * delta;
      sm.mesh.position.z += sm.vz * delta;
      sm.mesh.rotation.x += sm.rotX * delta;
      sm.mesh.rotation.y += sm.rotY * delta;
      const progress = 1 - Math.max(0, sm.life / sm.maxLife);
      const curScale = 1.0 + progress * sm.scaleRate;
      sm.mesh.scale.set(curScale, curScale, curScale);
      (sm.mesh.material as THREE.MeshBasicMaterial).opacity = sm.initialOpacity * (1 - progress);
      if (sm.life <= 0) {
        this.scene.remove(sm.mesh);
        sm.mesh.geometry.dispose();
        (sm.mesh.material as THREE.Material).dispose();
        this.damageSmokeMeshes.splice(i, 1);
      }
    }

    // 16. Update Shockwave Rings (Shield Breaks & Explosive Rifts)
    for (let i = this.shockwaveRings.length - 1; i >= 0; i--) {
      const sw = this.shockwaveRings[i];
      sw.life -= delta;
      const growth = sw.growthRate * delta;
      sw.mesh.scale.x += growth;
      sw.mesh.scale.y += growth;
      const progress = 1 - Math.max(0, sw.life / sw.maxLife);
      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - progress);
      if (sw.life <= 0) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        (sw.mesh.material as THREE.Material).dispose();
        this.shockwaveRings.splice(i, 1);
      }
    }

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

  private onResize = () => {
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

  public getProjectedTargetData(engine: GameEngine): {
    targets: ProjectedTarget[];
    primaryTarget: ProjectedTarget | null;
  } {
    const targets: ProjectedTarget[] = [];
    if (!engine || !engine.enemies || engine.enemies.length === 0) {
      return { targets: [], primaryTarget: null };
    }

    const p1Pos = this.playerShipGroup
      ? this.playerShipGroup.position
      : this.map2Dto3D(engine.player1.x + engine.player1.width / 2, engine.player1.y);

    const canvasWidth = this.container.clientWidth || 1000;
    const canvasHeight = this.container.clientHeight || 640;

    let bestScore = Infinity;
    let primaryTarget: ProjectedTarget | null = null;

    for (let i = 0; i < engine.enemies.length; i++) {
      const enemy = engine.enemies[i];
      const pos = this.map2Dto3D(enemy.x + 16, enemy.y + 16);

      const dx = pos.x - p1Pos.x;
      const dz = pos.z - p1Pos.z;
      const distUnits = Math.hypot(dx, dz);
      const distMeters = Math.round(distUnits * 32 + 120);

      // Closing velocity in m/s (negative means closing in)
      const relativeVel = enemy.diving ? -145 : -38;

      // Project into 3D camera screen space
      const v = pos.clone();
      v.y = 0.3; // enemy hull center
      v.project(this.camera);

      const inFront = v.z < 1.0;
      const screenX = ((v.x + 1) / 2) * canvasWidth;
      const screenY = ((-v.y + 1) / 2) * canvasHeight;
      const screenPercentX = ((v.x + 1) / 2) * 100;
      const screenPercentY = ((-v.y + 1) / 2) * 100;
      const inView = inFront && v.x >= -1.15 && v.x <= 1.15 && v.y >= -1.15 && v.y <= 1.15;

      // Normalized radar relative coordinates (-1..1 horizontal, 0..1 downrange)
      const radarX = THREE.MathUtils.clamp(dx / 12, -1, 1);
      const radarZ = THREE.MathUtils.clamp(dz / 26, 0, 1);

      const projected: ProjectedTarget = {
        id: `tgt-${enemy.type}-${Math.round(enemy.startX)}-${i}`,
        type: enemy.type,
        screenX,
        screenY,
        screenPercentX,
        screenPercentY,
        inView,
        distanceUnits: distUnits,
        distanceMeters: distMeters,
        relativeVelocity: relativeVel,
        radarX,
        radarZ,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        isDiving: !!enemy.diving,
        enemyRef: enemy,
      };

      targets.push(projected);

      // Boresight lock scoring: prioritize targets closest to forward firing axis
      let score = Math.abs(dx) * 2.2 + distUnits * 0.8;
      if (enemy.diving) score -= 8.0; // Urgent diving threat
      if (enemy.type === EnemyType.ELITE) score -= 3.0;

      if (score < bestScore) {
        bestScore = score;
        primaryTarget = projected;
      }
    }

    return { targets, primaryTarget };
  }

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);

    // Dispose active sparks
    for (const s of this.damageSparkMeshes) {
      this.scene.remove(s.mesh);
      s.mesh.geometry.dispose();
      (s.mesh.material as THREE.Material).dispose();
    }
    this.damageSparkMeshes = [];

    // Dispose active smoke
    for (const sm of this.damageSmokeMeshes) {
      this.scene.remove(sm.mesh);
      sm.mesh.geometry.dispose();
      (sm.mesh.material as THREE.Material).dispose();
    }
    this.damageSmokeMeshes = [];

    // Dispose shockwaves
    for (const sw of this.shockwaveRings) {
      this.scene.remove(sw.mesh);
      sw.mesh.geometry.dispose();
      (sw.mesh.material as THREE.Material).dispose();
    }
    this.shockwaveRings = [];

    this.p1HealthBarTexture?.dispose();
    this.p2HealthBarTexture?.dispose();

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
