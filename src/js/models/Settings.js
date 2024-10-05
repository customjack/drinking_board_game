//Settings.js
export default class Settings {
    constructor(playerLimitPerPeer, playerLimit) {
        this.playerLimitPerPeer = playerLimitPerPeer; // Limit the number of players per peer
        this.playerLimit = playerLimit; // Limit the number of total players
    }

    // Method to return the settings in an object format
    toJSON() {
        return {
            playerLimitPerPeer: this.playerLimitPerPeer,
            playerLimit: this.playerLimit,
        };
    }

    // Static method to create a Settings object from a JSON object
    static fromJSON(json) {
        return new Settings(json.playerLimitPerPeer, json.playerLimit);
    }
}
