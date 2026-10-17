interface HangarInteractionCallbacks {
  isCinematicIntroActive(): boolean;
  onSkipCinematicIntro(): void;
  onParallaxChange(mouseX: number, mouseY: number): void;
  onOrbitChange(position: readonly [number, number, number], lookAtOrigin: boolean): void;
}

export class HangarInteractionController {
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private orbit = { radius: 6.4, theta: 0, phi: Math.PI / 2.3 };

  constructor(
    private readonly container: HTMLElement,
    private readonly callbacks: HangarInteractionCallbacks,
  ) {
    container.addEventListener('mousedown', this.onMouseDown);
    container.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  public get dragging(): boolean {
    return this.isDragging;
  }

  public get mousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }

  private mouseX = 0;
  private mouseY = 0;

  public stopDragging(): void {
    this.isDragging = false;
  }

  public dispose(): void {
    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  private onMouseDown = (event: MouseEvent): void => {
    if (this.callbacks.isCinematicIntroActive()) {
      this.callbacks.onSkipCinematicIntro();
      return;
    }
    this.isDragging = true;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  };

  private onMouseMove = (event: MouseEvent): void => {
    this.mouseX = ((event.clientX / window.innerWidth) * 2 - 1) * 0.45;
    this.mouseY = (-(event.clientY / window.innerHeight) * 2 + 1) * 0.35;
    this.callbacks.onParallaxChange(this.mouseX, this.mouseY);

    if (!this.isDragging) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;
    this.orbit.theta -= deltaX * 0.007;
    this.orbit.phi = Math.max(0.3, Math.min(Math.PI / 1.7, this.orbit.phi - deltaY * 0.007));
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
    this.callbacks.onOrbitChange(this.getOrbitPosition(), true);
  };

  private onMouseUp = (): void => {
    this.isDragging = false;
  };

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.orbit.radius = Math.max(3, Math.min(10, this.orbit.radius + event.deltaY * 0.005));
    this.callbacks.onOrbitChange(this.getOrbitPosition(), false);
  };

  private getOrbitPosition(): readonly [number, number, number] {
    return [
      this.orbit.radius * Math.sin(this.orbit.phi) * Math.sin(this.orbit.theta),
      this.orbit.radius * Math.cos(this.orbit.phi),
      this.orbit.radius * Math.sin(this.orbit.phi) * Math.cos(this.orbit.theta),
    ];
  }
}
