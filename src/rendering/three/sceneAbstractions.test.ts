import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { EntityViewSync } from './EntityViewSync';
import { TimedEffectPool, type TimedEffect } from './TimedEffectPool';
import { disposeObjectTree } from './DisposableScene';

describe('EntityViewSync', () => {
  const setup = () => {
    const parent = new THREE.Group();
    const onRemove = vi.fn();
    const create = vi.fn(() => new THREE.Group());
    const update = vi.fn((e: { x: number }, v: THREE.Group, scale: number) => {
      v.position.x = e.x * scale;
    });
    const sync = new EntityViewSync<{ x: number }, THREE.Group, number>(parent, { create, update, onRemove });
    return { parent, onRemove, create, update, sync };
  };

  it('creates once per entity, updates every frame and removes missing entities', () => {
    const { parent, onRemove, create, sync } = setup();
    const a = { x: 1 };
    const b = { x: 2 };

    sync.sync([a, b], 10);
    sync.sync([a, b], 10);
    expect(create).toHaveBeenCalledTimes(2);
    expect(parent.children).toHaveLength(2);
    expect(parent.children[1].position.x).toBe(20);

    sync.sync([b], 1);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove.mock.calls[0][0]).toBe(a);
    expect(parent.children).toHaveLength(1);
  });

  it('runs onRemove while the view is still attached', () => {
    const parent = new THREE.Group();
    let attached = false;
    const sync = new EntityViewSync<object, THREE.Group>(parent, {
      create: () => new THREE.Group(),
      update: () => {},
      onRemove: (_e, view) => { attached = view.parent === parent; },
    });
    const e = {};
    sync.sync([e], undefined);
    sync.sync([], undefined);
    expect(attached).toBe(true);
  });
});

describe('TimedEffectPool', () => {
  const makeEffect = (life: number): TimedEffect => ({
    mesh: new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()),
    life,
    maxLife: life,
  });

  it('animates, then frees expired effects (mesh removed, resources disposed)', () => {
    const parent = new THREE.Group();
    const pool = new TimedEffectPool<TimedEffect>(parent);
    const effect = makeEffect(0.3);
    const geoDispose = vi.spyOn(effect.mesh.geometry, 'dispose');
    const matDispose = vi.spyOn(effect.mesh.material as THREE.Material, 'dispose');
    parent.add(effect.mesh);
    pool.add(effect);

    const animate = vi.fn();
    pool.update(0.2, animate);
    expect(pool.size).toBe(1);
    pool.update(0.2, animate);
    expect(pool.size).toBe(0);
    expect(animate).toHaveBeenCalledTimes(2);
    expect(parent.children).toHaveLength(0);
    expect(geoDispose).toHaveBeenCalled();
    expect(matDispose).toHaveBeenCalled();
  });

  it('clear releases everything', () => {
    const parent = new THREE.Group();
    const pool = new TimedEffectPool<TimedEffect>(parent);
    const e = makeEffect(5);
    parent.add(e.mesh);
    pool.add(e);
    pool.clear();
    expect(pool.size).toBe(0);
    expect(parent.children).toHaveLength(0);
  });
});

describe('disposeObjectTree', () => {
  it('disposes geometries and single/array materials of nested meshes', () => {
    const root = new THREE.Group();
    const geo = new THREE.BoxGeometry();
    const m1 = new THREE.MeshBasicMaterial();
    const m2 = new THREE.MeshBasicMaterial();
    const g = vi.spyOn(geo, 'dispose');
    const d1 = vi.spyOn(m1, 'dispose');
    const d2 = vi.spyOn(m2, 'dispose');
    const inner = new THREE.Group();
    inner.add(new THREE.Mesh(geo, [m1, m2]));
    root.add(inner);

    disposeObjectTree(root);
    expect(g).toHaveBeenCalled();
    expect(d1).toHaveBeenCalled();
    expect(d2).toHaveBeenCalled();
  });
});
