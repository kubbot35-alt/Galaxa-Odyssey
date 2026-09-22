package org.example.model;

public final class GameSave {
    private final int lives;
    private final int weaponLevel;
    private final int score;
    private final int stage;
    private final int credits;
    private final int ownedWeaponLevel;
    private final boolean doubleLives;
    private final boolean infiniteLives;

    public GameSave(int lives, int weaponLevel, int score, int stage,
                    int credits, int ownedWeaponLevel) {
        this(lives, weaponLevel, score, stage, credits, ownedWeaponLevel, false, false);
    }

    public GameSave(int lives, int weaponLevel, int score, int stage,
                    int credits, int ownedWeaponLevel,
                    boolean doubleLives, boolean infiniteLives) {
        this.lives = lives;
        this.weaponLevel = weaponLevel;
        this.score = score;
        this.stage = stage;
        this.credits = credits;
        this.ownedWeaponLevel = ownedWeaponLevel;
        this.doubleLives = doubleLives;
        this.infiniteLives = infiniteLives;
    }

    public int getLives() {
        return lives;
    }

    public int getWeaponLevel() {
        return weaponLevel;
    }

    public int getScore() {
        return score;
    }

    public int getStage() {
        return stage;
    }

    public int getCredits() {
        return credits;
    }

    public int getOwnedWeaponLevel() {
        return ownedWeaponLevel;
    }

    public boolean hasDoubleLives() { return doubleLives; }
    public boolean hasInfiniteLives() { return infiniteLives; }
}
