// src/js/app.js

import '../css/styles.css'; // Adjust the path if necessary
import Game from './Game';
import Peer from 'peerjs';

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
