export class GameEngine {
    constructor(board, players) {
        this.board = board;
        this.players = players;
        this.currentPlayerIndex = 0;
        this.remainingMoves = 0; // Tracks remaining moves
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // Start a move with a specified number of steps
    startMove(player, steps) {
        this.remainingMoves = steps;
        this.movePlayer(player);
    }

    // Move the player one space at a time
    movePlayer(player) {
        const currentSpace = this.board.getSpace(player.position);

        // If moves remain, evaluate "onPass" actions
        if (this.remainingMoves > 0) {
            this.evaluateActions(player, currentSpace, 'onPass');
        } else {
            this.evaluateActions(player, currentSpace, 'onLand');
            return;
        }

        // If multiple connections, prompt the player to choose
        if (currentSpace.connections.length > 1) {
            this.getPlayerChoice(player, currentSpace);
        } else if (currentSpace.connections.length === 1) {
            const nextSpace = currentSpace.connections[0].target;
            this.moveToNextSpace(player, nextSpace);
        }
    }

    // Evaluate actions based on the trigger
    evaluateActions(player, space, triggerType) {
        space.actions
            .filter(action => action.trigger === triggerType)
            .forEach(action => action.execute(player));
    }

    // Move to the next space
    moveToNextSpace(player, nextSpace) {
        player.position = nextSpace.id;
        console.log(`${player.nickname} moved to ${nextSpace.name}`);
        this.remainingMoves--;

        if (this.remainingMoves > 0) {
            this.movePlayer(player);
        } else {
            this.evaluateActions(player, nextSpace, 'onLand');
        }
    }

    // Prompt the player to choose between multiple connections
    getPlayerChoice(player, space) {
        const availableChoices = space.connections.map(conn => conn.target.name);
        console.log(`${player.nickname}, choose: ${availableChoices.join(', ')}`);

        // Example UI (replace with actual UI)
        const choicesUI = document.createElement('div');
        choicesUI.className = 'choices-ui';
        choicesUI.innerHTML = availableChoices.map((choice, index) =>
            `<button class="choice-button" data-index="${index}">${choice}</button>`
        ).join('');

        document.body.appendChild(choicesUI);

        document.querySelectorAll('.choice-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const chosenIndex = parseInt(e.target.getAttribute('data-index'), 10);
                const chosenSpace = space.connections[chosenIndex].target;

                this.moveToNextSpace(player, chosenSpace);
                choicesUI.remove();
            });
        });
    }

    // End the turn and switch to the next player
    endTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        console.log(`Next player's turn: ${this.getCurrentPlayer().nickname}`);
    }
}
