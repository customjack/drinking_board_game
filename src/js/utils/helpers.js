// utils/helpers.js

/**
 * Generates a color palette of soft pastel colors.
 * @param {number} size - The number of colors to generate in the palette.
 * @returns {string[]} An array of HSL color strings.
 */
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

/**
 * Hashes a peer ID to map it to a color index in the palette.
 * @param {string} peerId - The peer ID to hash.
 * @param {number} paletteLength - The length of the color palette.
 * @returns {number} The index of the color in the palette.
 */
export function hashPeerId(peerId, paletteLength) {
    let hash = 0;
    for (let i = 0; i < peerId.length; i++) {
        const char = peerId.charCodeAt(i);
        hash = (hash * 31 + char) % 1000; // Simple hash function
    }
    return Math.abs(hash) % paletteLength; // Map the hash to a color index in the palette
}

/**
 * Utility function to create a darker version of a given color.
 * Handles both hex and HSL color formats.
 * @param {string} color - The original color in hex or HSL format.
 * @param {number} factor - The darkening factor (0 to 1, where 1 is the same color).
 * @returns {string} - The darker color in hex format.
 */
export function darkenColor(color, factor) {
    if (color.startsWith('hsl')) {
        // Convert HSL to RGB
        const rgb = hslToRgb(color);
        return darkenRgbColor(rgb, factor);
    } else {
        // Assuming it's a hex color
        return darkenHexColor(color, factor);
    }
}

/**
 * Function to darken an RGB color.
 * @param {Object} rgb - An object with r, g, b components.
 * @param {number} factor - The darkening factor.
 * @returns {string} - The darkened color in hex format.
 */
function darkenRgbColor({ r, g, b }, factor) {
    const darkenedR = Math.floor(r * factor);
    const darkenedG = Math.floor(g * factor);
    const darkenedB = Math.floor(b * factor);
    return `#${componentToHex(darkenedR)}${componentToHex(darkenedG)}${componentToHex(darkenedB)}`;
}

/**
 * Function to convert HSL color to RGB.
 * @param {string} hsl - The HSL color string.
 * @returns {Object} - An object containing the r, g, b components.
 */
function hslToRgb(hsl) {
    const [h, s, l] = hsl.match(/\d+/g).map(Number);
    const lightness = l / 100;
    const saturation = s / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = chroma * (1 - Math.abs((h / 60) % 2 - 1));
    const m = lightness - chroma / 2;
    let [r, g, b] = [0, 0, 0];

    if (h >= 0 && h < 60) [r, g, b] = [chroma, x, 0];
    else if (h >= 60 && h < 120) [r, g, b] = [x, chroma, 0];
    else if (h >= 120 && h < 180) [r, g, b] = [0, chroma, x];
    else if (h >= 180 && h < 240) [r, g, b] = [0, x, chroma];
    else if (h >= 240 && h < 300) [r, g, b] = [x, 0, chroma];
    else if (h >= 300 && h < 360) [r, g, b] = [chroma, 0, x];

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
    };
}

/**
 * Helper function to darken a hex color.
 * @param {string} hexColor - The hex color string.
 * @param {number} factor - The darkening factor.
 * @returns {string} - The darkened color in hex format.
 */
function darkenHexColor(hexColor, factor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const darkenedR = Math.floor(r * factor);
    const darkenedG = Math.floor(g * factor);
    const darkenedB = Math.floor(b * factor);

    return `#${componentToHex(darkenedR)}${componentToHex(darkenedG)}${componentToHex(darkenedB)}`;
}

/**
 * Helper function to convert a number to a two-digit hex string.
 * @param {number} component - The color component value (0-255).
 * @returns {string} - The two-digit hex string.
 */
export function componentToHex(component) {
    const hex = component.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}
