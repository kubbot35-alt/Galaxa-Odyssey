package org.example.service;

import org.example.model.GameModel;
import org.example.model.enums.UpgradeOption;

public final class UpgradeService {
    public boolean purchase(GameModel model, int selection) {
        UpgradeOption option = UpgradeOption.values()[selection];
        if (option == UpgradeOption.RETURN) return true;
        if (isOwned(model, option) || model.getProfileScore() < option.getCost()) return false;

        model.setProfileScore(model.getProfileScore() - option.getCost());
        switch (option) {
            case DUAL_CANNONS: model.setOwnedWeaponLevel(2); break;
            case TRIPLE_CANNONS: model.setOwnedWeaponLevel(3); break;
            case DOUBLE_LIVES: model.setDoubleLives(true); break;
            case INFINITE_LIVES: model.setInfiniteLives(true); break;
            default: break;
        }
        return true;
    }

    private boolean isOwned(GameModel model, UpgradeOption option) {
        switch (option) {
            case DUAL_CANNONS: return model.getOwnedWeaponLevel() >= 2;
            case TRIPLE_CANNONS: return model.getOwnedWeaponLevel() >= 3;
            case DOUBLE_LIVES: return model.hasDoubleLives();
            case INFINITE_LIVES: return model.hasInfiniteLives();
            default: return false;
        }
    }
}
