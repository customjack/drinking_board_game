// Import the JSON data
import randomColors from '../../assets/random_samples/random_colors.json';
import randomSongs from '../../assets/random_samples/random_songs.json';
import randomWords from '../../assets/random_samples/random_words.json';

// Generates a random number between min and max (inclusive)
export function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Returns a random word from the randomWords array loaded from JSON
export function randomWord() {
    return randomWords[Math.floor(Math.random() * randomWords.length)];
}

// Returns a random color from the randomColors array loaded from JSON
// I really don't know what I thought the purpose of this one would be
export function randomColor() {
    return randomColors[Math.floor(Math.random() * randomColors.length)];
}

// Returns the track name of a random song from the randomSongs array
export function randomSong() {
    const song = randomSongs[Math.floor(Math.random() * randomSongs.length)];
    return song.track_name;  // Return the track name of the random song
}

