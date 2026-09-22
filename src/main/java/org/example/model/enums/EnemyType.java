package org.example.model.enums;

public enum EnemyType {
    STANDARD(1, 100, 10),
    ELITE(2, 150, 15);

    private final int difficulty;
    private final int score;
    private final int credits;

    EnemyType(int difficulty, int score, int credits) {
        this.difficulty = difficulty;
        this.score = score;
        this.credits = credits;
    }
    public int getDifficulty() { return difficulty; }
    public int getScore() { return score; }
    public int getCredits() { return credits; }
}
