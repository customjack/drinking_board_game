import PlayerEffect from './PlayerEffect.js';

export default class SkipTurnEffect extends PlayerEffect {
    constructor(duration) {
        super("SkipTurn", duration);
    }

    // Implementation of the 'apply' method, determining how this effect affects the game
    apply(gameEngine) {
        // Example: Skips the turn for all players in a specific game condition
        console.log(`Applying SkipTurn effect for ${this.duration} turns.`);
    }

    enact(gameEngine) {
        console.log(`Enacting SkipTurn effect for ${this.duration} turns.`);
        // Implement the logic that actually skips the player's turn
    }

    static fromJSON(json) {
        return new SkipTurnEffect(json.duration);
    }
}
