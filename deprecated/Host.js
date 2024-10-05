// Host.js

import BasePeer from './BasePeer';
import Player from '../models/Player';
import Settings from '../models/Settings';

export default class Host extends BasePeer {
    constructor(originalName, eventHandler, playerLimitPerPeer = 1, playerLimit = 8) {
        super(eventHandler);
        this.originalName = originalName;
        this.settings = new Settings(playerLimitPerPeer, playerLimit);
    }

    async init() {
        const id = await this.initPeer();  // Get the id from initPeer()
    
        // Since the 'open' event has already been handled, you can proceed directly
        console.log('Host ID:', id);
        this.hostId = id;
        await this.initializeGameState();
        this.setupUI();
        const hostPlayer = new Player(id, this.originalName, true);
        this.addPlayer(hostPlayer);
    
        // Set up other event listeners as needed
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
        this.sendSettings(conn);
        conn.on('data', (data) => this.handleData(conn, data));
        conn.on('close', () => this.handleDisconnection(conn.peer));
    }

    sendGameState(conn) {
        if (this.gameState) {
            const gameStateData = this.gameState.toJSON();
            conn.send({ type: 'gameState', gameState: gameStateData });
        }
    }

    sendSettings(conn) {
        const settingsData = this.settings.toJSON();
        conn.send({ type: 'settings', settings: settingsData });
    }

    handleData(conn, data) {
        // Handle incoming data from clients
        switch (data.type) {
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

    handleJoin(conn, data) {
        const players = data.players;

        const totalPlayersCount = this.allPlayers.length;
        const playersToAddCount = players.length;

        if (totalPlayersCount + playersToAddCount > this.settings.playerLimit) {
            conn.send({
                type: 'joinRejected',
                reason: `Lobby is full. The maximum player limit of ${this.settings.playerLimit} has been reached.`,
            });
            console.log(`Join request rejected. Player limit of ${this.settings.playerLimit} reached.`);
            return;
        }

        players.forEach(playerData => {
            const newPlayer = new Player(conn.peer, playerData.nickname, playerData.isHost, playerData.playerId);
            this.addPlayer(newPlayer);
        });

        this.broadcastAll();
    }

    handleNameChange(playerId, newName) {
        const player = this.allPlayers.find((p) => p.playerId === playerId);
        if (player) {
            player.nickname = newName;
            this.broadcastPlayerList();
        }
    }

    handleClientRemovePlayer(playerId) {
        this.removePlayer(playerId);
        this.broadcastPlayerList();
    }

    handleClientAddPlayer(conn, newPlayerData) {
        const peerId = conn.peer;
        const clientPlayersCount = this.allPlayers.filter(player => player.peerId === peerId).length;
        const totalPlayersCount = this.allPlayers.length;

        if (clientPlayersCount >= this.settings.playerLimitPerPeer) {
            conn.send({
                type: 'addPlayerRejected',
                reason: `Player limit reached. You can only create up to ${this.settings.playerLimitPerPeer} players.`,
                player: newPlayerData
            });
            console.log(`Player addition rejected for peerId ${peerId} due to player limit.`);
            return;
        }

        if (totalPlayersCount >= this.settings.playerLimit) {
            conn.send({
                type: 'addPlayerRejected',
                reason: `Total player limit reached. The game can only have up to ${this.settings.playerLimit} players.`,
                player: newPlayerData
            });
            console.log(`Player addition rejected for peerId ${peerId} due to total player limit.`);
            return;
        }

        const newPlayer = Player.fromJSON(newPlayerData);
        this.addPlayer(newPlayer);
        this.broadcastAll();
        console.log(`Player added successfully for peerId ${peerId}. Player ID: ${newPlayer.playerId}`);
    }

    handleDisconnection(peerId) {
        console.log(`Connection closed with ${peerId}`);
        this.removePeer(peerId);
        this.broadcastPlayerList();
    }

    removePeer(peerId) {
        const playersToRemove = this.allPlayers.filter(player => player.peerId === peerId);
        playersToRemove.forEach(player => this.removePlayer(player.playerId));
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
        const playersData = this.allPlayers.map((player) => player.toJSON());
        this.connections.forEach((conn) => {
            conn.send({ type: 'playerList', players: playersData });
        });
    }

    broadcastSettings() {
        const settingsData = this.settings.toJSON();
        this.connections.forEach((conn) => {
            conn.send({ type: 'settings', settings: settingsData });
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
            this.broadcastPlayerList();
        }
    }

    addNewOwnedPlayer(playerName) {
        const totalPlayers = this.allPlayers.length;
        if (totalPlayers >= this.settings.playerLimit) {
            alert(`Cannot add more players. The maximum limit of ${this.settings.playerLimit} players has been reached.`);
            return;
        }

        const totalOwnedPlayers = this.ownedPlayers.length;
        if (totalOwnedPlayers >= this.settings.playerLimitPerPeer) {
            alert(`Cannot add more players. The maximum limit of ${this.settings.playerLimitPerPeer} players for this peer has been reached.`);
            return;
        }

        const newPlayer = new Player(this.peer.id, playerName, false);
        this.addPlayer(newPlayer);
        this.eventHandler.updateGameState();
        this.broadcastGameState();
    }
}
