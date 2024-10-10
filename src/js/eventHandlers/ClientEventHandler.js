// ClientEventHandler.js

import BaseEventHandler from './BaseEventHandler';
import Client from '../networking/Client';
import BoardManager from '../controllers/BoardManager';
import PlayerListManager from '../controllers/PlayerListManager';
import PieceManager from '../controllers/PieceManager';
import SettingsManager from '../controllers/SettingsManager';
import Player from '../models/Player';
import GameEngine from '../controllers/GameEngine';

export default class ClientEventHandler extends BaseEventHandler {
    constructor() {
        super();
        // Client-specific DOM elements
        this.joinPage = document.getElementById('joinPage');
        this.startJoinButton = document.getElementById('startJoinButton');
        this.leaveGameButton = document.getElementById('leaveGameButton');
        this.addPlayerButton = document.getElementById('addPlayerButton');
        this.copyInviteCodeButton = document.getElementById('copyInviteCodeButton');
        this.playerLimitPerPeerDisplay = document.getElementById('playerLimitPerPeerDisplayClient');
        this.totalPlayerLimitDisplay = document.getElementById('totalPlayerLimitDisplayClient');
        this.turnTimerDisplay = document.getElementById('turnTimerClient');
        this.moveDelayDisplay = document.getElementById('moveDelayClient');
        this.settingsSection = document.getElementById('settingsSectionClient');
        this.copyMessage = document.getElementById('copyMessage');

        this.inviteCode = document.getElementById('inviteCode');

        this.boardManager = new BoardManager();
        this.playerListManager = null;
        this.pieceManager = new PieceManager();
        this.settingsManager = new SettingsManager(false); //initialize as client
        this.gameEngine = null;

        this.client = null;
    }

    init() {
        super.init();
        // Add joinPage to the pages array so it gets hidden when hideAllPages is called
        this.pages.push(this.joinPage);
        this.showJoinPage();
    }

    setupEventListeners() {
        if (this.startJoinButton)
            this.startJoinButton.addEventListener('click', () => this.startJoinGame());
        if (this.copyInviteCodeButton)
            this.copyInviteCodeButton.addEventListener('click', () => this.copyInviteCode());
        if (this.leaveGameButton)
            this.leaveGameButton.addEventListener('click', () => this.leaveGame());
        if (this.addPlayerButton)
            this.addPlayerButton.addEventListener('click', () => this.addNewOwnedPlayer());
    }

    showJoinPage() {
        this.hideAllPages();
        if (this.joinPage) this.joinPage.style.display = 'block';
    }

    async startJoinGame() {
        const playerNameInput = document.getElementById('joinNameInput');
        const gameCodeInput = document.getElementById('joinCodeInput');

        const playerName = playerNameInput.value.trim();
        const gameCode = gameCodeInput.value.trim();

        if (!playerName || !gameCode) {
            alert('Please enter your name and a valid game code.');
            return;
        }

        this.startJoinButton.disabled = true;
        this.showLoadingPage();

        this.client = new Client(playerName, gameCode, this);
        await this.client.init();

        // Initialize GameEngine with proposeGameState function
        this.gameEngine = new GameEngine(
            this.client.gameState,
            this.client.peer.id,
            (proposedGameState) => this.client.proposeGameState(proposedGameState),
            false // isHost = false
        );
        this.gameEngine.init();
    }

    showLobbyPage() {
        if (this.lobbyPage && this.lobbyPage.style.display !== 'block') {
            this.hideAllPages();
            this.lobbyPage.style.display = 'block';
            this.leaveGameButton.style.display = 'inline';
            this.settingsSection.style.display = 'inline';
        }
    }

    showGamePage() {
        if (this.gamePage && this.gamePage.style.display !== 'block') {
            console.log('Client is switching to game page...');
            this.hideAllPages();
            this.gamePage.style.display = 'block';
            // Update the player list manager to use the game player list
            this.playerListManager.setListElement(document.getElementById('gamePlayerList'));

            // Update the board manager to use the game board container
            this.boardManager.setBoardContainer(document.getElementById('gameBoardContent'));
            this.updateGameState(true);
        }
    }

    updateGameState(forceUpdate = false) {

        //Update settings
        this.updateSettings(forceUpdate);

        // Update the game board
        this.updateGameBoard(forceUpdate);

        // Update the pieces
        this.updatePieces(forceUpdate);

        // Update the player list
        this.updatePlayerList(forceUpdate);

        // Update the game engine with the new game state
        if (this.gameEngine) {
            this.gameEngine.updateGameState(this.client.gameState);
        }
    }

    updateSettings(forceUpdate = false) {
        const gameState = this.client.gameState;
        if (!gameState) return;

        if (forceUpdate || this.settingsManager.shouldUpdateSettings(gameState.settings)) {
            this.settingsManager.updateSettings(gameState);
            this.updateAddPlayerButton();
        }
    }

