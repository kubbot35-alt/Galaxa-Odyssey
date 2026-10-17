import { MutableRefObject, useCallback, useState } from 'react';
import { GameEngine } from '../../game/GameEngine';
import { useUiSound } from '../../platform/audio/useUiSound';
import type { ShipSkinId } from '../../config/visuals/hangarVisuals';
import { SpaceHangarScene } from '../../rendering/three/SpaceHangarScene';
import { shipSkinRepo } from '../../game/persistence/StorageService';

export function useShipSkin(
  engine: GameEngine,
  sceneRef: MutableRefObject<SpaceHangarScene | null>
) {
  const ui = useUiSound();
  const [activeSkin, setActiveSkin] = useState<ShipSkinId>(
    () => (shipSkinRepo.load() as ShipSkinId | null) || 'titanium'
  );

  const changeSkin = useCallback(
    (skinId: ShipSkinId) => {
      ui.click();
      setActiveSkin(skinId);
      shipSkinRepo.save(skinId);
      sceneRef.current?.setShipSkin(skinId);
      engine.unlockAchievement('skin_collector');
    },
    [engine, sceneRef]
  );

  return { activeSkin, changeSkin };
}
