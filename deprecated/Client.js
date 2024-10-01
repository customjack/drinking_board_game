import Peer from 'peerjs';
import Player from './Player';
import BoardManager from './BoardManager';
import Board from './Board';

export default class Client {
    constructor(playerName, hostId) {
        this.peer = null;
        this.conn = null;
        this.player = null;
        this.boardManager = new BoardManager(); // BoardManager to handle the board
        this.playerName = playerName;
        this.hostId = hostId;
    }
    
    init() {
        this.peer = new Peer();

        this.peer.on('open', (id) => {
            console.log('My ID:', id);
            this.player = new Player(id, this.playerName);

            this.conn = this.peer.connect(this.hostId);

            this.conn.on('open', () => this.handleOpenConnection());
            this.conn.on('data', (data) => this.handleData(data));
            this.conn.on('close', () => this.handleDisconnection());
        });

        this.peer.on('error', (err) => this.handleConnectionError(err));
    }

    getBoardManager() {
        return this.boardManager;
    }

    handleOpenConnection() {
        console.log('Connected to host');
        
        // Send the join request to the host
        this.conn.send({ type: 'join', peerId: this.player.peerId, nickname: this.player.nickname });
    
        // Update the invite code on the client's UI
        const inviteCodeEl = document.getElementById('inviteCode');
        if (inviteCodeEl) {
            inviteCodeEl.textContent = this.hostId; // Set the invite code to host ID
        }
    
        this.showLobby();
    }
    

    handleConnectionError() {
        alert('The lobby does not exist or the connection failed. Please try again.');
        location.reload(); // Redirect back to the home page
    }

    handleDisconnection() {
        alert('Disconnected from the host.');
        location.reload(); // Redirect to home on disconnection
    }

    handleData(data) {
        if (data.type === 'playerList') {
            this.updatePlayerList(data.players);
        } else if (data.type === 'kick') {
            this.handleKick(); // Handle being kicked by the host
        } else if (data.type === 'boardData') {
            this.handleBoardData(data.board); // Handle board data sent by the host
        }
    }

    handleBoardData(boardData) {
        console.log('Received board data from host:', boardData);
        this.boardManager.board = Board.fromJSON(boardData); // Reconstruct the board from JSON
        this.boardManager.drawBoard(); // Render the board on the canvas
    }

    handleKick() {
        alert('You have been kicked from the game.');
        location.reload(); // Redirect the client to the home page
    }

    updatePlayerList(playersData) {
        const playerList = document.getElementById('playerList');
        if (!playerList) return;
    
        playerList.innerHTML = '';  // Clear the current list
    
        playersData.forEach(playerData => {
            const li = document.createElement('li');
            li.className = 'player-container';
    
            // Create a div to hold player name and badges
            const playerNameBadges = document.createElement('div');
            playerNameBadges.className = 'player-name-badges';
    
            // Add player name
            let nameHtml = `<span>${playerData.nickname}</span>`;
    
            // Add badges for "Host" and "You"
            if (playerData.isHost) {
                nameHtml += `<span class="host-badge">Host</span>`;
            }
            if (playerData.peerId === this.player.peerId) {
                nameHtml += `<span class="you-badge">You</span>`;
            }
    
            playerNameBadges.innerHTML = nameHtml;
    
            // Create a div for buttons (edit button only for "You")
            const playerButtons = document.createElement('div');
            playerButtons.className = 'player-buttons';
    
            // Show edit button only if the player is "You"
            if (playerData.peerId === this.player.peerId) {
                const editButton = document.createElement('button');
                editButton.className = 'edit-button';
                editButton.textContent = '✏️';
                editButton.setAttribute('data-peerid', playerData.peerId);
                playerButtons.appendChild(editButton);
            }
    
            // Append name and badges to the player container
            li.appendChild(playerNameBadges);
    
            // Append buttons to the player container
            li.appendChild(playerButtons);
    
            playerList.appendChild(li);
        });
    
        this.addEditListeners();
    }
    
    
    
    

    addEditListeners() {
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const peerId = e.target.getAttribute('data-peerid');
                this.editPlayerName(peerId);
            });
        });
    }

    editPlayerName(peerId) {
        if (peerId === this.player.peerId) {
            const newName = prompt('Enter your new name:', this.player.nickname);
            if (newName) {
                this.player.nickname = newName;
                this.conn.send({ type: 'nameChange', peerId: this.player.peerId, newName });
            }
        }
    }

    showLobby() {
        document.getElementById('joinPage').style.display = 'none';
        document.getElementById('lobbyPage').style.display = 'block';
    }
}
