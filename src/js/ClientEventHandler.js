// ClientEventHandler.js

import Client from './Client';
import BoardManager from './BoardManager';
import PlayerListManager from './PlayerListManager';

export default class ClientEventHandler {
    constructor() {
        // DOM Elements
        this.homePage = document.getElementById('homePage');
        this.joinPage = document.getElementById('joinPage');
        this.lobbyPage = document.getElementById('lobbyPage');
        this.gamePage = document.getElementById('gamePage');
        this.loadingPage = document.getElementById('loadingPage');
        this.inviteCode = document.getElementById('inviteCode');
        this.copyInviteCodeButton = document.getElementById('copyInviteCodeButton');
        this.copyMessage = document.getElementById('copyMessage');

        this.startJoinButton = document.getElementById('startJoinButton');
        this.leaveGameButton = document.getElementById('leaveGameButton');

        this.boardManager = new BoardManager();
        this.playerListManager = null;

        this.client = null;
    }

    init() {
        this.setupEventListeners();
        this.showJoinPage();
    }

    setupEventListeners() {
        if (this.startJoinButton)
            this.startJoinButton.addEventListener('click', () => this.startJoinGame());
        if (this.copyInviteCodeButton)
            this.copyInviteCodeButton.addEventListener('click', () => this.copyInviteCode());
        if (this.leaveGameButton)
            this.leaveGameButton.addEventListener('click', () => this.leaveGame());
    }

    showJoinPage() {
        this.homePage.style.display = 'none';
        this.joinPage.style.display = 'block';
    }

    startJoinGame() {
        const playerNameInput = document.getElementById('joinNameInput');
        const gameCodeInput = document.getElementById('joinCodeInput');

        const playerName = playerNameInput.value.trim();
        const gameCode = gameCodeInput.value.trim();

        if (!playerName || !gameCode) {
            alert('Please enter your name and a valid game code.');
            return;
        }

        // Disable the startJoinButton to prevent multiple clicks
        this.startJoinButton.disabled = true;

        // Show loading indicator
        this.showLoadingPage();

        this.client = new Client(playerName, gameCode, this);
        this.client.init();
    }

    showLoadingPage() {
        this.joinPage.style.display = 'none';
        if (this.loadingPage) {
            this.loadingPage.style.display = 'block';
        }
    }

    hideLoadingPage() {
        if (this.loadingPage) {
            this.loadingPage.style.display = 'none';
        }
    }

    displayLobbyForPlayer() {
        this.hideLoadingPage();
        this.lobbyPage.style.display = 'block';
        this.leaveGameButton.style.display = 'inline';
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

    startGame() {
        console.log('Client is switching to game page...');
        this.lobbyPage.style.display = 'none';  // Hide the lobby
        this.gamePage.style.display = 'block';  // Show the game page
        this.playerListManager.listElement = document.getElementById('gamePlayerList'); //update list draw location to gamePlayerList
        this.boardManager.boardContainer = document.getElementById('gameBoardContainer'); //update board drwa location to gameBoardContainer
        this.updatePlayerList();
        this.updateGameBoard();
    }

    leaveGame() {
        alert('You have left the game.');
        location.reload();
    }

    // Update and redraw the game board
    updateGameBoard() {
        const gameState = this.client.gameState;
        if (gameState.board) {
            this.boardManager.board = gameState.board;  // Update the board in the board manager
            this.boardManager.drawBoard();  // Redraw the board using the board manager
        }
    }

    updatePlayerList() {
        if (!this.playerListManager) {
            this.playerListManager = new PlayerListManager(document.getElementById('lobbyPlayerList'), false, this.client.player.peerId, this.client.hostId);
        }
        const playersData = this.client.players;

        this.playerListManager.setPlayers(playersData);

        this.addEditListeners();
    }

    addEditListeners() {
        document.querySelectorAll('.edit-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const peerId = e.target.getAttribute('data-peerid');
                this.editPlayerName(peerId);
            });
        });
    }

    editPlayerName(peerId) {
        if (peerId === this.client.player.peerId) {
            const newName = prompt('Enter your new name:', this.client.player.nickname);
            if (newName) {
                this.client.player.nickname = newName;
                this.client.conn.send({
                    type: 'nameChange',
                    peerId: this.client.player.peerId,
                    newName,
                });
            }
        }
    }

    handleConnectionError() {
        // Re-enable the startJoinButton to allow retrying
        this.startJoinButton.disabled = false;

        // Hide loading indicator and show join page again
        this.hideLoadingPage();
        this.showJoinPage();

        alert('The lobby does not exist or the connection failed. Please try again.');
    }
}
