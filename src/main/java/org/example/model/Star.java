package org.example.model;

import java.awt.Color;
import java.awt.Graphics2D;

public class Star {
    public double x, y, speed;
    public int size;

    public Star(int width, int height) {
        x = Math.random() * width;
        y = Math.random() * height;
        speed = 0.5 + Math.random() * 2.5;
        size = (int) (1 + Math.random() * 3);
    }

    public void update(int height) {
        y += speed;
        if (y > height) {
            y = 0;
            x = Math.random() * 800;
        }
    }

    public void draw(Graphics2D g2d) {
        g2d.setColor(new Color(255, 255, 255, 160));
        g2d.fillRect((int) x, (int) y, size, size);
    }
}
