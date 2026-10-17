import { CloneWarsHangar3D } from '../hangar/CloneWarsHangar3D';

/** Creates the active 3D hangar scene. */
export class HangarFactory {
  public static createCloneWarsHangar(): CloneWarsHangar3D {
    return new CloneWarsHangar3D();
  }

  public static createHangar(): CloneWarsHangar3D {
    return this.createCloneWarsHangar();
  }
}
