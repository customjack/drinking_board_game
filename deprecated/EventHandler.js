import Host from './Host';
import Client from './Client';
import BoardManager from './BoardManager'; // Import the board manager
import Piece from './Piece'; // Import the Piece class

export default class Game {
    constructor() {
        this.isHost = false;
        this.host = null;
        this.client = null;
        this.pieces = []; // Hold player pieces

        // DOM Elements
        this.homePage = document.getElementById('homePage');
        this.hostPage = document.getElementById('hostPage');
        this.joinPage = document.getElementById('joinPage');
        this.lobbyPage = document.getElementById('lobbyPage');
        this.gamePage = document.getElementById('gamePage'); // New game page element
        this.inviteCode = document.getElementById('inviteCode');
        this.copyInviteCodeButton = document.getElementById('copyInviteCodeButton');
        this.copyMessage = document.getElementById('copyMessage');

        this.hostButton = document.getElementById('hostButton');
        this.joinButton = document.getElementById('joinButton');
        this.startHostButton = document.getElementById('startHostButton');
        this.startJoinButton = document.getElementById('startJoinButton');
        this.startGameButton = document.getElementById('startGameButton'); // Button for starting the game

        this.closeGameButton = document.getElementById('closeGameButton');
        this.leaveGameButton = document.getElementById('leaveGameButton');

        this.boardManager = new BoardManager(); // Initialize the board manager
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.hostButton) this.hostButton.addEventListener('click', () => this.showHostPage());
        if (this.joinButton) this.joinButton.addEventListener('click', () => this.showJoinPage());
        if (this.startHostButton) this.startHostButton.addEventListener('click', () => this.startHostLobby());
        if (this.startJoinButton) this.startJoinButton.addEventListener('click', () => this.startClientLobby());
        if (this.startGameButton) this.startGameButton.addEventListener('click', () => this.startGame()); // New game start handler
        if (this.copyInviteCodeButton) this.copyInviteCodeButton.addEventListener('click', () => this.copyInviteCode());

        if (this.closeGameButton) this.closeGameButton.addEventListener('click', () => this.closeGame());
        if (this.leaveGameButton) this.leaveGameButton.addEventListener('click', () => this.leaveGame());
    }

    showHostPage() {
        this.homePage.style.display = 'none';
        this.hostPage.style.display = 'block';
    }

    showJoinPage() {
        this.homePage.style.display = 'none';
        this.joinPage.style.display = 'block';
    }

    startHostLobby() {
        const hostName = document.getElementById('hostNameInput').value.trim();
        if (!hostName) {
            alert('Please enter your name.');
            return;
        }
        this.isHost = true;
        this.host = new Host(hostName);
        this.host.init();
        this.displayLobbyForHost();
    }

    startClientLobby() {
        const playerName = document.getElementById('joinNameInput').value.trim();
        const gameCode = document.getElementById('joinCodeInput').value.trim();
        if (!playerName || !gameCode) {
            alert('Please enter your name and a valid game code.');
            return;
        }
        this.isHost = false;
        this.client = new Client(playerName, gameCode);
        this.client.init();
        this.displayLobbyForClient();
    }

    displayLobbyForHost() {
        this.hostPage.style.display = 'none';
        this.lobbyPage.style.display = 'block';
        this.closeGameButton.style.display = 'inline';
        this.leaveGameButton.style.display = 'none';
    }

    displayLobbyForClient() {
        this.joinPage.style.display = 'none';
        this.lobbyPage.style.display = 'block';
        this.leaveGameButton.style.display = 'inline';
        this.closeGameButton.style.display = 'none';
    }

    async startGame() {
        console.log('Game started!');

        // Get the board from the host or client depending on who is starting the game
        this.boardManager = this.isHost ? this.host.getBoardManager() : this.client.getBoardManager(); //should always be initialized by host anyways

        // Ensure the board is loaded before starting the game
        if (!this.boardManager.board || !this.boardManager.board.spaces) {
            console.error('The game board is not loaded yet.');
            alert('The game board is not loaded. Please try again.');
            return;
        }

        // Switch to game page
        this.lobbyPage.style.display = 'none';
        this.gamePage.style.display = 'block';

        // Initialize player pieces and place them on the starting space
        this.initializePieces();
    }

    initializePieces() {
        const startingSpace = this.boardManager.board.spaces.find(space => space.name === 'Start');
        if (startingSpace) {
            this.pieces = this.host.players.map(player => {
                const piece = new Piece(player, startingSpace);
                piece.renderPiece(this.boardManager.boardContainer); // Add to the game board
                return piece;
            });
        } else {
            console.error('Starting space not found!');
        }
    }

    copyInviteCode() {
        const inviteCode = this.inviteCode.textContent.trim();
        if (inviteCode) {
            navigator.clipboard.writeText(inviteCode)
                .then(() => {
                    this.showCopyMessage();
                })
                .catch(err => console.error('Failed to copy invite code:', err));
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
}
