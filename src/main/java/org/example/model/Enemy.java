package org.example.model;

import org.example.model.enums.EnemyType;
import org.example.model.enums.DifficultyLevel;

public final class Enemy {
    public static final int WIDTH = 32;
    public static final int HEIGHT = 32;
    private double x;
    private double y;
    private final double startX;
    private final double startY;
    private double angle;
    private final EnemyType type;
    private boolean diving;

    public Enemy(double x, double y, EnemyType type) {
        this.x = x;
        this.y = y;
        startX = x;
        startY = y;
        this.type = type;
        angle = Math.random() * Math.PI * 2;
    }

    public void update(int wave, DifficultyLevel difficulty) {
        angle += 0.04;
        x = startX + Math.sin(angle) * (42 + wave * 2);
        if (!diving && Math.random() < 0.001 + wave * 0.0003) {
            diving = true;
        }
        if (diving) {
            y += (2.6 + type.getDifficulty() * 0.6 + Math.min(1.5, wave * 0.08))
                    * difficulty.getEnemySpeedMultiplier();
            x += Math.sin(angle * 2.5) * (1.8 + Math.min(1.2, wave * 0.05))
                    * difficulty.getEnemySpeedMultiplier();
            if (y > 620) {
                y = startY;
                x = startX;
                diving = false;
            }
        } else {
            y += Math.min(0.14, 0.025 + wave * 0.004)
                    * difficulty.getEnemySpeedMultiplier();
        }
    }

    public double getX() { return x; }
    public double getY() { return y; }
    public EnemyType getType() { return type; }
    public boolean isDiving() { return diving; }
}