    updateGameBoard(forceUpdate = false) {
        const gameState = this.client.gameState;

        if (!gameState) return;

        if (forceUpdate || this.boardManager.shouldUpdateBoard(gameState.board)) {
            this.boardManager.setBoard(gameState.board);
            this.boardManager.drawBoard();
            this.updatePieces(true);
        }
    }

    updatePieces(forceUpdate = false) {
        const gameState = this.client.gameState;

        if (!gameState) return;

        if (forceUpdate || this.pieceManager.shouldUpdatePieces(gameState.players)) {
            this.pieceManager.updatePieces(gameState);
        }
    }

    updatePlayerList(forceUpdate = false) {
        if (!this.playerListManager) {
            this.playerListManager = new PlayerListManager(
                document.getElementById('lobbyPlayerList'),
                false,
                this.client.peer.id,
                this.client.hostId,
            );
        }

        const newGameState = this.client.gameState;

        if (forceUpdate || this.playerListManager.shouldUpdatePlayers(newGameState)) {
            this.playerListManager.setGameState(newGameState);
            this.addEditListeners();
            this.updateAddPlayerButton();
        }
    }

    addEditListeners() {
        document.querySelectorAll('.edit-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const playerId = e.target.getAttribute('data-playerId');
                this.editPlayerName(playerId);
            });
        });
        document.querySelectorAll('.remove-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const playerId = e.target.getAttribute('data-playerId');
                this.removePlayer(playerId);
            });
        });
    }

    editPlayerName(playerId) {
        const player = this.client.ownedPlayers.find((p) => p.playerId === playerId);
        if (player) {
            const newName = prompt('Enter new name:', player.nickname);
            if (newName) {
                player.nickname = newName;
                this.client.conn.send({
                    type: 'nameChange',
                    playerId: playerId,
                    newName,
                });
            }
        }
    }

    addNewOwnedPlayer() {
        const newName = prompt('Enter a new player name:');
        if (newName && newName.trim() !== "") {
            const newPlayer = new Player(this.client.peer.id, newName.trim(), false); // Create a new player instance
            this.client.ownedPlayers.push(newPlayer); // Add the new player to the owned players array

            // Send the new player info to the host
            this.client.conn.send({
                type: 'proposeAddPlayer',
                player: newPlayer.toJSON(), // Send the new player's data to the host
            });

            // Check if the Add Player button should be hidden after adding the player
            this.updateAddPlayerButton();
        }
    }

    removePlayer(playerId) {
        const playerIndex = this.client.ownedPlayers.findIndex((p) => p.playerId === playerId);

        if (playerIndex !== -1) {
            if (this.client.ownedPlayers.length === 1) {
                alert('You have removed your last player. Leaving the game.');
                this.leaveGame();
            } else {
                this.client.ownedPlayers.splice(playerIndex, 1);
                this.client.conn.send({
                    type: 'removePlayer',
                    playerId: playerId,
                });
                this.updateAddPlayerButton();
            }
        } else {
            alert('Player not found.');
        }
    }

    updateAddPlayerButton() {
        if (!this.client.gameState.settings) return;

        const playerLimitPerPeer = this.client.gameState.settings.playerLimitPerPeer;
        const totalPlayerLimit = this.client.gameState.settings.playerLimit;
        const ownedPlayers = this.client.ownedPlayers;
        const allPlayers = this.client.gameState.players;

        if (ownedPlayers.length < playerLimitPerPeer && allPlayers.length < totalPlayerLimit) {
            this.addPlayerButton.style.display = 'block';
        } else {
            this.addPlayerButton.style.display = 'none';
        }
        this.updatePieces(true);
    }

    copyInviteCode() {
        const inviteCode = this.inviteCode.textContent.trim();
        if (inviteCode) {
            navigator.clipboard
                .writeText(inviteCode)
                .then(() => {
                    this.showCopyMessage();
                })
                .catch((err) => console.error('Failed to copy invite code:', err));
        }
    }

    showCopyMessage() {
        this.copyMessage.style.display = 'inline';
        setTimeout(() => {
            this.copyMessage.style.display = 'none';
        }, 2000);
    }

    leaveGame() {
        alert('You have left the game.');
        location.reload();
    }

    updateDisplayedSettings() {
        if (this.playerLimitPerPeerDisplay) {
            this.playerLimitPerPeerDisplay.textContent = this.client.settings.playerLimitPerPeer;
        }
        if (this.totalPlayerLimitDisplay) {
            this.totalPlayerLimitDisplay.textContent = this.client.settings.playerLimit;
        }
        if (this.turnTimerDisplay) {
            this.totalPlayerLimitDisplay.textContent = this.client.settings.turnTimer;
        }
        if (this.moveDelayDisplay) {
            this.totalPlayerLimitDisplay.textContent = this.client.settings.moveDelay;
        }
        this.updateAddPlayerButton();
    }

    handlePeerError(err) {
        this.startJoinButton.disabled = false;
        this.showJoinPage();
        alert('An error occurred: ' + err);
    }
}
