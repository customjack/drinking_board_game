// Host.js

import Peer from 'peerjs';
import Player from './Player';
import GameState from './GameState';
import BoardManager from './BoardManager';
import Settings from './Settings';


export default class Host {
    constructor(originalName, hostEventHandler, playerLimitPerPeer = 1, playerLimit = 8) {
        this.peer = null;
        this.allPlayers = [];
        this.ownedPlayers = [];
        this.connections = []; 
        this.originalName = originalName;
        this.eventHandler = hostEventHandler;
        this.gameState = null;  // Client's local copy of the game state

        //Settings
        this.settings = new Settings(playerLimitPerPeer,playerLimit);
    }

    async init() {
        this.peer = new Peer();

        this.peer.on('open', async (id) => {
            console.log('Host ID:', id);
            this.hostId = id;

            // Create the initial GameState
            await this.initializeGameState();

            this.setupUI();
            this.addPlayer(new Player(id, this.originalName,true));

            this.eventHandler.updatePlayerList(); // Ensure the player list is updated after the player is initialized

            this.peer.on('connection', (conn) => this.handleConnection(conn));
        });

        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            this.eventHandler.handleHostError();
        });
    }

    async initializeGameState() {
        const boardManager = new BoardManager();
        await boardManager.loadDefaultBoard();  // Load the board (returns a Promise)

        // After loading, create the GameState with the board and players
        this.gameState = new GameState(boardManager.board);

        console.log("GameState initialized", this.gameState);
    }

    setupUI() {
        const inviteCodeEl = document.getElementById('inviteCode');
        inviteCodeEl.textContent = this.hostId;

        this.eventHandler.displayLobbyForHost();
    }

    addPlayer(player) {
        // Check if the player already exists in the allPlayers array
        const isDuplicateInAllPlayers = this.allPlayers.some(existingPlayer => existingPlayer.playerId === player.playerId);
    
        if (!isDuplicateInAllPlayers) {
            this.allPlayers.push(player);
        } else {
            console.log('Duplicate player detected in allPlayers, skipping add.');
        }
        // Check if the player already exists in the gameState
        const isDuplicateInGameState = this.gameState.players.some(existingPlayer => existingPlayer.playerId === player.playerId);
    
        if (!isDuplicateInGameState) {
            this.gameState.addPlayer(player); // Add the player to gameState if not a duplicate
        } else {
            console.log('Duplicate player detected in gameState, skipping add.');
        }
    
        // Check if the player's peerId matches the client's peerId, and add to ownedPlayers if not a duplicate
        const isDuplicateInOwnedPlayers = this.ownedPlayers.some(existingPlayer => existingPlayer.playerId === player.playerId);
    
        if (player.peerId === this.peer.id && !isDuplicateInOwnedPlayers) {
            this.ownedPlayers.push(player); // Add the player to ownedPlayers if not a duplicate
        } else if (player.peerId === this.peer.id) {
            console.log('Duplicate player detected in ownedPlayers, skipping add.');
        }
    
        // Update the player list UI
        this.eventHandler.updateGameState();
    }
    
    
    removePlayer(playerId) {
        // Remove player from the allPlayers array
        this.allPlayers = this.allPlayers.filter(player => player.playerId !== playerId);
        
        // Remove player from the ownedPlayers array
        this.ownedPlayers = this.ownedPlayers.filter(player => player.playerId !== playerId);
        
        // Also remove player from the game state
        this.gameState.removePlayer(playerId);
        
        // Update the player list UI
        this.eventHandler.updateGameState();
    }
    
    removePeer(peerId) {
        // Find and remove all players associated with the given peerId
        const playersToRemove = this.allPlayers.filter(player => player.peerId === peerId);
        
        // Use removePlayer to remove each player associated with this peerId
        playersToRemove.forEach(player => this.removePlayer(player.playerId));
    }

    handleConnection(conn) {
        console.log('New connection from', conn.peer);
        this.connections.push(conn);

        // Send the initial GameState to the new client
        this.sendGameState(conn);

        conn.on('data', (data) => this.handleData(conn, data));
        conn.on('close', () => this.handleDisconnection(conn.peer));
    }

    sendGameState(conn) {
        if (this.gameState) {
            const gameStateData = this.gameState.toJSON();
            conn.send({ type: 'gameState', gameState: gameStateData });
        }
    }

    handleData(conn, data) {
        if (data.type === 'join') {
            this.handleJoin(conn, data);
        } else if (data.type === 'nameChange') {
            this.handleNameChange(data.playerId, data.newName);
        } else if (data.type === 'gameStateUpdate') {
            this.handleGameStateUpdateRequest();
        } else if (data.type === 'gameStateRequest') {
            this.sendGameState(conn);
        } else if (data.type === 'removePlayer') {
            this.handleClientRemovePlayer(data.playerId);
        } else if (data.type === 'proposeAddPlayer') {  
            this.handleClientAddPlayer(conn, data.player);
        }
    }

    handleClientAddPlayer(conn, newPlayerData) {
        const peerId = conn.peer;  // Get the peerId from the connection
    
        // Get the number of players already associated with this peerId

        const clientPlayersCount = this.allPlayers.filter(player => player.peerId === peerId).length;

        // Get the total number of players currently in the game
        const totalPlayersCount = this.allPlayers.length;
    
        // Assume this.hostPlayerLimit is the maximum allowed players per client
        if (clientPlayersCount >= this.settings.playerLimitPerPeer ) {
            // Reject the player addition, send a rejection message to the client along with the player data
            conn.send({
                type: 'addPlayerRejected',
                reason: `Player limit reached. You can only create up to ${this.settings.hostPlayerLimit} players.`,
                player: newPlayerData  // Send the rejected player data back to the client
            });
            console.log(`Player addition rejected for peerId ${peerId} due to player limit.`);
            return;  // Do not add the player
        }

        // Check if the total number of players exceeds the overall player limit
        if (totalPlayersCount >= this.settings.playerLimit) {
            // Reject the player addition due to exceeding the total player limit
            conn.send({
                type: 'addPlayerRejected',
                reason: `Total player limit reached. The game can only have up to ${this.settings.playerLimit} players.`,
                player: newPlayerData  // Send the rejected player data back to the client
            });
            console.log(`Player addition rejected for peerId ${peerId} due to total player limit.`);
            return;  // Do not add the player
        }
    
        // Deserialize the new player data to a Player object
        const newPlayer = Player.fromJSON(newPlayerData);
    
        this.addPlayer(newPlayer);
    
        // Broadcast the updated player list to all clients
        this.broadcastGameState();
    
        console.log(`Player added successfully for peerId ${peerId}. Player ID: ${newPlayer.playerId}`);
    }
    
    
    

    handleClientRemovePlayer(playerId) {
        // Find and remove the player from the host's list of players
        const playerIndex = this.allPlayers.findIndex((player) => player.playerId === playerId);
        
        if (playerIndex !== -1) {
            this.allPlayers.splice(playerIndex, 1);  // Remove the player from the array
            console.log(`Player with ID ${playerId} removed.`);
    
            // Broadcast the updated player list to all connected clients
            this.broadcastPlayerList();
        } else {
            console.log(`Player with ID ${playerId} not found.`);
        }
    }

    handleJoin(conn, data) {
        const players = data.players;
    
        // Check if the lobby is full based on total player limit
        const totalPlayersCount = this.allPlayers.length;
        const playersToAddCount = players.length;
    
        if (totalPlayersCount + playersToAddCount > this.settings.playerLimit) {
            // Reject the join request due to reaching the player limit
            conn.send({
                type: 'joinRejected',
                reason: `Lobby is full. The maximum player limit of ${this.settings.playerLimit} has been reached.`,
            });
            console.log(`Join request rejected. Player limit of ${this.settings.playerLimit} reached.`);
            return;
        }
    
        // Proceed if players can still be added
        if (!players || players.length === 0) {
            console.log('No players to add in the join request');
            return;
        }
    
        players.forEach(playerData => {
            // Create a new Player instance from the provided JSON data
            const newPlayer = new Player(conn.peer, playerData.nickname, playerData.isHost, playerData.playerId);
            
            // Add the player to the game
            this.addPlayer(newPlayer);
        });
    
        // After adding all the players, update everyone
        this.broadcastAll();
    }
    

    handleGameStateUpdateRequest() {
        const proposedGameState = GameState.fromJSON(data.gameStateUpdate);
        this.gameState = proposedGameState;
        this.eventHandler.updateGameState();
        this.broadcastGameState();
    }
    

    handleNameChange(playerId, newName) {
        const player = this.allPlayers.find((p) => p.playerId === playerId);
        if (player) {
            player.nickname = newName;
            this.broadcastPlayerList();
        }
    }

    handleDisconnection(peerId) {
        console.log(`Connection closed with ${peerId}`);
        this.removePeer(peerId);
    }

    broadcastAll() {
        this.broadcastSettings();
        this.broadcastGameState();
    }

    broadcastGameState() {
        const gameStateData = this.gameState.toJSON();
        this.connections.forEach(conn => {
            conn.send({ type: 'gameState', gameState: gameStateData });
        });
    }

    broadcastPlayerList() {
        // Use the toJSON method for each player
        const playersData = this.allPlayers.map((player) => player.toJSON());
    
        // Send the serialized player list to all connections
        this.connections.forEach((conn) => {
            conn.send({ type: 'playerList', players: playersData });
        });
    }

    broadcastBoard() {
        const serializedBoard = this.gameState.board.toJSON();
        this.connections.forEach((conn) => {
            conn.send({ type: 'boardData', board: serializedBoard });
        });
        console.log('Board broadcasted to all players:', serializedBoard);
    }

    broadcastStartGame() {
        //Update game start to start and broadcsat that first
        this.gameState.startGame();
        this.broadcastGameState();

        console.log('Sending start game signal to all clients...');
        this.connections.forEach((conn) => {
            conn.send({ type: 'startGame'});
        });
    }

    broadcastSettings() {
        const settings = this.settings.toJSON(); // Convert settings to a plain object
        
        this.connections.forEach((conn) => {
            conn.send({
                type: 'settings',
                settings: settings, // Broadcast all settings
            });
        });
    }

    kickPlayer(peerId) {
        console.log(`Kicking player with peerId: ${peerId}`);
        const connection = this.connections.find((conn) => conn.peer === peerId);
        if (connection) {
            connection.send({ type: 'kick' });
            connection.close();
            this.removePeer(peerId);
            this.broadcastPlayerList();
        }
    }

    addNewOwnedPlayer(playerName) {
        // Check if the total number of players is less than the allowed limit
        const totalPlayers = this.allPlayers.length;
        if (totalPlayers >= this.settings.playerLimit) {
            alert(`Cannot add more players. The maximum limit of ${this.settings.playerLimit} players has been reached.`);
            return;  // Exit the function if the limit is reached
        }

        const totalOwnedPlayers = this.ownedPlayers.length;
        if (totalOwnedPlayers > this.settings.playerLimitPerPeer) {
            alert(`Cannot add more players. The maximum limit of ${this.settings.playerLimitPerPeer} players for this peer has been reached.`);
            return;  // Exit the function if the limit is reached
        }
    
        const newPlayer = new Player(this.peer.id, playerName, false);  // Create a new player instance
    
        // Add the new player to the owned players array
        this.addPlayer(newPlayer);
    
        // Broadcast the game state for all clients
        this.eventHandler.updateGameState();
        this.broadcastGameState();
    }
    
}
