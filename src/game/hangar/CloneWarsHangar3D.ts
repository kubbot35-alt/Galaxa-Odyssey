import * as THREE from 'three';
import { IHangarSceneEntity } from '../controllers/LaunchSequenceController';

/**
 * CloneWarsHangar3D - High-Fidelity Monumental Star Wars Republic Battle Hangar Bay
 * Implements IHangarSceneEntity with hermetic encapsulation, OOP, SRP, and procedural AAA visual fidelity:
 * - High-resolution procedural canvas textures (blast plates, runway guides, hazard stripes, wall conduits)
 * - Vaulted circular ribbed ceiling dome with cathedral arch structural ribs
 * - Suspended central tiered inverted saucer chandelier with volumetric theatrical spotlight cones
 * - Overhead gantry maintenance with animated welding sparks particle system
 * - Atmospheric floating dust motes drifting through spotlight beams
 * - Cryo steam vapor vents puffing from the landing pad pressure seals
 * - Heavy industrial landing pad with hydraulic pistons, articulated magnetic clamps, and hazard trim
 * - Parked Republic LAAT Gunships with dual ball turrets, missile pods, and wingtip strobes
 * - Animated Astromech Droid with rotating dome and blinking optic sensor
 * - Holographic tactical display table projecting rotating 3D planetary wireframe
 * - Staged military cargo crates, power generators, and cloaked commander/crew silhouettes
 */
export class CloneWarsHangar3D implements IHangarSceneEntity {
  public mesh: THREE.Group;
  public landingPad: THREE.Group;

  // Hermetic lifecycle tracking
  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private textures: THREE.Texture[] = [];
  private spotlightCones: THREE.Mesh[] = [];
  private spotlights: THREE.SpotLight[] = [];
  private forceField!: THREE.Mesh;
  private beaconLights: THREE.Mesh[] = [];

  // Particle systems
  private sparkParticles!: THREE.Points;
  private sparkPositions!: Float32Array;
  private sparkVelocities: { x: number; y: number; z: number; life: number; maxLife: number }[] = [];
  private dustParticles!: THREE.Points;
  private astromechHead!: THREE.Group;
  private holoPlanet!: THREE.Group;
  private deckCrewOfficers: { group: THREE.Group; head: THREE.Mesh; seed: number }[] = [];
  private deckCrewTechs: { group: THREE.Group; arm: THREE.Mesh; seed: number }[] = [];
  private serviceDrones: {
    group: THREE.Group;
    ring: THREE.Mesh;
    basePos: THREE.Vector3;
    orbitRadius: number;
    speed: number;
    seed: number;
  }[] = [];

  // Animation & Gate state
  private elapsedTime: number = 0;
  private isGateOpen: boolean = false;
  private gateProgress: number = 0;
  private nextSparkTime: number = 0.5;

  // Dimensional specs
  public readonly radius = 30;
  public readonly height = 16;
  public readonly runwayLength = 52;

  constructor() {
    this.mesh = new THREE.Group();
    this.landingPad = new THREE.Group();
    this.buildMonumentalHangar();
  }

  private trackMaterial<T extends THREE.Material>(mat: T): T {
    this.materials.push(mat);
    return mat;
  }

  private trackGeometry<T extends THREE.BufferGeometry>(geo: T): T {
    this.geometries.push(geo);
    return geo;
  }

  private trackTexture<T extends THREE.Texture>(tex: T): T {
    this.textures.push(tex);
    return tex;
  }

  // --- PROCEDURAL TEXTURE GENERATION ---

  private generateDeckPlateTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Smooth brushed dark titanium base
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
    bgGrad.addColorStop(0, '#0d1527');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#0b1120');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Large architectural plate subdivisions (256x256) with smooth bevels
    const plateSize = 256;
    for (let x = 0; x < 1024; x += plateSize) {
      for (let y = 0; y < 1024; y += plateSize) {
        // Soft plate tone
        ctx.fillStyle = '#141e33';
        ctx.fillRect(x + 4, y + 4, plateSize - 8, plateSize - 8);

        // Smooth plate bevel groove
        ctx.strokeStyle = '#030712';
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 2, y + 2, plateSize - 4, plateSize - 4);

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 5, y + 5, plateSize - 10, plateSize - 10);

        // Subtle corner bolts (smooth circles)
        ctx.fillStyle = '#475569';
        const rivetOffsets = [18, plateSize - 18];
        for (const rx of rivetOffsets) {
          for (const ry of rivetOffsets) {
            ctx.beginPath();
            ctx.arc(x + rx, y + ry, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    const texture = this.trackTexture(new THREE.CanvasTexture(canvas));
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  private generateRunwayTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Dark graphite aerospace composite base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 1024);

    // Central dark technical runway corridor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(80, 0, 864, 1024);

    // Hazard borders on left and right (anti-aliased clean stripes)
    const drawHazardStrip = (startX: number) => {
      const stripeWidth = 32;
      for (let y = -stripeWidth; y < 1024 + stripeWidth; y += stripeWidth * 2) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + 60, y + 60);
        ctx.lineTo(startX + 60, y + 60 + stripeWidth);
        ctx.lineTo(startX, y + stripeWidth);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.moveTo(startX, y + stripeWidth);
        ctx.lineTo(startX + 60, y + 60 + stripeWidth);
        ctx.lineTo(startX + 60, y + 60 + stripeWidth * 2);
        ctx.lineTo(startX, y + stripeWidth * 2);
        ctx.closePath();
        ctx.fill();
      }
    };
    drawHazardStrip(20);
    drawHazardStrip(944);

    // Central illuminated cyan guide lines
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(512, 0);
    ctx.lineTo(512, 1024);
    ctx.stroke();

