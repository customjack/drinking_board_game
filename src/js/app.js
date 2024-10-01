// app.js

import '../css/styles.css';
import HostEventHandler from './HostEventHandler';
import ClientEventHandler from './ClientEventHandler';

document.addEventListener('DOMContentLoaded', () => {
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
