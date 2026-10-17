import * as THREE from 'three';
import { createHangarMaterials, type HangarMaterials } from './HangarMaterials';
import { HangarPropFactory } from './HangarPropFactory';
import type { HangarResourceTracker } from './HangarResourceTracker';
import { createAnimationTargets, type HangarAnimationTargets, type HangarDimensions, type HangarScene } from './HangarTypes';

/** Assembles the static hangar scene graph (architecture, props, lighting); contains no runtime animation logic. */
export class HangarSceneBuilder {
  private readonly mesh = new THREE.Group();
  private readonly landingPad = new THREE.Group();
  private readonly targets: HangarAnimationTargets = createAnimationTargets();
  private readonly materials: HangarMaterials;
  private readonly props: HangarPropFactory;

  constructor(
    private readonly tracker: HangarResourceTracker,
    private readonly dimensions: HangarDimensions
  ) {
    this.materials = createHangarMaterials(tracker);
    this.props = new HangarPropFactory(tracker, this.materials, this.targets, dimensions);
  }

  public build(): HangarScene {
    this.buildArchitecture();
    this.buildSaucerChandelier();
    this.buildLandingPad();
    this.buildDockingBays();
    this.buildParticleSystems();
    this.buildExitForceField();
    this.buildLighting();
    this.configureShadows();

    return { mesh: this.mesh, landingPad: this.landingPad, targets: this.targets };
  }

  private buildArchitecture(): void {
    const { radius, height, runwayLength } = this.dimensions;

    // 2. Base Floor Deck Plate
    const floorGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(radius, radius, 0.8, 64));
    const floor = new THREE.Mesh(floorGeo, this.materials.deck);
    floor.position.y = -0.4;
    floor.receiveShadow = true;
    this.mesh.add(floor);

    // 3. Central Illuminated Runway
    const runwayGeo = this.tracker.trackGeometry(new THREE.BoxGeometry(11, 0.08, runwayLength));
    const runway = new THREE.Mesh(runwayGeo, this.materials.runway);
    runway.position.set(0, 0.04, 2);
    runway.receiveShadow = true;
    this.mesh.add(runway);

