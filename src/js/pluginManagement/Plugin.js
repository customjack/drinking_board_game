// Plugin.js
export default class Plugin {
    /**
     * Initialize the plugin.
     * @param {EventBus} eventBus - The event bus instance.
     * @param {RegistryManager} registryManager - The registry manager instance.
     */
    initialize(eventBus, registryManager) {
        throw new Error('initialize() method must be implemented by the plugin.');
    }

    /**
     * Set the Peer instance for the plugin.
     * @param {Peer} peer - The PeerJS instance.
     */
    setPeer(peer) {
        this.peer = peer;
    }

    /**
     * Set the host status for the plugin.
     * @param {Boolean} isHost - Whether this instance is a host.
     */
    setHost(isHost) {
        this.isHost = isHost;
    }

    /**
     * Optional cleanup method when the plugin is removed.
     */
    cleanup() {
        // Can be overridden by the plugin for cleanup logic
    }
}
