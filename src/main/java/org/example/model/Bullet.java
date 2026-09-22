package org.example.model;

public final class Bullet {
    public static final int SPEED = 12;
    private int x;
    private int y;
    private final boolean fromPlayer;

    public Bullet(int x, int y, boolean fromPlayer) {
        this.x = x;
        this.y = y;
        this.fromPlayer = fromPlayer;
    }

    public void update() { y += fromPlayer ? -SPEED : SPEED - 4; }
    public int getX() { return x; }
    public int getY() { return y; }
    public boolean isFromPlayer() { return fromPlayer; }
}
