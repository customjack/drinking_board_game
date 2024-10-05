import Peer from 'peerjs';
import Player from './Player';
import GameState from './GameState';
import Board from './Board';
import BoardManager from './BoardManager';
import Settings from './Settings';

export default class Client {
    constructor(originalName, hostId, clientEventHandler) {
        this.peer = null;
        this.conn = null;
        this.ownedPlayers = [];
        this.originalName = originalName;
        this.hostId = hostId;
        this.eventHandler = clientEventHandler;
        this.allPlayers = [];  // List of players, including the client itself
        this.gameState = null;  // The local copy of the GameState
        this.settings = null;
    }

    async init() {
        this.peer = new Peer();

        this.peer.on('open', async (id) => {
            console.log('My ID:', id);
            this.ownedPlayers = [new Player(id, this.originalName)];
            this.allPlayers.push(this.ownedPlayers[0]);  // Add the client itself to the list of players

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
        this.gameState = new GameState(boardManager.board, this.allPlayers);

        console.log("GameState initialized with board:", this.gameState.board);
    }

    handleOpenConnection() {
        console.log('Connected to host');

        const playersJSON = this.ownedPlayers.map(player => player.toJSON());

        this.conn.send({
            type: 'join',
            peerId: this.peer.id,
            players: playersJSON,
        });

        const inviteCodeEl = document.getElementById('inviteCode');
        if (inviteCodeEl) {
            inviteCodeEl.textContent = this.hostId;
        }

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
            this.handlePlayerLists(data.players);  // Update the local list of players
        } else if (data.type === 'kick') {
            this.handleKick();
        } else if (data.type === 'boardData') {
            this.handleBoardData(data.board);
        } else if (data.type === 'gameState') {
            this.handleGameStateUpdate(data.gameState);
        } else if (data.type === 'startGame') {
            // Signal received to start the game
            this.handleStartGame();  // Switch the client to the game page
        } else if (data.type === 'settings') { // Handling player limit
            this.handleSettings(data.settings);
        } else if (data.type === 'addPlayerRejected') {
            // The rejected player data is sent back, so remove it from ownedPlayers
            this.handleAddPlayerRejected(data.player);
        } else if (data.type === 'joinRejected') {
            // Handle the join rejection message
            this.handleJoinRejected(data.reason);
        }
    }

    handleJoinRejected(reason) {
        alert(`Join request rejected: ${reason}`);
        location.reload();  // Reload the page to reset the client
    }

    handleStartGame() {
        this.eventHandler.showGamePage();  // Switch the client to the game page
    }

    handleAddPlayerRejected(rejectedPlayer) {
        const rejectedPlayerId = rejectedPlayer.playerId;
        this.ownedPlayers = this.ownedPlayers.filter(player => player.playerId !== rejectedPlayerId);
        alert(`Player addition rejected: ${data.reason}`);
    }

    handleSettings(settingsData) {
        this.settings = Settings.fromJSON(settingsData); // Convert JSON data to Settings instance
        console.log('Settings received:', this.settings);
        if (this.settings) {
            console.log(`Player limit per peer: ${this.settings.playerLimitPerPeer}`);
            console.log(`Total player limit: ${this.settings.playerLimit}`);

            // Update the displayed settings on the client UI
            this.eventHandler.updateDisplayedSettings();
        }
    }

    handleBoardData(boardData) {
        console.log('Received board data from host:', boardData);
        this.gameState.board = Board.fromJSON(boardData);  // Directly update the GameState's board
        this.eventHandler.updateGameState();  // Redraw the board using the GameState
    }

    handleGameStateUpdate(gameStateData) {
        this.gameState = GameState.fromJSON(gameStateData);  // Sync local game state with the host's state
        console.log('Game state updated:', this.gameState);
        if(this.gameState.isGameStarted()) {
            this.eventHandler.showGamePage();
        } else {
            this.eventHandler.showLobbyPage();
        }
        this.allPlayers = this.gameState.players;  // Sync players list with the game state
        this.eventHandler.updateGameState(); 
    }

    // Send the full GameState to the host
    sendGameState() {
        if (this.conn && this.gameState) {
            const gameStateJSON = this.gameState.toJSON();  // Serialize the entire GameState to JSON
            this.conn.send({
                type: 'gameStateUpdate',
                peerId: this.ownedPlayers.peerId,
                gameState: gameStateJSON  // Send the full GameState
            });
        }
    }

    handleKick() {
        alert('You have been kicked from the game.');
        location.reload();
    }

    handlePlayerLists(playersData) {
        // Update the local list of players with the new data
        this.allPlayers = playersData.map(playerData => Player.fromJSON(playerData));
        this.eventHandler.updateGameState();
        console.log("Players list updated:", this.allPlayers);
        this.eventHandler.updateAddPlayerButton();
    }

    addNewOwnedPlayer(playerName) {
        const newPlayer = new Player(this.peer.id, playerName, false);  // Create a new player instance
        this.ownedPlayers.push(newPlayer);  // Add the new player to the owned players array

        // Send the new player info to the host
        this.conn.send({
            type: 'proposeAddPlayer',
            player: newPlayer.toJSON(),  // Send the new player's data to the host
        });

        // Check if the Add Player button should be hidden after adding the player
        this.eventHandler.updateAddPlayerButton();
    }
}
