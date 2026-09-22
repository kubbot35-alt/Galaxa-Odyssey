package org.example.model;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Rectangle;

public class PowerUp {
    public int x, y, width = 22, height = 22;
    public int type;

    public PowerUp(int x, int y, int type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    public void update() {
        y += 2;
    }

    public void draw(Graphics2D g2d) {
        Color color = type == 1 ? new Color(75, 255, 180) : new Color(180, 115, 255);
        g2d.setColor(new Color(color.getRed(), color.getGreen(), color.getBlue(), 55));
        g2d.fillOval(x - 6, y - 6, width + 12, height + 12);
        g2d.setColor(new Color(18, 25, 60));
        g2d.fillRoundRect(x, y, width, height, 8, 8);
        g2d.setColor(color);
        g2d.setStroke(new java.awt.BasicStroke(2f));
        g2d.drawRoundRect(x, y, width, height, 8, 8);
        g2d.setFont(new java.awt.Font("SansSerif", java.awt.Font.BOLD, 15));
        g2d.drawString(type == 1 ? "+" : "W", x + 5, y + 16);
    }

    public Rectangle getBounds() {
        return new Rectangle(x, y, width, height);
    }
}
