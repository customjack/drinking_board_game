import Player from './Player';
import Board from './Board';
import TurnPhases from '../enums/TurnPhases'; // Import TurnPhases enum
import GamePhases from '../enums/GamePhases'; // Import GamePhases enum
import GameEventState from '../enums/GameEventState.js'; // Import the new enum
import Settings from './Settings'; // Import the Settings class
import SharedRandomNumberGenerator from './SharedRandomNumberGenerator.js';

export default class GameState {
    constructor(board, factoryManager, players = [], settings = new Settings(), randomGenerator = new SharedRandomNumberGenerator(Math.random().toString(36).slice(2, 11))) {
        // Serialized Data
        this.board = board;
        this.factoryManager = factoryManager;
        this.players = players;
        this.remainingMoves = 0;
        this.turnPhase = TurnPhases.BEGIN_TURN;
        this.gamePhase = GamePhases.IN_LOBBY;
        this.settings = settings;

        // Unserialized Data
        this.triggeredEvents = [];

        // Initialize the SharedRandomNumberGenerator with the seed
        this.randomGenerator = randomGenerator;
    }

    // Start the game by setting the game phase to IN_GAME
    startGame() {
        this.turnPhase = TurnPhases.CHANGE_TURN; // Reset the turn phase
        this.gamePhase = GamePhases.IN_GAME;    // Transition to in-game phase
    }

    // End the game by setting the game phase to GAME_ENDED
    endGame() {
        this.gamePhase = GamePhases.GAME_ENDED;
    }

    // Check if the game has started
    isGameStarted() {
        return this.gamePhase === GamePhases.IN_GAME || this.gamePhase === GamePhases.PAUSED;
    }

    // Check if the game has ended
    isGameEnded() {
        return this.gamePhase === GamePhases.GAME_ENDED;
    }

    // Add a player to the game
    addPlayer(player) {
        player.setTurnsTaken(this.getTurnNumber() - 1); // Ensure they don't get a bunch of turns when they first join.
        this.players.push(player);
    }

    addPlayer(peerId, nickname, isHost = false, playerId = null) {
        // Create a new Player instance and initialize it
        const player = new Player(peerId, nickname, this.factoryManager, isHost, playerId);

        // Ensure the player doesn't get extra turns upon joining
        player.setTurnsTaken(this.getTurnNumber() - 1);

        // Add the player to the game state
        this.players.push(player);
        
        return player; //It is otherwise tedious to get the player you just created
    }

    // Remove a player from the game
    removePlayer(playerId) {
        this.players = this.players.filter(player => player.playerId !== playerId);
    }

    // Remove a client from the game based on peerId
    removeClient(peerId) {
        this.players = this.players.filter(player => player.peerId !== peerId);
    }

    // Get a player by their playerId (returns exactly one player)
    getPlayerByPlayerId(playerId) {
        return player = this.players.find(player => player.playerId === playerId);
    }

    // Get a list of players by their peerId (returns an array of players)
    getPlayersByPeerId(peerId) {
        return this.players.filter(player => player.peerId === peerId);
    }


    // Get the current player (based on the fewest turns taken)
    getCurrentPlayer() {
        if (this.players.length === 0) {
            return null;
        }

        return this.players.reduce((prev, current) => {
            return current.turnsTaken < prev.turnsTaken ? current : prev;
        });
    }

    // Get the current turn number (minimum turns taken + 1)
    getTurnNumber() {
        if (this.players.length === 0) {
            return 1; // Default to turn 1 if there are no players
        }

        const minTurnsTaken = Math.min(...this.players.map(player => player.turnsTaken));
        return minTurnsTaken + 1;
    }

    // Check all spaces to see if any events are triggered based on the current game state
    determineTriggeredEvents(eventBus = null, peerId = null) {
        const triggeredEvents = [];

        // Loop through all spaces on the board to check for triggered events
        for (const space of this.board.spaces) {
            // For each event on the space, check if it should be triggered
            const context = {
                gameState: this,
                space: space,
                eventBus: eventBus,
                peerId: peerId
            };

            for (const event of space.events) {
                //console.log("Space and event:", space, event);
                // Check if the event is in the READY state before checking the trigger
                if (event.checkTrigger(context)) {
                    // Include the space in the event for context
                    triggeredEvents.push({ event, space }); // Add the triggered event along with its space to the list
                }
            }
        }

        // Sort the triggered events by priority
        this.triggeredEvents = triggeredEvents.sort((a, b) => {
            const aPriority = a.event.priority.value;
            const bPriority = b.event.priority.value;
            return bPriority - aPriority; // Sort in descending order (highest to lowest priority)
        });

        return this.triggeredEvents;
    }

