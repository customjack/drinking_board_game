// Piece.js

export default class Piece {
    constructor(player, startingSpace, gameId) {
        this.player = player;
        this.space = startingSpace;
        this.gameId = gameId;
        this.element = null;
    }

    /**
     * Renders the piece on the board.
     * @param {HTMLElement} boardContainer - The container where the piece will be rendered
     */
    renderPiece(boardContainer) {
        this.element = document.createElement('div');
        this.element.classList.add('piece');
        this.element.innerText = this.player.nickname.charAt(0).toUpperCase(); // Display the first letter of the player's name

        // Style the piece
        this.element.style.position = 'absolute';
        this.element.style.left = `${this.space.visualDetails.x - 15}px`; // Adjust for piece size
        this.element.style.top = `${this.space.visualDetails.y - 15}px`; // Adjust for piece size
        this.element.style.width = '30px';
        this.element.style.height = '30px';
        this.element.style.backgroundColor = this.player.isHost ? '#ff0000' : '#0000ff'; // Red for host, blue for others
        this.element.style.borderRadius = '50%';
        this.element.style.textAlign = 'center';
        this.element.style.color = '#fff';
        this.element.style.lineHeight = '30px';
        this.element.style.zIndex = '3'; // Ensure it's above the board

        // Add data attribute for space ID
        this.element.dataset.spaceId = `space-${this.space.id}`;

        // Optional: Add a click listener for piece interactions
        this.element.addEventListener('click', () => this.handlePieceClick());

        // Append to the board container
        boardContainer.appendChild(this.element);
    }

    /**
     * Moves the piece to a new space.
     * @param {Space} newSpace - The new space object
     */
    moveTo(newSpace) {
        this.space = newSpace;
        this.element.style.left = `${newSpace.visualDetails.x - 15}px`;
        this.element.style.top = `${newSpace.visualDetails.y - 15}px`;
        this.element.dataset.spaceId = `space-${newSpace.id}`;
    }

    /**
     * Removes the piece from the board.
     */
    remove() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    /**
     * Handles click interactions on the piece.
     */
    handlePieceClick() {
        console.log(`Piece clicked: ${this.player.nickname}`);
        // Add logic here for what happens when a piece is clicked (e.g., show player info)
    }
}
