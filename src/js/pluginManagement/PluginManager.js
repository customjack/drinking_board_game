import Plugin from './Plugin'; // Import the Plugin interface

export default class PluginManager {
    constructor(eventBus, registryManager, factoryManager) {
        this.plugins = [];
        this.eventBus = eventBus;
        this.registryManager = registryManager;
        this.factoryManager = factoryManager;
    }

    // Register a new plugin
    registerPlugin(plugin) {
        if (!(plugin instanceof Plugin)) {
            throw new Error('Plugin must extend the Plugin base class.');
        }
        this.plugins.push(plugin);
        plugin.initialize(this.eventBus, this.registryManager, this.factoryManager);
    }

    // Initialize a plugin from a file
    async initializePluginFromFile(file) {
        console.log(file,file.type);
        if (file && (file.type === 'application/javascript' || file.type === 'text/javascript')) {
            const text = await this.readFile(file);
            const plugin = this.createPluginFromSource(text);
            this.registerPlugin(plugin);
        } else {
            throw new Error('File must be a valid JavaScript file.');
        }
    }

    // Read the file as text
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (event) => reject(new Error('Failed to read file.'));
            reader.readAsText(file);
        });
    }

    // Create a plugin instance from JavaScript source code
    createPluginFromSource(source) {
        const pluginConstructor = new Function('Plugin', `
            const pluginClass = ${source};
            return new pluginClass();
        `)(Plugin);

        if (!(pluginConstructor instanceof Plugin)) {
            throw new Error('Uploaded file must export a valid Plugin class.');
        }

        return pluginConstructor;
    }

    // Set the host status for all plugins
    setHost(isHost) {
        this.isHost = isHost;
        this.plugins.forEach(plugin => plugin.setHost(isHost));
    }

    // Set the Peer instance for all plugins
    setPeer(peer) {
        this.peer = peer;
        this.plugins.forEach(plugin => plugin.setPeer(peer));
    }
}
