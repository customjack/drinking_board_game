// BaseEventHandler.js

export default class BaseEventHandler {
    constructor() {
        // Common DOM elements
        this.homePage = document.getElementById('homePage');
        this.lobbyPage = document.getElementById('lobbyPage');
        this.gamePage = document.getElementById('gamePage');
        this.loadingPage = document.getElementById('loadingPage');
        this.pages = [this.homePage, this.lobbyPage, this.gamePage, this.loadingPage];
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // To be implemented by subclasses
    }

    hideAllPages() {
        this.pages.forEach(page => {  
            if (page) page.style.display = 'none';
        });
    }

    showLoadingPage() {
        if (this.loadingPage) {
            this.hideAllPages();
            this.loadingPage.style.display = 'block';
        }
    }

    displayInviteCode(code) {
        const inviteCodeEl = document.getElementById('inviteCode');
        if (inviteCodeEl) inviteCodeEl.textContent = code;
    }

    updateGameState() {
        // To be implemented by subclasses
    }

    handlePeerError(err) {
        alert('An error occurred: ' + err);
        location.reload();
    }

    // Additional common methods...
}
