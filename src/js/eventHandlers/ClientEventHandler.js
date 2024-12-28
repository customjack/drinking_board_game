import BaseEventHandler from './BaseEventHandler';
import Client from '../networking/Client';
import GameEngine from '../controllers/GameEngine';

export default class ClientEventHandler extends BaseEventHandler {
    constructor(registryManager,pluginManager,factoryManager, eventBus) {
        super(false, registryManager,pluginManager,factoryManager, eventBus);
    }

    init() {
        super.init();
        this.showPage("joinPage");
    }

    setupEventListeners() {
        super.setupEventListeners();

        // Register listeners via ListenerRegistry
        this.listenerRegistry.registerListener('startJoinButton', 'click', () => this.startJoinGame());
        this.listenerRegistry.registerListener('copyInviteCodeButton', 'click', () => this.copyInviteCode());
        this.listenerRegistry.registerListener('leaveGameButton', 'click', () => this.leaveGame());
        this.listenerRegistry.registerListener('addPlayerButton', 'click', () => this.addNewOwnedPlayer());
    }

    async startJoinGame() {
        const playerNameInput = document.getElementById('joinNameInput');
        const gameCodeInput = document.getElementById('joinCodeInput');

        const playerName = playerNameInput.value.trim();
        const gameCode = gameCodeInput.value.trim();

        if (!playerName || !gameCode) {
            alert('Please enter your name and a valid game code.');
            return;
        }

        document.getElementById('startJoinButton').disabled = true;
        this.showPage("loadingPage");

        this.peer = new Client(playerName, gameCode, this);
        await this.peer.init();
        this.pluginManager.setPeer(this.peer.peer); //This isn't pretty but it passes the PeerJS instance

        this.gameEngine = new GameEngine(
            this.peer.gameState,
            this.peer.peer.id,
            (proposedGameState) => this.peer.proposeGameState(proposedGameState),
            this.eventBus,
            this.registryManager,
            this.factoryManager,
            false  // isHost = false
        );
        this.gameEngine.init();

        this.showLobbyPage();
    }

    displayLobbyControls() {
        const leaveGameButton = document.getElementById('leaveGameButton');
        const settingsSection = document.getElementById('settingsSectionClient');

        // Show or hide buttons based on conditions, e.g., game state or player limits
        if (leaveGameButton) leaveGameButton.style.display = 'inline';
        if (settingsSection) settingsSection.style.display = 'inline';

        // Conditionally show or hide the "Add Player" button
        this.updateAddPlayerButton();
    }

    showGamePage() {
        console.log('Client is switching to game page...');
        this.showPage("gamePage");
        this.playerListManager.setListElement(document.getElementById('gamePlayerList'));
        this.boardManager.setBoardContainer(document.getElementById('gameBoardContent'));

        this.updateGameState(true); //force update
    }

    showLobbyPage() {
        this.showPage("lobbyPage");

        this.displayLobbyControls();

        this.updateGameState(true); //force update
    }

    updateDisplayedSettings() {
        if (this.playerLimitPerPeerDisplay) {
            this.playerLimitPerPeerDisplay.textContent = this.client.settings.playerLimitPerPeer;
        }
        if (this.totalPlayerLimitDisplay) {
            this.totalPlayerLimitDisplay.textContent = this.client.settings.playerLimit;
        }
        if (this.turnTimerDisplay) {
            this.turnTimerDisplay.textContent = this.client.settings.turnTimer;
        }
        if (this.moveDelayDisplay) {
            this.moveDelayDisplay.textContent = this.client.settings.moveDelay;
        }
        this.updateAddPlayerButton();
    }

    addPlayerListListeners() { 
        // Register click listener for edit buttons
        document.querySelectorAll('.edit-button').forEach((button) => {
            const playerId = button.getAttribute('data-playerId');
            this.listenerRegistry.registerListener(button.id, 'click', () => {
                this.editPlayerName(playerId);
            });
        });
    
        // Register click listener for remove buttons
        document.querySelectorAll('.remove-button').forEach((button) => {
            const playerId = button.getAttribute('data-playerId');
            this.listenerRegistry.registerListener(button.id, 'click', () => {
                this.removePlayer(playerId);
            });
        });
    }
    
    

    editPlayerName(playerId) {
        const player = this.peer.ownedPlayers.find((p) => p.playerId === playerId);
        if (player) {
            const newName = prompt('Enter new name:', player.nickname);
            if (newName) {
                player.nickname = newName;
                this.peer.conn.send({
                    type: 'nameChange',
                    playerId: playerId,
                    newName,
                });
            }
        }
    }

    addNewOwnedPlayer() {
        const newName = prompt('Enter a new player name:');
        if (newName && newName.trim() !== "") {
            this.peer.addNewOwnedPlayer(newName);
        }
    }
}
