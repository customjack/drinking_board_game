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
    addConnection(targetSpace, condition = null) {
        this.connections.push({
            target: targetSpace,
            condition: condition
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
                condition: conn.condition
            })),
            visualDetails: this.visualDetails // Use visualDetails
        };
    }

    // First pass: Deserialize spaces without resolving connections
    static fromJSON(json) {
        return new Space(
            json.id,
            json.name,
            json.type,
            json.actions,
            json.visualDetails, // Use visualDetails
            [] // Connections will be set in a second pass
        );
    }

    // Second pass: Resolve connections between spaces
    static resolveConnections(spaces, json) {
        spaces.forEach(space => {
            space.connections = json
                .find(s => s.id === space.id)
                .connections.map(conn => ({
                    target: spaces.find(targetSpace => targetSpace.id === conn.targetId),
                    condition: conn.condition
                }));
        });
    }
}
