export default class PlayerMoves {
    /**
     * Constructs a new PlayerMoves instance.
     * @param {number} spaceId - The ID of the space visited.
     * @param {number} remainingMoves - The number of moves remaining after this move.
     */
    constructor(spaceId, remainingMoves) {
        this.spaceId = spaceId;
        this.remainingMoves = remainingMoves;
    }

    /**
     * Serializes the PlayerMoves instance to JSON.
     * @returns {Object} The JSON representation of the move.
     */
    toJSON() {
        return {
            spaceId: this.spaceId,
            remainingMoves: this.remainingMoves
        };
    }

    /**
     * Creates a PlayerMoves instance from a JSON object.
     * @param {Object} json - The JSON object containing the move data.
     * @returns {PlayerMoves} A new PlayerMoves instance.
     */
    static fromJSON(json) {
        return new PlayerMoves(json.spaceId, json.remainingMoves);
    }
}
