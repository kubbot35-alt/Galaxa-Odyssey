package org.example.controller;

import org.example.model.GameSave;
import org.example.repository.FileGameSaveRepository;
import org.example.repository.GameSaveRepository;

public final class GameSaveController {
    private final GameSaveRepository repository;

    public GameSaveController() {
        this(new FileGameSaveRepository());
    }

    public GameSaveController(GameSaveRepository repository) {
        this.repository = repository;
    }

    public void save(GameSave save) { repository.save(save); }
    public GameSave load() { return repository.load(); }
    public void deleteSave() { repository.delete(); }
}
