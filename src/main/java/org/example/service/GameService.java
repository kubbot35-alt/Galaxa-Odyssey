package org.example.service;

import org.example.model.Bomb;
import org.example.model.Bullet;
import org.example.model.Enemy;
import org.example.model.GameModel;
import org.example.model.Player;
import org.example.model.enums.PowerUpType;
import org.example.model.enums.SoundType;
import org.example.model.enums.DifficultyLevel;
import org.example.model.factory.GameObjectFactory;

import java.util.Iterator;
import java.util.function.Consumer;

public final class GameService {
    private final GameObjectFactory factory;
    private final WaveService waveService;
    private final CollisionService collisionService;
    private final Consumer<SoundType> soundPlayer;

    public GameService(GameObjectFactory factory, WaveService waveService,
                       CollisionService collisionService, Consumer<SoundType> soundPlayer) {
        this.factory = factory;
        this.waveService = waveService;
        this.collisionService = collisionService;
        this.soundPlayer = soundPlayer;
    }

    public void update(GameModel model) {
        for (org.example.model.Star star : model.getStars()) star.update(GameModel.HEIGHT);
        Player player = model.getPlayer();
        player.update(GameModel.WIDTH);
        if (model.getFireCooldown() > 0) model.setFireCooldown(model.getFireCooldown() - 1);
        if (model.isSpaceHeld() && model.getFireCooldown() == 0) fire(model);
        if (model.isTwoPlayerMode() && model.getSecondPlayer() != null) {
            model.getSecondPlayer().update(GameModel.WIDTH);
            if (model.getSecondPlayerFireCooldown() > 0) model.setSecondPlayerFireCooldown(model.getSecondPlayerFireCooldown() - 1);
            if (model.isSecondPlayerFireHeld() && model.getSecondPlayerFireCooldown() == 0) fireSecondPlayer(model);
        }

        for (Iterator<Bullet> iterator = model.getBullets().iterator(); iterator.hasNext();) {
            Bullet bullet = iterator.next();
            bullet.update();
            if (bullet.getY() < -20 || bullet.getY() > GameModel.HEIGHT + 20) iterator.remove();
        }
        for (Enemy enemy : model.getEnemies()) {
            enemy.update(model.getWave(), model.getDifficultyLevel());
        }
        updatePowerUps(model);

        resolvePlayerBulletHits(model);
        fireEnemyBullets(model);
        spawnBomb(model);
        CollisionService.CollisionResult result = collisionService.resolve(model);
        switch (result) {
            case PLAYER_HIT:
                damagePlayer(model, scaledDamage(model, Math.min(70, 40 + model.getWave() / 3)));
                break;
            case BOMB_HIT: explodeBomb(model); break;
            case EXTRA_LIFE: player.addLife(); soundPlayer.accept(SoundType.POWER_UP); break;
            case WEAPON_POWER_UP: player.increaseWeaponLevel(); soundPlayer.accept(SoundType.POWER_UP); break;
            default: break;
        }
        updateParticles(model);
        if (model.getEnemies().isEmpty() && model.getGameState() == org.example.model.GameState.PLAYING) {
            waveService.spawnNextWave(model);
        }
    }

    public void fire(GameModel model) {
        Player player = model.getPlayer();
        soundPlayer.accept(SoundType.SHOOT);
        int level = player.getWeaponLevel();
        if (level == 1) {
            model.getBullets().add(factory.createPlayerBullet(player.getX() + player.getWidth() / 2, player.getY()));
        } else if (level == 2) {
            model.getBullets().add(factory.createPlayerBullet(player.getX() + 8, player.getY()));
            model.getBullets().add(factory.createPlayerBullet(player.getX() + player.getWidth() - 8, player.getY()));
        } else {
            model.getBullets().add(factory.createPlayerBullet(player.getX() + player.getWidth() / 2, player.getY() - 4));
            model.getBullets().add(factory.createPlayerBullet(player.getX() + 2, player.getY()));
            model.getBullets().add(factory.createPlayerBullet(player.getX() + player.getWidth() - 2, player.getY()));
        }
        model.setFireCooldown(Math.max(5, 12 - level * 2));
    }

