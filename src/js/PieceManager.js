// PieceManager.js

import Piece from './Piece.js';

export default class PieceManager {
    constructor(boardManager) {
        this.boardManager = boardManager;
        this.pieces = {}; // Map of gameId to Piece instances
        this.gameIdCounter = 0; // To generate unique gameIds
    }

    /**
     * Generates a unique gameId for each piece.
     * @returns {string} Unique gameId
     */
    generateGameId() {
        return `gameId-${this.gameIdCounter++}`;
    }

    /**
     * Adds a new piece for a player on the board.
     * @param {Player} player - The player object
     */
    addPiece(player) {
        const startingSpace = this.boardManager.board.getSpace(player.position);
        if (!startingSpace) {
            console.error(`Starting space with ID ${player.position} not found for player ${player.id}`);
            return;
        }

        const gameId = this.generateGameId();
        const piece = new Piece(player, startingSpace, gameId);
        piece.renderPiece(this.boardManager.boardContainer);
        
        this.pieces[gameId] = piece;
    }

    /**
     * Moves a player's piece to a new space.
     * @param {string} gameId - The unique gameId of the piece
     * @param {string} newSpaceId - The ID of the new space
     */
    movePiece(gameId, newSpaceId) {
        const piece = this.pieces[gameId];
        if (!piece) {
            console.error(`Piece with gameId ${gameId} not found.`);
            return;
        }

        const newSpace = this.boardManager.board.getSpace(newSpaceId);
        if (!newSpace) {
            console.error(`New space with ID ${newSpaceId} not found.`);
            return;
        }

        piece.moveTo(newSpace);
    }

    /**
     * Removes a player's piece from the board.
     * @param {string} gameId - The unique gameId of the piece
     */
    removePiece(gameId) {
        const piece = this.pieces[gameId];
        if (piece) {
            piece.remove();
            delete this.pieces[gameId];
        } else {
            console.error(`Piece with gameId ${gameId} not found.`);
        }
    }

    /**
     * Retrieves a piece by player ID.
     * @param {string} playerId - The ID of the player
     * @returns {Piece|null} The corresponding piece or null if not found
     */
    getPieceByPlayerId(playerId) {
        for (const gameId in this.pieces) {
            if (this.pieces[gameId].player.id === playerId) {
                return this.pieces[gameId];
            }
        }
        return null;
    }
}
