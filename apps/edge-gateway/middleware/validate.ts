/**
 * Blaze Intelligence - Request Validation Middleware
 * Runtime validation using Zod schemas with 422 responses for invalid data
 */

import { Context, Next } from 'hono';
import { z, ZodError } from 'zod';
import { 
  TeamReadinessQuerySchema, 
  PlayerSearchQuerySchema,
  ApiErrorSchema 
} from '../../../packages/schema/types.js';

// Generic validation middleware factory
export function validateQuery<T extends z.ZodSchema>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validatedQuery = schema.parse(query);
      
      // Add validated data to context
      c.set('validatedQuery', validatedQuery);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json({
          error: 'Validation Error',
          code: 422,
          message: 'Invalid query parameters',
          timestamp: new Date().toISOString(),
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.code
          }))
        }, 422);
      }
      
      return c.json({
        error: 'Internal Server Error',
        code: 500,
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }, 500);
    }
  };
}

// Generic body validation middleware
export function validateBody<T extends z.ZodSchema>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validatedBody = schema.parse(body);
      
      c.set('validatedBody', validatedBody);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json({
          error: 'Validation Error',
          code: 422,
          message: 'Invalid request body',
          timestamp: new Date().toISOString(),
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.code
          }))
        }, 422);
      }
      
      return c.json({
        error: 'Bad Request',
        code: 400,
        message: 'Invalid JSON in request body',
        timestamp: new Date().toISOString()
      }, 400);
    }
  };
}

// Path parameter validation
export function validateParams<T extends z.ZodSchema>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validatedParams = schema.parse(params);
      
      c.set('validatedParams', validatedParams);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json({
          error: 'Validation Error',
          code: 422,
          message: 'Invalid path parameters',
          timestamp: new Date().toISOString(),
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.code
          }))
        }, 422);
      }
      
      return c.json({
        error: 'Internal Server Error',
        code: 500,
        message: 'Parameter validation failed',
        timestamp: new Date().toISOString()
      }, 500);
    }
  };
}

// Specific validators for common endpoints
export const validateTeamReadinessQuery = validateQuery(TeamReadinessQuerySchema);
export const validatePlayerSearchQuery = validateQuery(PlayerSearchQuerySchema);

// Path parameter schemas
export const TeamIdParamsSchema = z.object({
  teamId: z.string().regex(/^[A-Z]{2,4}$/, 'Team ID must be 2-4 uppercase letters')
});

export const PlayerIdParamsSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required')
});

export const validateTeamIdParams = validateParams(TeamIdParamsSchema);
export const validatePlayerIdParams = validateParams(PlayerIdParamsSchema);

// Response validation helper
export function validateResponse<T extends z.ZodSchema>(schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error('Response validation failed:', error);
    throw new Error('Internal data validation error');
  }
}

// Content-Type validation middleware
export function requireContentType(expectedType: string = 'application/json') {
  return async (c: Context, next: Next) => {
    const contentType = c.req.header('content-type');
    
    if (!contentType || !contentType.includes(expectedType)) {
      return c.json({
        error: 'Unsupported Media Type',
        code: 415,
        message: `Expected content-type: ${expectedType}`,
        timestamp: new Date().toISOString()
      }, 415);
    }
    
    await next();
  };
}

// Accept header validation
export function requireAccept(acceptedTypes: string[] = ['application/json']) {
  return async (c: Context, next: Next) => {
    const accept = c.req.header('accept');
    
    if (accept && !acceptedTypes.some(type => accept.includes(type))) {
      return c.json({
        error: 'Not Acceptable',
        code: 406,
        message: `Accepted types: ${acceptedTypes.join(', ')}`,
        timestamp: new Date().toISOString()
      }, 406);
    }
    
    await next();
  };
}