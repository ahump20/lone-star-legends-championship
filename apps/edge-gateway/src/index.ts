/**
 * Blaze Intelligence Edge Gateway
 * High-performance API router with JWT auth, rate limiting, and caching
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { etag } from 'hono/etag';
import { compress } from 'hono/compress';
import { bearerAuth } from 'hono/bearer-auth';
import { 
  validateTeamReadinessQuery,
  validatePlayerSearchQuery,
  validateTeamIdParams,
  validatePlayerIdParams
} from '../middleware/validate.js';
import { rateLimiter } from '../middleware/rate-limit.js';
import { authMiddleware, requireScopes } from '../middleware/auth.js';
import { healthService } from '../../../services/health.js';
import { readinessService } from '../../../services/readiness.js';
import { havfService } from '../../../services/havf.js';
import { nilService } from '../../../services/nil.js';
import { playerService } from '../../../services/player.js';

// Initialize Hono app
const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', compress());
app.use('*', cors({
  origin: ['https://blaze-intelligence.com', 'https://blaze-intelligence.pages.dev', 'http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400, // 24 hours
}));

// Rate limiting - apply to all routes
app.use('*', rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // per minute per IP
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'unknown'
}));

// Authentication middleware (skip for health endpoints)
app.use('/api/*', (c, next) => {
  if (c.req.path.startsWith('/api/health') || 
      c.req.path.startsWith('/api/ready') || 
      c.req.path.startsWith('/api/metrics')) {
    return next();
  }
  return authMiddleware(c, next);
});

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/healthz', async (c) => {
  const health = await healthService.check();
  
  const status = health.status === 'healthy' ? 200 : 503;
  return c.json(health, status);
});

app.get('/api/readyz', async (c) => {
  const readiness = await healthService.readiness();
  
  const status = readiness.status === 'healthy' ? 200 : 503;
  return c.json(readiness, status);
});

app.get('/api/metrics', async (c) => {
  const metrics = await healthService.metrics();
  
  return c.text(metrics, 200, {
    'Content-Type': 'text/plain; version=0.0.4'
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEAM ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/teams/:teamId/readiness',
  requireScopes(['readiness:read']),
  validateTeamIdParams,
  validateTeamReadinessQuery,
  etag(),
  async (c) => {
    const { teamId } = c.get('validatedParams');
    const query = c.get('validatedQuery');
    
    const readiness = await readinessService.getTeamReadiness(teamId, query);
    
    // Set cache headers
    c.header('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    
    return c.json({
      teamId,
      timestamp: new Date().toISOString(),
      ...readiness
    });
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/players/:playerId/havf',
  requireScopes(['havf:read']),
  validatePlayerIdParams,
  etag(),
  async (c) => {
    const { playerId } = c.get('validatedParams');
    const history = c.req.query('history') === 'true';
    const window = c.req.query('window') || 'month';
    
    const havf = await havfService.getPlayerHavf(playerId, { history, window });
    
    c.header('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    
    return c.json({
      playerId,
      timestamp: new Date().toISOString(),
      ...havf
    });
  }
);

app.get('/api/players/:playerId/nil',
  requireScopes(['nil:read']),
  validatePlayerIdParams,
  async (c) => {
    const { playerId } = c.get('validatedParams');
    
    const nil = await nilService.getPlayerNil(playerId);
    
    if (!nil) {
      return c.json({
        error: 'Not Found',
        code: 404,
        message: 'Player NIL data not found',
        timestamp: new Date().toISOString()
      }, 404);
    }
    
    return c.json(nil);
  }
);

app.get('/api/players',
  requireScopes(['players:read']),
  validatePlayerSearchQuery,
  async (c) => {
    const query = c.get('validatedQuery');
    
    const results = await playerService.searchPlayers(query);
    
    return c.json(results);
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

app.onError((err, c) => {
  console.error('API Error:', err);
  
  // Rate limit exceeded
  if (err.message.includes('Too Many Requests')) {
    return c.json({
      error: 'Too Many Requests',
      code: 429,
      message: 'Rate limit exceeded. Please try again later.',
      timestamp: new Date().toISOString()
    }, 429);
  }
  
  // Unauthorized
  if (err.message.includes('Unauthorized')) {
    return c.json({
      error: 'Unauthorized',
      code: 401,
      message: 'Valid authentication required',
      timestamp: new Date().toISOString()
    }, 401);
  }
  
  // Forbidden
  if (err.message.includes('Forbidden')) {
    return c.json({
      error: 'Forbidden',
      code: 403,
      message: 'Insufficient permissions for this resource',
      timestamp: new Date().toISOString()
    }, 403);
  }
  
  // Generic server error
  return c.json({
    error: 'Internal Server Error',
    code: 500,
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    trace: process.env.NODE_ENV === 'development' ? err.stack : undefined
  }, 500);
});

app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    code: 404,
    message: `Route ${c.req.method} ${c.req.path} not found`,
    timestamp: new Date().toISOString()
  }, 404);
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT FOR CLOUDFLARE WORKERS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    return app.fetch(request, env, ctx);
  }
};

// Export app for testing
export { app };