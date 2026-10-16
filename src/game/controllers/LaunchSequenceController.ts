import * as THREE from 'three';
import { Hangar3D } from '../hangar/Hangar3D';
import { CloneWarsHangar3D } from '../hangar/CloneWarsHangar3D';

export interface IHangarSceneEntity {
  getMesh(): THREE.Group;
  getLandingPad(): THREE.Group;
  getExitGateZ(): number;
  setGateOpen(isOpen: boolean): void;
  alignPadToForward(deltaTime: number, speed?: number): boolean;
  resetPadRotation(): void;
  update(deltaTime: number, rotatePad?: boolean): void;
  dispose(): void;
  isGateCleared?(): boolean;
}

export enum LaunchPhase {
  IDLE = 'IDLE',
  ALIGNING = 'ALIGNING',
  ENGINES_IGNITING = 'ENGINES_IGNITING',
  DISENGAGING_FORCEFIELD = 'DISENGAGING_FORCEFIELD',
  ACCELERATING_RUNWAY = 'ACCELERATING_RUNWAY',
  EXITING_GATE = 'EXITING_GATE',
  HYPERSPACE_BURST = 'HYPERSPACE_BURST',
  COMPLETED = 'COMPLETED',
}

export interface LaunchTelemetry {
  phase: LaunchPhase;
  phaseLabel: string;
  progress: number; // 0 to 1
  speedKmH: number;
  shipZ: number;
  shipY: number;
  forceFieldOpacity: number;
  isLaunching: boolean;
}

/**
 * LaunchSequenceController - SRP: Coordinates the cinematic launch from Hangar to Deep Space.
 */
export class LaunchSequenceController {
  private phase: LaunchPhase = LaunchPhase.IDLE;
  private phaseTimer: number = 0;
  private totalProgress: number = 0;
  private shipPosition: THREE.Vector3 = new THREE.Vector3(0, 1.18, 0);
  private shipVelocity: number = 0;
  private onCompleteCallback: (() => void) | null = null;

  // Sound triggers
  private onEngineIgnite?: () => void;
  private onWarpBurst?: () => void;

  constructor(
    private readonly hangar: IHangarSceneEntity,
    private readonly shipGroup: THREE.Group,
    callbacks?: {
      onEngineIgnite?: () => void;
      onWarpBurst?: () => void;
    }
  ) {
    if (callbacks) {
      this.onEngineIgnite = callbacks.onEngineIgnite;
      this.onWarpBurst = callbacks.onWarpBurst;
    }
  }

  public startLaunch(onComplete?: () => void): void {
    if (this.phase !== LaunchPhase.IDLE) return;
    this.phase = LaunchPhase.ALIGNING;
    this.phaseTimer = 0;
    this.totalProgress = 0;
    this.shipVelocity = 0;
    this.onCompleteCallback = onComplete || null;
  }

  public cancelLaunch(): void {
    this.phase = LaunchPhase.IDLE;
    this.phaseTimer = 0;
    this.totalProgress = 0;
    this.shipVelocity = 0;
    this.shipPosition.set(0, 1.18, 0);
    this.shipGroup.position.copy(this.shipPosition);
    this.hangar.setGateOpen(false);
  }

