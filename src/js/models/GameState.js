import Player from './Player';
import Board from './Board';
import TurnPhases from '../enums/TurnPhases'; // Import TurnPhases enum
import GamePhases from '../enums/GamePhases'; // Import GamePhases enum
import Settings from './Settings'; // Import the Settings class

export default class GameState {
    constructor(board, players = [], settings = new Settings()) {
        this.board = board; // Game board
        this.players = players; // List of players
        this.remainingMoves = 0; // Remaining moves for the current player
        this.turnPhase = TurnPhases.BEGIN_TURN; // Start with the beginning turn phase
        this.gamePhase = GamePhases.IN_LOBBY; // Set initial game phase to lobby
        this.settings = settings; // Game settings
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

    // Remove a player from the game
    removePlayer(playerId) {
        this.players = this.players.filter(player => player.playerId !== playerId);
    }

    // Remove a client from the game based on peerId
    removeClient(peerId) {
        this.players = this.players.filter(player => player.peerId !== peerId);
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

    // Reduce the remaining moves by 1
    decrementMoves() {
        this.remainingMoves--;
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

    // Serialize the game state to JSON (for sharing across clients)
    toJSON() {
        return {
            board: this.board.toJSON(),
            players: this.players.map(player => player.toJSON()),
            remainingMoves: this.remainingMoves,
            turnPhase: this.turnPhase, // Include the current turn phase
            gamePhase: this.gamePhase,  // Include the current game phase
            settings: this.settings.toJSON() // Include the game settings
        };
    }

    // Deserialize the game state from JSON (for initializing or syncing with clients)
    static fromJSON(json) {
        const board = Board.fromJSON(json.board);
        const players = json.players.map(playerData => Player.fromJSON(playerData));
        const settings = Settings.fromJSON(json.settings); // Create settings from JSON
        const gameState = new GameState(board, players, settings);
        gameState.remainingMoves = json.remainingMoves;
        gameState.turnPhase = json.turnPhase;
        gameState.gamePhase = json.gamePhase;
        return gameState;
    }
}
