import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { Particle, Star } from '../entities/GameEntities';
import { updateAndPrune } from '../entities/collections';

export class ParticleSystem {
    public stars: Star[] = [];
    public particles: Particle[] = [];

    constructor() {
        this.initStars();
    }

    public initStars(): void {
        this.stars = [];
        for (let i = 0; i < 140; i++) {
            this.stars.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * GAME_HEIGHT,
                size: Math.random() > 0.8 ? 2 : 1,
                speed: 0.5 + Math.random() * 1.8,
            });
        }
    }

    public updateStars(): void {
        for (const star of this.stars) {
            star.y += star.speed;
            if (star.y > GAME_HEIGHT) {
                star.y = 0;
                star.x = Math.random() * GAME_WIDTH;
            }
        }
    }

    public updateParticles(particlesEnabled: boolean): void {
        if (!particlesEnabled) return;
        updateAndPrune(
            this.particles,
            (p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 1;
            },
            (p) => p.life <= 0
        );
    }

    public addExplosion(
        x: number,
        y: number,
        r: number,
        g: number,
        b: number,
        count: number,
        particlesEnabled: boolean
    ): void {
        if (!particlesEnabled) return;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4.5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r,
                g,
                b,
                life: 35,
                maxLife: 35,
                size: 3 + Math.random() * 3,
            });
        }
    }

    public addLaserSparks(
        x: number,
        y: number,
        colorHex: string,
        count = 4,
        particlesEnabled = true
    ): void {
        if (!particlesEnabled) return;
        for (let i = 0; i < count; i++) {
            const angle = (Math.random() - 0.5) * Math.PI;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 6,
                vx: Math.sin(angle) * speed,
                vy: Math.cos(angle) * speed,
                r: colorHex === '#ff37a6' ? 255 : 251,
                g: colorHex === '#ff37a6' ? 70 : 191,
                b: colorHex === '#ff37a6' ? 180 : 36,
                life: 14,
                maxLife: 14,
                size: 2.5 + Math.random() * 2,
            });
        }
    }
}