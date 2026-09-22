package org.example.service;

import org.example.model.Bomb;
import org.example.model.Bullet;
import org.example.model.Enemy;
import org.example.model.GameModel;
import org.example.model.Player;
import org.example.model.PowerUp;
import org.example.model.enums.PowerUpType;

import java.util.Iterator;

public final class CollisionService {
    public CollisionResult resolve(GameModel model) {
        Player player = model.getPlayer();
        for (Iterator<Enemy> enemies = model.getEnemies().iterator(); enemies.hasNext();) {
            Enemy enemy = enemies.next();
            if (intersects(enemy.getX(), enemy.getY(), Enemy.WIDTH, Enemy.HEIGHT,
                    player.getX(), player.getY(), player.getWidth(), player.getHeight())) {
                enemies.remove();
                return CollisionResult.PLAYER_HIT;
            }
            if (enemy.getY() > GameModel.HEIGHT) {
                enemies.remove();
            }
        }
        for (Iterator<Bullet> bullets = model.getBullets().iterator(); bullets.hasNext();) {
            Bullet bullet = bullets.next();
            if (!bullet.isFromPlayer() && intersects(bullet.getX(), bullet.getY(), 6, 12,
                    player.getX(), player.getY(), player.getWidth(), player.getHeight())) {
                bullets.remove();
                return CollisionResult.PLAYER_HIT;
            }
        }
        for (Iterator<Bomb> bombs = model.getBombs().iterator(); bombs.hasNext();) {
            Bomb bomb = bombs.next();
            if (intersects(bomb.getX(), bomb.getY(), Bomb.SIZE, Bomb.SIZE,
                    player.getX(), player.getY(), player.getWidth(), player.getHeight())) {
                bombs.remove();
                return CollisionResult.BOMB_HIT;
            }
            if (bomb.getY() > GameModel.HEIGHT) {
                bombs.remove();
            }
        }
        for (Iterator<PowerUp> powerUps = model.getPowerUps().iterator(); powerUps.hasNext();) {
            PowerUp powerUp = powerUps.next();
            if (intersects(powerUp.getX(), powerUp.getY(), PowerUp.WIDTH, PowerUp.HEIGHT,
                    player.getX(), player.getY(), player.getWidth(), player.getHeight())) {
                powerUps.remove();
                return powerUp.getType() == PowerUpType.EXTRA_LIFE
                        ? CollisionResult.EXTRA_LIFE : CollisionResult.WEAPON_POWER_UP;
            }
            if (powerUp.getY() > GameModel.HEIGHT) {
                powerUps.remove();
            }
        }
        return CollisionResult.NONE;
    }

    public static boolean intersects(double ax, double ay, double aw, double ah,
                                     double bx, double by, double bw, double bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    public enum CollisionResult {
        NONE, PLAYER_HIT, BOMB_HIT, EXTRA_LIFE, WEAPON_POWER_UP
    }
}
