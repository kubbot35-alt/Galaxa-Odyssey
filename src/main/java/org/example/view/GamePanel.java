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
import org.example.controller.GameSaveController;
import org.example.model.Bomb;
import org.example.model.Bullet;
import org.example.model.Enemy;
import org.example.model.GameSave;
import org.example.model.GameState;
import org.example.model.Particle;
import org.example.model.Player;
import org.example.model.PowerUp;
import org.example.model.Star;

class GamePanel extends JPanel implements ActionListener, KeyListener {
    private final Timer timer;
    private final GameSaveController saveController = new GameSaveController();
    private GameState gameState = GameState.MENU;

    private Player player;
    private final ArrayList<Bullet> bullets = new ArrayList<>();
    private final ArrayList<Bomb> bombs = new ArrayList<>();
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
                    if (new Rectangle(170, 170, 460, 60).contains(event.getPoint())) {
                        upgradeSelection = 0;
                        activateUpgradeSelection();
                    } else if (new Rectangle(170, 250, 460, 60).contains(event.getPoint())) {
                        upgradeSelection = 1;
                        activateUpgradeSelection();
                    } else if (new Rectangle(170, 330, 460, 60).contains(event.getPoint())) {
                        upgradeSelection = 2;
                        activateUpgradeSelection();
                    }
                } else if (gameState == GameState.SETTINGS
                        && event.getButton() == MouseEvent.BUTTON1) {
                    if (new Rectangle(145, 205, 510, 52).contains(event.getPoint())) {
                        settingsSelection = 0;
                        activateSettingsSelection();
                    } else if (new Rectangle(145, 275, 510, 52).contains(event.getPoint())) {
                        settingsSelection = 1;
                        activateSettingsSelection();
                    } else if (new Rectangle(145, 345, 510, 52).contains(event.getPoint())) {
                        settingsSelection = 2;
                        activateSettingsSelection();
                    }
                }
                requestFocusInWindow();
            }
        });

        for (int i = 0; i < 120; i++) {
            stars.add(new Star(800, 600));
        }

        loadProfileState();
        SoundEffects.startMenuMusic();
        timer = new Timer(16, this);
        timer.start();
    }

    private void loadProfileState() {
        GameSave savedGame = saveController.load();
        if (savedGame != null) {
            highScore = savedGame.getScore();
            credits = savedGame.getCredits();
            ownedWeaponLevel = savedGame.getOwnedWeaponLevel();
        }
    }

    private void initGame() {
        GameSave savedGame = saveController.load();
        if (savedGame == null) {
            player = new Player(380, 520);
            player.weaponLevel = startingWeaponLevel();
            waveCount = 0;
        } else {
            player = new Player(380, 520);
            player.lives = savedGame.getLives();
            player.weaponLevel = savedGame.getWeaponLevel();
            player.score = savedGame.getScore();
            highScore = Math.max(highScore, savedGame.getScore());
            waveCount = Math.max(0, savedGame.getStage() - 1);
            credits = savedGame.getCredits();
            ownedWeaponLevel = savedGame.getOwnedWeaponLevel();
        }
        bullets.clear();
        bombs.clear();
        enemies.clear();
        powerUps.clear();
        particles.clear();
        spaceHeld = false;
        fireCooldown = 0;
        spawnNextWave();
    }

    private void saveGame() {
        if (player == null) {
            return;
        }
        GameSave save = new GameSave(
                player.lives,
                player.weaponLevel,
                player.score,
                waveCount,
                credits,
                ownedWeaponLevel
        );
        saveController.save(save);
    }

    public void saveGameOnExit() {
        if (player != null) {
            saveGame();
        }
        timer.stop();
    }

    private void pauseGame() {
        if (gameState != GameState.PLAYING) {
            return;
        }
        spaceHeld = false;
        player.left = false;
        player.right = false;
        saveGame();
        gameState = GameState.PAUSED;
    }

    private void resumeGame() {
        if (gameState == GameState.PAUSED) {
            gameState = GameState.PLAYING;
        }
    }

    private void returnToMenuFromPause() {
        if (gameState != GameState.PAUSED) {
            return;
        }
        spaceHeld = false;
        player.left = false;
        player.right = false;
        gameState = GameState.MENU;
        SoundEffects.startMenuMusic();
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
        if (gameState == GameState.PLAYING) {
            for (Star star : stars) {
                star.update(600);
            }
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
                    damagePlayer(Math.min(70, 40 + waveCount / 3));
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
                    damagePlayer(Math.min(45, 25 + waveCount / 4));
                }
            }

            bIter = bullets.iterator();
            while (bIter.hasNext()) {
                Bullet b = bIter.next();
                if (b.fromPlayer) {
                    Iterator<Bomb> bombIterator = bombs.iterator();
                    while (bombIterator.hasNext()) {
                        Bomb bomb = bombIterator.next();
                        if (b.getBounds().intersects(bomb.getBounds())) {
                            bIter.remove();
                            bombIterator.remove();
                            explodeBomb(bomb);
                            return;
                        }
                    }

                    Iterator<Enemy> innerEIter = enemies.iterator();
                    while (innerEIter.hasNext()) {
                        Enemy en = innerEIter.next();
                        if (b.getBounds().intersects(en.getBounds())) {
                            createExplosion(en.x + 16, en.y + 16, Color.MAGENTA, 25);
                            SoundEffects.playSound("explosion");
                            player.score += (en.type == 2) ? 150 : 100;
                            credits += en.type == 2 ? 15 : 10;
                            highScore = Math.max(highScore, player.score);

                            if (Math.random() < 0.08) {
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
                double firingChance = Math.min(0.012, 0.0025 + waveCount * 0.0007);
                if (Math.random() < firingChance) {
                    bullets.add(new Bullet((int) en.x + en.width / 2, (int) en.y + en.height, false));
                }
            }

            double bombChance = Math.min(0.0012, 0.0002 + waveCount * 0.00008);
            if (Math.random() < bombChance) {
                bombs.add(new Bomb(30 + (int) (Math.random() * 740), -30,
                        3 + Math.min(3, waveCount / 5)));
            }

            Iterator<Bomb> bombIterator = bombs.iterator();
            while (bombIterator.hasNext()) {
                Bomb bomb = bombIterator.next();
                bomb.update();
                if (bomb.getBounds().intersects(player.getBounds())) {
                    bombIterator.remove();
                    explodeBomb(bomb);
                    return;
                }
                if (bomb.y > getHeight()) {
                    bombIterator.remove();
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

        if (gameState == GameState.PLAYING && particlesEnabled) {
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
                saveController.deleteSave();
                gameState = GameState.GAMEOVER;
            }
        }
    }

    private void explodeBomb(Bomb bomb) {
        createExplosion(bomb.x + 12, bomb.y + 12, new Color(255, 70, 80), 45);
        SoundEffects.playSound("explosion");
        saveController.deleteSave();
        spaceHeld = false;
        player.left = false;
        player.right = false;
        gameState = GameState.GAMEOVER;
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
            case PAUSED:
                drawGame(g2d);
                drawPause(g2d);
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
        drawScreenHeader(g2d, "SHIP UPGRADES", "REINFORCE YOUR ARSENAL", new Color(175, 125, 255));
        drawCreditsBadge(g2d);

        drawUpgradeCard(g2d, 0, "DUAL CANNONS", "Fire two projectiles", 170, 2, 120);
        drawUpgradeCard(g2d, 1, "TRIPLE CANNONS", "Fire three projectiles", 250, 3, 260);
        drawUpgradeCard(g2d, 2, "RETURN TO HANGAR", "Back to main menu", 330, 0, 0);

        drawFooterHint(g2d, "UP / DOWN  SELECT", "ENTER  CONFIRM", "ESC  BACK");
    }

    private void drawUpgradeCard(Graphics2D g2d, int index, String title, String subtitle,
                                 int y, int level, int cost) {
        boolean selected = upgradeSelection == index;
        Color accent = index == 2 ? new Color(255, 95, 180) : new Color(120, 190, 255);
        drawCard(g2d, 170, y, 460, 60, accent, selected);
        g2d.setColor(selected ? Color.WHITE : new Color(220, 235, 250));
        g2d.setFont(new Font("SansSerif", Font.BOLD, 17));
        g2d.drawString(title, 195, y + 25);
        g2d.setColor(new Color(165, 195, 220));
        g2d.setFont(new Font("SansSerif", Font.PLAIN, 13));
        g2d.drawString(subtitle, 195, y + 45);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 13));
        if (cost > 0 && ownedWeaponLevel >= level) {
            g2d.setColor(new Color(100, 255, 180));
            g2d.drawString("OWNED", 535, y + 34);
        } else if (cost > 0) {
            g2d.setColor(credits >= cost ? new Color(255, 220, 100) : new Color(255, 120, 140));
            g2d.drawString(cost + " CR", 535, y + 34);
        } else {
            g2d.setColor(accent);
            g2d.drawString("EXIT", 548, y + 34);
        }
    }

    private void drawSettings(Graphics2D g2d) {
        drawModernSpaceBackground(g2d);
        drawScreenHeader(g2d, "SETTINGS", "SYSTEM CONFIGURATION", new Color(55, 245, 255));

        drawSettingsCard(g2d, 0, "AUDIO OUTPUT", "Sound effects and menu music",
                SoundEffects.isSoundEnabled() ? "ONLINE" : "MUTED", new Color(55, 245, 255), 205);
        drawSettingsCard(g2d, 1, "PARTICLE FX", "Explosions and visual effects",
                particlesEnabled ? "ONLINE" : "REDUCED", new Color(175, 125, 255), 275);
        drawSettingsCard(g2d, 2, "RETURN TO HANGAR", "Back to main menu",
                "EXIT", new Color(255, 95, 180), 345);

        drawFooterHint(g2d, "UP / DOWN  SELECT", "ENTER  TOGGLE", "ESC  BACK");
    }

    private void drawSettingsCard(Graphics2D g2d, int index, String title, String subtitle,
                                 String value, Color accent, int y) {
        boolean selected = settingsSelection == index;
        drawCard(g2d, 145, y, 510, 52, accent, selected);
        g2d.setColor(selected ? Color.WHITE : new Color(220, 235, 250));
        g2d.setFont(new Font("SansSerif", Font.BOLD, 15));
        g2d.drawString(title, 175, y + 22);
        g2d.setColor(new Color(155, 190, 215));
        g2d.setFont(new Font("SansSerif", Font.PLAIN, 11));
        g2d.drawString(subtitle, 175, y + 39);
        g2d.setColor(selected ? accent : new Color(185, 220, 235));
        g2d.setFont(new Font("Monospaced", Font.BOLD, 13));
        g2d.drawString(value, 535, y + 30);
    }

    private void drawScreenHeader(Graphics2D g2d, String title, String subtitle, Color accent) {
        g2d.setColor(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 35));
        g2d.fillOval(120, 20, 560, 105);
        g2d.setColor(accent);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 38));
        drawCenteredString(g2d, title, getWidth() / 2, 78);
        g2d.setColor(new Color(180, 220, 240));
        g2d.setFont(new Font("Monospaced", Font.PLAIN, 12));
        drawCenteredString(g2d, subtitle, getWidth() / 2, 103);
    }

    private void drawCreditsBadge(Graphics2D g2d) {
        g2d.setColor(new Color(5, 18, 48, 230));
        g2d.fillRoundRect(300, 125, 200, 30, 15, 15);
        g2d.setColor(new Color(255, 220, 100, 180));
        g2d.drawRoundRect(300, 125, 200, 30, 15, 15);
        g2d.setColor(new Color(255, 235, 150));
        g2d.setFont(new Font("Monospaced", Font.BOLD, 14));
        drawCenteredString(g2d, "CREDITS  " + credits, getWidth() / 2, 145);
    }

    private void drawCard(Graphics2D g2d, int x, int y, int width, int height,
                          Color accent, boolean selected) {
        g2d.setColor(selected
                ? new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 105)
                : new Color(5, 16, 43, 225));
        g2d.fillRoundRect(x, y, width, height, 16, 16);
        g2d.setColor(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(),
                selected ? 240 : 145));
        g2d.setStroke(new BasicStroke(selected ? 2.5f : 1.2f));
        g2d.drawRoundRect(x, y, width, height, 16, 16);
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

    private void activateSettingsSelection() {
        if (settingsSelection == 0) {
            SoundEffects.setSoundEnabled(!SoundEffects.isSoundEnabled());
        } else if (settingsSelection == 1) {
            particlesEnabled = !particlesEnabled;
        } else if (settingsSelection == 2) {
            gameState = GameState.MENU;
            SoundEffects.startMenuMusic();
        }
    }

    private void drawCenteredString(Graphics2D g2d, String text, int centerX, int baselineY) {
        FontMetrics metrics = g2d.getFontMetrics();
        g2d.drawString(text, centerX - metrics.stringWidth(text) / 2, baselineY);
    }

    private void drawHowToPlay(Graphics2D g2d) {
        drawModernSpaceBackground(g2d);
        drawScreenHeader(g2d, "HOW TO PLAY", "MISSION CONTROL // FLIGHT MANUAL", new Color(255, 95, 180));
        drawControlCard(g2d, 0, "MOVE SHIP", "A / D", "or LEFT / RIGHT", 155, new Color(55, 245, 255));
        drawControlCard(g2d, 1, "FIRE WEAPONS", "SPACE", "hold for continuous fire", 225, new Color(175, 125, 255));
        drawControlCard(g2d, 2, "PAUSE MISSION", "ESC", "ESC resumes / ENTER returns", 295, new Color(255, 95, 180));
        drawControlCard(g2d, 3, "MENU ACTION", "ENTER", "confirm selected option", 365, new Color(255, 220, 100));
        drawFooterHint(g2d, "SURVIVE THE WAVES", "DESTROY BOMBS", "ESC  BACK");
    }

    private void drawControlCard(Graphics2D g2d, int index, String title, String key,
                                 String description, int y, Color accent) {
        drawCard(g2d, 145, y, 510, 52, accent, false);
        g2d.setColor(accent);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 15));
        g2d.drawString(title, 175, y + 22);
        g2d.setColor(new Color(170, 205, 225));
        g2d.setFont(new Font("SansSerif", Font.PLAIN, 12));
        g2d.drawString(description, 175, y + 40);
        g2d.setColor(new Color(5, 18, 48, 240));
        g2d.fillRoundRect(515, y + 10, 115, 30, 10, 10);
        g2d.setColor(accent);
        g2d.drawRoundRect(515, y + 10, 115, 30, 10, 10);
        g2d.setFont(new Font("Monospaced", Font.BOLD, 13));
        drawCenteredString(g2d, key, 572, y + 30);
    }

    private void drawFooterHint(Graphics2D g2d, String left, String center, String right) {
        g2d.setColor(new Color(120, 170, 200, 150));
        g2d.setFont(new Font("Monospaced", Font.BOLD, 11));
        g2d.drawString(left, 34, 535);
        drawCenteredString(g2d, center, getWidth() / 2, 535);
        g2d.drawString(right, 620, 535);
    }

    private void drawGame(Graphics2D g2d) {
        player.draw(g2d);

        for (Bullet b : bullets) {
            b.draw(g2d);
        }

        for (Bomb bomb : bombs) {
            bomb.draw(g2d);
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

    private void drawPause(Graphics2D g2d) {
        g2d.setColor(new Color(2, 5, 25, 185));
        g2d.fillRect(0, 0, getWidth(), getHeight());
        g2d.setColor(new Color(110, 235, 255));
        g2d.setFont(new Font("SansSerif", Font.BOLD, 52));
        drawCenteredString(g2d, "PAUSED", getWidth() / 2, 225);
        g2d.setColor(Color.WHITE);
        g2d.setFont(new Font("SansSerif", Font.PLAIN, 21));
        drawCenteredString(g2d, "ESC  -  RESUME", getWidth() / 2, 315);
        drawCenteredString(g2d, "ENTER  -  RETURN TO MENU", getWidth() / 2, 355);
        g2d.setFont(new Font("SansSerif", Font.PLAIN, 14));
        g2d.setColor(new Color(170, 210, 230));
        drawCenteredString(g2d, "GAME STATE SAVED", getWidth() / 2, 410);
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
                activateSettingsSelection();
            } else if (code == KeyEvent.VK_ESCAPE) {
                gameState = GameState.MENU;
                SoundEffects.startMenuMusic();
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
            if (code == KeyEvent.VK_ESCAPE) {
                pauseGame();
                return;
            }
            if (code == KeyEvent.VK_LEFT || code == KeyEvent.VK_A) player.left = true;
            if (code == KeyEvent.VK_RIGHT || code == KeyEvent.VK_D) player.right = true;

            if (code == KeyEvent.VK_SPACE) {
                spaceHeld = true;
                if (fireCooldown == 0) {
                    firePlayerWeapon();
                }
            }
        } else if (gameState == GameState.PAUSED) {
            if (code == KeyEvent.VK_ESCAPE) {
                resumeGame();
            } else if (code == KeyEvent.VK_ENTER) {
                returnToMenuFromPause();
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
