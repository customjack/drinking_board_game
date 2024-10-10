// Host.js

import BasePeer from './BasePeer';
import Player from '../models/Player';
import GameState from '../models/GameState'

export default class Host extends BasePeer {
    constructor(originalName, eventHandler) {
        super(eventHandler);
        this.originalName = originalName;
    }

    async init() {
        const id = await this.initPeer();  // Get the id from initPeer()

        console.log('Host ID:', id);
        this.hostId = id;
        await this.initializeGameState();
        this.setupUI();
        const hostPlayer = new Player(id, this.originalName, true);
        this.addPlayer(hostPlayer);

        // Set up event listeners
        this.peer.on('connection', (conn) => this.handleConnection(conn));
    }

    setupUI() {
        console.log("Setting up UI");
        this.eventHandler.displayInviteCode(this.hostId);
        this.eventHandler.displayLobbyForHost();
    }

    handleConnection(conn) {
        console.log('New connection from', conn.peer);
        this.connections.push(conn);
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

    updateAndBroadcastGameState(newGameState) {
        this.gameState = newGameState;
        this.eventHandler.updateGameState();
        this.broadcastGameState();
    }

    handleData(conn, data) {
        // Handle incoming data from clients
        switch (data.type) {
            case 'proposeGameState':
                this.handleProposedGameState(conn, data.gameState);
                break;
            case 'join':
                this.handleJoin(conn, data);
                break;
            case 'nameChange':
                this.handleNameChange(data.playerId, data.newName);
                break;
            case 'removePlayer':
                this.handleClientRemovePlayer(data.playerId);
                break;
            case 'proposeAddPlayer':
                this.handleClientAddPlayer(conn, data.player);
                break;
            // Handle other data types...
            default:
                console.log('Unknown data type:', data.type);
        }
    }

    handleProposedGameState(conn, proposedGameStateData) {
        const proposedGameState = GameState.fromJSON(proposedGameStateData);

        // Validate the proposed game state
        if (this.validateProposedGameState(conn.peer, proposedGameState)) {
            // Update the game state and broadcast
            this.gameState = proposedGameState;
            this.eventHandler.updateGameState();
            this.broadcastGameState();
        } else {
            console.error('Invalid game state proposed by peer:', conn.peer);
            // Optionally send an error back to the client
        }
    }

    validateProposedGameState(peerId, proposedGameState) {
        // Additional validation logic can be added here
        // For simplicity, we'll assume the proposed game state is valid

        return true;
    }

    handleJoin(conn, data) {
        const players = data.players;

        const totalPlayersCount = this.gameState.players.length;
        const playersToAddCount = players.length;

        if (totalPlayersCount + playersToAddCount > this.gameState.settings.playerLimit) {
            conn.send({
                type: 'joinRejected',
                reason: `Lobby is full. The maximum player limit of ${this.gameState.settings.playerLimit} has been reached.`,
            });
            console.log(`Join request rejected. Player limit of ${this.gameState.settings.playerLimit} reached.`);
            return;
        }

        players.forEach(playerData => {
            const newPlayer = new Player.fromJSON(playerData);
            this.addPlayer(newPlayer);
        });

        this.broadcastGameState();
    }

    handleNameChange(playerId, newName) {
        const player = this.gameState.players.find((p) => p.playerId === playerId);
        if (player) {
            player.nickname = newName;
            this.broadcastGameState();
        }
    }

    handleClientRemovePlayer(playerId) {
        this.removePlayer(playerId);
        this.broadcastGameState();
    }

    handleClientAddPlayer(conn, newPlayerData) {
        const peerId = conn.peer;
        const clientPlayersCount = this.gameState.players.filter(player => player.peerId === peerId).length;
        const totalPlayersCount = this.gameState.players.length;

        if (clientPlayersCount >= this.gameState.settings.playerLimitPerPeer) {
            conn.send({
                type: 'addPlayerRejected',
                reason: `Local player limit reached for your client. You can only create up to ${this.gameState.settings.playerLimitPerPeer} players.`,
                player: newPlayerData
            });
            console.log(`Player addition rejected for peerId ${peerId} due to player limit.`);
            return;
        }

        if (totalPlayersCount >= this.gameState.settings.playerLimit) {
            conn.send({
                type: 'addPlayerRejected',
                reason: `Total player limit reached. The game can only have up to ${this.gameState.settings.playerLimit} players.`,
                player: newPlayerData
            });
            console.log(`Player addition rejected for peerId ${peerId} due to total player limit.`);
            return;
        }

        const newPlayer = Player.fromJSON(newPlayerData);
        this.addPlayer(newPlayer);
        this.broadcastGameState();
        console.log(`Player added successfully for peerId ${peerId}. Player ID: ${newPlayer.playerId}`);
    }

    handleDisconnection(peerId) {
        console.log(`Connection closed with ${peerId}`);
        this.removePeer(peerId);
        this.broadcastGameState();
    }

    removePeer(peerId) {
        const playersToRemove = this.gameState.players.filter(player => player.peerId === peerId);
        playersToRemove.forEach(player => this.removePlayer(player.playerId));
    }

    broadcastGameState() {
        const gameStateData = this.gameState.toJSON();
        this.connections.forEach(conn => {
            conn.send({ type: 'gameState', gameState: gameStateData });
        });
    }

    broadcastStartGame() {
        this.gameState.startGame();
        this.broadcastGameState();
        console.log('Sending start game signal to all clients...');
        this.connections.forEach((conn) => {
            conn.send({ type: 'startGame' });
        });
    }

    kickPlayer(peerId) {
        console.log(`Kicking player with peerId: ${peerId}`);
        const connection = this.connections.find((conn) => conn.peer === peerId);
        if (connection) {
            connection.send({ type: 'kick' });
            connection.close();
            this.removePeer(peerId);
            this.broadcastGameState();
        }
    }

    addNewOwnedPlayer(playerName) {
        const totalPlayers = this.gameState.players.length;
        if (totalPlayers >= this.gameState.settings.playerLimit) {
            alert(`Cannot add more players. The maximum limit of ${this.gameState.settings.playerLimit} players has been reached.`);
            return;
        }

        const totalOwnedPlayers = this.ownedPlayers.length;
        if (totalOwnedPlayers >= this.gameState.settings.playerLimitPerPeer) {
            alert(`Cannot add more players. The maximum limit of ${this.gameState.settings.playerLimitPerPeer} players for this peer has been reached.`);
            return;
        }

        const newPlayer = new Player(this.peer.id, playerName, false);
        this.addPlayer(newPlayer);
        this.eventHandler.updateGameState();
        this.broadcastGameState();
    }
}
