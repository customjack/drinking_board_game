import TriggerTypes from '../../enums/TriggerTypes';

export default class TriggerManager {
    constructor(gameState) {
        this.gameState = gameState; // Reference to the current game state
    }

    // Check all triggers for a specific space and return the actions to be executed
    getTriggeredActions(space) {
        const actionsToExecute = [];

        // Iterate through the events in the space
        for (const event of space.events) {
            const trigger = event.trigger;

            // Evaluate the trigger against the game state
            if (this.isTriggered(trigger, space)) {
                const action = event.action;
                actionsToExecute.push(action);
            }
        }

        return actionsToExecute;
    }

    // Check if a trigger is met based on the game state and space
    isTriggered(trigger, space) {
        const player = this.gameState.currentPlayer; // Assuming currentPlayer is part of the gameState

        switch (trigger.type) {
            case TriggerTypes.CODE:
                return eval(trigger.payload); // Custom JavaScript condition
            case TriggerTypes.ON_ENTER:
                return player.location === space.id; // Check if player is on the space
            case TriggerTypes.ON_LAND:
                return player.landedOn === space.id; // Check if player has landed on this space
            case TriggerTypes.ON_EXIT:
                return player.exitedFrom === space.id; // Check if player exited this space
            default:
                return false;
        }
    }
}
