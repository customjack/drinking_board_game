// Settings.js
export default class Settings {
    /**
     * Constructs a new Settings instance.
     * @param {number} playerLimitPerPeer - Limit on the number of players per peer.
     * @param {number} playerLimit - Limit on the total number of players.
     * @param {number} turnTimer - The maximum time allowed for each turn (in seconds).
     * @param {number} moveDelay - The delay between each move (in milliseconds).
     */
    constructor(playerLimitPerPeer = 1, playerLimit = 8, turnTimer = 150, moveDelay = 300) {
        this.playerLimitPerPeer = playerLimitPerPeer; // Limit the number of players per peer
        this.playerLimit = playerLimit; // Limit the number of total players
        this.turnTimer = turnTimer; // Time limit for each player's turn in seconds
        this.moveDelay = moveDelay; // Delay between individual player moves in milliseconds
    }

    /**
     * Method to return the settings in an object format.
     * @returns {Object} The settings serialized as an object.
     */
    toJSON() {
        return {
            playerLimitPerPeer: this.playerLimitPerPeer,
            playerLimit: this.playerLimit,
            turnTimer: this.turnTimer,
            moveDelay: this.moveDelay,
        };
    }

    /**
     * Static method to create a Settings object from a JSON object.
     * @param {Object} json - The JSON object containing the settings data.
     * @returns {Settings} A new Settings instance.
     */
    static fromJSON(json) {
        return new Settings(json.playerLimitPerPeer, json.playerLimit, json.turnTimer, json.moveDelay);
    }

    /**
     * Sets the turn timer for each player's turn.
     * @param {number} seconds - The new time limit for each turn in seconds.
     */
    setTurnTimer(seconds) {
        this.turnTimer = seconds;
    }

    /**
     * Gets the current turn timer setting.
     * @returns {number} The time limit for each turn in seconds.
     */
    getTurnTimer() {
        return this.turnTimer;
    }

    /**
     * Sets the move delay between individual player moves.
     * @param {number} milliseconds - The new move delay in milliseconds.
     */
    setMoveDelay(milliseconds) {
        this.moveDelay = milliseconds;
    }

    /**
     * Gets the current move delay setting.
     * @returns {number} The delay between individual player moves in milliseconds.
     */
    getMoveDelay() {
        return this.moveDelay;
    }
}
