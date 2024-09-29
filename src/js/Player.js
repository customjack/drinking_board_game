export default class Player {
    constructor(peerId, nickname, isHost = false) {
        this.peerId = peerId;
        this.nickname = nickname;
        this.isHost = isHost;
        this.stats = {}; // Replacing scores with stats
    }

    // Dynamically update or add stat
    updateStat(statName, delta) {
        if (!this.stats[statName]) {
            this.stats[statName] = 0;
        }
        this.stats[statName] += delta;
    }

    // Retrieve player's stat
    getStat(statName) {
        return this.stats[statName] || 0;
    }

    // Serialize player data
    toJSON() {
        return {
            peerId: this.peerId,
            nickname: this.nickname,
            isHost: this.isHost,
            stats: this.stats
        };
    }

    // Deserialize player data
    static fromJSON(json) {
        const player = new Player(json.peerId, json.nickname, json.isHost);
        player.stats = json.stats;
        return player;
    }
}
