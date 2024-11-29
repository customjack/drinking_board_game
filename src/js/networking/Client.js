// Client.js

import BasePeer from './BasePeer';
import Player from '../models/Player';
import GameState from '../models/GameState';

export default class Client extends BasePeer {
    constructor(originalName, hostId, eventHandler) {
        super(eventHandler);
        this.originalName = originalName;
        this.hostId = hostId;
        this.conn = null;
    }

    async init() {
        console.log("Initializing Client...");
        const id = await this.initPeer();  // Get the id from initPeer()
        console.log("Peer connection open with ID:", id);
        this.eventHandler.initManagers(id,this.hostId);

        await this.initializeGameState();

        const player = new Player(id, this.originalName);
        this.addPlayer(player);

        this.connectToHost();
    }

    connectToHost() {
        this.conn = this.peer.connect(this.hostId);

        this.conn.on('open', () => this.handleOpenConnection());
        this.conn.on('data', (data) => this.handleData(data));
        this.conn.on('close', () => this.handleDisconnection());
        this.conn.on('error', (err) => this.handleConnectionError(err));
    }

    // Method to propose a new game state to the host
    proposeGameState(proposedGameState) {
        //console.log("Proposed game state (JSON): ", proposedGameState.toJSON());
        // Only propose if connected to host
        if (this.conn && this.conn.open) {
            this.conn.send({
                type: 'proposeGameState',
                gameState: proposedGameState.toJSON(),
            });
        } else {
            console.error('Cannot propose game state, not connected to host.');
        }
    }

    handleOpenConnection() {
        console.log('Connected to host');
        const playersJSON = this.ownedPlayers.map(player => player.toJSON());
        this.conn.send({
            type: 'join',
            peerId: this.peer.id,
            players: playersJSON,
        });
        this.eventHandler.displayInviteCode(this.hostId);
    }

    handleData(data) {
        // Handle incoming data from the host
        switch (data.type) {
            case 'connectionPackage':
                this.handleConnectionPackage(data.gameState);
            case 'gameState':
                this.handleGameStateUpdate(data.gameState);
                break;
            case 'kick':
                this.handleKick();
                break;
            case 'joinRejected':
                this.handleJoinRejected(data.reason);
                break;
            case 'startGame':
                this.handleStartGame();
                break;
            case 'addPlayerRejected':
                this.handleAddPlayerRejected(data.reason);
            // Handle other data types...
            default:
                console.log('Unknown data type:', data.type);
        }
    }

    handleConnectionPackage(gameStateData) {
        this.gameState = GameState.fromJSON(gameStateData);  // Sync local game state with the host's state
        console.log('Game state updated:', this.gameState);
        if(this.gameState.isGameStarted()) {
            this.eventHandler.showGamePage();
        } else {
            this.eventHandler.showLobbyPage();
        }
    }

    handleGameStateUpdate(gameStateData) {
        this.gameState = GameState.fromJSON(gameStateData);  // Sync local game state with the host's state
        //console.log('Game state updated:', gameStateData);
        this.eventHandler.updateGameState(); 
    }

    handleKick() {
        alert('You have been kicked from the game.');
        location.reload();
    }

    handleJoinRejected(reason) {
        alert(`Join request rejected: ${reason}`);
        location.reload();
    }

    handleStartGame() {
        this.eventHandler.showGamePage();
    }

    handleDisconnection() {
        alert('Disconnected from the host.');
        location.reload();
    }

    handleConnectionError(err) {
        alert('Connection error: ' + err);
        location.reload();
    }

    handleAddPlayerRejected(reason) {
        alert(reason);
    }
}
