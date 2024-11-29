// BoardManager.js

import Board from '../../models/Board.js';

export default class BoardManager {
    constructor() {
        this.board = null;
        this.boardContainer = document.getElementById('lobbyBoardContent'); // Assuming a container div for the board
    }

    /**
     * Set the board with a new board instance, and handle board-related updates.
     * @param {Board} newBoard - The new board instance.
     */
    setBoard(newBoard) {
        // Use the Board's toJSON and fromJSON for deep copying
        const boardCopy = Board.fromJSON(newBoard.toJSON());
        this.board = boardCopy;
    }

    /**
     * Determines if the board needs to be updated based on the game state.
     * @param {Board} newBoard - The board object from the latest game state.
     * @returns {boolean} - Returns true if the board should be updated, false otherwise.
     */
    shouldUpdateBoard(newBoard) {
        // Check if the current board and the new board are the same
        if (!this.board || JSON.stringify(this.board.toJSON()) !== JSON.stringify(newBoard.toJSON())) {
            return true; // Update required if there is no board or boards don't match
        }
        return false; // No update required if boards are the same
    }

    /**
     * Set the board container to a new DOM element.
     * @param {HTMLElement} containerElement - The new container element.
     */
    setBoardContainer(containerElement) {
        this.boardContainer = containerElement;
    }

    // Load the default board
    async loadDefaultBoard() {
        console.log("Attempting to load the default board...");
        try {
            const response = await fetch('assets/maps/defaultBoard.json');
            const boardData = await response.json();
            console.log("Default board data loaded:", boardData);

            // Create the Board object from JSON
            this.board = Board.fromJSON(boardData);
            console.log("Board object created:", this.board);

            this.drawBoard();
        } catch (error) {
            console.log(this.boardContainer);
            console.error("Error loading the default board:", error);
        }
    }

    /**
     * Load the board from a JSON file.
     * @param {File} file - The board file to load.
     */
    async loadBoardFromFile(file) {
        if (file && file.type === 'application/json') {
            const text = await this.readFile(file);
            const boardData = JSON.parse(text);
            const board = Board.fromJSON(boardData);
            this.setBoard(board);
            this.drawBoard();
            return board; // Return the loaded board if needed
        } else {
            throw new Error('File must be a valid JSON file.');
        }
    }
    
