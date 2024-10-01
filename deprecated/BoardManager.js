import Board from './Board.js';

export default class BoardManager {
    constructor() {
        this.board = null;
        this.boardContainer = document.getElementById('lobbyBoardContainer'); // Assuming a container div for the board
        this.svgLayer = null;  // We'll create the SVG layer for the connections
    }

    // Load the default board
    async loadDefaultBoard() {
        console.log("Attempting to load the default board...");
        try {
            const response = await fetch('/assets/maps/defaultBoard.json');
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

    // Function to draw the board as HTML elements and SVG connections
    drawBoard() {
        // Clear the previous board
        this.boardContainer.innerHTML = '';

        // Set board container dimensions (ensure the container is properly sized)
        const containerWidth = this.boardContainer.offsetWidth || 800;
        const containerHeight = this.boardContainer.offsetHeight || 600;

        // Add an SVG element to draw lines
        this.svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svgLayer.setAttribute("width", containerWidth);
        this.svgLayer.setAttribute("height", containerHeight);
        this.svgLayer.style.position = "absolute";
        this.svgLayer.style.top = "0";
        this.svgLayer.style.left = "0";
        this.svgLayer.style.zIndex = "0";  // Keep the lines behind the spaces
        this.svgLayer.style.pointerEvents = "none";  // Prevent interaction with SVG lines
        console.log('Container dimensions:', this.boardContainer.offsetWidth, this.boardContainer.offsetHeight);
        console.log('SVG dimensions:', this.svgLayer.getAttribute('width'), this.svgLayer.getAttribute('height'));


        // Append the SVG layer to the board container
        this.boardContainer.appendChild(this.svgLayer);

        // Draw lines and arrows between connected spaces
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
            spaceElement.style.zIndex = "1";  // Make sure spaces are above the lines
            spaceElement.innerText = space.name;

            // Add a click listener for interaction
            spaceElement.addEventListener('click', () => this.handleSpaceClick(space));

            // Append the space to the board container
            this.boardContainer.appendChild(spaceElement);
        });
    }

    // Draw lines and arrows between connected spaces using SVG
    drawConnections() {
        const arrowLength = 10; // Length of the arrowhead
        const arrowOffset = arrowLength*1.25; // Offset for bidirectional arrows

        this.board.spaces.forEach(space => {
            space.connections.forEach(connection => {
                const targetSpace = connection.target;

                if (targetSpace && (connection.drawConnection === undefined || connection.drawConnection === true)) {
                    const { x: startX, y: startY } = space.visualDetails;
                    const { x: endX, y: endY } = targetSpace.visualDetails;

                    // Log the coordinates for debugging
                    //console.log(`Drawing line from (${startX}, ${startY}) to (${endX}, ${endY})`);

                    // Create an SVG line element
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", startX);
                    line.setAttribute("y1", startY);
                    line.setAttribute("x2", endX);
                    line.setAttribute("y2", endY);
                    line.setAttribute("stroke", "black");
                    line.setAttribute("stroke-width", "2");

                    // Append the line to the SVG layer
                    this.svgLayer.appendChild(line);

                    // Check for bidirectional connection
                    const reverseConnection = targetSpace.connections.find(conn => conn.target.id === space.id);
                    const isBidirectional = !!reverseConnection;

                    if (isBidirectional) {
                        // Draw bidirectional arrows with an offset
                        this.drawBidirectionalArrows(startX, startY, endX, endY, arrowLength, arrowOffset);
                    } else {
                        // Draw a single arrow pointing towards the target
                        const midX = (startX + endX) / 2;
                        const midY = (startY + endY) / 2;
                        const angle = Math.atan2(endY - startY, endX - startX);

                        // Draw the arrowhead at the midpoint
                        this.drawArrow(midX, midY, angle, arrowLength);
                    }
                }
            });
        });
    }

    // Helper function to draw an arrow at a given position and angle
    drawArrow(x, y, angle, length) {
        const headAngle = Math.PI / 6; // Angle for the arrowhead
        const x1 = x - length * Math.cos(angle - headAngle);
        const y1 = y - length * Math.sin(angle - headAngle);
        const x2 = x - length * Math.cos(angle + headAngle);
        const y2 = y - length * Math.sin(angle + headAngle);

        // Create an SVG path element for the arrowhead
        const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = `M ${x},${y} L ${x1},${y1} L ${x2},${y2} Z`; // Path data for the triangle
        arrow.setAttribute("d", d);
        arrow.setAttribute("fill", "black");

        // Append the arrow to the SVG layer
        this.svgLayer.appendChild(arrow);
    }

    // Helper function to draw two arrows for bidirectional connections
    drawBidirectionalArrows(startX, startY, endX, endY, length, offset) {
        const angleForward = Math.atan2(endY - startY, endX - startX);   // Angle for forward arrow
        const angleBackward = Math.atan2(startY - endY, startX - endX); // Angle for reverse arrow

        // Calculate midpoints with slight offset for bidirectional arrows
        const midXForward = (startX + endX) / 2 + offset * Math.cos(angleForward);
        const midYForward = (startY + endY) / 2 - offset * Math.sin(angleForward);
        const midXBackward = (startX + endX) / 2 - offset * Math.cos(angleForward);
        const midYBackward = (startY + endY) / 2 + offset * Math.sin(angleForward);

        // Draw forward arrow
        this.drawArrow(midXForward, midYForward, angleForward, length);

        // Draw backward arrow
        this.drawArrow(midXBackward, midYBackward, angleBackward, length);
    }

    // Handle space click interactions
    handleSpaceClick(space) {
        console.log(`Space clicked: ${space.name}`);
        // Add logic here for what happens when a space is clicked (e.g., move player, highlight, etc.)
    }

    // Highlight specific spaces
    highlightSpaces(spaces) {
        spaces.forEach(space => {
            const spaceElement = document.getElementById(`space-${space.id}`);
            spaceElement.classList.add('highlight');
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