    // Get the triggered events without recalculating
    getTriggeredEvents() {
        return this.triggeredEvents;
    }


    // Reset all COMPLETED events to READY
    resetEvents() {
        for (const space of this.board.spaces) {
            for (const event of space.events) {
                if (event.state === GameEventState.COMPLETED_ACTION) {
                    event.state = GameEventState.READY;
                }
            }
        }
    }

    // Update stats for a player
    updatePlayerStats(statName, delta) {
        const player = this.getCurrentPlayer();
        player.updateStat(statName, delta);
    }

    // Move to the next player's turn (increment their turns taken)
    nextPlayerTurn() {
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer) {
            currentPlayer.turnsTaken++;
            this.turnPhase = TurnPhases.BEGIN_TURN; // Mark the end of the current player's turn
        }
    }

    // Set the remaining moves for the current player
    setRemainingMoves(moves) {
        this.remainingMoves = moves;
    }

    // Reduce the remaining moves
    decrementMoves(amount = 1) {
        this.remainingMoves = this.remainingMoves - amount < 0 ? 0 : this.remainingMoves - amount;
    }

    // Move Player
    movePlayer(spaceId, playerId = null, movesDecremented = 1) {
        // Determine the current player based on playerId or fallback to the current player
        const currentPlayer = playerId 
            ? this.players.find(player => player.playerId === playerId) 
            : this.getCurrentPlayer();
    
        if (!currentPlayer) {
            console.error(`No player found with ID: ${playerId}`);
            return;
        }
    
        // If the player has no movement history (first time moving), add their initial space
        if (currentPlayer.movementHistory.isEmpty()) {
            console.log(`${currentPlayer.nickname} starts at space ${spaceId}`);
            currentPlayer.movementHistory.addMove(this.getTurnNumber(), currentPlayer.currentSpaceId, this.remainingMoves);
        }
    
        // Move the player to the specified space
        currentPlayer.setCurrentSpaceId(spaceId);

        // Decrement the remaining moves
        this.decrementMoves(movesDecremented);
    
        // Track the movement history for subsequent moves
        currentPlayer.movementHistory.addMove(this.getTurnNumber(), spaceId, this.remainingMoves);
    
    }
    


    // Check if the current player has any remaining moves
    hasMovesLeft() {
        return this.remainingMoves > 0;
    }

    // Change the turn phase (e.g., BEGIN_TURN, END_TURN, etc.)
    setTurnPhase(phase) {
        if (Object.values(TurnPhases).includes(phase)) {
            if (phase === TurnPhases.END_TURN) {
                this.setRemainingMoves(0);
            }
            this.turnPhase = phase;
        } else {
            console.error(`Invalid turn phase: ${phase}`);
        }
    }

    setGamePhase(phase) {
        if (Object.values(GamePhases).includes(phase)) {
            this.gamePhase = phase;
        } else {
            console.error(`Invalid game phase: ${phase}`);
        }
    }

    // Serialize the game state to JSON (using the random generator's toJSON)
    toJSON() {
        return {
            board: this.board.toJSON(),
            players: this.players.map(player => player.toJSON()),
            remainingMoves: this.remainingMoves,
            turnPhase: this.turnPhase,
            gamePhase: this.gamePhase,
            settings: this.settings.toJSON(),
            randomGenerator: this.randomGenerator.toJSON() // Serialize the random generator
        };
    }

    // Deserialize the game state from JSON (using the random generator's fromJSON)
    static fromJSON(json, factoryManager) {
        const board = Board.fromJSON(json.board);
        const players = json.players.map(playerData => Player.fromJSON(playerData, factoryManager));
        const settings = Settings.fromJSON(json.settings);
        const randomGenerator = SharedRandomNumberGenerator.fromJSON(json.randomGenerator);
        const gameState = new GameState(board, factoryManager, players, settings, randomGenerator); 

        gameState.remainingMoves = json.remainingMoves;
        gameState.turnPhase = json.turnPhase;
        gameState.gamePhase = json.gamePhase;
        
        return gameState;
    }
}
