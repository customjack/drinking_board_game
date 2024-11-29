import BaseRegistry from './BaseRegistry';  // Import the base registry class

export default class PlaceholderRegistry extends BaseRegistry {
    constructor() {
        super();  // Call the parent constructor to initialize the registry
    }

    // Register a placeholder with a name and a generator function
    register(name, generatorFunction) {
        if (typeof generatorFunction !== 'function') {
            throw new Error('Generator function must be a function.');
        }
        super.register(name, generatorFunction);  // Use the inherited method from BaseRegistry
    }

    // Unregister (remove) a placeholder by its name
    unregister(name) {
        if (this.registry[name]) {
            super.unregister(name);  // Use the inherited method from BaseRegistry
            console.log(`Placeholder '${name}' unregistered.`);
        } else {
            console.warn(`Placeholder '${name}' not found.`);
        }
    }

    // Replace placeholders in a given text
    replacePlaceholders(text) {
        return text.replace(/{{(.*?)}}/g, (match, expression) => {
            const [name, argsString] = this._parseExpression(expression);
            const generator = this.registry[name];  // Access the registry directly

            if (!generator) {
                console.warn(`No generator found for placeholder: ${name}`);
                return match; // Keep the original placeholder if no generator is found
            }

            const args = argsString ? this._parseArgs(argsString) : [];
            return generator(...args);  // Call the generator with parsed args
        });
    }

    // Helper method to parse the expression and extract name and arguments
    _parseExpression(expression) {
        const [name, ...args] = expression.split(/\((.*?)\)/).filter(Boolean);
        return [name.trim(), args.join('')];
    }

    // Helper method to parse arguments passed to the placeholder function
    _parseArgs(argsString) {
        // Split arguments by commas and trim whitespace
        return argsString.split(',').map(arg => {
            const trimmed = arg.trim();
            // Try to parse numbers; otherwise, return strings
            const num = Number(trimmed);
            return isNaN(num) ? trimmed : num;
        });
    }
}
