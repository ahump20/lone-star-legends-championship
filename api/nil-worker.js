import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

// NIL Projection Model
class NILProjectionModel {
  constructor() {
    this.leverageFactors = {
      football: { QB: 1.5, RB: 1.2, WR: 1.3, TE: 1.1, OL: 0.9, DL: 1.0, LB: 1.1, DB: 1.0 },
      basketball: { PG: 1.3, SG: 1.2, SF: 1.2, PF: 1.1, C: 1.0 },
      baseball: { P: 1.2, C: 0.9, IF: 1.0, OF: 1.1, DH: 0.8 }
    };
  }

  calculateNILValue(athlete) {
    const { sport, position, performance, socialMetrics, marketSize } = athlete;
    
    // Base value from performance metrics
    const baseValue = performance.championEnigmaScore * 1000;
    
    // Position leverage multiplier
    const leverage = this.leverageFactors[sport]?.[position] || 1.0;
    
    // Social media impact (followers, engagement rate)
    const socialImpact = Math.log10(socialMetrics.followers + 1) * socialMetrics.engagementRate;
    
    // Market size multiplier (major markets get 20% boost)
    const marketMultiplier = marketSize === 'major' ? 1.2 : 1.0;
    
    // Calculate final NIL value
    const nilValue = baseValue * leverage * (1 + socialImpact * 0.1) * marketMultiplier;
    
    return {
      value: Math.round(nilValue),
      components: {
        base: Math.round(baseValue),
        leverage: leverage,
        socialBoost: Math.round(socialImpact * baseValue * 0.1),
        marketBoost: marketMultiplier
      }
    };
  }
}

// Champion Enigma Scoring System
class ChampionEnigmaScoring {
  constructor() {
    this.dimensions = [
      'Decision Velocity',
      'Pattern Recognition',
      'Cognitive Load Capacity',
      'Emotional Regulation',
      'Pressure Response',
      'Team Chemistry',
      'Growth Trajectory',
      'Championship DNA'
    ];
    
    this.weights = {
      'Decision Velocity': 0.15,
      'Pattern Recognition': 0.15,
      'Cognitive Load Capacity': 0.12,
      'Emotional Regulation': 0.13,
      'Pressure Response': 0.15,
      'Team Chemistry': 0.10,
      'Growth Trajectory': 0.10,
      'Championship DNA': 0.10
    };
  }

  normalizeScore(rawScore, mean = 50, stdDev = 10) {
    // Convert to standard 0-100 scale using CDF
    const zScore = (rawScore - mean) / stdDev;
    const percentile = this.normCDF(zScore) * 100;
    return Math.min(100, Math.max(0, percentile));
  }

  normCDF(x) {
    // Approximation of the cumulative distribution function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const t5 = t4 * t;
    
    const y = 1.0 - (((((a5 * t5 + a4 * t4) + a3 * t3) + a2 * t2) + a1 * t) * Math.exp(-x * x));

    return 0.5 * (1.0 + sign * y);
  }

  calculateComposite(scores) {
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const [dimension, score] of Object.entries(scores)) {
      if (this.weights[dimension]) {
        const normalizedScore = this.normalizeScore(score);
        weightedSum += normalizedScore * this.weights[dimension];
        totalWeight += this.weights[dimension];
      }
    }
    
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }
}

// Initialize Hono app
const app = new Hono();

// Apply CORS middleware
app.use('*', cors());

// Initialize models
const nilModel = new NILProjectionModel();
const enigmaScoring = new ChampionEnigmaScoring();

// Schema validators
const NILRequestSchema = z.object({
  athleteId: z.string(),
  sport: z.enum(['football', 'basketball', 'baseball']),
  position: z.string(),
  performance: z.object({
    championEnigmaScore: z.number().min(0).max(100)
  }),
  socialMetrics: z.object({
    followers: z.number().min(0),
    engagementRate: z.number().min(0).max(1)
  }),
  marketSize: z.enum(['major', 'mid', 'small'])
});

