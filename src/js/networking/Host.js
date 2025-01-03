// Host.js

import BasePeer from './BasePeer';
import Player from '../models/Player';
import GameState from '../models/GameState'
import GamePhases from '../enums/GamePhases';

export default class Host extends BasePeer {
    constructor(originalName, eventHandler) {
        super(eventHandler);
        this.originalName = originalName;
    }

    async init() {
        const id = await this.initPeer();  // Get the id from initPeer()

        console.log('Host ID:', id);
        this.hostId = id;
        this.eventHandler.initManagers(id,id);
        await this.initializeGameState();
        this.setupUI();
        this.addPlayer(id, this.originalName, true);

        // Set up event listeners
        this.peer.on('connection', (conn) => this.handleConnection(conn));
    }

    setupUI() {
        console.log("Setting up UI");
        this.eventHandler.displayInviteCode(this.hostId);
        this.eventHandler.showPage("lobbyPage");
    }

    handleConnection(conn) {
        console.log('New connection from', conn.peer);
        this.connections.push(conn);
        // Send a one-time connection package
        this.sendConnectionPackage(conn);
        conn.on('data', (data) => this.handleData(conn, data));
        conn.on('close', () => this.handleDisconnection(conn.peer));
    }

    sendGameState(conn) {
        if (this.gameState) {
            const gameStateData = this.gameState.toJSON();
            conn.send({ type: 'gameState', gameState: gameStateData });
        }
    }

    sendConnectionPackage(conn) {
        if (this.gameState) {
            const gameStateData = this.gameState.toJSON();
            conn.send({ type: 'connectionPackage', gameState: gameStateData });
        }
    }

    updateAndBroadcastGameState(newGameState) {
        //Effectively sets the gamestate to a copy (not a reference)
        //The client has to do similar to rebuild it's gamestate,
        //so this is to make the host and client have similar behavior
        const newGameStateJSON = newGameState.toJSON();
        this.gameState = GameState.fromJSON(newGameStateJSON, this.eventHandler.factoryManager);


        this.broadcastGameState();
        this.eventHandler.updateGameState();
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
        const proposedGameState = GameState.fromJSON(proposedGameStateData, this.eventHandler.factoryManager);

        // Validate the proposed game state
        if (this.validateProposedGameState(conn.peer, proposedGameState)) {
            // Broadcast the new game state and do work to update on the client side
            // All clients should also do their work to update client side
            this.gameState = proposedGameState;
            this.broadcastGameState();
            this.eventHandler.updateGameState();
        } else {
            console.error('Invalid game state proposed by peer:', conn.peer);
            this.sendGameState(conn); //Send them the corrected game state
        }
    }

    validateProposedGameState(peerId, proposedGameState) {
        if (this.gameState.gamePhase === GamePhases.PAUSED && proposedGameState.gamePhase !== GamePhases.PAUSED) {
            return false;
        }

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
            // Check if playerData contains the necessary properties
            if (!playerData.peerId || !playerData.nickname) {
                conn.send({
                    type: 'joinRejected',
                    reason: 'Invalid player data. Both peerId and nickname are required.',
                });
                console.log('Join request rejected due to missing player data:', playerData);
                return; // Skip the current player and continue processing other players
            }
    
            // Add the player to the game state if data is valid
            this.addPlayer(playerData.peerId, playerData.nickname);
        });

        this.broadcastGameState();
    }

    handleNameChange(playerId, newName) {
        console.log("recieved name change");
        const player = this.gameState.players.find((p) => p.playerId === playerId);
        if (player) {
            player.nickname = newName;
            this.updateAndBroadcastGameState(this.gameState);
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

        const newPlayer = this.addPlayer(newPlayerData.peerId, newPlayerData.nickname);
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
        //console.log("Broadcasted gamestate:", gameStateData);
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

        this.addPlayer(this.peer.id, playerName);
        this.eventHandler.updateGameState();
        this.broadcastGameState();
    }
}
