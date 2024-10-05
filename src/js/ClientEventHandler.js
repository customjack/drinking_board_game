// ClientEventHandler.js

import Client from './Client';
import BoardManager from './BoardManager';
import PlayerListManager from './PlayerListManager';
import PieceManager from './PieceManager';

export default class ClientEventHandler {
    constructor() {
        // DOM Elements
        this.homePage = document.getElementById('homePage');
        this.joinPage = document.getElementById('joinPage');
        this.lobbyPage = document.getElementById('lobbyPage');
        this.gamePage = document.getElementById('gamePage');
        this.loadingPage = document.getElementById('loadingPage');
        // Store all pages in an array for easy management
        this.pages = [this.homePage, this.joinPage, this.lobbyPage, this.gamePage, this.loadingPage];

        this.inviteCode = document.getElementById('inviteCode');
        this.copyMessage = document.getElementById('copyMessage');

        this.startJoinButton = document.getElementById('startJoinButton');
        this.leaveGameButton = document.getElementById('leaveGameButton');
        this.addPlayerButton = document.getElementById('addPlayerButton');
        this.copyInviteCodeButton = document.getElementById('copyInviteCodeButton');

        this.playerLimitPerPeerDisplay = document.getElementById('playerLimitPerPeerDisplayClient');
        this.totalPlayerLimitDisplay = document.getElementById('totalPlayerLimitDisplayClient');
        this.settingsSection = document.getElementById('settingsSectionClient');

        
        this.boardManager = new BoardManager();
        this.playerListManager = null;
        this.pieceManager = new PieceManager();

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
        if (this.addPlayerButton)
            this.addPlayerButton.addEventListener('click', () => this.addPlayer());
    }

    // Utility method to hide all pages
    hideAllPages() {
        this.pages.forEach(page => {
            if (page) {
                page.style.display = 'none';  // Hide each page
            }
        });
    }

    showJoinPage() {
        this.hideAllPages();
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
        if (this.loadingPage && this.loadingPage.style.display !== 'block') {
            this.hideAllPages();
            this.loadingPage.style.display = 'block';
        }
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
        console.log('Client is switching to game page...');
        if (this.gamePage && this.gamePage.style.display !== 'block') {
            this.hideAllPages();
            this.gamePage.style.display = 'block';  // Show the game page
            this.playerListManager.listElement = document.getElementById('gamePlayerList'); //update list draw location to gamePlayerList
            this.boardManager.boardContainer = document.getElementById('gameBoardContainer'); //update board draw location to gameBoardContainer
            this.updateGameState(true); //Force update the game board so it get's redrawn in the correct container
        }
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

    updateGameState(forceUpdate = false) {
        // Update the game board
        this.updateGameBoard(forceUpdate);
    
        // Update the pieces
        this.updatePieces(forceUpdate);
    
        // Update the player list
        this.updatePlayerList(forceUpdate);
    }
    

    // Update and redraw the game board only if it has changed
    updateGameBoard(forceUpdate = false) {
        const gameState = this.client.gameState;

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
            return;
        }
        
        const currentBoardJSON = JSON.stringify(this.boardManager.board.toJSON());
        const newBoardJSON = JSON.stringify(gameState.board.toJSON());

        // Only update if the boards are different or if forceUpdate is true
        if (currentBoardJSON !== newBoardJSON) {
            this.boardManager.setBoard(gameState.board);  // Update the board in the board manager
            this.boardManager.drawBoard();  // Redraw the board using the board manager
            this.updatePieces(true); //Need to update piece location when UI changes
        }
    }

    updatePieces(forceUpdate = false) {
        const gameState = this.client.gameState;
        
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
    
        // Only update pieces if something has changed or if forceUpdate is true
        if (shouldUpdate) {
            this.pieceManager.updatePieces(gameState);
        }
    }
    
    

    updatePlayerList(forceUpdate = false) {
        // Initialize the PlayerListManager if not already done
        if (!this.playerListManager) {
            this.playerListManager = new PlayerListManager(
                document.getElementById('lobbyPlayerList'), 
                false, 
                this.client.peer.id, 
                this.client.hostId
            );
        }
    
        const playersData = this.client.allPlayers;

        // If forceUpdate is true, update immediately without comparison
        if (forceUpdate) {
            this.playerListManager.setPlayers(playersData);  // Update the player list with the new data
            this.addEditListeners();  // Add listeners for edit buttons
            this.updateAddPlayerButton();
            return;
        }
    
        // Compare the current player data with the new one
        const currentPlayersJSON = JSON.stringify(this.playerListManager.getPlayers());
        const newPlayersJSON = JSON.stringify(playersData);
    
        // Only update if the players are different or if forceUpdate is true
        if (currentPlayersJSON !== newPlayersJSON) {
            this.playerListManager.setPlayers(playersData);  // Update the player list with the new data
            this.addEditListeners();  // Add listeners for edit buttons
            this.updateAddPlayerButton();
        }
    }
    

    // Logic to show or hide the Add Player button based on player limits
    updateAddPlayerButton() {
        if (!this.client.settings) {
            return; //Settings not initialized yet, nothing to do
        }
        const playerLimitPerPeer = this.client.settings.playerLimitPerPeer;  // Get the player limit per peer from client settings
        const totalPlayerLimit = this.client.settings.playerLimit;  // Get the total player limit from client settings
        const ownedPlayers = this.client.ownedPlayers;  // Get the owned players from the client
        const allPlayers = this.client.allPlayers;  // Get the total list of players

        // Check if the current peer has reached its limit or if the total player limit has been reached
        if (ownedPlayers.length < playerLimitPerPeer && allPlayers.length < totalPlayerLimit) {
            this.addPlayerButton.style.display = 'block';  // Show the "Add Player" button
        } else {
            this.addPlayerButton.style.display = 'none';  // Hide the "Add Player" button
        }
        this.updatePieces(true); //Need to update piece location when UI changes
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
                this.client.ownedPlayers.nickname = newName;
                this.client.conn.send({
                    type: 'nameChange',
                    playerId: playerId,
                    newName,
                });
            }
        }
    }

    // Handle the "Add Player" button click
    addPlayer() {
        const newName = prompt('Enter a new player name:');
        if (newName && newName.trim() !== "") {
            // Call the client method to add a new owned player
            this.client.addNewOwnedPlayer(newName.trim());
        }
    }
    

    removePlayer(playerId) {
        const playerIndex = this.client.ownedPlayers.findIndex((p) => p.playerId === playerId);
    
        if (playerIndex !== -1) {
            // Check if this is the only player left
            if (this.client.ownedPlayers.length === 1) {
                // If only one player left, leave the game
                alert('You have removed your last player. Leaving the game.');
                this.leaveGame(); // Define this method to handle the player leaving the game
            } else {
                // Remove the player from the list of owned players
                this.client.ownedPlayers.splice(playerIndex, 1);
    
                // Notify the host to update the players list
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

    handleConnectionError() {
        // Re-enable the startJoinButton to allow retrying
        this.startJoinButton.disabled = false;

        // Hide loading indicator and show join page again
        this.hideLoadingPage();
        this.showJoinPage();

        alert('The lobby does not exist or the connection failed. Please try again.');
    }

    updateDisplayedSettings() {
        if (this.playerLimitPerPeerDisplay) {
            this.playerLimitPerPeerDisplay.textContent = this.client.settings.playerLimitPerPeer;
        }
        if (this.totalPlayerLimitDisplay) {
            this.totalPlayerLimitDisplay.textContent = this.client.settings.playerLimit;
        }
        this.updateAddPlayerButton();
    }
}
