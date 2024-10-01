// Player.js

export default class Player {
    /**
     * Constructs a new Player instance.
     * @param {string} peerId - The unique identifier for the client's connection.
     * @param {string} nickname - The display name of the player.
     * @param {boolean} [isHost=false] - Indicates if the player is the host.
     * @param {string} [gameId] - Optional unique game ID. If not provided, it will be generated.
     */
    constructor(peerId, nickname, isHost = false, gameId = null) {
        this.peerId = peerId;
        this.nickname = nickname;
        this.isHost = isHost;
        this.stats = {}; // Replacing scores with stats
        this.gameId = gameId || this.generateGameId(); // Unique game ID
    }

    /**
     * Generates a unique game ID.
     * For simplicity, using current timestamp and a random number.
     * In production, consider using a UUID library for better uniqueness.
     * @returns {string} A unique game ID.
     */
    generateGameId() {
        return `game-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    /**
     * Dynamically updates or adds a stat.
     * @param {string} statName - The name of the stat.
     * @param {number} delta - The value to add to the stat.
     */
    updateStat(statName, delta) {
        if (!this.stats[statName]) {
            this.stats[statName] = 0;
        }
        this.stats[statName] += delta;
    }

    /**
     * Retrieves a player's stat.
     * @param {string} statName - The name of the stat.
     * @returns {number} The value of the stat.
     */
    getStat(statName) {
        return this.stats[statName] || 0;
    }

    /**
     * Serializes player data to JSON.
     * @returns {Object} The serialized player data.
     */
    toJSON() {
        return {
            peerId: this.peerId,
            nickname: this.nickname,
            isHost: this.isHost,
            stats: this.stats,
            gameId: this.gameId
        };
    }

    /**
     * Deserializes player data from JSON.
     * @param {Object} json - The JSON object containing player data.
     * @returns {Player} A new Player instance.
     */
    static fromJSON(json) {
        const player = new Player(json.peerId, json.nickname, json.isHost, json.gameId);
        player.stats = json.stats;
        return player;
    }
}
