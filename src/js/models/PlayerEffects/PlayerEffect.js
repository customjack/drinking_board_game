export default class PlayerEffect {
    constructor(id, duration, toRemove = false) {
        this.id = id;
        this.duration = duration;
        this.toRemove = toRemove;
    }

    markForRemoval() {
        this.toRemove = true;
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
            args: [
                {id: this.id},
                {duration: this.duration},
                {toRemove: this.toRemove}
            ]
        };
    }
}
