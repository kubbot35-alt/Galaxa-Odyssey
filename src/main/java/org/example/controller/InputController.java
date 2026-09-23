package org.example.controller;

import org.example.model.GameModel;
import org.example.model.GameState;

import java.awt.Point;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

public final class InputController extends MouseAdapter implements KeyListener {
    private final GameController controller;
    private final GameModel model;

    public InputController(GameController controller) {
        this.controller = controller;
        model = controller.getModel();
    }

    @Override public void keyPressed(KeyEvent event) {
        int code = event.getKeyCode();
        GameState state = model.getGameState();
        if (state == GameState.MENU) {
            if (code == KeyEvent.VK_UP || code == KeyEvent.VK_W) controller.selectMenu(-1);
            else if (code == KeyEvent.VK_DOWN || code == KeyEvent.VK_S) controller.selectMenu(1);
            else if (code == KeyEvent.VK_ENTER) controller.activateMenu();
        } else if (state == GameState.PLAYER_MODE_SELECTION) {
            if (code == KeyEvent.VK_LEFT || code == KeyEvent.VK_A || code == KeyEvent.VK_UP || code == KeyEvent.VK_W) controller.selectPlayerMode(-1);
            else if (code == KeyEvent.VK_RIGHT || code == KeyEvent.VK_D || code == KeyEvent.VK_DOWN || code == KeyEvent.VK_S) controller.selectPlayerMode(1);
            else if (code == KeyEvent.VK_ENTER) controller.activatePlayerMode();
            else if (code == KeyEvent.VK_ESCAPE) controller.cancelPlayerModeSelection();
        } else if (state == GameState.DIFFICULTY_SELECTION) {
            if (code == KeyEvent.VK_UP || code == KeyEvent.VK_W) controller.selectDifficulty(-1);
            else if (code == KeyEvent.VK_DOWN || code == KeyEvent.VK_S) controller.selectDifficulty(1);
            else if (code == KeyEvent.VK_ENTER) controller.activateDifficulty();
            else if (code == KeyEvent.VK_ESCAPE) controller.cancelDifficultySelection();
        } else if (state == GameState.SETTINGS) {
            if (code == KeyEvent.VK_UP || code == KeyEvent.VK_W) controller.selectSettings(-1);
            else if (code == KeyEvent.VK_DOWN || code == KeyEvent.VK_S) controller.selectSettings(1);
            else if (code == KeyEvent.VK_ENTER) controller.activateSettings();
            else if (code == KeyEvent.VK_ESCAPE) controller.returnToMenu();
        } else if (state == GameState.UPGRADES) {
            if (code == KeyEvent.VK_UP || code == KeyEvent.VK_W) controller.selectUpgrade(-1);
            else if (code == KeyEvent.VK_DOWN || code == KeyEvent.VK_S) controller.selectUpgrade(1);
            else if (code == KeyEvent.VK_ENTER) controller.activateUpgrade();
            else if (code == KeyEvent.VK_ESCAPE) controller.returnToMenu();
        } else if (state == GameState.HOW_TO_PLAY) {
            if (code == KeyEvent.VK_ENTER || code == KeyEvent.VK_ESCAPE) controller.returnToMenu();
        } else if (state == GameState.PLAYING) {
            if (code == KeyEvent.VK_ESCAPE) controller.pause();
            else if (code == KeyEvent.VK_LEFT) controller.moveLeft(true);
            else if (code == KeyEvent.VK_RIGHT) controller.moveRight(true);
            else if (code == KeyEvent.VK_SPACE) { controller.setSpaceHeld(true); controller.fireIfReady(); }
            else if (code == KeyEvent.VK_A) controller.moveSecondPlayerLeft(true);
            else if (code == KeyEvent.VK_D) controller.moveSecondPlayerRight(true);
            else if (code == KeyEvent.VK_F) { controller.setSecondPlayerFireHeld(true); controller.fireSecondPlayerIfReady(); }
        } else if (state == GameState.PAUSED) {
            if (code == KeyEvent.VK_ESCAPE) controller.resume();
            else if (code == KeyEvent.VK_ENTER) controller.returnToMenu();
        } else if (state == GameState.GAMEOVER && code == KeyEvent.VK_ENTER) {
            controller.returnToMenu();
        }
    }

    @Override public void keyReleased(KeyEvent event) {
        if (model.getGameState() != GameState.PLAYING) return;
        if (event.getKeyCode() == KeyEvent.VK_LEFT) controller.moveLeft(false);
        if (event.getKeyCode() == KeyEvent.VK_RIGHT) controller.moveRight(false);
        if (event.getKeyCode() == KeyEvent.VK_SPACE) controller.setSpaceHeld(false);
        if (event.getKeyCode() == KeyEvent.VK_A) controller.moveSecondPlayerLeft(false);
        if (event.getKeyCode() == KeyEvent.VK_D) controller.moveSecondPlayerRight(false);
        if (event.getKeyCode() == KeyEvent.VK_F) controller.setSecondPlayerFireHeld(false);
    }
    @Override public void keyTyped(KeyEvent event) { }

    @Override public void mouseClicked(MouseEvent event) {
        Point point = event.getPoint();
        if (model.getGameState() == GameState.MENU) {
            for (int i = 0; i < 4; i++) {
                if (new java.awt.Rectangle(150, 240 + i * 78, 500, 62).contains(point)) {
                    model.setMenuSelection(i); controller.activateMenu(); return;
                }
            }
        } else if (event.getButton() == MouseEvent.BUTTON1
                && model.getGameState() == GameState.PLAYER_MODE_SELECTION) {
            for (int i = 0; i < 2; i++) {
                if (new java.awt.Rectangle(170, 220 + i * 100, 460, 60).contains(point)) {
                    model.setPlayerModeSelection(i);
                    controller.activatePlayerMode();
                    return;
                }
            }
        } else if (event.getButton() == MouseEvent.BUTTON1
                && model.getGameState() == GameState.DIFFICULTY_SELECTION) {
            for (int i = 0; i < 3; i++) {
                if (new java.awt.Rectangle(170, 190 + i * 78, 460, 60).contains(point)) {
                    model.setDifficultySelection(i);
                    controller.activateDifficulty();
                    return;
                }
            }
        } else if (event.getButton() == MouseEvent.BUTTON1 && model.getGameState() == GameState.HOW_TO_PLAY) {
            controller.returnToMenu();
        } else if (event.getButton() == MouseEvent.BUTTON1 && model.getGameState() == GameState.UPGRADES) {
            for (int i = 0; i < 5; i++) if (new java.awt.Rectangle(145, 170 + i * 65, 510, 52).contains(point)) {
                model.setUpgradeSelection(i); controller.activateUpgrade(); return;
            }
        } else if (event.getButton() == MouseEvent.BUTTON1 && model.getGameState() == GameState.SETTINGS) {
            for (int i = 0; i < 3; i++) if (new java.awt.Rectangle(145, 205 + i * 70, 510, 52).contains(point)) {
                model.setSettingsSelection(i); controller.activateSettings(); return;
            }
        }
    }
}
