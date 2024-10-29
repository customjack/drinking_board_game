// Plugin.js
export default class Plugin {
    /**
     * Initialize the plugin.
     * @param {EventBus} eventBus - The event bus instance.
     * @param {RegistryManager} registryManager - The registry manager instance.
     * @param {Boolean} isHost - Whether this instance is a host.
     */
    initialize(eventBus, registryManager, isHost) {
        throw new Error('initialize() method must be implemented by the plugin.');
    }

    /**
     * Optional cleanup method when the plugin is removed.
     */
    cleanup() {
        // Can be overridden by the plugin for cleanup logic
    }
}
