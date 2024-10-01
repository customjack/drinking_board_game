import GameState from './GameState';

export class GameEngine {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // Start a move for the current player
    startMove(steps) {
        this.gameState.setRemainingMoves(steps);
        this.movePlayer();
    }

    // Move the player one space at a time
    movePlayer() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const currentSpace = this.gameState.board.getSpace(currentPlayer.position);

        // If there are moves remaining, handle 'onPass' actions
        if (this.gameState.hasMovesLeft()) {
            this.evaluateActions(currentPlayer, currentSpace, 'onPass');
        } else {
            this.evaluateActions(currentPlayer, currentSpace, 'onLand');
            return; // End the movement
        }

        // Handle space connections and prompt for choices if needed
        this.handleConnections(currentPlayer, currentSpace);
    }

    // Evaluate actions based on a trigger (like 'onPass' or 'onLand')
    evaluateActions(player, space, triggerType) {
        space.actions
            .filter(action => action.trigger === triggerType)
            .forEach(action => action.execute(player));
    }

    // Handle connections and movement between spaces
    handleConnections(player, currentSpace) {
        if (currentSpace.connections.length > 1) {
            // Prompt player to choose the next space if multiple connections exist
            this.promptPlayerChoice(currentSpace);
        } else if (currentSpace.connections.length === 1) {
            // Move to the next space automatically if there's only one connection
            const nextSpace = currentSpace.connections[0].target;
            this.moveToNextSpace(nextSpace);
        }
    }

    // Prompt the player to choose between multiple connections
    promptPlayerChoice(currentSpace) {
        const availableChoices = currentSpace.connections.map(conn => conn.target.name);
        console.log(`Choose: ${availableChoices.join(', ')}`);

        // Example UI for choosing (replace with your actual UI)
        const choicesUI = document.createElement('div');
        choicesUI.className = 'choices-ui';
        choicesUI.innerHTML = availableChoices.map((choice, index) =>
            `<button class="choice-button" data-index="${index}">${choice}</button>`
        ).join('');
        document.body.appendChild(choicesUI);

        document.querySelectorAll('.choice-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const chosenIndex = parseInt(e.target.getAttribute('data-index'), 10);
                const chosenSpace = currentSpace.connections[chosenIndex].target;

                this.moveToNextSpace(chosenSpace);
                choicesUI.remove();
            });
        });
    }

    // Move to the next space and update the game state
    moveToNextSpace(nextSpace) {
        const currentPlayer = this.gameState.getCurrentPlayer();
        this.gameState.updatePlayerPosition(nextSpace.id);
        console.log(`${currentPlayer.nickname} moved to ${nextSpace.name}`);

        this.gameState.decrementMoves();

        if (this.gameState.hasMovesLeft()) {
            this.movePlayer(); // Continue moving if moves remain
        } else {
            this.evaluateActions(currentPlayer, nextSpace, 'onLand'); // Trigger 'onLand' actions
        }
    }

    // End the current player's turn and pass it to the next player
    endTurn() {
        this.gameState.nextPlayerTurn();
        console.log(`Next player's turn: ${this.gameState.getCurrentPlayer().nickname}`);
    }
}
