package org.example.view;

import org.example.model.*;
import org.example.model.enums.PowerUpType;
import org.example.model.enums.DifficultyLevel;
import org.example.model.enums.UpgradeOption;

import java.awt.*;
import java.awt.image.BufferedImage;

public final class GameRenderer {
    private final MenuRenderer menuRenderer = new MenuRenderer();
    private final HudRenderer hudRenderer = new HudRenderer();
    private final BufferedImage playerShip = ResourceLoader.loadImage("ships/player-ship.png");
    private final BufferedImage secondPlayerShip = ResourceLoader.loadImage("ships/player-ship-2.png");

    public void render(Graphics2D g, GameModel model) {
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        background(g, model);
        for (Star star : model.getStars()) {
            g.setColor(new Color(255, 255, 255, 160));
            g.fillRect((int) star.getX(), (int) star.getY(), star.getSize(), star.getSize());
        }
        if (model.isParticlesEnabled()) {
            for (Particle p : model.getParticles()) {
                float alpha = Math.max(0f, Math.min(1f, (float) p.getLife() / p.getMaxLife()));
                g.setColor(new Color(p.getRed(), p.getGreen(), p.getBlue(), (int) (alpha * 255)));
                g.fillOval((int) p.getX(), (int) p.getY(), (int) p.getSize(), (int) p.getSize());
            }
        }
        switch (model.getGameState()) {
            case MENU: menuRenderer.render(g, model); break;
            case PLAYER_MODE_SELECTION: playerModeSelection(g, model); break;
            case DIFFICULTY_SELECTION: difficultySelection(g, model); break;
            case PLAYING: drawGame(g, model); break;
            case PAUSED: drawGame(g, model); overlay(g, "PAUSED", "ESC  -  RESUME", "ENTER  -  RETURN TO MENU"); break;
            case GAMEOVER: gameOver(g, model); break;
            case UPGRADES: upgrades(g, model); break;
            case SETTINGS: settings(g, model); break;
            case HOW_TO_PLAY: howToPlay(g); break;
            default: break;
        }
    }

    private void background(Graphics2D g, GameModel model) {
        GradientPaint paint = new GradientPaint(0, 0, new Color(3, 8, 28),
                GameModel.WIDTH, GameModel.HEIGHT, new Color(14, 8, 42));
        g.setPaint(paint);
        g.fillRect(0, 0, GameModel.WIDTH, GameModel.HEIGHT);
        g.setColor(new Color(35, 90, 190, 22)); g.fillOval(-180, 80, 600, 420);
        g.setColor(new Color(160, 50, 210, 18)); g.fillOval(470, 250, 520, 420);
    }

    private void drawGame(Graphics2D g, GameModel model) {
        drawPlayer(g, model.getPlayer());
        if (model.isTwoPlayerMode() && model.getSecondPlayer() != null) {
            drawSecondPlayer(g, model.getSecondPlayer());
        }
        for (Bullet b : model.getBullets()) drawBullet(g, b);
        for (Bomb b : model.getBombs()) drawBomb(g, b);
        for (Enemy e : model.getEnemies()) drawEnemy(g, e);
        for (PowerUp p : model.getPowerUps()) drawPowerUp(g, p);
        hudRenderer.render(g, model);
    }

    private void drawPlayer(Graphics2D g, Player p) {
        int width = 60;
        int height = 66;
        g.drawImage(playerShip, p.getX() + p.getWidth() / 2 - width / 2,
                p.getY() + p.getHeight() / 2 - height / 2, width, height, null);
    }

    private void drawSecondPlayer(Graphics2D g, Player p) {
        int width = 66;
        int height = 66;
        g.drawImage(secondPlayerShip, p.getX() + p.getWidth() / 2 - width / 2,
                p.getY() + p.getHeight() / 2 - height / 2, width, height, null);
    }

