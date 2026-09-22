package org.example.model;

public final class Player {
    public static final int WIDTH = 40;
    public static final int HEIGHT = 40;

    private int x;
    private final int y;
    private int speed = 6;
    private boolean movingLeft;
    private boolean movingRight;
    private int lives = 3;
    private int score;
    private int shield = 100;
    private int weaponLevel = 1;

    public Player(int startX, int startY) {
        x = startX;
        y = startY;
    }

    public void update(int boundWidth) {
        if (movingLeft && x > 10) {
            x -= speed;
        }
        if (movingRight && x < boundWidth - WIDTH - 10) {
            x += speed;
        }
    }

    public void moveLeft(boolean moving) {
        movingLeft = moving;
    }

    public void moveRight(boolean moving) {
        movingRight = moving;
    }

    public void stopMoving() {
        movingLeft = false;
        movingRight = false;
    }

    public int getX() { return x; }
    public int getY() { return y; }
    public int getWidth() { return WIDTH; }
    public int getHeight() { return HEIGHT; }
    public int getLives() { return lives; }
    public int getScore() { return score; }
    public int getShield() { return shield; }
    public int getWeaponLevel() { return weaponLevel; }
    public void addScore(int value) { score += value; }
    public void setScore(int value) { score = value; }
    public void addLife() { lives++; }
    public void loseLife() { lives--; }
    public void setLives(int value) { lives = value; }
    public void resetShield() { shield = 100; }
    public void reduceShield(int amount) { shield = Math.max(0, shield - amount); }
    public void setShield(int value) { shield = value; }
    public void setWeaponLevel(int value) { weaponLevel = Math.max(1, Math.min(3, value)); }
    public void increaseWeaponLevel() { setWeaponLevel(weaponLevel + 1); }
}
