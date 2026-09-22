package org.example.controller;

import javax.swing.SwingUtilities;
import org.example.view.GalagaGame;

public class Main {
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new GalagaGame());
    }
}
