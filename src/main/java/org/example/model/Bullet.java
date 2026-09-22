package org.example;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Rectangle;

class Bullet {
    int x, y, speed = 12;
    boolean fromPlayer;

    public Bullet(int x, int y, boolean fromPlayer) {
        this.x = x;
        this.y = y;
        this.fromPlayer = fromPlayer;
    }

    public void update() {
        if (fromPlayer) y -= speed;
        else y += (speed - 4);
    }

    public void draw(Graphics2D g2d) {
        Color color = fromPlayer ? new Color(65, 240, 255) : new Color(255, 75, 145);
        g2d.setColor(new Color(color.getRed(), color.getGreen(), color.getBlue(), 55));
        g2d.fillOval(x - 8, y - 5, 16, 24);
        g2d.setColor(color);
        g2d.fillRoundRect(x - 2, y, 4, 13, 3, 3);
    }

    public Rectangle getBounds() {
        return new Rectangle(x - 3, y, 6, 12);
    }
}
