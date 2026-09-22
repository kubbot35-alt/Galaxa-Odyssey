package org.example.view;

import javax.swing.JFrame;
import javax.swing.SwingUtilities;

public class GalagaGame extends JFrame {

    public GalagaGame() {
        setTitle("Galaga - Retro Arcade Space Shooter");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setResizable(false);

        GamePanel gamePanel = new GamePanel();
        add(gamePanel);
        pack();

        setLocationRelativeTo(null);
        setVisible(true);
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(GalagaGame::new);
    }
}
