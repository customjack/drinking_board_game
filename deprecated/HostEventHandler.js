// HostEventHandler.js

import Host from './older/Host';
import BoardManager from './BoardManager';
import Board from './Board';
import PlayerListManager from './PlayerListManager'
import PieceManager from './PieceManager';

export default class HostEventHandler {
    constructor() {
        // DOM Elements
        this.homePage = document.getElementById('homePage');
        this.hostPage = document.getElementById('hostPage');
        this.lobbyPage = document.getElementById('lobbyPage');
        this.gamePage = document.getElementById('gamePage');
        this.loadingPage = document.getElementById('loadingPage');
        // Store all pages in an array for easy management
        this.pages = [this.homePage, this.hostPage, this.lobbyPage, this.gamePage, this.loadingPage];


        this.inviteCode = document.getElementById('inviteCode');
        this.copyInviteCodeButton = document.getElementById('copyInviteCodeButton');
        this.copyMessage = document.getElementById('copyMessage');
        this.settingsSection = document.getElementById('settingsSectionHost');

        this.startHostButton = document.getElementById('startHostButton');
        this.closeGameButton = document.getElementById('closeGameButton');
        this.startGameButton = document.getElementById('startGameButton'); 
        this.addPlayerButton = document.getElementById('addPlayerButton')
        this.uploadButton    = document.getElementById('uploadBoardButton');
        this.fileInput       = document.getElementById('boardFileInput');

        this.playerLimitPerPeerInput = document.getElementById('playerLimitPerPeerHost');
        this.totalPlayerLimitInput = document.getElementById('totalPlayerLimitHost');

        this.boardManager = new BoardManager();
        this.playerListManager = null;
        this.pieceManager = new PieceManager();

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

    // Utility method to hide all pages
    hideAllPages() {
        this.pages.forEach(page => {
            if (page) {
                page.style.display = 'none';  // Hide each page
            }
        });
    }

    // Show the game page (Host side)
    showGamePage() {
        this.hideAllPages();
        this.gamePage.style.display = 'block';  // Show the game page
    }

    showHostPage() {
        this.hideAllPages();
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
        this.hideAllPages();
        this.loadingPage.style.display = 'block';
    }

    displayLobbyForHost() {
        this.hideAllPages();
        this.lobbyPage.style.display = 'block';
        this.closeGameButton.style.display = 'inline';
        this.settingsSection.style.display = 'inline';
        this.uploadButton.style.display = 'inline';
        this.startGameButton.style.display = 'inline';


        this.updateAddPlayerButton();
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
        
        this.updateGameState(true);
    }

    closeGame() {
        alert('The host has closed the game.');
        location.reload();
    }

    // Method to update all aspects of the game state (board, pieces, player list)
    updateGameState(forceUpdate = false) {
        // Update the game board
        this.updateGameBoard(forceUpdate);

        // Update the player list
        this.updatePlayerList(forceUpdate);

        // Update the pieces
        this.updatePieces(forceUpdate);
    }


    updatePlayerList(forceUpdate = false) {
        if (!this.playerListManager) {
            // All owned players should have the same peerId
            this.playerListManager = new PlayerListManager(
                document.getElementById('lobbyPlayerList'), 
                true, 
                this.host.peer.id, 
                this.host.peer.id
            );
        }
    
        const playersData = this.host.allPlayers;
    
        // If forceUpdate is true, update immediately without comparison
        if (forceUpdate) {
            this.playerListManager.setPlayers(playersData);  // Update the player list with the new data
            this.addKickAndEditListeners();  // Add listeners for kick and edit buttons
            this.updateAddPlayerButton();  // Update the add player button
            return;
        }
    
        // Compare the current player data with the new one
        const currentPlayersJSON = JSON.stringify(this.playerListManager.getPlayers());
        const newPlayersJSON = JSON.stringify(playersData);
    
        // Only update if the players are different
        console.log("player list jsons update", currentPlayersJSON !== newPlayersJSON);
        if (currentPlayersJSON !== newPlayersJSON) {
            this.playerListManager.setPlayers(playersData);  // Update the player list with the new data
            this.addKickAndEditListeners();  // Add listeners for kick and edit buttons
            this.updateAddPlayerButton();  // Update the add player button
        }
    }    

    updateGameBoard(forceUpdate = false) {
        const gameState = this.host.gameState;
    
        if (!gameState) return; // No game state, exit early
    
        // If forceUpdate is true, update immediately without comparison
        if (forceUpdate) {
            this.boardManager.setBoard(gameState.board);  // Update the board in the board manager
            this.boardManager.drawBoard();  // Redraw the board using the board manager
            this.updatePieces(true); //Need to update piece location when UI changes
            return;
        }

        // If there is no board yet, we have to add one
        if (!this.boardManager.board) {
            this.boardManager.setBoard(gameState.board);  // Update the board in the board manager
            this.boardManager.drawBoard();  // Redraw the board using the board manager
            this.updatePieces(true); // Update piece locations after UI changes
            return;
        }
    
        const currentBoardJSON = JSON.stringify(this.boardManager.board.toJSON());
        const newBoardJSON = JSON.stringify(gameState.board.toJSON());

        // Only update if the boards are different
        console.log("board jsons update", currentBoardJSON !== newBoardJSON);
        if (currentBoardJSON !== newBoardJSON) {
            this.boardManager.setBoard(gameState.board);  // Update the board in the board manager
            this.boardManager.drawBoard();  // Redraw the board using the board manager
            this.updatePieces(true); //Need to update piece location when UI changes
        }
    }

    updatePieces(forceUpdate = false) {
        const gameState = this.host.gameState;
        
        if (!gameState) return; // No game state, exit early
    
        // If forceUpdate is true, update immediately without comparison
        if (forceUpdate) {
            this.pieceManager.updatePieces(gameState);
            return;
        }
    
        // Get the current players from the piece manager
        const currentPlayers = this.pieceManager.getPlayers();
    
        let shouldUpdate = false;
    
        // Compare the current player positions with the new game state players
        gameState.players.forEach(gameStatePlayer => {
            const currentPlayer = currentPlayers.find(player => player.playerId === gameStatePlayer.playerId);
    
            if (currentPlayer) {
                // Compare the currentSpaceId to detect any changes
                if (currentPlayer.currentSpaceId !== gameStatePlayer.currentSpaceId) {
                    shouldUpdate = true;
                }
            } else {
                // If the player doesn't exist in the current list, we need to update
                shouldUpdate = true;
            }
        });
    
        // Only update pieces if something has changed
        console.log("player locations updated", shouldUpdate);
        if (shouldUpdate) {
            this.pieceManager.updatePieces(gameState);
        }
    }
    
    

    updateAddPlayerButton() {
        const playerLimitPerPeer = this.host.settings.playerLimitPerPeer;  // Get the player limit per peer from client settings
        const totalPlayerLimit = this.host.settings.playerLimit;  // Get the total player limit from client settings
        const ownedPlayers = this.host.ownedPlayers;  // Get the owned players from the client
        const allPlayers = this.host.allPlayers;  // Get the total list of players

        // Check if the current peer has reached its limit or if the total player limit has been reached
        if (ownedPlayers.length < playerLimitPerPeer && allPlayers.length < totalPlayerLimit) {
            this.addPlayerButton.style.display = 'block';  // Show the "Add Player" button
        } else {
            this.addPlayerButton.style.display = 'none';  // Hide the "Add Player" button
        }
        this.updatePieces(true); //Need to update piece location when UI changes
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
                this.updatePlayerList(this.host.allPlayers);
                this.host.broadcastPlayerList();
            }
        }
    }

    
    // Handle the "Add Player" button click
    addPlayer() {
        const newName = prompt('Enter a new player name:');
        if (newName && newName.trim() !== "") {
            // Call the client method to add a new owned player
            this.host.addNewOwnedPlayer(newName.trim());
        }
    }

    removePlayer(playerId) {
        // Find the index of the player in the host's owned players list
        const playerIndex = this.host.ownedPlayers.findIndex((p) => p.playerId === playerId);
    
        if (playerIndex !== -1) {
            // Check if this is the only player left
            if (this.host.ownedPlayers.length === 1) {
                // If only one player is left, leave the game
                alert('You have removed your last player. Leaving the game.');
                this.leaveGame(); // Handle the player leaving the game
            } else {
                // Remove the player from the list of owned players
                this.host.ownedPlayers.splice(playerIndex, 1);
                
                // Find and remove the player from the allPlayers list
                const allPlayersIndex = this.host.allPlayers.findIndex((p) => p.playerId === playerId);
                if (allPlayersIndex !== -1) {
                    this.host.allPlayers.splice(allPlayersIndex, 1);
                }
    
                // Broadcast the updated player list to all players
                this.host.broadcastPlayerList();
    
                // Update the Add Player button to reflect the change in the number of owned players
                this.updateAddPlayerButton();
            }
        } else {
            alert('Player not found.');
        }
    }

    // Update the host's settings and broadcast them to all clients
    onSettingsChanged() {
        const newPlayerLimitPerPeer = parseInt(this.playerLimitPerPeerInput.value, 10);
        const newTotalPlayerLimit = parseInt(this.totalPlayerLimitInput.value, 10);

        // Update host settings
        this.host.settings.playerLimitPerPeer = newPlayerLimitPerPeer;
        this.host.settings.playerLimit = newTotalPlayerLimit;

        // Broadcast updated settings to all clients
        this.host.broadcastSettings();
        this.updateAddPlayerButton();
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
