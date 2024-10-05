import Player from './Player';

export default class PlayerListManager {
    constructor(defaultListElement, isHost, currentPlayerPeerId, hostPeerId) {
        this.listElement = defaultListElement; // DOM element for the current player list
        this.isHost = isHost; // Whether the current player is the host
        this.currentPlayerPeerId = currentPlayerPeerId; // The peer ID of the current player
        this.hostPeerId = hostPeerId; // The peer ID of the host
        this.players = []; // Array to store players
    }

    // Set the target list where the players should be drawn (e.g., lobby or game)
    setListElement(newListElement) {
        this.listElement = newListElement;
    }

    // Set whether the current user is the host
    setIsHost(isHost) {
        this.isHost = isHost;
    }

    // Add a player to the list
    addPlayer(player) {
        const playerCopy = Player.fromJSON(player.toJSON());  // Use the class methods to deep copy the player
        this.players.push(playerCopy);
        this.updatePlayerListUI();
    }

    setPlayers(newPlayers) {
        const playersCopy = newPlayers.map(player => Player.fromJSON(player.toJSON()));  // Deep copy using the class methods
        this.players = playersCopy;
        this.updatePlayerListUI();
    }

    // Remove a player from the list
    removePeer(peerId) {
        this.players = this.players.filter(player => player.peerId !== peerId);
        this.updatePlayerListUI();
    }

    removePlayer(playerId) {
        this.players = this.players.filter(player => player.playerId !== playerId);
        this.updatePlayerListUI();
    }

    // Update player name
    updatePlayerName(playerId, newName) {
        const player = this.players.find(p => p.playerId === playerId);
        if (player) {
            player.nickname = newName;
        }
        this.updatePlayerListUI();
    }

    // Update the player list UI
    updatePlayerListUI() {
        if (!this.listElement) return;
        this.clearPlayerListUI();

        // Render the player list in the currently active list element
        this.players.forEach(player => {
            const playerElement = this.createPlayerElement(player);
            this.listElement.appendChild(playerElement);
        });
    }

    // Create the player element for the UI
    createPlayerElement(player) {
        const li = document.createElement('li');
        li.className = 'player-container';

        const playerNameBadges = document.createElement('div');
        playerNameBadges.className = 'player-name-badges';

        // Get the assigned color for this player's peerId
        const playerColor = player.playerColor|| '#FFFFFF'; // Default to white if no color

        // Assign the same border color to all players with the same peerId
        const peerBorderColor = player.peerColor || '#FFFFFF'; // Default to white if no color

        // Add player name and badges (Host, You) with bold style
        let nameHtml = `<span style="color:${playerColor}; font-weight: bold;">${player.nickname}</span>`;
        if (player.peerId === this.hostPeerId) {
            nameHtml += `<span class="host-badge">Host</span>`;
        }
        if (player.peerId === this.currentPlayerPeerId) {
            nameHtml += `<span class="you-badge">You</span>`;
        }

        playerNameBadges.innerHTML = nameHtml;

        // Apply the shared border color based on peerId
        li.style.border = `2px solid ${peerBorderColor}`;

        const playerButtons = document.createElement('div');
        playerButtons.className = 'player-buttons';

        // Add edit button for the current player (either host or client)
        if (player.peerId === this.currentPlayerPeerId) {
            const editButton = document.createElement('button');
            editButton.className = 'edit-button';
            editButton.textContent = '✏️';
            editButton.setAttribute('data-playerId', player.playerId);
            playerButtons.appendChild(editButton);
        }

        // Add remove player button for the current player (either host or client)
        if (player.peerId === this.currentPlayerPeerId) {
            const kickButton = document.createElement('button');
            kickButton.className = 'remove-button';
            kickButton.textContent = '❌';
            kickButton.setAttribute('data-playerId', player.playerId);
            playerButtons.appendChild(kickButton);
        }

        // If the current user is the host, add a kick button for other players
        if (this.isHost && player.peerId !== this.hostPeerId) {
            const kickButton = document.createElement('button');
            kickButton.className = 'kick-button';
            kickButton.textContent = '❌';
            kickButton.setAttribute('data-playerId', player.playerId);
            playerButtons.appendChild(kickButton);
        }

        li.appendChild(playerNameBadges);
        li.appendChild(playerButtons);
        return li;
    }


    // Clear the player list UI
    clearPlayerListUI() {
        if (this.listElement) {
            this.listElement.innerHTML = '';
        }
    }

    // Get all players
    getPlayers() {
        return this.players;
    }
}
