// BasePeer.js

import Peer from 'peerjs';
import GameState from '../models/GameState';
import BoardManager from '../controllers/BoardManager';

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
        this.gameState = new GameState(boardManager.board);
        console.log("GameState initialized", this.gameState);
    }

    addPlayer(player) {
        if (!this.gameState.players.some(p => p.playerId === player.playerId)) {
            this.gameState.addPlayer(player);
            if (player.peerId === this.peer.id) {
                this.ownedPlayers.push(player);
            }
            this.eventHandler.updateGameState();
        } else {
            console.log('Player already exists:', player);
        }
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
