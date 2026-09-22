package org.example.model;

import java.awt.*;

public class Player {
    public int x, y, width = 40, height = 40;
    public int speed = 6;
    public boolean left, right;
    public int lives = 3;
    public int score = 0;
    public int weaponLevel = 1;
    public int shield = 100;

    public Player(int startX, int startY) {
        x = startX;
        y = startY;
    }

    public void update(int boundWidth) {
        if (left && x > 10) x -= speed;
        if (right && x < boundWidth - width - 10) x += speed;
    }

    public void draw(Graphics2D g2d) {
        g2d.setColor(new Color(40, 235, 255, 45));
        g2d.fillOval(x - 10, y - 10, width + 20, height + 26);

        GradientPaint hull = new GradientPaint(x, y, new Color(230, 250, 255),
                x + width, y + height, new Color(35, 80, 170));
        g2d.setPaint(hull);
        int[] xPoints = {x + width / 2, x + 5, x + 12, x + width - 12, x + width - 5};
        int[] yPoints = {y, y + height - 5, y + height, y + height, y + height - 5};
        g2d.fillPolygon(xPoints, yPoints, xPoints.length);

        g2d.setColor(new Color(20, 35, 80));
        g2d.fillOval(x + width / 2 - 6, y + 13, 12, 15);
        g2d.setColor(new Color(135, 250, 255));
        g2d.fillOval(x + width / 2 - 3, y + 15, 6, 9);

        g2d.setColor(new Color(80, 220, 255));
        g2d.fillRoundRect(x + 4, y + height - 8, 8, 8, 4, 4);
        g2d.fillRoundRect(x + width - 12, y + height - 8, 8, 8, 4, 4);
    }

    public Rectangle getBounds() {
        return new Rectangle(x, y, width, height);
    }
}
