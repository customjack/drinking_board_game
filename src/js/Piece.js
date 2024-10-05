export default class Piece {
    constructor(player) {
        this.player = player;
        this.element = null;  // DOM element representing the piece
    }

    /**
     * Renders the piece at the provided space element.
     * @param {HTMLElement} spaceElement - The DOM element of the space where the piece will be placed.
     * @param {number} totalPiecesAtSpace - Total number of pieces at this space.
     * @param {number} indexAtSpace - Index of this piece in the list of pieces at this space.
     */
    render(spaceElement, totalPiecesAtSpace, indexAtSpace) {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.classList.add('piece');
            this.element.innerText = this.player.nickname.charAt(0).toUpperCase(); // Display first letter of player's name

            // Style the piece
            this.element.style.position = 'absolute';
            this.element.style.width = '30px';
            this.element.style.height = '30px';
            this.element.style.backgroundColor = this.player.playerColor; // Uses player color for piece color
            this.element.style.borderRadius = '50%';
            this.element.style.textAlign = 'center';
            this.element.style.color = '#000';
            this.element.style.lineHeight = '30px';
            this.element.style.zIndex = '3'; // Ensure it's above the board
            this.element.style.opacity = '0.70';  // Set transparency (0.6 = 60% opaque)

            // Add click listener for piece interactions
            this.element.addEventListener('click', () => this.handlePieceClick());
        }

        // Position the piece on the space element
        const rect = spaceElement.getBoundingClientRect();
        const centerX = rect.left + window.scrollX + rect.width / 2;
        const centerY = rect.top + window.scrollY + rect.height / 2;

        // Calculate offset based on totalPiecesAtSpace and indexAtSpace
        let offsetX = 0;
        let offsetY = 0;

        if (totalPiecesAtSpace > 1) {
            const radius = 10; // Adjust radius as needed
            const angle = (2 * Math.PI) * (indexAtSpace / totalPiecesAtSpace);
            offsetX = radius * Math.cos(angle);
            offsetY = radius * Math.sin(angle);
        }

        const final_position_X = centerX + offsetX - 15;
        const final_position_Y = centerY + offsetY - 15;
        this.element.style.left = `${final_position_X}px`;
        this.element.style.top = `${final_position_Y}px`;

        // Append to the document body if not already appended
        if (!this.element.parentElement) {
            document.body.appendChild(this.element);
        }
        
    }

    /**
     * Handles click interactions on the piece.
     */
    handlePieceClick() {
        console.log(`Piece clicked: ${this.player.nickname}`);
        // Add logic here for interactions, like displaying player info
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
}
