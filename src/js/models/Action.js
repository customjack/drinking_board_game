import ActionTypes from '../enums/ActionTypes';
import { processStringToEnum } from '../utils/helpers';

export default class Action {
    constructor(type, payload) {
        this.type = type;
        this.payload = payload;
    }

    // Executes the action based on the type and payload
    execute(context) {
        // Destructure necessary properties from the context
        const { gameState, space, eventBus } = context;

        // Emit an event before executing the action if the eventEmitter is provided
        if (eventBus) {
            eventBus.emit('beforeActionExecution', {action: this, gamestate: gameState, space: space });
        }

        switch (this.type) {
            case ActionTypes.CODE:
                eval(this.payload); // Execute custom JavaScript action
                break;
            case ActionTypes.PROMPT_ALL_PLAYERS:
                // Example action for all players
                console.log("Prompting all players...");
                break;
            case ActionTypes.PROMPT_CURRENT_PLAYER:
                // Example action for the current player
                console.log("Prompting current player...");
                break;
            case ActionTypes.CUSTOM:
                // Example for custom action
                console.log("Executing custom action...");
                break;
            default:
                console.log(`Action type ${this.type} not recognized.`);
        }

        // Emit an event after executing the action if the eventBus is provided
        if (eventBus) {
            eventBus.emit('afterActionExecution', { action: this, gamestate: gameState, space: space });
        }
    }

    // Serialization
    toJSON() {
        return {
            type: this.type,
            payload: this.payload
        };
    }

    // Deserialize from JSON and map type to ActionTypes enum
    static fromJSON(json) {
        const processedType = processStringToEnum(json.type);
        return new Action(processedType, json.payload);
    }
}
