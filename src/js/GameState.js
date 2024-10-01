import Player from './Player';
import Board from './Board';

export default class GameState {
    constructor(board, players = []) {
        this.board = board; // Game board (spaces and connections)
        this.players = players; // List of players
        this.currentPlayerIndex = 0; // Index of the current player's turn
        this.remainingMoves = 0; // Remaining moves for the current player
    }

    // Add a player to the game
    addPlayer(player) {
        this.players.push(player);
    }

    // Remove a player from the game
    removePlayer(peerId) {
        this.players = this.players.filter(player => player.peerId !== peerId);
    }

    // Get the current player (whose turn it is)
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // Update the current player's position
    updatePlayerPosition(newPosition) {
        const player = this.getCurrentPlayer();
        player.position = newPosition;
    }

    // Get the current player's position
    getPlayerPosition() {
        return this.getCurrentPlayer().position;
    }

    // Update stats for a player
    updatePlayerStats(statName, delta) {
        const player = this.getCurrentPlayer();
        player.updateStat(statName, delta);
    }

    // Move to the next player's turn
    nextPlayerTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    // Set remaining moves for the current player
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

    // Serialize the game state to JSON (for sharing across clients)
    toJSON() {
        return {
            board: this.board.toJSON(),
            players: this.players.map(player => player.toJSON()),
            currentPlayerIndex: this.currentPlayerIndex,
            remainingMoves: this.remainingMoves
        };
    }

    // Deserialize the game state from JSON (for initializing or syncing with clients)
    static fromJSON(json) {
        const board = Board.fromJSON(json.board);
        const players = json.players.map(playerData => Player.fromJSON(playerData));
        const gameState = new GameState(board, players);
        gameState.currentPlayerIndex = json.currentPlayerIndex;
        gameState.remainingMoves = json.remainingMoves;
        return gameState;
    }
}
