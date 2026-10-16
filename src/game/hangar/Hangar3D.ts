import * as THREE from 'three';

/**
 * Hangar3D - Architectural 3D Space Station Hangar Bay
 * Incorporates landing pad, force field exit gate, structural ribs, and neon runway.
 * Follows OOP principles with hermetic encapsulation and clean lifecycle management.
 */
export class Hangar3D {
  public mesh: THREE.Group;
  public landingPad: THREE.Group; // Tutaj możesz podpiąć swój statek!
  private forceField!: THREE.Mesh;
  private padLightRing!: THREE.Mesh;
  private elapsedTime: number = 0;

  // Hermetic state and materials
  private isGateOpen: boolean = false;
  private gateOpenProgress: number = 0;
  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private readonly hangarWidth = 22;
  private readonly hangarHeight = 12;
  private readonly hangarDepth = 30;

  constructor() {
    this.mesh = new THREE.Group();
    this.landingPad = new THREE.Group();
    this.buildHangar();
  }

  private trackMaterial<T extends THREE.Material>(mat: T): T {
    this.materials.push(mat);
    return mat;
  }

  private trackGeometry<T extends THREE.BufferGeometry>(geo: T): T {
    this.geometries.push(geo);
    return geo;
  }

  private buildHangar(): void {
    // --- MATERIAŁY ---
    const floorMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.6,
        roughness: 0.3,
      })
    );

    const wallMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.5,
        roughness: 0.6,
      })
    );

    const pillarMat = this.trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.8,
        roughness: 0.3,
      })
    );

    const neonCyanMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
      })
    );

    const neonOrangeMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
      })
    );

    const width = this.hangarWidth;
    const height = this.hangarHeight;
    const depth = this.hangarDepth;

    // --- 1. PODŁOGA I SUFIT ---
    const floorGeo = this.trackGeometry(new THREE.BoxGeometry(width, 0.5, depth));
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.25;
    this.mesh.add(floor);

    // Siatka techniczna na podłodze (bezpikselowe linie wektorowe)
    const grid = new THREE.GridHelper(width, 22, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.01;
    this.mesh.add(grid);

    const ceiling = new THREE.Mesh(floorGeo, wallMat);
    ceiling.position.y = height + 0.25;
    this.mesh.add(ceiling);

    // --- 2. ŚCIANY BOCZNE I TYLNA ---
    const sideWallGeo = this.trackGeometry(new THREE.BoxGeometry(0.6, height, depth));

    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.set(-width / 2, height / 2, 0);
    this.mesh.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.set(width / 2, height / 2, 0);
    this.mesh.add(rightWall);

    const backWallGeo = this.trackGeometry(new THREE.BoxGeometry(width, height, 0.6));
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, height / 2, -depth / 2);
    this.mesh.add(backWall);

    // --- 3. ŻEBRA KONSTRUKCYJNE (FILARY I BELKI) I ŚWIATŁA ---
    const numRibs = 5;
    const spacing = depth / numRibs;

    for (let i = 0; i <= numRibs; i++) {
      const zPos = -depth / 2 + i * spacing;

      // Boczne pochylone filary
      const pillarGeo = this.trackGeometry(new THREE.BoxGeometry(1.2, height, 1.2));

      const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
      leftPillar.position.set(-width / 2 + 0.6, height / 2, zPos);
      this.mesh.add(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
      rightPillar.position.set(width / 2 - 0.6, height / 2, zPos);
      this.mesh.add(rightPillar);

      // Górna belka stropowa
      const beamGeo = this.trackGeometry(new THREE.BoxGeometry(width, 1.0, 1.2));
      const topBeam = new THREE.Mesh(beamGeo, pillarMat);
      topBeam.position.set(0, height - 0.5, zPos);
      this.mesh.add(topBeam);

      // Paski LED na filarach
      const stripGeo = this.trackGeometry(new THREE.BoxGeometry(0.1, height * 0.6, 0.2));
      const leftStrip = new THREE.Mesh(stripGeo, neonCyanMat);
      leftStrip.position.set(-width / 2 + 1.25, height / 2, zPos);
      this.mesh.add(leftStrip);

      const rightStrip = new THREE.Mesh(stripGeo, neonCyanMat);
      rightStrip.position.set(width / 2 - 1.25, height / 2, zPos);
      this.mesh.add(rightStrip);
    }

    // Pasy ostrzegawcze (pomarańczowe neony) wzdłuż drogi startowej
    const runwayStripGeo = this.trackGeometry(new THREE.BoxGeometry(0.2, 0.05, depth * 0.8));
    const leftRunway = new THREE.Mesh(runwayStripGeo, neonOrangeMat);
    leftRunway.position.set(-5.5, 0.02, 1);
    this.mesh.add(leftRunway);

    const rightRunway = new THREE.Mesh(runwayStripGeo, neonOrangeMat);
    rightRunway.position.set(5.5, 0.02, 1);
    this.mesh.add(rightRunway);

    // --- 4. OBROTOWA PLATFORMA LĄDOWISKA (LANDING PAD) ---
    const padBaseGeo = this.trackGeometry(new THREE.CylinderGeometry(4.2, 4.6, 0.35, 32));
    const padBase = new THREE.Mesh(padBaseGeo, pillarMat);
    padBase.position.y = 0.175;
    this.landingPad.add(padBase);

    // Świecący pierścień wokół lądowiska
    const ringGeo = this.trackGeometry(new THREE.RingGeometry(3.7, 3.95, 32));
    ringGeo.rotateX(-Math.PI / 2);
    this.padLightRing = new THREE.Mesh(ringGeo, neonCyanMat);
    this.padLightRing.position.y = 0.36;
    this.landingPad.add(this.padLightRing);

    // Krzyż celowniczy na środku platformy
    const crossGeo = this.trackGeometry(new THREE.PlaneGeometry(5, 0.15));
    crossGeo.rotateX(-Math.PI / 2);
    const cross1 = new THREE.Mesh(crossGeo, neonOrangeMat);
    cross1.position.y = 0.36;
    this.landingPad.add(cross1);

    const cross2 = cross1.clone();
    cross2.rotation.z = Math.PI / 2;
    this.landingPad.add(cross2);

    this.mesh.add(this.landingPad);

    // --- 5. POLE SIŁOWE W BRAMIE WYLOTOWEJ ---
    const shieldGeo = this.trackGeometry(new THREE.PlaneGeometry(width - 1.2, height - 1));
    const shieldMat = this.trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      })
    );
    this.forceField = new THREE.Mesh(shieldGeo, shieldMat);
    this.forceField.position.set(0, height / 2, depth / 2 - 0.2);
    this.mesh.add(this.forceField);

    // --- 6. OŚWIETLENIE HANGARU ---
    // Górne światło nad platformą (oświetla statek z góry)
    const mainSpot = new THREE.PointLight(0xffffff, 25, 25);
    mainSpot.position.set(0, height - 1.5, 0);
    this.mesh.add(mainSpot);

    // Dolne światło od platformy (nadaje klimatyczny niebieski blask od spodu statku)
    const padGlow = new THREE.PointLight(0x38bdf8, 8, 12);
    padGlow.position.set(0, 1.5, 0);
    this.mesh.add(padGlow);

    // Światło przy wyjściu (od pola siłowego)
    const gateGlow = new THREE.PointLight(0x0ea5e9, 15, 20);
    gateGlow.position.set(0, height / 2, depth / 2 - 2);
    this.mesh.add(gateGlow);
  }

  // Wywołuj w każdej klatce gry (game loop)
  public update(deltaTime: number, rotatePad: boolean = true): void {
    this.elapsedTime += deltaTime;

    // Powolny obrót platformy razem ze statkiem (jak w menu głównym gry)
    if (rotatePad) {
      this.landingPad.rotation.y += 0.25 * deltaTime;
    }

    // Płynna zmiana stanu otwarcia pola siłowego w bramie
    if (this.isGateOpen && this.gateOpenProgress < 1.0) {
      this.gateOpenProgress = Math.min(1.0, this.gateOpenProgress + deltaTime * 2.0);
    } else if (!this.isGateOpen && this.gateOpenProgress > 0.0) {
      this.gateOpenProgress = Math.max(0.0, this.gateOpenProgress - deltaTime * 2.0);
    }

    // Pulsowanie pola siłowego w bramie hangaru
    const mat = this.forceField.material as THREE.MeshBasicMaterial;
    const basePulse = 0.14 + Math.sin(this.elapsedTime * 3) * 0.05;
    mat.opacity = basePulse * (1 - this.gateOpenProgress * 0.85);

    // Subtelne pulsowanie pierścienia lądowiska
    if (this.padLightRing && this.padLightRing.material) {
      const ringMat = this.padLightRing.material as THREE.MeshBasicMaterial;
      ringMat.opacity = 0.85 + Math.sin(this.elapsedTime * 4) * 0.15;
    }
  }

  // --- HERMETYCZNE METODY PUBLICZNE (SRP / OOP) ---

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public getLandingPad(): THREE.Group {
    return this.landingPad;
  }

  public getExitGateZ(): number {
    return this.hangarDepth / 2 - 0.2;
  }

  public getDimensions(): { width: number; height: number; depth: number } {
    return {
      width: this.hangarWidth,
      height: this.hangarHeight,
      depth: this.hangarDepth,
    };
  }

  public setGateOpen(isOpen: boolean): void {
    this.isGateOpen = isOpen;
  }

  public isGateCleared(): boolean {
    return this.gateOpenProgress >= 0.75;
  }

  public alignPadToForward(deltaTime: number, speed: number = 4.0): boolean {
    const currentRot = this.landingPad.rotation.y % (Math.PI * 2);
    const targetRot = 0;
    const diff = Math.atan2(Math.sin(targetRot - currentRot), Math.cos(targetRot - currentRot));

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

  public dispose(): void {
    for (const geo of this.geometries) {
      geo.dispose();
    }
    for (const mat of this.materials) {
      mat.dispose();
    }
    this.geometries = [];
    this.materials = [];
  }
}
