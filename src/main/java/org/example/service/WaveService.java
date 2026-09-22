package org.example.service;

import org.example.model.Enemy;
import org.example.model.GameModel;
import org.example.model.enums.EnemyType;
import org.example.model.enums.DifficultyLevel;
import org.example.model.factory.GameObjectFactory;

public final class WaveService {
    private final GameObjectFactory factory;

    public WaveService(GameObjectFactory factory) { this.factory = factory; }

    public void spawnNextWave(GameModel model) {
        int wave = model.getWave() + 1;
        model.setWave(wave);
        DifficultyLevel difficulty = model.getDifficultyLevel();
        int rows = Math.max(1, Math.min(5, 2 + wave / 2 + difficulty.getAdditionalRows()));
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < 8; col++) {
                EnemyType type = row == 0 ? EnemyType.ELITE : EnemyType.STANDARD;
                model.getEnemies().add(factory.createEnemy(100 + col * 75, 40 + row * 45, type));
            }
        }
    }
}