    public void fireSecondPlayer(GameModel model) {
        Player secondPlayer = model.getSecondPlayer();
        if (secondPlayer == null) return;
        soundPlayer.accept(SoundType.SHOOT);
        int level = secondPlayer.getWeaponLevel();
        if (level == 1) {
            model.getBullets().add(factory.createPlayerBullet(secondPlayer.getX() + secondPlayer.getWidth() / 2, secondPlayer.getY()));
        } else if (level == 2) {
            model.getBullets().add(factory.createPlayerBullet(secondPlayer.getX() + 8, secondPlayer.getY()));
            model.getBullets().add(factory.createPlayerBullet(secondPlayer.getX() + secondPlayer.getWidth() - 8, secondPlayer.getY()));
        } else {
            model.getBullets().add(factory.createPlayerBullet(secondPlayer.getX() + secondPlayer.getWidth() / 2, secondPlayer.getY() - 4));
            model.getBullets().add(factory.createPlayerBullet(secondPlayer.getX() + 2, secondPlayer.getY()));
            model.getBullets().add(factory.createPlayerBullet(secondPlayer.getX() + secondPlayer.getWidth() - 2, secondPlayer.getY()));
        }
        model.setSecondPlayerFireCooldown(Math.max(5, 12 - level * 2));
    }

    private void resolvePlayerBulletHits(GameModel model) {
        for (Iterator<Bullet> bullets = model.getBullets().iterator(); bullets.hasNext();) {
            Bullet bullet = bullets.next();
            if (!bullet.isFromPlayer()) continue;
            boolean removed = false;
            for (Iterator<Bomb> bombs = model.getBombs().iterator(); bombs.hasNext();) {
                Bomb bomb = bombs.next();
                if (CollisionService.intersects(bullet.getX() - 3, bullet.getY(), 6, 12,
                        bomb.getX(), bomb.getY(), Bomb.SIZE, Bomb.SIZE)) {
                    bullets.remove();
                    bombs.remove();
                    explosion(model, bomb.getX() + 12, bomb.getY() + 12, 255, 70, 80, 45);
                    removed = true;
                    break;
                }
            }
            if (removed) continue;
            for (Iterator<Enemy> enemies = model.getEnemies().iterator(); enemies.hasNext();) {
                Enemy enemy = enemies.next();
                if (CollisionService.intersects(bullet.getX() - 3, bullet.getY(), 6, 12,
                        (int) enemy.getX(), (int) enemy.getY(), Enemy.WIDTH, Enemy.HEIGHT)) {
                    bullets.remove();
                    enemies.remove();
                    explosion(model, enemy.getX() + 16, enemy.getY() + 16, 255, 0, 255, 25);
                    soundPlayer.accept(SoundType.EXPLOSION);
                    model.getPlayer().addScore(enemy.getType().getScore());
                    model.setCredits(model.getCredits() + enemy.getType().getCredits());
                    model.setHighScore(Math.max(model.getHighScore(), model.getPlayer().getScore()));
                    if (Math.random() < 0.08) {
                        model.getPowerUps().add(factory.createPowerUp((int) enemy.getX(), (int) enemy.getY(),
                                Math.random() < 0.5 ? PowerUpType.EXTRA_LIFE : PowerUpType.WEAPON));
                    }
                    break;
                }
            }
        }
    }

    private void fireEnemyBullets(GameModel model) {
        DifficultyLevel difficulty = model.getDifficultyLevel();
        double chance = Math.min(0.012,
                (0.0025 + model.getWave() * 0.0007) * difficulty.getEnemyFireMultiplier());
        for (Enemy enemy : model.getEnemies()) {
            if (Math.random() < chance) {
                model.getBullets().add(factory.createEnemyBullet((int) enemy.getX() + Enemy.WIDTH / 2,
                        (int) enemy.getY() + Enemy.HEIGHT));
            }
        }
    }

