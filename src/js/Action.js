export class Action {
    constructor(type, trigger, payload) {
        this.type = type;
        this.trigger = trigger; // "onPass" or "onLand"
        this.payload = payload; // Data related to the action (e.g., scoreName, delta)
    }

    // Execute the action on a player
    execute(player) {
        if (this.type === "updateScore") {
            const { scoreName, delta } = this.payload;
            player.updateScore(scoreName, delta);
            console.log(`${player.nickname}'s ${scoreName} updated by ${delta}. New score: ${player.getScore(scoreName)}`);
        }
        // Additional action types can be added here
    }

    // Serialize to JSON
    toJSON() {
        return {
            type: this.type,
            trigger: this.trigger,
            payload: this.payload
        };
    }

    // Deserialize from JSON
    static fromJSON(json) {
        return new Action(json.type, json.trigger, json.payload);
    }
}
