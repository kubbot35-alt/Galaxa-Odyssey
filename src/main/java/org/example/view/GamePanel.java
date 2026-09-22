package org.example.view;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.image.BufferedImage;
import java.util.ArrayList;
import java.util.Iterator;
import org.example.model.Bullet;
import org.example.model.Enemy;
import org.example.model.GameState;
import org.example.model.Particle;
import org.example.model.Player;
import org.example.model.PowerUp;
import org.example.model.Star;

class GamePanel extends JPanel implements ActionListener, KeyListener {
    private final Timer timer;
    private GameState gameState = GameState.MENU;

    private Player player;
    private final ArrayList<Bullet> bullets = new ArrayList<>();
    private final ArrayList<Enemy> enemies = new ArrayList<>();
    private final ArrayList<PowerUp> powerUps = new ArrayList<>();
    private final ArrayList<Particle> particles = new ArrayList<>();
    private final ArrayList<Star> stars = new ArrayList<>();
    private final BufferedImage menuBackground;
    private final BufferedImage startMissionButton;
    private final BufferedImage settingsButton;
    private final BufferedImage howToPlayButton;

    private boolean particlesEnabled = true;
    private boolean spaceHeld;
    private int fireCooldown;
    private int waveCount = 0;
    private int credits;
    private int highScore;
    private int ownedWeaponLevel = 1;

    private int menuSelection = 0;
    private int upgradeSelection = 0;
    private int settingsSelection = 0;

