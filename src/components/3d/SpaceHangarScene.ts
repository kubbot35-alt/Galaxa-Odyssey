import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface CameraTargetPreset {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

export type ShipSkinId = 'stealth' | 'titanium' | 'cyberpunk' | 'hyperion';

export interface ShipSkinConfig {
  id: ShipSkinId;
  name: string;
  hullColor: number;
  armorColor: number;
  trimColor: number;
  trimEmissive: number;
  engineGlow: number;
  cockpitColor: number;
  metalness: number;
  roughness: number;
}

export const SHIP_SKINS: Record<ShipSkinId, ShipSkinConfig> = {
  stealth: {
    id: 'stealth',
    name: 'VOID STEALTH',
    hullColor: 0x0a0f1d,
    armorColor: 0x141e33,
    trimColor: 0x38bdf8,
    trimEmissive: 0x0284c7,
    engineGlow: 0x38bdf8,
    cockpitColor: 0x0284c7,
    metalness: 0.92,
    roughness: 0.22,
  },
  titanium: {
    id: 'titanium',
    name: 'SOLAR TITANIUM',
    hullColor: 0x1c1917,
    armorColor: 0x292524,
    trimColor: 0xf59e0b,
    trimEmissive: 0xd97706,
    engineGlow: 0xfbbf24,
    cockpitColor: 0xd97706,
    metalness: 0.96,
    roughness: 0.18,
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'CYBER PULSE',
    hullColor: 0x180b2c,
    armorColor: 0x271047,
    trimColor: 0xf43f5e,
    trimEmissive: 0xe11d48,
    engineGlow: 0xa855f7,
    cockpitColor: 0xec4899,
    metalness: 0.9,
    roughness: 0.2,
  },
  hyperion: {
    id: 'hyperion',
    name: 'HYPERION ARCTIC',
    hullColor: 0xededed,
    armorColor: 0xcfd8dc,
    trimColor: 0x0284c7,
    trimEmissive: 0x0369a1,
    engineGlow: 0x67e8f9,
    cockpitColor: 0x0ea5e9,
    metalness: 0.85,
    roughness: 0.25,
  },
};

export const CAMERA_PRESETS: Record<string, CameraTargetPreset> = {
  default: {
    position: new THREE.Vector3(0, 1.6, 6.2),
    lookAt: new THREE.Vector3(0, 0, 0),
  },
  weapons: {
    position: new THREE.Vector3(2.6, 0.9, 3.4),
    lookAt: new THREE.Vector3(0.8, -0.1, 0.4),
  },
  cockpit: {
    position: new THREE.Vector3(-1.2, 1.8, 3.0),
    lookAt: new THREE.Vector3(0, 0.35, 0.8),
  },
  engines: {
    position: new THREE.Vector3(-2.6, 1.4, -4.2),
    lookAt: new THREE.Vector3(0, 0.2, -1.0),
  },
  cinematic: {
    position: new THREE.Vector3(3.8, 2.5, 4.8),
    lookAt: new THREE.Vector3(0, 0.1, 0),
  },
  orbital: {
    position: new THREE.Vector3(0, 5.0, 9.5),
    lookAt: new THREE.Vector3(0, -0.5, -2.0),
  },
};

export class SpaceHangarScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;

  // Scene entities
  public shipGroup: THREE.Group;
  public planetGroup: THREE.Group;
  public ringMesh: THREE.Mesh;
  public starParticles: THREE.Points;
  public warpLinesGroup: THREE.Group;
  public engineLights: THREE.PointLight[] = [];
  public enginePlumes: THREE.Mesh[] = [];
  public laserTurretMesh: THREE.Mesh | null = null;
  public cannonMeshes: THREE.Mesh[] = [];

  // Material references for live skin switching
  private hullMaterials: THREE.MeshStandardMaterial[] = [];
  private armorMaterials: THREE.MeshStandardMaterial[] = [];
  private trimMaterials: THREE.MeshStandardMaterial[] = [];
  private cockpitMaterial: THREE.MeshPhysicalMaterial | null = null;
  private enginePlumeMaterials: THREE.MeshBasicMaterial[] = [];

  // Interaction & Camera
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private orbitSpherical = { radius: 6.4, theta: 0, phi: Math.PI / 2.3 };
  private activePreset: string = 'default';
  private targetCameraPos = CAMERA_PRESETS.default.position.clone();
  private targetLookAt = CAMERA_PRESETS.default.lookAt.clone();
  private currentLookAt = CAMERA_PRESETS.default.lookAt.clone();
  private mouseX = 0;
  private mouseY = 0;

  // Hyperdrive Warp Jump state
  private isWarping = false;
  private warpTime = 0;
  private onWarpCompleteCallback: (() => void) | null = null;

  private clock = new THREE.Clock();

  constructor(container: HTMLElement) {
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 600;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030712, 0.04);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    this.camera.position.copy(this.targetCameraPos);

    // 3. Modern Renderer setup with ACESFilmic tone mapping and SRGB color space
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // 4. Mandatory Studio Environment Reflection (RoomEnvironment) per Three.js directives
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig (Key, Rim, Underside fill, Cockpit)
    this.setupLighting();

    // 6. Deep Cosmic Vista (Stars & Nebula Particles)
    this.starParticles = this.createStarfield();
    this.scene.add(this.starParticles);

    // 7. Warp Lines (Hyperspace jump effect)
    this.warpLinesGroup = this.createWarpLines();
    this.warpLinesGroup.visible = false;
    this.scene.add(this.warpLinesGroup);

    // 8. Distant Gas Giant Planet & Ring
    this.planetGroup = this.createOrbitalPlanet();
    this.scene.add(this.planetGroup);

    // 9. Rotating Space Station Dock Ring
    this.ringMesh = this.createDockRing();
    this.scene.add(this.ringMesh);

    // 10. Holographic Levitation Flight Platform
    const flightDeck = this.createHolographicFlightDeck();
    this.scene.add(flightDeck);

    // 11. High-Fidelity 3D Starfighter
    this.shipGroup = this.createStarfighter();
    this.scene.add(this.shipGroup);

    // Apply default skin
    this.setShipSkin('stealth');

    // User Event Listeners
    this.setupInteractions(container);

    // Start render loop
    this.animate();
  }

  private setupLighting() {
    // Ambient soft cosmic fill
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.4);
    this.scene.add(ambientLight);

    // Main Sunlight Key Light
    const sunLight = new THREE.DirectionalLight(0xe0f2fe, 3.8);
    sunLight.position.set(14, 20, 16);
    this.scene.add(sunLight);

    // Cyan Aerospace Rim Light
    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 3.2);
    cyanRim.position.set(-16, 9, -12);
    this.scene.add(cyanRim);

    // Underside Neon Bounce Light
    const bounceLight = new THREE.PointLight(0xa855f7, 3.2, 28);
    bounceLight.position.set(3, -3.5, 2);
    this.scene.add(bounceLight);

    // Cockpit Top Highlight
    const cockpitLight = new THREE.PointLight(0x38bdf8, 2.2, 10);
    cockpitLight.position.set(0, 2.4, 1.0);
    this.scene.add(cockpitLight);
  }

  private createStarfield(): THREE.Points {
    const count = 2200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const radius = 70 + Math.random() * 140;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[idx] = radius * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[idx + 2] = radius * Math.cos(phi);

      const roll = Math.random();
      if (roll > 0.8) {
        colors[idx] = 0.35;
        colors[idx + 1] = 0.85;
        colors[idx + 2] = 1.0; // Electric Cyan
      } else if (roll > 0.65) {
        colors[idx] = 0.85;
        colors[idx + 1] = 0.45;
        colors[idx + 2] = 1.0; // Violet
      } else if (roll > 0.5) {
        colors[idx] = 1.0;
        colors[idx + 1] = 0.8;
        colors[idx + 2] = 0.4; // Amber Gold
      } else {
        colors[idx] = 0.95;
        colors[idx + 1] = 0.98;
        colors[idx + 2] = 1.0; // Pure Starlight White
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    return new THREE.Points(geometry, material);
  }

  private createWarpLines(): THREE.Group {
    const group = new THREE.Group();
    const lineCount = 180;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(lineCount * 6);

    for (let i = 0; i < lineCount; i++) {
      const idx = i * 6;
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 20;
      const z = -60 + Math.random() * 80;
      const length = 12 + Math.random() * 20;

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      positions[idx + 3] = x;
      positions[idx + 4] = y;
      positions[idx + 5] = z + length;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(geom, mat);
    group.add(lines);
    return group;
  }

  private createOrbitalPlanet(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(-25, 8, -65);

    // Planet core body
    const planetGeom = new THREE.SphereGeometry(20, 56, 56);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.75,
      metalness: 0.15,
      emissive: 0x0c0a24,
      emissiveIntensity: 0.4,
    });
    const planet = new THREE.Mesh(planetGeom, planetMat);
    group.add(planet);

    // Atmospheric Edge Glow Shell
    const atmoGeom = new THREE.SphereGeometry(20.6, 48, 48);
    const atmoMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const atmo = new THREE.Mesh(atmoGeom, atmoMat);
    group.add(atmo);

    // Planetary Rings
    const ringGeom = new THREE.RingGeometry(25, 42, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.38,
      roughness: 0.3,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI * 0.42;
    ring.rotation.y = Math.PI * 0.14;
    group.add(ring);

    return group;
  }

  private createDockRing(): THREE.Mesh {
    const torusGeom = new THREE.TorusGeometry(36, 1.0, 16, 96);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
    });
    const torus = new THREE.Mesh(torusGeom, torusMat);
    torus.position.set(18, -6, -46);
    torus.rotation.x = Math.PI * 0.38;
    return torus;
  }

  // Generates procedural canvas texture for starfighter fuselage
  private createHullTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dark metal panel background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 512, 512);

    // Panel seams
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

    // Rivet dots
    ctx.fillStyle = '#374151';
    for (let x = 32; x < 512; x += 64) {
      for (let y = 32; y < 512; y += 64) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Aerospace Designation Decals
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('ODYSSEY-MK4', 40, 120);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('WARNING: HYPERDRIVE FLUX', 40, 160);

    // Hazard Stripes
    for (let i = 0; i < 180; i += 20) {
      ctx.fillStyle = i % 40 === 0 ? '#f59e0b' : '#0f172a';
      ctx.fillRect(40 + i, 200, 15, 12);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  private createHolographicFlightDeck(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, -1.8, 0);

    // Holographic Circular Magnetic Platform
    const platGeom = new THREE.CylinderGeometry(4.8, 5.4, 0.28, 48);
    const platMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      metalness: 0.95,
      roughness: 0.2,
    });
    const platform = new THREE.Mesh(platGeom, platMat);
    group.add(platform);

    // Concentric Neon Runway Rings
    const ring1Geom = new THREE.RingGeometry(3.8, 3.96, 48);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
    });
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = 0.15;
    group.add(ring1);

    const ring2Geom = new THREE.RingGeometry(4.5, 4.62, 48);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
    });
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.15;
    group.add(ring2);

    // Radial Hologram Grid Lines
    const grid = new THREE.GridHelper(10, 20, 0x0284c7, 0x1e293b);
    grid.position.y = 0.155;
    group.add(grid);

    return group;
  }

  private createStarfighter(): THREE.Group {
    const ship = new THREE.Group();
    ship.position.set(0, 0, 0);

    const hullTexture = this.createHullTexture();

    // Materials
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      map: hullTexture,
      metalness: 0.92,
      roughness: 0.22,
    });
    this.hullMaterials.push(hullMat);

    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.88,
      roughness: 0.32,
    });
    this.armorMaterials.push(armorMat);

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.15,
    });
    this.trimMaterials.push(trimMat);

    const cockpitMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.45,
      metalness: 0.9,
      roughness: 0.1,
      transmission: 0.45,
      transparent: true,
      opacity: 0.92,
      ior: 1.5,
    });
    this.cockpitMaterial = cockpitMat;

    // 1. Central Aerodynamic Stealth Nose
    const noseGeom = new THREE.ConeGeometry(0.75, 3.4, 7);
    const nose = new THREE.Mesh(noseGeom, hullMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, 1.7);
    nose.scale.set(1.15, 1.0, 0.6);
    ship.add(nose);

    // Mid Fuselage Body
    const midBodyGeom = new THREE.BoxGeometry(1.4, 0.7, 2.8);
    const midBody = new THREE.Mesh(midBodyGeom, armorMat);
    midBody.position.set(0, 0, -0.4);
    ship.add(midBody);

    // 2. Cockpit Canopy (Faceted high-tech glass with glowing interior)
    const canopyGeom = new THREE.ConeGeometry(0.5, 1.7, 5);
    const canopy = new THREE.Mesh(canopyGeom, cockpitMat);
    canopy.rotation.x = Math.PI / 2 + 0.16;
    canopy.position.set(0, 0.45, 0.7);
    canopy.scale.set(0.95, 1.0, 0.55);
    ship.add(canopy);

    // 3. Swept Stealth Wings (Angular 21st-century geometry)
    const leftWingGeom = new THREE.BufferGeometry();
    const wingVertices = new Float32Array([
      0.65, 0.05, 0.8,
      3.4, -0.05, -1.7,
      0.65, -0.05, -1.9,

      0.65, 0.05, 0.8,
      3.4, -0.05, -1.7,
      2.8, 0.05, 0.1,
    ]);
    leftWingGeom.setAttribute('position', new THREE.BufferAttribute(wingVertices, 3));
    leftWingGeom.computeVertexNormals();

    const leftWing = new THREE.Mesh(leftWingGeom, hullMat);
    ship.add(leftWing);

    const rightWing = leftWing.clone();
    rightWing.scale.x = -1;
    ship.add(rightWing);

    // Wing Leading Edge Neon Circuit Trims
    const wingTrimGeom = new THREE.BoxGeometry(2.8, 0.06, 0.14);
    const leftTrim = new THREE.Mesh(wingTrimGeom, trimMat);
    leftTrim.position.set(1.95, 0.02, -0.4);
    leftTrim.rotation.y = -Math.PI * 0.24;
    ship.add(leftTrim);

    const rightTrim = leftTrim.clone();
    rightTrim.position.x = -1.95;
    rightTrim.rotation.y = Math.PI * 0.24;
    ship.add(rightTrim);

    // 4. Twin Canted Tail Fins / Vertical Stabilizers
    const finGeom = new THREE.BufferGeometry();
    const finVerts = new Float32Array([
      0, 0, 0,
      0.35, 1.2, -1.3,
      0.0, 0.0, -1.5,
    ]);
    finGeom.setAttribute('position', new THREE.BufferAttribute(finVerts, 3));
    finGeom.computeVertexNormals();

    const leftFin = new THREE.Mesh(finGeom, armorMat);
    leftFin.position.set(0.7, 0.25, -0.8);
    leftFin.rotation.z = -0.32;
    ship.add(leftFin);

    const rightFin = leftFin.clone();
    rightFin.position.x = -0.7;
    rightFin.rotation.z = 0.32;
    ship.add(rightFin);

    // 5. Heavy Combat Weapon Hardpoints
    const cannonGeom = new THREE.CylinderGeometry(0.09, 0.1, 2.4, 12);
    const leftCannon = new THREE.Mesh(cannonGeom, armorMat);
    leftCannon.rotation.x = Math.PI / 2;
    leftCannon.position.set(1.5, -0.05, 0.55);
    ship.add(leftCannon);
    this.cannonMeshes.push(leftCannon);

    const rightCannon = leftCannon.clone();
    rightCannon.position.x = -1.5;
    ship.add(rightCannon);
    this.cannonMeshes.push(rightCannon);

    // Dorsal Spine Hyper Laser Turret Emitter
    const laserLensGeom = new THREE.SphereGeometry(0.2, 16, 16);
    const laserLensMat = new THREE.MeshBasicMaterial({ color: 0xff37a6 });
    const laserLens = new THREE.Mesh(laserLensGeom, laserLensMat);
    laserLens.position.set(0, 0.42, -0.5);
    ship.add(laserLens);
    this.laserTurretMesh = laserLens;

    // Laser Turret Capacitor Orbit Ring
    const turretRingGeom = new THREE.TorusGeometry(0.35, 0.04, 8, 24);
    const turretRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const turretRing = new THREE.Mesh(turretRingGeom, turretRingMat);
    turretRing.rotation.x = Math.PI / 2;
    turretRing.position.set(0, 0.42, -0.5);
    ship.add(turretRing);

    // 6. Dual Ion Thrusters with Afterburner Cones
    const engineGeom = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 16);
    const leftEngine = new THREE.Mesh(engineGeom, hullMat);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.set(0.5, 0, -1.8);
    ship.add(leftEngine);

    const rightEngine = leftEngine.clone();
    rightEngine.position.x = -0.5;
    ship.add(rightEngine);

    // Engine Core Glow Disks
    const coreGeom = new THREE.CircleGeometry(0.28, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const leftCore = new THREE.Mesh(coreGeom, coreMat);
    leftCore.position.set(0.5, 0, -2.56);
    leftCore.rotation.y = Math.PI;
    ship.add(leftCore);

    const rightCore = leftCore.clone();
    rightCore.position.x = -0.5;
    ship.add(rightCore);

    // Volumetric Engine Plumes
    const plumeGeom = new THREE.ConeGeometry(0.28, 2.6, 16);
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    this.enginePlumeMaterials.push(plumeMat);

    const leftPlume = new THREE.Mesh(plumeGeom, plumeMat);
    leftPlume.rotation.x = -Math.PI / 2;
    leftPlume.position.set(0.5, 0, -3.6);
    ship.add(leftPlume);
    this.enginePlumes.push(leftPlume);

    const rightPlume = leftPlume.clone();
    rightPlume.position.x = -0.5;
    ship.add(rightPlume);
    this.enginePlumes.push(rightPlume);

    // Engine Point Lights
    const leftLight = new THREE.PointLight(0x38bdf8, 3.8, 9);
    leftLight.position.set(0.5, 0, -2.6);
    ship.add(leftLight);
    this.engineLights.push(leftLight);

    const rightLight = new THREE.PointLight(0x38bdf8, 3.8, 9);
    rightLight.position.set(-0.5, 0, -2.6);
    ship.add(rightLight);
    this.engineLights.push(rightLight);

    return ship;
  }

  public setShipSkin(skinId: ShipSkinId) {
    const config = SHIP_SKINS[skinId] || SHIP_SKINS.stealth;

    for (const mat of this.hullMaterials) {
      mat.color.setHex(config.hullColor);
      mat.metalness = config.metalness;
      mat.roughness = config.roughness;
    }

    for (const mat of this.armorMaterials) {
      mat.color.setHex(config.armorColor);
      mat.metalness = config.metalness * 0.95;
      mat.roughness = config.roughness * 1.3;
    }

    for (const mat of this.trimMaterials) {
      mat.color.setHex(config.trimColor);
      mat.emissive.setHex(config.trimEmissive);
    }

    if (this.cockpitMaterial) {
      this.cockpitMaterial.color.setHex(config.cockpitColor);
      this.cockpitMaterial.emissive.setHex(config.trimColor);
    }

    for (const plumeMat of this.enginePlumeMaterials) {
      plumeMat.color.setHex(config.engineGlow);
    }

    for (const light of this.engineLights) {
      light.color.setHex(config.engineGlow);
    }
  }

  public setCameraFocus(presetName: string) {
    this.activePreset = presetName;
    const preset = CAMERA_PRESETS[presetName] || CAMERA_PRESETS.default;
    this.targetCameraPos = preset.position.clone();
    this.targetLookAt = preset.lookAt.clone();
  }

  // Engage 3D Hyperdrive launch warp sequence with behind-the-ship camera view!
  public triggerHyperdriveLaunch(onComplete: () => void) {
    this.isWarping = true;
    this.warpTime = 0;
    this.onWarpCompleteCallback = onComplete;
    this.warpLinesGroup.visible = true;

    // Immediately snap camera to DIRECTLY BEHIND THE SHIP (3D Chase view!)
    this.camera.position.set(
      this.shipGroup.position.x,
      this.shipGroup.position.y + 1.35,
      this.shipGroup.position.z - 4.8
    );
    this.targetCameraPos.set(
      this.shipGroup.position.x,
      this.shipGroup.position.y + 1.35,
      this.shipGroup.position.z - 4.8
    );
    this.targetLookAt.set(
      this.shipGroup.position.x,
      this.shipGroup.position.y + 0.35,
      this.shipGroup.position.z + 30
    );
    this.currentLookAt.copy(this.targetLookAt);
    this.camera.lookAt(this.targetLookAt);

    // Flare engines to maximum afterburner
    for (const light of this.engineLights) {
      light.intensity = 18.0;
    }
    for (const plume of this.enginePlumes) {
      plume.scale.set(2.8, 3.6, 2.8);
    }
  }

  private setupInteractions(container: HTMLElement) {
    const dom = container;

    const onMouseDown = (e: MouseEvent) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      // General subtle parallax for camera
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      this.mouseX = normX * 0.45;
      this.mouseY = normY * 0.35;

      // Mouse drag orbital rotation
      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.orbitSpherical.theta -= deltaX * 0.007;
        this.orbitSpherical.phi = Math.max(0.3, Math.min(Math.PI / 1.7, this.orbitSpherical.phi - deltaY * 0.007));

        this.previousMousePosition = { x: e.clientX, y: e.clientY };

        // Switch to free orbit if dragged
        const x = this.orbitSpherical.radius * Math.sin(this.orbitSpherical.phi) * Math.sin(this.orbitSpherical.theta);
        const y = this.orbitSpherical.radius * Math.cos(this.orbitSpherical.phi);
        const z = this.orbitSpherical.radius * Math.sin(this.orbitSpherical.phi) * Math.cos(this.orbitSpherical.theta);

        this.targetCameraPos.set(x, y, z);
        this.targetLookAt.set(0, 0, 0);
      }
    };

    const onMouseUp = () => {
      this.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.orbitSpherical.radius = Math.max(3.0, Math.min(10.0, this.orbitSpherical.radius + e.deltaY * 0.005));
      const x = this.orbitSpherical.radius * Math.sin(this.orbitSpherical.phi) * Math.sin(this.orbitSpherical.theta);
      const y = this.orbitSpherical.radius * Math.cos(this.orbitSpherical.phi);
      const z = this.orbitSpherical.radius * Math.sin(this.orbitSpherical.phi) * Math.cos(this.orbitSpherical.theta);
      this.targetCameraPos.set(x, y, z);
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    const container = this.renderer.domElement.parentElement;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public update() {
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    if (this.isWarping) {
      this.warpTime += delta;

      // 1. Ship tilt forward & accelerate violently into hyperspace (+Z)
      this.shipGroup.rotation.x = THREE.MathUtils.damp(this.shipGroup.rotation.x, -0.06, 6, delta);
      this.shipGroup.position.z += this.warpTime * 65 * delta;

      // 2. Camera stays tightly locked DIRECTLY BEHIND the ship in full 3D chase view!
      const shakeX = (Math.random() - 0.5) * 0.06 * Math.min(1, this.warpTime * 2);
      const shakeY = (Math.random() - 0.5) * 0.06 * Math.min(1, this.warpTime * 2);

      this.camera.position.set(
        this.shipGroup.position.x + shakeX,
        this.shipGroup.position.y + 1.35 + shakeY,
        this.shipGroup.position.z - 4.8
      );
      this.camera.lookAt(
        this.shipGroup.position.x,
        this.shipGroup.position.y + 0.35,
        this.shipGroup.position.z + 40
      );

      // 3. Camera FOV dynamic warp tunnel stretch
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 86, 5, delta);
      this.camera.updateProjectionMatrix();

      // 4. Warp Lines streaming backwards past camera
      const posAttr = this.warpLinesGroup.children[0] as THREE.LineSegments;
      if (posAttr) {
        posAttr.position.z -= 180 * delta;
        if (posAttr.position.z < -60) posAttr.position.z = 40;
      }

      // 5. Thrusters maximum burn
      const pulse = 2.4 + Math.sin(time * 30) * 0.4;
      for (const plume of this.enginePlumes) {
        plume.scale.set(pulse, 3.2, pulse);
      }

      // Finish jump after ~0.95s
      if (this.warpTime > 0.95 && this.onWarpCompleteCallback) {
        const cb = this.onWarpCompleteCallback;
        this.onWarpCompleteCallback = null;
        this.isWarping = false;
        cb();
        return;
      }
    } else {
      // Gentle Starfighter Idle Levitation
      const hoverY = Math.sin(time * 1.8) * 0.08;
      const hoverRoll = Math.sin(time * 1.3) * 0.03;
      const hoverPitch = Math.cos(time * 1.5) * 0.02;

      this.shipGroup.position.y = hoverY;
      this.shipGroup.rotation.z = hoverRoll + (this.isDragging ? 0 : this.mouseX * 0.12);
      this.shipGroup.rotation.x = hoverPitch - (this.isDragging ? 0 : this.mouseY * 0.08);
      if (!this.isDragging) {
        this.shipGroup.rotation.y = this.mouseX * 0.22;
      }

      // Thruster Afterburner Pulse
      const pulse = 1.0 + Math.sin(time * 16) * 0.12;
      for (const plume of this.enginePlumes) {
        plume.scale.set(pulse, 0.95 + pulse * 0.25, pulse);
      }
      for (const light of this.engineLights) {
        light.intensity = 3.2 + Math.sin(time * 22) * 0.8;
      }

      // Background Planetary & Cosmic Rotation
      this.planetGroup.rotation.y = time * 0.012;
      this.ringMesh.rotation.z = time * 0.03;
      this.starParticles.rotation.y = time * 0.006;

      // Smooth Camera Damping
      const camTarget = this.targetCameraPos.clone();
      if (!this.isDragging && this.activePreset === 'default') {
        camTarget.x += this.mouseX * 0.6;
        camTarget.y += this.mouseY * 0.4;
      }

      this.camera.position.lerp(camTarget, 0.05);
      this.currentLookAt.lerp(this.targetLookAt, 0.05);
      this.camera.lookAt(this.currentLookAt);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private animate = () => {
    this.update();
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
