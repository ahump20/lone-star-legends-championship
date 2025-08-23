import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

// Lead validation schema
const LeadSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  sport: z.enum(['baseball', 'football', 'basketball', 'multi-sport']).optional(),
  teamSize: z.enum(['1-10', '11-50', '51-200', '200+']).optional(),
  currentSpend: z.number().min(0).optional(),
  message: z.string().max(1000).optional(),
  source: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional()
});

// ROI Calculator
class ROICalculator {
  constructor() {
    this.competitorPricing = {
      hudl: {
        assist: 8000,
        pro: 15000,
        elite: 25000
      },
      synergy: {
        basic: 12000,
        advanced: 20000,
        enterprise: 35000
      },
      krossover: {
        standard: 10000,
        premium: 18000
      }
    };
    
    this.blazePricing = {
      starter: 1188,
      professional: 2988,
      enterprise: 4988
    };
  }

  calculate(currentSpend, teamSize) {
    // Ensure savings stay within 67-80% range per canon
    const minSavings = 0.67;
    const maxSavings = 0.80;
    
    // Calculate based on team size and current spend
    let traditionalCost = currentSpend || 15000;
    let blazeCost = this.blazePricing.professional;
    
    if (teamSize === '1-10') {
      blazeCost = this.blazePricing.starter;
    } else if (teamSize === '51-200' || teamSize === '200+') {
      blazeCost = this.blazePricing.enterprise;
    }
    
    // Calculate savings percentage
    let savingsPercent = (traditionalCost - blazeCost) / traditionalCost;
    
    // Clamp to canon range
    if (savingsPercent < minSavings) {
      savingsPercent = minSavings;
    } else if (savingsPercent > maxSavings) {
      savingsPercent = maxSavings;
    }
    
    const annualSavings = Math.round(traditionalCost * savingsPercent);
    
    return {
      traditionalCost,
      blazeCost,
      annualSavings,
      savingsPercent: Math.round(savingsPercent * 100),
      monthlyBlazePrice: Math.round(blazeCost / 12),
      breakEvenDays: Math.round((blazeCost / annualSavings) * 365),
      fiveYearSavings: annualSavings * 5
    };
  }
}

// HubSpot Integration
class HubSpotIntegration {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.hubapi.com';
  }

  async createContact(lead) {
    if (!this.apiKey) {
      console.log('HubSpot API key not configured, skipping');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            email: lead.email,
            firstname: lead.name.split(' ')[0],
            lastname: lead.name.split(' ').slice(1).join(' ') || '',
            company: lead.company || '',
            phone: lead.phone || '',
            hs_lead_status: 'NEW',
            lead_source: lead.source || 'Website',
            sport_interest: lead.sport || '',
            team_size: lead.teamSize || '',
            current_spend: lead.currentSpend || 0,
            message: lead.message || ''
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('HubSpot integration error:', error);
      return null;
    }
  }

  async createDeal(contactId, roi) {
    if (!this.apiKey || !contactId) return null;

    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            dealname: `Blaze Intelligence - ${roi.blazeCost}`,
            amount: roi.blazeCost,
            dealstage: 'appointmentscheduled',
            pipeline: 'default',
            annual_savings: roi.annualSavings,
            savings_percentage: roi.savingsPercent
          },
          associations: [
            {
              to: { id: contactId },
              types: [{ 
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 3
              }]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HubSpot Deal API error: ${response.status}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('HubSpot deal creation error:', error);
      return null;
    }
  }
}

// Initialize Hono app
const app = new Hono();

// Apply CORS
app.use('*', cors());

// Initialize services
const roiCalculator = new ROICalculator();

