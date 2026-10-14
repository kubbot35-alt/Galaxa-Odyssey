import * as THREE from 'three';

export interface SpaceshipOptions {
  hullColor?: number;
  armorColor?: number;
  wingColor?: number;
  cockpitColor?: number;
  lightPlateColor?: number;
  cyanColor?: number;
  orangeColor?: number;
  flameColor?: number;
  isPlayer2?: boolean;
}

/**
 * Spaceship3D:
 * Full 3D replica of the user's concept starfighter:
 * - Bifurcated forward prow (twin razor mandibles with glowing cyan & orange accents)
 * - Recessed central cockpit with glowing cyan chevron visor
 * - Raised faceted white/silver dorsal carapace plate with amber sub-sensor
 * - Layered delta wings with glowing geometric cyan energy circuitry
 * - Forward-canted wingtip stabilizers with orange knife-edge accents
 * - Dual dorsal rotary autocannon turrets with circular cyan energy rings
 * - Outer forward-mounted heavy plasma cannons
 * - Triple heavy ion propulsion exhaust nozzles with afterburner plasma flames
 */
export class Spaceship3D {
  public mesh: THREE.Group;
  public thrusterFlame!: THREE.Mesh;
  public engineLight!: THREE.PointLight;

  // Secondary flames and lights for triple engine cluster
  public engineFlames: THREE.Mesh[] = [];
  public engineLights: THREE.PointLight[] = [];

  // Material handles for live customization & skins
  public darkArmorMat!: THREE.MeshStandardMaterial;
  public midArmorMat!: THREE.MeshStandardMaterial;
  public lightArmorMat!: THREE.MeshStandardMaterial;
  public cyanNeonMat!: THREE.MeshBasicMaterial;
  public orangeGlowMat!: THREE.MeshBasicMaterial;
  public cockpitMat!: THREE.MeshPhysicalMaterial;
  public metalTurretMat!: THREE.MeshStandardMaterial;
  public flameMat!: THREE.MeshBasicMaterial;

  constructor(options?: SpaceshipOptions) {
    this.mesh = new THREE.Group();
    this.buildShip(options);
  }

