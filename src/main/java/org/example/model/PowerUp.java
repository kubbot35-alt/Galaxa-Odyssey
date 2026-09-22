package org.example.model;

import org.example.model.enums.PowerUpType;

public final class PowerUp {
    public static final int WIDTH = 22;
    public static final int HEIGHT = 22;
    private int x;
    private int y;
    private final PowerUpType type;

    public PowerUp(int x, int y, PowerUpType type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    public void update() { y += 2; }
    public int getX() { return x; }
    public int getY() { return y; }
    public PowerUpType getType() { return type; }
}
