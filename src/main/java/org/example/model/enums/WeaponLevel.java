package org.example.model.enums;

public enum WeaponLevel {
    SINGLE(1), DUAL(2), TRIPLE(3);
    private final int value;
    WeaponLevel(int value) { this.value = value; }
    public int getValue() { return value; }
    public static WeaponLevel fromValue(int value) {
        return value >= 3 ? TRIPLE : value == 2 ? DUAL : SINGLE;
    }
}
