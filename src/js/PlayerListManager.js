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
        this.players.push(player);
        this.updatePlayerListUI();
    }

    // Set the entire players array at once (for syncing with server or game state)
    setPlayers(newPlayers) {
        this.players = newPlayers;
        this.updatePlayerListUI();
    }

    // Remove a player from the list
    removePlayer(peerId) {
        this.players = this.players.filter(player => player.peerId !== peerId);
        this.updatePlayerListUI();
    }

    // Update player name
    updatePlayerName(peerId, newName) {
        const player = this.players.find(p => p.peerId === peerId);
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

        // Add player name and badges (Host, You)
        let nameHtml = `<span>${player.nickname}</span>`;
        if (player.peerId === this.hostPeerId) {
            nameHtml += `<span class="host-badge">Host</span>`;
        }
        if (player.peerId === this.currentPlayerPeerId) {
            nameHtml += `<span class="you-badge">You</span>`;
        }

        playerNameBadges.innerHTML = nameHtml;

        const playerButtons = document.createElement('div');
        playerButtons.className = 'player-buttons';

        // Add edit button for the current player (either host or client)
        if (player.peerId === this.currentPlayerPeerId) {
            const editButton = document.createElement('button');
            editButton.className = 'edit-button';
            editButton.textContent = '✏️';
            editButton.setAttribute('data-peerid', player.peerId);
            playerButtons.appendChild(editButton);
        }

        // If the current user is the host, add a kick button for other players
        if (this.isHost && player.peerId !== this.hostPeerId) {
            const kickButton = document.createElement('button');
            kickButton.className = 'kick-button';
            kickButton.textContent = '❌';
            kickButton.setAttribute('data-peerid', player.peerId);
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
