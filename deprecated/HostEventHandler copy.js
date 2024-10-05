// HostEventHandler.js

import BaseEventHandler from './BaseEventHandler';
import Host from '../networking/Host';
import BoardManager from '../controllers/BoardManager';
import Board from '../models/Board';
import PlayerListManager from '../controllers/PlayerListManager';
import PieceManager from '../controllers/PieceManager';

export default class HostEventHandler extends BaseEventHandler {
    constructor() {
        super();
        // Host-specific DOM elements
        this.hostPage = document.getElementById('hostPage');
        this.startHostButton = document.getElementById('startHostButton');
        this.closeGameButton = document.getElementById('closeGameButton');
        this.startGameButton = document.getElementById('startGameButton');
        this.addPlayerButton = document.getElementById('addPlayerButton');
        this.uploadButton = document.getElementById('uploadBoardButton');
        this.fileInput = document.getElementById('boardFileInput');

        this.playerLimitPerPeerInput = document.getElementById('playerLimitPerPeerHost');
        this.totalPlayerLimitInput = document.getElementById('totalPlayerLimitHost');
        this.copyInviteCodeButton = document.getElementById('copyInviteCodeButton');
        this.copyMessage = document.getElementById('copyMessage');
        this.settingsSection = document.getElementById('settingsSectionHost');

        this.inviteCode = document.getElementById('inviteCode');

        this.boardManager = new BoardManager();
        this.playerListManager = null;
        this.pieceManager = new PieceManager();

        this.host = null;
    }

    init() {
        super.init();
        // Add joinPage to the pages array so it gets hidden when hideAllPages is called
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
        if (this.playerLimitPerPeerInput)
            this.playerLimitPerPeerInput.addEventListener('input', () => this.onSettingsChanged());
        if (this.totalPlayerLimitInput)
            this.totalPlayerLimitInput.addEventListener('input', () => this.onSettingsChanged());

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

                            this.boardManager.board = board;
                            this.boardManager.drawBoard();

                            this.host.broadcastBoard();
                        } catch (err) {
                            console.error('Invalid board JSON:', err);
                            alert('Invalid board file.');
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }
    }

    showHostPage() {
        this.hideAllPages();
        if (this.hostPage) this.hostPage.style.display = 'block';
    }

    startHostGame() {
        const hostNameInput = document.getElementById('hostNameInput');
        const hostName = hostNameInput.value.trim();
        if (!hostName) {
            alert('Please enter your name.');
            return;
        }

        this.startHostButton.disabled = true;
        this.showLoadingPage();

        this.host = new Host(hostName, this);
        this.host.init();
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
        this.playerListManager.listElement = document.getElementById('gamePlayerList');
        this.boardManager.boardContainer = document.getElementById('gameBoardContainer');
        this.updateGameState(true);
    }

    showGamePage() {
        this.hideAllPages();
        if (this.gamePage) this.gamePage.style.display = 'block';
    }

    updateGameState(forceUpdate = false) {
        // Update the game board
        this.updateGameBoard(forceUpdate);

        // Update the pieces
        this.updatePieces(forceUpdate);

        // Update the player list
        this.updatePlayerList(forceUpdate);
    }

    updateGameBoard(forceUpdate = false) {
        const gameState = this.host.gameState;

        if (!gameState) return;

        if (forceUpdate || !this.boardManager.board || JSON.stringify(this.boardManager.board.toJSON()) !== JSON.stringify(gameState.board.toJSON())) {
            this.boardManager.setBoard(gameState.board);
            this.boardManager.drawBoard();
            this.updatePieces(true);
        }
    }

    updatePieces(forceUpdate = false) {
        const gameState = this.host.gameState;

        if (!gameState) return;

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
                this.host.peer.id
            );
        }

        const playersData = this.host.allPlayers;

        if (forceUpdate || this.playerListManager.shouldUpdatePlayers(playersData)) {
            this.playerListManager.setPlayers(playersData);
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
        const player = this.host.allPlayers.find((p) => p.playerId === playerId);
        if (player && confirm(`Are you sure you want to kick ${player.nickname}? This will disconnect all players associated with this player's client.`)) {
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
                this.host.broadcastPlayerList();
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
                this.host.ownedPlayers.splice(playerIndex, 1);

                const allPlayersIndex = this.host.allPlayers.findIndex((p) => p.playerId === playerId);
                if (allPlayersIndex !== -1) {
                    this.host.allPlayers.splice(allPlayersIndex, 1);
                }

                this.host.broadcastPlayerList();
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
        const playerLimitPerPeer = this.host.settings.playerLimitPerPeer;
        const totalPlayerLimit = this.host.settings.playerLimit;
        const ownedPlayers = this.host.ownedPlayers;
        const allPlayers = this.host.allPlayers;

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
        const newPlayerLimitPerPeer = parseInt(this.playerLimitPerPeerInput.value, 10);
        const newTotalPlayerLimit = parseInt(this.totalPlayerLimitInput.value, 10);

        this.host.settings.playerLimitPerPeer = newPlayerLimitPerPeer;
        this.host.settings.playerLimit = newTotalPlayerLimit;

        this.host.broadcastSettings();
        this.updateAddPlayerButton();
    }

    handlePeerError(err) {
        this.startHostButton.disabled = false;
        this.showHostPage();
        alert('An error occurred: ' + err);
    }
}