    // Runway Stanchions with Glowing Beacons
    const stanchionPoleGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(0.08, 0.1, 0.45, 8));
    const stanchionBulbGeo = this.tracker.trackGeometry(new THREE.SphereGeometry(0.14, 12, 8));
    for (let z = -18; z <= 22; z += 5) {
      [-5.8, 5.8].forEach((xPos) => {
        const pole = new THREE.Mesh(stanchionPoleGeo, this.materials.archSteel);
        pole.position.set(xPos, 0.225, z);
        this.mesh.add(pole);

        const bulb = new THREE.Mesh(stanchionBulbGeo, this.materials.amberBeacon);
        bulb.position.set(xPos, 0.48, z);
        this.mesh.add(bulb);
        this.targets.beaconLights.push(bulb);
      });
    }

    // 4. Vaulted Perimeter Walls & Dome
    const wallGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(radius, radius, height, 48, 1, true));
    const wall = new THREE.Mesh(wallGeo, this.materials.wall);
    wall.position.y = height / 2;
    this.mesh.add(wall);

    const domeRoofGeo = this.tracker.trackGeometry(
      new THREE.SphereGeometry(radius, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.7)
    );
    const domeRoof = new THREE.Mesh(domeRoofGeo, this.materials.darkSteel);
    domeRoof.position.y = 4.5;
    domeRoof.scale.set(1.0, 0.46, 1.0);
    this.mesh.add(domeRoof);

    // 5. Heavy Radial Arch Ribs (Cathedral Vaulting)
    const numRibs = 12;
    const ribGeo = this.tracker.trackGeometry(new THREE.BoxGeometry(0.9, 1.2, radius * 0.92));
    for (let i = 0; i < numRibs; i++) {
      const angle = (i / numRibs) * Math.PI * 2;
      const rib = new THREE.Mesh(ribGeo, this.materials.archSteel);
      rib.position.set(
        Math.sin(angle) * (radius * 0.46),
        height - 1.5,
        Math.cos(angle) * (radius * 0.46)
      );
      rib.rotation.y = angle;
      rib.rotation.x = 0.12;
      this.mesh.add(rib);

      // Fluorescent cyan neon strip along rib undersides
      const neonGeo = this.tracker.trackGeometry(new THREE.BoxGeometry(0.12, 0.08, radius * 0.8));
      const neon = new THREE.Mesh(neonGeo, this.materials.cyanGlow);
      neon.position.set(
        Math.sin(angle) * (radius * 0.44),
        height - 2.1,
        Math.cos(angle) * (radius * 0.44)
      );
      neon.rotation.y = angle;
      neon.rotation.x = 0.12;
      this.mesh.add(neon);
    }
  }

  private buildSaucerChandelier(): void {
    const { height } = this.dimensions;
    const saucerGroup = new THREE.Group();
    saucerGroup.position.set(0, height - 3.4, 0);

    // Tiered main body
    const saucerGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(7.0, 5.0, 1.6, 40));
    const saucerMesh = new THREE.Mesh(saucerGeo, this.materials.archSteel);
    saucerGroup.add(saucerMesh);

    // Top flange rim
    const topRimGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(8.2, 7.0, 0.4, 40));
    const topRim = new THREE.Mesh(topRimGeo, this.materials.darkSteel);
    topRim.position.y = 0.9;
    saucerGroup.add(topRim);

    // Suspended maintenance catwalk railing around chandelier
    const railGeo = this.tracker.trackGeometry(new THREE.TorusGeometry(7.6, 0.06, 8, 36));
    railGeo.rotateX(Math.PI / 2);
    const rail = new THREE.Mesh(railGeo, this.materials.archSteel);
    rail.position.y = 1.3;
    saucerGroup.add(rail);

    // Recessed downward core
    const coreGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(4.2, 3.4, 0.8, 32));
    const core = new THREE.Mesh(coreGeo, this.materials.darkSteel);
    core.position.y = -1.0;
    saucerGroup.add(core);

    // Amber perimeter beacons
    const bulbGeo = this.tracker.trackGeometry(new THREE.SphereGeometry(0.2, 12, 8));
    for (let j = 0; j < 16; j++) {
      const a = (j / 16) * Math.PI * 2;
      const b = new THREE.Mesh(bulbGeo, this.materials.amberBeacon);
      b.position.set(Math.sin(a) * 7.2, 0.2, Math.cos(a) * 7.2);
      saucerGroup.add(b);
      this.targets.beaconLights.push(b);
    }

    // Heavy suspension cables connecting to dome
    const cableGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(0.12, 0.12, 4.8, 8));
    for (let k = 0; k < 4; k++) {
      const ca = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const cable = new THREE.Mesh(cableGeo, this.materials.darkSteel);
      cable.position.set(Math.sin(ca) * 4.2, 2.8, Math.cos(ca) * 4.2);
      saucerGroup.add(cable);
    }

    // Clean architectural chandelier base without artificial volumetric cones
    this.mesh.add(saucerGroup);
  }

  private buildLandingPad(): void {
    // Octagonal tiered pad base
    const padBaseGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(5.2, 5.6, 0.45, 8));
    const padBase = new THREE.Mesh(padBaseGeo, this.materials.archSteel);
    padBase.position.y = 0.225;
    padBase.receiveShadow = true;
    this.landingPad.add(padBase);

    // Clean dark titanium beveled border ring (no yellow hazard stripes)
    const hazardRingGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(5.4, 5.55, 0.15, 8));
    const hazardRing = new THREE.Mesh(hazardRingGeo, this.materials.archSteel);
    hazardRing.position.y = 0.38;
    this.landingPad.add(hazardRing);

    // 4 Heavy Hydraulic Riser Pistons underneath
    const pistonShaftGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12));
    const pistonBracketGeo = this.tracker.trackGeometry(new THREE.BoxGeometry(0.6, 0.2, 0.6));
    for (let p = 0; p < 4; p++) {
      const pa = (p / 4) * Math.PI * 2;
      const px = Math.sin(pa) * 4.2;
      const pz = Math.cos(pa) * 4.2;

      const piston = new THREE.Mesh(pistonShaftGeo, this.materials.chrome);
      piston.position.set(px, 0.15, pz);
      this.landingPad.add(piston);

      const bracket = new THREE.Mesh(pistonBracketGeo, this.materials.archSteel);
      bracket.position.set(px, 0.05, pz);
      this.landingPad.add(bracket);
    }

    // 4 Articulated Magnetic Clamps around perimeter
    const clampArmGeo = this.tracker.trackGeometry(new THREE.BoxGeometry(0.4, 0.6, 0.8));
    for (let c = 0; c < 4; c++) {
      const ca = (c / 4) * Math.PI * 2 + Math.PI / 4;
      const clamp = new THREE.Mesh(clampArmGeo, this.materials.archSteel);
      clamp.position.set(Math.sin(ca) * 5.0, 0.45, Math.cos(ca) * 5.0);
      clamp.rotation.y = ca;
      this.landingPad.add(clamp);

      // Cyan clamp status beacon (replaces distracting amber)
      const cBeacon = new THREE.Mesh(this.tracker.trackGeometry(new THREE.SphereGeometry(0.1, 8, 8)), this.materials.cyanGlow);
      cBeacon.position.set(Math.sin(ca) * 5.1, 0.8, Math.cos(ca) * 5.1);
      this.landingPad.add(cBeacon);
      this.targets.beaconLights.push(cBeacon);
    }

    // Glowing Concentric Cyan Magnetic Levitation Rings
    const ring1Geo = this.tracker.trackGeometry(new THREE.RingGeometry(4.2, 4.45, 36));
    ring1Geo.rotateX(-Math.PI / 2);
    const ring1 = new THREE.Mesh(ring1Geo, this.materials.cyanGlow);
    ring1.position.y = 0.46;
    this.landingPad.add(ring1);

    const ring2Geo = this.tracker.trackGeometry(new THREE.RingGeometry(2.4, 2.65, 36));
    ring2Geo.rotateX(-Math.PI / 2);
    const ring2 = new THREE.Mesh(ring2Geo, this.materials.cyanGlow);
    ring2.position.y = 0.46;
    this.landingPad.add(ring2);

    // Clean center landing surface without yellow cross lines
    this.mesh.add(this.landingPad);
  }

  private buildDockingBays(): void {
    // Port and starboard Republic gunships
    const portGunship = this.props.createGunship();
    portGunship.position.set(-15.5, 0.0, -3.5);
    portGunship.rotation.y = Math.PI * 0.32;
    this.mesh.add(portGunship);

    const stbGunship = this.props.createGunship();
    stbGunship.position.set(16.0, 0.0, 5.5);
    stbGunship.rotation.y = -Math.PI * 0.62;
    this.mesh.add(stbGunship);

    // Curved docking bay balustrades
    const rail1 = this.props.createCurvedGantry(12, 5.0);
    rail1.position.set(15.0, 0, 5.0);
    rail1.rotation.y = -Math.PI * 0.5;
    this.mesh.add(rail1);

    const rail2 = this.props.createCurvedGantry(12, 5.0);
    rail2.position.set(-15.0, 0, -3.0);
    rail2.rotation.y = Math.PI * 0.4;
    this.mesh.add(rail2);

    // Astromech droid near the starboard bay
    const astromech = this.props.createAstromechDroid();
    astromech.position.set(8.5, 0, 7.5);
    this.mesh.add(astromech);
    this.targets.astromechHead = astromech;

    // Tactical hologram table in the command alcove
    const holoTable = this.props.createHoloTable();
    holoTable.position.set(-9.5, 0, 9.0);
    this.mesh.add(holoTable);
    this.targets.holoPlanet = holoTable;

    // Staged military cargo clusters
    this.mesh.add(this.props.createCargoCluster(new THREE.Vector3(-11.5, 0, -9.5)));
    this.mesh.add(this.props.createCargoCluster(new THREE.Vector3(12.0, 0, 11.5)));

    // Cloaked officers and technicians
    this.mesh.add(this.props.createCloakedOfficer(new THREE.Vector3(-2.2, 0, 8.2)));
    this.mesh.add(this.props.createCloakedOfficer(new THREE.Vector3(1.6, 0, 9.8)));
    this.mesh.add(this.props.createDeckCrewTechnician(new THREE.Vector3(-12.0, 0, -2.0)));
    this.mesh.add(this.props.createDeckCrewTechnician(new THREE.Vector3(12.5, 0, 3.0)));

    // Repulsorlift service drones patrolling the hangar
    this.mesh.add(this.props.createServiceDrone(new THREE.Vector3(-8.0, 3.2, -6.0), 2.2, 0.45));
    this.mesh.add(this.props.createServiceDrone(new THREE.Vector3(9.5, 2.8, 4.0), 3.0, -0.38));
    this.mesh.add(this.props.createServiceDrone(new THREE.Vector3(0.0, 4.0, 15.0), 2.4, 0.55));
  }

  private buildParticleSystems(): void {
    const sparks = this.props.createSparkSystem();
    this.targets.sparks = sparks;
    this.mesh.add(sparks.points);

    const dust = this.props.createDustMotes();
    this.targets.dust = dust;
    this.mesh.add(dust);
  }

  private buildExitForceField(): void {
    const forceField = this.props.createExitForceField();
    this.targets.forceField = forceField;
    this.mesh.add(forceField);
  }

  private buildLighting(): void {
    // Soft architectural ambient fill inside the hangar bay
    this.mesh.add(new THREE.AmbientLight(0x1e293b, 0.5));

    // Subtle side fill to illuminate wall details without overpowering the ship's key light
    const fillLight = new THREE.DirectionalLight(0x334155, 1.2);
    fillLight.position.set(-16, 12, -12);
    this.mesh.add(fillLight);
  }

  private configureShadows(): void {
    this.mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.receiveShadow = true;
        // Only solid physical meshes cast shadows; skip volumetric beams and forcefields
        if (obj !== this.targets.forceField && !(obj.material instanceof THREE.MeshBasicMaterial)) {
          obj.castShadow = true;
        }
      }
    });

    this.landingPad.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.receiveShadow = true;
        if (!(obj.material instanceof THREE.MeshBasicMaterial)) {
          obj.castShadow = true;
        }
      }
    });
  }
}
