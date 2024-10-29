import ActionTypes from '../enums/ActionTypes';
import { processStringToEnum } from '../utils/helpers';

export default class Action {
    constructor(type, payload) {
        this.type = type; // e.g., "execute", "updateStat", etc.
        this.payload = payload; // JavaScript code or parameters for the action
    }

    // Executes the action in the provided context
    execute(context) {
        switch (this.type) {
            case "execute":
                eval(this.payload); // Execute custom JavaScript action
                break;
            case "updateStat":
                // Example of how to handle an updateStat action
                const { statName, value } = this.payload;
                context.player.updateStat(statName, value);
                break;
            // Add other cases as needed
            default:
                console.log(`Action type ${this.type} not recognized.`);
        }
    }

    // Serialization
    toJSON() {
        return {
            type: this.type,
            payload: this.payload
        };
    }

    static fromJSON(json) {
        return new Action(json.type, json.payload);
    }
}