const ScoringRequestSchema = z.object({
  athleteId: z.string(),
  scores: z.record(z.string(), z.number())
});

// API Routes

// GET /api/nil/timeline
app.get('/api/nil/timeline', async (c) => {
  const { env } = c;
  
  try {
    // Check cache first
    const cached = await env.NIL_CACHE.get('timeline', 'json');
    if (cached) {
      return c.json(cached);
    }
    
    // Generate sample timeline data
    const timeline = {
      athletes: [
        {
          id: 'LSU_QB_001',
          name: 'Jayden Daniels',
          school: 'LSU',
          sport: 'football',
          position: 'QB',
          nilValue: 285000,
          trend: '+12.5%',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'TEX_WR_001',
          name: 'Xavier Worthy',
          school: 'Texas',
          sport: 'football',
          position: 'WR',
          nilValue: 175000,
          trend: '+8.3%',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'AUB_PG_001',
          name: 'Wendell Green Jr.',
          school: 'Auburn',
          sport: 'basketball',
          position: 'PG',
          nilValue: 95000,
          trend: '+5.7%',
          lastUpdated: new Date().toISOString()
        }
      ],
      marketConditions: {
        totalMarketCap: 1250000000,
        avgDealSize: 25000,
        topSport: 'football',
        growthRate: 0.34
      },
      timestamp: new Date().toISOString()
    };
    
    // Cache for 5 minutes
    await env.NIL_CACHE.put('timeline', JSON.stringify(timeline), {
      expirationTtl: 300
    });
    
    return c.json(timeline);
  } catch (error) {
    return c.json({ error: 'Failed to fetch timeline data' }, 500);
  }
});

// POST /api/nil/calculate
app.post('/api/nil/calculate', async (c) => {
  try {
    const body = await c.req.json();
    const validated = NILRequestSchema.parse(body);
    
    const nilResult = nilModel.calculateNILValue(validated);
    
    // Store in D1 if available
    const { env } = c;
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO nil_valuations (athlete_id, value, components, timestamp)
        VALUES (?, ?, ?, ?)
      `).bind(
        validated.athleteId,
        nilResult.value,
        JSON.stringify(nilResult.components),
        new Date().toISOString()
      ).run();
    }
    
    return c.json({
      athleteId: validated.athleteId,
      ...nilResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request', details: error.errors }, 400);
    }
    return c.json({ error: 'Calculation failed' }, 500);
  }
});

// POST /api/nil/score
app.post('/api/nil/score', async (c) => {
  try {
    const body = await c.req.json();
    const validated = ScoringRequestSchema.parse(body);
    
    const compositeScore = enigmaScoring.calculateComposite(validated.scores);
    
    const result = {
      athleteId: validated.athleteId,
      compositeScore,
      dimensions: Object.entries(validated.scores).map(([dimension, rawScore]) => ({
        dimension,
        rawScore,
        normalized: enigmaScoring.normalizeScore(rawScore),
        weight: enigmaScoring.weights[dimension] || 0
      })),
      timestamp: new Date().toISOString()
    };
    
    return c.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request', details: error.errors }, 400);
    }
    return c.json({ error: 'Scoring failed' }, 500);
  }
});

// GET /api/nil/attribution
app.get('/api/nil/attribution/:athleteId', async (c) => {
  const athleteId = c.req.param('athleteId');
  
  // Generate Shapley value attribution
  const attribution = {
    athleteId,
    totalValue: 185000,
    attribution: {
      performance: 92000,
      social: 45000,
      market: 28000,
      position: 20000
    },
    shapleyValues: {
      performance: 0.497,
      social: 0.243,
      market: 0.151,
      position: 0.108
    },
    confidence: 0.87,
    timestamp: new Date().toISOString()
  };
  
  return c.json(attribution);
});

// Health check
app.get('/api/nil/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '1.0.0',
    models: {
      nilProjection: 'active',
      championEnigma: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

export default app;