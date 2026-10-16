export class InputManager {
  // Touch / Virtual button states
  public p1Left = false;
  public p1Right = false;
  public p1Up = false;
  public p1Down = false;
  public p1Fire = false;

  public p2Left = false;
  public p2Right = false;
  public p2Up = false;
  public p2Down = false;
  public p2Fire = false;

  public isTwoPlayer = false;

  // Keyboard active states
  private keys: Record<string, boolean> = {};

  // Event callbacks
  private onWeaponCycle?: (dir: 1 | -1) => void;
  private onWeaponSelect?: (modeIdx: number) => void;
  private onPauseToggle?: () => void;
  private onAchievementsToggle?: () => void;
  private onFireStart?: (pIdx: number) => void;
  private onFireEnd?: (pIdx: number) => void;

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
    this.keys[e.code] = true;

    // Weapon cycling
    if (e.key === 'q' || e.key === 'Q') {
      this.onWeaponCycle?.(-1);
    } else if (e.key === 'e' || e.key === 'E') {
      this.onWeaponCycle?.(1);
    }

    // Number keys for weapons
    if (e.key === '1') this.onWeaponSelect?.(0);
    if (e.key === '2') this.onWeaponSelect?.(1);
    if (e.key === '3') this.onWeaponSelect?.(2);
    if (e.key === '4') this.onWeaponSelect?.(3);

    // Pause
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      this.onPauseToggle?.();
    }

    // Achievements
    if (e.key === 'Tab') {
      e.preventDefault();
      this.onAchievementsToggle?.();
    }

    // Fire start
    if (e.code === 'Space') {
      this.onFireStart?.(1);
    }
    if (e.code === 'Numpad0' || e.code === 'Enter') {
      this.onFireStart?.(2);
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
    this.keys[e.code] = false;

    if (e.code === 'Space') {
      this.onFireEnd?.(1);
    }
    if (e.code === 'Numpad0' || e.code === 'Enter') {
      this.onFireEnd?.(2);
    }
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }
  }

  public setOnWeaponCycle(cb: (dir: 1 | -1) => void) {
    this.onWeaponCycle = cb;
  }

  public setOnWeaponSelect(cb: (modeIdx: number) => void) {
    this.onWeaponSelect = cb;
  }

  public setOnPauseToggle(cb: () => void) {
    this.onPauseToggle = cb;
  }

  public setOnAchievementsToggle(cb: () => void) {
    this.onAchievementsToggle = cb;
  }

  public setOnFireStart(cb: (pIdx: number) => void) {
    this.onFireStart = cb;
  }

  public setOnFireEnd(cb: (pIdx: number) => void) {
    this.onFireEnd = cb;
  }

  public isP1MovingLeft(): boolean {
    return (
      this.p1Left ||
      this.keys['arrowleft'] ||
      this.keys['a'] ||
      this.keys['keya'] ||
      false
    );
  }

  public isP1MovingRight(): boolean {
    return (
      this.p1Right ||
      this.keys['arrowright'] ||
      this.keys['d'] ||
      this.keys['keyd'] ||
      false
    );
  }

  public isP1MovingUp(): boolean {
    return (
      this.p1Up ||
      this.keys['arrowup'] ||
      this.keys['w'] ||
      this.keys['keyw'] ||
      false
    );
  }

  public isP1MovingDown(): boolean {
    return (
      this.p1Down ||
      this.keys['arrowdown'] ||
      this.keys['s'] ||
      this.keys['keys'] ||
      false
    );
  }

  public isP1Firing(): boolean {
    return this.p1Fire || this.keys['space'] || this.keys[' '] || false;
  }

  public isP2MovingLeft(): boolean {
    return this.p2Left || this.keys['numpad4'] || this.keys['j'] || false;
  }

  public isP2MovingRight(): boolean {
    return this.p2Right || this.keys['numpad6'] || this.keys['l'] || false;
  }

  public isP2MovingUp(): boolean {
    return this.p2Up || this.keys['numpad8'] || this.keys['i'] || false;
  }

  public isP2MovingDown(): boolean {
    return this.p2Down || this.keys['numpad5'] || this.keys['numpad2'] || this.keys['k'] || false;
  }

  public isP2Firing(): boolean {
    return (
      this.p2Fire ||
      this.keys['numpad0'] ||
      this.keys['enter'] ||
      this.keys['semicolon'] ||
      false
    );
  }

  public reset() {
    this.p1Left = false;
    this.p1Right = false;
    this.p1Up = false;
    this.p1Down = false;
    this.p1Fire = false;
    this.p2Left = false;
    this.p2Right = false;
    this.p2Up = false;
    this.p2Down = false;
    this.p2Fire = false;
    this.keys = {};
  }

  public dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
    }
  }
}
