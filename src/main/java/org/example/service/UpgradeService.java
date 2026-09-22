package org.example.service;

import org.example.model.GameModel;

public final class UpgradeService {
    public boolean purchase(GameModel model, int selection) {
        if (selection == 0 && model.getOwnedWeaponLevel() < 2 && model.getCredits() >= 120) {
            model.setCredits(model.getCredits() - 120);
            model.setOwnedWeaponLevel(2);
            return true;
        }
        if (selection == 1 && model.getOwnedWeaponLevel() < 3 && model.getCredits() >= 260) {
            model.setCredits(model.getCredits() - 260);
            model.setOwnedWeaponLevel(3);
            return true;
        }
        return selection == 2;
    }
}
