// BasePeer.js

import Peer from 'peerjs';
import GameState from '../models/GameState';
import BoardManager from '../controllers/managers/BoardManager';

export default class BasePeer {
    constructor(eventHandler) {
        this.peer = null;
        this.eventHandler = eventHandler;
        this.gameState = null;
        this.settings = null;
        this.ownedPlayers = [];
        this.connections = []; // For Host, will be empty for Client
    }

    async initPeer() {
        this.peer = new Peer();
        return new Promise((resolve, reject) => {
            this.peer.on('open', (id) => {
                console.log('Peer ID:', id);
                resolve(id);
            });
            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                this.eventHandler.handlePeerError(err);
                reject(err);
            });
        });
    }

    async initializeGameState() {
        const boardManager = new BoardManager();
        await boardManager.loadDefaultBoard();
        this.gameState = new GameState(boardManager.board, this.eventHandler.factoryManagert);
        console.log("GameState initialized", this.gameState);
    }

    addPlayer(peerId, nickname, isHost = false, playerId = null) {
        // Add player to the gameState (now GameState handles the creation)
        const newPlayer = this.gameState.addPlayer(peerId, nickname, isHost, playerId);

        // If this is the local player (owned by this peer), add them to the ownedPlayers list
        if (this.peer.id === peerId) {
            this.ownedPlayers = this.gameState.getPlayersByPeerId(peerId);
        }

        // Call event handler to update the game state
        this.eventHandler.updateGameState();

        return newPlayer;
    }

    removePlayer(playerId) {
        this.ownedPlayers = this.ownedPlayers.filter(player => player.playerId !== playerId);
        this.gameState.removePlayer(playerId);
        this.eventHandler.updateGameState();
    }

    broadcastGameState() {
        // Implemented in Host.js
    }

    // Additional shared methods can be added here
}
