// controllers/SettingsManager.js

import Settings from '../../models/Settings';

export default class SettingsManager {
    constructor(isHost = false) {
        this.isHost = isHost; // Boolean indicating if this manager is for the host or client
        this.currentSettings = null; // Deep copy of the current settings
        this.settingsElements = this.initializeInputs(); // Setup the input or display elements
    }

    /**
     * Initializes the settings manager by creating a deep copy of the settings from the game state.
     * @param {GameState} gameState - The initial game state to copy settings from.
     */
    initializeSettings(gameState) {
        this.currentSettings = Settings.fromJSON(gameState.settings.toJSON());
        this.syncUIWithSettings(this.currentSettings);
    }

    /**
     * Initializes input or display elements based on whether this is a host or client.
     * @returns {Object} An object containing references to the relevant elements.
     */
    initializeInputs() {
        if (this.isHost) {
            // Return host-specific input elements
            return {
                playerLimitPerPeerInput: document.getElementById('playerLimitPerPeerHost'),
                totalPlayerLimitInput: document.getElementById('totalPlayerLimitHost'),
                turnTimerInput: document.getElementById('turnTimerHost'),
                moveDelayInput: document.getElementById('moveDelayHost')
            };
        } else {
            // Return client-specific display elements
            return {
                playerLimitPerPeerDisplay: document.getElementById('playerLimitPerPeerDisplayClient'),
                totalPlayerLimitDisplay: document.getElementById('totalPlayerLimitDisplayClient'),
                turnTimerDisplay: document.getElementById('turnTimerClient'),
                moveDelayDisplay: document.getElementById('moveDelayClient')
            };
        }
    }

    /**
     * Provides access to the input or display elements for external use.
     * @returns {Object} An object containing references to the relevant input or display elements.
     */
    getSettingsElements() {
        return this.settingsElements;
    }

    /**
     * Updates the settings based on the latest game state for both host and client.
     * @param {GameState} gameState - The updated game state with new settings.
     */
    updateSettings(gameState) {
        this.currentSettings = Settings.fromJSON(gameState.settings.toJSON()); // Deep copy new settings
        this.syncUIWithSettings(this.currentSettings); // Update the UI
    }

    /**
     * Checks if the current settings differ from the settings in the game state.
     * @param {Settings} newSettings - The settings object from the latest game state.
     * @returns {boolean} - Returns true if the settings have changed, false otherwise.
     */
    shouldUpdateSettings(newSettings) {
        if (!this.currentSettings) {
            return true; // Need to update if no settings present
        }
        return JSON.stringify(this.currentSettings) !== JSON.stringify(newSettings);
    }

    /**
     * Synchronizes the UI input or display fields with the settings values.
     * @param {Settings} settings - The settings object to synchronize with the UI.
     */
    syncUIWithSettings(settings) {
        const elements = this.settingsElements;
        if (this.isHost) {
            // Update host input fields
            if (elements.playerLimitPerPeerInput) elements.playerLimitPerPeerInput.value = settings.playerLimitPerPeer;
            if (elements.totalPlayerLimitInput) elements.totalPlayerLimitInput.value = settings.playerLimit;
            if (elements.turnTimerInput) elements.turnTimerInput.value = settings.turnTimer;
            if (elements.moveDelayInput) elements.moveDelayInput.value = settings.moveDelay;
        } else {
            // Update client display fields
            if (elements.playerLimitPerPeerDisplay) elements.playerLimitPerPeerDisplay.textContent = settings.playerLimitPerPeer;
            if (elements.totalPlayerLimitDisplay) elements.totalPlayerLimitDisplay.textContent = settings.playerLimit;
            if (elements.turnTimerDisplay) elements.turnTimerDisplay.textContent = settings.turnTimer;
            if (elements.moveDelayDisplay) elements.moveDelayDisplay.textContent = settings.moveDelay;
        }
    }

    /**
     * Updates the game state with settings values from the HTML inputs (for host).
     * @param {GameState} gameState - The game state to update with new settings.
     * @returns {GameState} - The updated game state.
     */
    updateGameStateFromInputs(gameState) {
        if (!this.isHost || !gameState) return gameState; // Only update for host

        const elements = this.settingsElements;

        // Clamp values and update settings from the input fields
        const newPlayerLimitPerPeer = this.clampValue(
            parseInt(elements.playerLimitPerPeerInput.value, 10),
            elements.playerLimitPerPeerInput.min,
            elements.playerLimitPerPeerInput.max
        );
        const newTotalPlayerLimit = this.clampValue(
            parseInt(elements.totalPlayerLimitInput.value, 10),
            elements.totalPlayerLimitInput.min,
            elements.totalPlayerLimitInput.max
        );
        const newTurnTimer = this.clampValue(
            parseInt(elements.turnTimerInput.value, 10),
            elements.turnTimerInput.min,
            elements.turnTimerInput.max
        );
        const newMoveDelay = this.clampValue(
            parseInt(elements.moveDelayInput.value, 10),
            elements.moveDelayInput.min,
            elements.moveDelayInput.max
        );

        // Update the current settings
        this.currentSettings.playerLimitPerPeer = newPlayerLimitPerPeer;
        this.currentSettings.playerLimit = newTotalPlayerLimit;
        this.currentSettings.turnTimer = newTurnTimer;
        this.currentSettings.moveDelay = newMoveDelay;

        //Sync the UI (fixes if the settings were set too high or low)
        this.syncUIWithSettings(this.currentSettings);

        // Update the game state's settings
        gameState.settings = Settings.fromJSON(this.currentSettings.toJSON());

        console.log("gamestaet from inputs: ", gameState);
        return gameState;
    }

    /**
     * Clamps a value to be within a specified range.
     * @param {number} value - The value to clamp.
     * @param {number} min - The minimum allowable value.
     * @param {number} max - The maximum allowable value.
     * @returns {number} - The clamped value.
     */
    clampValue(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}
