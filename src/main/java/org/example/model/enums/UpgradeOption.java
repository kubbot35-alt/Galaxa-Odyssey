package org.example.model.enums;

public enum UpgradeOption {
    DUAL_CANNONS("DUAL CANNONS", 120),
    TRIPLE_CANNONS("TRIPLE CANNONS", 260),
    DOUBLE_LIVES("DOUBLE LIVES", 5000),
    INFINITE_LIVES("INFINITE LIVES", 50000000),
    RETURN("RETURN TO HANGAR", 0);

    private final String displayName;
    private final int cost;

    UpgradeOption(String displayName, int cost) {
        this.displayName = displayName;
        this.cost = cost;
    }

    public String getDisplayName() { return displayName; }
    public int getCost() { return cost; }
}
