import { GAME_WIDTH, GAME_HEIGHT, PLAYER_SPEED } from '../../constants';
import type { PlayerState } from '../GameEntities';

export class PlayerMovement {
    public static update(player: PlayerState, left: boolean, right: boolean, up: boolean, down: boolean): void {
        player.movingLeft = left;
        player.movingRight = right;
        player.movingUp = up;
        player.movingDown = down;

        const dx = (right ? PLAYER_SPEED : 0) - (left ? PLAYER_SPEED : 0);
        const dy = (down ? PLAYER_SPEED : 0) - (up ? PLAYER_SPEED : 0);
        if (dx === 0 && dy === 0) return;

        player.x = Math.max(10, Math.min(GAME_WIDTH - player.width - 10, player.x + dx));
        player.y = Math.max(260, Math.min(GAME_HEIGHT - player.height - 10, player.y + dy));
    }
}
