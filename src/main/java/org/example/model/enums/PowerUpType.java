package org.example.model.enums;

public enum PowerUpType {
    EXTRA_LIFE("+"),
    WEAPON("W");

    private final String label;
    PowerUpType(String label) { this.label = label; }
    public String getLabel() { return label; }
}