    // Read the file as text
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (event) => reject(new Error('Failed to read file.'));
            reader.readAsText(file);
        });
    }

    // Function to draw the board as HTML elements
    drawBoard() {
        // Clear the previous board
        this.boardContainer.innerHTML = '';

        // Remove any existing elements with the same IDs from the entire document
        this.board.spaces.forEach(space => {
            const spaceElementId = `space-${space.id}`;
            const existingElement = document.getElementById(spaceElementId);
            if (existingElement) {
                existingElement.parentNode.removeChild(existingElement);
            }
        });

        // Draw connections between spaces using HTML elements
        this.drawConnections();

        // Create HTML elements for each space
        this.board.spaces.forEach(space => {
            const spaceElement = document.createElement('div');
            spaceElement.classList.add('board-space');
            spaceElement.id = `space-${space.id}`; // Assign an ID to the space

            // Set the position and size based on visualDetails
            const { x = 0, y = 0, size = 60, color = '#000000', textColor = '#000000' } = space.visualDetails;
            spaceElement.style.position = 'absolute';
            spaceElement.style.left = `${x - size / 2}px`;  // Center the element horizontally
            spaceElement.style.top = `${y - size / 2}px`;   // Center the element vertically
            spaceElement.style.width = `${size}px`;
            spaceElement.style.height = `${size}px`;
            spaceElement.style.backgroundColor = color;
            spaceElement.style.borderRadius = '50%';  // Makes the element circular
            spaceElement.style.display = 'flex';
            spaceElement.style.alignItems = 'center';
            spaceElement.style.justifyContent = 'center';
            spaceElement.style.color = textColor;
            spaceElement.style.cursor = 'pointer';
            spaceElement.style.zIndex = "2";  // Make sure spaces are above the connections
            spaceElement.innerText = space.name;

            // Add a click listener for interaction
            spaceElement.addEventListener('click', () => this.handleSpaceClick(space));

            // Append the space to the board container
            this.boardContainer.appendChild(spaceElement);
        });
    }

    // Draw connections between spaces using HTML elements
    drawConnections() {
        // Keep track of drawn connections to avoid duplicates
        const drawnConnections = new Set();

        this.board.spaces.forEach(space => {
            space.connections.forEach(connection => {
                const targetSpace = connection.target;

                if (targetSpace && (connection.drawConnection === undefined || connection.drawConnection === true)) {
                    const connectionKey = `${Math.min(space.id, targetSpace.id)}-${Math.max(space.id, targetSpace.id)}`;

                    if (!drawnConnections.has(connectionKey)) {
                        const { x: startX, y: startY } = space.visualDetails;
                        const { x: endX, y: endY } = targetSpace.visualDetails;

                        // Check for bidirectional connection
                        const reverseConnection = targetSpace.connections.find(conn => conn.target.id === space.id);
                        const isBidirectional = !!reverseConnection;

                        if (isBidirectional) {
                            // Draw single line with two arrows
                            this.drawBidirectionalConnection(startX, startY, endX, endY);
                        } else {
                            // Draw a single directional connection
                            this.drawConnectionWithArrow(startX, startY, endX, endY);
                        }

                        drawnConnections.add(connectionKey);
                    }
                }
            });
        });
    }

    // Helper function to draw a single directional connection with an arrow
    drawConnectionWithArrow(x1, y1, x2, y2) {
        // Draw the line
        this.drawLine(x1, y1, x2, y2);

        // Draw the arrowhead at 2/3 along the line towards the target
        const arrowPos = this.getPointAlongLine(x1, y1, x2, y2, 0.5);
        this.drawArrowhead(arrowPos.x, arrowPos.y, x1, y1, x2, y2);
    }

    // Helper function to draw a bidirectional connection with two arrows
    drawBidirectionalConnection(x1, y1, x2, y2) {
        // Draw the line
        this.drawLine(x1, y1, x2, y2);

        // Draw the first arrowhead at 2/3 along the line towards the target
        const arrowPos1 = this.getPointAlongLine(x1, y1, x2, y2, 0.55);
        this.drawArrowhead(arrowPos1.x, arrowPos1.y, x1, y1, x2, y2);

        // Draw the second arrowhead at 2/3 along the line towards the start
        const arrowPos2 = this.getPointAlongLine(x2, y2, x1, y1, 0.55);
        this.drawArrowhead(arrowPos2.x, arrowPos2.y, x2, y2, x1, y1);
    }

    // Function to draw a line between two points using an HTML element
    drawLine(x1, y1, x2, y2) {
        const length = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

        const line = document.createElement('div');
        line.classList.add('connection-line');
        line.style.position = 'absolute';
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.width = `${length}px`;
        line.style.height = '2px'; // Line thickness
        line.style.backgroundColor = 'black';
        line.style.transformOrigin = '0 0';
        line.style.transform = `rotate(${angle}deg)`;
        line.style.zIndex = "1"; // Ensure lines are behind spaces

        this.boardContainer.appendChild(line);
    }

    // Function to draw an arrowhead at a given position
    drawArrowhead(x, y, x1, y1, x2, y2) {
        const angle = Math.atan2(y2 - y1, x2 - x1) - Math.PI/2;

        const arrowSize = 10; // Size of the arrowhead

        const arrow = document.createElement('div');
        arrow.classList.add('arrowhead');
        arrow.style.position = 'absolute';
        arrow.style.left = `${x - arrowSize / 2}px`;
        arrow.style.top = `${y - arrowSize / 2}px`;
        arrow.style.width = '0';
        arrow.style.height = '0';
        arrow.style.borderLeft = `${arrowSize / 2}px solid transparent`;
        arrow.style.borderRight = `${arrowSize / 2}px solid transparent`;
        arrow.style.borderTop = `${arrowSize}px solid black`;
        arrow.style.transform = `rotate(${angle}rad)`;
        arrow.style.transformOrigin = 'center center';
        arrow.style.zIndex = "1"; // Ensure arrows are behind spaces

        this.boardContainer.appendChild(arrow);
    }

    // Helper function to get a point along a line at a given percentage
    getPointAlongLine(x1, y1, x2, y2, percentage) {
        const x = x1 + (x2 - x1) * percentage;
        const y = y1 + (y2 - y1) * percentage;
        return { x, y };
    }

    // Handle space click interactions
    handleSpaceClick(space) {
        console.log(`Space clicked: ${space.name}, id: ${space.id}`);
        // Add logic here for what happens when a space is clicked (e.g., move player, highlight, etc.)
    }

    // Highlight specific spaces
    highlightSpaces(spaces) {
        spaces.forEach(space => {
            const spaceElement = document.getElementById(`space-${space.id}`);
            if (spaceElement) {
                spaceElement.classList.add('highlight');
            }
        });
    }

    // Remove highlight from all spaces
    removeHighlightFromAll() {
        const highlightedElements = this.boardContainer.querySelectorAll('.highlight');
        highlightedElements.forEach(element => {
            element.classList.remove('highlight');
        });
    }
}
