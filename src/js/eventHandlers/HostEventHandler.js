// HostEventHandler.js

import BaseEventHandler from './BaseEventHandler';
import Host from '../networking/Host';
import BoardManager from '../controllers/managers/BoardManager';
import Board from '../models/Board';
import PlayerListManager from '../controllers/managers/PlayerListManager';
import PieceManager from '../controllers/managers/PieceManager';
import GameEngine from '../controllers/GameEngine';
import SettingsManager from '../controllers/managers/SettingsManager';

export default class HostEventHandler extends BaseEventHandler {
    constructor() {
        super();

        this.host = null;

        this.boardManager = new BoardManager();
        this.playerListManager = null;
        this.pieceManager = new PieceManager();
        this.settingsManager = new SettingsManager(true); //initialize as host
        this.gameEngine = null;

        // Host-specific DOM elements
        this.hostPage = document.getElementById('hostPage');
        this.startHostButton = document.getElementById('startHostButton');
        this.closeGameButton = document.getElementById('closeGameButton');
        this.startGameButton = document.getElementById('startGameButton');
        this.addPlayerButton = document.getElementById('addPlayerButton');
        this.uploadButton = document.getElementById('uploadBoardButton');
        this.fileInput = document.getElementById('boardFileInput');
        this.copyInviteCodeButton = document.getElementById('copyInviteCodeButton');
        this.copyMessage = document.getElementById('copyMessage');
        this.settingsSection = document.getElementById('settingsSectionHost');

        // Retrieve input elements from the SettingsManager and assign them to the HostEventHandler instance
        const elements = this.settingsManager.getSettingsElements();
        this.playerLimitPerPeerInput = elements.playerLimitPerPeerInput;
        this.totalPlayerLimitInput = elements.totalPlayerLimitInput;
        this.turnTimerInput = elements.turnTimerInput;
        this.moveDelayInput = elements.moveDelayInput;

        this.inviteCode = document.getElementById('inviteCode');
    }

    init() {
        super.init();
        // Add hostPage to the pages array so it gets hidden when hideAllPages is called
        this.pages.push(this.hostPage);
        this.showHostPage();
    }

