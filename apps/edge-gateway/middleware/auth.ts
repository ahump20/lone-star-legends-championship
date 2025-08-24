/**
 * Blaze Intelligence - Authentication & Authorization Middleware
 * JWT-based auth with HMAC validation and scope-based permissions
 */

import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

interface JWTPayload {
  sub: string; // user ID
  iss: string; // issuer
  aud: string; // audience
  exp: number; // expiration
  iat: number; // issued at
  scopes: string[]; // permissions
  org?: string; // organization
  plan: 'free' | 'pro' | 'enterprise';
}

// JWT secret from environment (use HMAC)
const JWT_SECRET = process.env.JWT_SECRET || 'blaze-intelligence-dev-secret-change-in-production';

export async function authMiddleware(c: Context, next: Next) {
  try {
    // Check for Bearer token
    const authHeader = c.req.header('Authorization');
    const apiKey = c.req.header('X-API-Key');
    
    let token: string | undefined;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (apiKey) {
      // API Key validation (simpler path)
      const isValid = await validateApiKey(apiKey);
      if (!isValid) {
        return c.json({
          error: 'Unauthorized',
          code: 401,
          message: 'Invalid API key',
          timestamp: new Date().toISOString()
        }, 401);
      }
      
      // Set default scopes for API key auth
      c.set('user', {
        sub: 'api-key-user',
        scopes: ['readiness:read', 'havf:read', 'nil:read', 'players:read'],
        plan: 'pro'
      });
      
      await next();
      return;
    }
    
    if (!token) {
      return c.json({
        error: 'Unauthorized',
        code: 401,
        message: 'Missing authentication token',
        timestamp: new Date().toISOString()
      }, 401);
    }
    
    // Verify JWT
    const payload = await verify(token, JWT_SECRET) as JWTPayload;
    
    // Check expiration
    if (payload.exp * 1000 < Date.now()) {
      return c.json({
        error: 'Unauthorized',
        code: 401,
        message: 'Token expired',
        timestamp: new Date().toISOString()
      }, 401);
    }
    
    // Set user context
    c.set('user', payload);
    
    await next();
  } catch (error) {
    console.error('Auth error:', error);
    
    return c.json({
      error: 'Unauthorized',
      code: 401,
      message: 'Invalid authentication token',
      timestamp: new Date().toISOString()
    }, 401);
  }
}

// Scope-based authorization middleware
export function requireScopes(requiredScopes: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as JWTPayload;
    
    if (!user) {
      return c.json({
        error: 'Unauthorized',
        code: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      }, 401);
    }
    
    // Check if user has required scopes
    const hasScope = requiredScopes.every(scope => 
      user.scopes.includes(scope) || user.scopes.includes('*')
    );
    
    if (!hasScope) {
      return c.json({
        error: 'Forbidden',
        code: 403,
        message: `Insufficient permissions. Required: ${requiredScopes.join(', ')}`,
        timestamp: new Date().toISOString()
      }, 403);
    }
    
    await next();
  };
}

// Plan-based authorization
export function requirePlan(requiredPlan: 'free' | 'pro' | 'enterprise') {
  const planLevels = { free: 0, pro: 1, enterprise: 2 };
  
  return async (c: Context, next: Next) => {
    const user = c.get('user') as JWTPayload;
    
    if (!user) {
      return c.json({
        error: 'Unauthorized',
        code: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      }, 401);
    }
    
    if (planLevels[user.plan] < planLevels[requiredPlan]) {
      return c.json({
        error: 'Forbidden',
        code: 403,
        message: `${requiredPlan} plan required. Current plan: ${user.plan}`,
        timestamp: new Date().toISOString()
      }, 403);
    }
    
    await next();
  };
}

// API Key validation (placeholder - implement with your key store)
async function validateApiKey(apiKey: string): Promise<boolean> {
  // In production, validate against database or KV store
  // For now, accept keys that start with 'blz_'
  if (!apiKey.startsWith('blz_')) {
    return false;
  }
  
  // Check key format: blz_[environment]_[keyid]_[secret]
  const parts = apiKey.split('_');
  if (parts.length !== 4) {
    return false;
  }
  
  const [prefix, env, keyId, secret] = parts;
  
  // Validate environment
  if (!['dev', 'staging', 'prod'].includes(env)) {
    return false;
  }
  
  // Validate key length (secret should be 32+ chars)
  if (secret.length < 32) {
    return false;
  }
  
  // In production: check if key exists in KV/DB and is active
  // const keyData = await env.API_KEYS.get(keyId);
  // return keyData && !keyData.revoked;
  
  return true;
}

// JWT generation helper (for testing/dev)
export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60), // 24 hours
  };
  
  // Note: In production, use proper JWT library with RSA keys
  const { sign } = await import('hono/jwt');
  return await sign(fullPayload, JWT_SECRET);
}