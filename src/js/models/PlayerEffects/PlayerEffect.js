export default class PlayerEffect {
    constructor(name, duration) {
        this.name = name;
        this.duration = duration;
    }

    enact(gameEngine) {
        throw new Error("enact method must be implemented by subclasses");
    }

    toJSON() {
        return {
            type: this.constructor.name, // To identify the effect type during deserialization
            name: this.name,
            duration: this.duration,
        };
    }

    static fromJSON(json) {
        if (!json.type) {
            throw new Error("JSON does not contain a type field");
        }

        // Check if the type exists in the mapping and construct the correct class
        const EffectClass = PlayerEffect.effectMapping[json.type];
        if (!EffectClass) {
            throw new Error(`Unknown effect type: ${json.type}`);
        }
        return EffectClass.fromJSON(json);
    }

    // Register subclasses for deserialization
    static registerEffect(effectClass) {
        if (!PlayerEffect.effectMapping) {
            PlayerEffect.effectMapping = {};
        }
        PlayerEffect.effectMapping[effectClass.name] = effectClass;
    }
}