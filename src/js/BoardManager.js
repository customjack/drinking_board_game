import Board from './Board';

export default class BoardManager {
    constructor() {
        this.board = null;
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
            console.error("Error loading the default board:", error);
        }
    }
    
    

    // Function to draw the board on a canvas
    drawBoard() {
        const canvas = document.getElementById('boardCanvas');
        if (!canvas) {
            console.error('Canvas element not found.');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Canvas context not found.');
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

        // Define arrow size and reduced circle size
        const arrowLength = 10;
        const spaceRadius = 30;  // Reduced space size to allow for better connection visibility

        // Draw connections between spaces (with arrows in the middle)
        this.board.spaces.forEach(space => {
            space.connections.forEach(connection => {
                const { x: startX, y: startY } = space.visualDetails;
                const { x: endX, y: endY } = connection.target.visualDetails;

                // Calculate angle of the line
                const angle = Math.atan2(endY - startY, endX - startX);

                // Calculate start and end points (adjusted to space radius)
                const startXAdjusted = startX + Math.cos(angle) * spaceRadius;
                const startYAdjusted = startY + Math.sin(angle) * spaceRadius;
                const endXAdjusted = endX - Math.cos(angle) * spaceRadius;
                const endYAdjusted = endY - Math.sin(angle) * spaceRadius;

                // Draw the line
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(startXAdjusted, startYAdjusted);
                ctx.lineTo(endXAdjusted, endYAdjusted);
                ctx.stroke();

                // Calculate the midpoint of the line
                const midX = (startXAdjusted + endXAdjusted) / 2;
                const midY = (startYAdjusted + endYAdjusted) / 2;

                // Draw the arrowhead in the middle of the line
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.moveTo(midX, midY);
                ctx.lineTo(
                    midX - arrowLength * Math.cos(angle - Math.PI / 6),
                    midY - arrowLength * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    midX - arrowLength * Math.cos(angle + Math.PI / 6),
                    midY - arrowLength * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();
            });
        });

        // Draw the spaces as smaller circles
        this.board.spaces.forEach(space => {
            const { 
                x = 0, 
                y = 0, 
                size = spaceRadius, 
                color = '#000000', 
                textColor = '#000000', 
                font = '12px Arial',      // Configurable font (default: "12px Arial")
                textAlign = 'center',      // Configurable text alignment (default: "center")
                textBaseline = 'middle'    // Configurable text baseline (default: "middle")
            } = space.visualDetails || {};

            // Draw the space as a smaller circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();

            // Add space name inside the circle
            ctx.fillStyle = textColor;  // Use configurable text color
            ctx.font = font;            // Use configurable font
            ctx.textAlign = textAlign;  // Use configurable text alignment
            ctx.textBaseline = textBaseline;  // Use configurable text baseline
            ctx.fillText(space.name, x, y);   // Render the space name inside the circle
        });
    }


    
    
}
