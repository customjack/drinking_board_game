// app.js

import '../css/styles.css';
import HostEventHandler from './eventHandlers/HostEventHandler';
import ClientEventHandler from './eventHandlers/ClientEventHandler';
import PersonalSettings from './models/PersonalSettings';
import PersonalSettingsMenu from './controllers/menus/PersonalSettingsMenu';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize personal settings
    const personalSettings = new PersonalSettings();
    const personalSettingsMenu = new PersonalSettingsMenu('settingsModal', personalSettings);

    // DOM Elements
    const hostButton = document.getElementById('hostButton');
    const joinButton = document.getElementById('joinButton');


    if (hostButton)
        hostButton.addEventListener('click', () => {
            // Disable the hostButton to prevent multiple clicks
            hostButton.disabled = true;

            const hostEventHandler = new HostEventHandler();
            hostEventHandler.init();
        });

    if (joinButton)
        joinButton.addEventListener('click', () => {
            // Disable the joinButton to prevent multiple clicks
            joinButton.disabled = true;

            const clientEventHandler = new ClientEventHandler();
            clientEventHandler.init();
        });
});
