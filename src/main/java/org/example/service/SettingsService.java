package org.example.service;

import org.example.model.GameModel;

public final class SettingsService {
    public void toggleAudio(GameModel model) {
        model.setSoundEnabled(!model.isSoundEnabled());
    }
    public void toggleParticles(GameModel model) {
        model.setParticlesEnabled(!model.isParticlesEnabled());
        if (!model.isParticlesEnabled()) {
            model.getParticles().clear();
        }
    }
}
