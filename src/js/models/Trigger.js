import { processStringToEnum } from '../utils/helpers';
import TriggerTypes from '../enums/TriggerTypes';

export default class Trigger {
    constructor(type, payload) {
        this.type = type; // e.g., "code", "location", "time"
        this.payload = payload; // JavaScript code or value to check
    }

    // Check if this trigger is met based on the game state and associated space
    isTriggered(context) {
        const { gameState, space, eventBus } = context; // Destructure context

        const player = gameState.currentPlayer;

        // Emit an event before checking the trigger if the eventEmitter is provided
        if (eventBus) {
            eventBus.emit('triggerCheckStarted', { trigger: this, gameState: gameState, space: space });
        }

        let isTriggered = false;

        switch (this.type) {
            case TriggerTypes.CODE:
                isTriggered = eval(this.payload); // Evaluate custom JavaScript condition
                break;
            case TriggerTypes.ON_ENTER:
                isTriggered = player.location === space.id;
                break;
            case TriggerTypes.ON_LAND:
                isTriggered = player.landedOn === space.id;
                break;
            case TriggerTypes.ON_EXIT:
                isTriggered = player.exitedFrom === space.id;
                break;
            default:
                isTriggered = false;
        }

        // Emit an event after checking the trigger if the eventBus is provided
        if (eventBus) {
            eventBus.emit('triggerCheckEnded', { trigger: this, result: isTriggered, gameState: gameState, space: space });
        }

        return isTriggered;
    }

    // Serialization
    toJSON() {
        return {
            type: this.type,
            payload: this.payload
        };
    }

    static fromJSON(json) {
        // Process the type before using it
        const processedType = processStringToEnum(json.type);
        return new Trigger(processedType, json.payload);
    }
}
