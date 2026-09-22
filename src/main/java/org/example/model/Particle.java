package org.example.model;

import java.awt.Color;
import java.awt.Graphics2D;

public class Particle {
    public double x, y, vx, vy;
    public Color color;
    public int life, maxLife;
    public float size;

    public Particle(double x, double y, double vx, double vy, Color color, int maxLife, float size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = maxLife;
        this.maxLife = maxLife;
        this.size = size;
    }

    public void update() {
        x += vx;
        y += vy;
        life--;
    }

    public void draw(Graphics2D g2d) {
        float alpha = Math.max(0f, Math.min(1f, (float) life / maxLife));
        g2d.setColor(new Color(color.getRed(), color.getGreen(), color.getBlue(), (int) (alpha * 255)));
        g2d.fillOval((int) x, (int) y, (int) size, (int) size);
    }
}
