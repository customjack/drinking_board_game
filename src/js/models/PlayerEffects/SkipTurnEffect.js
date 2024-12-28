import PlayerEffect from './PlayerEffect.js';
import TurnPhases from '../../enums/TurnPhases';
import PlayerStates from '../../enums/PlayerStates';


export default class SkipTurnEffect extends PlayerEffect {
    constructor(id, duration, toRemove = false, playerIdToSkip = null) {
        super(id, duration, toRemove);
        this.playerIdToSkip = playerIdToSkip;
    }

    // Implementation of the 'apply' method, determining how this effect affects the game
    apply(gameEngine) {
        const currentPlayer = gameEngine.gameState.getCurrentPlayer();
        this.playerIdToSkip = currentPlayer.id;
        currentPlayer.addEffect(this);

        console.log(`Applying SkipTurn effect for ${this.duration} turns to player ${currentPlayer.nickname}.`);
    }

    enact(gameEngine) {
        const currentPlayer = gameEngine.gameState.getCurrentPlayer();
        if (currentPlayer.playerId === this.playerIdToSkip &&
            gameEngine.gameState.turnPhase === TurnPhases.CHANGE_TURN) {
            if (this.duration <= 0) {
                currentPlayer.setState(PlayerStates.PLAYING);
                this.markForRemoval();
            } else {
                console.log(`Enacting SkipTurn effect for ${this.duration} more turn(s).`);
                currentPlayer.setState(PlayerStates.SKIPPING_TURN);
                this.duration--;
            }
        }
    }

    toJSON() {
        return {
            type: this.constructor.name, // To identify the effect type during deserialization
            args: [
                {id: this.id},
                {duration: this.duration},
                {toRemove: this.toRemove},
                {playerIdToSkip: this.playerIdToSkip}
            ]
        };
    }
}
