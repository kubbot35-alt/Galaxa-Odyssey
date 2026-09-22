package org.example.model;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Rectangle;

public class Enemy {
    public double x, y, startX;
    public double startY;
    public int width = 32, height = 32;
    public double angle = 0;
    public int type;
    public boolean diving;

    public Enemy(double x, double y, int type) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.type = type;
        this.angle = Math.random() * Math.PI * 2;
    }

    public void update(int wave) {
        angle += 0.04;
        x = startX + Math.sin(angle) * (42 + wave * 2);

        if (!diving && Math.random() < 0.001 + wave * 0.0003) {
            diving = true;
        }

        if (diving) {
            y += 2.6 + type * 0.6 + Math.min(1.5, wave * 0.08);
            x += Math.sin(angle * 2.5) * (1.8 + Math.min(1.2, wave * 0.05));
            if (y > 620) {
                y = startY;
                x = startX;
                diving = false;
            }
        } else {
            y += Math.min(0.14, 0.025 + wave * 0.004);
        }
    }

    public void draw(Graphics2D g2d) {
        Color accent = type == 1 ? new Color(255, 70, 175) : new Color(255, 180, 65);
        g2d.setColor(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 45));
        g2d.fillOval((int) x - 8, (int) y - 8, width + 16, height + 16);

        g2d.setColor(new Color(20, 25, 60));
        g2d.fillRoundRect((int) x, (int) y, width, height, 14, 14);
        g2d.setColor(accent);
        g2d.setStroke(new java.awt.BasicStroke(2f));
        g2d.drawRoundRect((int) x, (int) y, width, height, 14, 14);
        g2d.fillRoundRect((int) x + 5, (int) y + 8, 7, 10, 3, 3);
        g2d.fillRoundRect((int) x + width - 12, (int) y + 8, 7, 10, 3, 3);
        g2d.setColor(new Color(230, 250, 255));
        g2d.fillOval((int) x + 8, (int) y + 10, 3, 4);
        g2d.fillOval((int) x + width - 11, (int) y + 10, 3, 4);
    }

    public Rectangle getBounds() {
        return new Rectangle((int) x, (int) y, width, height);
    }
}
