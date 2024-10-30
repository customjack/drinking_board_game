// GameEngine.js

import GameState from '../models/GameState';
import TurnPhases from '../enums/TurnPhases';
import GamePhases from '../enums/GamePhases';
import ParticleAnimation from '../animations/ParticleAnimation';
import RollButtonManager from './managers/RollButtonManager';
import TimerManager from './managers/TimerManager';
import TimerAnimation from '../animations/TimerAnimation';
import PauseButtonManager from './managers/PauseButtonManager';


export default class GameEngine {
    /**
     * Constructs the GameEngine instance
     * @param {GameState} gameState - The current game state
     * @param {String} peerId - The peer ID of the current player
     * @param {Function} proposeGameState - Function to propose a new game state to the host
     * @param {EventBus} eventBus - Event bus to emit events
     * @param {Boolean} isHost - Whether this peer is the host
     */
    constructor(gameState, peerId, proposeGameState, eventBus, isHost = false) {
        this.gameState = gameState;
        this.peerId = peerId;
        this.eventBus = eventBus;
        this.proposeGameState = proposeGameState;
        this.isHost = isHost;

        // Initialize the roll button manager
        const particleAnimation = new ParticleAnimation();
        this.rollButtonManager = new RollButtonManager(particleAnimation);

        // Initialize the timer manager with the TimerAnimation and gameState
        const timerAnimation = new TimerAnimation(this.isHost);
        this.timerManager = new TimerManager(timerAnimation, this.gameState);

        // Initialize PauseButtonManager (only for host)
        if (isHost) {
            this.pauseButtonManager = new PauseButtonManager();
        }

        // Bind state handlers for game phases
        this.stateHandlers = {
            [GamePhases.IN_LOBBY]: this.handleInLobby.bind(this),
            [GamePhases.IN_GAME]: this.handleInGame.bind(this),
            [GamePhases.PAUSED]: this.handlePaused.bind(this),
            [GamePhases.GAME_ENDED]: this.handleGameEnded.bind(this),
        };

        // Bind state handlers for turn phases
        this.turnPhaseHandlers = {
            [TurnPhases.CHANGE_TURN]: this.handleChangeTurn.bind(this),
            [TurnPhases.BEGIN_TURN]: this.handleBeginTurn.bind(this),
            [TurnPhases.WAITING_FOR_MOVE]: this.handleWaitingForMove.bind(this),
            [TurnPhases.PLAYER_CHOOSING_DESTINATION]: this.handlePlayerChoosingDestination.bind(this),
            [TurnPhases.PROCESSING_MOVE]: this.handleProcessingMove.bind(this),
            [TurnPhases.PROCESSING_EVENTS]: this.handleProcessingEvents.bind(this), // New handler bound here
            [TurnPhases.END_TURN]: this.handleEndTurn.bind(this),
        };
    }

    // Initialize the GameEngine
    init() {
        const existingRollButton = document.getElementById('rollButton');
        this.rollButtonManager.init(
            existingRollButton,
            () => this.rollDiceForCurrentPlayer(),  // Perform the dice roll
            (rollResult) => this.handleAfterDiceRoll(rollResult) // After animation completes
        );

        // Initialize the timer manager
        this.timerManager.init(
            () => this.handleTimerEnd(),
            this.isHost ? () => this.togglePauseGame() : null // Pause callback only for host
        );

        /*
        if (this.isHost) {
            const existingPauseButton = document.getElementById('pauseButton');
            this.pauseButtonManager.init(existingPauseButton, () => this.togglePauseGame())
        }
            */
    }

    // Main method to update the game state
    updateGameState(gameState) {
        this.gameState = gameState;

        // Update the gameState in TimerManager to ensure it has the latest settings
        this.timerManager.gameState = gameState;

        // Handle game phase
        const gamePhaseHandler = this.stateHandlers[this.gameState.gamePhase];
        if (gamePhaseHandler) {
            gamePhaseHandler();
        } else {
            console.error(`No handler for game phase: ${this.gameState.gamePhase}`);
        }
    }

    // Game phase handlers
    handleInLobby() {
        console.log('Game is in the lobby phase.');
    }

    handleInGame() {
        // Handle turn phases within the in-game phase
        const turnPhaseHandler = this.turnPhaseHandlers[this.gameState.turnPhase];
        if (turnPhaseHandler) {
            this.timerManager.resumeTimer(); //Resumes timer if paused (does nothing otherwise)
            turnPhaseHandler();
        } else {
            console.error(`No handler for turn phase: ${this.gameState.turnPhase}`);
        }
    }

