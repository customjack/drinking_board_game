export default class PlayerEffect {
    constructor(name, duration) {
        this.name = name;
        this.duration = duration;
    }

    // Abstract 'apply' method - to be implemented by subclasses
    apply(gameEngine) {
        throw new Error("apply method must be implemented by subclasses");
    }

    // 'Enact' method that does the effect's main work
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
        throw new Error("fromJSON must be implemented by subclasses");
    }
}
