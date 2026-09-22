package org.example.model;

public final class Particle {
    private double x;
    private double y;
    private final double velocityX;
    private final double velocityY;
    private final int red;
    private final int green;
    private final int blue;
    private int life;
    private final int maxLife;
    private final float size;

    public Particle(double x, double y, double velocityX, double velocityY,
                    int red, int green, int blue, int maxLife, float size) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.life = maxLife;
        this.maxLife = maxLife;
        this.size = size;
    }

    public void update() { x += velocityX; y += velocityY; life--; }
    public double getX() { return x; }
    public double getY() { return y; }
    public int getRed() { return red; }
    public int getGreen() { return green; }
    public int getBlue() { return blue; }
    public int getLife() { return life; }
    public int getMaxLife() { return maxLife; }
    public float getSize() { return size; }
}
