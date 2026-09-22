package org.example.view;

import org.example.model.enums.SoundType;
import org.example.service.SoundPlayer;

public final class SoundEffectsAdapter implements SoundPlayer {
    @Override public void setEnabled(boolean enabled) { SoundEffects.setSoundEnabled(enabled); }
    @Override public boolean isEnabled() { return SoundEffects.isSoundEnabled(); }
    @Override public void startMenuMusic() { SoundEffects.startMenuMusic(); }
    @Override public void stopMenuMusic() { SoundEffects.stopMenuMusic(); }
    @Override public void play(SoundType type) { SoundEffects.playSound(type); }
}
