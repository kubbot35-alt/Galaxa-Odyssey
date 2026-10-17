import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Spaceship3D } from './Spaceship3D';
import { HangarInteractionController } from './HangarInteractionController';
import { DisposableScene } from './DisposableScene';
import { CloneWarsHangar3D } from '../../game/hangar/CloneWarsHangar3D';
import { HangarFactory } from '../../game/factories/HangarFactory';
import {
    CAMERA_PRESETS,
    SHIP_SKINS,
    type CameraTargetPreset,
    type ShipSkinConfig,
    type ShipSkinId,
} from '../../config/visuals/hangarVisuals';

// Re-eksport dla zachowania kompatybilności wstecznej
export { CAMERA_PRESETS, SHIP_SKINS };
export type { CameraTargetPreset, ShipSkinConfig, ShipSkinId };

export class SpaceHangarScene extends DisposableScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

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
  public spaceship3D!: Spaceship3D;
  public hangar3D!: CloneWarsHangar3D;

  // Material references for live skin switching
  private hullMaterials: THREE.MeshStandardMaterial[] = [];
  private armorMaterials: THREE.MeshStandardMaterial[] = [];
  private trimMaterials: THREE.MeshStandardMaterial[] = [];
  private cockpitMaterial: THREE.MeshPhysicalMaterial | null = null;
  private enginePlumeMaterials: THREE.MeshBasicMaterial[] = [];

  // Interaction & Camera
  private interactionController: HangarInteractionController | null = null;
  private activePreset: string = 'default';
  private targetCameraPos = CAMERA_PRESETS.default.position.clone();
  private targetLookAt = CAMERA_PRESETS.default.lookAt.clone();
  private currentLookAt = CAMERA_PRESETS.default.lookAt.clone();

  // Hyperdrive Warp Jump state
  private isWarping = false;
  private warpTime = 0;
  private onWarpCompleteCallback: (() => void) | null = null;

  // Cinematic Intro Fly-Through State & Spline Paths
  public hangarGroup!: THREE.Group;
  public isCinematicIntro = false;
  public cinematicProgress = 0;
  private cinematicIntroTime = 0;
  private cinematicDuration = 7.2;
  private onIntroCompleteCallback: (() => void) | null = null;
  private cameraPositionSpline: THREE.CatmullRomCurve3;
  private cameraLookAtSpline: THREE.CatmullRomCurve3;

  private clock = new THREE.Clock();

  constructor(container: HTMLElement) {
    super();
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 600;

    // Initialize 3D Splines for Cinematic Hangar Fly-Through
    this.cameraPositionSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8.2, 7.8, -20.0), // High in the rear rafters behind overhead gantries
      new THREE.Vector3(-6.2, 5.0, -13.5), // Gliding down through the second hangar arch
      new THREE.Vector3(-4.6, 2.8, -7.5),  // Descending alongside the port catwalk
      new THREE.Vector3(-3.2, 0.9, -2.2),  // Low swoop right beside the roaring ion engine thrusters and port wing
      new THREE.Vector3(1.6, 1.3, 1.8),    // Sweeping diagonally across forward fuselage and laser turret
      new THREE.Vector3(3.6, 2.2, 4.2),    // Hero high-quarter look at cockpit canopy glass and front nose
      new THREE.Vector3(1.4, 2.3, 5.8),    // Centering alignment
      new THREE.Vector3(0.0, 2.3, 6.2),    // Seamlessly arrives at CAMERA_PRESETS.default.position
    ], false, 'catmullrom', 0.5);

    this.cameraLookAtSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 2.0, -5.0),  // Looking down the long hangar axis
      new THREE.Vector3(-0.6, 1.8, -2.0), // Looking at the starfighter from above
      new THREE.Vector3(0.0, 1.3, 0.0),   // Looking toward the ship center
      new THREE.Vector3(0.8, 1.2, 0.5),   // Looking across the glowing engines and weapons
      new THREE.Vector3(0.0, 1.2, 1.0),   // Looking directly at the pilot's cockpit canopy
      new THREE.Vector3(-0.2, 1.1, 0.6),  // Panning across forward hull
      new THREE.Vector3(0.0, 1.1, 0.2),   // Focusing on ship center
      new THREE.Vector3(0.0, 1.1, 0.0),   // Seamlessly arrives at CAMERA_PRESETS.default.lookAt
    ], false, 'catmullrom', 0.5);

    // 1. Scene setup with cinematic atmospheric haze
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a101d, 0.009);

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
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Mandatory Studio Environment Reflection (RoomEnvironment) per Three.js directives
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig (Key, Rim, Underside fill)
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

    // 10. Monumental Clone Wars Battle Hangar
    this.hangar3D = HangarFactory.createCloneWarsHangar();
    this.hangarGroup = this.hangar3D.getMesh();
    this.scene.add(this.hangarGroup);

    // 11. 3D Spaceship with Shadows
    this.spaceship3D = new Spaceship3D();
    this.shipGroup = this.spaceship3D.mesh;
    this.shipGroup.position.set(0, 1.18, 0);
    this.engineLights = this.spaceship3D.engineLights;
    this.enginePlumes = this.spaceship3D.engineFlames;
    this.shipGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    this.scene.add(this.shipGroup);

    // Apply default skin matching concept art
    this.setShipSkin('titanium');

    // User Event Listeners
    this.setupInteractions(container);

    // Start render loop
    this.animate();
  }

  private setupLighting() {
    // Ambient soft cosmic fill
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    this.scene.add(ambientLight);

    // Warm Theatrical Key Light with PCF Soft Shadows
    const keyLight = new THREE.DirectionalLight(0xffedd5, 3.2);
    keyLight.position.set(12, 18, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0002;
    keyLight.shadow.normalBias = 0.04;
    keyLight.shadow.radius = 2.0;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 45;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.target.position.set(0, 0.8, 0);
    this.scene.add(keyLight.target);
    this.scene.add(keyLight);

    // Cyan Aerospace Rim Light (Stable, clean PBR contour)
    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 2.6);
    cyanRim.position.set(-14, 10, -10);
    this.scene.add(cyanRim);
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

  // Architectural Ship Hangar Bay: Arches, Gantries, Catwalks, Lighting & Props
  private createHangarBay(): THREE.Group {
    const hangar = new THREE.Group();

    // Materials
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.92,
      roughness: 0.28,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.88,
      roughness: 0.32,
    });

    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.4,
      emissive: 0xd97706,
      emissiveIntensity: 0.25,
    });

    const cyanNeonMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });

    const amberNeonMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
    });

    // 1. Hangar Main Launch Deck Floor Plate
    const floorGeom = new THREE.BoxGeometry(22, 0.4, 40);
    const floorMesh = new THREE.Mesh(floorGeom, darkMetalMat);
    floorMesh.position.set(0, -2.0, -4.5);
    hangar.add(floorMesh);

    // Runway Guide Marker Strips (Dual glowing tracks leading out to launch gate)
    const markerCount = 14;
    const markerGeom = new THREE.BoxGeometry(0.24, 0.04, 1.4);
    for (let i = 0; i < markerCount; i++) {
      const z = -20 + i * 2.6;
      // Left runway strip
      const leftMarker = new THREE.Mesh(markerGeom, i % 3 === 0 ? amberNeonMat : cyanNeonMat);
      leftMarker.position.set(-1.8, -1.78, z);
      hangar.add(leftMarker);

      // Right runway strip
      const rightMarker = new THREE.Mesh(markerGeom, i % 3 === 0 ? amberNeonMat : cyanNeonMat);
      rightMarker.position.set(1.8, -1.78, z);
      hangar.add(rightMarker);
    }

    // Outer runway edge safety lines
    const edgeLineGeom = new THREE.BoxGeometry(0.12, 0.04, 38);
    const leftEdge = new THREE.Mesh(edgeLineGeom, amberNeonMat);
    leftEdge.position.set(-3.2, -1.78, -4.5);
    hangar.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeLineGeom, amberNeonMat);
    rightEdge.position.set(3.2, -1.78, -4.5);
    hangar.add(rightEdge);

    // 2. Giant Hexagonal Hangar Arches / Bulkhead Ribs
    const archZPositions = [-21, -14, -7, 0, 7, 13.5];
    const colGeom = new THREE.BoxGeometry(0.85, 11, 0.9);
    const beamGeom = new THREE.BoxGeometry(19, 0.85, 0.9);
    const gussetGeom = new THREE.BoxGeometry(0.7, 3.2, 0.8);
    const innerNeonGeom = new THREE.BoxGeometry(0.1, 10.5, 0.1);
    const beamNeonGeom = new THREE.BoxGeometry(18.2, 0.1, 0.1);

    archZPositions.forEach((z, idx) => {
      const isGateway = idx === archZPositions.length - 1;
      const neonMat = isGateway ? amberNeonMat : cyanNeonMat;

      // Left column
      const leftCol = new THREE.Mesh(colGeom, frameMat);
      leftCol.position.set(-9.2, 3.5, z);
      hangar.add(leftCol);

      const leftNeon = new THREE.Mesh(innerNeonGeom, neonMat);
      leftNeon.position.set(-8.7, 3.5, z);
      hangar.add(leftNeon);

      // Right column
      const rightCol = new THREE.Mesh(colGeom, frameMat);
      rightCol.position.set(9.2, 3.5, z);
      hangar.add(rightCol);

      const rightNeon = new THREE.Mesh(innerNeonGeom, neonMat);
      rightNeon.position.set(8.7, 3.5, z);
      hangar.add(rightNeon);

      // Top ceiling girder
      const topBeam = new THREE.Mesh(beamGeom, frameMat);
      topBeam.position.set(0, 9.0, z);
      hangar.add(topBeam);

      const topNeon = new THREE.Mesh(beamNeonGeom, neonMat);
      topNeon.position.set(0, 8.5, z);
      hangar.add(topNeon);

      // Left angled gusset
      const leftGusset = new THREE.Mesh(gussetGeom, frameMat);
      leftGusset.position.set(-7.5, 7.6, z);
      leftGusset.rotation.z = Math.PI / 4;
      hangar.add(leftGusset);

      // Right angled gusset
      const rightGusset = new THREE.Mesh(gussetGeom, frameMat);
      rightGusset.position.set(7.5, 7.6, z);
      rightGusset.rotation.z = -Math.PI / 4;
      hangar.add(rightGusset);

      // Overhead industrial spotlight fixtures
      const lampHousingGeom = new THREE.CylinderGeometry(0.35, 0.45, 0.5, 12);
      const lampMat = new THREE.MeshStandardMaterial({
        color: 0x090d16,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.5,
      });

      const lamp = new THREE.Mesh(lampHousingGeom, lampMat);
      lamp.position.set(0, 8.4, z);
      hangar.add(lamp);

      // Directional light pool on ship
      if (idx === 1 || idx === 3) {
        const spot = new THREE.SpotLight(0x38bdf8, 2.8, 22, Math.PI / 5, 0.4);
        spot.position.set(0, 8.3, z);
        spot.target.position.set(0, 0, z);
        hangar.add(spot);
        hangar.add(spot.target);
      }
    });

    // 3. Longitudinal Overhead Crane Trusses & Wall Girders
    const trussGeom = new THREE.BoxGeometry(0.5, 0.5, 38);
    const leftTruss = new THREE.Mesh(trussGeom, frameMat);
    leftTruss.position.set(-7.8, 8.8, -4.5);
    hangar.add(leftTruss);

    const rightTruss = new THREE.Mesh(trussGeom, frameMat);
    rightTruss.position.set(7.8, 8.8, -4.5);
    hangar.add(rightTruss);

    // Center ceiling power conduit
    const conduitGeom = new THREE.CylinderGeometry(0.14, 0.14, 38, 8);
    const conduit = new THREE.Mesh(conduitGeom, hazardMat);
    conduit.rotation.x = Math.PI / 2;
    conduit.position.set(0, 8.9, -4.5);
    hangar.add(conduit);

    // 4. Elevated Port & Starboard Maintenance Catwalks
    const catwalkFloorGeom = new THREE.BoxGeometry(1.9, 0.12, 36);
    const catwalkRailGeom = new THREE.CylinderGeometry(0.035, 0.035, 36, 8);
    const postGeom = new THREE.BoxGeometry(0.08, 1.0, 0.08);

    // Left Catwalk
    const leftCatwalkFloor = new THREE.Mesh(catwalkFloorGeom, darkMetalMat);
    leftCatwalkFloor.position.set(-8.0, 3.2, -4.5);
    hangar.add(leftCatwalkFloor);

    const leftRailTop = new THREE.Mesh(catwalkRailGeom, cyanNeonMat);
    leftRailTop.rotation.x = Math.PI / 2;
    leftRailTop.position.set(-7.1, 4.1, -4.5);
    hangar.add(leftRailTop);

    const leftCatwalkEdge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 36), amberNeonMat);
    leftCatwalkEdge.position.set(-7.05, 3.26, -4.5);
    hangar.add(leftCatwalkEdge);

    // Right Catwalk
    const rightCatwalkFloor = new THREE.Mesh(catwalkFloorGeom, darkMetalMat);
    rightCatwalkFloor.position.set(8.0, 3.2, -4.5);
    hangar.add(rightCatwalkFloor);

    const rightRailTop = new THREE.Mesh(catwalkRailGeom, cyanNeonMat);
    rightRailTop.rotation.x = Math.PI / 2;
    rightRailTop.position.set(7.1, 4.1, -4.5);
    hangar.add(rightRailTop);

    const rightCatwalkEdge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 36), amberNeonMat);
    rightCatwalkEdge.position.set(7.05, 3.26, -4.5);
    hangar.add(rightCatwalkEdge);

    // Catwalk Stanchion Posts every 6 units
    for (let z = -20; z <= 12; z += 5) {
      const p1 = new THREE.Mesh(postGeom, frameMat);
      p1.position.set(-7.1, 3.7, z);
      hangar.add(p1);

      const p2 = new THREE.Mesh(postGeom, frameMat);
      p2.position.set(7.1, 3.7, z);
      hangar.add(p2);

      // Support pillar extending to floor
      const pillarGeom = new THREE.CylinderGeometry(0.12, 0.14, 5.0, 8);
      const pilLeft = new THREE.Mesh(pillarGeom, frameMat);
      pilLeft.position.set(-8.0, 0.7, z);
      hangar.add(pilLeft);

      const pilRight = new THREE.Mesh(pillarGeom, frameMat);
      pilRight.position.set(8.0, 0.7, z);
      hangar.add(pilRight);
    }

    // 5. Portside Articulated Robotic Refueling & Maintenance Arm
    const craneBaseGeom = new THREE.CylinderGeometry(0.65, 0.75, 0.6, 16);
    const craneBase = new THREE.Mesh(craneBaseGeom, frameMat);
    craneBase.position.set(-4.6, -1.7, -3.2);
    hangar.add(craneBase);

    const craneArm1Geom = new THREE.BoxGeometry(0.25, 2.4, 0.35);
    const craneArm1 = new THREE.Mesh(craneArm1Geom, hazardMat);
    craneArm1.position.set(-4.4, -0.6, -3.2);
    craneArm1.rotation.z = -Math.PI / 6;
    hangar.add(craneArm1);

    const craneArm2Geom = new THREE.BoxGeometry(0.2, 2.2, 0.3);
    const craneArm2 = new THREE.Mesh(craneArm2Geom, frameMat);
    craneArm2.position.set(-3.6, 0.4, -3.2);
    craneArm2.rotation.z = Math.PI / 4;
    hangar.add(craneArm2);

    const craneTipGeom = new THREE.ConeGeometry(0.22, 0.6, 8);
    const craneTip = new THREE.Mesh(craneTipGeom, cyanNeonMat);
    craneTip.position.set(-2.6, 0.9, -3.2);
    craneTip.rotation.z = -Math.PI / 2;
    hangar.add(craneTip);

    // 6. Starboard Power Terminal & Holographic Diagnostic Station
    const terminalGeom = new THREE.BoxGeometry(1.6, 1.8, 1.2);
    const terminal = new THREE.Mesh(terminalGeom, frameMat);
    terminal.position.set(5.2, -1.0, -4.0);
    hangar.add(terminal);

    const screenGeom = new THREE.PlaneGeometry(1.1, 0.7);
    const screenMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
    });
    const screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.set(5.2, -0.7, -3.39);
    hangar.add(screen);

    // 7. Stacked Titanium Cargo Pods at Rear Corners
    const podGeom = new THREE.BoxGeometry(2.0, 1.5, 2.2);
    const pod1 = new THREE.Mesh(podGeom, darkMetalMat);
    pod1.position.set(-6.5, -1.1, -18.5);
    hangar.add(pod1);

    const pod2 = new THREE.Mesh(podGeom, frameMat);
    pod2.position.set(6.5, -1.1, -18.5);
    hangar.add(pod2);

    const pod3 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 1.8), hazardMat);
    pod3.position.set(-6.5, 0.3, -18.5);
    pod3.rotation.y = 0.25;
    hangar.add(pod3);

    // 8. Atmospheric Forcefield Barrier at Outer Gateway (Facing Gas Giant & Stars)
    const barrierGeom = new THREE.PlaneGeometry(17.8, 10.2);
    const barrierMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const barrier = new THREE.Mesh(barrierGeom, barrierMat);
    barrier.position.set(0, 3.5, 13.5);
    hangar.add(barrier);

    return hangar;
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
    return this.spaceship3D ? this.spaceship3D.mesh : new THREE.Group();
  }

  public setShipSkin(skinId: ShipSkinId) {
    if (this.spaceship3D) {
      this.spaceship3D.setSkin(skinId);
    }
  }

  public setCameraFocus(presetName: string) {
    this.activePreset = presetName;
    const preset = CAMERA_PRESETS[presetName] || CAMERA_PRESETS.default;
    this.targetCameraPos = preset.position.clone();
    this.targetLookAt = preset.lookAt.clone();
  }

  // Cinematic Intro Fly-Through Methods
  public startCinematicIntro(onComplete?: () => void) {
    this.isCinematicIntro = true;
    this.cinematicIntroTime = 0;
    this.cinematicProgress = 0;
    this.onIntroCompleteCallback = onComplete || null;
    this.activePreset = 'cinematic';
    this.interactionController?.stopDragging();

    const startPos = this.cameraPositionSpline.getPoint(0);
    const startLook = this.cameraLookAtSpline.getPoint(0);
    this.camera.position.copy(startPos);
    this.currentLookAt.copy(startLook);
    this.camera.lookAt(this.currentLookAt);
    this.camera.fov = 62;
    this.camera.rotation.z = 0;
    this.camera.updateProjectionMatrix();
  }

  public skipCinematicIntro() {
    if (!this.isCinematicIntro) return;
    this.isCinematicIntro = false;
    this.cinematicProgress = 1.0;
    this.activePreset = 'default';
    this.targetCameraPos.copy(CAMERA_PRESETS.default.position);
    this.targetLookAt.copy(CAMERA_PRESETS.default.lookAt);
    this.currentLookAt.copy(CAMERA_PRESETS.default.lookAt);
    this.camera.position.copy(CAMERA_PRESETS.default.position);
    this.camera.lookAt(CAMERA_PRESETS.default.lookAt);
    this.camera.fov = 48;
    this.camera.rotation.z = 0;
    this.camera.updateProjectionMatrix();

    if (this.onIntroCompleteCallback) {
      const cb = this.onIntroCompleteCallback;
      this.onIntroCompleteCallback = null;
      cb();
    }
  }

  public getCinematicTelemetry(): {
    phase: string;
    code: string;
    title: string;
    subtitle: string;
    progress: number;
    timeRemaining: string;
    active: boolean;
  } {
    const p = Math.max(0, Math.min(1, this.cinematicProgress));
    const rem = Math.max(0, this.cinematicDuration - this.cinematicIntroTime).toFixed(1);

    if (p < 0.28) {
      return {
        phase: 'SYS-INIT',
        code: 'HANGAR-APPROACH // SEC-09',
        title: 'ORBITAL DOCKING BAY 09',
        subtitle: 'Pre-flight gantry clearance verified • Overhead structural scan nominal',
        progress: p,
        timeRemaining: rem,
        active: this.isCinematicIntro,
      };
    } else if (p < 0.54) {
      return {
        phase: 'PROPULSION',
        code: 'DRIVE-CORE // MANIFOLD-SYNC',
        title: 'TWIN ION PLASMA PROPULSION',
        subtitle: 'Sub-light thruster chamber pressurized • Plasma exhaust vectoring locked',
        progress: p,
        timeRemaining: rem,
        active: this.isCinematicIntro,
      };
    } else if (p < 0.80) {
      return {
        phase: 'AVIONICS',
        code: 'SHIELD-ARRAY // DEFLECTOR-CAL',
        title: 'TACTICAL SENSOR SUITE',
        subtitle: 'Long-range radar synchronized • Laser cannons & missile racks primed',
        progress: p,
        timeRemaining: rem,
        active: this.isCinematicIntro,
      };
    } else {
      return {
        phase: 'FLIGHT-READY',
        code: 'CLEARANCE // ALL SYSTEMS GREEN',
        title: 'ODYSSEY INTERCEPTOR READY',
        subtitle: 'Pilot flight control online • Atmospheric forcefield cycle confirmed',
        progress: p,
        timeRemaining: rem,
        active: this.isCinematicIntro,
      };
    }
  }

  // Engage 3D Hyperdrive launch warp sequence with behind-the-ship camera view!
  public triggerHyperdriveLaunch(onComplete: () => void) {
    this.isWarping = true;
    this.warpTime = 0;
    this.onWarpCompleteCallback = onComplete;
    this.warpLinesGroup.visible = true;
    this.hangar3D?.setGateOpen(true);

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
    this.interactionController = new HangarInteractionController(container, {
      isCinematicIntroActive: () => this.isCinematicIntro,
      onSkipCinematicIntro: () => this.skipCinematicIntro(),
      onParallaxChange: (mouseX, mouseY) => {
        this.mouseX = mouseX;
        this.mouseY = mouseY;
      },
      onOrbitChange: ([x, y, z], lookAtOrigin) => {
        this.targetCameraPos.set(x, y, z);
        if (lookAtOrigin) this.targetLookAt.set(0, 0, 0);
      },
    });
    window.addEventListener('resize', this.onResize);
  }

  private get isDragging(): boolean {
    return this.interactionController?.dragging ?? false;
  }

  private mouseX = 0;
  private mouseY = 0;

  protected readonly onResize = () => {
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
    } else if (this.isCinematicIntro) {
      this.cinematicIntroTime += delta;
      this.cinematicProgress = Math.min(1.0, this.cinematicIntroTime / this.cinematicDuration);

      // Smooth cubic hermite easing: p * p * (3 - 2 * p)
      const p = this.cinematicProgress;
      const easedP = p * p * (3 - 2 * p);

      const targetPos = this.cameraPositionSpline.getPoint(easedP);
      const targetLook = this.cameraLookAtSpline.getPoint(easedP);

      // Smooth camera FOV transition: wide 62 deg descending gracefully to 48 deg
      const targetFov = THREE.MathUtils.lerp(62, 48, Math.sin(p * Math.PI * 0.5));
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();

      // Organic subtle cinematic drone sway
      const sway = Math.sin(this.cinematicIntroTime * 1.5) * 0.05 * (1 - p);
      this.camera.position.set(targetPos.x + sway * 0.4, targetPos.y, targetPos.z);
      this.currentLookAt.copy(targetLook);
      this.camera.lookAt(this.currentLookAt);

      // Subtle dynamic camera bank/roll
      const roll = Math.sin(p * Math.PI) * 0.032;
      this.camera.rotation.z += roll;

      // Starfighter idle & engine warmup glow during fly-through (Stable, no flicker)
      const warmupPulse = 1.0 + Math.sin(time * 1.5) * 0.02;
      for (const plume of this.enginePlumes) {
        plume.scale.set(warmupPulse, 1.0, warmupPulse);
      }
      for (const light of this.engineLights) {
        light.intensity = 3.2;
      }

      // Planetary & Cosmic Rotation
      this.planetGroup.rotation.y = time * 0.012;
      this.ringMesh.rotation.z = time * 0.03;
      this.starParticles.rotation.y = time * 0.006;

      // Completion check
      if (this.cinematicProgress >= 1.0) {
        this.isCinematicIntro = false;
        this.activePreset = 'default';
        this.targetCameraPos.copy(CAMERA_PRESETS.default.position);
        this.targetLookAt.copy(CAMERA_PRESETS.default.lookAt);
        this.currentLookAt.copy(CAMERA_PRESETS.default.lookAt);
        this.camera.position.copy(CAMERA_PRESETS.default.position);
        this.camera.lookAt(CAMERA_PRESETS.default.lookAt);
        this.camera.fov = 48;
        this.camera.rotation.z = 0;
        this.camera.updateProjectionMatrix();

        if (this.onIntroCompleteCallback) {
          const cb = this.onIntroCompleteCallback;
          this.onIntroCompleteCallback = null;
          cb();
        }
      }
    } else {
      // Gentle Starfighter Idle Levitation
      if (this.hangar3D) {
        this.hangar3D.update(delta, !this.isDragging && !this.isWarping && !this.isCinematicIntro);
      }
      if (this.spaceship3D) {
        this.spaceship3D.update(delta, true);
      }
      const BASE_HOVER_Y = 1.18;
      const hoverY = BASE_HOVER_Y + Math.sin(time * 1.8) * 0.07;
      const hoverRoll = Math.sin(time * 1.3) * 0.03;
      const hoverPitch = Math.cos(time * 1.5) * 0.02;

      this.shipGroup.position.y = hoverY;
      this.shipGroup.rotation.z = hoverRoll + (this.isDragging ? 0 : this.mouseX * 0.12);
      this.shipGroup.rotation.x = hoverPitch - (this.isDragging ? 0 : this.mouseY * 0.08);
      if (!this.isDragging) {
        this.shipGroup.rotation.y = this.mouseX * 0.22;
      }

      // Thruster Afterburner Pulse (Stable, calm idle glow - NO FLICKER)
      const pulse = 1.0 + Math.sin(time * 1.5) * 0.02;
      for (const plume of this.enginePlumes) {
        plume.scale.set(pulse, 0.98 + pulse * 0.04, pulse);
      }
      for (const light of this.engineLights) {
        light.intensity = 3.2;
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

  protected releaseResources(): void {
    this.interactionController?.dispose();
    this.interactionController = null;
    this.hangar3D?.dispose();
  }
}
