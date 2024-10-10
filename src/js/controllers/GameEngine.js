// GameEngine.js

import GameState from '../models/GameState';
import TurnPhases from '../enums/TurnPhases'; // Import TurnPhases enum
import ParticleAnimation from '../animations/ParticleAnimation';
import RollButtonManager from './RollButtonManager';

export default class GameEngine {
    /**
     * Constructs the GameEngine instance
     * @param {GameState} gameState - The current game state
     * @param {String} peerId - The peer ID of the current player
     * @param {Function} proposeGameState - Function to propose a new game state to the host
     * @param {Boolean} isHost - Whether this peer is the host
     */
    constructor(gameState, peerId, proposeGameState, isHost = false) {
        this.gameState = gameState;
        this.peerId = peerId; // The peer ID of the current player
        this.proposeGameState = proposeGameState; // Function to send proposed game state to host
        this.isHost = isHost; // Whether this peer is the host
        this.particleAnimation = new ParticleAnimation(); // Initialize the roll animation
        this.rollButtonManager = new RollButtonManager(); // Initialize the roll button manager

    }

    // Initialize the GameEngine (e.g., add roll button)
    init() {
        const existingRollButton = document.getElementById('rollButton'); // Check if there's a predefined roll button in the HTML
        this.rollButtonManager.init(existingRollButton, () => this.rollDiceForCurrentPlayer());
    }

    // Update the setupRollButton method to handle button states
    setupRollButton() {
        this.rollButton = document.getElementById('rollButton'); // Use the roll button from the HTML
        this.updateRollButtonState(false); // Set initial state to inactive

        this.rollButton.addEventListener('click', () => {
            if (this.rollButton.classList.contains('active')) {
                this.rollDiceForCurrentPlayer();
            }
        });
    }

    // Method to update the roll button state
    updateRollButtonState(isActive) {
        if (isActive) {
            this.rollButton.classList.add('active');
            this.rollButton.style.cursor = 'pointer';
        } else {
            this.rollButton.classList.remove('active');
            this.rollButton.style.cursor = 'not-allowed';
        }
    }

    // Main method to update the game state
    updateGameState(gameState) {
        this.gameState = gameState;

        if (!this.gameState.isGameStarted()) { // Game hasn't started yet
            return;
        }

        const currentPlayer = this.gameState.getCurrentPlayer();

        // If we're in the BEGIN_TURN phase
        if (this.gameState.turnPhase === TurnPhases.BEGIN_TURN) {
            if (currentPlayer.peerId === this.peerId) {
                console.log(`It's your turn, ${currentPlayer.nickname}!`);
                this.rollButtonManager.activate(); // Activate the roll button
            } else {
                console.log(`Waiting for ${currentPlayer.nickname} to take their turn.`);
                this.rollButtonManager.deactivate(); // Deactivate the roll button if it's not our turn
            }
        }

        // If we're in the PROCESSING_MOVE phase and this peer owns the current player
        if (this.gameState.turnPhase === TurnPhases.PROCESSING_MOVE && currentPlayer.peerId === this.peerId) {
            this.processSingleMove();
        }
    }

    // Prompt the player to roll the dice (show the roll button and set it active)
    promptForRoll() {
        this.updateRollButtonState(true); // Activate the roll button
        this.rollButton.style.display = 'block';
    }

    // Hide and deactivate the roll button when it shouldn't be used
    hideRollButton() {
        this.updateRollButtonState(false); // Deactivate the roll button
        this.rollButton.style.display = 'none';
    }

    // Modify the rollDiceForCurrentPlayer method to call the correct method
    rollDiceForCurrentPlayer() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const rollResult = currentPlayer.rollDice(); // Roll using player's roll engine
        console.log(`${currentPlayer.nickname} rolled a ${rollResult}`);

        // Deactivate the roll button after rolling
        this.rollButtonManager.deactivate();

        // Show the particle animation and proceed after it's done
        this.particleAnimation.showRollResult(rollResult, () => {
            this.handleAfterDiceRoll(rollResult);
        });
    }

    /**
     * Method to handle actions after the dice roll animation ends.
     * @param {number} rollResult - The result of the dice roll.
     */
    handleAfterDiceRoll(rollResult) {
        // Update remaining moves and transition to the next phase
        this.gameState.setRemainingMoves(rollResult);
        this.gameState.setTurnPhase(TurnPhases.PROCESSING_MOVE);

        // Propose the updated game state to the host
        this.proposeGameStateWrapper();
    }

    // Process the player's moves one at a time (move player and decrement moves)
    processSingleMove() {
        const currentPlayer = this.gameState.getCurrentPlayer();

        // If there are moves left, process one move
        if (this.gameState.hasMovesLeft()) {
            // Increment player's position (e.g., move one space forward)
            const newSpaceId = currentPlayer.getCurrentSpaceId() + 1;
            currentPlayer.setCurrentSpaceId(newSpaceId);

            console.log(`${currentPlayer.nickname} moved to space ${newSpaceId}`);

            // Decrement remaining moves
            this.gameState.decrementMoves();

            // Propose the updated game state to the host
            this.proposeGameStateWrapper();
        } else {
            this.endTurn();
        }
    }

    // End the current player's turn and pass it to the next player
    endTurn() {
        console.log(`End of ${this.gameState.getCurrentPlayer().nickname}'s turn.`);

        // Transition the turn phase to END_TURN
        this.gameState.setTurnPhase(TurnPhases.END_TURN);

        // Move to the next player's turn
        this.gameState.nextPlayerTurn();

        // Transition the turn phase to BEGIN_TURN
        this.gameState.setTurnPhase(TurnPhases.BEGIN_TURN);

        // Propose the updated game state to the host
        this.proposeGameStateWrapper();

    }

    proposeGameStateWrapper() {
        setTimeout(() => {
            this.proposeGameState(this.gameState);
        }, 1000); // Adjust delay as needed
    }

}