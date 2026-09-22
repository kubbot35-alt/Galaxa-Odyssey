package org.example.model;

public final class Star {
    private double x;
    private double y;
    private final double speed;
    private final int size;
    private final int width;

    public Star(int width, int height) {
        this.width = width;
        x = Math.random() * width;
        y = Math.random() * height;
        speed = 0.5 + Math.random() * 2.5;
        size = (int) (1 + Math.random() * 3);
    }

    public void update(int height) {
        y += speed;
        if (y > height) {
            y = 0;
            x = Math.random() * width;
        }
    }
    public double getX() { return x; }
    public double getY() { return y; }
    public int getSize() { return size; }
}
