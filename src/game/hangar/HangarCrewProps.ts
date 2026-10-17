import * as THREE from 'three';
import { HangarPropGroup } from './HangarPropGroup';

/** Creates a cohesive group of hangar props using the shared resource tracker and animation targets. */
export class HangarCrewProps extends HangarPropGroup {
  public createCloakedOfficer(pos: THREE.Vector3): THREE.Group {
    const figure = new THREE.Group();
    figure.position.copy(pos);

    // Flowing cloak cone
    const cloakGeo = this.tracker.trackGeometry(new THREE.ConeGeometry(0.5, 1.7, 10));
    const cloak = new THREE.Mesh(cloakGeo, this.materials.cloak);
    cloak.position.y = 0.85;
    figure.add(cloak);

    // Hood / head
    const headGeo = this.tracker.trackGeometry(new THREE.SphereGeometry(0.22, 12, 10));
    const head = new THREE.Mesh(headGeo, this.materials.cloak);
    head.position.y = 1.75;
    figure.add(head);

    this.targets.deckCrewOfficers.push({ group: figure, head, seed: Math.random() * 50 });

    return figure;
  }


  public createDeckCrewTechnician(pos: THREE.Vector3): THREE.Group {
    const tech = new THREE.Group();
    tech.position.copy(pos);

    const bodyGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(0.22, 0.18, 0.9, 8));
    const body = new THREE.Mesh(bodyGeo, this.materials.archSteel);
    body.position.y = 0.9;
    tech.add(body);

    const helmetGeo = this.tracker.trackGeometry(new THREE.SphereGeometry(0.2, 10, 8));
    const helmet = new THREE.Mesh(helmetGeo, this.materials.archSteel);
    helmet.position.y = 1.5;
    tech.add(helmet);

    // Articulated diagnostic tool arm
    const armGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6));
    const arm = new THREE.Mesh(armGeo, this.materials.archSteel);
    arm.position.set(0.28, 1.1, 0.15);
    arm.rotation.x = 0.6;
    tech.add(arm);

    this.targets.deckCrewTechs.push({ group: tech, arm, seed: Math.random() * 50 });

    return tech;
  }

}
