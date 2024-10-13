export default class PersonalSettings {
    constructor() {
        // Attempt to load from local storage
        const savedSettings = PersonalSettings.loadFromLocalStorage();

        if (savedSettings) {
            // Initialize settings from saved values
            this.theme = savedSettings.theme;
            this.soundVolume = savedSettings.soundVolume;
            this.showTips = savedSettings.showTips;
            this.autoRoll = savedSettings.autoRoll;
        } else {
            // Default settings if nothing is saved
            this.theme = 'light';
            this.soundVolume = 1.0;
            this.showTips = true;
            this.autoRoll = false;
        }
    }

    // Getter and Setter for theme
    getTheme() {
        return this.theme;
    }

    setTheme(theme) {
        this.theme = theme;
        this.saveToLocalStorage();
    }

    // Getter and Setter for sound volume
    getSoundVolume() {
        return this.soundVolume;
    }

    setSoundVolume(volume) {
        this.soundVolume = Math.min(Math.max(volume, 0.0), 1.0); // Ensure value is between 0.0 and 1.0
        this.saveToLocalStorage();
    }

    // Getter and Setter for showing tips
    getShowTips() {
        return this.showTips;
    }

    setShowTips(showTips) {
        this.showTips = showTips;
        this.saveToLocalStorage();
    }

    // Getter and Setter for auto-roll
    getAutoRoll() {
        return this.autoRoll;
    }

    setAutoRoll(autoRoll) {
        this.autoRoll = autoRoll;
        this.saveToLocalStorage();
    }

    // Convert the settings object to JSON format
    toJSON() {
        return {
            theme: this.theme,
            soundVolume: this.soundVolume,
            showTips: this.showTips,
            autoRoll: this.autoRoll,
        };
    }

    // Static method to create a new instance from a JSON object
    static fromJSON(json) {
        const settings = new PersonalSettings();
        settings.theme = json.theme;
        settings.soundVolume = json.soundVolume;
        settings.showTips = json.showTips;
        settings.autoRoll = json.autoRoll;
        return settings;
    }

    // Save settings to localStorage
    saveToLocalStorage() {
        localStorage.setItem('personalSettings', JSON.stringify(this.toJSON()));
    }

    // Static method to load settings from localStorage without invoking the constructor
    static loadFromLocalStorage() {
        const settings = localStorage.getItem('personalSettings');
        return settings ? JSON.parse(settings) : null;
    }
}
