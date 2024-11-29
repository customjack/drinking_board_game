// Generates a random number between min and max (inclusive)
export function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Returns a random word from a predefined list of words
export function randomWord() {
    const words = ['apple', 'banana', 'orange', 'pear', 'grape', 'plum'];
    return words[Math.floor(Math.random() * words.length)];
}

// Returns a random color from a predefined list of colors
export function randomColor() {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#33F3FF', '#FF33F3'];
    return colors[Math.floor(Math.random() * colors.length)];
}
