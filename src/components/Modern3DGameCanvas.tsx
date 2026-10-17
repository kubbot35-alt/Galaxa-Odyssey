import React from 'react';
import type { GameEngine } from '../game/GameEngine';
import { SpaceCombatRadar } from './game/hud/SpaceCombatRadar';
import { SpaceCombatLockOnHUD } from './game/hud/SpaceCombatLockOnHUD';
import { GameState } from '../types/game';
import type { ShipSkinId } from '../config/visuals/hangarVisuals';
import { CockpitHUDOverlay } from './game/hud/CockpitHUDOverlay';
import { ShieldPanel } from './game/ShieldPanel';
import { WeaponCapacitorPanel } from './game/WeaponCapacitorPanel';
import { WeaponSelector } from './game/WeaponSelector';
import { WarpBanner } from './game/WarpBanner';
import { PauseOverlay } from './game/PauseOverlay';
import { GameOverOverlay } from './game/GameOverOverlay';
import { CombatTopBar } from './game/CombatTopBar';
import { CombatControlsBar } from './game/CombatControlsBar';
import { WeaponAnnouncementBanner } from './game/WeaponAnnouncementBanner';
import { PilotTwoBadge } from './game/PilotTwoBadge';
import { useModern3DGameCanvasController } from '../hooks/useModern3DGameCanvasController';
import { useAudioPort } from '../platform/audio/AudioPortContext';

interface Modern3DGameCanvasProps {
    engine: GameEngine;
    onStateUpdate: () => void;
    selectedSkin?: ShipSkinId;
    onReturnToHangar?: () => void;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
}

export const Modern3DGameCanvas: React.FC<Modern3DGameCanvasProps> = ({
    engine,
    onStateUpdate,
    selectedSkin = 'titanium',
    onReturnToHangar,
    isFullscreen = false,
    onToggleFullscreen,
}) => {
    const audio = useAudioPort();
    const {
        containerRef,
        viewMode,
        isWarpActive,
        showRadar,
        targetTelemetry,
        view,
        hudMetrics: { shieldPercent, shieldLagPercent, energyPercent, isTakingDamage },
        toggleViewMode,
        handleToggleRadar,
        handleSelectWeapon,
        handleManualWarpJump,
        returnToHangar,
        handleResume,
        handleRedeploy,
    } = useModern3DGameCanvasController({
        engine,
        onStateUpdate,
        selectedSkin,
        onReturnToHangar,
        onToggleFullscreen,
    });

    const isPlaying = view.gameState === GameState.PLAYING;

    return (
        <div
            className={`relative w-full h-full min-h-0 flex-1 overflow-hidden transition-all duration-150 bg-slate-950 select-none ${
                isTakingDamage
                    ? 'border-red-500/80 shadow-[0_0_60px_rgba(239,68,68,0.45)]'
                    : 'border-cyan-500/30'
            }`}
        >
            <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

            {viewMode === 'COCKPIT_3D' && isPlaying && (
                <CockpitHUDOverlay
                    shield={view.shield}
                    maxShield={view.maxShield}
                    energy={view.weaponEnergy}
                    maxEnergy={view.maxWeaponEnergy}
                    lives={view.lives}
                    weaponMode={view.weaponMode}
                    bankAngle={view.bankAngle}
                    isTakingDamage={isTakingDamage}
                    onToggleView={toggleViewMode}
                />
            )}

            {isPlaying && viewMode !== 'COCKPIT_3D' && (
                <SpaceCombatLockOnHUD
                    targets={targetTelemetry.targets}
                    primaryTarget={targetTelemetry.primaryTarget}
                    audio={audio}
                />
            )}

            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-mono">
                <div className="w-full flex items-start justify-between gap-4 pointer-events-auto">
                    <ShieldPanel
                        shieldPercent={shieldPercent}
                        shieldLagPercent={shieldLagPercent}
                        lives={view.lives}
                        isTakingDamage={isTakingDamage}
                        hitNotice={view.hitNotice}
                    />
                    <CombatTopBar
                        wave={view.wave}
                        viewMode={viewMode}
                        isWarpActive={isWarpActive}
                        onToggleView={toggleViewMode}
                        onWarpJump={handleManualWarpJump}
                    />
                    <WeaponCapacitorPanel energyPercent={energyPercent} score={view.score} credits={view.credits} />
                </div>

                {isWarpActive && <WarpBanner wave={view.wave} />}

                {view.weaponAnnouncement && !isWarpActive && (
                    <WeaponAnnouncementBanner announcement={view.weaponAnnouncement} />
                )}

                <div className="w-full flex items-end justify-between gap-4 pointer-events-auto">
                    <div className="flex flex-col items-start gap-1.5">
                        {showRadar && (
                            <div className="animate-in fade-in zoom-in-95 duration-150">
                                <SpaceCombatRadar
                                    targets={targetTelemetry.targets}
                                    primaryTarget={targetTelemetry.primaryTarget}
                                    wave={view.wave}
                                />
                            </div>
                        )}
                        <CombatControlsBar
                            viewMode={viewMode}
                            showRadar={showRadar}
                            isFullscreen={isFullscreen}
                            onToggleRadar={handleToggleRadar}
                            onToggleView={toggleViewMode}
                            onToggleFullscreen={onToggleFullscreen}
                        />
                    </div>

                    <WeaponSelector
                        unlockedModes={view.unlockedWeaponModes}
                        activeMode={view.weaponMode}
                        onSelect={handleSelectWeapon}
                    />

                    {view.player2 && <PilotTwoBadge lives={view.player2.lives} />}
                </div>
            </div>

            {view.gameState === GameState.PAUSED && (
                <PauseOverlay
                    wave={view.wave}
                    onResume={handleResume}
                    onToggleView={toggleViewMode}
                    onAbort={returnToHangar}
                />
            )}

            {view.gameState === GameState.GAMEOVER && (
                <GameOverOverlay
                    wave={view.wave}
                    score={view.score}
                    credits={view.credits}
                    onRedeploy={handleRedeploy}
                    onReturn={returnToHangar}
                />
            )}
        </div>
    );
};
