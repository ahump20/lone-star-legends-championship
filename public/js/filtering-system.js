// Advanced Filtering System for Blaze Intelligence
class AdvancedFilteringSystem {
    constructor() {
        this.filters = {
            league: [],
            state: [],
            championships: { min: 0, max: 100 },
            founded: { min: 1850, max: 2024 },
            conference: [],
            division: [],
            city: [],
            hasNFLAlumni: false,
            hasMLBAlumni: false,
            capacity: { min: 0, max: 120000 }
        };
        
        this.sortOptions = {
            field: 'championships',
            direction: 'desc'
        };
        
        this.searchTerm = '';
        this.activeFilters = new Map();
    }

    // Apply all filters to dataset
    applyFilters(teams) {
        let filtered = [...teams];
        
        // Text search
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(team => 
                team.team?.toLowerCase().includes(term) ||
                team.city?.toLowerCase().includes(term) ||
                team.state?.toLowerCase().includes(term) ||
                team.league?.toLowerCase().includes(term) ||
                team.conference?.toLowerCase().includes(term) ||
                team.notes?.toLowerCase().includes(term)
            );
        }
        
        // League filter
        if (this.filters.league.length > 0) {
            filtered = filtered.filter(team => 
                this.filters.league.includes(team.league)
            );
        }
        
        // State filter
        if (this.filters.state.length > 0) {
            filtered = filtered.filter(team => 
                this.filters.state.includes(team.state)
            );
        }
        
        // Conference filter
        if (this.filters.conference.length > 0) {
            filtered = filtered.filter(team => 
                this.filters.conference.includes(team.conference)
            );
        }
        
        // Championships range
        filtered = filtered.filter(team => {
            const champs = team.championships || 0;
            return champs >= this.filters.championships.min && 
                   champs <= this.filters.championships.max;
        });
        
        // Founded year range
        filtered = filtered.filter(team => {
            const founded = team.founded || 1900;
            return founded >= this.filters.founded.min && 
                   founded <= this.filters.founded.max;
        });
        
        // Alumni filters
        if (this.filters.hasNFLAlumni) {
            filtered = filtered.filter(team => 
                team.nfl_alumni && team.nfl_alumni > 0
            );
        }
        
        if (this.filters.hasMLBAlumni) {
            filtered = filtered.filter(team => 
                team.mlb_alumni && team.mlb_alumni > 0 ||
                team.alumni_mlb && team.alumni_mlb > 0
            );
        }
        
        // Stadium capacity range
        if (this.filters.capacity.min > 0 || this.filters.capacity.max < 120000) {
            filtered = filtered.filter(team => {
                const capacity = team.capacity || 50000;
                return capacity >= this.filters.capacity.min && 
                       capacity <= this.filters.capacity.max;
            });
        }
        
        // Apply sorting
        filtered = this.sortTeams(filtered);
        
        return filtered;
    }
    
    // Sort teams by selected field
    sortTeams(teams) {
        const field = this.sortOptions.field;
        const direction = this.sortOptions.direction;
        
        return teams.sort((a, b) => {
            let valueA = a[field];
            let valueB = b[field];
            
            // Handle null/undefined values
            if (valueA === null || valueA === undefined) valueA = 0;
            if (valueB === null || valueB === undefined) valueB = 0;
            
            // String comparison
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            
            // Compare values
            if (valueA < valueB) return direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    // Get unique values for filter options
    getFilterOptions(teams, field) {
        const values = new Set();
        teams.forEach(team => {
            if (team[field]) {
                values.add(team[field]);
            }
        });
        return Array.from(values).sort();
    }
    
    // Get statistics about filtered results
    getFilterStats(teams) {
        const stats = {
            totalTeams: teams.length,
            byLeague: {},
            byState: {},
            byConference: {},
            avgChampionships: 0,
            avgFounded: 0,
            totalChampionships: 0,
            oldestTeam: null,
            newestTeam: null,
            mostSuccessful: null
        };
        
        if (teams.length === 0) return stats;
        
        // Calculate statistics
        let totalChamps = 0;
        let totalFounded = 0;
        let oldestYear = 2024;
        let newestYear = 0;
        let mostChamps = 0;
        
        teams.forEach(team => {
            // League count
            stats.byLeague[team.league] = (stats.byLeague[team.league] || 0) + 1;
            
            // State count
            stats.byState[team.state] = (stats.byState[team.state] || 0) + 1;
            
            // Conference count
            stats.byConference[team.conference] = (stats.byConference[team.conference] || 0) + 1;
            
            // Championships
            const champs = team.championships || 0;
            totalChamps += champs;
            if (champs > mostChamps) {
                mostChamps = champs;
                stats.mostSuccessful = team;
            }
            
            // Founded year
            const founded = team.founded || 1950;
            totalFounded += founded;
            if (founded < oldestYear) {
                oldestYear = founded;
                stats.oldestTeam = team;
            }
            if (founded > newestYear) {
                newestYear = founded;
                stats.newestTeam = team;
            }
        });
        
        stats.avgChampionships = totalChamps / teams.length;
        stats.avgFounded = Math.round(totalFounded / teams.length);
        stats.totalChampionships = totalChamps;
        
        return stats;
    }
    
    // Advanced search with fuzzy matching
    fuzzySearch(teams, query) {
        const threshold = 0.6;
        const results = [];
        
        teams.forEach(team => {
            const teamStr = `${team.team} ${team.city} ${team.state} ${team.league}`.toLowerCase();
            const similarity = this.calculateSimilarity(query.toLowerCase(), teamStr);
            
            if (similarity >= threshold) {
                results.push({
                    team,
                    score: similarity
                });
            }
        });
        
        return results.sort((a, b) => b.score - a.score).map(r => r.team);
    }
    
    // Calculate string similarity (Levenshtein distance)
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = [];
        
        for (let i = 0; i <= len2; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= len1; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= len2; i++) {
            for (let j = 1; j <= len1; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        const distance = matrix[len2][len1];
        const maxLen = Math.max(len1, len2);
        return maxLen === 0 ? 1 : 1 - distance / maxLen;
    }
    
    // Save filter state to localStorage
    saveFilters() {
        const state = {
            filters: this.filters,
            sortOptions: this.sortOptions,
            searchTerm: this.searchTerm
        };
        localStorage.setItem('blazeFilterState', JSON.stringify(state));
    }
    
    // Load filter state from localStorage
    loadFilters() {
        const saved = localStorage.getItem('blazeFilterState');
        if (saved) {
            const state = JSON.parse(saved);
            this.filters = state.filters || this.filters;
            this.sortOptions = state.sortOptions || this.sortOptions;
            this.searchTerm = state.searchTerm || '';
        }
    }
    
    // Reset all filters
    resetFilters() {
        this.filters = {
            league: [],
            state: [],
            championships: { min: 0, max: 100 },
            founded: { min: 1850, max: 2024 },
            conference: [],
            division: [],
            city: [],
            hasNFLAlumni: false,
            hasMLBAlumni: false,
            capacity: { min: 0, max: 120000 }
        };
        this.searchTerm = '';
        this.saveFilters();
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedFilteringSystem;
}