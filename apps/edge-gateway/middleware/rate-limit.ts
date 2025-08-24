/**
 * Blaze Intelligence - Rate Limiting Middleware
 * Sliding window rate limiter using Cloudflare KV or in-memory cache
 */

import { Context, Next } from 'hono';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (c: Context) => string; // Function to generate rate limit key
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  message?: string; // Custom error message
  headers?: boolean; // Include rate limit headers in response
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for development (use KV in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

export function rateLimiter(options: RateLimitOptions) {
  const {
    windowMs = 60 * 1000, // 1 minute default
    maxRequests = 100,
    keyGenerator = (c) => c.req.header('x-forwarded-for') || 'unknown',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests, please try again later.',
    headers = true
  } = options;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const now = Date.now();
    const resetTime = now + windowMs;
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new window
      entry = {
        count: 0,
        resetTime
      };
      rateLimitStore.set(key, entry);
    }
    
    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      if (headers) {
        c.header('X-RateLimit-Limit', maxRequests.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
        c.header('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
      }
      
      return c.json({
        error: 'Too Many Requests',
        code: 429,
        message,
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      }, 429);
    }
    
    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);
    
    // Add rate limit headers
    if (headers) {
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
      c.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    }
    
    try {
      await next();
      
      // Check if we should count this request
      const shouldCount = !skipSuccessfulRequests || c.res.status >= 400;
      
      if (!shouldCount) {
        // Decrement counter for successful requests if configured
        entry.count = Math.max(0, entry.count - 1);
        rateLimitStore.set(key, entry);
      }
    } catch (error) {
      // Check if we should count failed requests
      if (skipFailedRequests) {
        entry.count = Math.max(0, entry.count - 1);
        rateLimitStore.set(key, entry);
      }
      
      throw error;
    }
  };
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Cleanup every minute

// Advanced rate limiter with multiple tiers
export function tieredRateLimiter() {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    const plan = user?.plan || 'free';
    
    // Different limits per plan
    const limits = {
      free: { windowMs: 60 * 1000, maxRequests: 100 },
      pro: { windowMs: 60 * 1000, maxRequests: 1000 },
      enterprise: { windowMs: 60 * 1000, maxRequests: 10000 }
    };
    
    const keyGenerator = (c: Context) => {
      const userId = user?.sub || c.req.header('x-forwarded-for') || 'unknown';
      return `${plan}:${userId}`;
    };
    
    return rateLimiter({
      ...limits[plan as keyof typeof limits],
      keyGenerator
    })(c, next);
  };
}

// Endpoint-specific rate limiters
export const strictRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // Very restrictive
  message: 'Rate limit exceeded for this sensitive endpoint'
});

export const standardRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute  
  maxRequests: 100
});

export const lenientRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 500
});

// IP-based rate limiter
export const ipRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000,
  keyGenerator: (c) => `ip:${c.req.header('x-forwarded-for') || 'unknown'}`
});

// User-based rate limiter  
export const userRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200,
  keyGenerator: (c) => {
    const user = c.get('user');
    return `user:${user?.sub || 'anonymous'}`;
  }
});