/**
 * NIL Service - Name, Image, Likeness valuations
 */

import { NilValuation } from '../packages/schema/types.js';

export class NILService {
  async getPlayerNil(playerId: string): Promise<NilValuation | null> {
    // Mock NIL data
    const nilData = {
      'morant_j': {
        valuation: 3200000,
        socialFollowing: 2800000,
        engagementRate: 0.045,
        brandDeals: 8,
        trend: 'Rising'
      },
      'goldschmidt_p': {
        valuation: 850000,
        socialFollowing: 420000,
        engagementRate: 0.028,
        brandDeals: 3,
        trend: 'Stable'
      }
    };

    const data = nilData[playerId as keyof typeof nilData];
    if (!data) return null;

    return {
      id: crypto.randomUUID(),
      playerId,
      timestamp: new Date(),
      valuation: data.valuation,
      source: 'On3',
      components: {
        socialFollowing: data.socialFollowing,
        engagementRate: data.engagementRate,
        brandDeals: data.brandDeals,
        marketingValue: data.valuation * 0.3,
        performance: Math.floor(Math.random() * 30) + 70
      },
      trustScore: Math.floor(Math.random() * 20) + 80,
      trend: data.trend as 'Rising' | 'Stable' | 'Declining'
    };
  }
}

export const nilService = new NILService();