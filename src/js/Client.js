import Peer from 'peerjs';
import Player from './Player';
import GameState from './GameState';
import Board from './Board';
import BoardManager from './BoardManager';

export default class Client {
    constructor(playerName, hostId, clientEventHandler) {
        this.peer = null;
        this.conn = null;
        this.player = null;
        this.playerName = playerName;
        this.hostId = hostId;
        this.eventHandler = clientEventHandler;
        this.players = [];  // List of players, including the client itself
        this.gameState = null;  // The local copy of the GameState
    }

    async init() {
        this.peer = new Peer();

        this.peer.on('open', async (id) => {
            console.log('My ID:', id);
            this.player = new Player(id, this.playerName);
            this.players.push(this.player);  // Add the client itself to the list of players

            this.conn = this.peer.connect(this.hostId);

            this.eventHandler.updatePlayerList(); // Ensure the player list is updated after the player is initialized

            // Create the initial GameState
            await this.initializeGameState();

            this.conn.on('open', () => this.handleOpenConnection());
            this.conn.on('data', (data) => this.handleData(data));
            this.conn.on('close', () => this.handleDisconnection());
        });

        this.peer.on('error', (err) => this.handleConnectionError(err));
    }

    async initializeGameState() {
        const boardManager = new BoardManager();
        await boardManager.loadDefaultBoard();  // Load the board (returns a Promise)

        // Create the GameState with the board and initial players list (including the client itself)
        this.gameState = new GameState(boardManager.board, this.players);

        console.log("GameState initialized with board:", this.gameState.board);
    }

    handleOpenConnection() {
        console.log('Connected to host');

        this.conn.send({
            type: 'join',
            peerId: this.player.peerId,
            nickname: this.player.nickname,
        });

        const inviteCodeEl = document.getElementById('inviteCode');
        if (inviteCodeEl) {
            inviteCodeEl.textContent = this.hostId;
        }

        this.eventHandler.displayLobbyForPlayer();
    }

    handleConnectionError(err) {
        alert('The lobby does not exist or the connection failed. Please try again.');
        location.reload();
    }

    handleDisconnection() {
        alert('Disconnected from the host.');
        location.reload();
    }

    // Handle incoming data from the host or other clients
    handleData(data) {
        if (data.type === 'playerList') {
            this.updatePlayersList(data.players);  // Update the local list of players
        } else if (data.type === 'kick') {
            this.handleKick();
        } else if (data.type === 'boardData') {
            this.handleBoardData(data.board);
        } else if (data.type === 'gameState') {
            this.handleGameStateUpdate(data.gameState);
        } else if (data.type === 'startGame') {
            // Signal received to start the game
            this.eventHandler.startGame();  // Switch the client to the game page
        }
    }

    updatePlayersList(playersData) {
        // Update the local list of players with the new data
        this.players = playersData.map(playerData => Player.fromJSON(playerData));
        this.eventHandler.updatePlayerList();
        console.log("Players list updated:", this.players);
    }

    handleBoardData(boardData) {
        console.log('Received board data from host:', boardData);
        this.gameState.board = Board.fromJSON(boardData);  // Directly update the GameState's board
        this.eventHandler.updateGameBoard();  // Redraw the board using the GameState
    }

    handleGameStateUpdate(gameStateData) {
        this.gameState = GameState.fromJSON(gameStateData);  // Sync local game state with the host's state
        console.log('Game state updated:', this.gameState);
        this.players = this.gameState.players;  // Sync players list with the game state
        this.eventHandler.updateGameBoard();  // Update the board and UI based on the new state
        this.eventHandler.updatePlayerList();  // Update the players list in the UI
    }

    // Send the full GameState to the host
    sendGameState() {
        if (this.conn && this.gameState) {
            const gameStateJSON = this.gameState.toJSON();  // Serialize the entire GameState to JSON
            this.conn.send({
                type: 'gameStateUpdate',
                peerId: this.player.peerId,
                gameState: gameStateJSON  // Send the full GameState
            });
        }
    }

    handleKick() {
        alert('You have been kicked from the game.');
        location.reload();
    }
}
