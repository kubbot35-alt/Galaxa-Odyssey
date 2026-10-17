import type * as THREE from 'three';
import type { IEntityRenderer } from './IEntityRenderer';

export interface EntityViewAdapter<TEntity, TView extends THREE.Object3D, TFrame> {
  create(entity: TEntity): TView;
  update(entity: TEntity, view: TView, frame: TFrame): void;
  /** Runs while the view is still attached, right before it is removed. */
  onRemove?(entity: TEntity, view: TView): void;
}

/** Generic create / update / remove reconciliation of entity views, keyed by entity identity. */
export class EntityViewSync<TEntity, TView extends THREE.Object3D, TFrame = void>
  implements IEntityRenderer<TEntity, TFrame>
{
  private readonly views = new Map<TEntity, TView>();

  constructor(
    private readonly parent: THREE.Object3D,
    private readonly adapter: EntityViewAdapter<TEntity, TView, TFrame>
  ) {}

  public sync(entities: readonly TEntity[], frame: TFrame): void {
    const active = new Set(entities);
    for (const [entity, view] of this.views) {
      if (active.has(entity)) continue;
      this.adapter.onRemove?.(entity, view);
      this.parent.remove(view);
      this.views.delete(entity);
    }

    for (const entity of entities) {
      let view = this.views.get(entity);
      if (!view) {
        view = this.adapter.create(entity);
        this.parent.add(view);
        this.views.set(entity, view);
      }
      this.adapter.update(entity, view, frame);
    }
  }

  public dispose(): void {
    this.views.clear();
  }
}
