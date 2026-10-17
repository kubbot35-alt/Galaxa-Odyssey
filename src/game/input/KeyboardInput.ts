type KeyboardInputCallbacks = {
    onKeyChange: (key: string, code: string, pressed: boolean) => void;
    onWeaponCycle: (dir: 1 | -1) => void;
    onWeaponSelect: (modeIdx: number) => void;
    onPauseToggle: () => void;
    onAchievementsToggle: () => void;
    onFireStart: (pIdx: number) => void;
    onFireEnd: (pIdx: number) => void;
};

export default class KeyboardInput {
    private handleKeyDown = (e: KeyboardEvent) => {
        this.callbacks.onKeyChange(e.key.toLowerCase(), e.code, true);

        if (e.key === 'q' || e.key === 'Q') {
            this.callbacks.onWeaponCycle(-1);
        } else if (e.key === 'e' || e.key === 'E') {
            this.callbacks.onWeaponCycle(1);
        }

        if (e.key === '1') this.callbacks.onWeaponSelect(0);
        if (e.key === '2') this.callbacks.onWeaponSelect(1);
        if (e.key === '3') this.callbacks.onWeaponSelect(2);
        if (e.key === '4') this.callbacks.onWeaponSelect(3);

        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            this.callbacks.onPauseToggle();
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            this.callbacks.onAchievementsToggle();
        }

        if (e.code === 'Space') {
            this.callbacks.onFireStart(1);
        }
        if (e.code === 'Numpad0' || e.code === 'Enter') {
            this.callbacks.onFireStart(2);
        }
    };

    private handleKeyUp = (e: KeyboardEvent) => {
        this.callbacks.onKeyChange(e.key.toLowerCase(), e.code, false);

        if (e.code === 'Space') {
            this.callbacks.onFireEnd(1);
        }
        if (e.code === 'Numpad0' || e.code === 'Enter') {
            this.callbacks.onFireEnd(2);
        }
    };

    constructor(private readonly callbacks: KeyboardInputCallbacks) {
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('keydown', this.handleKeyDown);
            window.addEventListener('keyup', this.handleKeyUp);
        }
    }

    public dispose() {
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
            window.removeEventListener('keydown', this.handleKeyDown);
            window.removeEventListener('keyup', this.handleKeyUp);
        }
    }
}
