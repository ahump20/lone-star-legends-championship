/**
 * Player Service - Search and retrieval
 */

import { PlayerSearchQuery, UnifiedPlayer } from '../packages/schema/types.js';

interface SearchResult {
  players: UnifiedPlayer[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class PlayerService {
  async searchPlayers(query: PlayerSearchQuery): Promise<SearchResult> {
    // Mock search implementation
    const allPlayers = this.getMockPlayers();
    
    let filteredPlayers = allPlayers;
    
    if (query.league) {
      filteredPlayers = filteredPlayers.filter(p => 
        p.affiliation.league.type === query.league
      );
    }
    
    if (query.position) {
      filteredPlayers = filteredPlayers.filter(p => 
        p.affiliation.position.primary.toLowerCase().includes(query.position!.toLowerCase())
      );
    }
    
    if (query.tier) {
      filteredPlayers = filteredPlayers.filter(p => 
        p.havf.composite.tier === query.tier
      );
    }
    
    const total = filteredPlayers.length;
    const start = query.offset;
    const end = start + query.limit;
    const paginatedPlayers = filteredPlayers.slice(start, end);
    
    return {
      players: paginatedPlayers,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: end < total
      }
    };
  }

  private getMockPlayers(): UnifiedPlayer[] {
    // Mock unified player data
    return [
      {
        identity: {
          id: 'goldschmidt_p',
          blazeId: 'BLZ_MLB_PAU_abc123',
          name: 'Paul Goldschmidt',
          alternateNames: ['Goldy'],
          dateOfBirth: new Date('1987-09-10'),
          age: 36,
          nationality: 'USA',
          secondaryNationality: null
        },
        affiliation: {
          league: {
            type: 'MLB',
            name: 'Major League Baseball',
            level: 'Professional'
          },
          team: {
            id: 'STL',
            name: 'St. Louis Cardinals',
            abbreviation: 'STL',
            conference: null,
            division: 'NL Central'
          },
          position: {
            primary: '1B',
            secondary: ['DH'],
            depth: 1
          },
          contractStatus: {
            type: 'Professional',
            years: 5,
            value: 130000000,
            expires: new Date('2027-12-31')
          }
        },
        havf: {
          championReadiness: {
            score: 89,
            components: {
              performanceDominance: 91,
              physiologicalResilience: 85,
              careerTrajectory: 88
            },
            percentile: 92,
            trend: 'Stable'
          },
          cognitiveLeverage: {
            score: 87,
            components: {
              neuralProcessingSpeed: 89,
              pressureComposure: 85
            },
            clutchRating: 91,
            decisionVelocity: 86,
            patternRecognition: 88
          },
          nilTrustScore: {
            score: 76,
            components: {
              brandAuthenticity: 85,
              marketVelocity: 120,
              publicSalience: 72
            },
            valuation: 850000,
            socialReach: 420000,
            engagementRate: 0.028
          },
          composite: {
            overall: 85,
            rank: 23,
            tier: 'High',
            confidence: 94
          },
          lastUpdated: new Date(),
          nextEvaluation: new Date(Date.now() + 86400000),
          version: '2.0.0'
        },
        statistics: {
          current: {
            avg: 0.289,
            hr: 35,
            rbi: 115,
            ops: 0.981
          },
          career: {},
          projections: {}
        },
        health: {
          status: 'Healthy',
          injuryHistory: [],
          durabilityScore: 88,
          loadManagement: {
            recent: 145,
            season: 145,
            recommended: 150
          }
        },
        metadata: {
          dataQuality: 96,
          lastUpdated: new Date(),
          sources: ['MLB', 'Statcast'],
          version: '2.0.0',
          flags: [],
          tags: ['All-Star', 'Gold Glove', 'MVP Candidate']
        }
      }
    ];
  }
}

export const playerService = new PlayerService();