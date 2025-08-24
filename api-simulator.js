// API Simulator for local testing
const liveData = {
    getTeamStats: (team) => {
        const stats = require('./data/live-stats.json');
        return stats.teams[team] || null;
    },
    
    getPredictions: () => {
        return {
            upcoming: [
                { id: 1, team: 'Cardinals', opponent: 'Cubs', prediction: 'W 6-4', confidence: 78, time: '7:45 PM' },
                { id: 2, team: 'Titans', opponent: 'Colts', prediction: 'L 17-24', confidence: 65, time: 'Sunday 1:00 PM' },
                { id: 3, team: 'Grizzlies', opponent: 'Lakers', prediction: 'W 112-108', confidence: 72, time: '8:00 PM' },
                { id: 4, team: 'Longhorns', opponent: 'Oklahoma', prediction: 'W 35-28', confidence: 84, time: 'Saturday 3:30 PM' }
            ]
        };
    },
    
    getPerformanceMetrics: () => {
        return {
            lcp: 1847,
            fid: 73,
            cls: 0.087,
            ttfb: 234,
            score: 94
        };
    }
};

if (typeof module !== 'undefined') {
    module.exports = liveData;
}
