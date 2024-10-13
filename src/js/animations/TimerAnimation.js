// animations/TimerAnimation.js

import Animation from './Animation';
import { interpolateColor } from '../utils/helpers';

export default class TimerAnimation extends Animation {
    /**
     * Constructs the TimerAnimation instance.
     * @param {boolean} isHost - Whether the current player is the host.
     */
    constructor(isHost = false) {
        super();
        this.canvas = null;
        this.ctx = null;
        this.duration = 0;
        this.remainingTime = 0;
        this.animationFrameId = null;
        this.callback = null;
        this.startTime = null;
        this.paused = false;
        this.pauseTime = null;

        // Host-related properties
        this.isHost = isHost;
        this.pauseButton = null;
        this.pauseCallback = null;

        // Define constants for colors and thresholds
        this.SOFT_GREEN = '#90EE90'; // LightGreen
        this.SOFT_YELLOW = '#FFFF99'; // LightYellow
        this.SOFT_RED = '#FF9999'; // LightCoral
        this.BACKGROUND_COLOR = '#f0f0f0'; // Softer light gray background

        this.CRITICAL_TIME_PERCENTAGE = 0.10; // 10%
        this.FADE_FREQUENCY = 2; // Fades per second
        this.MIN_ALPHA = 0.5;
        this.MAX_ALPHA = 1.0;
    }

    /**
     * Initializes the timer animation.
     * @param {Function} pauseCallback - Callback function to handle pause/resume.
     */
    init(pauseCallback = null) {
        // Select the timer container
        this.timerContainer = document.querySelector('.timer-container');
        if (!this.timerContainer) {
            // If not found, create it and append to the sidebar
            this.timerContainer = document.createElement('div');
            this.timerContainer.classList.add('timer-container');

            const gameSidebar = document.getElementById('gameSidebar');
            if (gameSidebar) {
                gameSidebar.insertBefore(this.timerContainer, gameSidebar.firstChild);
            } else {
                document.body.appendChild(this.timerContainer);
            }
        }

        // Create or select the canvas element
        this.canvas = document.getElementById('timerCanvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'timerCanvas';
            this.canvas.width = 100;
            this.canvas.height = 100;
            this.canvas.classList.add('timer-canvas');

            this.timerContainer.appendChild(this.canvas);
        }

        this.ctx = this.canvas.getContext('2d');

        // If the user is the host, create the pause button
        if (this.isHost) {
            this.pauseCallback = pauseCallback;
            this.createPauseButton();
        }
    }

    /**
     * Creates the pause button and sets up event listeners.
     */
    createPauseButton() {
        // Create the pause button element
        this.pauseButton = document.createElement('button');
        this.pauseButton.id = 'pauseButton';
        this.pauseButton.classList.add('button', 'button-pause', 'pause-icon');

        // Position the pause button over the canvas
        this.timerContainer.style.position = 'relative';

        this.pauseButton.style.position = 'absolute';
        this.pauseButton.style.top = '50%';
        this.pauseButton.style.left = '50%';
        this.pauseButton.style.transform = 'translate(-50%, -50%)';
        this.pauseButton.style.display = 'none'; // Hidden by default

        this.timerContainer.appendChild(this.pauseButton);

        // Show pause button on hover over the timer container
        this.timerContainer.addEventListener('mouseenter', () => {
            this.pauseButton.style.display = 'block';
        });

        this.timerContainer.addEventListener('mouseleave', () => {
            this.pauseButton.style.display = 'none';
        });

        // Handle pause/resume on click
        this.pauseButton.addEventListener('click', () => {
            if (this.pauseCallback) {
                this.pauseCallback();
            }
            // Toggling the button icon is handled in pause() and resume()
        });
    }

    /**
     * Toggles the pause button icon between pause and play.
     */
    togglePauseButton() {
        if (this.paused) {
            this.pauseButton.classList.remove('pause-icon');
            this.pauseButton.classList.add('play-icon');
            this.pauseButton.setAttribute('aria-label', 'Play');
        } else {
            this.pauseButton.classList.remove('play-icon');
            this.pauseButton.classList.add('pause-icon');
            this.pauseButton.setAttribute('aria-label', 'Pause');
        }
    }

