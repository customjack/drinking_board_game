import Piece from './Piece';

export default class PieceManager {
    constructor() {
        this.pieces = [];  // Array of active pieces
    }

    /**
     * Updates the pieces based on the latest game state.
     * @param {GameState} gameState - The updated game state.
     */
    updatePieces(gameState) {
        // Step 1: Remove any pieces that are no longer in the game state
        this.removePieces(gameState);

        // Step 2: Add new pieces for players in the game state
        this.addPieces(gameState);

        // Step 3: Determine how many players are on each space
        const playersPerSpace = this.getPlayersPerSpace(gameState);

        // Step 4: Render each piece based on the game state
        this.renderAllPieces(playersPerSpace);
    }

    /**
     * Returns an array of players currently managed by pieces.
     * @returns {Array} Array of player objects.
     */
    getPlayers() {
        return this.pieces.map(piece => piece.player);
    }

    /**
     * Removes pieces whose playerIds are no longer in the game state.
     * @param {GameState} gameState - The current game state.
     */
    removePieces(gameState) {
        const playerIds = gameState.players.map(player => player.playerId);
        
        this.pieces = this.pieces.filter(piece => {
            if (!playerIds.includes(piece.player.playerId)) {
                piece.remove();  // Remove piece from the board
                return false;    // Filter it out of the array
            }
            return true;
        });
    }

    /**
     * Adds pieces for players that don't already have one.
     * @param {GameState} gameState - The current game state.
     */
    addPieces(gameState) {
        gameState.players.forEach(player => {
            const existingPiece = this.pieces.find(p => p.player.playerId === player.playerId);
            if (!existingPiece) {
                const newPiece = new Piece(player);
                this.pieces.push(newPiece);
            }
        });
    }

    /**
     * Determines how many players are on each space.
     * @param {GameState} gameState - The current game state.
     * @returns {Object} An object mapping spaceId to an array of playerIds on that space.
     */
    getPlayersPerSpace(gameState) {
        const playersPerSpace = {};
        gameState.players.forEach(player => {
            const spaceId = player.currentSpaceId;
            if (!playersPerSpace[spaceId]) {
                playersPerSpace[spaceId] = [];
            }
            playersPerSpace[spaceId].push(player.playerId);
        });
        return playersPerSpace;
    }

    /**
     * Renders all pieces based on the current players' positions.
     * @param {Object} playersPerSpace - An object mapping spaceId to an array of playerIds on that space.
     */
    renderAllPieces(playersPerSpace) {
        this.pieces.forEach(piece => {
            const spaceId = piece.player.currentSpaceId;
            const spaceElement = document.getElementById(`space-${spaceId}`);  // Get space element from the DOM

            if (spaceElement) {
                // Get the list of playerIds on this space
                const playersOnSpace = playersPerSpace[spaceId];
                const totalPiecesAtSpace = playersOnSpace.length;
                const indexAtSpace = playersOnSpace.indexOf(piece.player.playerId);  // Get the index of this player at the space

                // Call the piece's render function, passing the spaceElement and index information
                piece.render(spaceElement, totalPiecesAtSpace, indexAtSpace);
            }
        });
    }
}
