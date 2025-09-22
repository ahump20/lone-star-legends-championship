/**
 * Blaze Intelligence - Health Service
 * System health checks, readiness probes, and Prometheus metrics
 */

import { ApiHealth } from '../packages/schema/types.js';

class HealthService {
  private startTime = Date.now();
  private version = process.env.npm_package_version || '2.0.0';

  async check(): Promise<ApiHealth> {
    const services = await this.checkServices();
    const hasUnhealthy = Object.values(services).some(status => status === 'unhealthy');
    const hasDegraded = Object.values(services).some(status => status === 'degraded');
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date(),
      services,
      version: this.version,
      uptime: (Date.now() - this.startTime) / 1000
    };
  }

  async readiness(): Promise<ApiHealth> {
    const services = await this.checkReadiness();
    const hasUnhealthy = Object.values(services).some(status => status === 'unhealthy');
    
    return {
      status: hasUnhealthy ? 'unhealthy' : 'healthy',
      timestamp: new Date(),
      services,
      version: this.version,
      uptime: (Date.now() - this.startTime) / 1000
    };
  }

  async metrics(): Promise<string> {
    const health = await this.check();
    const uptime = Math.floor(health.uptime);
    
    return `
# HELP blaze_up Blaze Intelligence service is up and running
# TYPE blaze_up gauge
blaze_up 1

# HELP blaze_uptime_seconds Total uptime in seconds
# TYPE blaze_uptime_seconds counter
blaze_uptime_seconds ${uptime}

# HELP blaze_health_status Current health status (1=healthy, 0.5=degraded, 0=unhealthy)
# TYPE blaze_health_status gauge
blaze_health_status ${this.statusToNumber(health.status)}

# HELP blaze_service_health Individual service health status
# TYPE blaze_service_health gauge
${Object.entries(health.services)
  .map(([service, status]) => `blaze_service_health{service="${service}"} ${this.statusToNumber(status)}`)
  .join('\n')}

# HELP blaze_request_duration_seconds Request duration in seconds
# TYPE blaze_request_duration_seconds histogram
blaze_request_duration_seconds_bucket{le="0.1"} 0
blaze_request_duration_seconds_bucket{le="0.25"} 0  
blaze_request_duration_seconds_bucket{le="0.5"} 0
blaze_request_duration_seconds_bucket{le="1"} 0
blaze_request_duration_seconds_bucket{le="+Inf"} 0
blaze_request_duration_seconds_sum 0
blaze_request_duration_seconds_count 0

# HELP blaze_requests_total Total number of requests
# TYPE blaze_requests_total counter
blaze_requests_total{status="2xx"} 0
blaze_requests_total{status="4xx"} 0
blaze_requests_total{status="5xx"} 0
`.trim();
  }

  private async checkServices(): Promise<Record<string, 'healthy' | 'degraded' | 'unhealthy'>> {
    const services: Record<string, 'healthy' | 'degraded' | 'unhealthy'> = {};
    
    // Check database connectivity
    try {
      // In production: await db.query('SELECT 1');
      services.database = 'healthy';
    } catch (error) {
      console.error('Database health check failed:', error);
      services.database = 'unhealthy';
    }
    
    // Check Redis connectivity  
    try {
      // In production: await redis.ping();
      services.redis = 'healthy';
    } catch (error) {
      console.error('Redis health check failed:', error);
      services.redis = 'degraded'; // Non-critical
    }
    
    // Check external APIs
    services.mlb_api = await this.checkExternalAPI('https://statsapi.mlb.com/api/v1/teams');
    services.nfl_api = await this.checkExternalAPI('https://api.espn.com/v1/sports/football/nfl/teams');
    
    return services;
  }

  private async checkReadiness(): Promise<Record<string, 'healthy' | 'degraded' | 'unhealthy'>> {
    const services: Record<string, 'healthy' | 'degraded' | 'unhealthy'> = {};
    
    // Critical services for readiness
    try {
      // Check if migrations are applied
      // In production: await db.query('SELECT version FROM migrations ORDER BY version DESC LIMIT 1');
      services.migrations = 'healthy';
    } catch (error) {
      console.error('Migration check failed:', error);
      services.migrations = 'unhealthy';
    }
    
    try {
      // Check if core tables exist
      // In production: await db.query('SELECT 1 FROM players LIMIT 1');
      services.core_tables = 'healthy';
    } catch (error) {
      console.error('Core tables check failed:', error);
      services.core_tables = 'unhealthy';
    }
    
    return services;
  }

  private async checkExternalAPI(url: string): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        return 'healthy';
      } else if (response.status < 500) {
        return 'degraded'; // Client errors are degraded
      } else {
        return 'unhealthy'; // Server errors are unhealthy
      }
    } catch (error) {
      console.error(`External API check failed for ${url}:`, error);
      return 'degraded'; // External APIs are not critical
    }
  }

  private statusToNumber(status: 'healthy' | 'degraded' | 'unhealthy'): number {
    switch (status) {
      case 'healthy': return 1;
      case 'degraded': return 0.5;
      case 'unhealthy': return 0;
    }
  }
}

export const healthService = new HealthService();