    private void drawPlayer(Graphics2D g, Player p, Color shipTint) {
        int x = p.getX(), y = p.getY(), w = p.getWidth(), h = p.getHeight();
        g.setColor(new Color(40, 235, 255, 45)); g.fillOval(x - 10, y - 10, w + 20, h + 26);
        g.setPaint(new GradientPaint(x, y, shipTint, x + w, y + h, new Color(35, 80, 170)));
        int[] xs = {x + w / 2, x + 5, x + 12, x + w - 12, x + w - 5};
        int[] ys = {y, y + h - 5, y + h, y + h, y + h - 5}; g.fillPolygon(xs, ys, xs.length);
        g.setColor(new Color(20, 35, 80)); g.fillOval(x + w / 2 - 6, y + 13, 12, 15);
        g.setColor(new Color(135, 250, 255)); g.fillOval(x + w / 2 - 3, y + 15, 6, 9);
        g.setColor(new Color(80, 220, 255)); g.fillRoundRect(x + 4, y + h - 8, 8, 8, 4, 4); g.fillRoundRect(x + w - 12, y + h - 8, 8, 8, 4, 4);
    }

    private void drawEnemy(Graphics2D g, Enemy e) {
        int x = (int) e.getX(), y = (int) e.getY();
        Color accent = e.getType().getDifficulty() == 2 ? new Color(255, 70, 175) : new Color(255, 180, 65);
        g.setColor(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 45)); g.fillOval(x - 8, y - 8, 48, 48);
        g.setColor(new Color(20, 25, 60)); g.fillRoundRect(x, y, 32, 32, 14, 14);
        g.setColor(accent); g.setStroke(new BasicStroke(2f)); g.drawRoundRect(x, y, 32, 32, 14, 14);
        g.fillRoundRect(x + 5, y + 8, 7, 10, 3, 3); g.fillRoundRect(x + 20, y + 8, 7, 10, 3, 3);
        g.setColor(new Color(230, 250, 255)); g.fillOval(x + 8, y + 10, 3, 4); g.fillOval(x + 21, y + 10, 3, 4);
    }

    private void drawBullet(Graphics2D g, Bullet b) {
        int x = b.getX(), y = b.getY(); Color color = b.isFromPlayer() ? new Color(65, 240, 255) : new Color(255, 75, 145);
        g.setColor(new Color(color.getRed(), color.getGreen(), color.getBlue(), 55)); g.fillOval(x - 8, y - 5, 16, 24);
        g.setColor(color); g.fillRoundRect(x - 2, y, 4, 13, 3, 3);
    }

    private void drawBomb(Graphics2D g, Bomb b) {
        int x = b.getX(), y = b.getY(); g.setColor(new Color(255, 55, 85, 65)); g.fillOval(x - 7, y - 7, 38, 38);
        g.setColor(new Color(35, 35, 45)); g.fillOval(x, y, 24, 24); g.setColor(new Color(255, 75, 95)); g.setStroke(new BasicStroke(2f)); g.drawOval(x, y, 24, 24);
        g.setColor(new Color(255, 220, 90)); g.fillOval(x + 8, y + 7, 8, 8);
    }

    private void drawPowerUp(Graphics2D g, PowerUp p) {
        int x = p.getX(), y = p.getY(); Color color = p.getType() == PowerUpType.EXTRA_LIFE ? new Color(75, 255, 180) : new Color(180, 115, 255);
        g.setColor(new Color(color.getRed(), color.getGreen(), color.getBlue(), 55)); g.fillOval(x - 6, y - 6, 34, 34);
        g.setColor(new Color(18, 25, 60)); g.fillRoundRect(x, y, 22, 22, 8, 8); g.setColor(color); g.setStroke(new BasicStroke(2f)); g.drawRoundRect(x, y, 22, 22, 8, 8);
        g.setFont(new Font("SansSerif", Font.BOLD, 15)); g.drawString(p.getType().getLabel(), x + 5, y + 16);
    }

    private void header(Graphics2D g, String title, String subtitle, Color color) {
        g.setColor(new Color(color.getRed(), color.getGreen(), color.getBlue(), 35)); g.fillOval(120, 20, 560, 105);
        g.setColor(color); g.setFont(new Font("SansSerif", Font.BOLD, 38)); MenuRenderer.centered(g, title, 400, 78);
        g.setColor(new Color(180, 220, 240)); g.setFont(new Font("Monospaced", Font.PLAIN, 12)); MenuRenderer.centered(g, subtitle, 400, 103);
    }

    private void card(Graphics2D g, int y, String title, String subtitle, String value, Color accent, boolean selected) {
        g.setColor(selected ? new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 105) : new Color(5, 16, 43, 225)); g.fillRoundRect(145, y, 510, 52, 16, 16);
        g.setColor(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), selected ? 240 : 145)); g.setStroke(new BasicStroke(selected ? 2.5f : 1.2f)); g.drawRoundRect(145, y, 510, 52, 16, 16);
        g.setColor(selected ? Color.WHITE : new Color(220, 235, 250)); g.setFont(new Font("SansSerif", Font.BOLD, 15)); g.drawString(title, 175, y + 22);
        g.setColor(new Color(155, 190, 215)); g.setFont(new Font("SansSerif", Font.PLAIN, 11)); g.drawString(subtitle, 175, y + 39);
        g.setColor(selected ? accent : new Color(185, 220, 235)); g.setFont(new Font("Monospaced", Font.BOLD, 13)); g.drawString(value, 535, y + 30);
    }

    private void upgrades(Graphics2D g, GameModel m) {
        header(g, "SHIP UPGRADES", "REINFORCE YOUR ARSENAL", new Color(175, 125, 255));
        g.setColor(new Color(255, 235, 150)); g.setFont(new Font("Monospaced", Font.BOLD, 14));
        MenuRenderer.centered(g, "POINTS  " + m.getProfileScore(), 400, 145);
        upgradeCard(g, m, UpgradeOption.DUAL_CANNONS, 170, "Fire two projectiles");
        upgradeCard(g, m, UpgradeOption.TRIPLE_CANNONS, 235, "Fire three projectiles");
        upgradeCard(g, m, UpgradeOption.DOUBLE_LIVES, 300, "Start missions with double lives");
        upgradeCard(g, m, UpgradeOption.INFINITE_LIVES, 365, "Damage never removes lives");
        card(g, 430, "RETURN TO HANGAR", "Back to main menu", "EXIT",
                new Color(255, 95, 180), m.getUpgradeSelection() == UpgradeOption.RETURN.ordinal());
    }

    private void upgradeCard(Graphics2D g, GameModel model, UpgradeOption option,
                             int y, String subtitle) {
        boolean selected = model.getUpgradeSelection() == option.ordinal();
        boolean owned = isUpgradeOwned(model, option);
        Color accent = option == UpgradeOption.DOUBLE_LIVES
                ? new Color(100, 255, 180) : new Color(120, 190, 255);
        String value = owned ? "OWNED" : option.getCost() + " PTS";
        card(g, y, option.getDisplayName(), subtitle, value, accent, selected);
    }

    private boolean isUpgradeOwned(GameModel model, UpgradeOption option) {
        switch (option) {
            case DUAL_CANNONS: return model.getOwnedWeaponLevel() >= 2;
            case TRIPLE_CANNONS: return model.getOwnedWeaponLevel() >= 3;
            case DOUBLE_LIVES: return model.hasDoubleLives();
            case INFINITE_LIVES: return model.hasInfiniteLives();
            default: return false;
        }
    }

    private void settings(Graphics2D g, GameModel m) {
        header(g, "SETTINGS", "SYSTEM CONFIGURATION", new Color(55, 245, 255));
        card(g, 205, "AUDIO OUTPUT", "Sound effects and menu music", m.isSoundEnabled() ? "ONLINE" : "MUTED", new Color(55, 245, 255), m.getSettingsSelection() == 0);
        card(g, 275, "PARTICLE FX", "Explosions and visual effects", m.isParticlesEnabled() ? "ONLINE" : "REDUCED", new Color(175, 125, 255), m.getSettingsSelection() == 1);
        card(g, 345, "RETURN TO HANGAR", "Back to main menu", "EXIT", new Color(255, 95, 180), m.getSettingsSelection() == 2);
    }

    private void playerModeSelection(Graphics2D g, GameModel model) {
        header(g, "SELECT PLAY MODE", "SOLO OR DUEL MISSION", new Color(55, 245, 255));
        String[] labels = {"1 PLAYER", "2 PLAYERS"};
        String[] descriptions = {"Solo run with keyboard controls", "Co-op mode with second ship"};
        Color[] accents = {new Color(100, 255, 180), new Color(175, 125, 255)};
        for (int i = 0; i < labels.length; i++) {
            int y = 220 + i * 100;
            boolean selected = model.getPlayerModeSelection() == i;
            card(g, y, labels[i], descriptions[i], selected ? "SELECTED" : "", accents[i], selected);
        }
        g.setColor(new Color(120, 170, 200, 150));
        g.setFont(new Font("Monospaced", Font.BOLD, 11));
        g.drawString("LEFT / RIGHT  SELECT", 30, 535);
        MenuRenderer.centered(g, "ENTER  CONFIRM", 400, 535);
        g.drawString("ESC  BACK", 650, 535);
    }

    private void difficultySelection(Graphics2D g, GameModel model) {
        header(g, "SELECT DIFFICULTY", "CHOOSE YOUR MISSION PROFILE", new Color(55, 245, 255));
        DifficultyLevel[] levels = DifficultyLevel.values();
        for (int i = 0; i < levels.length; i++) {
            DifficultyLevel level = levels[i];
            int y = 190 + i * 78;
            boolean selected = model.getDifficultySelection() == i;
            Color accent = i == 0
                    ? new Color(100, 255, 180)
                    : i == 1 ? new Color(55, 245, 255) : new Color(255, 95, 180);
            card(g, y, level.getDisplayName(), difficultyDescription(level),
                    selected ? "SELECTED" : "", accent, selected);
        }
        g.setColor(new Color(120, 170, 200, 150));
        g.setFont(new Font("Monospaced", Font.BOLD, 11));
        g.drawString("UP / DOWN  SELECT", 34, 535);
        MenuRenderer.centered(g, "ENTER  CONFIRM", 400, 535);
        g.drawString("ESC  BACK", 650, 535);
    }

    private String difficultyDescription(DifficultyLevel level) {
        switch (level) {
            case EASY: return "Fewer enemies and slower attacks";
            case HARD: return "More enemies and dangerous attacks";
            default: return "Balanced mission parameters";
        }
    }

    private void howToPlay(Graphics2D g) {
        header(g, "HOW TO PLAY", "MISSION CONTROL // FLIGHT MANUAL", new Color(255, 95, 180));
        card(g, 155, "MOVE SHIP 1", "LEFT / RIGHT", "← / →", new Color(55, 245, 255), false);
        card(g, 225, "FIRE WEAPONS 1", "hold for continuous fire", "SPACE", new Color(175, 125, 255), false);
        card(g, 295, "MOVE SHIP 2", "LEFT / RIGHT", "A / D", new Color(120, 230, 255), false);
        card(g, 365, "FIRE WEAPONS 2", "hold for continuous fire", "F", new Color(255, 180, 90), false);
        card(g, 435, "PAUSE / MENU", "ESC resumes / ENTER returns", "ESC", new Color(255, 95, 180), false);
    }

    private void overlay(Graphics2D g, String title, String first, String second) {
        g.setColor(new Color(2, 5, 25, 185)); g.fillRect(0, 0, 800, 600); g.setColor(new Color(110, 235, 255)); g.setFont(new Font("SansSerif", Font.BOLD, 52)); MenuRenderer.centered(g, title, 400, 225);
        g.setColor(Color.WHITE); g.setFont(new Font("SansSerif", Font.PLAIN, 21)); MenuRenderer.centered(g, first, 400, 315); MenuRenderer.centered(g, second, 400, 355);
    }

    private void gameOver(Graphics2D g, GameModel m) {
        g.setColor(new Color(255, 85, 150)); g.setFont(new Font("SansSerif", Font.BOLD, 58)); MenuRenderer.centered(g, "MISSION FAILED", 400, 230);
        g.setColor(Color.WHITE); g.setFont(new Font("SansSerif", Font.PLAIN, 24)); MenuRenderer.centered(g, "FINAL SCORE: " + m.getPlayer().getScore(), 400, 310); MenuRenderer.centered(g, "WAVES SURVIVED: " + m.getWave(), 400, 350);
        g.setColor(new Color(110, 235, 255)); g.setFont(new Font("SansSerif", Font.BOLD, 18)); MenuRenderer.centered(g, "PRESS ENTER TO RETURN TO MENU", 400, 430);
    }
}
