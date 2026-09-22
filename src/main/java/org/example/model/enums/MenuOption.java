package org.example.model.enums;

public enum MenuOption {
    PLAY("PLAY", "START A NEW MISSION"),
    UPGRADES("UPGRADES", "IMPROVE YOUR SHIP"),
    SETTINGS("SETTINGS", "AUDIO AND VISUALS"),
    HOW_TO_PLAY("HOW TO PLAY", "CONTROLS AND TIPS");
    private final String title;
    private final String subtitle;
    MenuOption(String title, String subtitle) { this.title = title; this.subtitle = subtitle; }
    public String getTitle() { return title; }
    public String getSubtitle() { return subtitle; }
}
