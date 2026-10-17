import type { HangarMaterials } from './HangarMaterials';
import type { HangarResourceTracker } from './HangarResourceTracker';
import type { HangarAnimationTargets } from './HangarTypes';

/** Shared dependencies of every prop group: resource tracking, materials and runtime animation targets. */
export abstract class HangarPropGroup {
  constructor(
    protected readonly tracker: HangarResourceTracker,
    protected readonly materials: HangarMaterials,
    protected readonly targets: HangarAnimationTargets
  ) {}
}
