// ParticleAnimation.js

export default class ParticleAnimation {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationFrameId = null;
        this.animationDuration = 4000; // Total duration in milliseconds
        this.startTime = null;
        this.resultText = '';
    }

    /**
     * Shows the particle animation and displays the result.
     * @param {any} rollResult - The result of the roll to display.
     * @param {Function} callback - A function to call when the animation ends.
     */
    showRollResult(rollResult, callback) {
        this.resultText = rollResult.toString();
        this.initCanvas();
        this.createParticles();

        this.startTime = performance.now();
        this.animate(callback);
    }

    /**
     * Initializes the canvas element.
     */
    initCanvas() {
        // Create the canvas if it doesn't exist
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = '1000';
            this.canvas.style.pointerEvents = 'none'; // Allow clicks to pass through
            document.body.appendChild(this.canvas);

            this.ctx = this.canvas.getContext('2d');
        }

        // Resize canvas to full window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Clear any existing particles
        this.particles = [];
    }

    /**
     * Creates particles with random positions and velocities.
     */
    createParticles() {
        const numParticles = 200;
        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2, // Velocity in x
                vy: (Math.random() - 0.5) * 2, // Velocity in y
                targetX: null, // To be set during convergence
                targetY: null,
            });
        }
    }

    /**
     * Animates the particles.
     * @param {Function} callback - Function to call after animation completes.
     */
    animate(callback) {
        const elapsed = performance.now() - this.startTime;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (elapsed < this.animationDuration) {
            if (elapsed < this.animationDuration / 2) {
                // Phase 1: Chaotic motion
                this.updateParticlesChaos();
            } else {
                // Phase 2: Convergence
                if (!this.particles[0].targetX) {
                    this.setParticleTargets();
                }
                this.updateParticlesConverge();
            }

            // Draw particles
            this.drawParticles();

            // Request next frame
            this.animationFrameId = requestAnimationFrame(() => this.animate(callback));
        } else {
            // Phase 3: Reveal
            this.drawResultText();

            // End the animation after a delay
            setTimeout(() => {
                this.cleanup();
                if (callback) callback();
            }, 2000); // Display result for 2 seconds
        }
    }

    /**
     * Updates particle positions during chaotic motion.
     */
    updateParticlesChaos() {
        this.particles.forEach(particle => {
            particle.x += particle.vx * 5; // Adjust speed as needed
            particle.y += particle.vy * 5;

            // Bounce off walls
            if (particle.x <= 0 || particle.x >= this.canvas.width) {
                particle.vx *= -1;
            }
            if (particle.y <= 0 || particle.y >= this.canvas.height) {
                particle.vy *= -1;
            }
        });
    }

    /**
     * Sets target positions for particles to converge to form the result text.
     */
    setParticleTargets() {
        // Draw the result text off-screen to get pixel data
        const fontSize = 100;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = `bold ${fontSize}px Arial`;
        tempCtx.fillStyle = '#ffffff';
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(this.resultText, tempCanvas.width / 2, tempCanvas.height / 2);

        // Get pixel data
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        // Assign target positions to particles based on text pixels
        let particleIndex = 0;
        for (let y = 0; y < tempCanvas.height; y += 4) {
            for (let x = 0; x < tempCanvas.width; x += 4) {
                const index = (y * tempCanvas.width + x) * 4;
                if (data[index + 3] > 128) { // If pixel is not transparent
                    if (particleIndex < this.particles.length) {
                        this.particles[particleIndex].targetX = x;
                        this.particles[particleIndex].targetY = y;
                        particleIndex++;
                    } else {
                        break;
                    }
                }
            }
        }

        // For remaining particles without targets, assign random nearby positions
        for (let i = particleIndex; i < this.particles.length; i++) {
            this.particles[i].targetX = this.canvas.width / 2 + (Math.random() - 0.5) * 200;
            this.particles[i].targetY = this.canvas.height / 2 + (Math.random() - 0.5) * 200;
        }
    }

    /**
     * Updates particle positions during convergence.
     */
    updateParticlesConverge() {
        this.particles.forEach(particle => {
            const dx = particle.targetX - particle.x;
            const dy = particle.targetY - particle.y;
            particle.x += dx * 0.05; // Adjust convergence speed
            particle.y += dy * 0.05;
        });
    }

    /**
     * Draws the particles on the canvas.
     */
    drawParticles() {
        this.ctx.fillStyle = '#000000';
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * Draws the final result text prominently.
     */
    drawResultText() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = `bold 100px Arial`;
        this.ctx.fillStyle = '#000000';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.resultText, this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * Cleans up after the animation completes.
     */
    cleanup() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
            this.canvas = null;
            this.ctx = null;
        }
    }
}
