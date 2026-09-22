package org.example.repository;

import org.example.model.GameSave;

public interface GameSaveRepository {
    void save(GameSave save);
    GameSave load();
    void delete();
}
