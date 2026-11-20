/**
 * LocalStorage state and persistence manager.
 * Stores scoreboard, statistics, settings, theme, and audio preferences.
 */

class StorageManager {
    constructor() {
        this.PREFIX = 'connect4_';
        this.initDefaults();
    }

    initDefaults() {
        if (!this.get('stats')) {
            this.set('stats', {
                humanWins: 0,
                aiWins: 0,
                draws: 0,
                totalGames: 0,
                totalAiDecisions: 0,
                totalAiSearchTimeMs: 0,
            });
        }
        if (!this.get('settings')) {
            this.set('settings', {
                firstMove: 'human',
                algorithm: 'alpha_beta',
                difficulty: 'medium', // depth 3
            });
        }
        if (!this.get('theme')) {
            this.set('theme', 'dark');
        }
    }

    get(key) {
        try {
            const raw = localStorage.getItem(this.PREFIX + key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn(`LocalStorage read failed for ${key}:`, e);
            return null;
        }
    }

    set(key, val) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(val));
        } catch (e) {
            console.warn(`LocalStorage write failed for ${key}:`, e);
        }
    }

    recordGameResult(winner) {
        const stats = this.get('stats') || {
            humanWins: 0,
            aiWins: 0,
            draws: 0,
            totalGames: 0,
            totalAiDecisions: 0,
            totalAiSearchTimeMs: 0,
        };

        stats.totalGames += 1;
        if (winner === 1) {
            stats.humanWins += 1;
        } else if (winner === 2) {
            stats.aiWins += 1;
        } else {
            stats.draws += 1;
        }

        this.set('stats', stats);
        return stats;
    }

    recordAiDecision(timeMs) {
        const stats = this.get('stats') || {
            humanWins: 0,
            aiWins: 0,
            draws: 0,
            totalGames: 0,
            totalAiDecisions: 0,
            totalAiSearchTimeMs: 0,
        };

        stats.totalAiDecisions += 1;
        stats.totalAiSearchTimeMs += timeMs;
        this.set('stats', stats);
        return stats;
    }

    getAverageSearchTime() {
        const stats = this.get('stats');
        if (!stats || stats.totalAiDecisions === 0) return 0;
        return (stats.totalAiSearchTimeMs / stats.totalAiDecisions).toFixed(1);
    }

    resetStats() {
        const defaultStats = {
            humanWins: 0,
            aiWins: 0,
            draws: 0,
            totalGames: 0,
            totalAiDecisions: 0,
            totalAiSearchTimeMs: 0,
        };
        this.set('stats', defaultStats);
        return defaultStats;
    }

    saveSettings(settings) {
        this.set('settings', settings);
    }

    getSettings() {
        return this.get('settings') || {
            firstMove: 'human',
            algorithm: 'alpha_beta',
            difficulty: 'medium',
        };
    }
}

window.storageManager = new StorageManager();
