import * as THREE from 'three';
import { HangarPropGroup } from './HangarPropGroup';

/** Creates a cohesive group of hangar props using the shared resource tracker and animation targets. */
export class HangarVehicleProps extends HangarPropGroup {
  public createGunship(): THREE.Group {
    const ship = new THREE.Group();

    // Main fuselage cabin
    const bodyGeo = this.tracker.trackGeometry(new THREE.BoxGeometry(3.8, 2.4, 8.2));
    const body = new THREE.Mesh(bodyGeo, this.materials.republicWhite);
    body.position.y = 1.7;
    ship.add(body);

    // Republic Maroon Side Doors with Clone Wars chevron stripes
    const doorGeo = this.tracker.trackGeometry(new THREE.BoxGeometry(0.35, 1.9, 4.6));
    const lDoor = new THREE.Mesh(doorGeo, this.materials.republicRed);
    lDoor.position.set(-1.95, 1.6, 0.3);
    ship.add(lDoor);

    const rDoor = lDoor.clone();
    rDoor.position.x = 1.95;
    ship.add(rDoor);

    // Forward dual cockpits
    const noseGeo = this.tracker.trackGeometry(new THREE.ConeGeometry(1.8, 3.6, 8));
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, this.materials.republicWhite);
    nose.position.set(0, 1.5, 5.4);
    ship.add(nose);

    // Dual Forward Ball Turrets with glass canopies
    const ballGeo = this.tracker.trackGeometry(new THREE.SphereGeometry(0.65, 16, 16));
    const ballMat = this.tracker.trackMaterial(
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
    const wingGeo = this.tracker.trackGeometry(new THREE.BoxGeometry(5.2, 0.3, 2.2));
    const lWing = new THREE.Mesh(wingGeo, this.materials.republicWhite);
    lWing.position.set(-4.0, 2.4, -0.6);
    lWing.rotation.z = -0.18;
    ship.add(lWing);

    const rWing = new THREE.Mesh(wingGeo, this.materials.republicWhite);
    rWing.position.set(4.0, 2.4, -0.6);
    rWing.rotation.z = 0.18;
    ship.add(rWing);

    // Wingtip Bubble Turrets / Pods
    const podGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(0.6, 0.6, 2.8, 12));
    podGeo.rotateX(Math.PI / 2);
    const lPod = new THREE.Mesh(podGeo, this.materials.darkSteel);
    lPod.position.set(-6.6, 2.7, -0.6);
    ship.add(lPod);

    const rPod = lPod.clone();
    rPod.position.x = 6.6;
    ship.add(rPod);

    // Wingtip Strobes
    const lStrobe = new THREE.Mesh(this.tracker.trackGeometry(new THREE.SphereGeometry(0.12, 8, 8)), this.materials.amberBeacon);
    lStrobe.position.set(-6.6, 2.7, 0.9);
    ship.add(lStrobe);
    this.targets.beaconLights.push(lStrobe);

    const rStrobe = lStrobe.clone();
    rStrobe.position.x = 6.6;
    ship.add(rStrobe);
    this.targets.beaconLights.push(rStrobe);

    // Heavy Landing Skids
    const skidGeo = this.tracker.trackGeometry(new THREE.BoxGeometry(0.3, 0.2, 7.0));
    const lSkid = new THREE.Mesh(skidGeo, this.materials.darkSteel);
    lSkid.position.set(-1.6, 0.1, 0.0);
    ship.add(lSkid);

    const rSkid = lSkid.clone();
    rSkid.position.x = 1.6;
    ship.add(rSkid);

    return ship;
  }

  public createAstromechDroid(): THREE.Group {
    const droid = new THREE.Group();

    // Cylindrical white torso
    const bodyGeo = this.tracker.trackGeometry(new THREE.CylinderGeometry(0.32, 0.32, 0.7, 16));
    const body = new THREE.Mesh(bodyGeo, this.materials.archSteel);
    body.position.y = 0.6;
    droid.add(body);

    // Rotating hemispherical dome head
    const domeGeo = this.tracker.trackGeometry(new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2));
    const headMat = this.tracker.trackMaterial(new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 }));
    const head = new THREE.Mesh(domeGeo, headMat);
    head.position.y = 0.95;
    droid.add(head);

    // Blinking eye sensor
    const eye = new THREE.Mesh(this.tracker.trackGeometry(new THREE.SphereGeometry(0.06, 8, 8)), this.materials.cyanGlow);
    eye.position.set(0, 1.05, 0.3);
    droid.add(eye);
    this.targets.beaconLights.push(eye);

    // Dual legs
    const legGeo = this.tracker.trackGeometry(new THREE.BoxGeometry(0.12, 0.75, 0.16));
    const lLeg = new THREE.Mesh(legGeo, this.materials.archSteel);
    lLeg.position.set(-0.38, 0.45, 0);
    droid.add(lLeg);

    const rLeg = lLeg.clone();
    rLeg.position.x = 0.38;
    droid.add(rLeg);

    return droid;
  }
}
