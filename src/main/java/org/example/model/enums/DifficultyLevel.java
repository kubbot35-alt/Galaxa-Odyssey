package org.example.model.enums;

public enum DifficultyLevel {
    EASY("EASY", 0.80, -1, 0.65, 0.75, 0.65, 0.90),
    NORMAL("NORMAL", 1.00, 0, 1.00, 1.00, 1.00, 1.00),
    HARD("HARD", 1.25, 1, 1.45, 1.35, 1.50, 1.15);

    private final String displayName;
    private final double enemySpeedMultiplier;
    private final int additionalRows;
    private final double enemyFireMultiplier;
    private final double damageMultiplier;
    private final double bombChanceMultiplier;
    private final double bombSpeedMultiplier;

    DifficultyLevel(String displayName, double enemySpeedMultiplier, int additionalRows,
                    double enemyFireMultiplier, double damageMultiplier,
                    double bombChanceMultiplier, double bombSpeedMultiplier) {
        this.displayName = displayName;
        this.enemySpeedMultiplier = enemySpeedMultiplier;
        this.additionalRows = additionalRows;
        this.enemyFireMultiplier = enemyFireMultiplier;
        this.damageMultiplier = damageMultiplier;
        this.bombChanceMultiplier = bombChanceMultiplier;
        this.bombSpeedMultiplier = bombSpeedMultiplier;
    }

    public String getDisplayName() { return displayName; }
    public double getEnemySpeedMultiplier() { return enemySpeedMultiplier; }
    public int getAdditionalRows() { return additionalRows; }
    public double getEnemyFireMultiplier() { return enemyFireMultiplier; }
    public double getDamageMultiplier() { return damageMultiplier; }
    public double getBombChanceMultiplier() { return bombChanceMultiplier; }
    public double getBombSpeedMultiplier() { return bombSpeedMultiplier; }
}
