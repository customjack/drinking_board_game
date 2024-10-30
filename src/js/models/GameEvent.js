import Trigger from './Trigger.js';
import Action from './Action.js';
import { PriorityLevels } from '../enums/PriorityLevels.js';
import { processStringToEnum } from '../utils/helpers.js';
import GameEventState from '../enums/GameEventState.js'; // Import the new enum

export default class GameEvent {
    constructor(trigger, action, priority = PriorityLevels.MID) {
        this.trigger = trigger; // Instance of Trigger
        this.action = action;   // Instance of Action
        this.priority = priority; // Priority level, defaulting to MID if not specified
        this.state = GameEventState.READY; // Initialize state to READY
    }

    // Checks if the trigger conditions are met
    checkTrigger(context) {
        this.state = GameEventState.CHECKING_TRIGGER; // Update state
        const isTriggered = this.trigger.isTriggered(context);
        this.state = isTriggered ? GameEventState.TRIGGERED : GameEventState.READY; // Update state based on trigger
        return isTriggered;
    }

    // Executes the action if the trigger is met, with an option to force execution
    executeAction(context, force = false) {
        if (this.state !== GameEventState.READY) {
            console.log(`Cannot execute action; current state: ${this.state}`);
            return; // Do not execute if not in READY state
        }

        if (force || this.checkTrigger(context)) {
            this.state = GameEventState.PROCESSING_ACTION; // Update state before execution
            this.action.execute(context);
            this.state = GameEventState.COMPLETED_ACTION; // Update state after execution
        }
    }

    // Set the state of the GameEvent with validation
    setState(newState) {
        if (!Object.values(GameEventState).includes(newState)) {
            throw new Error(`Invalid state: ${newState}`);
        }
        this.state = newState;
    }

    // Convenience method to set the state to READY
    setStateReady() {
        this.setState(GameEventState.READY);
    }

    // Get the current state of the GameEvent
    getState() {
        return this.state;
    }

    // Serialization to JSON format
    toJSON() {
        return {
            trigger: this.trigger.toJSON(),
            action: this.action.toJSON(),
            priority: this.priority,
            state: this.state // Include state in JSON serialization
        };
    }

    // Deserialization from JSON format
    static fromJSON(json) {
        const priorityName = json.priority ? processStringToEnum(json.priority.name) : ''; // Check if json.priority exists
        const processedPriority = PriorityLevels[priorityName] || PriorityLevels.MID; // Default to MID if not found

        const gameEvent = new GameEvent(
            Trigger.fromJSON(json.trigger),
            Action.fromJSON(json.action),
            processedPriority
        );

        // Set the state from JSON, defaulting to READY if not provided
        gameEvent.setState(json.state || GameEventState.READY);
        
        return gameEvent;
    }
}
