import '../css/styles.css';
import HostEventHandler from './eventHandlers/HostEventHandler';
import ClientEventHandler from './eventHandlers/ClientEventHandler';
import PersonalSettings from './models/PersonalSettings';
import PersonalSettingsMenu from './controllers/menus/PersonalSettingsMenu';
import PageRegistry from './registries/PageRegistry';
import ListenerRegistry from './registries/ListenerRegistry';
import PlaceholderRegistry from './registries/PlaceholderRegistry';
import RegistryManager from './registries/RegistryManager';
import EventBus from './events/EventBus';
import PluginManager from './pluginManagement/PluginManager';

import { randomNumber, randomWord, randomColor } from './utils/PlaceholderFunctions';

// Initialize personal settings
const personalSettings = new PersonalSettings();
const personalSettingsMenu = new PersonalSettingsMenu('settingsModal', personalSettings);

// Initialize the registry manager
const registryManager = new RegistryManager();

// Create and add registries to the manager
const pageRegistry = new PageRegistry();
const listenerRegistry = new ListenerRegistry();
const placeholderRegistry = new PlaceholderRegistry();

registryManager.addRegistry('pageRegistry', pageRegistry);
registryManager.addRegistry('listenerRegistry', listenerRegistry);
registryManager.addRegistry('placeholderRegistry', placeholderRegistry);

// Register common pages (only needs to happen once)
pageRegistry.registerPage('homePage');
pageRegistry.registerPage('joinPage');
pageRegistry.registerPage('lobbyPage');
pageRegistry.registerPage('gamePage');
pageRegistry.registerPage('hostPage');
pageRegistry.registerPage('loadingPage');

//Register placeholders
placeholderRegistry.register('randomNumber', randomNumber);
placeholderRegistry.register('randomWord', randomWord);
placeholderRegistry.register('randomColor', randomColor);

// Initialize the EventBus and PluginManager
const eventBus = new EventBus();
const pluginManager = new PluginManager(eventBus, registryManager);

// Register all plugins in the src/plugins folder
const requirePlugin = require.context('./plugins', true, /\.js$/);
requirePlugin.keys().forEach((fileName) => {
    const pluginModule = requirePlugin(fileName);
    const plugin = pluginModule.default || pluginModule; // Use default export or the module itself
    if (plugin && typeof plugin === 'function') {
        const pluginInstance = new plugin(); // Create an instance of the plugin
        pluginManager.registerPlugin(pluginInstance); // Register the plugin
    }
});

// Register event listeners using ListenerRegistry
listenerRegistry.registerListener('hostButton', 'click', () => {
    const hostButton = document.getElementById('hostButton');
    hostButton.disabled = true;

    pluginManager.setHost(true);
    const hostEventHandler = new HostEventHandler(registryManager, pluginManager, eventBus);
    hostEventHandler.init();
});

listenerRegistry.registerListener('joinButton', 'click', () => {
    const joinButton = document.getElementById('joinButton');
    joinButton.disabled = true;

    pluginManager.setHost(false);
    const clientEventHandler = new ClientEventHandler(registryManager, pluginManager, eventBus);
    clientEventHandler.init();
});

// Personal settings button can also use the listener registry if needed
listenerRegistry.registerListener('gearButton', 'click', () => {
    personalSettingsMenu.show();
});
