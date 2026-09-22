package org.example;

import javax.swing.SwingUtilities;
import org.example.view.GalagaGame;

/**
 * Compatibility entry point for existing IDE run configurations.
 * \test
 */
public final class Main {
    private Main() {
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(GalagaGame::new);
    }
}
