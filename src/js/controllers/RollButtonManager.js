// controllers/RollButtonManager.js

export default class RollButtonManager {
    /**
     * Constructs the RollButtonManager instance.
     */
    constructor() {
        this.rollButton = null; // Will hold the roll button element
    }

    /**
     * Initializes the roll button. Uses the existing button element if provided, or creates a new one.
     * @param {HTMLElement} existingButtonElement - An existing button element to use for the roll button.
     * @param {Function} onClickCallback - The function to call when the roll button is clicked.
     */
    init(existingButtonElement, onClickCallback) {
        // Use the existing button element if provided, otherwise create a new one
        this.rollButton = existingButtonElement || this.createRollButton();

        // Add click event listener
        this.rollButton.addEventListener('click', () => {
            if (this.rollButton.classList.contains('active')) {
                onClickCallback();
            }
        });
    }

    /**
     * Creates a new roll button if one doesn't exist.
     * @returns {HTMLElement} The newly created roll button element.
     */
    createRollButton() {
        const rollButton = document.createElement('button');
        rollButton.id = 'rollButton';
        rollButton.textContent = "Roll Dice";
        rollButton.classList.add('roll-button'); // Apply default styling
        document.body.appendChild(rollButton);
        return rollButton;
    }

    /**
     * Activates the roll button, making it clickable with animation.
     */
    activate() {
        this.rollButton.classList.add('active');
        this.rollButton.style.cursor = 'pointer';
        this.rollButton.disabled = false; // Enable the button
    }

    /**
     * Deactivates the roll button, making it unclickable and changing its appearance.
     */
    deactivate() {
        this.rollButton.classList.remove('active');
        this.rollButton.style.cursor = 'not-allowed';
        this.rollButton.disabled = true; // Disable the button to prevent clicks
    }

    /**
     * Clean up the roll button and remove its event listener if necessary.
     */
    cleanup() {
        if (this.rollButton) {
            this.rollButton.removeEventListener('click', this.onClickCallback);
            this.rollButton.remove();
            this.rollButton = null;
        }
    }
}
