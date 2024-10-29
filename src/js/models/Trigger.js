import { processStringToEnum } from '../utils/helpers';

export default class Trigger {
    constructor(type, payload) {
        this.type = type; // e.g., "code", "location", "time"
        this.payload = payload; // JavaScript code or value to check
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