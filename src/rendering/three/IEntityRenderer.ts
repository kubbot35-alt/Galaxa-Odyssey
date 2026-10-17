/** Keeps a set of 3D views in sync with simulation entities each frame. */
export interface IEntityRenderer<TEntity, TFrame = void> {
  sync(entities: readonly TEntity[], frame: TFrame): void;
  /** Forgets all views. GPU resources are released with the owning scene graph. */
  dispose(): void;
}
