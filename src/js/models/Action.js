import ActionTypes from '../enums/ActionTypes';
import TurnPhases from '../enums/TurnPhases';
import { processStringToEnum } from '../utils/helpers';

export default class Action {
    constructor(type, payload) {
        this.type = type;
        this.payload = payload; // Allow payload to be undefined
    }

    // Executes the action based on the type and payload
    execute(gameEngine) {

        // Destructure necessary properties from the context
        const { event: gameEvent, space: eventSpace } = gameEngine.gameEventWithSpace;
        const gameState = gameEngine.gameState;
        const space = eventSpace;
        const eventBus = gameEngine.eventBus;
        const peerId = gameEngine.peerId;


        // Emit an event before executing the action if the eventEmitter is provided
        if (eventBus) {
            eventBus.emit('beforeActionExecution', { action: this, gameState: gameState, space: space, peerId: peerId }); //peerId is probably redundant
        }

        switch (this.type) {
            case ActionTypes.CODE:
                if (this.payload) {
                    eval(this.payload); // Execute custom JavaScript action if payload exists
                } else {
                    console.warn('No payload provided for CODE action.');
                }
                break;
            case ActionTypes.PROMPT_ALL_PLAYERS:
                // Example action for all players
                if (this.payload && this.payload.message && peerId) {
                    console.log(`Prompting all players: ${this.payload.message}`);
                    gameEngine.showPromptModal(this.payload.message)
                } else {
                    const missingParams = [];
                    if (!this.payload) missingParams.push('payload');
                    if (this.payload && !this.payload.message) missingParams.push('payload.message');
                    if (peerId) missingParams.push('peerId');

                    console.warn(`PROMPT_ALL_PLAYERS action missing parameters: ${missingParams.join(', ')}`);
                }
                break;
            case ActionTypes.PROMPT_CURRENT_PLAYER:
                // Example action for the current player
                if (this.payload && this.payload.message && peerId) {
                    console.log(`Prompting ${gameState.getCurrentPlayer().nickname}: ${this.payload.message}`);
                    if (gameState.getCurrentPlayer().peerId == peerId) {
                        gameEngine.showPromptModal(this.payload.message)
                    }
                } else {
                    const missingParams = [];
                    if (!this.payload) missingParams.push('payload');
                    if (this.payload && !this.payload.message) missingParams.push('payload.message');
                    if (peerId) missingParams.push('peerId');
                
                    console.warn(`PROMPT_CURRENT_PLAYER action missing parameters: ${missingParams.join(', ')}`);
                }
                break;
            case ActionTypes.SET_CURRENT_PLAYER_TO_SPECTATOR:
                gameState.getCurrentPlayer().isSpectator = true;
                gameEngine.changePhase({ newTurnPhase: TurnPhases.PROCESSING_EVENTS, delay: 0 });
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
            eventBus.emit('afterActionExecution', { action: this, gameState: gameState, space: space, peerId: peerId }); //peerId is probably redundant
        }
    }


    // Serialization
    toJSON() {
        return {
            type: this.type,
            payload: this.payload || null // Ensure payload is present in JSON output
        };
    }

    // Deserialize from JSON and map type to ActionTypes enum
    static fromJSON(json) {
        const processedType = processStringToEnum(json.type);
        const payload = json.payload !== undefined ? json.payload : null; // Default to null if payload is missing
        return new Action(processedType, payload);
    }
}
