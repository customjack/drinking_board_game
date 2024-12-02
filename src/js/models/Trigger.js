import { processStringToEnum } from '../utils/helpers';
import TriggerTypes from '../enums/TriggerTypes';

export default class Trigger {
    constructor(type, payload) {
        this.type = type; // e.g., "code", "location", "time"
        this.payload = payload; // JavaScript code or value to check
    }

    // Check if this trigger is met based on the game state and associated space
    isTriggered(context) {
        const { gameState, space, eventBus, peerId} = context; // Destructure context

        const player = gameState.getCurrentPlayer();

        // Emit an event before checking the trigger if the eventEmitter is provided
        if (eventBus) {
            eventBus.emit('triggerCheckStarted', { trigger: this, gameState: gameState, space: space });
        }

        let isTriggered = false;

        switch (this.type) {
            case TriggerTypes.CODE:
                if (this.payload) {
                    isTriggered = eval(this.payload); // Evaluate custom JavaScript condition
                }
                break;
            case TriggerTypes.ON_ENTER:
                const hasMovedThisTurn = player.movementHistory.getHistoryForTurn(gameState.getTurnNumber()).length > 0;
                isTriggered = hasMovedThisTurn && player.currentSpaceId === space.id;
                break;
            case TriggerTypes.ON_LAND:
                isTriggered = player.currentSpaceId === space.id && !gameState.hasMovesLeft();
                break;
            case TriggerTypes.ON_EXIT:
                // Check if the player exited from the space by looking up their movement history
                const lastMove = player.movementHistory.getPreviousMove(1); // Get the second most recent move
                isTriggered = lastMove && lastMove.spaceId === space.id; // Check if it matches the space ID
                break;
            default:
                isTriggered = false;
        }

        // Emit an event after checking the trigger if the eventBus is provided
        if (eventBus) {
            eventBus.emit('triggerCheckEnded', { trigger: this, result: isTriggered, gameState: gameState, space: space });
        }

        // Debug print if the event is triggered
        if (isTriggered) {
            console.log(`Trigger of type ${this.type} was activated for space ID ${space.id} by player ${player.nickname}.`);
        }

        return isTriggered;
    }

    // Serialization
    toJSON() {
        return {
            type: this.type,
            payload: this.payload || null // Ensure payload is present in JSON output
        };
    }

    static fromJSON(json) {
        // Process the type before using it
        const processedType = processStringToEnum(json.type);
        const payload = json.payload !== undefined ? json.payload : null; // Default to null if payload is missing
        return new Trigger(processedType, payload);
    }
}