    /**
     * Starts the timer animation.
     * @param {Object} options - Options for the animation (e.g., duration).
     * @param {Function} callback - Function to call when the timer reaches zero.
     */
    start(options = {}, callback = () => {}) {
        // Stop any existing animation
        this.cleanup();

        this.duration = options.duration || 30; // Default to 30 seconds

        // If resuming, keep the remaining time; otherwise, start fresh
        if (options.remainingTime !== undefined) {
            this.remainingTime = options.remainingTime;
            this.startTime = Date.now() - (this.duration - this.remainingTime) * 1000;
        } else {
            this.remainingTime = this.duration;
            this.startTime = Date.now();
        }

        this.callback = callback;
        this.paused = false;
        this.pauseTime = null;

        // Start the animation loop
        this.animate();
    }

    /**
     * Animates the timer.
     */
    animate() {
        if (this.paused) {
            return;
        }

        const elapsed = (Date.now() - this.startTime) / 1000; // Elapsed time in seconds
        this.remainingTime = Math.max(this.duration - elapsed, 0);

        this.drawTimer();

        if (this.remainingTime > 0) {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        } else {
            // Timer has ended
            if (this.callback) {
                this.callback();
            }
            this.cleanup();
        }
    }

    /**
     * Draws the circular timer.
     */
    drawTimer() {
        const ctx = this.ctx;
        const percent = this.remainingTime / this.duration;
        const angle = Math.PI * 2 * percent;

        // Smoothly interpolate the color based on the remaining time percentage
        let fillColor;
        if (percent > 0.5) {
            // Interpolate from green to yellow
            const factor = (1 - percent) * 2; // Factor from 0 to 1
            fillColor = interpolateColor(this.SOFT_GREEN, this.SOFT_YELLOW, factor);
        } else {
            // Interpolate from yellow to red
            const factor = (0.5 - percent) * 2; // Factor from 0 to 1
            fillColor = interpolateColor(this.SOFT_YELLOW, this.SOFT_RED, factor);
        }

        // Implement fading effect when time is less than CRITICAL_TIME_PERCENTAGE
        let globalAlpha = 1.0; // Fully opaque
        if (percent <= this.CRITICAL_TIME_PERCENTAGE) {
            const elapsedTime = (Date.now() - this.startTime) / 1000;
            globalAlpha =
                this.MIN_ALPHA +
                (this.MAX_ALPHA - this.MIN_ALPHA) *
                    Math.abs(Math.sin(elapsedTime * this.FADE_FREQUENCY * Math.PI));
        }

        // Clear the canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Set global alpha for fading effect
        ctx.globalAlpha = globalAlpha;

        // Draw the background circle
        ctx.beginPath();
        ctx.arc(50, 50, 45, 0, Math.PI * 2);
        ctx.fillStyle = this.BACKGROUND_COLOR;
        ctx.fill();
        ctx.closePath();

        // Draw the remaining time arc
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.arc(50, 50, 45, -Math.PI / 2, -Math.PI / 2 + angle, false);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.closePath();

        // Reset global alpha before drawing inner circle and text
        ctx.globalAlpha = 1.0;

        // Draw the inner circle to create a donut effect
        ctx.beginPath();
        ctx.arc(50, 50, 35, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; // White inner circle
        ctx.fill();
        ctx.closePath();

        // Draw the remaining time text
        ctx.fillStyle = '#000000'; // Black text
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.ceil(this.remainingTime)}s`, 50, 50);
    }

    /**
     * Pauses the timer animation.
     */
    pause() {
        if (!this.paused) {
            this.paused = true;
            this.pauseTime = Date.now();
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            // Update pause button icon
            if (this.isHost) {
                this.togglePauseButton();
            }
        }
    }

    /**
     * Resumes the timer animation.
     */
    resume() {
        if (this.paused) {
            const pausedDuration = Date.now() - this.pauseTime;
            this.startTime += pausedDuration; // Adjust startTime to account for the pause
            this.paused = false;
            this.pauseTime = null;
            this.animate(); // Resume the animation loop
            // Update pause button icon
            if (this.isHost) {
                this.togglePauseButton();
            }
        }
    }

    /**
     * Cleans up the timer animation.
     */
    cleanup() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.paused = false;
        this.pauseTime = null;
        // Optionally clear the canvas or keep it showing zero
        // this.drawTimer(); // Ensure the timer shows zero
    }
}
