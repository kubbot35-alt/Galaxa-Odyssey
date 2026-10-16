import { WeaponMode } from '../../types/game';

/**
 * SpaceshipHermeticModel - MVC Model Layer
 * Fully encapsulates state with private variables.
 * Modification is only possible through public methods that enforce business rules.
 */
export class SpaceshipHermeticModel {
  private _shield: number;
  private readonly _maxShield: number;
  private _shieldLag: number;
  private _energy: number;
  private readonly _maxEnergy: number;
  private _lives: number;
  private readonly _maxLives: number;
  private _x: number;
  private _y: number;
  private _z: number;
  private _bankAngle: number;
  private _currentWeapon: WeaponMode;
  private _isInvulnerable: boolean;
  private _invulnerabilityTimer: number;

  constructor(
    initialShield: number = 100,
    maxShield: number = 100,
    initialEnergy: number = 100,
    maxEnergy: number = 100,
    initialLives: number = 3
  ) {
    this._shield = initialShield;
    this._maxShield = maxShield;
    this._shieldLag = initialShield;
    this._energy = initialEnergy;
    this._maxEnergy = maxEnergy;
    this._lives = initialLives;
    this._maxLives = 5;
    this._x = 0;
    this._y = 0;
    this._z = 0;
    this._bankAngle = 0;
    this._currentWeapon = WeaponMode.STANDARD;
    this._isInvulnerable = false;
    this._invulnerabilityTimer = 0;
  }

  // --- Hermetic Getters (Read-Only) ---

  public get shield(): number {
    return this._shield;
  }

  public get maxShield(): number {
    return this._maxShield;
  }

  public get shieldLag(): number {
    return this._shieldLag;
  }

  public get energy(): number {
    return this._energy;
  }

  public get maxEnergy(): number {
    return this._maxEnergy;
  }

  public get lives(): number {
    return this._lives;
  }

  public get position(): Readonly<{ x: number; y: number; z: number }> {
    return Object.freeze({ x: this._x, y: this._y, z: this._z });
  }

  public get bankAngle(): number {
    return this._bankAngle;
  }

  public get currentWeapon(): WeaponMode {
    return this._currentWeapon;
  }

  public get isInvulnerable(): boolean {
    return this._isInvulnerable;
  }

  public get isAlive(): boolean {
    return this._lives > 0;
  }

  // --- Hermetic Mutators (SRP / Encapsulation) ---

  public takeDamage(amount: number): boolean {
    if (this._isInvulnerable || this._lives <= 0) {
      return false;
    }

    if (this._shield > 0) {
      this._shield = Math.max(0, this._shield - amount);
    } else {
      this._lives = Math.max(0, this._lives - 1);
      if (this._lives > 0) {
        this._shield = this._maxShield * 0.5;
        this.triggerInvulnerability(2.0);
      }
    }
    return true;
  }

  public rechargeShield(delta: number, rate: number = 5.0): void {
    if (this._shield < this._maxShield && this._lives > 0) {
      this._shield = Math.min(this._maxShield, this._shield + rate * delta);
    }
    // Shield lag decay interpolation
    if (this._shieldLag > this._shield) {
      this._shieldLag = Math.max(this._shield, this._shieldLag - 25.0 * delta);
    } else {
      this._shieldLag = this._shield;
    }
  }

  public rechargeEnergy(delta: number, rate: number = 15.0): void {
    if (this._energy < this._maxEnergy) {
      this._energy = Math.min(this._maxEnergy, this._energy + rate * delta);
    }
  }

  public consumeEnergy(cost: number): boolean {
    if (this._energy >= cost) {
      this._energy -= cost;
      return true;
    }
    return false;
  }

  public setPosition(x: number, y: number, z: number): void {
    this._x = x;
    this._y = y;
    this._z = z;
  }

  public setBankAngle(angle: number): void {
    this._bankAngle = angle;
  }

  public setWeapon(weapon: WeaponMode): void {
    this._currentWeapon = weapon;
  }

  public addLife(): void {
    if (this._lives < this._maxLives) {
      this._lives++;
    }
  }

  public triggerInvulnerability(duration: number): void {
    this._isInvulnerable = true;
    this._invulnerabilityTimer = duration;
  }

  public updateTimers(delta: number): void {
    if (this._isInvulnerable) {
      this._invulnerabilityTimer -= delta;
      if (this._invulnerabilityTimer <= 0) {
        this._isInvulnerable = false;
        this._invulnerabilityTimer = 0;
      }
    }
  }
}
