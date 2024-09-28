export default class Player {
    constructor(peerId, nickname, isHost = false) {
        this.peerId = peerId;
        this.nickname = nickname;
        this.isHost = isHost;
        this.scores = {}; // No default score, add as needed
    }

    // Dynamically update or add score
    updateScore(scoreName, delta) {
        if (!this.scores[scoreName]) {
            this.scores[scoreName] = 0;
        }
        this.scores[scoreName] += delta;
    }

    // Retrieve player's score
    getScore(scoreName) {
        return this.scores[scoreName] || 0;
    }

    // Serialize player data
    toJSON() {
        return {
            peerId: this.peerId,
            nickname: this.nickname,
            isHost: this.isHost,
            scores: this.scores
        };
    }

    // Deserialize player data
    static fromJSON(json) {
        const player = new Player(json.peerId, json.nickname, json.isHost);
        player.scores = json.scores;
        return player;
    }
}
