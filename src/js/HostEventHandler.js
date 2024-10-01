// HostEventHandler.js

import Host from './Host';
import BoardManager from './BoardManager';
import Board from './Board';
import PlayerListManager from './PlayerListManager'

export default class HostEventHandler {
    constructor() {
        // DOM Elements
        this.homePage = document.getElementById('homePage');
        this.hostPage = document.getElementById('hostPage');
        this.lobbyPage = document.getElementById('lobbyPage');
        this.gamePage = document.getElementById('gamePage');
        this.loadingPage = document.getElementById('loadingPage');
        this.inviteCode = document.getElementById('inviteCode');
        this.copyInviteCodeButton = document.getElementById('copyInviteCodeButton');
        this.copyMessage = document.getElementById('copyMessage');

        this.startHostButton = document.getElementById('startHostButton');
        this.closeGameButton = document.getElementById('closeGameButton');
        this.startGameButton = document.getElementById('startGameButton'); 

        this.boardManager = new BoardManager();
        this.playerListManager = null;

        this.host = null;
    }

    init() {
        this.setupEventListeners();
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

        const uploadButton = document.getElementById('uploadBoardButton');
        const fileInput = document.getElementById('boardFileInput');
        if (uploadButton) {
            uploadButton.addEventListener('click', () => fileInput.click());
        }

        if (fileInput) {
            fileInput.addEventListener('change', async (event) => {
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
                            this.host.gameState.board = board

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

    // Show the game page (Host side)
    showGamePage() {
        this.lobbyPage.style.display = 'none';  // Hide the lobby
        this.gamePage.style.display = 'block';  // Show the game page
    }

    showHostPage() {
        this.homePage.style.display = 'none';
        this.hostPage.style.display = 'block';
    }

    startHostGame() {
        const hostNameInput = document.getElementById('hostNameInput');
        const hostName = hostNameInput.value.trim();
        if (!hostName) {
            alert('Please enter your name.');
            return;
        }

        // Disable the startHostButton to prevent multiple clicks
        this.startHostButton.disabled = true;

        // Show loading indicator
        this.showLoadingPage();

        this.host = new Host(hostName, this);
        this.host.init();

    }

    showLoadingPage() {
        this.hostPage.style.display = 'none';
        if (this.loadingPage) {
            this.loadingPage.style.display = 'block';
        }
    }

    hideLoadingPage() {
        if (this.loadingPage) {
            this.loadingPage.style.display = 'none';
        }
    }

    displayLobbyForHost() {
        this.hideLoadingPage();
        this.lobbyPage.style.display = 'block';
        this.closeGameButton.style.display = 'inline';

        document.getElementById('startGameButton').style.display = 'inline';
        document.getElementById('uploadBoardButton').style.display = 'inline';
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
        // Notify the clients to start the game
        console.log('Host is starting the game...');
        if (this.host) {
            this.host.broadcastStartGame(); // This sends the startGame signal to all clients
        }
        this.showGamePage(); // Show the game page for the host

        this.playerListManager.listElement = document.getElementById('gamePlayerList'); //update list draw location to gamePlayerList
        this.boardManager.boardContainer = document.getElementById('gameBoardContainer'); //update board drwa location to gameBoardContainer
        
        this.updatePlayerList(); // Update the player list in the new location
        this.updateGameBoard();  // Update the game board after layout is settled
    }

    closeGame() {
        alert('The host has closed the game.');
        location.reload();
    }

    updatePlayerList() {
        if (!this.playerListManager) {
            this.playerListManager = new PlayerListManager(document.getElementById('lobbyPlayerList'), true, this.host.player.peerId, this.host.player.peerId);
        }

        const playersData = this.host.players;
        this.playerListManager.setPlayers(playersData);

        this.addKickAndEditListeners();
    }

    updateGameBoard() {
        const gameState = this.host.gameState;
        if (gameState.board) {
            this.boardManager.board = gameState.board;  // Update the board in the board manager
            this.boardManager.drawBoard();  // Redraw the board using the board manager
        }
    }

    addKickAndEditListeners() {
        document.querySelectorAll('.kick-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const peerId = e.target.getAttribute('data-peerid');
                this.confirmAndKickPlayer(peerId);
            });
        });

        document.querySelectorAll('.edit-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const peerId = e.target.getAttribute('data-peerid');
                this.editPlayerName(peerId);
            });
        });
    }

    confirmAndKickPlayer(peerId) {
        const player = this.host.players.find((p) => p.peerId === peerId);
        if (player && confirm(`Are you sure you want to kick ${player.nickname}?`)) {
            this.host.kickPlayer(peerId);
        }
    }

    editPlayerName(peerId) {
        const player = this.host.players.find((p) => p.peerId === peerId);
        if (player) {
            const newName = prompt('Enter new name:', player.nickname);
            if (newName) {
                player.nickname = newName;
                this.updatePlayerList(this.host.players);
                this.host.broadcastPlayerList();
            }
        }
    }

    handleHostError() {
        // Re-enable the startHostButton to allow retrying
        this.startHostButton.disabled = false;

        // Hide loading indicator and show host page again
        this.hideLoadingPage();
        this.showHostPage();

        alert('Failed to start hosting. Please try again.');
    }
}