// POST /api/leads
app.post('/api/leads', async (c) => {
  const { env } = c;
  
  try {
    // Validate request body
    const body = await c.req.json();
    const lead = LeadSchema.parse(body);
    
    // Calculate ROI
    const roi = roiCalculator.calculate(lead.currentSpend, lead.teamSize);
    
    // Store in D1 database
    if (env.DB) {
      const result = await env.DB.prepare(`
        INSERT INTO leads (
          name, email, company, phone, sport, team_size, 
          current_spend, message, source, utm_source, utm_medium, 
          utm_campaign, roi_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        lead.name,
        lead.email,
        lead.company || null,
        lead.phone || null,
        lead.sport || null,
        lead.teamSize || null,
        lead.currentSpend || null,
        lead.message || null,
        lead.source || 'direct',
        lead.utmSource || null,
        lead.utmMedium || null,
        lead.utmCampaign || null,
        JSON.stringify(roi),
        new Date().toISOString()
      ).run();
      
      lead.id = result.meta.last_row_id;
    }
    
    // Create in HubSpot if configured
    let hubspotContactId = null;
    let hubspotDealId = null;
    
    if (env.HUBSPOT_API_KEY) {
      const hubspot = new HubSpotIntegration(env.HUBSPOT_API_KEY);
      hubspotContactId = await hubspot.createContact(lead);
      
      if (hubspotContactId) {
        hubspotDealId = await hubspot.createDeal(hubspotContactId, roi);
      }
    }
    
    // Send notification email if configured
    if (env.NOTIFICATION_EMAIL) {
      await sendNotificationEmail(env, lead, roi);
    }
    
    // Return success response
    return c.json({
      success: true,
      leadId: lead.id,
      roi,
      hubspot: {
        contactId: hubspotContactId,
        dealId: hubspotDealId
      },
      message: 'Thank you! We\'ll be in touch within 24 hours.'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, 400);
    }
    
    console.error('Lead capture error:', error);
    return c.json({
      success: false,
      error: 'Failed to process lead'
    }, 500);
  }
});

// GET /api/leads/roi
app.get('/api/leads/roi', async (c) => {
  const currentSpend = parseInt(c.req.query('spend') || '15000');
  const teamSize = c.req.query('size') || '11-50';
  
  const roi = roiCalculator.calculate(currentSpend, teamSize);
  
  return c.json({
    ...roi,
    comparison: {
      hudl: roiCalculator.competitorPricing.hudl,
      synergy: roiCalculator.competitorPricing.synergy,
      krossover: roiCalculator.competitorPricing.krossover,
      blaze: roiCalculator.blazePricing
    }
  });
});

// GET /api/leads/stats
app.get('/api/leads/stats', async (c) => {
  const { env } = c;
  
  if (!env.DB) {
    return c.json({ error: 'Database not configured' }, 500);
  }
  
  try {
    // Get lead statistics
    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(DISTINCT DATE(created_at)) as days_active,
        AVG(current_spend) as avg_current_spend,
        COUNT(CASE WHEN sport = 'football' THEN 1 END) as football_leads,
        COUNT(CASE WHEN sport = 'basketball' THEN 1 END) as basketball_leads,
        COUNT(CASE WHEN sport = 'baseball' THEN 1 END) as baseball_leads
      FROM leads
      WHERE created_at > datetime('now', '-30 days')
    `).first();
    
    // Get conversion funnel
    const funnel = await env.DB.prepare(`
      SELECT 
        source,
        COUNT(*) as count,
        AVG(CAST(json_extract(roi_data, '$.annualSavings') AS REAL)) as avg_savings
      FROM leads
      WHERE created_at > datetime('now', '-30 days')
      GROUP BY source
      ORDER BY count DESC
    `).all();
    
    return c.json({
      summary: stats,
      funnel: funnel.results,
      period: 'last_30_days',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Helper function to send notification emails
async function sendNotificationEmail(env, lead, roi) {
  if (!env.SENDGRID_API_KEY) return;
  
  const emailContent = `
    New Lead Captured!
    
    Name: ${lead.name}
    Email: ${lead.email}
    Company: ${lead.company || 'Not provided'}
    Phone: ${lead.phone || 'Not provided'}
    Sport: ${lead.sport || 'Not specified'}
    Team Size: ${lead.teamSize || 'Not specified'}
    Current Spend: $${lead.currentSpend || 'Not provided'}
    
    ROI Analysis:
    - Potential Annual Savings: $${roi.annualSavings}
    - Savings Percentage: ${roi.savingsPercent}%
    - Recommended Plan: $${roi.blazeCost}/year
    
    Message:
    ${lead.message || 'No message provided'}
    
    Source: ${lead.source || 'Direct'}
    UTM: ${lead.utmSource || 'none'} / ${lead.utmMedium || 'none'} / ${lead.utmCampaign || 'none'}
  `;
  
  try {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: env.NOTIFICATION_EMAIL }]
        }],
        from: { email: 'leads@blaze-intelligence.com' },
        subject: `New Lead: ${lead.name} - $${roi.annualSavings} opportunity`,
        content: [{
          type: 'text/plain',
          value: emailContent
        }]
      })
    });
  } catch (error) {
    console.error('Email notification error:', error);
  }
}

// Health check
app.get('/api/leads/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '1.0.0',
    features: {
      validation: true,
      roiCalculation: true,
      hubspotIntegration: !!c.env.HUBSPOT_API_KEY,
      emailNotifications: !!c.env.SENDGRID_API_KEY,
      database: !!c.env.DB
    },
    timestamp: new Date().toISOString()
  });
});

export default app;