import Plugin from '../pluginManagement/Plugin';

export default class ExamplePlugin extends Plugin {
    initialize(eventBus, registryManager, isHost) {
        // Plugin initialization logic
        console.log('Example Plugin initialized!', { eventBus, registryManager, isHost });

        // Listen for game state updates
        eventBus.on('settingsUpdated', this.handleSettingsUpdate.bind(this));
        eventBus.on('boardUpdated', this.handleBoardUpdate.bind(this));
        eventBus.on('piecesUpdated', this.handlePiecesUpdate.bind(this));
        eventBus.on('playerListUpdated', this.handlePlayerListUpdate.bind(this));
        eventBus.on('gameStateUpdated', this.handleGameStateUpdate.bind(this));
    }

    handleSettingsUpdate(data) {
        //console.log('Settings updated:', data.gamestate.settings);
    }

    handleBoardUpdate(data) {
        //console.log('Board updated:', data.gamestate.board);
    }

    handlePiecesUpdate(data) {
        //console.log('Pieces updated:', data.gamestate.players);
    }

    handlePlayerListUpdate(data) {
        //console.log('Player list updated:', data.gamestate.players);
    }

    handleGameStateUpdate(data) {
        //console.log('Game state updated:', data.gamestate);
    }

    cleanup() {
        // Optional cleanup logic when the plugin is removed
        console.log('Cleaning up ExamplePlugin...');
        // Unsubscribe from events to avoid memory leaks
        this.eventBus.off('settingsUpdated', this.handleSettingsUpdate.bind(this));
        this.eventBus.off('boardUpdated', this.handleBoardUpdate.bind(this));
        this.eventBus.off('piecesUpdated', this.handlePiecesUpdate.bind(this));
        this.eventBus.off('playerListUpdated', this.handlePlayerListUpdate.bind(this));
        this.eventBus.off('gameStateUpdated', this.handleGameStateUpdate.bind(this));
    }
}
