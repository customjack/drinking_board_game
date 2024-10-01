import Peer from 'peerjs';
import Player from './Player';
import BoardManager from './BoardManager';
import Board from './Board'; // Adjust the path if necessary

export default class Host {
    constructor(hostName) {
        this.peer = null;
        this.players = [];
        this.connections = [];
        this.hostName = hostName;
        this.boardManager = new BoardManager(); // Initialize BoardManager for the host
    }

    async init() {
        this.peer = new Peer();
    
        this.peer.on('open', async (id) => { // Mark this handler as async
            console.log('Host ID:', id);
            this.hostId = id;
            this.setupUI();
            this.addPlayer(new Player(id, this.hostName, true)); // Add host to player list
            
            // Now we can await the loading of the board
            await this.boardManager.loadDefaultBoard();
    
            this.peer.on('connection', (conn) => this.handleConnection(conn));
        });
    
        this.peer.on('error', (err) => console.error('Peer error:', err));
    }

    getBoardManager() {
        return this.boardManager;
    }
    

    setupUI() {
        const inviteCodeEl = document.getElementById('inviteCode');
        inviteCodeEl.textContent = this.hostId;

        document.getElementById('homePage').style.display = 'none';
        document.getElementById('hostPage').style.display = 'none';
        document.getElementById('lobbyPage').style.display = 'block';
        document.getElementById('startGameButton').style.display = 'inline';
        document.getElementById('uploadBoardButton').style.display = 'inline'; // Show the upload button for the host

        // Add event listener for upload board button
        const uploadButton = document.getElementById('uploadBoardButton');
        const fileInput = document.getElementById('boardFileInput');
        uploadButton.addEventListener('click', () => fileInput.click());

        // Handle the file input change event
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const content = e.target.result;
                        console.log('Raw file content:', content);  // Add this log
        
                        const boardData = JSON.parse(content);  // Parse the JSON
                        console.log('Board JSON uploaded:', boardData);
        
                        // Update the board for the host and render it
                        this.boardManager.board = Board.fromJSON(boardData);
                        this.boardManager.drawBoard();
        
                        // Broadcast the updated board to all clients
                        this.broadcastBoard();
                    } catch (err) {
                        console.error('Invalid board JSON:', err);  // Add better error handling
                        alert('Invalid board file.');
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    addPlayer(player) {
        this.players.push(player);
        this.updatePlayerList();
    }

    updatePlayerList() {
        const playerList = document.getElementById('playerList');
        if (!playerList) return;
    
        playerList.innerHTML = '';  // Clear the current list
    
        this.players.forEach(player => {
            const li = document.createElement('li');
            li.className = 'player-container';
    
            // Create a div to hold player name and badges
            const playerNameBadges = document.createElement('div');
            playerNameBadges.className = 'player-name-badges';
    
            // Add player name
            let nameHtml = `<span>${player.nickname}</span>`;
    
            // Add badges for "Host" and "You"
            if (player.isHost) {
                nameHtml += `<span class="host-badge">Host</span>`;
            }
            if (player.peerId === this.peer.id) {
                nameHtml += `<span class="you-badge">You</span>`;
            }
    
            playerNameBadges.innerHTML = nameHtml;
    
            // Create a div for buttons (edit and kick)
            const playerButtons = document.createElement('div');
            playerButtons.className = 'player-buttons';
    
            // Show edit button only if the player is "You"
            if (player.peerId === this.peer.id) {
                const editButton = document.createElement('button');
                editButton.className = 'edit-button';
                editButton.textContent = '✏️';
                editButton.setAttribute('data-peerid', player.peerId);
                playerButtons.appendChild(editButton);
            }
    
            // Show kick button for non-host players
            if (!player.isHost) {
                const kickButton = document.createElement('button');
                kickButton.className = 'kick-button';
                kickButton.textContent = '❌';
                kickButton.setAttribute('data-peerid', player.peerId);
                playerButtons.appendChild(kickButton);
            }
    
            // Append name and badges to the player container
            li.appendChild(playerNameBadges);
    
            // Append buttons to the player container
            li.appendChild(playerButtons);
    
            playerList.appendChild(li);
        });
    
        this.addKickAndEditListeners();
    }

    addKickAndEditListeners() {
        document.querySelectorAll('.kick-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const peerId = e.target.getAttribute('data-peerid');
                this.confirmAndKickPlayer(peerId);
            });
        });

        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const peerId = e.target.getAttribute('data-peerid');
                this.editPlayerName(peerId);
            });
        });
    }

    confirmAndKickPlayer(peerId) {
        const player = this.players.find(p => p.peerId === peerId);
        if (player && confirm(`Are you sure you want to kick ${player.nickname}?`)) {
            this.kickPlayer(peerId);
        }
    }

    kickPlayer(peerId) {
        console.log(`Kicking player with peerId: ${peerId}`);
        const connection = this.connections.find(conn => conn.peer === peerId);
        if (connection) {
            connection.send({ type: 'kick' }); // Send a kick message to the client
            connection.close();  // Close the connection
            this.removePlayer(peerId);  // Remove player from the list
            this.broadcastPlayerList();  // Notify all clients of the change
        }
    }

    removePlayer(peerId) {
        this.players = this.players.filter(p => p.peerId !== peerId);
        this.updatePlayerList();
    }

    editPlayerName(peerId) {
        const player = this.players.find(p => p.peerId === peerId);
        if (player) {
            const newName = prompt('Enter new name:', player.nickname);
            if (newName) {
                player.nickname = newName;
                this.updatePlayerList();
                this.broadcastPlayerList();
            }
        }
    }

    handleConnection(conn) {
        console.log('New connection from', conn.peer);
        this.connections.push(conn);

        conn.on('data', (data) => this.handleData(conn, data));
        conn.on('close', () => this.handleDisconnection(conn.peer));
    }

    handleData(conn, data) {
        if (data.type === 'join') {
            const newPlayer = new Player(conn.peer, data.nickname);
            this.addPlayer(newPlayer);
            this.broadcastPlayerList();
            this.broadcastBoard();
        } else if (data.type === 'nameChange') {
            this.handleNameChange(data.peerId, data.newName);
        }
    }

    handleNameChange(peerId, newName) {
        const player = this.players.find(p => p.peerId === peerId);
        if (player) {
            player.nickname = newName;
            this.updatePlayerList();
            this.broadcastPlayerList();
        }
    }

    broadcastPlayerList() {
        const playersData = this.players.map(player => ({
            peerId: player.peerId,
            nickname: player.nickname,
            isHost: player.isHost
        }));

        this.connections.forEach(conn => {
            conn.send({ type: 'playerList', players: playersData });
        });
    }

    broadcastBoard() {
        const serializedBoard = this.boardManager.board.toJSON(); // Serialize the board
        this.connections.forEach((conn) => {
            conn.send({ type: 'boardData', board: serializedBoard }); // Send the serialized board
        });
        console.log('Board broadcasted to all players:', serializedBoard);
    }

    handleDisconnection(peerId) {
        console.log(`Connection closed with ${peerId}`);
        this.removePlayer(peerId);
    }
}
