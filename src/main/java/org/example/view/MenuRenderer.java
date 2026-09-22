package org.example.view;

import org.example.model.GameModel;
import org.example.model.enums.MenuOption;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

public final class MenuRenderer {
    private final BufferedImage background;

    public MenuRenderer() {
        background = ResourceLoader.loadImage("menu/menu-background.png");
    }

    public void render(Graphics2D graphics, GameModel model) {
        graphics.drawImage(background, 0, 0, GameModel.WIDTH, GameModel.HEIGHT, null);
        graphics.setColor(new Color(2, 5, 25, 80));
        graphics.fillRect(0, 0, GameModel.WIDTH, GameModel.HEIGHT);
        graphics.setColor(new Color(55, 245, 255));
        graphics.setFont(new Font("SansSerif", Font.BOLD, 52));
        centered(graphics, "GALAXIA", 400, 78);
        graphics.setColor(new Color(175, 125, 255));
        centered(graphics, "ODYSSEY", 400, 134);
        graphics.setColor(new Color(120, 235, 255));
        graphics.setFont(new Font("SansSerif", Font.PLAIN, 15));
        centered(graphics, "FUTURISTIC SPACE SHOOTER", 400, 172);
        graphics.setColor(new Color(5, 15, 40, 220));
        graphics.fillRoundRect(55, 188, 690, 34, 17, 17);
        graphics.setColor(new Color(80, 210, 255, 150));
        graphics.drawRoundRect(55, 188, 690, 34, 17, 17);
        graphics.setFont(new Font("SansSerif", Font.BOLD, 14));
        graphics.setColor(new Color(160, 235, 255));
        graphics.drawString("PILOT 01", 75, 211);
        graphics.drawString("CREDITS  " + model.getCredits(), 330, 211);
        graphics.drawString("BEST SCORE  " + model.getHighScore(), 565, 211);
        for (int i = 0; i < MenuOption.values().length; i++) {
            MenuOption option = MenuOption.values()[i];
            int y = 240 + i * 78;
            Color accent = i == 3 ? new Color(255, 95, 180) : i == 1 ? new Color(180, 125, 255) : new Color(35, 220, 255);
            boolean selected = model.getMenuSelection() == i;
            graphics.setColor(selected ? new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 190)
                    : new Color(5, 15, 40, 220));
            graphics.fillRoundRect(150, y, 500, 62, 18, 18);
            graphics.setColor(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), selected ? 245 : 130));
            graphics.setStroke(new BasicStroke(selected ? 2.5f : 1f));
            graphics.drawRoundRect(150, y, 500, 62, 18, 18);
            graphics.setFont(new Font("SansSerif", Font.BOLD, 21));
            graphics.setColor(selected ? Color.WHITE : accent);
            graphics.drawString(option.getTitle(), 185, y + 28);
            graphics.setFont(new Font("SansSerif", Font.PLAIN, 12));
            graphics.setColor(selected ? new Color(225, 245, 255) : new Color(155, 180, 210));
            graphics.drawString(option.getSubtitle(), 185, y + 47);
            graphics.setFont(new Font("SansSerif", Font.BOLD, 22));
            graphics.drawString(">", 612, y + 38);
        }
    }

    static void centered(Graphics2D graphics, String text, int x, int baseline) {
        FontMetrics metrics = graphics.getFontMetrics();
        graphics.drawString(text, x - metrics.stringWidth(text) / 2, baseline);
    }
}
