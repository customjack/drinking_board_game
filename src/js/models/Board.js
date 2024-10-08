import Space from './Space';

export default class Board {
    constructor(spaces = []) {
        this.spaces = spaces;
    }

    // Add space to board
    addSpace(space) {
        this.spaces.push(space);
    }

    // Get a space by its id (this is the correct approach)
    getSpace(id) {
        return this.spaces.find(space => space.id === id);
    }

    // Serialize the board to JSON
    toJSON() {
        return {
            spaces: this.spaces.map(space => space.toJSON())  // Ensure 'spaces' key is included
        };
    }

    // First pass: Deserialize the board without connections
    static fromJSON(json) {
        const spaces = json.spaces.map(spaceData => Space.fromJSON(spaceData));

        // Second pass: Resolve connections between spaces
        Space.resolveConnections(spaces, json.spaces);

        return new Board(spaces);
    }
}
