package org.example.controller;

import org.example.model.GameSave;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class GameSaveController {
    private static final String SAVE_FILE_NAME = "save.json";
    private static final Pattern INTEGER_FIELD =
            Pattern.compile("\"([a-zA-Z]+)\"\\s*:\\s*(-?\\d+)");
    private final Path saveFile;

    public GameSaveController() {
        saveFile = resolveSaveFile();
    }

    public void save(GameSave save) {
        String json = "{\n"
                + "  \"lives\": " + save.getLives() + ",\n"
                + "  \"weaponLevel\": " + save.getWeaponLevel() + ",\n"
                + "  \"score\": " + save.getScore() + ",\n"
                + "  \"stage\": " + save.getStage() + ",\n"
                + "  \"credits\": " + save.getCredits() + ",\n"
                + "  \"ownedWeaponLevel\": " + save.getOwnedWeaponLevel() + "\n"
                + "}\n";

        try {
            Files.createDirectories(saveFile.getParent());
            Files.write(saveFile, json.getBytes(StandardCharsets.UTF_8));
        } catch (IOException exception) {
            throw new IllegalStateException("Could not save game state to " + saveFile, exception);
        }
    }

    public GameSave load() {
        if (!Files.exists(saveFile)) {
            return null;
        }

        try {
            String json = new String(Files.readAllBytes(saveFile), StandardCharsets.UTF_8);
            return new GameSave(
                    getInt(json, "lives"),
                    getInt(json, "weaponLevel"),
                    getInt(json, "score"),
                    getInt(json, "stage"),
                    getInt(json, "credits"),
                    getInt(json, "ownedWeaponLevel")
            );
        } catch (IOException | IllegalArgumentException exception) {
            throw new IllegalStateException("Could not load game state from " + saveFile, exception);
        }
    }

    public void deleteSave() {
        try {
            Files.deleteIfExists(saveFile);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not delete game state from " + saveFile, exception);
        }
    }

    private int getInt(String json, String key) {
        Matcher matcher = INTEGER_FIELD.matcher(json);
        while (matcher.find()) {
            if (key.equals(matcher.group(1))) {
                return Integer.parseInt(matcher.group(2));
            }
        }
        if (!json.trim().startsWith("{") || !json.trim().endsWith("}")) {
            throw new IllegalArgumentException("Invalid JSON save format");
        }
        throw new IllegalArgumentException("Missing save field: " + key);
    }

    private Path resolveSaveFile() {
        Path directory = Paths.get(System.getProperty("user.dir"))
                .toAbsolutePath()
                .normalize();

        while (directory != null) {
            Path existingSave = directory.resolve("out").resolve(SAVE_FILE_NAME);
            if (Files.exists(existingSave)) {
                return existingSave;
            }
            if (Files.exists(directory.resolve("pom.xml"))) {
                return directory.resolve("out").resolve(SAVE_FILE_NAME);
            }
            directory = directory.getParent();
        }

        return Paths.get("out", SAVE_FILE_NAME).toAbsolutePath().normalize();
    }
}
