export default class Space {
    constructor(id, name, type, actions, visualDetails, connections = []) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.actions = actions; // List of actions, each with a trigger
        this.visualDetails = visualDetails; // Holds x, y, size, and color
        this.connections = connections; // Connections (directed graph)
    }

    // Add connection to another space
    addConnection(targetSpace, condition = null, drawConnection = true) {
        this.connections.push({
            target: targetSpace,
            condition: condition,
            drawConnection: drawConnection
        });
    }

    // Serialize this space to JSON
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            actions: this.actions,
            connections: this.connections.map(conn => ({
                targetId: conn.target.id,
                condition: conn.condition,
                drawConnection: conn.drawConnection // Ensure drawConnection is included in serialization
            })),
            visualDetails: this.visualDetails
        };
    }

    // First pass: Deserialize spaces without resolving connections
    static fromJSON(json) {
        return new Space(
            json.id,
            json.name,
            json.type,
            json.actions,
            json.visualDetails,
            json.connections.map(conn => ({
                targetId: conn.targetId,   // Temporarily store the targetId, will resolve later
                condition: conn.condition,
                drawConnection: conn.drawConnection !== undefined ? conn.drawConnection : true // Default drawConnection to true if undefined
            }))
        );
    }

    // Second pass: Resolve connections between spaces
    static resolveConnections(spaces, json) {
        spaces.forEach(space => {
            space.connections = json
                .find(s => s.id === space.id)
                .connections.map(conn => ({
                    target: spaces.find(targetSpace => targetSpace.id === conn.targetId),
                    condition: conn.condition,
                    drawConnection: conn.drawConnection !== undefined ? conn.drawConnection : true // Carry over drawConnection in resolution
                }));
        });
    }
}
