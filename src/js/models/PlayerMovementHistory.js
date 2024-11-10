import PlayerMoves from './PlayerMoves';

export default class PlayerMovementHistory {
    constructor() {
        this.history = {};  // Each turn maps to a list of PlayerMoves instances
    }

    /**
     * Adds a move to the history for a specific turn.
     * @param {number} turn - The turn number.
     * @param {number} spaceId - The space ID of the move.
     * @param {number} remainingMoves - The number of moves remaining after this move.
     */
    addMove(turn, spaceId, remainingMoves) {
        if (!this.history[turn]) {
            this.history[turn] = [];
        }
        const move = new PlayerMoves(spaceId, remainingMoves);
        this.history[turn].push(move);
    }

    /**
     * Retrieves the movement history for a specific turn.
     * @param {number} turn - The turn number to retrieve history for.
     * @returns {Array<PlayerMoves>} The list of moves made during the specified turn.
     */
    getHistoryForTurn(turn) {
        return this.history[turn] || [];
    }

    /**
     * Retrieves the complete movement history.
     * @returns {Object} The entire history object, with turn numbers as keys and arrays of PlayerMoves as values.
     */
    getFullHistory() {
        return this.history;
    }

    /**
     * Serializes the PlayerMovementHistory instance to JSON.
     * @returns {Object} The JSON representation of the movement history.
     */
    toJSON() {
        return {
            history: Object.fromEntries(
                Object.entries(this.history).map(([turn, moves]) => [
                    turn,
                    moves.map(move => move.toJSON())
                ])
            )
        };
    }

    /**
     * Creates a PlayerMovementHistory instance from a JSON object.
     * @param {Object} json - The JSON object containing the movement history data.
     * @returns {PlayerMovementHistory} A new PlayerMovementHistory instance.
     */
    static fromJSON(json) {
        const movementHistory = new PlayerMovementHistory();
        movementHistory.history = Object.fromEntries(
            Object.entries(json.history || {}).map(([turn, moves]) => [
                turn,
                moves.map(moveJson => PlayerMoves.fromJSON(moveJson))
            ])
        );
        return movementHistory;
    }
}
