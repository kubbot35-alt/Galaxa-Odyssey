package org.example.model;

public final class Bomb {
    public static final int SIZE = 24;
    private int x;
    private int y;
    private final int speed;

    public Bomb(int x, int y, int speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
    }

    public void update() { y += speed; }
    public int getX() { return x; }
    public int getY() { return y; }
}