    setupEventListeners() {
        if (this.startHostButton)
            this.startHostButton.addEventListener('click', () => this.startHostGame());
        if (this.copyInviteCodeButton)
            this.copyInviteCodeButton.addEventListener('click', () => this.copyInviteCode());
        if (this.closeGameButton)
            this.closeGameButton.addEventListener('click', () => this.closeGame());
        if (this.startGameButton)
            this.startGameButton.addEventListener('click', () => this.startGame());
        if (this.addPlayerButton)
            this.addPlayerButton.addEventListener('click', () => this.addPlayer());
        if (this.uploadButton)
            this.uploadButton.addEventListener('click', () => this.fileInput.click());
        
        if (this.fileInput) {
            this.fileInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const content = e.target.result;
                            console.log('Raw file content:', content);
                            const boardData = JSON.parse(content);
                            console.log('Board JSON uploaded:', boardData);

                            const board = Board.fromJSON(boardData);
                            this.host.gameState.board = board;

                            this.boardManager.setBoard(board);
                            this.boardManager.drawBoard();

                            this.host.broadcastGameState();
                        } catch (err) {
                            console.error('Invalid board JSON:', err);
                            alert('Invalid board file.');
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }

        // Helper function to add multiple event listeners
        const addDelayedSettingsListener = (inputElement) => {
            if (inputElement) {
                inputElement.addEventListener('change', () => this.onSettingsChanged());
                inputElement.addEventListener('blur', () => this.onSettingsChanged());
                inputElement.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        inputElement.blur(); // Trigger blur event
                        this.onSettingsChanged();
                    }
                });
            }
        };

        addDelayedSettingsListener(this.playerLimitPerPeerInput);
        addDelayedSettingsListener(this.totalPlayerLimitInput);
        addDelayedSettingsListener(this.turnTimerInput);
        addDelayedSettingsListener(this.moveDelayInput);

    }

    showHostPage() {
        this.hideAllPages();
        if (this.hostPage) this.hostPage.style.display = 'block';
    }

    async startHostGame() {
        const hostNameInput = document.getElementById('hostNameInput');
        const hostName = hostNameInput.value.trim();
        if (!hostName) {
            alert('Please enter your name.');
            return;
        }

        this.startHostButton.disabled = true;
        this.showLoadingPage();

        this.host = new Host(hostName, this);
        await this.host.init();

        // Initialize GameEngine with direct update and broadcast for host
        console.log("Host Peer ID:", this.host.peer.id);
        this.gameEngine = new GameEngine(
            this.host.gameState,
            this.host.peer.id,
            (proposedGameState) => this.host.updateAndBroadcastGameState(proposedGameState),
            true // isHost = true
        );
        this.gameEngine.init();
    }

    displayLobbyForHost() {
        console.log("Displaying lobby for host");
        this.hideAllPages();
        if (this.lobbyPage) {
            this.lobbyPage.style.display = 'block';
            this.closeGameButton.style.display = 'inline';
            this.settingsSection.style.display = 'inline';
            this.uploadButton.style.display = 'inline';
            this.startGameButton.style.display = 'inline';
            this.updateAddPlayerButton();
        }
    }

    startGame() {
        console.log('Host is starting the game...');
        if (this.host) {
            this.host.broadcastStartGame();
        }
        this.showGamePage();
        
        this.updateGameState(true);
    }

    showGamePage() {
        this.hideAllPages();
        if (this.gamePage) {
            // Update the player list manager to use the game player list
            this.playerListManager.setListElement(document.getElementById('gamePlayerList'));

            // Update the board manager to use the game board container
            this.boardManager.setBoardContainer(document.getElementById('gameBoardContent'));
            this.gamePage.style.display = 'block';
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
            this.gameEngine.updateGameState(this.host.gameState);
        }
    }

    updateSettings(forceUpdate = false) {
        const gameState = this.host.gameState;
        if (!gameState) return;

        if (forceUpdate || this.settingsManager.shouldUpdateSettings(gameState.settings)) {
            this.settingsManager.updateSettings(gameState);
        }
    }

    updateGameBoard(forceUpdate = false) {
        const gameState = this.host.gameState;
        if (!gameState) return;

        if (forceUpdate || this.boardManager.shouldUpdateBoard(gameState.board)) {
            this.boardManager.setBoard(gameState.board);
            this.boardManager.drawBoard();
            this.updatePieces(true);
        }
    }

    updatePieces(forceUpdate = false) {
        const gameState = this.host.gameState;
        if (!gameState) return;

        //console.log("Should update pieces?:", this.pieceManager.shouldUpdatePieces(gameState.players));
        if (forceUpdate || this.pieceManager.shouldUpdatePieces(gameState.players)) {
            this.pieceManager.updatePieces(gameState);
        }
    }

    updatePlayerList(forceUpdate = false) {
        if (!this.playerListManager) {
            this.playerListManager = new PlayerListManager(
                document.getElementById('lobbyPlayerList'),
                true,
                this.host.peer.id,
                this.host.peer.id,
            );
        }

        const gameState = this.host.gameState;
        if (!gameState) return;

        if (forceUpdate || this.playerListManager.shouldUpdatePlayers(gameState)) {
            this.playerListManager.setGameState(gameState);
            this.addKickAndEditListeners();
            this.updateAddPlayerButton();
        }
    }

    addKickAndEditListeners() {
        document.querySelectorAll('.kick-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const playerId = e.target.getAttribute('data-playerId');
                this.confirmAndKickPlayer(playerId);
            });
        });

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

    confirmAndKickPlayer(playerId) {
        const player = this.host.gameState.players.find((p) => p.playerId === playerId);
        if (
            player &&
            confirm(`Are you sure you want to kick ${player.nickname}? This will disconnect all players associated with this player's client.`)
        ) {
            this.host.kickPlayer(player.peerId);
        }
    }

    editPlayerName(playerId) {
        const player = this.host.ownedPlayers.find((p) => p.playerId === playerId);
        if (player) {
            const newName = prompt('Enter new name:', player.nickname);
            if (newName) {
                player.nickname = newName;
                this.updateGameState();
                this.host.broadcastGameState();
            }
        }
    }

    removePlayer(playerId) {
        const playerIndex = this.host.ownedPlayers.findIndex((p) => p.playerId === playerId);

        if (playerIndex !== -1) {
            if (this.host.ownedPlayers.length === 1) {
                alert('You have removed your last player. Leaving the game.');
                this.leaveGame();
            } else {
                const removedPlayer = this.host.ownedPlayers.splice(playerIndex, 1)[0];
                this.host.removePlayer(removedPlayer.playerId);

                this.host.broadcastGameState();
                this.updateGameState();
                this.updateAddPlayerButton();
            }
        } else {
            alert('Player not found.');
        }
    }

    addPlayer() {
        const newName = prompt('Enter a new player name:');
        if (newName && newName.trim() !== "") {
            this.host.addNewOwnedPlayer(newName.trim());
        }
    }

    updateAddPlayerButton() {
        const playerLimitPerPeer = this.host.gameState.settings.playerLimitPerPeer;
        const totalPlayerLimit = this.host.gameState.settings.playerLimit;
        const ownedPlayers = this.host.ownedPlayers;
        const allPlayers = this.host.gameState.players;

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

    closeGame() {
        alert('The host has closed the game.');
        location.reload();
    }

    leaveGame() {
        alert('You have left the game.');
        location.reload();
    }

    onSettingsChanged() {
        this.settingsManager.updateGameStateFromInputs(this.host.gameState);
        this.host.broadcastGameState();
        this.updateAddPlayerButton();
    }
    

    handlePeerError(err) {
        this.startHostButton.disabled = false;
        this.showHostPage();
        alert('An error occurred: ' + err);
    }
}