    private void spawnBomb(GameModel model) {
        DifficultyLevel difficulty = model.getDifficultyLevel();
        double chance = Math.min(0.012,
                (0.0002 + model.getWave() * 0.00008) * difficulty.getBombChanceMultiplier());
        if (Math.random() < chance) {
            model.getBombs().add(factory.createBomb(30 + (int) (Math.random() * 740), -30,
                    (int) Math.round((3 + Math.min(3, model.getWave() / 5))
                            * difficulty.getBombSpeedMultiplier())));
        }
    }

    private int scaledDamage(GameModel model, int baseDamage) {
        return Math.max(1, (int) Math.round(baseDamage
                * model.getDifficultyLevel().getDamageMultiplier()));
    }

    private void damagePlayer(GameModel model, int damage) {
        Player player = model.getPlayer();
        if (model.isTwoPlayerMode() && model.getSecondPlayer() != null && player.getLives() <= 0) {
            Player secondPlayer = model.getSecondPlayer();
            if (secondPlayer.getShield() > 0) {
                secondPlayer.reduceShield(damage);
                return;
            }
            if (secondPlayer.getLives() > 0) {
                secondPlayer.loseLife();
                secondPlayer.resetShield();
                explosion(model, secondPlayer.getX() + 20, secondPlayer.getY() + 20, 80, 210, 255, 32);
                soundPlayer.accept(SoundType.EXPLOSION);
                if (secondPlayer.getLives() <= 0) {
                    model.setGameState(org.example.model.GameState.GAMEOVER);
                }
                return;
            }
        }
        if (model.hasInfiniteLives()) {
            player.resetShield();
            return;
        }
        if (player.getShield() > 0) {
            player.reduceShield(damage);
            return;
        }
        player.loseLife();
        player.resetShield();
        explosion(model, player.getX() + 20, player.getY() + 20, 80, 210, 255, 32);
        soundPlayer.accept(SoundType.EXPLOSION);
        if (player.getLives() <= 0 && (!model.isTwoPlayerMode() || model.getSecondPlayer() == null || model.getSecondPlayer().getLives() <= 0)) {
            model.setGameState(org.example.model.GameState.GAMEOVER);
        }
    }

    private void explodeBomb(GameModel model) {
        Player player = model.getPlayer();
        explosion(model, player.getX() + 20, player.getY() + 20, 255, 70, 80, 45);
        if (model.isTwoPlayerMode() && model.getSecondPlayer() != null) {
            Player secondPlayer = model.getSecondPlayer();
            explosion(model, secondPlayer.getX() + 20, secondPlayer.getY() + 20, 255, 70, 80, 45);
        }
        soundPlayer.accept(SoundType.EXPLOSION);
        model.setGameState(org.example.model.GameState.GAMEOVER);
    }

    private void explosion(GameModel model, double x, double y, int red, int green, int blue, int count) {
        if (!model.isParticlesEnabled()) return;
        for (int i = 0; i < count; i++) {
            double angle = Math.random() * Math.PI * 2;
            double speed = 1.5 + Math.random() * 4.5;
            model.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
                    red, green, blue, 35, 5f);
        }
    }

    private void updateParticles(GameModel model) {
        if (!model.isParticlesEnabled()) return;
        for (Iterator<org.example.model.Particle> iterator = model.getParticles().iterator(); iterator.hasNext();) {
            org.example.model.Particle particle = iterator.next();
            particle.update();
            if (particle.getLife() <= 0) iterator.remove();
        }
    }

    private void updatePowerUps(GameModel model) {
        for (Iterator<org.example.model.PowerUp> iterator = model.getPowerUps().iterator();
             iterator.hasNext();) {
            org.example.model.PowerUp powerUp = iterator.next();
            powerUp.update();
            if (powerUp.getY() > GameModel.HEIGHT) {
                iterator.remove();
            }
        }
    }
}