  public update(deltaTime: number): LaunchTelemetry {
    this.phaseTimer += deltaTime;

    switch (this.phase) {
      case LaunchPhase.IDLE: {
        // Normal slow pad rotation handled by Hangar3D
        this.hangar.update(deltaTime, true);
        this.shipPosition.set(0, 1.18, 0);
        this.shipGroup.position.copy(this.shipPosition);
        break;
      }

      case LaunchPhase.ALIGNING: {
        // Stop random rotation and align landing pad to 0 rad (straight forward down runway)
        this.hangar.update(deltaTime, false);
        const aligned = this.hangar.alignPadToForward(deltaTime, 3.5);
        this.totalProgress = Math.min(0.2, this.phaseTimer * 0.15);

        if (aligned || this.phaseTimer > 1.2) {
          this.hangar.resetPadRotation();
          this.phase = LaunchPhase.ENGINES_IGNITING;
          this.phaseTimer = 0;
          if (this.onEngineIgnite) this.onEngineIgnite();
        }
        break;
      }

      case LaunchPhase.ENGINES_IGNITING: {
        this.hangar.update(deltaTime, false);
        this.totalProgress = 0.2 + (this.phaseTimer / 0.8) * 0.15;

        // Subtle pre-launch vertical hover rise & micro-vibration
        const hoverY = 1.18 + Math.sin(this.phaseTimer * 14) * 0.04 + (this.phaseTimer / 0.8) * 0.35;
        this.shipPosition.y = hoverY;
        this.shipGroup.position.copy(this.shipPosition);

        if (this.phaseTimer >= 0.8) {
          this.phase = LaunchPhase.DISENGAGING_FORCEFIELD;
          this.phaseTimer = 0;
          this.hangar.setGateOpen(true);
        }
        break;
      }

      case LaunchPhase.DISENGAGING_FORCEFIELD: {
        this.hangar.update(deltaTime, false);
        this.totalProgress = 0.35 + (this.phaseTimer / 0.6) * 0.15;

        // Slight forward creep
        this.shipVelocity = 2.5;
        this.shipPosition.z += this.shipVelocity * deltaTime;
        this.shipGroup.position.copy(this.shipPosition);

        if (this.phaseTimer >= 0.6) {
          this.phase = LaunchPhase.ACCELERATING_RUNWAY;
          this.phaseTimer = 0;
        }
        break;
      }

      case LaunchPhase.ACCELERATING_RUNWAY: {
        this.hangar.update(deltaTime, false);

        // Exponential thrust acceleration down the hangar runway
        this.shipVelocity += 35.0 * deltaTime;
        this.shipPosition.z += this.shipVelocity * deltaTime;
        this.totalProgress = 0.5 + Math.min(0.35, (this.shipPosition.z / this.hangar.getExitGateZ()) * 0.35);
        this.shipGroup.position.copy(this.shipPosition);

        const gateZ = this.hangar.getExitGateZ();
        if (this.shipPosition.z >= gateZ - 0.5) {
          this.phase = LaunchPhase.EXITING_GATE;
          this.phaseTimer = 0;
        }
        break;
      }

      case LaunchPhase.EXITING_GATE: {
        this.hangar.update(deltaTime, false);

        this.shipVelocity += 55.0 * deltaTime;
        this.shipPosition.z += this.shipVelocity * deltaTime;
        this.shipGroup.position.copy(this.shipPosition);
        this.totalProgress = 0.85 + Math.min(0.1, this.phaseTimer * 0.2);

        if (this.phaseTimer >= 0.5) {
          this.phase = LaunchPhase.HYPERSPACE_BURST;
          this.phaseTimer = 0;
          if (this.onWarpBurst) this.onWarpBurst();
        }
        break;
      }

      case LaunchPhase.HYPERSPACE_BURST: {
        this.shipVelocity += 80.0 * deltaTime;
        this.shipPosition.z += this.shipVelocity * deltaTime;
        this.shipGroup.position.copy(this.shipPosition);
        this.totalProgress = 0.95 + Math.min(0.05, this.phaseTimer * 0.1);

        if (this.phaseTimer >= 0.6) {
          this.phase = LaunchPhase.COMPLETED;
          if (this.onCompleteCallback) {
            this.onCompleteCallback();
          }
        }
        break;
      }

      case LaunchPhase.COMPLETED: {
        this.totalProgress = 1.0;
        break;
      }
    }

    return this.getTelemetry();
  }

  public getTelemetry(): LaunchTelemetry {
    const isLaunching = this.phase !== LaunchPhase.IDLE && this.phase !== LaunchPhase.COMPLETED;
    const speedKmH = Math.round(this.shipVelocity * 140);

    let phaseLabel = 'SYSTEM STATUS: IDLE';
    switch (this.phase) {
      case LaunchPhase.ALIGNING:
        phaseLabel = 'ALINIOWANIE PLATFORMY DO DROGI STARTOWEJ';
        break;
      case LaunchPhase.ENGINES_IGNITING:
        phaseLabel = 'ZAPŁON SILNIKÓW JONOWYCH • CIĄG NOMINALNY';
        break;
      case LaunchPhase.DISENGAGING_FORCEFIELD:
        phaseLabel = 'OTWARCIE POLA SIŁOWEGO BRAMY WYLOTOWEJ';
        break;
      case LaunchPhase.ACCELERATING_RUNWAY:
        phaseLabel = 'PRZYSPIESZENIE WZDŁUŻ PASA HANGARU';
        break;
      case LaunchPhase.EXITING_GATE:
        phaseLabel = 'PRZEBICIE BRAMY • WYJŚCIE W PRZESTRZEŃ';
        break;
      case LaunchPhase.HYPERSPACE_BURST:
        phaseLabel = 'IMPULS HIPERPRZESTRZENNY • INICJACJA MISJI';
        break;
      case LaunchPhase.COMPLETED:
        phaseLabel = 'STATUS BOJOWY AKTYWNY';
        break;
    }

    return {
      phase: this.phase,
      phaseLabel,
      progress: Math.min(1.0, Math.max(0.0, this.totalProgress)),
      speedKmH,
      shipZ: this.shipPosition.z,
      shipY: this.shipPosition.y,
      forceFieldOpacity: (this.hangar.isGateCleared && this.hangar.isGateCleared()) ? 0.05 : 0.18,
      isLaunching,
    };
  }

  public get isLaunching(): boolean {
    return this.phase !== LaunchPhase.IDLE && this.phase !== LaunchPhase.COMPLETED;
  }

  public get isCompleted(): boolean {
    return this.phase === LaunchPhase.COMPLETED;
  }
}
