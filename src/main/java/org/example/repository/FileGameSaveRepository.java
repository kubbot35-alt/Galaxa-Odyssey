package org.example.repository;

import org.example.model.GameSave;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class FileGameSaveRepository implements GameSaveRepository {
    private static final String SAVE_FILE_NAME = "save.json";
    private static final Pattern INTEGER_FIELD =
            Pattern.compile("\"([a-zA-Z]+)\"\\s*:\\s*(-?\\d+)");
    private static final Pattern BOOLEAN_FIELD =
            Pattern.compile("\"([a-zA-Z]+)\"\\s*:\\s*(true|false)");
    private final Path saveFile;

    public FileGameSaveRepository() {
        saveFile = resolveSaveFile();
    }

    @Override
    public void save(GameSave save) {
        String json = "{\n"
                + "  \"lives\": " + save.getLives() + ",\n"
                + "  \"weaponLevel\": " + save.getWeaponLevel() + ",\n"
                + "  \"score\": " + save.getScore() + ",\n"
                + "  \"stage\": " + save.getStage() + ",\n"
                + "  \"credits\": " + save.getCredits() + ",\n"
                + "  \"ownedWeaponLevel\": " + save.getOwnedWeaponLevel() + ",\n"
                + "  \"doubleLives\": " + save.hasDoubleLives() + ",\n"
                + "  \"infiniteLives\": " + save.hasInfiniteLives() + "\n"
                + "}\n";
        try {
            Files.createDirectories(saveFile.getParent());
            Files.write(saveFile, json.getBytes(StandardCharsets.UTF_8));
        } catch (IOException exception) {
            throw new IllegalStateException("Could not save game state to " + saveFile, exception);
        }
    }

    @Override
    public GameSave load() {
        if (!Files.exists(saveFile)) {
            return null;
        }
        try {
            String json = new String(Files.readAllBytes(saveFile), StandardCharsets.UTF_8);
            return new GameSave(getInt(json, "lives"), getInt(json, "weaponLevel"),
                    getInt(json, "score"), getInt(json, "stage"),
                    getInt(json, "credits"), getInt(json, "ownedWeaponLevel"),
                    getBoolean(json, "doubleLives"), getBoolean(json, "infiniteLives"));
        } catch (IOException | IllegalArgumentException exception) {
            throw new IllegalStateException("Could not load game state from " + saveFile, exception);
        }
    }

    @Override
    public void delete() {
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
        throw new IllegalArgumentException("Missing save field: " + key);
    }

    private boolean getBoolean(String json, String key) {
        Matcher matcher = BOOLEAN_FIELD.matcher(json);
        while (matcher.find()) {
            if (key.equals(matcher.group(1))) {
                return Boolean.parseBoolean(matcher.group(2));
            }
        }
        return false;
    }

    private Path resolveSaveFile() {
        Path directory = Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();
        while (directory != null) {
            Path existingSave = directory.resolve("out").resolve(SAVE_FILE_NAME);
            if (Files.exists(existingSave) || Files.exists(directory.resolve("pom.xml"))) {
                return existingSave;
            }
            directory = directory.getParent();
        }
        return Paths.get("out", SAVE_FILE_NAME).toAbsolutePath().normalize();
    }
}
