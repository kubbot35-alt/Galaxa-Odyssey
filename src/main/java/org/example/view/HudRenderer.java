package org.example.view;

import org.example.model.GameModel;
import org.example.model.Player;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;

public final class HudRenderer {
    public void render(Graphics2D graphics, GameModel model) {
        Player player = model.getPlayer();
        graphics.setColor(new Color(8, 15, 42, 215));
        graphics.fillRoundRect(16, 14, GameModel.WIDTH - 32, 42, 18, 18);
        graphics.setColor(new Color(80, 210, 255, 170));
        graphics.setStroke(new BasicStroke(1.5f));
        graphics.drawRoundRect(16, 14, GameModel.WIDTH - 32, 42, 18, 18);
        graphics.setFont(new Font("SansSerif", Font.BOLD, 16));
        graphics.setColor(new Color(170, 240, 255));
        graphics.drawString("SCORE  " + player.getScore(), 32, 41);
        MenuRenderer.centered(graphics, "WAVE  " + model.getWave(), 400, 41);
        graphics.drawString("LIVES  " + player.getLives(), 685, 41);
        graphics.setColor(new Color(120, 235, 255));
        graphics.drawString("SHIELD", 32, 76);
        graphics.setColor(new Color(30, 45, 75, 220));
        graphics.fillRoundRect(102, 64, 120, 10, 5, 5);
        graphics.setColor(new Color(70, 220, 255));
        graphics.fillRoundRect(102, 64, (int) (120 * player.getShield() / 100.0), 10, 5, 5);
    }
}