    public GamePanel() {
        setPreferredSize(new Dimension(800, 600));
        setBackground(Color.BLACK);
        setFocusable(true);
        addKeyListener(this);
        menuBackground = ResourceLoader.loadImage("menu/menu-background.png");
        startMissionButton = ResourceLoader.loadImage("menu/buttons/start-mission.png");
        settingsButton = ResourceLoader.loadImage("menu/buttons/settings.png");
        howToPlayButton = ResourceLoader.loadImage("menu/buttons/how-to-play.png");
        addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent event) {
                if (gameState == GameState.MENU) {
                    int clickedButton = getMenuButtonAt(event.getPoint());
                    if (clickedButton >= 0) {
                        menuSelection = clickedButton;
                        activateMenuSelection();
                    }
                } else if (gameState == GameState.HOW_TO_PLAY
                        && event.getButton() == MouseEvent.BUTTON1) {
                    gameState = GameState.MENU;
                    SoundEffects.startMenuMusic();
                } else if (gameState == GameState.UPGRADES
                        && event.getButton() == MouseEvent.BUTTON1) {
                    if (new Rectangle(170, 100, 460, 60).contains(event.getPoint())) {
                        upgradeSelection = 0;
                        activateUpgradeSelection();
                    } else if (new Rectangle(170, 180, 460, 60).contains(event.getPoint())) {
                        upgradeSelection = 1;
                        activateUpgradeSelection();
                    } else if (new Rectangle(170, 260, 460, 60).contains(event.getPoint())) {
                        upgradeSelection = 2;
                        activateUpgradeSelection();
                    }
                }
                requestFocusInWindow();
            }
        });

        for (int i = 0; i < 120; i++) {
            stars.add(new Star(800, 600));
        }

        SoundEffects.startMenuMusic();
        timer = new Timer(16, this);
        timer.start();
    }

    private void initGame() {
        player = new Player(380, 520);
        player.weaponLevel = startingWeaponLevel();
        bullets.clear();
        enemies.clear();
        powerUps.clear();
        particles.clear();
        waveCount = 0;
        spaceHeld = false;
        fireCooldown = 0;
        spawnNextWave();
    }

    private void spawnNextWave() {
        waveCount++;
        int rows = Math.min(5, 2 + waveCount / 2);
        int cols = 8;

        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < cols; col++) {
                int type = (row == 0) ? 2 : 1;
                enemies.add(new Enemy(100 + col * 75, 40 + row * 45, type));
            }
        }
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        for (Star star : stars) {
            star.update(600);
        }

        if (gameState == GameState.PLAYING) {
            player.update(800);
            if (fireCooldown > 0) {
                fireCooldown--;
            }
            if (spaceHeld && fireCooldown == 0) {
                firePlayerWeapon();
            }

            Iterator<Bullet> bIter = bullets.iterator();
            while (bIter.hasNext()) {
                Bullet b = bIter.next();
                b.update();
                if (b.y < -20 || b.y > 620) {
                    bIter.remove();
                }
            }

            Iterator<Enemy> eIter = enemies.iterator();
            while (eIter.hasNext()) {
                Enemy en = eIter.next();
                en.update(waveCount);

                if (en.getBounds().intersects(player.getBounds())) {
                    damagePlayer(35);
                    eIter.remove();
                    continue;
                }

                if (en.y > 600) {
                    eIter.remove();
                }
            }

            Iterator<Bullet> enemyBulletIterator = bullets.iterator();
            while (enemyBulletIterator.hasNext()) {
                Bullet bullet = enemyBulletIterator.next();
                if (!bullet.fromPlayer && bullet.getBounds().intersects(player.getBounds())) {
                    enemyBulletIterator.remove();
                    damagePlayer(20);
                }
            }

            bIter = bullets.iterator();
            while (bIter.hasNext()) {
                Bullet b = bIter.next();
                if (b.fromPlayer) {
                    Iterator<Enemy> innerEIter = enemies.iterator();
                    while (innerEIter.hasNext()) {
                        Enemy en = innerEIter.next();
                        if (b.getBounds().intersects(en.getBounds())) {
                            createExplosion(en.x + 16, en.y + 16, Color.MAGENTA, 25);
                            SoundEffects.playSound("explosion");
                            player.score += (en.type == 2) ? 150 : 100;
                            credits += en.type == 2 ? 15 : 10;
                            highScore = Math.max(highScore, player.score);

                            if (Math.random() < 0.15) {
                                powerUps.add(new PowerUp((int) en.x, (int) en.y, Math.random() < 0.5 ? 1 : 2));
                            }

                            innerEIter.remove();
                            bIter.remove();
                            break;
                        }
                    }
                }
            }

            for (Enemy en : enemies) {
                if (Math.random() < 0.0015 + (waveCount * 0.0005)) {
                    bullets.add(new Bullet((int) en.x + en.width / 2, (int) en.y + en.height, false));
                }
            }

            if (enemies.isEmpty()) {
                spawnNextWave();
            }

            Iterator<PowerUp> pIter = powerUps.iterator();
            while (pIter.hasNext()) {
                PowerUp pu = pIter.next();
                pu.update();
                if (pu.getBounds().intersects(player.getBounds())) {
                    SoundEffects.playSound("powerup");
                    if (pu.type == 1) {
                        player.lives++;
                    } else {
                        player.weaponLevel = Math.min(3, player.weaponLevel + 1);
                    }
                    pIter.remove();
                } else if (pu.y > 600) {
                    pIter.remove();
                }
            }
        }

        if (particlesEnabled) {
            Iterator<Particle> partIter = particles.iterator();
            while (partIter.hasNext()) {
                Particle p = partIter.next();
                p.update();
                if (p.life <= 0) {
                    partIter.remove();
                }
            }
        }

        repaint();
    }

    private void createExplosion(double x, double y, Color color, int count) {
        if (!particlesEnabled) return;
        for (int i = 0; i < count; i++) {
            double angle = Math.random() * Math.PI * 2;
            double speed = 1.5 + Math.random() * 4.5;
            particles.add(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 35, 5f));
        }
    }

    private void firePlayerWeapon() {
        SoundEffects.playSound("shoot");
        if (player.weaponLevel == 1) {
            bullets.add(new Bullet(player.x + player.width / 2, player.y, true));
        } else if (player.weaponLevel == 2) {
            bullets.add(new Bullet(player.x + 8, player.y, true));
            bullets.add(new Bullet(player.x + player.width - 8, player.y, true));
        } else {
            bullets.add(new Bullet(player.x + player.width / 2, player.y - 4, true));
            bullets.add(new Bullet(player.x + 2, player.y, true));
            bullets.add(new Bullet(player.x + player.width - 2, player.y, true));
        }
        fireCooldown = Math.max(5, 12 - player.weaponLevel * 2);
    }

    private void damagePlayer(int damage) {
        if (player.shield > 0) {
            player.shield = Math.max(0, player.shield - damage);
        } else {
            player.lives--;
            player.shield = 100;
            createExplosion(player.x + 20, player.y + 20, new Color(80, 210, 255), 32);
            SoundEffects.playSound("explosion");
            if (player.lives <= 0) {
                gameState = GameState.GAMEOVER;
            }
        }
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2d = (Graphics2D) g;
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

        drawModernSpaceBackground(g2d);

        for (Star star : stars) {
            star.draw(g2d);
        }

        if (particlesEnabled) {
            for (Particle p : particles) {
                p.draw(g2d);
            }
        }

        switch (gameState) {
            case MENU:
                drawMenu(g2d);
                break;
            case SETTINGS:
                drawSettings(g2d);
                break;
            case UPGRADES:
                drawUpgrades(g2d);
                break;
            case HOW_TO_PLAY:
                drawHowToPlay(g2d);
                break;
            case PLAYING:
                drawGame(g2d);
                break;
            case GAMEOVER:
                drawGameOver(g2d);
                break;
        }
    }

    private void drawMenu(Graphics2D g2d) {
        drawMenuBackground(g2d);
        drawMenuTitle(g2d);
        drawProfileBar(g2d);
        drawMenuCard(g2d, 0, "PLAY", "START A NEW MISSION", new Color(35, 220, 255));
        drawMenuCard(g2d, 1, "UPGRADES", "IMPROVE YOUR SHIP", new Color(180, 125, 255));
        drawMenuCard(g2d, 2, "SETTINGS", "AUDIO AND VISUALS", new Color(35, 220, 255));
        drawMenuCard(g2d, 3, "HOW TO PLAY", "CONTROLS AND TIPS", new Color(255, 95, 180));
    }

    private void drawProfileBar(Graphics2D g2d) {
        g2d.setColor(new Color(5, 15, 40, 220));
        g2d.fillRoundRect(55, 188, 690, 34, 17, 17);
        g2d.setColor(new Color(80, 210, 255, 150));
        g2d.drawRoundRect(55, 188, 690, 34, 17, 17);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 14));
        g2d.setColor(new Color(160, 235, 255));
        g2d.drawString("PILOT 01", 75, 211);
        g2d.drawString("CREDITS  " + credits, 330, 211);
        g2d.drawString("BEST SCORE  " + highScore, 565, 211);
    }

    private void drawMenuCard(Graphics2D g2d, int index, String title, String subtitle, Color accent) {
        int y = 240 + index * 78;
        boolean selected = menuSelection == index;
        g2d.setColor(selected ? new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 190)
                : new Color(5, 15, 40, 220));
        g2d.fillRoundRect(150, y, 500, 62, 18, 18);
        g2d.setColor(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), selected ? 245 : 130));
        g2d.setStroke(new BasicStroke(selected ? 2.5f : 1f));
        g2d.drawRoundRect(150, y, 500, 62, 18, 18);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 21));
        g2d.setColor(selected ? Color.WHITE : accent);
        g2d.drawString(title, 185, y + 28);
        g2d.setFont(new Font("SansSerif", Font.PLAIN, 12));
        g2d.setColor(selected ? new Color(225, 245, 255) : new Color(155, 180, 210));
        g2d.drawString(subtitle, 185, y + 47);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 22));
        g2d.drawString(">", 612, y + 38);
    }

    private void drawMenuBackground(Graphics2D g2d) {
        g2d.drawImage(menuBackground, 0, 0, getWidth(), getHeight(), null);
        g2d.setColor(new Color(2, 5, 25, 80));
        g2d.fillRect(0, 0, getWidth(), getHeight());
    }

    private void drawModernSpaceBackground(Graphics2D g2d) {
        GradientPaint background = new GradientPaint(
                0, 0, new Color(3, 8, 28),
                getWidth(), getHeight(), new Color(14, 8, 42));
        g2d.setPaint(background);
        g2d.fillRect(0, 0, getWidth(), getHeight());

        g2d.setColor(new Color(35, 90, 190, 22));
        g2d.fillOval(-180, 80, 600, 420);
        g2d.setColor(new Color(160, 50, 210, 18));
        g2d.fillOval(470, 250, 520, 420);
    }

    private void drawMenuTitle(Graphics2D g2d) {
        g2d.setColor(new Color(55, 245, 255));
        g2d.setFont(new Font("SansSerif", Font.BOLD, 52));
        drawCenteredString(g2d, "GALAXIA", getWidth() / 2, 78);

        g2d.setColor(new Color(175, 125, 255));
        g2d.setFont(new Font("SansSerif", Font.BOLD, 52));
        drawCenteredString(g2d, "ODYSSEY", getWidth() / 2, 134);

        g2d.setColor(new Color(120, 235, 255));
        g2d.setFont(new Font("SansSerif", Font.PLAIN, 15));
        drawCenteredString(g2d, "FUTURISTIC SPACE SHOOTER", getWidth() / 2, 172);
    }

    private void drawMenuButton(Graphics2D g2d, BufferedImage buttonImage, int y,
                                boolean selected, Color accent) {
        int x = 170;
        int width = 460;
        int height = 113;

        g2d.drawImage(buttonImage, x, y, width, height, null);
        if (selected) {
            g2d.setColor(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 90));
            g2d.setStroke(new BasicStroke(3f));
            g2d.drawRoundRect(x, y, width, height, 25, 25);
        }
    }

    private int getMenuButtonAt(Point point) {
        for (int i = 0; i < 4; i++) {
            if (new Rectangle(150, 240 + i * 78, 500, 62).contains(point)) return i;
        }
        return -1;
    }

    private void activateMenuSelection() {
        if (menuSelection == 0) {
            SoundEffects.stopMenuMusic();
            initGame();
            gameState = GameState.PLAYING;
        } else if (menuSelection == 1) {
            SoundEffects.stopMenuMusic();
            gameState = GameState.UPGRADES;
        } else if (menuSelection == 2) {
            SoundEffects.stopMenuMusic();
            gameState = GameState.SETTINGS;
        } else if (menuSelection == 3) {
            SoundEffects.stopMenuMusic();
            gameState = GameState.HOW_TO_PLAY;
        }
    }

    private int startingWeaponLevel() {
        return ownedWeaponLevel;
    }

    private void drawUpgrades(Graphics2D g2d) {
        drawModernSpaceBackground(g2d);
        g2d.setColor(new Color(110, 235, 255));
        g2d.setFont(new Font("SansSerif", Font.BOLD, 38));
        drawCenteredString(g2d, "SHIP UPGRADES", getWidth() / 2, 92);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 16));
        g2d.setColor(new Color(180, 225, 245));
        drawCenteredString(g2d, "CREDITS  " + credits, getWidth() / 2, 124);

        drawUpgradeCard(g2d, 0, "DUAL CANNONS", "Fire two projectiles", 100, 2, 120);
        drawUpgradeCard(g2d, 1, "TRIPLE CANNONS", "Fire three projectiles", 180, 3, 260);
        drawUpgradeCard(g2d, 2, "RETURN TO HANGAR", "Back to main menu", 260, 0, 0);

        g2d.setFont(new Font("SansSerif", Font.PLAIN, 14));
        g2d.setColor(new Color(170, 210, 230));
        drawCenteredString(g2d, "UP / DOWN: SELECT     ENTER: CONFIRM     ESC: BACK", getWidth() / 2, 430);
    }

    private void drawUpgradeCard(Graphics2D g2d, int index, String title, String subtitle,
                                 int y, int level, int cost) {
        boolean selected = upgradeSelection == index;
        Color accent = index == 2 ? new Color(255, 95, 180) : new Color(120, 190, 255);
        g2d.setColor(selected ? new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 150)
                : new Color(8, 18, 45, 220));
        g2d.fillRoundRect(170, y, 460, 60, 16, 16);
        g2d.setColor(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 190));
        g2d.drawRoundRect(170, y, 460, 60, 16, 16);
        g2d.setColor(Color.WHITE);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 17));
        g2d.drawString(title, 195, y + 25);
        g2d.setFont(new Font("SansSerif", Font.PLAIN, 13));
        g2d.drawString(subtitle, 195, y + 45);
        if (cost > 0 && ownedWeaponLevel >= level) {
            g2d.setColor(new Color(100, 255, 180));
            g2d.drawString("OWNED", 535, y + 34);
        } else if (cost > 0) {
            g2d.drawString(cost + " CR", 535, y + 34);
        }
    }

    private void activateUpgradeSelection() {
        if (upgradeSelection == 0 && ownedWeaponLevel < 2 && credits >= 120) {
            credits -= 120;
            ownedWeaponLevel = 2;
            SoundEffects.playSound("powerup");
        } else if (upgradeSelection == 1 && ownedWeaponLevel < 3 && credits >= 260) {
            credits -= 260;
            ownedWeaponLevel = 3;
            SoundEffects.playSound("powerup");
        } else if (upgradeSelection == 2) {
            gameState = GameState.MENU;
            SoundEffects.startMenuMusic();
        }
    }

    private void drawCenteredString(Graphics2D g2d, String text, int centerX, int baselineY) {
        FontMetrics metrics = g2d.getFontMetrics();
        g2d.drawString(text, centerX - metrics.stringWidth(text) / 2, baselineY);
    }

    private void drawSettings(Graphics2D g2d) {
        drawModernSpaceBackground(g2d);
        g2d.setColor(new Color(110, 235, 255));
        g2d.setFont(new Font("SansSerif", Font.BOLD, 42));
        drawCenteredString(g2d, "SETTINGS", getWidth() / 2, 150);

        g2d.setFont(new Font("SansSerif", Font.BOLD, 22));
        String soundStatus = SoundEffects.isSoundEnabled() ? "[ ON ]" : "[ OFF ]";
        String partStatus = particlesEnabled ? "[ ON ]" : "[ OFF ]";

        String[] options = {
                "Sound Effects: " + soundStatus,
                "Particle FX:   " + partStatus,
                "BACK TO MENU"
        };

        for (int i = 0; i < options.length; i++) {
            if (i == settingsSelection) {
                g2d.setColor(Color.YELLOW);
                g2d.drawString("> " + options[i], 220, 260 + i * 50);
            } else {
                g2d.setColor(Color.WHITE);
                g2d.drawString(options[i], 240, 260 + i * 50);
            }
        }
    }

    private void drawHowToPlay(Graphics2D g2d) {
        drawMenuBackground(g2d);
        g2d.setColor(new Color(85, 235, 255));
        g2d.setFont(new Font("SansSerif", Font.BOLD, 38));
        drawCenteredString(g2d, "HOW TO PLAY", getWidth() / 2, 130);

        g2d.setColor(Color.WHITE);
        g2d.setFont(new Font("SansSerif", Font.PLAIN, 20));
        drawCenteredString(g2d, "A / LEFT and D / RIGHT  - MOVE", getWidth() / 2, 230);
        drawCenteredString(g2d, "SPACE                   - FIRE", getWidth() / 2, 275);
        drawCenteredString(g2d, "ENTER                   - SELECT", getWidth() / 2, 320);

        g2d.setColor(new Color(235, 80, 170));
        g2d.setFont(new Font("Monospaced", Font.BOLD, 18));
        drawCenteredString(g2d, "PRESS ENTER TO RETURN", getWidth() / 2, 470);
    }

    private void drawGame(Graphics2D g2d) {
        player.draw(g2d);

        for (Bullet b : bullets) {
            b.draw(g2d);
        }

        for (Enemy en : enemies) {
            en.draw(g2d);
        }

        for (PowerUp pu : powerUps) {
            pu.draw(g2d);
        }

        drawHud(g2d);
    }

    private void drawHud(Graphics2D g2d) {
        g2d.setColor(new Color(8, 15, 42, 215));
        g2d.fillRoundRect(16, 14, getWidth() - 32, 42, 18, 18);
        g2d.setColor(new Color(80, 210, 255, 170));
        g2d.setStroke(new BasicStroke(1.5f));
        g2d.drawRoundRect(16, 14, getWidth() - 32, 42, 18, 18);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 16));
        g2d.setColor(new Color(170, 240, 255));
        g2d.drawString("SCORE  " + player.score, 32, 41);
        drawCenteredString(g2d, "WAVE  " + waveCount, getWidth() / 2, 41);
        g2d.drawString("LIVES  " + player.lives, getWidth() - 115, 41);
        g2d.setColor(new Color(120, 235, 255));
        g2d.drawString("SHIELD", 32, 76);
        g2d.setColor(new Color(30, 45, 75, 220));
        g2d.fillRoundRect(102, 64, 120, 10, 5, 5);
        g2d.setColor(new Color(70, 220, 255));
        g2d.fillRoundRect(102, 64, (int) (120 * player.shield / 100.0), 10, 5, 5);
    }

    private void drawGameOver(Graphics2D g2d) {
        drawModernSpaceBackground(g2d);
        g2d.setColor(new Color(255, 85, 150));
        g2d.setFont(new Font("SansSerif", Font.BOLD, 58));
        drawCenteredString(g2d, "MISSION FAILED", getWidth() / 2, 230);

        g2d.setColor(Color.WHITE);
        g2d.setFont(new Font("SansSerif", Font.PLAIN, 24));
        drawCenteredString(g2d, "FINAL SCORE: " + player.score, getWidth() / 2, 310);
        drawCenteredString(g2d, "WAVES SURVIVED: " + waveCount, getWidth() / 2, 350);

        g2d.setColor(new Color(110, 235, 255));
        g2d.setFont(new Font("SansSerif", Font.BOLD, 18));
        drawCenteredString(g2d, "PRESS ENTER TO RETURN TO MENU", getWidth() / 2, 430);
    }

    @Override
    public void keyPressed(KeyEvent e) {
        int code = e.getKeyCode();

        if (gameState == GameState.MENU) {
            if (code == KeyEvent.VK_UP || code == KeyEvent.VK_W) {
                menuSelection = (menuSelection - 1 + 4) % 4;
            } else if (code == KeyEvent.VK_DOWN || code == KeyEvent.VK_S) {
                menuSelection = (menuSelection + 1) % 4;
            } else if (code == KeyEvent.VK_ENTER) {
                activateMenuSelection();
            }
        } else if (gameState == GameState.SETTINGS) {
            if (code == KeyEvent.VK_UP || code == KeyEvent.VK_W) {
                settingsSelection = (settingsSelection - 1 + 3) % 3;
            } else if (code == KeyEvent.VK_DOWN || code == KeyEvent.VK_S) {
                settingsSelection = (settingsSelection + 1) % 3;
            } else if (code == KeyEvent.VK_ENTER) {
                if (settingsSelection == 0) {
                    SoundEffects.setSoundEnabled(!SoundEffects.isSoundEnabled());
                } else if (settingsSelection == 1) {
                    particlesEnabled = !particlesEnabled;
                } else if (settingsSelection == 2) {
                    gameState = GameState.MENU;
                    SoundEffects.startMenuMusic();
                }
            }
        } else if (gameState == GameState.UPGRADES) {
            if (code == KeyEvent.VK_UP || code == KeyEvent.VK_W) {
                upgradeSelection = (upgradeSelection - 1 + 3) % 3;
            } else if (code == KeyEvent.VK_DOWN || code == KeyEvent.VK_S) {
                upgradeSelection = (upgradeSelection + 1) % 3;
            } else if (code == KeyEvent.VK_ENTER) {
                activateUpgradeSelection();
            } else if (code == KeyEvent.VK_ESCAPE) {
                gameState = GameState.MENU;
                SoundEffects.startMenuMusic();
            }
        } else if (gameState == GameState.HOW_TO_PLAY) {
            if (code == KeyEvent.VK_ENTER || code == KeyEvent.VK_ESCAPE) {
                gameState = GameState.MENU;
                SoundEffects.startMenuMusic();
            }
        } else if (gameState == GameState.PLAYING) {
            if (code == KeyEvent.VK_LEFT || code == KeyEvent.VK_A) player.left = true;
            if (code == KeyEvent.VK_RIGHT || code == KeyEvent.VK_D) player.right = true;

            if (code == KeyEvent.VK_SPACE) {
                spaceHeld = true;
                if (fireCooldown == 0) {
                    firePlayerWeapon();
                }
            }
        } else if (gameState == GameState.GAMEOVER) {
            if (code == KeyEvent.VK_ENTER) {
                gameState = GameState.MENU;
                SoundEffects.startMenuMusic();
            }
        }
    }

    @Override
    public void keyReleased(KeyEvent e) {
        int code = e.getKeyCode();
        if (gameState == GameState.PLAYING) {
            if (code == KeyEvent.VK_LEFT || code == KeyEvent.VK_A) player.left = false;
            if (code == KeyEvent.VK_RIGHT || code == KeyEvent.VK_D) player.right = false;
            if (code == KeyEvent.VK_SPACE) spaceHeld = false;
        }
    }

    @Override
    public void keyTyped(KeyEvent e) {}
}
