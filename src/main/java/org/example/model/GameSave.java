package org.example.model;

public final class GameSave {
    private final int lives;
    private final int weaponLevel;
    private final int score;
    private final int stage;
    private final int credits;
    private final int ownedWeaponLevel;

    public GameSave(int lives, int weaponLevel, int score, int stage,
                    int credits, int ownedWeaponLevel) {
        this.lives = lives;
        this.weaponLevel = weaponLevel;
        this.score = score;
        this.stage = stage;
        this.credits = credits;
        this.ownedWeaponLevel = ownedWeaponLevel;
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
}
