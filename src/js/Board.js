import Space from './Space';

export default class Board {
    constructor(spaces = []) {
        this.spaces = spaces;
    }

    // Add space to board
    addSpace(space) {
        this.spaces.push(space);
    }

    // Get a space by its position or id
    getSpace(position) {
        return this.spaces.find(space => space.position === position);
    }

    // Serialize the board to JSON
    toJSON() {
        return this.spaces.map(space => space.toJSON());
    }

    // First pass: Deserialize the board without connections
    static fromJSON(json) {
        const spaces = json.spaces.map(spaceData => Space.fromJSON(spaceData));

        // Second pass: Resolve connections between spaces
        Space.resolveConnections(spaces, json.spaces);

        return new Board(spaces);
    }

    // Method to draw the board and its connections
    draw(ctx) {
        // First, draw all connections between spaces
        this.spaces.forEach(space => {
            space.connections.forEach(conn => {
                ctx.beginPath();
                ctx.moveTo(space.x, space.y);
                ctx.lineTo(conn.target.x, conn.target.y);
                ctx.strokeStyle = '#000';
                ctx.stroke();
            });
        });

        // Then, draw all the spaces
        this.spaces.forEach(space => space.draw(ctx));
    }
}
