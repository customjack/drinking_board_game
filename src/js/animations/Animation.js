// animations/Animation.js

export default class Animation {
    constructor() {
        if (new.target === Animation) {
            throw new TypeError('Cannot instantiate abstract class Animation directly.');
        }
    }

    /**
     * Initializes the animation.
     * Subclasses should implement this method.
     */
    init() {
        throw new Error('init() must be implemented by subclass');
    }

    /**
     * Starts or plays the animation.
     * @param {Object} options - Optional parameters for the animation.
     * @param {Function} callback - Function to call when the animation ends.
     */
    start(options = {}, callback = () => {}) {
        throw new Error('start() must be implemented by subclass');
    }

    /**
     * Cleans up resources after the animation completes.
     */
    cleanup() {
        throw new Error('cleanup() must be implemented by subclass');
    }
}
