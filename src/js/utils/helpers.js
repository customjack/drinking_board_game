// utils/helpers.js

export function generateColorPalette(size) {
    const colors = [];
    for (let i = 0; i < size; i++) {
        const hue = (i * 360 / size) % 360; // Spread hues across 360 degrees
        const saturation = 70; // Lower saturation for softer colors
        const lightness = 80;  // Higher lightness for a pastel effect
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`); // Soft pastel colors
    }
    return colors;
}

export function hashPeerId(peerId, paletteLength) {
    let hash = 0;
    for (let i = 0; i < peerId.length; i++) {
        const char = peerId.charCodeAt(i);
        hash = (hash * 31 + char) % 1000; // Simple hash function
    }
    return Math.abs(hash) % paletteLength; // Map the hash to a color index in the palette
}