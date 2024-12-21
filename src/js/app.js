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
import FactoryManager from './factories/FactoryManager';
import EffectFactory from './factories/EffectFactory';
import SkipTurnEffect from './models/PlayerEffects/SkipTurnEffect';

import { randomNumber, randomWord, randomColor, randomSong } from './utils/PlaceholderFunctions';

// Initialize personal settings
function initializePersonalSettings() {
    const personalSettings = new PersonalSettings();
    const personalSettingsMenu = new PersonalSettingsMenu('settingsModal', personalSettings);
    return { personalSettings, personalSettingsMenu };
}

// Initialize registries and registry manager
function initializeRegistryManager() {
    const registryManager = new RegistryManager();

    // Create and add registries
    const pageRegistry = new PageRegistry();
    const listenerRegistry = new ListenerRegistry();
    const placeholderRegistry = new PlaceholderRegistry();

    registryManager.addRegistry('pageRegistry', pageRegistry);
    registryManager.addRegistry('listenerRegistry', listenerRegistry);
    registryManager.addRegistry('placeholderRegistry', placeholderRegistry);

    return { registryManager, pageRegistry, listenerRegistry, placeholderRegistry };
}

// Register pages in the PageRegistry
function registerPages(pageRegistry) {
    const pages = [
        'homePage',
        'joinPage',
        'lobbyPage',
        'gamePage',
        'hostPage',
        'loadingPage',
    ];
    pages.forEach((page) => pageRegistry.registerPage(page));
}

// Register placeholders
function registerPlaceholders(placeholderRegistry) {
    const placeholders = {
        RANDOM_NUMBER: randomNumber,
        RANDOM_WORD: randomWord,
        RANDOM_COLOR: randomColor,
        RANDOM_SONG: randomSong,
    };

    Object.entries(placeholders).forEach(([key, value]) => {
        placeholderRegistry.register(key, value);
    });
}

// Initialize the EventBus and PluginManager
function initializePluginManager(eventBus, registryManager, factoryManager) {
    const pluginManager = new PluginManager(eventBus, registryManager, factoryManager);

    // Register plugins
    const requirePlugin = require.context('./plugins', true, /\.js$/);
    requirePlugin.keys().forEach((fileName) => {
        const pluginModule = requirePlugin(fileName);
        const plugin = pluginModule.default || pluginModule; // Use default export or the module itself
        if (plugin && typeof plugin === 'function') {
            const pluginInstance = new plugin(); // Create an instance of the plugin
            pluginManager.registerPlugin(pluginInstance); // Register the plugin
        }
    });

    return pluginManager;
}

// Initialize the FactoryManager and register effects
function initializeFactories() {
    const factoryManager = new FactoryManager();

    // Create and add the EffectFactory
    const effectFactory = new EffectFactory();
    factoryManager.registerFactory('EffectFactory', effectFactory);

    // Register effects in the EffectFactory
    effectFactory.register('SkipTurnEffect', SkipTurnEffect);

    return factoryManager;
}

// Register listeners using ListenerRegistry
function registerListeners(
    listenerRegistry,
    personalSettingsMenu,
    registryManager,
    pluginManager,
    factoryManager,
    eventBus
) {
    listenerRegistry.registerListener('hostButton', 'click', () => {
        const hostButton = document.getElementById('hostButton');
        hostButton.disabled = true;

        pluginManager.setHost(true);
        const hostEventHandler = new HostEventHandler(
            registryManager,
            pluginManager,
            factoryManager,
            eventBus
        );
        hostEventHandler.init();
    });

    listenerRegistry.registerListener('joinButton', 'click', () => {
        const joinButton = document.getElementById('joinButton');
        joinButton.disabled = true;

        pluginManager.setHost(false);
        const clientEventHandler = new ClientEventHandler(
            registryManager,
            pluginManager,
            factoryManager,
            eventBus
        );
        clientEventHandler.init();
    });

    listenerRegistry.registerListener('gearButton', 'click', () => {
        personalSettingsMenu.show();
    });
}

// Main application initialization function
function initializeApp() {
    // Personal settings
    const { personalSettingsMenu } = initializePersonalSettings();

    // Registries and manager
    const { registryManager, pageRegistry, listenerRegistry, placeholderRegistry } =
        initializeRegistryManager();

    // Factories and manager
    const factoryManager = initializeFactories();

    // Register pages and placeholders
    registerPages(pageRegistry);
    registerPlaceholders(placeholderRegistry);

    // EventBus and PluginManager
    const eventBus = new EventBus();
    const pluginManager = initializePluginManager(eventBus, registryManager, factoryManager);

    // Register listeners
    registerListeners(
        listenerRegistry,
        personalSettingsMenu,
        registryManager,
        pluginManager,
        factoryManager,
        eventBus
    );
}

// Run the application
initializeApp();
