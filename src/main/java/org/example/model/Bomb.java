package org.example.model;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Rectangle;

public class Bomb {
    public int x, y;
    private final int speed;
    private static final int SIZE = 24;

    public Bomb(int x, int y, int speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
    }

    public void update() {
        y += speed;
    }

    public void draw(Graphics2D g2d) {
        g2d.setColor(new Color(255, 55, 85, 65));
        g2d.fillOval(x - 7, y - 7, SIZE + 14, SIZE + 14);
        g2d.setColor(new Color(35, 35, 45));
        g2d.fillOval(x, y, SIZE, SIZE);
        g2d.setColor(new Color(255, 75, 95));
        g2d.setStroke(new java.awt.BasicStroke(2f));
        g2d.drawOval(x, y, SIZE, SIZE);
        g2d.setColor(new Color(255, 220, 90));
        g2d.fillOval(x + 8, y + 7, 8, 8);
    }

    public Rectangle getBounds() {
        return new Rectangle(x, y, SIZE, SIZE);
    }
}
