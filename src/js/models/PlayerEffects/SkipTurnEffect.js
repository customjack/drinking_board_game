import PlayerEffect from './PlayerEffect.js';

export default class SkipTurnEffect extends PlayerEffect {
    constructor(duration) {
        super("SkipTurn", duration);
    }

    enact(gameEngine) {
        gameEngine.currentPlayer.skipTurn = true;
        console.log(`Player's turn skipped for ${this.duration} turns.`);
    }

    static fromJSON(json) {
        return new SkipTurnEffect(json.duration);
    }
}

// Register the subclass for deserialization
PlayerEffect.registerEffect(SkipTurnEffect);
