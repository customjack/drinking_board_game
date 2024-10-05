import { v4 as uuidv4 } from 'uuid';
import ColorAssigner from '../utils/ColorAssigner';  // Import the ColorAssigner class
import RollEngine from '../utils/RollEngine';        // Import the RollEngine class

export default class Player {
    /**
     * Constructs a new Player instance.
     * @param {string} peerId - The unique identifier for the client's connection.
     * @param {string} nickname - The display name of the player.
     * @param {boolean} [isHost=false] - Indicates if the player is the host.
     * @param {string} [playerId] - Optional unique player ID. If not provided, it will be generated.
     */
    constructor(peerId, nickname, isHost = false, playerId = null) {
        this.peerId = peerId;
        this.nickname = nickname;
        this.isHost = isHost;
        this.stats = {};
        this.playerId = playerId || this.generatePlayerId(); // Unique player ID

        // Default to space 1 at the start
        this.currentSpaceId = 1;  // The space the player is currently on

        // Initialize player and peer colors
        this.playerColor = (new ColorAssigner()).assignColor(this.playerId);  // Assign a unique color using ColorAssigner based on playerId
        this.peerColor   = (new ColorAssigner()).assignColor(this.peerId);    // Assign a unique color using ColorAssigner based on peerId

        // Initialize RollEngine with a seed based on the player's unique ID
        this.rollEngine = new RollEngine(this.generateSeedFromId(this.playerId));

        // Track the number of turns the player has taken
        this.turnsTaken = 0;  // New attribute for tracking turns taken
    }

    /**
     * Generates a unique player ID using UUID.
     * @returns {string} A unique player ID.
     */
    generatePlayerId() {
        const id = uuidv4();
        console.log("Generated new Player with ID: ", id);
        console.log("Player attached to client: ", this.peerId);
        return id; // Generates a UUID v4
    }

    /**
     * Generate a seed from the playerId to ensure consistent rolls across sessions.
     * @param {string} playerId - The player's unique ID.
     * @returns {number} A number derived from the playerId for seeding the RNG.
     */
    generateSeedFromId(playerId) {
        return playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    }

    /**
     * Rolls the dice for the player using their roll engine.
     * @param {number} min - The minimum roll value (inclusive).
     * @param {number} max - The maximum roll value (inclusive).
     * @param {Function} [distributionFn] - Optional custom distribution function.
     * @returns {number} The result of the roll.
     */
    rollDice(min = 1, max = 6, distributionFn = null) {
        return this.rollEngine.roll(min, max, distributionFn);
    }

    /**
     * Resets the player's roll engine to the original seed.
     */
    resetRollEngine() {
        this.rollEngine.resetSeed();
    }

    /**
     * Sets a new seed in the roll engine, useful for applying custom game effects.
     * @param {number} newSeed - The new seed to apply.
     */
    setRollEngineSeed(newSeed) {
        this.rollEngine.setSeed(newSeed);
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
     * Sets a stat to a specific value.
     * @param {string} statName - The name of the stat.
     * @param {number} value - The value to set for the stat.
     */
    setStat(statName, value) {
        this.stats[statName] = value;
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
     * Removes a stat from the player’s stats.
     * @param {string} statName - The name of the stat to remove.
     */
    removeStat(statName) {
        if (this.stats[statName]) {
            delete this.stats[statName];
        } else {
            console.error(`Stat "${statName}" does not exist.`);
        }
    }

    /**
     * Sets the player's current space ID.
     * @param {number} spaceId - The ID of the space the player is moving to.
     */
    setCurrentSpaceId(spaceId) {
        this.currentSpaceId = spaceId;
    }

    /**
     * Retrieves the player's current space ID.
     * @returns {number} The current space ID of the player.
     */
    getCurrentSpaceId() {
        return this.currentSpaceId;
    }

    /**
     * Increment the number of turns taken by the player.
     */
    incrementTurnsTaken() {
        this.turnsTaken += 1;
    }

    /**
     * Sets the number of turns taken by the player. Takes a copy of the passed value.
     * @param {number} turns - The number of turns to set.
     */
    setTurnsTaken(turns) {
        this.turnsTaken = Number(turns); // Convert to number to ensure it's a copy, not a reference
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
            playerId: this.playerId,
            currentSpaceId: this.currentSpaceId,
            rollEngine: this.rollEngine.toJSON(),  // Serialize the RollEngine
            turnsTaken: this.turnsTaken            // Serialize the number of turns taken
        };
    }

    /**
     * Deserializes player data from JSON.
     * @param {Object} json - The JSON object containing player data.
     * @returns {Player} A new Player instance.
     */
    static fromJSON(json) {
        const player = new Player(json.peerId, json.nickname, json.isHost, json.playerId);
        player.stats = json.stats;
        player.currentSpaceId = json.currentSpaceId;
        player.rollEngine = RollEngine.fromJSON(json.rollEngine);  // Rebuild the RollEngine from JSON
        player.turnsTaken = json.turnsTaken;  // Rebuild the turns taken
        return player;
    }
}
