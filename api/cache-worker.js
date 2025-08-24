import { Hono } from 'hono';
import { cors } from 'hono/cors';

// BlazeAPICache - Multi-tier caching system
class BlazeAPICache {
  constructor(env) {
    this.env = env;
    this.tiers = {
      hot: { ttl: 30, prefix: 'hot:' },      // 30 seconds
      warm: { ttl: 300, prefix: 'warm:' },   // 5 minutes
      cold: { ttl: 3600, prefix: 'cold:' }   // 1 hour
    };
    
    // Circuit breaker configuration
    this.circuitBreaker = {
      threshold: 5,
      timeout: 60000,
      failures: new Map()
    };
    
    // Rate limiting
    this.rateLimits = new Map();
  }

  async get(key, tier = 'warm') {
    const prefixedKey = this.tiers[tier].prefix + key;
    
    try {
      // Try KV store first
      const cached = await this.env.CACHE_KV.get(prefixedKey, 'json');
      if (cached) {
        return {
          data: cached,
          source: 'cache',
          tier,
          hit: true
        };
      }
      
      // Try D1 for cold storage
      if (tier === 'cold' && this.env.DB) {
        const result = await this.env.DB.prepare(
          'SELECT data FROM cache WHERE key = ? AND expires_at > ?'
        ).bind(prefixedKey, Date.now()).first();
        
        if (result) {
          // Promote to warm cache
          await this.set(key, result.data, 'warm');
          return {
            data: JSON.parse(result.data),
            source: 'database',
            tier: 'cold',
            hit: true
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, tier = 'warm') {
    const prefixedKey = this.tiers[tier].prefix + key;
    const ttl = this.tiers[tier].ttl;
    
    try {
      // Store in KV
      await this.env.CACHE_KV.put(
        prefixedKey,
        JSON.stringify(value),
        { expirationTtl: ttl }
      );
      
      // Store in D1 for cold tier
      if (tier === 'cold' && this.env.DB) {
        await this.env.DB.prepare(
          'INSERT OR REPLACE INTO cache (key, data, expires_at) VALUES (?, ?, ?)'
        ).bind(
          prefixedKey,
          JSON.stringify(value),
          Date.now() + (ttl * 1000)
        ).run();
      }
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async invalidate(pattern) {
    try {
      // List all keys matching pattern
      const keys = await this.env.CACHE_KV.list({ prefix: pattern });
      
      // Delete matching keys
      const deletePromises = keys.keys.map(key => 
        this.env.CACHE_KV.delete(key.name)
      );
      
      await Promise.all(deletePromises);
      
      // Also invalidate in D1
      if (this.env.DB) {
        await this.env.DB.prepare(
          'DELETE FROM cache WHERE key LIKE ?'
        ).bind(pattern + '%').run();
      }
      
      return { invalidated: keys.keys.length };
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return { invalidated: 0, error: error.message };
    }
  }

  // Circuit breaker implementation
  async withCircuitBreaker(key, fn) {
    const failures = this.circuitBreaker.failures.get(key) || 0;
    
    // Check if circuit is open
    if (failures >= this.circuitBreaker.threshold) {
      const lastFailure = this.circuitBreaker.failures.get(key + ':time');
      if (lastFailure && (Date.now() - lastFailure) < this.circuitBreaker.timeout) {
        throw new Error('Circuit breaker is open');
      }
      // Reset after timeout
      this.circuitBreaker.failures.delete(key);
      this.circuitBreaker.failures.delete(key + ':time');
    }
    
    try {
      const result = await fn();
      // Reset failures on success
      this.circuitBreaker.failures.delete(key);
      return result;
    } catch (error) {
      // Increment failures
      this.circuitBreaker.failures.set(key, failures + 1);
      this.circuitBreaker.failures.set(key + ':time', Date.now());
      throw error;
    }
  }

  // Rate limiting
  async checkRateLimit(clientId, limit = 100, window = 60000) {
    const now = Date.now();
    const windowStart = now - window;
    
    // Get current requests in window
    const requests = this.rateLimits.get(clientId) || [];
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: validRequests[0] + window
      };
    }
    
    // Add current request
    validRequests.push(now);
    this.rateLimits.set(clientId, validRequests);
    
    return {
      allowed: true,
      remaining: limit - validRequests.length,
      resetAt: now + window
    };
  }
}

// Initialize Hono app
const app = new Hono();

// Apply CORS
app.use('*', cors());

// Middleware for cache instance
app.use('*', async (c, next) => {
  c.cache = new BlazeAPICache(c.env);
  await next();
});

// Rate limiting middleware
app.use('*', async (c, next) => {
  const clientId = c.req.header('X-Client-ID') || c.req.header('CF-Connecting-IP') || 'anonymous';
  const rateLimit = await c.cache.checkRateLimit(clientId);
  
  if (!rateLimit.allowed) {
    return c.json({
      error: 'Rate limit exceeded',
      resetAt: new Date(rateLimit.resetAt).toISOString()
    }, 429);
  }
  
  c.res.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  c.res.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());
  
  await next();
});

// GET /api/cache/:key
app.get('/api/cache/:key', async (c) => {
  const key = c.req.param('key');
  const tier = c.req.query('tier') || 'warm';
  
  try {
    const result = await c.cache.get(key, tier);
    
    if (result) {
      c.res.headers.set('X-Cache-Hit', 'true');
      c.res.headers.set('X-Cache-Tier', result.tier);
      c.res.headers.set('X-Cache-Source', result.source);
      return c.json(result.data);
    }
    
    c.res.headers.set('X-Cache-Hit', 'false');
    return c.json({ error: 'Not found' }, 404);
  } catch (error) {
    return c.json({ error: 'Cache error' }, 500);
  }
});

// PUT /api/cache/:key
app.put('/api/cache/:key', async (c) => {
  const key = c.req.param('key');
  const tier = c.req.query('tier') || 'warm';
  const body = await c.req.json();
  
  try {
    const success = await c.cache.set(key, body, tier);
    
    if (success) {
      return c.json({ 
        success: true, 
        key, 
        tier,
        ttl: c.cache.tiers[tier].ttl 
      });
    }
    
    return c.json({ error: 'Failed to cache' }, 500);
  } catch (error) {
    return c.json({ error: 'Cache error' }, 500);
  }
});

// DELETE /api/cache
app.delete('/api/cache', async (c) => {
  const pattern = c.req.query('pattern') || '';
  
  if (!pattern) {
    return c.json({ error: 'Pattern required' }, 400);
  }
  
  try {
    const result = await c.cache.invalidate(pattern);
    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Invalidation error' }, 500);
  }
});

// GET /api/cache/stats
app.get('/api/cache/stats', async (c) => {
  try {
    // Get cache statistics
    const stats = {
      tiers: c.cache.tiers,
      circuitBreaker: {
        threshold: c.cache.circuitBreaker.threshold,
        timeout: c.cache.circuitBreaker.timeout,
        openCircuits: c.cache.circuitBreaker.failures.size
      },
      rateLimiting: {
        activeClients: c.cache.rateLimits.size
      },
      timestamp: new Date().toISOString()
    };
    
    return c.json(stats);
  } catch (error) {
    return c.json({ error: 'Stats error' }, 500);
  }
});

// Proxy endpoint with caching and circuit breaker
app.get('/api/proxy/*', async (c) => {
  const url = c.req.url.replace('/api/proxy/', '');
  const cacheKey = `proxy:${url}`;
  
  try {
    // Check cache first
    const cached = await c.cache.get(cacheKey, 'warm');
    if (cached) {
      return c.json(cached.data);
    }
    
    // Use circuit breaker for external calls
    const data = await c.cache.withCircuitBreaker(url, async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    });
    
    // Cache the response
    await c.cache.set(cacheKey, data, 'warm');
    
    return c.json(data);
  } catch (error) {
    if (error.message === 'Circuit breaker is open') {
      return c.json({ 
        error: 'Service temporarily unavailable',
        retry: 'Circuit breaker is open'
      }, 503);
    }
    return c.json({ error: 'Proxy error' }, 500);
  }
});

// Health check
app.get('/api/cache/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '1.0.0',
    features: {
      multiTier: true,
      circuitBreaker: true,
      rateLimiting: true,
      invalidation: true
    },
    timestamp: new Date().toISOString()
  });
});

export default app;