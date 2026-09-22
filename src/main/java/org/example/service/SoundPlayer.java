package org.example.service;

import org.example.model.enums.SoundType;

public interface SoundPlayer {
    void setEnabled(boolean enabled);
    boolean isEnabled();
    void startMenuMusic();
    void stopMenuMusic();
    void play(SoundType type);
}
