/**
 * Blaze Intelligence - Unified Schema Types
 * Single source of truth for all data structures with Zod validation
 */

import { z } from 'zod';

// Core Identity Schema
export const IdentitySchema = z.object({
  id: z.string(),
  blazeId: z.string(),
  name: z.string(),
  alternateNames: z.array(z.string()).default([]),
  dateOfBirth: z.coerce.date().nullable(),
  age: z.number().int().min(0).max(60).nullable(),
  nationality: z.string().default('USA'),
  secondaryNationality: z.string().nullable(),
});

// League & Affiliation Schema
export const AffiliationSchema = z.object({
  league: z.object({
    type: z.enum(['MLB', 'NFL', 'NBA', 'NCAA_FOOTBALL', 'NCAA_BASEBALL', 'PERFECT_GAME', 'NIL', 'KBO', 'NPB', 'LATIN']),
    name: z.string(),
    level: z.enum(['Professional', 'College', 'Youth', 'International']),
  }),
  team: z.object({
    id: z.string(),
    name: z.string(),
    abbreviation: z.string(),
    conference: z.string().nullable(),
    division: z.string().nullable(),
  }),
  position: z.object({
    primary: z.string(),
    secondary: z.array(z.string()).default([]),
    depth: z.number().nullable(),
  }),
  contractStatus: z.object({
    type: z.enum(['Professional', 'Scholarship', 'NIL', 'Amateur', 'International']),
    years: z.number().nullable(),
    value: z.number().nullable(),
    expires: z.coerce.date().nullable(),
  }),
});

// HAV-F Metrics Schema
export const HavfMetricsSchema = z.object({
  championReadiness: z.object({
    score: z.number().min(0).max(100),
    components: z.object({
      performanceDominance: z.number().min(0).max(100),
      physiologicalResilience: z.number().min(0).max(100),
      careerTrajectory: z.number().min(0).max(100),
    }),
    percentile: z.number().min(0).max(100),
    trend: z.enum(['Improving', 'Stable', 'Declining']),
  }),
  cognitiveLeverage: z.object({
    score: z.number().min(0).max(100),
    components: z.object({
      neuralProcessingSpeed: z.number().min(0).max(100),
      pressureComposure: z.number().min(0).max(100),
    }),
    clutchRating: z.number().min(0).max(100),
    decisionVelocity: z.number().min(0).max(100),
    patternRecognition: z.number().min(0).max(100),
  }),
  nilTrustScore: z.object({
    score: z.number().min(0).max(100),
    components: z.object({
      brandAuthenticity: z.number().min(0).max(100),
      marketVelocity: z.number(),
      publicSalience: z.number().min(0).max(100),
    }),
    valuation: z.number().min(0),
    socialReach: z.number().min(0),
    engagementRate: z.number().min(0).max(1),
  }),
  composite: z.object({
    overall: z.number().min(0).max(100),
    rank: z.number().int().min(1),
    tier: z.enum(['Elite', 'High', 'Average', 'Development']),
    confidence: z.number().min(0).max(100),
  }),
  lastUpdated: z.coerce.date(),
  nextEvaluation: z.coerce.date(),
  version: z.string().default('2.0.0'),
});

// Statistics Schema (sport-agnostic)
export const StatisticsSchema = z.object({
  current: z.record(z.any()).default({}),
  career: z.record(z.any()).default({}),
  projections: z.record(z.any()).default({}),
});

// Health & Injury Schema
export const HealthSchema = z.object({
  status: z.enum(['Healthy', 'Injured', 'IL', 'Recovery']).default('Healthy'),
  injuryHistory: z.array(z.object({
    date: z.coerce.date(),
    type: z.string(),
    severity: z.enum(['Minor', 'Moderate', 'Severe']),
    daysOut: z.number().min(0),
    recovery: z.string(),
  })).default([]),
  durabilityScore: z.number().min(0).max(100),
  loadManagement: z.object({
    recent: z.number(),
    season: z.number(),
    recommended: z.number(),
  }).default({ recent: 0, season: 0, recommended: 0 }),
});

