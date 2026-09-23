package org.example.model;

import org.example.model.enums.PowerUpType;
import org.example.model.enums.DifficultyLevel;

import java.util.ArrayList;
import java.util.List;

public final class GameModel {
    public static final int WIDTH = 800;
    public static final int HEIGHT = 600;

    private GameState gameState = GameState.MENU;
    private DifficultyLevel difficultyLevel = DifficultyLevel.NORMAL;
    private Player player;
    private Player secondPlayer;
    private final List<Bullet> bullets = new ArrayList<Bullet>();
    private final List<Bomb> bombs = new ArrayList<Bomb>();
    private final List<Enemy> enemies = new ArrayList<Enemy>();
    private final List<PowerUp> powerUps = new ArrayList<PowerUp>();
    private final List<Particle> particles = new ArrayList<Particle>();
    private final List<Star> stars = new ArrayList<Star>();
    private int wave;
    private int credits;
    private int profileScore;
    private int highScore;
    private int ownedWeaponLevel = 1;
    private boolean doubleLives;
    private boolean infiniteLives;
    private boolean particlesEnabled = true;
    private boolean soundEnabled = true;
    private boolean spaceHeld;
    private boolean secondPlayerFireHeld;
    private int fireCooldown;
    private int secondPlayerFireCooldown;
    private int menuSelection;
    private int playerModeSelection;
    private int upgradeSelection;
    private int settingsSelection;
    private int difficultySelection;
    private boolean twoPlayerMode;

    public GameModel() {
        for (int i = 0; i < 120; i++) {
            stars.add(new Star(WIDTH, HEIGHT));
        }
    }

    public GameState getGameState() { return gameState; }
    public void setGameState(GameState state) { gameState = state; }
    public DifficultyLevel getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(DifficultyLevel value) { difficultyLevel = value; }
    public Player getPlayer() { return player; }
    public void setPlayer(Player value) { player = value; }
    public Player getSecondPlayer() { return secondPlayer; }
    public void setSecondPlayer(Player value) { secondPlayer = value; }
    public List<Bullet> getBullets() { return bullets; }
    public List<Bomb> getBombs() { return bombs; }
    public List<Enemy> getEnemies() { return enemies; }
    public List<PowerUp> getPowerUps() { return powerUps; }
    public List<Particle> getParticles() { return particles; }
    public List<Star> getStars() { return stars; }
    public int getWave() { return wave; }
    public void setWave(int value) { wave = value; }
    public int getCredits() { return credits; }
    public void setCredits(int value) { credits = value; }
    public int getProfileScore() { return profileScore; }
    public void setProfileScore(int value) { profileScore = Math.max(0, value); }
    public int getHighScore() { return highScore; }
    public void setHighScore(int value) { highScore = value; }
    public int getOwnedWeaponLevel() { return ownedWeaponLevel; }
    public void setOwnedWeaponLevel(int value) { ownedWeaponLevel = Math.max(1, Math.min(3, value)); }
    public boolean hasDoubleLives() { return doubleLives; }
    public void setDoubleLives(boolean value) { doubleLives = value; }
    public boolean hasInfiniteLives() { return infiniteLives; }
    public void setInfiniteLives(boolean value) {
        infiniteLives = value;
        if (value) doubleLives = true;
    }
    public boolean isParticlesEnabled() { return particlesEnabled; }
    public void setParticlesEnabled(boolean value) { particlesEnabled = value; }
    public boolean isSoundEnabled() { return soundEnabled; }
    public void setSoundEnabled(boolean value) { soundEnabled = value; }
    public boolean isSpaceHeld() { return spaceHeld; }
    public void setSpaceHeld(boolean value) { spaceHeld = value; }
    public boolean isSecondPlayerFireHeld() { return secondPlayerFireHeld; }
    public void setSecondPlayerFireHeld(boolean value) { secondPlayerFireHeld = value; }
    public int getFireCooldown() { return fireCooldown; }
    public void setFireCooldown(int value) { fireCooldown = value; }
    public int getSecondPlayerFireCooldown() { return secondPlayerFireCooldown; }
    public void setSecondPlayerFireCooldown(int value) { secondPlayerFireCooldown = value; }
    public void setSecondPlayerMovingLeft(boolean value) { if (secondPlayer != null) secondPlayer.moveLeft(value); }
    public void setSecondPlayerMovingRight(boolean value) { if (secondPlayer != null) secondPlayer.moveRight(value); }
    public int getMenuSelection() { return menuSelection; }
    public void setMenuSelection(int value) { menuSelection = value; }
    public int getPlayerModeSelection() { return playerModeSelection; }
    public void setPlayerModeSelection(int value) { playerModeSelection = value; }
    public int getUpgradeSelection() { return upgradeSelection; }
    public void setUpgradeSelection(int value) { upgradeSelection = value; }
    public int getSettingsSelection() { return settingsSelection; }
    public void setSettingsSelection(int value) { settingsSelection = value; }
    public int getDifficultySelection() { return difficultySelection; }
    public void setDifficultySelection(int value) { difficultySelection = value; }
    public boolean isTwoPlayerMode() { return twoPlayerMode; }
    public void setTwoPlayerMode(boolean value) { twoPlayerMode = value; }

    public void clearTransientObjects() {
        bullets.clear();
        bombs.clear();
        enemies.clear();
        powerUps.clear();
        particles.clear();
        spaceHeld = false;
        secondPlayerFireHeld = false;
        fireCooldown = 0;
        secondPlayerFireCooldown = 0;
    }

    public void addParticle(double x, double y, double vx, double vy,
                            int red, int green, int blue, int life, float size) {
        if (particlesEnabled) {
            particles.add(new Particle(x, y, vx, vy, red, green, blue, life, size));
        }
    }
}