    handlePaused() {
        this.timerManager.pauseTimer();
        this.rollButtonManager.deactivate();
        console.log('Game is currently paused.');
    }

    handleGameEnded() {
        console.log('Game has ended.');
    }

    handleChangeTurn() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        this.eventBus.emit('changeTurn', { gamestate: this.gameState });
        
        if (currentPlayer.peerId === this.peerId) {
            this.gameState.setTurnPhase(TurnPhases.BEGIN_TURN);
            this.proposeGameStateWrapper(0); //propose change with no delay
        }
    }

    // Turn phase handlers
    handleBeginTurn() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        this.eventBus.emit('beginTurn', { gamestate: this.gameState });

        // Resets timer for all players
        this.timerManager.startTimer();

        if (currentPlayer.peerId === this.peerId) {
            console.log(`It's your turn, ${currentPlayer.nickname}!`);
            this.gameState.setTurnPhase(TurnPhases.WAITING_FOR_MOVE);
            this.proposeGameStateWrapper(0); //propose change with no delay
        }
    }

    handleWaitingForMove() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        this.eventBus.emit('waitingForMove', { gamestate: this.gameState });

        if (currentPlayer.peerId === this.peerId) {
            this.rollButtonManager.activate();
        } else {
            console.log(`Waiting for ${currentPlayer.nickname} to take their turn.`);
            this.rollButtonManager.deactivate();
        }
    }

    // New handler method for PLAYER_CHOOSING_DESTINATION
    handlePlayerChoosingDestination() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const currentSpaceId = currentPlayer.getCurrentSpaceId();
        const currentSpace = this.gameState.board.getSpace(currentSpaceId);
    
        // Get the connections from the current space
        const connections = currentSpace.connections;
        const targetSpaces = connections.map(conn => conn.target);
        console.log(`${currentPlayer.nickname} is choosing a destination...`);
        
        console.log(`${currentPlayer.nickname} has multiple choices to move to: ${targetSpaces.map(space => space.id).join(', ')}`);
        
        // Wait for a click event to determine the destination space
        if (currentPlayer.peerId === this.peerId) {
            this.waitForChoice(currentPlayer,targetSpaces);
        }
    }

    handleProcessingMove() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        this.eventBus.emit('processingMove', { gamestate: this.gameState });

        if (currentPlayer.peerId === this.peerId) {
            if (this.gameState.hasMovesLeft()) {
                this.processSingleMove();
            } else {
                // Transition to END_TURN phase
                this.gameState.setTurnPhase(TurnPhases.END_TURN);
                this.proposeGameStateWrapper();
            }
        }
    }

    handleProcessingEvents() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        console.log(`Processing events for ${currentPlayer.nickname}'s move.`);

        // Logic to process events triggered by the move
        const gameEvents = this.gameState.determineTriggeredEvents();
        gameEvents.forEach(gameEvent => {
            this.eventBus.emit('gameEventTriggered', { gameEvent: gameEvent, gamestate: this.gameState });
            this.processEvent(gameEvent); // Hypothetical method to apply event effects
        });

        // Transition back to PROCESSING_MOVE phase after events are processed
        this.gameState.setTurnPhase(TurnPhases.PROCESSING_MOVE);
        this.proposeGameStateWrapper();
    }

    handleEndTurn() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        console.log(`Ending turn for ${currentPlayer.nickname}.`);
        this.eventBus.emit('turnEnded', { gamestate: this.gameState });

        // Stop the timer for all players
        this.timerManager.stopTimer();

        if (currentPlayer.peerId === this.peerId) {

            // Move to the next player's turn
            this.gameState.nextPlayerTurn();

            // Transition to CHANGE_TURN phase
            this.gameState.setTurnPhase(TurnPhases.CHANGE_TURN);

            // Propose the updated game state
            this.proposeGameStateWrapper();
        }
    }

    // When the timer ends
    handleTimerEnd() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        //Maybe this would be better handled by the host, leaving it as such for now
        if (currentPlayer.peerId === this.peerId) {
            console.log(`Time's up for ${currentPlayer.nickname}! Ending turn.`);
            this.eventBus.emit('timerEnded', { gamestate: this.gameState});

            // Deactivate the roll button
            this.rollButtonManager.deactivate();

            // Transition to END_TURN phase
            this.gameState.setTurnPhase(TurnPhases.END_TURN);
            this.proposeGameStateWrapper();
        }
    }

    // Perform the dice roll and return the result
    rollDiceForCurrentPlayer() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const rollResult = currentPlayer.rollDice();
        console.log(`${currentPlayer.nickname} rolled a ${rollResult}`);

        // Deactivate the roll button after rolling
        this.rollButtonManager.deactivate();

        // Return the roll result to be used by RollButtonManager
        return rollResult;
    }

    /**
     * Method to handle actions after the dice roll animation ends.
     * @param {number} rollResult - The result of the dice roll.
     */
    handleAfterDiceRoll(rollResult) {
        // Update remaining moves and transition to the next phase
        this.gameState.setRemainingMoves(rollResult);
        this.eventBus.emit('playerRoll', { gamestate: this.gameState});
        this.gameState.setTurnPhase(TurnPhases.PROCESSING_MOVE);

        // Propose the updated game state to the host
        this.proposeGameStateWrapper();
    }

    processSingleMove() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const currentSpaceId = currentPlayer.getCurrentSpaceId();
        const currentSpace = this.gameState.board.getSpace(currentSpaceId); // Get the current space
    
        // Get the connections from the current space
        const connections = currentSpace.connections;
    
        if (connections.length === 1) {
            // Move the player automatically if there's only one connection
            const targetSpace = connections[0].target;
            currentPlayer.setCurrentSpaceId(targetSpace.id);
            console.log(`${currentPlayer.nickname} moved to space ${targetSpace.id}`);
            this.gameState.decrementMoves(); //decriment move by one
            this.proposeGameStateWrapper();
        } else if (connections.length > 1) {
            // Set a flag indicating the player is choosing a connection
            this.gameState.setTurnPhase(TurnPhases.PLAYER_CHOOSING_DESTINATION);
            this.proposeGameStateWrapper(0); //propose gamestate to host immediately
        }
        
    }

    // Method to wait for the player's choice
    waitForChoice(currentPlayer, targetSpaces) {
        // Highlight possible target spaces
        this.gameState.board.highlightSpaces(targetSpaces);

        // Track handlers so they can be removed
        const handlers = {};

        // Helper to create a unique handler for each space
        const createClickHandler = (space) => {
            return () => {
                // Move the player to the selected space
                currentPlayer.setCurrentSpaceId(space.id);
                this.gameState.decrementMoves();
                console.log(`${currentPlayer.nickname} chose to move to space ${space.id}`);
        
                // Clear highlights
                this.gameState.board.removeHighlightFromSpaces(targetSpaces);
        
                // Transition back to PROCESSING_MOVE phase
                this.gameState.setTurnPhase(TurnPhases.PROCESSING_MOVE);
        
                // Propose the updated game state to the host
                this.proposeGameStateWrapper();
        
                // Remove click listeners from all target spaces
                targetSpaces.forEach(targetSpace => {
                    const spaceElement = document.getElementById(`space-${targetSpace.id}`);
                    spaceElement.removeEventListener('click', handlers[targetSpace.id]);
                });
            };
        };

        // Add click listeners to target spaces
        targetSpaces.forEach(targetSpace => {
            const spaceElement = document.getElementById(`space-${targetSpace.id}`);
            const handler = createClickHandler(targetSpace);
            handlers[targetSpace.id] = handler; // Save handler reference for removal
            spaceElement.addEventListener('click', handler);
        });
    }

    

    // Toggle between play and pause
    togglePauseGame() {
        if (this.gameState.gamePhase === GamePhases.IN_GAME) {
            this.gameState.setGamePhase(GamePhases.PAUSED); // Set game state to PAUSED
            this.proposeGameStateWrapper(0); // Proposes (broadcasts) the game state with no delay
            this.timerManager.pauseTimer(); // Pause the timer
            this.rollButtonManager.deactivate();
            this.eventBus.emit('gamePaused', { gamestate: this.gameState });
            console.log('Game paused.');
        } else if (this.gameState.gamePhase === GamePhases.PAUSED) {
            this.gameState.setGamePhase(GamePhases.IN_GAME); // Resume the game
            this.proposeGameStateWrapper(0); // Proposes (broadcasts) the game state with no delay
            this.timerManager.resumeTimer(); // Resume the timer
            this.eventBus.emit('gameResumed', { gamestate: this.gameState });
            console.log('Game resumed.');
        }
    }

    // Wrapper to propose the game state with delay
    proposeGameStateWrapper(customDelay = -1) {
        const moveDelay = customDelay >= 0 ? customDelay : this.gameState.settings.getMoveDelay();  // Use custom delay if provided, otherwise default
        setTimeout(() => {
            this.proposeGameState(this.gameState);
        }, moveDelay);  // Apply the move delay or custom delay
    }
}