// Metadata Schema
export const MetadataSchema = z.object({
  dataQuality: z.number().min(0).max(100),
  lastUpdated: z.coerce.date(),
  sources: z.array(z.string()),
  version: z.string().default('2.0.0'),
  flags: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

// Unified Player Schema
export const UnifiedPlayerSchema = z.object({
  identity: IdentitySchema,
  affiliation: AffiliationSchema,
  havf: HavfMetricsSchema,
  statistics: StatisticsSchema,
  health: HealthSchema,
  metadata: MetadataSchema,
  // Additional optional fields
  physiology: z.record(z.any()).optional(),
  athleticism: z.record(z.any()).optional(),
  development: z.record(z.any()).optional(),
  market: z.record(z.any()).optional(),
  pipeline: z.record(z.any()).optional(),
  cognitive: z.record(z.any()).optional(),
  digital: z.record(z.any()).optional(),
});

// Event Schema for ingestion
export const EventSchema = z.object({
  id: z.string().uuid(),
  source: z.string(),
  observedAt: z.coerce.date(),
  checksum: z.string(),
  attributes: z.record(z.any()),
  payload: z.any(),
  processed: z.boolean().default(false),
  createdAt: z.coerce.date().default(() => new Date()),
});

// Readiness Snapshot Schema
export const ReadinessSnapshotSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string(),
  playerId: z.string().nullable(),
  timestamp: z.coerce.date(),
  readinessScore: z.number().min(0).max(100),
  leverageScore: z.number().min(0).max(100),
  context: z.enum(['game', 'practice', 'season', 'playoffs']),
  confidence: z.number().min(0).max(100),
  factors: z.record(z.number()),
});

// NIL Valuation Schema
export const NilValuationSchema = z.object({
  id: z.string().uuid(),
  playerId: z.string(),
  timestamp: z.coerce.date(),
  valuation: z.number().min(0),
  source: z.string(),
  components: z.object({
    socialFollowing: z.number().min(0),
    engagementRate: z.number().min(0).max(1),
    brandDeals: z.number().min(0),
    marketingValue: z.number().min(0),
    performance: z.number().min(0).max(100),
  }),
  trustScore: z.number().min(0).max(100),
  trend: z.enum(['Rising', 'Stable', 'Declining']),
});

// API Response Schemas
export const ApiHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.coerce.date(),
  services: z.record(z.enum(['healthy', 'degraded', 'unhealthy'])),
  version: z.string(),
  uptime: z.number(),
});

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.number(),
  message: z.string(),
  timestamp: z.coerce.date(),
  trace: z.string().optional(),
});

// Query Parameter Schemas
export const TeamReadinessQuerySchema = z.object({
  window: z.enum(['day', 'week', 'month', 'season']).default('day'),
  since: z.coerce.date().optional(),
  context: z.enum(['game', 'practice', 'season', 'playoffs']).optional(),
});

export const PlayerSearchQuerySchema = z.object({
  org: z.string().optional(),
  position: z.string().optional(),
  league: z.enum(['MLB', 'NFL', 'NBA', 'NCAA_FOOTBALL', 'NCAA_BASEBALL']).optional(),
  tier: z.enum(['Elite', 'High', 'Average', 'Development']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Export types for TypeScript
export type UnifiedPlayer = z.infer<typeof UnifiedPlayerSchema>;
export type Event = z.infer<typeof EventSchema>;
export type ReadinessSnapshot = z.infer<typeof ReadinessSnapshotSchema>;
export type NilValuation = z.infer<typeof NilValuationSchema>;
export type ApiHealth = z.infer<typeof ApiHealthSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type TeamReadinessQuery = z.infer<typeof TeamReadinessQuerySchema>;
export type PlayerSearchQuery = z.infer<typeof PlayerSearchQuerySchema>;
export type HavfMetrics = z.infer<typeof HavfMetricsSchema>;

// Validation helper functions
export const validateUnifiedPlayer = (data: unknown): UnifiedPlayer => {
  return UnifiedPlayerSchema.parse(data);
};

export const validateEvent = (data: unknown): Event => {
  return EventSchema.parse(data);
};

export const validateReadinessSnapshot = (data: unknown): ReadinessSnapshot => {
  return ReadinessSnapshotSchema.parse(data);
};

export const validateNilValuation = (data: unknown): NilValuation => {
  return NilValuationSchema.parse(data);
};