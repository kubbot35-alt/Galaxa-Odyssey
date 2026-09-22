package org.example;

import javax.swing.SwingUtilities;
import org.example.view.GalagaGame;

public class Main {
    public static void main(String[] args) {
        SwingUtilities.invokeLater(GalagaGame::new);
    }
}
