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
            // Get the PlaceholderRegistry from the game engine
            const placeholderRegistry = gameEngine.registryManager.getRegistry('placeholderRegistry');
    
            if (placeholderRegistry) {
                // Temporarily add the CURRENT_PLAYER_NAME placeholder if needed
                placeholderRegistry.register('CURRENT_PLAYER_NAME', (gameEngine) => {
                    const currentPlayer = gameEngine.gameState.getCurrentPlayer();
                    return currentPlayer ? currentPlayer.nickname : 'Unknown Player';
                });
    
                // Create a copy of payload.message for processing
                let processed_message = payload.message;
    
                // Replace placeholders in the message and pass gameEngine as context
                processed_message = placeholderRegistry.replacePlaceholders(processed_message, gameEngine);
    
                // After message editing, unregister CURRENT_PLAYER_NAME to prevent future use
                placeholderRegistry.unregister('CURRENT_PLAYER_NAME');
    
                console.log(`Prompting all players: ${processed_message}`);
                gameEngine.showPromptModal(processed_message);
            }
        } else {
            this.logMissingParams(['payload', 'payload.message', 'peerId']);
        }
    }
    
    handlePromptCurrentPlayer(gameEngine) {
        const { payload } = this;
    
        if (payload?.message && gameEngine.peerId) {
            const currentPlayer = gameEngine.gameState.getCurrentPlayer();
            
            // Get the PlaceholderRegistry from the game engine
            const placeholderRegistry = gameEngine.registryManager.getRegistry('placeholderRegistry');
            
            if (placeholderRegistry) {
                // Temporarily add the CURRENT_PLAYER_NAME placeholder if needed
                placeholderRegistry.register('CURRENT_PLAYER_NAME', (gameEngine) => {
                    const currentPlayer = gameEngine.gameState.getCurrentPlayer();
                    return currentPlayer ? currentPlayer.nickname : 'Unknown Player';
                });
    
                // Create a copy of payload.message for processing
                let processed_message = payload.message;
    
                // Replace placeholders in the message and pass gameEngine as context
                processed_message = placeholderRegistry.replacePlaceholders(processed_message, gameEngine);
    
                // After message editing, unregister CURRENT_PLAYER_NAME to prevent future use
                placeholderRegistry.unregister('CURRENT_PLAYER_NAME');
    
                console.log(`Prompting ${currentPlayer.nickname}: ${processed_message}`);
    
                if (currentPlayer.peerId === gameEngine.peerId) {
                    gameEngine.showPromptModal(processed_message);
                }
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
            gameEngine.gameState.setRemainingMoves(gameEngine.gameState.remainingMoves + steps);
        
        } else if (steps < 0) {
            // Negative displacement: Move back in movement history
            const moveBackSteps = Math.abs(steps);
        
            if (currentPlayer.movementHistory.flattenHistory().length === 0) {
                console.warn(`${currentPlayer.nickname} has no movement history to move back.`);
                return;
            }
    
        
            // Flatten the history and filter out backtracked moves
            const flatHistory = currentPlayer.movementHistory.flattenHistory().filter(move => !move.isBacktracked);
        
            // Calculate the target index after moving back the specified steps
            const targetIndex = Math.max(0, flatHistory.length - moveBackSteps - 1);
        
            // Get the target move (the move we want to go back to)
            const targetMove = flatHistory[targetIndex];
        
            if (!targetMove) {
                console.warn(`Cannot move ${currentPlayer.nickname} back ${moveBackSteps} steps as there aren't enough previous moves.`);
                return;
            }
        
            // Update the player's current position
            const targetPosition = targetMove.spaceId;
            console.log(
                `Moving ${currentPlayer.nickname} back ${moveBackSteps} steps to position ${targetPosition}.`
            );
            currentPlayer.setCurrentSpaceId(targetPosition);
        
            // Mark the moves as backtracked
            for (let i = targetIndex + 1; i < currentPlayer.movementHistory.flattenHistory().length; i++) {
                const move = currentPlayer.movementHistory.flattenHistory()[i];
                move.markAsBacktracked();
            }
        
        } else {
            console.warn(`Displacement of 0 steps has no effect.`);
        }
        
        gameEngine.changePhase({ newTurnPhase: TurnPhases.PROCESSING_EVENTS, delay: 0 });
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
