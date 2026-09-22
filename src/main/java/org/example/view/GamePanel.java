package org.example.view;

import org.example.controller.GameController;
import org.example.controller.InputController;
import org.example.model.GameModel;
import org.example.model.enums.SoundType;
import org.example.model.factory.GameObjectFactory;
import org.example.repository.FileGameSaveRepository;
import org.example.service.CollisionService;
import org.example.service.GameService;
import org.example.service.SettingsService;
import org.example.service.UpgradeService;
import org.example.service.WaveService;

import javax.swing.JPanel;
import javax.swing.Timer;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

public final class GamePanel extends JPanel implements ActionListener {
    private final GameModel model;
    private final GameController controller;
    private final GameRenderer renderer;
    private final Timer timer;

    public GamePanel() {
        model = new GameModel();
        GameObjectFactory factory = new GameObjectFactory();
        WaveService waves = new WaveService(factory);
        GameService gameService = new GameService(factory, waves, new CollisionService(),
                sound -> { if (model.isSoundEnabled()) SoundEffects.playSound(sound); });
        controller = new GameController(model, gameService, waves, new UpgradeService(),
                new SettingsService(), new FileGameSaveRepository(), new SoundEffectsAdapter());
        renderer = new GameRenderer();
        InputController input = new InputController(controller);
        setPreferredSize(new Dimension(GameModel.WIDTH, GameModel.HEIGHT));
        setBackground(Color.BLACK);
        setFocusable(true);
        addKeyListener(input);
        addMouseListener(input);
        controller.initializeProfile();
        timer = new Timer(16, this);
        timer.start();
    }

    @Override public void actionPerformed(ActionEvent event) {
        controller.update();
        repaint();
    }

    @Override protected void paintComponent(Graphics graphics) {
        super.paintComponent(graphics);
        renderer.render((Graphics2D) graphics, model);
    }

    public void saveGameOnExit() {
        controller.saveGame();
        timer.stop();
    }
}
