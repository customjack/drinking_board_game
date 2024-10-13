import BaseMenu from './BaseMenu';

export default class PersonalSettingsMenu extends BaseMenu {
    constructor(modalId, personalSettings) {
        super(modalId);
        this.personalSettings = personalSettings;

        // Define available themes (corresponds to CSS files in the 'themes' folder)
        this.availableThemes = ['light', 'dark', 'retro'];

        // Elements for settings
        this.themeSelect = document.getElementById('themeSelect');
        this.soundVolume = document.getElementById('soundVolume');
        this.showTips = document.getElementById('showTips');
        this.autoRoll = document.getElementById('autoRoll');

        this.initialize();
    }

    initialize() {
        // Populate theme options
        this.populateThemeOptions();

        // Load the settings into the UI when the modal is shown
        this.loadSettingsIntoUI();

        // Apply the theme
        this.applyTheme();

        // Event listener for the gear icon
        const gearIcon = document.getElementById('gearButton');
        gearIcon.addEventListener('click', () => {
            this.toggle();
        });

        // Event listener for the close button in the modal
        const closeSettingsButton = document.getElementById('closeSettingsButton');
        closeSettingsButton.addEventListener('click', () => {
            this.hide();
        });

        // Add event listeners to update the settings
        this.themeSelect.addEventListener('change', (event) => {
            this.personalSettings.setTheme(event.target.value);
            this.applyTheme();
        });

        this.soundVolume.addEventListener('input', (event) => {
            this.personalSettings.setSoundVolume(parseFloat(event.target.value));
            this.applySoundVolume();
        });

        this.showTips.addEventListener('change', (event) => {
            this.personalSettings.setShowTips(event.target.checked);
            this.applyShowTips();
        });

        this.autoRoll.addEventListener('change', (event) => {
            this.personalSettings.setAutoRoll(event.target.checked);
            this.applyAutoRoll();
        });
    }

    // Populate theme options dynamically
    populateThemeOptions() {
        // Clear existing options
        this.themeSelect.innerHTML = '';

        // Add themes as options
        this.availableThemes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme;
            option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
            this.themeSelect.appendChild(option);
        });
    }

    loadSettingsIntoUI() {
        this.themeSelect.value = this.personalSettings.getTheme();
        this.soundVolume.value = this.personalSettings.getSoundVolume();
        this.showTips.checked = this.personalSettings.getShowTips();
        this.autoRoll.checked = this.personalSettings.getAutoRoll();
    }

    applyTheme() {
        const theme = this.personalSettings.getTheme();
        document.body.className = ''; // Clear existing classes
        document.body.classList.add(`${theme}-theme`); // Add the theme class (e.g., light-theme, dark-theme)
        console.log("Switched theme to", this.personalSettings.getTheme());
    }

    applySoundVolume() {
        // Adjust the sound volume in your application as needed
        // For example, set the global volume for audio elements
    }

    applyShowTips() {
        // Show or hide gameplay tips in your application as needed
    }

    applyAutoRoll() {
        // Implement any immediate changes needed when auto roll setting changes
    }

    // Override the show method to load settings when the modal is displayed
    show() {
        this.loadSettingsIntoUI();
        super.show();
    }
}
