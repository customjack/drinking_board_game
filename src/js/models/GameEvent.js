import Trigger from './Trigger.js';
import Action from './Action.js';

export default class GameEvent {
    constructor(trigger, action) {
        this.trigger = trigger; // Instance of Trigger
        this.action = action; // Instance of Action
    }

    // Checks if the trigger conditions are met
    checkTrigger(context) {
        return this.trigger.isTriggered(context);
    }

    // Executes the action if the trigger is met
    executeAction(context) {
        if (this.checkTrigger(context)) {
            this.action.execute(context);
        }
    }

    // Serialize this event to JSON
    toJSON() {
        return {
            trigger: this.trigger.toJSON(),
            action: this.action.toJSON()
        };
    }

    // Deserialize from JSON
    static fromJSON(json) {
        return new GameEvent(Trigger.fromJSON(json.trigger), Action.fromJSON(json.action));
    }
}
