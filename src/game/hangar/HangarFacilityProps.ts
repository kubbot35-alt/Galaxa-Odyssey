import * as THREE from 'three';
import { HangarPropGroup } from './HangarPropGroup';

/** Creates a cohesive group of hangar props using the shared resource tracker and animation targets. */
export class HangarFacilityProps extends HangarPropGroup {
  public createHoloTable(): THREE.Group {
    const table = new THREE.Group();

    // Circular base stand
    const standGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(1.2, 1.4, 0.9, 24));
    const stand = new THREE.Mesh(standGeo, this.materials.archSteel);
    stand.position.y = 0.45;
    table.add(stand);

    // Hologram projector emitter ring
    const emitterGeo = this.tracker.trackGeometry(new THREE.TorusGeometry(0.9, 0.08, 8, 24));
    emitterGeo.rotateX(Math.PI / 2);
    const emitter = new THREE.Mesh(emitterGeo, this.materials.cyanGlow);
    emitter.position.y = 0.92;
    table.add(emitter);

    // Rotating 3D Wireframe Planet Hologram
    const holoGeo = this.tracker.trackGeometry(new THREE.IcosahedronGeometry(0.8, 2));
    const holoMat = this.tracker.trackMaterial(
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
    const beamGeo = this.tracker.trackGeometry(new THREE.ConeGeometry(0.9, 1.2, 16, 1, true));
    const beamMat = this.tracker.trackMaterial(
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


  public createCurvedGantry(segments: number, radius: number): THREE.Group {
    const group = new THREE.Group();
    const postGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8));
    const railGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8));
    railGeo.rotateZ(Math.PI / 2);

    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * (Math.PI * 0.7);
      const post = new THREE.Mesh(postGeo, this.materials.archSteel);
      post.position.set(Math.sin(a) * radius, 0.55, Math.cos(a) * radius);
      group.add(post);

      if (i < segments - 1) {
        const nextA = ((i + 1) / segments) * (Math.PI * 0.7);
        const midA = (a + nextA) / 2;
        const rail = new THREE.Mesh(railGeo, this.materials.archSteel);
        rail.position.set(Math.sin(midA) * radius, 1.05, Math.cos(midA) * radius);
        rail.rotation.y = midA + Math.PI / 2;
        group.add(rail);
      }
    }
    return group;
  }


  public createCargoCluster(pos: THREE.Vector3): THREE.Group {
    const cluster = new THREE.Group();
    cluster.position.copy(pos);

    const crate1Geo = this.tracker.trackGeometry(new THREE.BoxGeometry(1.8, 1.4, 2.2));
    const crate1 = new THREE.Mesh(crate1Geo, this.materials.darkSteel);
    crate1.position.set(0, 0.7, 0);
    cluster.add(crate1);

    const crate2Geo = this.tracker.trackGeometry(new THREE.BoxGeometry(1.4, 1.2, 1.4));
    const crate2 = new THREE.Mesh(crate2Geo, this.materials.archSteel);
    crate2.position.set(1.4, 0.6, 0.3);
    crate2.rotation.y = 0.25;
    cluster.add(crate2);

    const crate3 = new THREE.Mesh(crate2Geo, this.materials.darkSteel);
    crate3.position.set(-0.2, 1.9, 0.1);
    crate3.rotation.y = -0.15;
    cluster.add(crate3);

    // Glowing status panel
    const led = new THREE.Mesh(this.tracker.trackGeometry(new THREE.BoxGeometry(0.1, 0.2, 0.4)), this.materials.amberBeacon);
    led.position.set(0.92, 0.8, 0);
    cluster.add(led);
    this.targets.beaconLights.push(led);

    return cluster;
  }

}
