import ActionTypes from '../enums/ActionTypes';
import TurnPhases from '../enums/TurnPhases';
import { processStringToEnum } from '../utils/helpers';

export default class Action {
    constructor(type, payload) {
        this.type = type;
        this.payload = payload || null; // Default payload to null if undefined
    }

    // Executes the action based on the type and payload
    execute(gameEngine) {
        const { gameState, eventBus, peerId } = gameEngine;

        this.emitEvent(eventBus, 'beforeActionExecution', gameEngine);

        const handler = this.getHandler();
        if (handler) {
            handler(gameEngine);
        } else {
            console.warn(`Action type "${this.type}" not recognized.`);
        }

        this.emitEvent(eventBus, 'afterActionExecution', gameEngine);
    }

    // Utility to emit events
    emitEvent(eventBus, eventType, gameEngine) {
        if (eventBus) {
            eventBus.emit(eventType, {
                action: this,
                gameState: gameEngine.gameState,
                space: gameEngine.gameEventWithSpace.space,
                peerId: gameEngine.peerId,
            });
        }
    }

    // Map action types to their corresponding handlers
    getHandler() {
        const handlers = {
            [ActionTypes.CODE]: this.handleCode.bind(this),
            [ActionTypes.PROMPT_ALL_PLAYERS]: this.handlePromptAllPlayers.bind(this),
            [ActionTypes.PROMPT_CURRENT_PLAYER]: this.handlePromptCurrentPlayer.bind(this),
            [ActionTypes.SET_CURRENT_PLAYER_TO_SPECTATOR]: this.handleSetCurrentPlayerToSpectator.bind(this),
            [ActionTypes.DISPLACE_PLAYER]: this.handleDisplacePlayer.bind(this),
            [ActionTypes.CUSTOM]: this.handleCustom.bind(this),
        };
        return handlers[this.type];
    }

    // Individual handlers
    handleCode(gameEngine) {
        if (this.payload) {
            eval(this.payload);
        } else {
            console.warn('No payload provided for CODE action.');
        }
    }

    handlePromptAllPlayers(gameEngine) {
        const { payload } = this;

        if (payload?.message && gameEngine.peerId) {
            console.log(`Prompting all players: ${payload.message}`);
            gameEngine.showPromptModal(payload.message);
        } else {
            this.logMissingParams(['payload', 'payload.message', 'peerId']);
        }
    }

    handlePromptCurrentPlayer(gameEngine) {
        const { payload } = this;

        if (payload?.message && gameEngine.peerId) {
            const currentPlayer = gameEngine.gameState.getCurrentPlayer();
            console.log(`Prompting ${currentPlayer.nickname}: ${payload.message}`);

            if (currentPlayer.peerId === gameEngine.peerId) {
                gameEngine.showPromptModal(payload.message);
            }
        } else {
            this.logMissingParams(['payload', 'payload.message', 'peerId']);
        }
    }

    handleSetCurrentPlayerToSpectator(gameEngine) {
        gameEngine.gameState.getCurrentPlayer().isSpectator = true;
        gameEngine.changePhase({ newTurnPhase: TurnPhases.PROCESSING_EVENTS, delay: 0 });
    }

    handleDisplacePlayer(gameEngine) {
        const { steps } = this.payload || {};
    
        if (steps === undefined) {
            this.logMissingParams(['payload.steps']);
            return;
        }
    
        const currentPlayer = gameEngine.gameState.getCurrentPlayer(); // Get the current player
        if (!currentPlayer) {
            console.warn(`No active player found in the game state.`);
            return;
        }
    
        if (steps > 0) {
            // Positive displacement: Add steps to remaining moves
            console.log(`Adding ${steps} moves to ${currentPlayer.nickname}'s remaining moves.`);
            gameEngine.gameState.setRemainingMoves(gameState.remainingMoves + steps);
    
        } else if (steps < 0) {
            // Negative displacement: Move back in movement history
            const moveBackSteps = Math.abs(steps);
    
            // Get the player's movement history
            const history = currentPlayer.movementHistory.getHistoryForTurn(gameState.getTurnNumber());
            if (history.length === 0) {
                console.warn(`${currentPlayer.nickname} has no movement history to move back.`);
                return;
            }
    
            // Determine the target index in the movement history
            const targetIndex = Math.max(0, history.length - moveBackSteps - 1);
    
            // Update the player's current position
            const targetPosition = history[targetIndex].spaceId;
            console.log(
                `Moving ${currentPlayer.nickname} back ${moveBackSteps} steps to position ${targetPosition}.`
            );
            currentPlayer.setCurrentSpaceId(targetPosition);
    
            // Truncate the movement history to reflect the new position
            currentPlayer.movementHistory.history = history.slice(0, targetIndex + 1);

            gameEngine.changePhase({ newTurnPhase: TurnPhases.PROCESSING_EVENTS, delay: 0 });
        } else {
            console.warn(`Displacement of 0 steps has no effect.`);
        }
    }    
    

    handleCustom() {
        console.log('Executing custom action...');
    }

    // Log missing parameters for clarity
    logMissingParams(params) {
        console.warn(`Action "${this.type}" missing parameters: ${params.join(', ')}`);
    }

    // Serialization
    toJSON() {
        return {
            type: this.type,
            payload: this.payload,
        };
    }

    // Deserialize from JSON and map type to ActionTypes enum
    static fromJSON(json) {
        return new Action(processStringToEnum(json.type), json.payload || null);
    }
}
