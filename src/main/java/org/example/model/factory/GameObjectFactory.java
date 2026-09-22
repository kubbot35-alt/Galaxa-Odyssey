package org.example.model.factory;

import org.example.model.Bomb;
import org.example.model.Bullet;
import org.example.model.Enemy;
import org.example.model.Particle;
import org.example.model.PowerUp;
import org.example.model.enums.EnemyType;
import org.example.model.enums.PowerUpType;

public final class GameObjectFactory {
    public Enemy createEnemy(double x, double y, EnemyType type) {
        return new Enemy(x, y, type);
    }
    public Bullet createPlayerBullet(int x, int y) {
        return new Bullet(x, y, true);
    }
    public Bullet createEnemyBullet(int x, int y) {
        return new Bullet(x, y, false);
    }
    public Bomb createBomb(int x, int y, int speed) {
        return new Bomb(x, y, speed);
    }
    public PowerUp createPowerUp(int x, int y, PowerUpType type) {
        return new PowerUp(x, y, type);
    }
    public Particle createParticle(double x, double y, double vx, double vy,
                                   int red, int green, int blue, int life, float size) {
        return new Particle(x, y, vx, vy, red, green, blue, life, size);
    }
}