    // Guidance chevrons pointing toward launch exit
    ctx.fillStyle = '#38bdf8';
    for (let cy = 120; cy < 1024; cy += 240) {
      ctx.beginPath();
      ctx.moveTo(512, cy - 50);
      ctx.lineTo(570, cy + 20);
      ctx.lineTo(544, cy + 20);
      ctx.lineTo(512, cy - 20);
      ctx.lineTo(480, cy + 20);
      ctx.lineTo(454, cy + 20);
      ctx.closePath();
      ctx.fill();
    }

    // High-tech typography stencils
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText('BAY 09 // LAUNCH VECTOR', 512, 520);

    const texture = this.trackTexture(new THREE.CanvasTexture(canvas));
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 2);
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  private generateHazardTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    const stripe = 48;
    ctx.fillStyle = '#f59e0b';
    for (let x = -512; x < 1024; x += stripe * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 512, 512);
      ctx.lineTo(x + 512 + stripe, 512);
      ctx.lineTo(x + stripe, 0);
      ctx.closePath();
      ctx.fill();
    }

    const texture = this.trackTexture(new THREE.CanvasTexture(canvas));
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  private generateWallArmorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1024, 512);

    // Corrugated architectural armor ribs with smooth shading
    for (let x = 0; x < 1024; x += 128) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, 0, 20, 512);

      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 20, 0, 88, 512);

      ctx.fillStyle = '#475569';
      ctx.fillRect(x + 108, 0, 10, 512);
    }

    // Horizontal reinforced blast seams
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 120, 1024, 18);
    ctx.fillRect(0, 360, 1024, 18);

    const texture = this.trackTexture(new THREE.CanvasTexture(canvas));
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 2);
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  // --- HANGAR ARCHITECTURAL BUILD ---

  private buildMonumentalHangar(): void {
    const deckTexture = this.generateDeckPlateTexture();
    const runwayTexture = this.generateRunwayTexture();
    const hazardTexture = this.generateHazardTexture();
    const wallTexture = this.generateWallArmorTexture();

    // 1. Realistic Materials Palette
    const deckMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        map: deckTexture,
        roughness: 0.38,
        metalness: 0.75,
      })
    );

    const runwayMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        map: runwayTexture,
        roughness: 0.42,
        metalness: 0.65,
      })
    );

    const wallMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.45,
        metalness: 0.7,
      })
    );

    const archSteelMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.85,
        roughness: 0.25,
      })
    );

    const hazardMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        map: hazardTexture,
        roughness: 0.4,
        metalness: 0.5,
      })
    );

    const republicRedMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        metalness: 0.45,
        roughness: 0.35,
      })
    );

    const republicWhiteMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.35,
        roughness: 0.38,
      })
    );

    const darkSteelMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.3,
      })
    );

    const chromeMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.95,
        roughness: 0.1,
      })
    );

    const amberBeaconMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
      })
    );

    const cyanGlowMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
      })
    );

    // 2. Base Floor Deck Plate
    const floorGeo = this.trackGeometry(new THREE.CylinderGeometry(this.radius, this.radius, 0.8, 64));
    const floor = new THREE.Mesh(floorGeo, deckMat);
    floor.position.y = -0.4;
    floor.receiveShadow = true;
    this.mesh.add(floor);

    // 3. Central Illuminated Runway
    const runwayGeo = this.trackGeometry(new THREE.BoxGeometry(11, 0.08, this.runwayLength));
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.position.set(0, 0.04, 2);
    runway.receiveShadow = true;
    this.mesh.add(runway);

    // Runway Stanchions with Glowing Beacons
    const stanchionPoleGeo = this.trackGeometry(new THREE.CylinderGeometry(0.08, 0.1, 0.45, 8));
    const stanchionBulbGeo = this.trackGeometry(new THREE.SphereGeometry(0.14, 12, 8));
    for (let z = -18; z <= 22; z += 5) {
      [-5.8, 5.8].forEach((xPos) => {
        const pole = new THREE.Mesh(stanchionPoleGeo, archSteelMat);
        pole.position.set(xPos, 0.225, z);
        this.mesh.add(pole);

        const bulb = new THREE.Mesh(stanchionBulbGeo, amberBeaconMat);
        bulb.position.set(xPos, 0.48, z);
        this.mesh.add(bulb);
        this.beaconLights.push(bulb);
      });
    }

    // 4. Vaulted Perimeter Walls & Dome
    const wallGeo = this.trackGeometry(new THREE.CylinderGeometry(this.radius, this.radius, this.height, 48, 1, true));
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = this.height / 2;
    this.mesh.add(wall);

    const domeRoofGeo = this.trackGeometry(
      new THREE.SphereGeometry(this.radius, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.7)
    );
    const domeRoof = new THREE.Mesh(domeRoofGeo, darkSteelMat);
    domeRoof.position.y = 4.5;
    domeRoof.scale.set(1.0, 0.46, 1.0);
    this.mesh.add(domeRoof);

    // 5. Heavy Radial Arch Ribs (Cathedral Vaulting)
    const numRibs = 12;
    const ribGeo = this.trackGeometry(new THREE.BoxGeometry(0.9, 1.2, this.radius * 0.92));
    for (let i = 0; i < numRibs; i++) {
      const angle = (i / numRibs) * Math.PI * 2;
      const rib = new THREE.Mesh(ribGeo, archSteelMat);
      rib.position.set(
        Math.sin(angle) * (this.radius * 0.46),
        this.height - 1.5,
        Math.cos(angle) * (this.radius * 0.46)
      );
      rib.rotation.y = angle;
      rib.rotation.x = 0.12;
      this.mesh.add(rib);

      // Fluorescent cyan neon strip along rib undersides
      const neonGeo = this.trackGeometry(new THREE.BoxGeometry(0.12, 0.08, this.radius * 0.8));
      const neon = new THREE.Mesh(neonGeo, cyanGlowMat);
      neon.position.set(
        Math.sin(angle) * (this.radius * 0.44),
        this.height - 2.1,
        Math.cos(angle) * (this.radius * 0.44)
      );
      neon.rotation.y = angle;
      neon.rotation.x = 0.12;
      this.mesh.add(neon);
    }

    // 6. Suspended Central Saucer Chandelier (Theatrical Lighting Focal Point)
    this.buildSaucerChandelier(archSteelMat, darkSteelMat, amberBeaconMat);

    // 7. Heavy Armored Landing Pad (Ventral Thruster Pit & Hydraulic Stanchions)
    this.buildLandingPad(archSteelMat, hazardMat, chromeMat, cyanGlowMat, amberBeaconMat);

    // 8. Docked Republic LAAT Gunships & Equipment
    this.buildBackgroundDockingBays(republicWhiteMat, republicRedMat, darkSteelMat, archSteelMat, amberBeaconMat, cyanGlowMat);

    // 9. Particle Systems (Welding Sparks & Atmospheric Dust Motes)
    this.buildParticleSystems();

    // 10. Hangar Gate Force Field
    this.buildExitForceField();

    // 11. Theatrical Fill Lights
    this.setupTheatricalLighting();
  }

  private buildSaucerChandelier(archMat: THREE.Material, darkMat: THREE.Material, amberMat: THREE.Material): void {
    const saucerGroup = new THREE.Group();
    saucerGroup.position.set(0, this.height - 3.4, 0);

    // Tiered main body
    const saucerGeo = this.trackGeometry(new THREE.CylinderGeometry(7.0, 5.0, 1.6, 40));
    const saucerMesh = new THREE.Mesh(saucerGeo, archMat);
    saucerGroup.add(saucerMesh);

    // Top flange rim
    const topRimGeo = this.trackGeometry(new THREE.CylinderGeometry(8.2, 7.0, 0.4, 40));
    const topRim = new THREE.Mesh(topRimGeo, darkMat);
    topRim.position.y = 0.9;
    saucerGroup.add(topRim);

    // Suspended maintenance catwalk railing around chandelier
    const railGeo = this.trackGeometry(new THREE.TorusGeometry(7.6, 0.06, 8, 36));
    railGeo.rotateX(Math.PI / 2);
    const rail = new THREE.Mesh(railGeo, archMat);
    rail.position.y = 1.3;
    saucerGroup.add(rail);

    // Recessed downward core
    const coreGeo = this.trackGeometry(new THREE.CylinderGeometry(4.2, 3.4, 0.8, 32));
    const core = new THREE.Mesh(coreGeo, darkMat);
    core.position.y = -1.0;
    saucerGroup.add(core);

    // Amber perimeter beacons
    const bulbGeo = this.trackGeometry(new THREE.SphereGeometry(0.2, 12, 8));
    for (let j = 0; j < 16; j++) {
      const a = (j / 16) * Math.PI * 2;
      const b = new THREE.Mesh(bulbGeo, amberMat);
      b.position.set(Math.sin(a) * 7.2, 0.2, Math.cos(a) * 7.2);
      saucerGroup.add(b);
      this.beaconLights.push(b);
    }

    // Heavy suspension cables connecting to dome
    const cableGeo = this.trackGeometry(new THREE.CylinderGeometry(0.12, 0.12, 4.8, 8));
    for (let k = 0; k < 4; k++) {
      const ca = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const cable = new THREE.Mesh(cableGeo, darkMat);
      cable.position.set(Math.sin(ca) * 4.2, 2.8, Math.cos(ca) * 4.2);
      saucerGroup.add(cable);
    }

    // 6 Downward Theatrical Spotlights with Volumetric Cones
    const spotOffsets = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-2.8, 0, -2.4),
      new THREE.Vector3(2.8, 0, -2.4),
      new THREE.Vector3(-2.8, 0, 2.4),
      new THREE.Vector3(2.8, 0, 2.4),
      new THREE.Vector3(0, 0, 3.6),
    ];

    const coneGeo = this.trackGeometry(new THREE.ConeGeometry(3.6, 13.5, 32, 1, true));
    coneGeo.translate(0, -6.75, 0);

    const coneMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xf8fafc,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );

    for (const offset of spotOffsets) {
      const spot = new THREE.SpotLight(0xfffbeb, 28, 30, Math.PI / 7, 0.55, 1.2);
      spot.position.set(offset.x, -1.2, offset.z);
      spot.target.position.set(offset.x * 0.8, -12, offset.z * 0.8);
      saucerGroup.add(spot);
      saucerGroup.add(spot.target);
      this.spotlights.push(spot);

      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(offset.x, -1.2, offset.z);
      saucerGroup.add(cone);
      this.spotlightCones.push(cone);
    }

    this.mesh.add(saucerGroup);
  }

  private buildLandingPad(
    archMat: THREE.Material,
    hazardMat: THREE.Material,
    chromeMat: THREE.Material,
    cyanMat: THREE.Material,
    amberMat: THREE.Material
  ): void {
    // Octagonal tiered pad base
    const padBaseGeo = this.trackGeometry(new THREE.CylinderGeometry(5.2, 5.6, 0.45, 8));
    const padBase = new THREE.Mesh(padBaseGeo, archMat);
    padBase.position.y = 0.225;
    padBase.receiveShadow = true;
    this.landingPad.add(padBase);

    // Hazard-striped beveled border ring
    const hazardRingGeo = this.trackGeometry(new THREE.CylinderGeometry(5.4, 5.55, 0.15, 8));
    const hazardRing = new THREE.Mesh(hazardRingGeo, hazardMat);
    hazardRing.position.y = 0.38;
    this.landingPad.add(hazardRing);

    // 4 Heavy Hydraulic Riser Pistons underneath
    const pistonShaftGeo = this.trackGeometry(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12));
    const pistonBracketGeo = this.trackGeometry(new THREE.BoxGeometry(0.6, 0.2, 0.6));
    for (let p = 0; p < 4; p++) {
      const pa = (p / 4) * Math.PI * 2;
      const px = Math.sin(pa) * 4.2;
      const pz = Math.cos(pa) * 4.2;

      const piston = new THREE.Mesh(pistonShaftGeo, chromeMat);
      piston.position.set(px, 0.15, pz);
      this.landingPad.add(piston);

      const bracket = new THREE.Mesh(pistonBracketGeo, archMat);
      bracket.position.set(px, 0.05, pz);
      this.landingPad.add(bracket);
    }

    // 4 Articulated Magnetic Clamps around perimeter
    const clampArmGeo = this.trackGeometry(new THREE.BoxGeometry(0.4, 0.6, 0.8));
    for (let c = 0; c < 4; c++) {
      const ca = (c / 4) * Math.PI * 2 + Math.PI / 4;
      const clamp = new THREE.Mesh(clampArmGeo, archMat);
      clamp.position.set(Math.sin(ca) * 5.0, 0.45, Math.cos(ca) * 5.0);
      clamp.rotation.y = ca;
      this.landingPad.add(clamp);

      // Amber clamp status beacon
      const cBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), amberMat);
      cBeacon.position.set(Math.sin(ca) * 5.1, 0.8, Math.cos(ca) * 5.1);
      this.landingPad.add(cBeacon);
      this.beaconLights.push(cBeacon);
    }

    // Glowing Concentric Cyan Magnetic Levitation Rings
    const ring1Geo = this.trackGeometry(new THREE.RingGeometry(4.2, 4.45, 36));
    ring1Geo.rotateX(-Math.PI / 2);
    const ring1 = new THREE.Mesh(ring1Geo, cyanMat);
    ring1.position.y = 0.46;
    this.landingPad.add(ring1);

    const ring2Geo = this.trackGeometry(new THREE.RingGeometry(2.4, 2.65, 36));
    ring2Geo.rotateX(-Math.PI / 2);
    const ring2 = new THREE.Mesh(ring2Geo, cyanMat);
    ring2.position.y = 0.46;
    this.landingPad.add(ring2);

    // Crosshair Target Center
    const crossGeo = this.trackGeometry(new THREE.PlaneGeometry(6.4, 0.18));
    crossGeo.rotateX(-Math.PI / 2);
    const cross1 = new THREE.Mesh(crossGeo, amberMat);
    cross1.position.y = 0.47;
    this.landingPad.add(cross1);

    const cross2 = cross1.clone();
    cross2.rotation.z = Math.PI / 2;
    this.landingPad.add(cross2);

    // Underside Antigravity Blue Glow Light
    const padGlow = new THREE.PointLight(0x38bdf8, 12, 14);
    padGlow.position.set(0, 1.4, 0);
    this.landingPad.add(padGlow);

    this.mesh.add(this.landingPad);
  }

  private buildBackgroundDockingBays(
    whiteMat: THREE.Material,
    redMat: THREE.Material,
    darkMat: THREE.Material,
    archMat: THREE.Material,
    amberMat: THREE.Material,
    cyanMat: THREE.Material
  ): void {
    // 1. Port Bay Republic Gunship (LAAT Transport)
    const portGunship = this.createDetailedGunship(whiteMat, redMat, darkMat, amberMat);
    portGunship.position.set(-15.5, 0.0, -3.5);
    portGunship.rotation.y = Math.PI * 0.32;
    this.mesh.add(portGunship);

    // 2. Starboard Bay Republic Gunship
    const stbGunship = this.createDetailedGunship(whiteMat, redMat, darkMat, amberMat);
    stbGunship.position.set(16.0, 0.0, 5.5);
    stbGunship.rotation.y = -Math.PI * 0.62;
    this.mesh.add(stbGunship);

    // 3. Curved Docking Bay Balustrades
    const rail1 = this.createCurvedGantry(12, 5.0, archMat);
    rail1.position.set(15.0, 0, 5.0);
    rail1.rotation.y = -Math.PI * 0.5;
    this.mesh.add(rail1);

    const rail2 = this.createCurvedGantry(12, 5.0, archMat);
    rail2.position.set(-15.0, 0, -3.0);
    rail2.rotation.y = Math.PI * 0.4;
    this.mesh.add(rail2);

    // 4. Astromech Droid (R2 Unit) near Starboard Bay
    this.astromechHead = this.createAstromechDroid(archMat, cyanMat);
    this.astromechHead.position.set(8.5, 0, 7.5);
    this.mesh.add(this.astromechHead);

    // 5. Tactical Hologram Display Table (Command Alcove)
    this.holoPlanet = this.createHoloTable(archMat, cyanMat);
    this.holoPlanet.position.set(-9.5, 0, 9.0);
    this.mesh.add(this.holoPlanet);

    // 6. Staged Military Cargo Clusters
    this.createCargoCluster(new THREE.Vector3(-11.5, 0, -9.5), darkMat, archMat, amberMat);
    this.createCargoCluster(new THREE.Vector3(12.0, 0, 11.5), darkMat, archMat, amberMat);

    // 7. Cloaked Officers and Technicians
    const cloakMat = this.trackMaterial(new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 }));
    const skinMat = this.trackMaterial(new THREE.MeshStandardMaterial({ color: 0xc8c2b9, roughness: 0.6 }));
    this.createCloakedOfficer(new THREE.Vector3(-2.2, 0, 8.2), cloakMat, skinMat);
    this.createCloakedOfficer(new THREE.Vector3(1.6, 0, 9.8), cloakMat, skinMat);
    this.createDeckCrewTechnician(new THREE.Vector3(-12.0, 0, -2.0), archMat);
    this.createDeckCrewTechnician(new THREE.Vector3(12.5, 0, 3.0), archMat);

    // 8. Rotating Repulsorlift Service Drones patrolling the hangar
    this.createServiceDrone(new THREE.Vector3(-8.0, 3.2, -6.0), 2.2, 0.45, archMat, cyanMat);
    this.createServiceDrone(new THREE.Vector3(9.5, 2.8, 4.0), 3.0, -0.38, archMat, cyanMat);
    this.createServiceDrone(new THREE.Vector3(0.0, 4.0, 15.0), 2.4, 0.55, archMat, cyanMat);
  }

  private createDetailedGunship(
    whiteMat: THREE.Material,
    redMat: THREE.Material,
    darkMat: THREE.Material,
    amberMat: THREE.Material
  ): THREE.Group {
    const ship = new THREE.Group();

    // Main fuselage cabin
    const bodyGeo = this.trackGeometry(new THREE.BoxGeometry(3.8, 2.4, 8.2));
    const body = new THREE.Mesh(bodyGeo, whiteMat);
    body.position.y = 1.7;
    ship.add(body);

    // Republic Maroon Side Doors with Clone Wars chevron stripes
    const doorGeo = this.trackGeometry(new THREE.BoxGeometry(0.35, 1.9, 4.6));
    const lDoor = new THREE.Mesh(doorGeo, redMat);
    lDoor.position.set(-1.95, 1.6, 0.3);
    ship.add(lDoor);

    const rDoor = lDoor.clone();
    rDoor.position.x = 1.95;
    ship.add(rDoor);

    // Forward dual cockpits
    const noseGeo = this.trackGeometry(new THREE.ConeGeometry(1.8, 3.6, 8));
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, whiteMat);
    nose.position.set(0, 1.5, 5.4);
    ship.add(nose);

    // Dual Forward Ball Turrets with glass canopies
    const ballGeo = this.trackGeometry(new THREE.SphereGeometry(0.65, 16, 16));
    const ballMat = this.trackMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transmission: 0.8,
        opacity: 1,
        transparent: true,
        roughness: 0.1,
      })
    );
    const lBall = new THREE.Mesh(ballGeo, ballMat);
    lBall.position.set(-1.6, 1.1, 4.6);
    ship.add(lBall);

    const rBall = lBall.clone();
    rBall.position.x = 1.6;
    ship.add(rBall);

    // Swept-Forward Wings
    const wingGeo = this.trackGeometry(new THREE.BoxGeometry(5.2, 0.3, 2.2));
    const lWing = new THREE.Mesh(wingGeo, whiteMat);
    lWing.position.set(-4.0, 2.4, -0.6);
    lWing.rotation.z = -0.18;
    ship.add(lWing);

    const rWing = new THREE.Mesh(wingGeo, whiteMat);
    rWing.position.set(4.0, 2.4, -0.6);
    rWing.rotation.z = 0.18;
    ship.add(rWing);

    // Wingtip Bubble Turrets / Pods
    const podGeo = this.trackGeometry(new THREE.CylinderGeometry(0.6, 0.6, 2.8, 12));
    podGeo.rotateX(Math.PI / 2);
    const lPod = new THREE.Mesh(podGeo, darkMat);
    lPod.position.set(-6.6, 2.7, -0.6);
    ship.add(lPod);

    const rPod = lPod.clone();
    rPod.position.x = 6.6;
    ship.add(rPod);

    // Wingtip Strobes
    const lStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), amberMat);
    lStrobe.position.set(-6.6, 2.7, 0.9);
    ship.add(lStrobe);
    this.beaconLights.push(lStrobe);

    const rStrobe = lStrobe.clone();
    rStrobe.position.x = 6.6;
    ship.add(rStrobe);
    this.beaconLights.push(rStrobe);

    // Heavy Landing Skids
    const skidGeo = this.trackGeometry(new THREE.BoxGeometry(0.3, 0.2, 7.0));
    const lSkid = new THREE.Mesh(skidGeo, darkMat);
    lSkid.position.set(-1.6, 0.1, 0.0);
    ship.add(lSkid);

    const rSkid = lSkid.clone();
    rSkid.position.x = 1.6;
    ship.add(rSkid);

    return ship;
  }

  private createAstromechDroid(bodyMat: THREE.Material, cyanMat: THREE.Material): THREE.Group {
    const droid = new THREE.Group();

    // Cylindrical white torso
    const bodyGeo = this.trackGeometry(new THREE.CylinderGeometry(0.32, 0.32, 0.7, 16));
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    droid.add(body);

    // Rotating hemispherical dome head
    const domeGeo = this.trackGeometry(new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2));
    const headMat = this.trackMaterial(new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 }));
    const head = new THREE.Mesh(domeGeo, headMat);
    head.position.y = 0.95;
    droid.add(head);

    // Blinking eye sensor
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), cyanMat);
    eye.position.set(0, 1.05, 0.3);
    droid.add(eye);
    this.beaconLights.push(eye);

    // Dual legs
    const legGeo = this.trackGeometry(new THREE.BoxGeometry(0.12, 0.75, 0.16));
    const lLeg = new THREE.Mesh(legGeo, bodyMat);
    lLeg.position.set(-0.38, 0.45, 0);
    droid.add(lLeg);

    const rLeg = lLeg.clone();
    rLeg.position.x = 0.38;
    droid.add(rLeg);

    return droid;
  }

  private createHoloTable(archMat: THREE.Material, cyanMat: THREE.Material): THREE.Group {
    const table = new THREE.Group();

    // Circular base stand
    const standGeo = this.trackGeometry(new THREE.CylinderGeometry(1.2, 1.4, 0.9, 24));
    const stand = new THREE.Mesh(standGeo, archMat);
    stand.position.y = 0.45;
    table.add(stand);

    // Hologram projector emitter ring
    const emitterGeo = this.trackGeometry(new THREE.TorusGeometry(0.9, 0.08, 8, 24));
    emitterGeo.rotateX(Math.PI / 2);
    const emitter = new THREE.Mesh(emitterGeo, cyanMat);
    emitter.position.y = 0.92;
    table.add(emitter);

    // Rotating 3D Wireframe Planet Hologram
    const holoGeo = this.trackGeometry(new THREE.IcosahedronGeometry(0.8, 2));
    const holoMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.65,
      })
    );
    const holoMesh = new THREE.Mesh(holoGeo, holoMat);
    holoMesh.position.y = 2.1;
    table.add(holoMesh);

    // Hologram projection beam
    const beamGeo = this.trackGeometry(new THREE.ConeGeometry(0.9, 1.2, 16, 1, true));
    const beamMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 1.5;
    table.add(beam);

    return table;
  }

  private createCurvedGantry(segments: number, radius: number, mat: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const postGeo = this.trackGeometry(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8));
    const railGeo = this.trackGeometry(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8));
    railGeo.rotateZ(Math.PI / 2);

    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * (Math.PI * 0.7);
      const post = new THREE.Mesh(postGeo, mat);
      post.position.set(Math.sin(a) * radius, 0.55, Math.cos(a) * radius);
      group.add(post);

      if (i < segments - 1) {
        const nextA = ((i + 1) / segments) * (Math.PI * 0.7);
        const midA = (a + nextA) / 2;
        const rail = new THREE.Mesh(railGeo, mat);
        rail.position.set(Math.sin(midA) * radius, 1.05, Math.cos(midA) * radius);
        rail.rotation.y = midA + Math.PI / 2;
        group.add(rail);
      }
    }
    return group;
  }

  private createCargoCluster(pos: THREE.Vector3, darkMat: THREE.Material, archMat: THREE.Material, amberMat: THREE.Material): void {
    const cluster = new THREE.Group();
    cluster.position.copy(pos);

    const crate1Geo = this.trackGeometry(new THREE.BoxGeometry(1.8, 1.4, 2.2));
    const crate1 = new THREE.Mesh(crate1Geo, darkMat);
    crate1.position.set(0, 0.7, 0);
    cluster.add(crate1);

    const crate2Geo = this.trackGeometry(new THREE.BoxGeometry(1.4, 1.2, 1.4));
    const crate2 = new THREE.Mesh(crate2Geo, archMat);
    crate2.position.set(1.4, 0.6, 0.3);
    crate2.rotation.y = 0.25;
    cluster.add(crate2);

    const crate3 = new THREE.Mesh(crate2Geo, darkMat);
    crate3.position.set(-0.2, 1.9, 0.1);
    crate3.rotation.y = -0.15;
    cluster.add(crate3);

    // Glowing status panel
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.4), amberMat);
    led.position.set(0.92, 0.8, 0);
    cluster.add(led);
    this.beaconLights.push(led);

    this.mesh.add(cluster);
  }

  private createCloakedOfficer(pos: THREE.Vector3, cloakMat: THREE.Material, skinMat: THREE.Material): void {
    const figure = new THREE.Group();
    figure.position.copy(pos);

    // Flowing cloak cone
    const cloakGeo = this.trackGeometry(new THREE.ConeGeometry(0.5, 1.7, 10));
    const cloak = new THREE.Mesh(cloakGeo, cloakMat);
    cloak.position.y = 0.85;
    figure.add(cloak);

    // Hood / head
    const headGeo = this.trackGeometry(new THREE.SphereGeometry(0.22, 12, 10));
    const head = new THREE.Mesh(headGeo, cloakMat);
    head.position.y = 1.75;
    figure.add(head);

    this.mesh.add(figure);
    this.deckCrewOfficers.push({ group: figure, head, seed: Math.random() * 50 });
  }

  private createDeckCrewTechnician(pos: THREE.Vector3, suitMat: THREE.Material): void {
    const tech = new THREE.Group();
    tech.position.copy(pos);

    const bodyGeo = this.trackGeometry(new THREE.CylinderGeometry(0.22, 0.18, 0.9, 8));
    const body = new THREE.Mesh(bodyGeo, suitMat);
    body.position.y = 0.9;
    tech.add(body);

    const helmetGeo = this.trackGeometry(new THREE.SphereGeometry(0.2, 10, 8));
    const helmet = new THREE.Mesh(helmetGeo, suitMat);
    helmet.position.y = 1.5;
    tech.add(helmet);

    // Articulated diagnostic tool arm
    const armGeo = this.trackGeometry(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6));
    const arm = new THREE.Mesh(armGeo, suitMat);
    arm.position.set(0.28, 1.1, 0.15);
    arm.rotation.x = 0.6;
    tech.add(arm);

    this.mesh.add(tech);
    this.deckCrewTechs.push({ group: tech, arm, seed: Math.random() * 50 });
  }

  private createServiceDrone(
    pos: THREE.Vector3,
    orbitRadius: number,
    speed: number,
    archMat: THREE.Material,
    cyanMat: THREE.Material
  ): void {
    const drone = new THREE.Group();
    drone.position.copy(pos);

    // Central chassis orb
    const bodyGeo = this.trackGeometry(new THREE.SphereGeometry(0.35, 16, 16));
    const body = new THREE.Mesh(bodyGeo, archMat);
    drone.add(body);

    // Rotating outer diagnostic scanner ring
    const ringGeo = this.trackGeometry(new THREE.TorusGeometry(0.55, 0.05, 8, 24));
    const ring = new THREE.Mesh(ringGeo, cyanMat);
    drone.add(ring);

    // Top sensor antenna
    const antGeo = this.trackGeometry(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6));
    const ant = new THREE.Mesh(antGeo, archMat);
    ant.position.y = 0.45;
    drone.add(ant);

    // Blinking eye
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), cyanMat);
    eye.position.set(0, 0, 0.32);
    drone.add(eye);
    this.beaconLights.push(eye);

    // Soft downward scanner cone
    const scanGeo = this.trackGeometry(new THREE.ConeGeometry(0.5, 1.8, 12, 1, true));
    scanGeo.translate(0, -0.9, 0);
    const scanMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    const scanCone = new THREE.Mesh(scanGeo, scanMat);
    drone.add(scanCone);

    this.mesh.add(drone);
    this.serviceDrones.push({
      group: drone,
      ring,
      basePos: pos.clone(),
      orbitRadius,
      speed,
      seed: Math.random() * 100,
    });
  }

  // --- PARTICLE SYSTEMS: WELDING SPARKS & DUST MOTES ---

  private buildParticleSystems(): void {
    // 1. Welding Sparks Particle System
    const sparkCount = 120;
    const sparkGeo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(sparkCount * 3);
    const sparkColors = new Float32Array(sparkCount * 3);

    for (let i = 0; i < sparkCount; i++) {
      this.sparkPositions[i * 3] = 0;
      this.sparkPositions[i * 3 + 1] = -100; // Inactive below deck
      this.sparkPositions[i * 3 + 2] = 0;

      sparkColors[i * 3] = 1.0;
      sparkColors[i * 3 + 1] = 0.75 + Math.random() * 0.25;
      sparkColors[i * 3 + 2] = 0.3;

      this.sparkVelocities.push({ x: 0, y: 0, z: 0, life: 0, maxLife: 0 });
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

    const sparkMat = this.trackMaterial(
      new THREE.PointsMaterial({
        size: 0.18,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.sparkParticles = new THREE.Points(sparkGeo, sparkMat);
    this.mesh.add(this.sparkParticles);

    // 2. Atmospheric Floating Dust Motes
    const dustCount = 350;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);

    for (let d = 0; d < dustCount; d++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (this.radius * 0.85);
      dustPos[d * 3] = Math.sin(angle) * dist;
      dustPos[d * 3 + 1] = 0.5 + Math.random() * (this.height - 3.5);
      dustPos[d * 3 + 2] = Math.cos(angle) * dist;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = this.trackMaterial(
      new THREE.PointsMaterial({
        size: 0.12,
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.dustParticles = new THREE.Points(dustGeo, dustMat);
    this.mesh.add(this.dustParticles);
  }

  private triggerWeldingSparks(): void {
    // Two high maintenance catwalk weld origins
    const weldOrigins = [
      new THREE.Vector3(-12.5, 11.2, -7.5),
      new THREE.Vector3(13.2, 10.8, 6.2),
      new THREE.Vector3(0, this.height - 3.2, 3.8),
    ];
    const origin = weldOrigins[Math.floor(Math.random() * weldOrigins.length)];

    const burstSize = 18 + Math.floor(Math.random() * 12);
    let activated = 0;

    for (let i = 0; i < this.sparkVelocities.length && activated < burstSize; i++) {
      if (this.sparkVelocities[i].life <= 0) {
        this.sparkPositions[i * 3] = origin.x + (Math.random() - 0.5) * 0.3;
        this.sparkPositions[i * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.3;
        this.sparkPositions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.3;

        this.sparkVelocities[i] = {
          x: (Math.random() - 0.5) * 4.5,
          y: -1.0 - Math.random() * 3.5,
          z: (Math.random() - 0.5) * 4.5,
          life: 0.7 + Math.random() * 0.8,
          maxLife: 1.2,
        };
        activated++;
      }
    }
  }

  private buildExitForceField(): void {
    const gateGeo = this.trackGeometry(new THREE.PlaneGeometry(24, 13));
    const gateMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    );
    this.forceField = new THREE.Mesh(gateGeo, gateMat);
    this.forceField.position.set(0, 6.5, this.runwayLength / 2 - 1.2);
    this.mesh.add(this.forceField);

    // Glowing gate perimeter arch
    const archGlow = new THREE.PointLight(0x0284c7, 16, 22);
    archGlow.position.set(0, 7.0, this.runwayLength / 2 - 2.0);
    this.mesh.add(archGlow);
  }

  private setupTheatricalLighting(): void {
    // Warm tungsten interior ambient fill
    const ambientHangar = new THREE.AmbientLight(0xfff7ed, 0.85);
    this.mesh.add(ambientHangar);

    // Cool Aerospace Cyan Contrast Rim Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    rimLight.position.set(-18, 14, -14);
    this.mesh.add(rimLight);

    // Starboard Golden Warm Key Light
    const keyLight = new THREE.DirectionalLight(0xfef3c7, 3.2);
    keyLight.position.set(16, 15, 12);
    this.mesh.add(keyLight);
  }

  // --- HERMETIC PUBLIC INTERFACE (OOP & SRP) ---

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public getLandingPad(): THREE.Group {
    return this.landingPad;
  }

  public getExitGateZ(): number {
    return this.runwayLength / 2 - 1.0;
  }

  public setGateOpen(isOpen: boolean): void {
    this.isGateOpen = isOpen;
  }

  public isGateCleared(): boolean {
    return this.gateProgress >= 0.75;
  }

  public alignPadToForward(deltaTime: number, speed: number = 4.0): boolean {
    const currentRot = this.landingPad.rotation.y % (Math.PI * 2);
    const diff = Math.atan2(Math.sin(-currentRot), Math.cos(-currentRot));

    if (Math.abs(diff) < 0.02) {
      this.landingPad.rotation.y = 0;
      return true;
    }

    this.landingPad.rotation.y += Math.sign(diff) * Math.min(Math.abs(diff), speed * deltaTime);
    return false;
  }

  public resetPadRotation(): void {
    this.landingPad.rotation.y = 0;
  }

  public update(deltaTime: number, rotatePad: boolean = true): void {
    this.elapsedTime += deltaTime;

    // Gate opening animation
    if (this.isGateOpen) {
      this.gateProgress = Math.min(1.0, this.gateProgress + deltaTime * 1.5);
    } else {
      this.gateProgress = Math.max(0.0, this.gateProgress - deltaTime * 1.5);
    }

    if (this.forceField && this.forceField.material) {
      const mat = this.forceField.material as THREE.MeshBasicMaterial;
      const pulse = Math.sin(this.elapsedTime * 3.2) * 0.04;
      mat.opacity = Math.max(0.01, (0.22 + pulse) * (1.0 - this.gateProgress));
      this.forceField.visible = this.gateProgress < 0.98;
    }

    // Slow rotating landing pad in idle mode
    if (rotatePad) {
      this.landingPad.rotation.y += 0.22 * deltaTime;
    }

    // Volumetric spotlight cones pulsing with atmospheric haze
    const beamPulse = 0.14 + Math.sin(this.elapsedTime * 2.2) * 0.03;
    for (const cone of this.spotlightCones) {
      (cone.material as THREE.MeshBasicMaterial).opacity = beamPulse;
    }

    // Beacon lights rhythmic pulse
    const beaconPulse = 0.7 + Math.sin(this.elapsedTime * 5.0) * 0.3;
    for (const beacon of this.beaconLights) {
      (beacon.material as THREE.MeshBasicMaterial).opacity = beaconPulse;
    }

    // Astromech dome head subtle turning
    if (this.astromechHead) {
      this.astromechHead.rotation.y = Math.sin(this.elapsedTime * 1.2) * 0.8;
    }

    // Tactical hologram rotation
    if (this.holoPlanet) {
      this.holoPlanet.rotation.y += 0.45 * deltaTime;
    }

    // Subtle idle animation loop for cloaked officers (breathing + slow head scanning)
    for (const off of this.deckCrewOfficers) {
      const breath = 1.0 + Math.sin(this.elapsedTime * 1.5 + off.seed) * 0.015;
      off.group.scale.y = breath;
      off.head.rotation.y = Math.sin(this.elapsedTime * 0.6 + off.seed) * 0.35;
      off.head.rotation.x = Math.sin(this.elapsedTime * 0.9 + off.seed) * 0.06;
    }

    // Subtle idle animation loop for deck crew technicians (diagnostic tool arm & weight shifting)
    for (const tech of this.deckCrewTechs) {
      const sway = Math.sin(this.elapsedTime * 1.2 + tech.seed) * 0.02;
      tech.group.rotation.z = sway;
      tech.arm.rotation.x = 0.6 + Math.sin(this.elapsedTime * 2.0 + tech.seed) * 0.22;
      tech.arm.rotation.z = Math.cos(this.elapsedTime * 1.5 + tech.seed) * 0.12;
    }

    // Rotating service drones (repulsorlift hover bobbing + scanning ring spin + patrol orbit)
    for (const drone of this.serviceDrones) {
      const t = this.elapsedTime * drone.speed + drone.seed;
      const hoverY = drone.basePos.y + Math.sin(this.elapsedTime * 2.2 + drone.seed) * 0.14;
      const posX = drone.basePos.x + Math.sin(t) * drone.orbitRadius;
      const posZ = drone.basePos.z + Math.cos(t) * drone.orbitRadius;
      drone.group.position.set(posX, hoverY, posZ);

      drone.group.rotation.y = t + Math.PI / 2;
      drone.group.rotation.z = Math.sin(t) * 0.08;

      drone.ring.rotation.z += 2.4 * deltaTime;
    }

    // Welding Sparks Animation
    this.nextSparkTime -= deltaTime;
    if (this.nextSparkTime <= 0) {
      this.triggerWeldingSparks();
      this.nextSparkTime = 0.8 + Math.random() * 1.4;
    }

    if (this.sparkParticles && this.sparkPositions) {
      const gravity = 9.8;
      for (let i = 0; i < this.sparkVelocities.length; i++) {
        const vel = this.sparkVelocities[i];
        if (vel.life > 0) {
          vel.life -= deltaTime;
          vel.y -= gravity * deltaTime;

          this.sparkPositions[i * 3] += vel.x * deltaTime;
          this.sparkPositions[i * 3 + 1] += vel.y * deltaTime;
          this.sparkPositions[i * 3 + 2] += vel.z * deltaTime;

          // Floor bounce
          if (this.sparkPositions[i * 3 + 1] < 0.05) {
            this.sparkPositions[i * 3 + 1] = 0.05;
            vel.y = -vel.y * 0.35;
            vel.x *= 0.6;
            vel.z *= 0.6;
          }
        } else {
          this.sparkPositions[i * 3 + 1] = -100; // Hide below floor
        }
      }
      this.sparkParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Atmospheric Dust Drifting
    if (this.dustParticles) {
      const posAttr = this.dustParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let d = 0; d < posAttr.count; d++) {
        let y = posAttr.getY(d) + Math.sin(this.elapsedTime + d) * 0.008;
        if (y < 0.2) y = this.height - 3.5;
        if (y > this.height - 3.5) y = 0.2;
        posAttr.setY(d, y);
      }
      posAttr.needsUpdate = true;
    }
  }

  public dispose(): void {
    for (const geo of this.geometries) {
      geo.dispose();
    }
    for (const mat of this.materials) {
      mat.dispose();
    }
    for (const tex of this.textures) {
      tex.dispose();
    }
    this.geometries = [];
    this.materials = [];
    this.textures = [];
    this.spotlightCones = [];
    this.spotlights = [];
    this.beaconLights = [];
    this.deckCrewOfficers = [];
    this.deckCrewTechs = [];
    this.serviceDrones = [];
  }
}
