import Host from './Host';
import Client from './Client';
import BoardManager from './BoardManager'; // Import the board manager

export default class Game {
    constructor() {
        this.isHost = false;
        this.host = null;
        this.client = null;

        // DOM Elements
        this.homePage = document.getElementById('homePage');
        this.hostPage = document.getElementById('hostPage');
        this.joinPage = document.getElementById('joinPage');
        this.lobbyPage = document.getElementById('lobbyPage');
        this.inviteCode = document.getElementById('inviteCode');
        this.copyInviteCodeButton = document.getElementById('copyInviteCodeButton');
        this.copyMessage = document.getElementById('copyMessage');

        this.hostButton = document.getElementById('hostButton');
        this.joinButton = document.getElementById('joinButton');
        this.startHostButton = document.getElementById('startHostButton');
        this.startJoinButton = document.getElementById('startJoinButton');

        this.closeGameButton = document.getElementById('closeGameButton');
        this.leaveGameButton = document.getElementById('leaveGameButton');

        this.boardManager = new BoardManager('boardCanvas'); // Initialize the board manager with the canvas element
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.hostButton) this.hostButton.addEventListener('click', () => this.showHostPage());
        if (this.joinButton) this.joinButton.addEventListener('click', () => this.showJoinPage());
        if (this.startHostButton) this.startHostButton.addEventListener('click', () => this.startHostGame());
        if (this.startJoinButton) this.startJoinButton.addEventListener('click', () => this.startJoinGame());
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

    startHostGame() {
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

    startJoinGame() {
        const playerName = document.getElementById('joinNameInput').value.trim();
        const gameCode = document.getElementById('joinCodeInput').value.trim();
        if (!playerName || !gameCode) {
            alert('Please enter your name and a valid game code.');
            return;
        }
        this.isHost = false;
        this.client = new Client(playerName, gameCode);
        this.client.init();
        this.displayLobbyForPlayer();
    }

    displayLobbyForHost() {
        this.hostPage.style.display = 'none';
        this.lobbyPage.style.display = 'block';
        this.closeGameButton.style.display = 'inline';
        this.leaveGameButton.style.display = 'none';
    }

    displayLobbyForPlayer() {
        this.joinPage.style.display = 'none';
        this.lobbyPage.style.display = 'block';
        this.leaveGameButton.style.display = 'inline';
        this.closeGameButton.style.display = 'none';
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
