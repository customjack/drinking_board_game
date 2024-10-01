// Host.js

import Peer from 'peerjs';
import Player from './Player';
import GameState from './GameState';
import BoardManager from './BoardManager';

export default class Host {
    constructor(hostName, hostEventHandler) {
        this.peer = null;
        this.hostId = null;
        this.players = []; // All players in the game
        this.connections = new Map(); // Map of peerId to PeerJS connections
        this.hostName = hostName;
        this.eventHandler = hostEventHandler;
        this.gameState = null; // Host's local copy of the game state

        // Map to track multiple players per peerId
        this.peerToPlayersMap = new Map(); // peerId => [Player, Player, ...]
    }

    async init() {
        this.peer = new Peer();

        this.peer.on('open', async (id) => {
            console.log('Host ID:', id);
            this.hostId = id;
            this.setupUI();

            // Create the host player
            const hostPlayer = new Player(id, this.hostName, true);
            this.addPlayer(hostPlayer);

            // Initialize the GameState after adding the host player
            await this.initializeGameState();

            // Listen for incoming connections
            this.peer.on('connection', (conn) => this.handleConnection(conn));
        });

        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            this.eventHandler.handleHostError();
        });
    }

    async initializeGameState() {
        const boardManager = new BoardManager();
        await boardManager.loadDefaultBoard(); // Load the board (returns a Promise)

        // After loading, create the GameState with the board and players
        this.gameState = new GameState(boardManager.board, this.players);

        console.log("GameState initialized with board:", this.gameState.board);
    }

    setupUI() {
        const inviteCodeEl = document.getElementById('inviteCode');
        inviteCodeEl.textContent = this.hostId;

        this.eventHandler.displayLobbyForHost();
    }

    /**
     * Adds a player to the game and updates relevant mappings.
     * @param {Player} player - The player object to add.
     */
    addPlayer(player) {
        this.players.push(player);
        this.eventHandler.updatePlayerList();

        // Update peerToPlayersMap
        if (this.peerToPlayersMap.has(player.peerId)) {
            this.peerToPlayersMap.get(player.peerId).push(player);
        } else {
            this.peerToPlayersMap.set(player.peerId, [player]);
        }
    }

    /**
     * Removes a player from the game and updates relevant mappings.
     * @param {Player} player - The player object to remove.
     */
    removePlayer(player) {
        this.players = this.players.filter((p) => p.gameId !== player.gameId);
        this.eventHandler.updatePlayerList();

        // Update peerToPlayersMap
        if (this.peerToPlayersMap.has(player.peerId)) {
            const updatedPlayers = this.peerToPlayersMap.get(player.peerId).filter(p => p.gameId !== player.gameId);
            if (updatedPlayers.length > 0) {
                this.peerToPlayersMap.set(player.peerId, updatedPlayers);
            } else {
                this.peerToPlayersMap.delete(player.peerId);
            }
        }
    }

    /**
     * Handles a new peer connection.
     * @param {Peer.DataConnection} conn - The PeerJS connection object.
     */
    handleConnection(conn) {
        const peerId = conn.peer;
        console.log('New connection from', peerId);

        // Store the connection
        this.connections.set(peerId, conn);

        // Initialize an empty array for players from this peer
        this.peerToPlayersMap.set(peerId, []);

        // Send the initial GameState to the new client
        this.sendGameState(conn);

        // Handle incoming data from the connection
        conn.on('data', (data) => this.handleData(conn, data));

        // Handle disconnection
        conn.on('close', () => this.handleDisconnection(peerId));

        conn.on('error', (err) => {
            console.error(`Connection error with ${peerId}:`, err);
            this.handleDisconnection(peerId);
        });
    }

    /**
     * Sends the current GameState to a specific connection.
     * @param {Peer.DataConnection} conn - The PeerJS connection object.
     */
    sendGameState(conn) {
        if (this.gameState) {
            const gameStateData = this.gameState.toJSON();
            conn.send({ type: 'gameState', gameState: gameStateData });
        }
    }

    /**
     * Broadcasts the current GameState to all connected peers.
     */
    broadcastGameState() {
        const gameStateData = this.gameState.toJSON();
        this.connections.forEach((conn) => {
            conn.send({ type: 'gameState', gameState: gameStateData });
        });
    }

    /**
     * Broadcasts the player list to all connected peers.
     */
    broadcastPlayerList() {
        const playersData = this.players.map((player) => ({
            peerId: player.peerId,
            nickname: player.nickname,
            isHost: player.isHost,
            gameId: player.gameId
        }));

        this.connections.forEach((conn) => {
            conn.send({ type: 'playerList', players: playersData });
        });
    }

    /**
     * Broadcasts the board data to all connected peers.
     */
    broadcastBoard() {
        if (this.gameState && this.gameState.board) {
            const serializedBoard = this.gameState.board.toJSON();
            this.connections.forEach((conn) => {
                conn.send({ type: 'boardData', board: serializedBoard });
            });
            console.log('Board broadcasted to all players:', serializedBoard);
        }
    }

    /**
     * Broadcasts the start game signal to all connected peers.
     */
    broadcastStartGame() {
        console.log('Sending start game signal to all clients...');
        this.connections.forEach((conn) => {
            conn.send({ type: 'startGame' });
        });
    }

    /**
     * Kicks a player by their gameId.
     * @param {string} gameId - The unique gameId of the player to kick.
     */
    kickPlayer(gameId) {
        console.log(`Kicking player with gameId: ${gameId}`);
        const player = this.players.find(p => p.gameId === gameId);
        if (player) {
            const conn = this.connections.get(player.peerId);
            if (conn) {
                conn.send({ type: 'kick', gameId: gameId });
                // Optionally, close the connection if all players from this peer are kicked
                const playersFromPeer = this.peerToPlayersMap.get(player.peerId) || [];
                const remainingPlayers = playersFromPeer.filter(p => p.gameId !== gameId);
                if (remainingPlayers.length === 0) {
                    conn.close();
                }
            }
            this.removePlayer(player);
            this.broadcastPlayerList();
        } else {
            console.warn(`Player with gameId ${gameId} not found.`);
        }
    }

    /**
     * Handles incoming data from a peer connection.
     * @param {Peer.DataConnection} conn - The PeerJS connection object.
     * @param {Object} data - The data received.
     */
    handleData(conn, data) {
        if (!data || !data.type) {
            console.warn('Received invalid data:', data);
            return;
        }

        switch (data.type) {
            case 'join':
                this.handleJoinRequest(conn, data);
                break;
            case 'nameChange':
                this.handleNameChange(data.gameId, data.newName);
                break;
            case 'gameStateUpdate':
                this.handleGameStateUpdateRequest(conn, data.gameStateUpdate);
                break;
            case 'gameStateRequest':
                this.sendGameState(conn);
                break;
            case 'action':
                this.handlePlayerAction(data.action);
                break;
            default:
                console.warn('Unknown data type:', data.type);
        }
    }

    /**
     * Handles a player's join request.
     * @param {Peer.DataConnection} conn - The PeerJS connection object.
     * @param {Object} data - The join data containing nickname.
     */
    handleJoinRequest(conn, data) {
        if (!data.nickname) {
            console.warn('Join request missing nickname.');
            return;
        }

        const newPlayer = new Player(conn.peer, data.nickname);
        this.addPlayer(newPlayer);
        this.broadcastPlayerList();
        this.broadcastBoard();

        // Optionally, notify other players about the new player
        console.log(`Player joined: ${newPlayer.nickname} (gameId: ${newPlayer.gameId})`);
    }

    /**
     * Handles a player's name change request.
     * @param {string} gameId - The unique gameId of the player.
     * @param {string} newName - The new nickname for the player.
     */
    handleNameChange(gameId, newName) {
        const player = this.players.find(p => p.gameId === gameId);
        if (player) {
            player.nickname = newName;
            this.eventHandler.updatePlayerList();
            this.broadcastPlayerList();
            console.log(`Player ${player.gameId} changed name to ${newName}`);
        } else {
            console.warn(`Player with gameId ${gameId} not found for name change.`);
        }
    }

    /**
     * Handles a game state update request from a client.
     * @param {Peer.DataConnection} conn - The PeerJS connection object.
     * @param {Object} gameStateUpdate - The proposed game state update.
     */
    handleGameStateUpdateRequest(conn, gameStateUpdate) {
        // Apply the game state update
        this.applyGameStateUpdate(gameStateUpdate);

        // Broadcast the updated GameState to all clients
        this.broadcastGameState();
    }

    /**
     * Applies a game state update to the host's GameState.
     * @param {Object} gameStateUpdate - The proposed game state update.
     */
    applyGameStateUpdate(gameStateUpdate) {
        if (!this.gameState) {
            console.warn('GameState is not initialized.');
            return;
        }

        // Example: Update player's position
        if (gameStateUpdate.gameId && gameStateUpdate.newPosition) {
            const player = this.players.find(p => p.gameId === gameStateUpdate.gameId);
            if (player) {
                this.gameState.updatePlayerPosition(player.gameId, gameStateUpdate.newPosition);
                console.log(`${player.nickname} moved to space ${gameStateUpdate.newPosition}`);
            } else {
                console.warn(`Player with gameId ${gameStateUpdate.gameId} not found.`);
            }
        }

        // Example: Update player's stats
        if (gameStateUpdate.gameId && gameStateUpdate.stats) {
            const player = this.players.find(p => p.gameId === gameStateUpdate.gameId);
            if (player) {
                Object.keys(gameStateUpdate.stats).forEach(statName => {
                    const delta = gameStateUpdate.stats[statName];
                    player.updateStat(statName, delta);
                    console.log(`${player.nickname} updated stat '${statName}' by ${delta}`);
                });
            } else {
                console.warn(`Player with gameId ${gameStateUpdate.gameId} not found.`);
            }
        }

        // Add more update handling logic here as needed (e.g., actions, turn changes, etc.)
    }

    /**
     * Handles a player's action during the game.
     * @param {Object} action - The action object containing details.
     */
    handlePlayerAction(action) {
        if (!this.gameState) {
            console.warn('GameState is not initialized.');
            return;
        }

        // Implement action handling logic based on action.type or other properties
        // For example, move a player, update stats, etc.
        // This depends on how actions are defined in your game

        console.log('Handling player action:', action);
        // Example:
        // if (action.type === 'move') { ... }
    }

    /**
     * Handles disconnection of a peer.
     * @param {string} peerId - The ID of the disconnected peer.
     */
    handleDisconnection(peerId) {
        console.log(`Connection closed with ${peerId}`);

        // Remove all players associated with this peerId
        const playersFromPeer = this.peerToPlayersMap.get(peerId) || [];
        playersFromPeer.forEach(player => {
            this.removePlayer(player);
        });

        // Remove the connection
        this.connections.delete(peerId);
        this.peerToPlayersMap.delete(peerId);

        // Broadcast updated player list to remaining peers
        this.broadcastPlayerList();
    }
}