  private buildShip(options?: SpaceshipOptions): void {
    const isP2 = options?.isPlayer2 ?? false;

    // --- 1. PBR MATERIALS ---
    const darkColor = options?.hullColor ?? (isP2 ? 0x1e1035 : 0x0f172a);
    const midColor = options?.armorColor ?? options?.wingColor ?? (isP2 ? 0x3b1d60 : 0x1e293b);
    const lightPlateColor = options?.lightPlateColor ?? 0xf1f5f9;
    const cyanColor = options?.cyanColor ?? (isP2 ? 0xf43f5e : 0x00f0ff);
    const orangeColor = options?.orangeColor ?? (isP2 ? 0xfbbf24 : 0xf97316);
    const flameColor = options?.flameColor ?? (isP2 ? 0xf43f5e : 0x38bdf8);

    this.darkArmorMat = new THREE.MeshStandardMaterial({
      color: darkColor,
      metalness: 0.88,
      roughness: 0.28,
    });

    this.midArmorMat = new THREE.MeshStandardMaterial({
      color: midColor,
      metalness: 0.82,
      roughness: 0.35,
    });

    this.lightArmorMat = new THREE.MeshStandardMaterial({
      color: lightPlateColor,
      metalness: 0.65,
      roughness: 0.2,
    });

    this.metalTurretMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.95,
      roughness: 0.15,
    });

    this.cockpitMat = new THREE.MeshPhysicalMaterial({
      color: isP2 ? 0x9f1239 : 0x0369a1,
      emissive: cyanColor,
      emissiveIntensity: 0.75,
      metalness: 0.3,
      roughness: 0.1,
      transmission: 0.65,
      transparent: true,
      opacity: 0.95,
    });

    this.cyanNeonMat = new THREE.MeshBasicMaterial({
      color: cyanColor,
    });

    this.orangeGlowMat = new THREE.MeshBasicMaterial({
      color: orangeColor,
    });

    this.flameMat = new THREE.MeshBasicMaterial({
      color: flameColor,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });

    // --- 2. MAIN FUSELAGE CHASSIS ---
    // Core aerodynamic center body
    const coreShape = new THREE.Shape();
    coreShape.moveTo(0, 1.2);
    coreShape.lineTo(0.55, 0.4);
    coreShape.lineTo(0.75, -1.0);
    coreShape.lineTo(0.65, -2.1);
    coreShape.lineTo(-0.65, -2.1);
    coreShape.lineTo(-0.75, -1.0);
    coreShape.lineTo(-0.55, 0.4);
    coreShape.closePath();

    const coreExtrude = new THREE.ExtrudeGeometry(coreShape, {
      depth: 0.48,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    });
    coreExtrude.rotateX(Math.PI / 2);
    coreExtrude.translate(0, 0.05, 0);
    const coreMesh = new THREE.Mesh(coreExtrude, this.darkArmorMat);
    this.mesh.add(coreMesh);

    // --- 3. BIFURCATED FORWARD PROW (TWIN MANDIBLES) ---
    // Right Mandible
    const mandibleShape = new THREE.Shape();
    mandibleShape.moveTo(0.18, 0.5);
    mandibleShape.lineTo(0.42, 2.7); // Sharp forward point
    mandibleShape.lineTo(0.85, 2.1);
    mandibleShape.lineTo(1.05, 0.8);
    mandibleShape.lineTo(0.75, 0.2);
    mandibleShape.lineTo(0.35, 0.3);
    mandibleShape.closePath();

    const mandibleExtrude = new THREE.ExtrudeGeometry(mandibleShape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    mandibleExtrude.rotateX(Math.PI / 2);

    const rightMandible = new THREE.Mesh(mandibleExtrude, this.midArmorMat);
    rightMandible.position.set(0.12, 0.06, 0);
    this.mesh.add(rightMandible);

    // Left Mandible (Mirrored)
    const leftMandible = rightMandible.clone();
    leftMandible.scale.x = -1;
    leftMandible.position.x = -0.12;
    this.mesh.add(leftMandible);

    // Mandible Top White/Silver Armor Plates
    const plateShape = new THREE.Shape();
    plateShape.moveTo(0.3, 0.8);
    plateShape.lineTo(0.44, 2.45);
    plateShape.lineTo(0.76, 1.95);
    plateShape.lineTo(0.85, 1.0);
    plateShape.closePath();

    const plateGeo = new THREE.ExtrudeGeometry(plateShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
    plateGeo.rotateX(Math.PI / 2);

    const rightPlate = new THREE.Mesh(plateGeo, this.lightArmorMat);
    rightPlate.position.set(0.14, 0.2, 0);
    this.mesh.add(rightPlate);

    const leftPlate = rightPlate.clone();
    leftPlate.scale.x = -1;
    leftPlate.position.x = -0.14;
    this.mesh.add(leftPlate);

    // Mandible Glowing Cyan Accent Strips (Edge lights)
    const rightMandibleGlowGeo = new THREE.BoxGeometry(0.04, 0.04, 1.6);
    const rightMandibleGlow = new THREE.Mesh(rightMandibleGlowGeo, this.cyanNeonMat);
    rightMandibleGlow.position.set(0.48, 0.18, 1.65);
    rightMandibleGlow.rotation.y = -0.11;
    this.mesh.add(rightMandibleGlow);

    const leftMandibleGlow = rightMandibleGlow.clone();
    leftMandibleGlow.position.x = -0.48;
    leftMandibleGlow.rotation.y = 0.11;
    this.mesh.add(leftMandibleGlow);

    // Mandible Glowing Orange Intake Slots
    const orangeVentGeo = new THREE.BoxGeometry(0.05, 0.03, 0.55);
    const rightOrangeVent = new THREE.Mesh(orangeVentGeo, this.orangeGlowMat);
    rightOrangeVent.position.set(0.75, 0.22, 1.45);
    rightOrangeVent.rotation.y = -0.18;
    this.mesh.add(rightOrangeVent);

    const leftOrangeVent = rightOrangeVent.clone();
    leftOrangeVent.position.x = -0.75;
    leftOrangeVent.rotation.y = 0.18;
    this.mesh.add(leftOrangeVent);

    // --- 4. RECESSED CENTRAL COCKPIT WITH CYAN VISOR CHEVRON ---
    const cockpitGeo = new THREE.ConeGeometry(0.36, 1.5, 6);
    cockpitGeo.rotateX(Math.PI / 2);
    cockpitGeo.scale(0.9, 0.55, 1.1);
    const cockpit = new THREE.Mesh(cockpitGeo, this.cockpitMat);
    cockpit.position.set(0, 0.22, 0.65);
    this.mesh.add(cockpit);

    // Cyan Neon Chevron V on Cockpit Glass
    const chevronGeo1 = new THREE.BoxGeometry(0.035, 0.02, 0.4);
    const chevronLeft = new THREE.Mesh(chevronGeo1, this.cyanNeonMat);
    chevronLeft.position.set(-0.1, 0.32, 0.7);
    chevronLeft.rotation.y = 0.38;
    this.mesh.add(chevronLeft);

    const chevronRight = chevronLeft.clone();
    chevronRight.position.x = 0.1;
    chevronRight.rotation.y = -0.38;
    this.mesh.add(chevronRight);

    // Inner cockpit glowing crossbar
    const crossbarGeo = new THREE.BoxGeometry(0.18, 0.02, 0.035);
    const crossbar = new THREE.Mesh(crossbarGeo, this.cyanNeonMat);
    crossbar.position.set(0, 0.32, 0.5);
    this.mesh.add(crossbar);

    // --- 5. RAISED DORSAL WHITE/SILVER CARAPACE (SHIELD GENERATOR) ---
    const carapaceShape = new THREE.Shape();
    carapaceShape.moveTo(0, 0.25);
    carapaceShape.lineTo(0.55, -0.45);
    carapaceShape.lineTo(0.42, -1.4);
    carapaceShape.lineTo(-0.42, -1.4);
    carapaceShape.lineTo(-0.55, -0.45);
    carapaceShape.closePath();

    const carapaceGeo = new THREE.ExtrudeGeometry(carapaceShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    carapaceGeo.rotateX(Math.PI / 2);

    const carapaceMesh = new THREE.Mesh(carapaceGeo, this.lightArmorMat);
    carapaceMesh.position.set(0, 0.32, 0);
    this.mesh.add(carapaceMesh);

    // Amber Sensor Node on Carapace Center
    const sensorGeo = new THREE.BoxGeometry(0.12, 0.08, 0.32);
    const sensorNode = new THREE.Mesh(sensorGeo, this.orangeGlowMat);
    sensorNode.position.set(0, 0.42, -0.6);
    this.mesh.add(sensorNode);

    // --- 6. AGGRESSIVE SWEPT DELTA WINGS WITH STEPPED PLATING ---
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0.5, 0.4);
    wingShape.lineTo(2.4, -0.8);
    wingShape.lineTo(2.6, -1.4);
    wingShape.lineTo(1.8, -1.8);
    wingShape.lineTo(0.7, -1.9);
    wingShape.lineTo(0.5, -0.5);
    wingShape.closePath();

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    });
    wingGeo.rotateX(Math.PI / 2);

    const rightWing = new THREE.Mesh(wingGeo, this.darkArmorMat);
    rightWing.position.set(0, 0.02, 0);
    this.mesh.add(rightWing);

    const leftWing = rightWing.clone();
    leftWing.scale.x = -1;
    this.mesh.add(leftWing);

    // Upper Wing Layer Plate (Mid-Armor Stepped Panel)
    const upperWingShape = new THREE.Shape();
    upperWingShape.moveTo(0.65, 0.1);
    upperWingShape.lineTo(2.1, -0.9);
    upperWingShape.lineTo(1.9, -1.5);
    upperWingShape.lineTo(0.7, -1.6);
    upperWingShape.closePath();

    const upperWingGeo = new THREE.ExtrudeGeometry(upperWingShape, {
      depth: 0.07,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
    upperWingGeo.rotateX(Math.PI / 2);

    const rightUpperWing = new THREE.Mesh(upperWingGeo, this.midArmorMat);
    rightUpperWing.position.set(0, 0.12, 0);
    this.mesh.add(rightUpperWing);

    const leftUpperWing = rightUpperWing.clone();
    leftUpperWing.scale.x = -1;
    this.mesh.add(leftUpperWing);

    // --- 7. GLOWING GEOMETRIC CYAN CIRCUITRY ON WINGS (EXACT MATCH) ---
    // Circuit trace 1: Diagonal runner
    const circuit1Geo = new THREE.BoxGeometry(0.045, 0.03, 1.4);
    const rightCircuit1 = new THREE.Mesh(circuit1Geo, this.cyanNeonMat);
    rightCircuit1.position.set(1.45, 0.18, -0.75);
    rightCircuit1.rotation.y = 0.58;
    this.mesh.add(rightCircuit1);

    const leftCircuit1 = rightCircuit1.clone();
    leftCircuit1.position.x = -1.45;
    leftCircuit1.rotation.y = -0.58;
    this.mesh.add(leftCircuit1);

    // Circuit trace 2: Elbow branch
    const circuit2Geo = new THREE.BoxGeometry(0.045, 0.03, 0.75);
    const rightCircuit2 = new THREE.Mesh(circuit2Geo, this.cyanNeonMat);
    rightCircuit2.position.set(1.15, 0.18, -0.4);
    rightCircuit2.rotation.y = 0.22;
    this.mesh.add(rightCircuit2);

    const leftCircuit2 = rightCircuit2.clone();
    leftCircuit2.position.x = -1.15;
    leftCircuit2.rotation.y = -0.22;
    this.mesh.add(leftCircuit2);

    // Circuit trace 3: Transverse cross-strip
    const circuit3Geo = new THREE.BoxGeometry(0.55, 0.03, 0.045);
    const rightCircuit3 = new THREE.Mesh(circuit3Geo, this.cyanNeonMat);
    rightCircuit3.position.set(1.5, 0.18, -1.05);
    this.mesh.add(rightCircuit3);

    const leftCircuit3 = rightCircuit3.clone();
    leftCircuit3.position.x = -1.5;
    this.mesh.add(leftCircuit3);

    // Wing Leading Edge Glowing Orange Chevron Vents
    const wingOrangeVentGeo = new THREE.BoxGeometry(0.045, 0.03, 0.22);
    for (let i = 0; i < 3; i++) {
      const zOffset = 0.2 - i * 0.28;
      const xOffset = 0.9 + i * 0.32;
      const rVent = new THREE.Mesh(wingOrangeVentGeo, this.orangeGlowMat);
      rVent.position.set(xOffset, 0.16, zOffset);
      rVent.rotation.y = 0.45;
      this.mesh.add(rVent);

      const lVent = rVent.clone();
      lVent.position.x = -xOffset;
      lVent.rotation.y = -0.45;
      this.mesh.add(lVent);
    }

    // --- 8. FORWARD-CANTED WINGTIP STABILIZER FINS ---
    const wingtipShape = new THREE.Shape();
    wingtipShape.moveTo(0, 0);
    wingtipShape.lineTo(0.35, 1.2); // Forward pointing tip
    wingtipShape.lineTo(0.65, 0.9);
    wingtipShape.lineTo(0.5, -0.6);
    wingtipShape.lineTo(0, -0.4);
    wingtipShape.closePath();

    const wingtipGeo = new THREE.ExtrudeGeometry(wingtipShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
    wingtipGeo.rotateX(Math.PI / 2);

    const rightWingtip = new THREE.Mesh(wingtipGeo, this.midArmorMat);
    rightWingtip.position.set(2.2, 0.06, -1.1);
    this.mesh.add(rightWingtip);

    const leftWingtip = rightWingtip.clone();
    leftWingtip.scale.x = -1;
    leftWingtip.position.x = -2.2;
    this.mesh.add(leftWingtip);

    // Glowing Orange Wingtip Spike Accents
    const tipSpikeGeo = new THREE.BoxGeometry(0.06, 0.04, 0.45);
    const rightTipSpike = new THREE.Mesh(tipSpikeGeo, this.orangeGlowMat);
    rightTipSpike.position.set(2.48, 0.1, -0.25);
    rightTipSpike.rotation.y = 0.2;
    this.mesh.add(rightTipSpike);

    const leftTipSpike = rightTipSpike.clone();
    leftTipSpike.position.x = -2.48;
    leftTipSpike.rotation.y = -0.2;
    this.mesh.add(leftTipSpike);

    // Glowing Cyan Wingtip Outer Rails
    const tipRailGeo = new THREE.BoxGeometry(0.04, 0.03, 0.7);
    const rightTipRail = new THREE.Mesh(tipRailGeo, this.cyanNeonMat);
    rightTipRail.position.set(2.65, 0.08, -0.85);
    this.mesh.add(rightTipRail);

    const leftTipRail = rightTipRail.clone();
    leftTipRail.position.x = -2.65;
    this.mesh.add(leftTipRail);

    // --- 9. DUAL DORSAL ROTARY TURRETS WITH CYAN ENERGY RINGS ---
    const buildDorsalTurret = (isRight: boolean): THREE.Group => {
      const turretGroup = new THREE.Group();

      // Circular Base Ring
      const baseRingGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 20);
      baseRingGeo.rotateX(Math.PI / 2);
      const baseRing = new THREE.Mesh(baseRingGeo, this.cyanNeonMat);
      turretGroup.add(baseRing);

      // Swivel Turret Hub
      const hubGeo = new THREE.CylinderGeometry(0.15, 0.17, 0.12, 16);
      const hub = new THREE.Mesh(hubGeo, this.metalTurretMat);
      hub.position.y = 0.04;
      turretGroup.add(hub);

      // Gun Mount Dome
      const domeGeo = new THREE.SphereGeometry(0.11, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const dome = new THREE.Mesh(domeGeo, this.darkArmorMat);
      dome.position.y = 0.1;
      turretGroup.add(dome);

      // Twin Autocannon Barrels (Facing forward +Z)
      const barrelGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.7, 8);
      barrelGeo.rotateX(Math.PI / 2);

      const barrel1 = new THREE.Mesh(barrelGeo, this.metalTurretMat);
      barrel1.position.set(0.065, 0.09, 0.35);
      turretGroup.add(barrel1);

      const barrel2 = barrel1.clone();
      barrel2.position.x = -0.065;
      turretGroup.add(barrel2);

      // Muzzle glow tips
      const muzzleGlowGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.06, 8);
      muzzleGlowGeo.rotateX(Math.PI / 2);
      const muzzleGlow1 = new THREE.Mesh(muzzleGlowGeo, this.cyanNeonMat);
      muzzleGlow1.position.set(0.065, 0.09, 0.7);
      turretGroup.add(muzzleGlow1);

      const muzzleGlow2 = muzzleGlow1.clone();
      muzzleGlow2.position.x = -0.065;
      turretGroup.add(muzzleGlow2);

      turretGroup.position.set(isRight ? 1.05 : -1.05, 0.22, -0.6);
      return turretGroup;
    };

    this.mesh.add(buildDorsalTurret(true));
    this.mesh.add(buildDorsalTurret(false));

    // --- 10. OUTER FORWARD HEAVY AUTOCANNONS ---
    const heavyCannonGeo = new THREE.CylinderGeometry(0.055, 0.065, 1.3, 10);
    heavyCannonGeo.rotateX(Math.PI / 2);

    const rightHeavyCannon = new THREE.Mesh(heavyCannonGeo, this.metalTurretMat);
    rightHeavyCannon.position.set(1.9, 0.04, 0.2);
    this.mesh.add(rightHeavyCannon);

    const leftHeavyCannon = rightHeavyCannon.clone();
    leftHeavyCannon.position.x = -1.9;
    this.mesh.add(leftHeavyCannon);

    // Flash suppressor cooling rings
    const suppressorGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.15, 10);
    suppressorGeo.rotateX(Math.PI / 2);
    const rightSupp = new THREE.Mesh(suppressorGeo, this.orangeGlowMat);
    rightSupp.position.set(1.9, 0.04, 0.65);
    this.mesh.add(rightSupp);

    const leftSupp = rightSupp.clone();
    leftSupp.position.x = -1.9;
    this.mesh.add(leftSupp);

    // --- 11. TRIPLE HEAVY ION PROPULSION EXHAUST NOZZLES & AFTERBURNER FLAMES ---
    // Triple Thruster Cluster: Center Heavy Engine + 2 Flanking Lateral Engines

    // A. Center Main Engine
    const mainNozzleGeo = new THREE.CylinderGeometry(0.38, 0.48, 0.65, 16);
    mainNozzleGeo.rotateX(Math.PI / 2);
    const mainNozzle = new THREE.Mesh(mainNozzleGeo, this.metalTurretMat);
    mainNozzle.position.set(0, 0.04, -2.15);
    this.mesh.add(mainNozzle);

    // Heat-shield accent ring on main nozzle
    const nozzleRingGeo = new THREE.TorusGeometry(0.44, 0.035, 8, 20);
    const nozzleRing = new THREE.Mesh(nozzleRingGeo, this.orangeGlowMat);
    nozzleRing.position.set(0, 0.04, -2.25);
    this.mesh.add(nozzleRing);

    // Main Center Flame Cone
    const mainFlameGeo = new THREE.ConeGeometry(0.36, 2.2, 14);
    mainFlameGeo.rotateX(-Math.PI / 2);
    mainFlameGeo.translate(0, 0, -1.1);
    this.thrusterFlame = new THREE.Mesh(mainFlameGeo, this.flameMat);
    this.thrusterFlame.position.set(0, 0.04, -2.4);
    this.mesh.add(this.thrusterFlame);
    this.engineFlames.push(this.thrusterFlame);

    // Main Engine PointLight
    this.engineLight = new THREE.PointLight(flameColor, 3.5, 8);
    this.engineLight.position.set(0, 0.04, -3.0);
    this.mesh.add(this.engineLight);
    this.engineLights.push(this.engineLight);

    // B. Lateral Left & Right Engines
    const sideNozzleGeo = new THREE.CylinderGeometry(0.25, 0.34, 0.55, 14);
    sideNozzleGeo.rotateX(Math.PI / 2);

    const rightSideNozzle = new THREE.Mesh(sideNozzleGeo, this.metalTurretMat);
    rightSideNozzle.position.set(0.9, 0.06, -1.95);
    this.mesh.add(rightSideNozzle);

    const leftSideNozzle = rightSideNozzle.clone();
    leftSideNozzle.position.x = -0.9;
    this.mesh.add(leftSideNozzle);

    // Lateral Heat Rings
    const sideRingGeo = new THREE.TorusGeometry(0.31, 0.025, 8, 16);
    const rightSideRing = new THREE.Mesh(sideRingGeo, this.orangeGlowMat);
    rightSideRing.position.set(0.9, 0.06, -2.05);
    this.mesh.add(rightSideRing);

    const leftSideRing = rightSideRing.clone();
    leftSideRing.position.x = -0.9;
    this.mesh.add(leftSideRing);

    // Lateral Flames
    const sideFlameGeo = new THREE.ConeGeometry(0.24, 1.6, 12);
    sideFlameGeo.rotateX(-Math.PI / 2);
    sideFlameGeo.translate(0, 0, -0.8);

    const rightFlame = new THREE.Mesh(sideFlameGeo, this.flameMat);
    rightFlame.position.set(0.9, 0.06, -2.15);
    this.mesh.add(rightFlame);
    this.engineFlames.push(rightFlame);

    const leftFlame = new THREE.Mesh(sideFlameGeo, this.flameMat);
    leftFlame.position.set(-0.9, 0.06, -2.15);
    this.mesh.add(leftFlame);
    this.engineFlames.push(leftFlame);

    // Lateral Lights
    const rightSideLight = new THREE.PointLight(flameColor, 2.0, 5);
    rightSideLight.position.set(0.9, 0.06, -2.6);
    this.mesh.add(rightSideLight);
    this.engineLights.push(rightSideLight);

    const leftSideLight = new THREE.PointLight(flameColor, 2.0, 5);
    leftSideLight.position.set(-0.9, 0.06, -2.6);
    this.mesh.add(leftSideLight);
    this.engineLights.push(leftSideLight);
  }

  /**
   * Called on every animation tick to pulse afterburners, flame flickering and engine lights
   */
  public update(deltaTime: number, isThrusting: boolean = true): void {
    if (isThrusting) {
      const flicker = 0.85 + Math.random() * 0.45;
      const pulseSide = 0.8 + Math.random() * 0.4;

      for (let i = 0; i < this.engineFlames.length; i++) {
        const flame = this.engineFlames[i];
        flame.visible = true;
        if (i === 0) {
          flame.scale.set(1, 1, flicker);
        } else {
          flame.scale.set(1, 1, pulseSide);
        }
      }

      for (let i = 0; i < this.engineLights.length; i++) {
        const light = this.engineLights[i];
        if (i === 0) {
          light.intensity = 2.8 + flicker * 1.8;
        } else {
          light.intensity = 1.6 + pulseSide * 1.2;
        }
      }
    } else {
      for (const flame of this.engineFlames) {
        flame.visible = false;
      }
      for (const light of this.engineLights) {
        light.intensity = 0;
      }
    }
  }

  /**
   * Applies custom hull colorways & liveries
   */
  public setSkin(skinId: string): void {
    switch (skinId) {
      case 'stealth':
        this.darkArmorMat.color.setHex(0x0a0f1d);
        this.midArmorMat.color.setHex(0x141e33);
        this.lightArmorMat.color.setHex(0x94a3b8);
        this.cyanNeonMat.color.setHex(0x38bdf8);
        this.orangeGlowMat.color.setHex(0xf59e0b);
        this.flameMat.color.setHex(0x38bdf8);
        for (const light of this.engineLights) light.color.setHex(0x38bdf8);
        break;
      case 'solar':
        this.darkArmorMat.color.setHex(0x27170a);
        this.midArmorMat.color.setHex(0x451a03);
        this.lightArmorMat.color.setHex(0xffedd5);
        this.cyanNeonMat.color.setHex(0xfbbf24);
        this.orangeGlowMat.color.setHex(0xef4444);
        this.flameMat.color.setHex(0xf97316);
        for (const light of this.engineLights) light.color.setHex(0xf97316);
        break;
      case 'plasma':
        this.darkArmorMat.color.setHex(0x1e1035);
        this.midArmorMat.color.setHex(0x3b1d60);
        this.lightArmorMat.color.setHex(0xf3e8ff);
        this.cyanNeonMat.color.setHex(0xc084fc);
        this.orangeGlowMat.color.setHex(0xf43f5e);
        this.flameMat.color.setHex(0xa855f7);
        for (const light of this.engineLights) light.color.setHex(0xa855f7);
        break;
      case 'neon':
        this.darkArmorMat.color.setHex(0x022c22);
        this.midArmorMat.color.setHex(0x064e3b);
        this.lightArmorMat.color.setHex(0xd1fae5);
        this.cyanNeonMat.color.setHex(0x34d399);
        this.orangeGlowMat.color.setHex(0x38bdf8);
        this.flameMat.color.setHex(0x10b981);
        for (const light of this.engineLights) light.color.setHex(0x10b981);
        break;
      case 'crimson':
        this.darkArmorMat.color.setHex(0x450a0a);
        this.midArmorMat.color.setHex(0x7f1d1d);
        this.lightArmorMat.color.setHex(0xfee2e2);
        this.cyanNeonMat.color.setHex(0xf87171);
        this.orangeGlowMat.color.setHex(0xfbbf24);
        this.flameMat.color.setHex(0xef4444);
        for (const light of this.engineLights) light.color.setHex(0xef4444);
        break;
      case 'titanium':
      default:
        this.darkArmorMat.color.setHex(0x0f172a);
        this.midArmorMat.color.setHex(0x1e293b);
        this.lightArmorMat.color.setHex(0xf1f5f9);
        this.cyanNeonMat.color.setHex(0x00f0ff);
        this.orangeGlowMat.color.setHex(0xf97316);
        this.flameMat.color.setHex(0x38bdf8);
        for (const light of this.engineLights) light.color.setHex(0x38bdf8);
        break;
    }
  }
}
