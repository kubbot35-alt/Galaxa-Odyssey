package org.example.controller;

import org.example.model.GameModel;
import org.example.model.GameSave;
import org.example.model.GameState;
import org.example.model.Player;
import org.example.model.enums.DifficultyLevel;
import org.example.repository.GameSaveRepository;
import org.example.service.GameService;
import org.example.service.SettingsService;
import org.example.service.SoundPlayer;
import org.example.service.UpgradeService;
import org.example.service.WaveService;

public final class GameController {
    private final GameModel model;
    private final GameService gameService;
    private final WaveService waveService;
    private final UpgradeService upgradeService;
    private final SettingsService settingsService;
    private final GameSaveRepository saveRepository;
    private final SoundPlayer soundPlayer;

    public GameController(GameModel model, GameService gameService, WaveService waveService,
                          UpgradeService upgradeService, SettingsService settingsService,
                          GameSaveRepository saveRepository, SoundPlayer soundPlayer) {
        this.model = model;
        this.gameService = gameService;
        this.waveService = waveService;
        this.upgradeService = upgradeService;
        this.settingsService = settingsService;
        this.saveRepository = saveRepository;
        this.soundPlayer = soundPlayer;
    }

    public void initializeProfile() {
        GameSave save = saveRepository.load();
        if (save != null) {
            model.setHighScore(save.getScore());
            model.setCredits(save.getCredits());
            model.setOwnedWeaponLevel(save.getOwnedWeaponLevel());
        }
        soundPlayer.startMenuMusic();
    }

    public void update() {
        if (model.getGameState() == GameState.PLAYING) {
            gameService.update(model);
            if (model.getGameState() == GameState.GAMEOVER) {
                saveRepository.delete();
            }
        }
    }

    public void startGame() {
        GameSave save = saveRepository.load();
        model.setPlayer(new Player(380, 520));
        if (save == null) {
            model.getPlayer().setWeaponLevel(model.getOwnedWeaponLevel());
            model.setWave(0);
        } else {
            model.getPlayer().setLives(save.getLives());
            model.getPlayer().setWeaponLevel(save.getWeaponLevel());
            model.getPlayer().setScore(save.getScore());
            model.getPlayer().resetShield();
            model.setHighScore(Math.max(model.getHighScore(), save.getScore()));
            model.setWave(Math.max(0, save.getStage() - 1));
            model.setCredits(save.getCredits());
            model.setOwnedWeaponLevel(save.getOwnedWeaponLevel());
        }
        model.clearTransientObjects();
        waveService.spawnNextWave(model);
        soundPlayer.stopMenuMusic();
        model.setGameState(GameState.PLAYING);
    }

    public void saveGame() {
        if (model.getPlayer() == null) return;
        Player player = model.getPlayer();
        saveRepository.save(new GameSave(player.getLives(), player.getWeaponLevel(), player.getScore(),
                model.getWave(), model.getCredits(), model.getOwnedWeaponLevel()));
    }

    public void pause() {
        if (model.getGameState() != GameState.PLAYING) return;
        model.setSpaceHeld(false);
        model.getPlayer().stopMoving();
        saveGame();
        model.setGameState(GameState.PAUSED);
    }

    public void resume() {
        if (model.getGameState() == GameState.PAUSED) model.setGameState(GameState.PLAYING);
    }

    public void returnToMenu() {
        if (model.getPlayer() != null) model.getPlayer().stopMoving();
        model.setSpaceHeld(false);
        model.setGameState(GameState.MENU);
        soundPlayer.startMenuMusic();
    }

    public void selectMenu(int delta) {
        model.setMenuSelection((model.getMenuSelection() + delta + 4) % 4);
    }

    public void activateMenu() {
        switch (model.getMenuSelection()) {
            case 0:
                model.setDifficultySelection(model.getDifficultyLevel().ordinal());
                soundPlayer.stopMenuMusic();
                model.setGameState(GameState.DIFFICULTY_SELECTION);
                break;
            case 1: soundPlayer.stopMenuMusic(); model.setGameState(GameState.UPGRADES); break;
            case 2: soundPlayer.stopMenuMusic(); model.setGameState(GameState.SETTINGS); break;
            default: soundPlayer.stopMenuMusic(); model.setGameState(GameState.HOW_TO_PLAY); break;
        }
    }

    public void selectDifficulty(int delta) {
        int optionCount = DifficultyLevel.values().length;
        model.setDifficultySelection((model.getDifficultySelection() + delta + optionCount) % optionCount);
    }

    public void activateDifficulty() {
        DifficultyLevel selected = DifficultyLevel.values()[model.getDifficultySelection()];
        model.setDifficultyLevel(selected);
        startGame();
    }

    public void cancelDifficultySelection() {
        model.setGameState(GameState.MENU);
        soundPlayer.startMenuMusic();
    }

    public void selectUpgrade(int delta) {
        model.setUpgradeSelection((model.getUpgradeSelection() + delta + 3) % 3);
    }

    public void activateUpgrade() {
        if (upgradeService.purchase(model, model.getUpgradeSelection())) {
            if (model.getUpgradeSelection() == 2) returnToMenu();
            else soundPlayer.play(org.example.model.enums.SoundType.POWER_UP);
        }
    }

    public void selectSettings(int delta) {
        model.setSettingsSelection((model.getSettingsSelection() + delta + 3) % 3);
    }

    public void activateSettings() {
        if (model.getSettingsSelection() == 0) {
            settingsService.toggleAudio(model);
            soundPlayer.setEnabled(model.isSoundEnabled());
        } else if (model.getSettingsSelection() == 1) {
            settingsService.toggleParticles(model);
        } else {
            returnToMenu();
        }
    }

    public void moveLeft(boolean value) { if (model.getPlayer() != null) model.getPlayer().moveLeft(value); }
    public void moveRight(boolean value) { if (model.getPlayer() != null) model.getPlayer().moveRight(value); }
    public void setSpaceHeld(boolean value) { model.setSpaceHeld(value); }
    public void fireIfReady() { if (model.getPlayer() != null && model.getFireCooldown() == 0) gameService.fire(model); }
    public GameModel getModel() { return model; }
}
