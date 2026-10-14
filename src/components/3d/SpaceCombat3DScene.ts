import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GameEngine, Enemy, Bullet, Bomb, PowerUp, Particle } from '../../game/GameEngine';
import { EnemyType, WeaponMode, PowerUpType, GameState } from '../../types/game';
import { GAME_WIDTH, GAME_HEIGHT, LASER_BEAM_WIDTH } from '../../game/constants';
import { ShipSkinId } from './SpaceHangarScene';

export type CameraViewMode = 'CHASE_3D' | 'TACTICAL_3D' | 'COCKPIT_3D';

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
  private playerShipGroup: THREE.Group;
  private player2ShipGroup: THREE.Group;
  private playerShieldMesh: THREE.Mesh;
  private player2ShieldMesh: THREE.Mesh;
  private playerEnginePlumes: THREE.Mesh[] = [];
  private playerEngineLights: THREE.PointLight[] = [];
  private player2EnginePlumes: THREE.Mesh[] = [];
  private playerBankAngle = 0;
  private player2BankAngle = 0;

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
  private debrisMeshes: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; rotX: number; rotY: number; life: number; maxLife: number }[] = [];

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private mainSunLight: THREE.DirectionalLight;
  private engineGlowLight: THREE.PointLight;

  // Current Skin
  public activeSkinId: ShipSkinId = 'titanium';
  private hullMaterials: THREE.MeshStandardMaterial[] = [];
  private trimMaterials: THREE.MeshStandardMaterial[] = [];
  private armorMaterials: THREE.MeshStandardMaterial[] = [];
  private cockpitMaterial: THREE.MeshPhysicalMaterial | null = null;

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

    // 5. Build Player Starfighter
    this.playerShipGroup = this.buildStarfighter(false);
    this.scene.add(this.playerShipGroup);

    this.playerShieldMesh = this.createShieldBubble(0x38bdf8);
    this.playerShipGroup.add(this.playerShieldMesh);

    // Player 2 Starfighter (Co-op)
    this.player2ShipGroup = this.buildStarfighter(true);
    this.player2ShipGroup.visible = false;
    this.scene.add(this.player2ShipGroup);

    this.player2ShieldMesh = this.createShieldBubble(0xf43f5e);
    this.player2ShipGroup.add(this.player2ShieldMesh);

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

  // Set skin liveries
  public setShipSkin(skinId: ShipSkinId) {
    this.activeSkinId = skinId;

    let hullColor = 0x0f172a;
    let armorColor = 0x1e293b;
    let trimColor = 0x38bdf8;
    let cockpitColor = 0x0284c7;

    switch (skinId) {
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

    for (const mat of this.hullMaterials) mat.color.setHex(hullColor);
    for (const mat of this.armorMaterials) mat.color.setHex(armorColor);
    for (const mat of this.trimMaterials) {
      mat.color.setHex(trimColor);
      mat.emissive.setHex(trimColor);
    }
    if (this.cockpitMaterial) {
      this.cockpitMaterial.color.setHex(cockpitColor);
      this.cockpitMaterial.emissive.setHex(cockpitColor);
    }
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
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 180,
        (Math.random() - 0.5) * 90,
        80 + Math.random() * 120
      );
      group.add(mesh);
    }
    return group;
  }

  // Environment: Tumbling Asteroids
  private createDriftingAsteroids(): THREE.Group {
    const group = new THREE.Group();
    const geom = new THREE.DodecahedronGeometry(1.4, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.2,
    });

    for (let i = 0; i < 24; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 40 - 8,
        Math.random() * 90 - 10
      );
      const s = 0.6 + Math.random() * 1.5;
      mesh.scale.set(s, s, s);
      mesh.userData = {
        rotX: (Math.random() - 0.5) * 0.02,
        rotY: (Math.random() - 0.5) * 0.02,
      };
      group.add(mesh);
    }
    return group;
  }

  // Procedural Hull Texture
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

  // Build high-poly 3D Starfighter Model
  private buildStarfighter(isPlayer2 = false): THREE.Group {
    const ship = new THREE.Group();
    const hullTexture = this.createHullTexture();

    const hullMat = new THREE.MeshStandardMaterial({
      color: isPlayer2 ? 0x2e1065 : 0x0f172a,
      map: hullTexture,
      metalness: 0.9,
      roughness: 0.22,
    });
    if (!isPlayer2) this.hullMaterials.push(hullMat);

    const armorMat = new THREE.MeshStandardMaterial({
      color: isPlayer2 ? 0x4c1d95 : 0x1e293b,
      metalness: 0.88,
      roughness: 0.32,
    });
    if (!isPlayer2) this.armorMaterials.push(armorMat);

    const trimMat = new THREE.MeshStandardMaterial({
      color: isPlayer2 ? 0xf43f5e : 0x38bdf8,
      emissive: isPlayer2 ? 0xe11d48 : 0x0284c7,
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.15,
    });
    if (!isPlayer2) this.trimMaterials.push(trimMat);

    const cockpitMat = new THREE.MeshPhysicalMaterial({
      color: isPlayer2 ? 0xf43f5e : 0x0284c7,
      emissive: isPlayer2 ? 0xfb7185 : 0x38bdf8,
      emissiveIntensity: 0.45,
      metalness: 0.9,
      roughness: 0.1,
      transmission: 0.45,
      transparent: true,
      opacity: 0.92,
    });
    if (!isPlayer2) this.cockpitMaterial = cockpitMat;

    // 1. Aerodynamic Stealth Nose
    const noseGeom = new THREE.ConeGeometry(0.55, 2.6, 7);
    const nose = new THREE.Mesh(noseGeom, hullMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, 1.3);
    nose.scale.set(1.15, 1.0, 0.6);
    ship.add(nose);

    // Mid Fuselage Body
    const midBodyGeom = new THREE.BoxGeometry(1.1, 0.55, 2.2);
    const midBody = new THREE.Mesh(midBodyGeom, armorMat);
    midBody.position.set(0, 0, -0.3);
    ship.add(midBody);

    // 2. Cockpit Canopy Glass
    const canopyGeom = new THREE.ConeGeometry(0.38, 1.4, 5);
    const canopy = new THREE.Mesh(canopyGeom, cockpitMat);
    canopy.rotation.x = Math.PI / 2 + 0.16;
    canopy.position.set(0, 0.35, 0.5);
    canopy.scale.set(0.95, 1.0, 0.55);
    ship.add(canopy);

    // 3. Swept Stealth Wings
    const leftWingGeom = new THREE.BufferGeometry();
    const wingVertices = new Float32Array([
      0.5, 0.04, 0.6,
      2.6, -0.04, -1.3,
      0.5, -0.04, -1.5,

      0.5, 0.04, 0.6,
      2.6, -0.04, -1.3,
      2.2, 0.04, 0.1,
    ]);
    leftWingGeom.setAttribute('position', new THREE.BufferAttribute(wingVertices, 3));
    leftWingGeom.computeVertexNormals();

    const leftWing = new THREE.Mesh(leftWingGeom, hullMat);
    ship.add(leftWing);

    const rightWing = leftWing.clone();
    rightWing.scale.x = -1;
    ship.add(rightWing);

    // Wing Neon Trims
    const trimGeom = new THREE.BoxGeometry(2.2, 0.05, 0.1);
    const leftTrim = new THREE.Mesh(trimGeom, trimMat);
    leftTrim.position.set(1.5, 0.02, -0.3);
    leftTrim.rotation.y = -Math.PI * 0.24;
    ship.add(leftTrim);

    const rightTrim = leftTrim.clone();
    rightTrim.position.x = -1.5;
    rightTrim.rotation.y = Math.PI * 0.24;
    ship.add(rightTrim);

    // 4. Twin Canted Tail Fins
    const finGeom = new THREE.BufferGeometry();
    const finVerts = new Float32Array([
      0, 0, 0,
      0.28, 0.95, -1.0,
      0.0, 0.0, -1.2,
    ]);
    finGeom.setAttribute('position', new THREE.BufferAttribute(finVerts, 3));
    finGeom.computeVertexNormals();

    const leftFin = new THREE.Mesh(finGeom, armorMat);
    leftFin.position.set(0.55, 0.2, -0.6);
    leftFin.rotation.z = -0.32;
    ship.add(leftFin);

    const rightFin = leftFin.clone();
    rightFin.position.x = -0.55;
    rightFin.rotation.z = 0.32;
    ship.add(rightFin);

    // 5. Heavy Combat Plasma Cannons
    const cannonGeom = new THREE.CylinderGeometry(0.07, 0.08, 1.8, 10);
    const leftCannon = new THREE.Mesh(cannonGeom, armorMat);
    leftCannon.rotation.x = Math.PI / 2;
    leftCannon.position.set(1.15, -0.04, 0.4);
    ship.add(leftCannon);

    const rightCannon = leftCannon.clone();
    rightCannon.position.x = -1.15;
    ship.add(rightCannon);

    // Dorsal Hyper Laser Turret Emitter
    const turretGeom = new THREE.SphereGeometry(0.16, 16, 16);
    const turretMat = new THREE.MeshBasicMaterial({ color: isPlayer2 ? 0xf43f5e : 0x38bdf8 });
    const turret = new THREE.Mesh(turretGeom, turretMat);
    turret.position.set(0, 0.35, -0.4);
    ship.add(turret);

    // 6. Dual Ion Thrusters with Afterburners
    const engineGeom = new THREE.CylinderGeometry(0.24, 0.32, 1.2, 14);
    const leftEngine = new THREE.Mesh(engineGeom, hullMat);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.set(0.38, 0, -1.4);
    ship.add(leftEngine);

    const rightEngine = leftEngine.clone();
    rightEngine.position.x = -0.38;
    ship.add(rightEngine);

    // Glowing Afterburner Plasma Cones
    const plumeGeom = new THREE.ConeGeometry(0.22, 1.1, 12);
    const plumeMat = new THREE.MeshBasicMaterial({
      color: isPlayer2 ? 0xf43f5e : 0x38bdf8,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });

    const leftPlume = new THREE.Mesh(plumeGeom, plumeMat);
    leftPlume.rotation.x = -Math.PI / 2;
    leftPlume.position.set(0.38, 0, -2.1);
    ship.add(leftPlume);

    const rightPlume = leftPlume.clone();
    rightPlume.position.x = -0.38;
    ship.add(rightPlume);

    if (isPlayer2) {
      this.player2EnginePlumes.push(leftPlume, rightPlume);
    } else {
      this.playerEnginePlumes.push(leftPlume, rightPlume);
      const leftLight = new THREE.PointLight(0x38bdf8, 3.5, 6);
      leftLight.position.set(0.38, 0, -2.2);
      ship.add(leftLight);
      this.playerEngineLights.push(leftLight);

      const rightLight = new THREE.PointLight(0x38bdf8, 3.5, 6);
      rightLight.position.set(-0.38, 0, -2.2);
      ship.add(rightLight);
      this.playerEngineLights.push(rightLight);
    }

    return ship;
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

    // Laser Core Cylinder
    const coreGeom = new THREE.CylinderGeometry(0.08, 0.08, 48, 12);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    core.rotation.x = Math.PI / 2;
    core.position.z = 24;
    group.add(core);

    // Laser Outer Plasma Glow
    const glowGeom = new THREE.CylinderGeometry(0.24, 0.28, 48, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff37a6,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.rotation.x = Math.PI / 2;
    glow.position.z = 24;
    group.add(glow);

    // Pulsing Laser Resonance Rings
    const rings: THREE.Mesh[] = [];
    const ringGeom = new THREE.TorusGeometry(0.42, 0.04, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < 6; i++) {
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.z = 4 + i * 7;
      group.add(ring);
      rings.push(ring);
    }

    return { group, core, glow, rings };
  }

  // Create 3D Enemy Models
  private createEnemyMesh(type: EnemyType): THREE.Group {
    const group = new THREE.Group();

    if (type === EnemyType.ELITE) {
      // ELITE WARSHIP: Heavy Dual-Fuselage Cruiser
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x3b0764,
        metalness: 0.85,
        roughness: 0.3,
        emissive: 0x581c87,
        emissiveIntensity: 0.35,
      });
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x581c87,
        metalness: 0.9,
        roughness: 0.2,
      });
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xc084fc,
      });

      // Central Reactor Hull
      const hullGeom = new THREE.BoxGeometry(1.4, 0.6, 2.0);
      const hull = new THREE.Mesh(hullGeom, bodyMat);
      group.add(hull);

      // Forward Armor Delta Wings
      const wingGeom = new THREE.ConeGeometry(1.6, 2.2, 4);
      const wings = new THREE.Mesh(wingGeom, wingMat);
      wings.rotation.x = -Math.PI / 2;
      wings.rotation.y = Math.PI / 4;
      wings.scale.set(1.5, 0.8, 0.4);
      group.add(wings);

      // Dual Heavy Plasma Cannons
      const cannonGeom = new THREE.CylinderGeometry(0.08, 0.1, 1.6, 8);
      const c1 = new THREE.Mesh(cannonGeom, bodyMat);
      c1.rotation.x = Math.PI / 2;
      c1.position.set(0.85, -0.1, -0.4);
      group.add(c1);

      const c2 = c1.clone();
      c2.position.x = -0.85;
      group.add(c2);

      // Glowing Reactor Core Sphere
      const coreGeom = new THREE.SphereGeometry(0.3, 16, 16);
      const core = new THREE.Mesh(coreGeom, glowMat);
      core.position.set(0, 0.2, 0);
      group.add(core);

      // Dual Red Engine Thrusters
      const engMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
      const engGeom = new THREE.ConeGeometry(0.18, 0.7, 8);
      const eng1 = new THREE.Mesh(engGeom, engMat);
      eng1.rotation.x = Math.PI / 2;
      eng1.position.set(0.45, 0, 1.2);
      group.add(eng1);

      const eng2 = eng1.clone();
      eng2.position.x = -0.45;
      group.add(eng2);

    } else {
      // STANDARD DRONE: Sleek Arrowhead Interceptor
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1e1b4b,
        metalness: 0.88,
        roughness: 0.35,
      });
      const visorMat = new THREE.MeshBasicMaterial({
        color: 0xef4444, // Glowing Red Visor
      });
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xf97316, // Orange Thruster
      });

      // Sharp Arrowhead Fuselage
      const noseGeom = new THREE.ConeGeometry(0.65, 1.8, 5);
      const nose = new THREE.Mesh(noseGeom, bodyMat);
      nose.rotation.x = -Math.PI / 2;
      nose.scale.set(1.2, 1.0, 0.5);
      group.add(nose);

      // Red Visor
      const visorGeom = new THREE.BoxGeometry(0.7, 0.12, 0.2);
      const visor = new THREE.Mesh(visorGeom, visorMat);
      visor.position.set(0, 0.15, -0.3);
      group.add(visor);

      // Swept Back Wings
      const wingGeom = new THREE.BoxGeometry(2.0, 0.06, 0.7);
      const wings = new THREE.Mesh(wingGeom, bodyMat);
      wings.position.set(0, -0.05, 0.3);
      group.add(wings);

      // Rear Engine Thruster
      const thrusterGeom = new THREE.ConeGeometry(0.16, 0.6, 8);
      const thruster = new THREE.Mesh(thrusterGeom, glowMat);
      thruster.rotation.x = Math.PI / 2;
      thruster.position.set(0, 0, 1.0);
      group.add(thruster);
    }

    return group;
  }

  // Create 3D Holographic Power-Up Crystal
  private createPowerUpMesh(type: PowerUpType): THREE.Group {
    const group = new THREE.Group();

    let colorHex = 0x38bdf8;
    if (type === PowerUpType.TOKEN_TRIPLE_SHOT) colorHex = 0xfbbf24;
    else if (type === PowerUpType.TOKEN_LASER_BEAM) colorHex = 0xff37a6;
    else if (type === PowerUpType.TOKEN_PLASMA_SPREAD) colorHex = 0xc084fc;
    else if (type === PowerUpType.EXTRA_LIFE) colorHex = 0x4ade80;
    else if (type === PowerUpType.SHIELD_BOOST) colorHex = 0x06b6d4;

    // Glowing Octahedron Crystal
    const crystalGeom = new THREE.OctahedronGeometry(0.55, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.15,
      transparent: true,
      opacity: 0.9,
    });
    const crystal = new THREE.Mesh(crystalGeom, crystalMat);
    group.add(crystal);

    // Concentric Energy Orbit Ring
    const ringGeom = new THREE.TorusGeometry(0.85, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    return group;
  }

  // Create 3D Plasma Bomb
  private createBombMesh(): THREE.Group {
    const group = new THREE.Group();

    // Spiked Core
    const coreGeom = new THREE.DodecahedronGeometry(0.45, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.85,
      roughness: 0.3,
      emissive: 0xef4444,
      emissiveIntensity: 0.6,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    group.add(core);

    // Glowing Danger Halo
    const haloGeom = new THREE.SphereGeometry(0.75, 12, 12);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    group.add(halo);

    return group;
  }

  // Create 3D Plasma Projectile Bullet
  private createBulletMesh(colorHex: number, isFromPlayer: boolean): THREE.Mesh {
    const geom = new THREE.CylinderGeometry(0.08, 0.08, isFromPlayer ? 1.4 : 1.0, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  // Add 3D Volumetric Explosion Debris
  public addExplosion3D(x: number, y: number, colorHex: number) {
    const pos = this.map2Dto3D(x, y);

    for (let i = 0; i < 14; i++) {
      const geom = new THREE.TetrahedronGeometry(0.18 + Math.random() * 0.25, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 1.0,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
      this.particleMeshGroup.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 7.0;
      this.debrisMeshes.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: (Math.random() - 0.5) * 4.0,
        vz: Math.sin(angle) * speed,
        rotX: (Math.random() - 0.5) * 0.2,
        rotY: (Math.random() - 0.5) * 0.2,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
      });
    }
  }

  // Map 2D GameEngine coordinate system to 3D Space coordinates
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

    // 3. Sync Player 1 Starfighter
    if (engine.player1.lives > 0) {
      this.playerShipGroup.visible = true;
      const p1Pos = this.map2Dto3D(engine.player1.x + engine.player1.width / 2, engine.player1.y);
      this.playerShipGroup.position.set(p1Pos.x, 0, p1Pos.z);

      // Banking lean when steering
      let targetBank = 0;
      if (engine.player1.movingLeft) targetBank = 0.45;
      else if (engine.player1.movingRight) targetBank = -0.45;
      this.playerBankAngle = THREE.MathUtils.damp(this.playerBankAngle, targetBank, 10, delta);
      this.playerShipGroup.rotation.z = this.playerBankAngle;
      this.playerShipGroup.rotation.x = Math.sin(time * 2) * 0.02;

      // Thruster pulse
      const pulse = 1.0 + Math.sin(time * 18) * 0.15;
      for (const plume of this.playerEnginePlumes) {
        plume.scale.set(pulse, 1.0 + pulse * 0.4, pulse);
      }

      // Shield Bubble
      if (engine.player1.shield > 0) {
        const mat = this.playerShieldMesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.25 + (engine.player1.shield / 100) * 0.35 + Math.sin(time * 8) * 0.1;
        this.playerShieldMesh.rotation.y = time * 0.8;
      } else {
        (this.playerShieldMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    } else {
      this.playerShipGroup.visible = false;
    }

    // 4. Sync Player 2 Starfighter (Co-op)
    if (engine.twoPlayerMode && engine.player2 && engine.player2.lives > 0) {
      this.player2ShipGroup.visible = true;
      const p2Pos = this.map2Dto3D(engine.player2.x + engine.player2.width / 2, engine.player2.y);
      this.player2ShipGroup.position.set(p2Pos.x, 0, p2Pos.z);

      let targetBank2 = 0;
      if (engine.player2.movingLeft) targetBank2 = 0.45;
      else if (engine.player2.movingRight) targetBank2 = -0.45;
      this.player2BankAngle = THREE.MathUtils.damp(this.player2BankAngle, targetBank2, 10, delta);
      this.player2ShipGroup.rotation.z = this.player2BankAngle;

      if (engine.player2.shield > 0) {
        (this.player2ShieldMesh.material as THREE.MeshBasicMaterial).opacity = 0.35;
      } else {
        (this.player2ShieldMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    } else {
      this.player2ShipGroup.visible = false;
    }

    // 5. Sync Laser Beam
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

    // 6. Camera Position Update (when not warping)
    if (!this.isWarpJumping) {
      const pX = this.playerShipGroup.position.x;
      const pZ = this.playerShipGroup.position.z;

      if (this.viewMode === 'CHASE_3D') {
        // Third-person chase cam behind and slightly elevated
        this.targetCameraPos.set(pX * 0.45, 3.8, pZ - 8.2);
        this.targetLookAt.set(pX * 0.25, 0.6, pZ + 14.0);
      } else if (this.viewMode === 'COCKPIT_3D') {
        // Tight over-the-shoulder chase view
        this.targetCameraPos.set(pX * 0.85, 1.8, pZ - 4.6);
        this.targetLookAt.set(pX * 0.35, 0.4, pZ + 22.0);
      } else {
        // Tactical elevated 3D view
        this.targetCameraPos.set(0, 16.0, -10.0);
        this.targetLookAt.set(0, 0, 10.0);
      }

      this.currentCameraPos.lerp(this.targetCameraPos, 0.08);
      this.currentLookAt.lerp(this.targetLookAt, 0.08);
      this.camera.position.copy(this.currentCameraPos);
      this.camera.lookAt(this.currentLookAt);
    }

    // 7. Sync Enemies
    const activeEnemies = new Set(engine.enemies);
    // Remove dead enemy meshes
    for (const [enemy, mesh] of this.enemyMeshMap.entries()) {
      if (!activeEnemies.has(enemy)) {
        this.scene.remove(mesh);
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
          }
        });
        this.enemyMeshMap.delete(enemy);
      }
    }

    // Add / Update active enemies
    for (const enemy of engine.enemies) {
      let mesh = this.enemyMeshMap.get(enemy);
      if (!mesh) {
        mesh = this.createEnemyMesh(enemy.type);
        this.scene.add(mesh);
        this.enemyMeshMap.set(enemy, mesh);
      }

      const pos = this.map2Dto3D(enemy.x + 16, enemy.y + 16);
      mesh.position.set(pos.x, 0, pos.z);

      // Enemy dive rotation
      if (enemy.diving) {
        mesh.rotation.x = Math.PI * 0.15; // Pitch down towards player
        mesh.rotation.z = Math.sin(enemy.angle * 2.5) * 0.35; // Bank into turn
      } else {
        mesh.rotation.x = 0;
        mesh.rotation.z = Math.sin(enemy.angle) * 0.12;
      }
    }

    // 8. Sync Bullets
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

    // 9. Sync Bombs
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

    // 10. Sync Power-Ups
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

    // 11. Update 3D Debris & Particles
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

    // 12. Cosmic Environment gentle rotation
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

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);

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
