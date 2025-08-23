/**
 * Blaze Intelligence Lead Capture & CRM Integration
 * HubSpot integration with intelligent lead scoring
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }
    
    switch (url.pathname) {
      case '/api/lead-capture':
        return handleLeadCapture(request, env);
      case '/api/lead-score':
        return handleLeadScoring(request, env);
      case '/api/contact-form':
        return handleContactForm(request, env);
      default:
        return new Response('Lead capture endpoint not found', { status: 404 });
    }
  }
};

async function handleLeadCapture(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const leadData = await request.json();
    
    // Validate required fields
    if (!leadData.email) {
      return new Response('Email is required', { status: 400 });
    }
    
    // Enrich lead data
    const enrichedLead = {
      ...leadData,
      timestamp: new Date().toISOString(),
      source: 'blaze-intelligence.com',
      ip: request.headers.get('cf-connecting-ip'),
      country: request.headers.get('cf-ipcountry'),
      userAgent: request.headers.get('user-agent'),
      leadScore: calculateLeadScore(leadData),
      sessionId: request.headers.get('x-session-id') || generateSessionId()
    };
    
    // Send to HubSpot
    const hubspotResult = await sendToHubSpot(enrichedLead, env);
    
    // Store in database
    if (env.LEADS_KV) {
      const key = `lead:${enrichedLead.email}:${Date.now()}`;
      await env.LEADS_KV.put(key, JSON.stringify(enrichedLead));
    }
    
    // Send notification email
    await sendNotificationEmail(enrichedLead, env);
    
    // Trigger automated sequence
    await triggerEmailSequence(enrichedLead, env);
    
    return new Response(JSON.stringify({
      success: true,
      leadId: hubspotResult.leadId || enrichedLead.sessionId,
      leadScore: enrichedLead.leadScore,
      nextSteps: getNextSteps(enrichedLead)
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
    
  } catch (error) {
    console.error('Lead capture error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleContactForm(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const formData = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'message'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        return new Response(`${field} is required`, { status: 400 });
      }
    }
    
    // Create contact record
    const contact = {
      ...formData,
      timestamp: new Date().toISOString(),
      source: 'contact-form',
      ip: request.headers.get('cf-connecting-ip'),
      country: request.headers.get('cf-ipcountry'),
      priority: determinePriority(formData),
      category: categorizeInquiry(formData.message)
    };
    
    // Send to CRM
    await sendToHubSpot(contact, env);
    
    // Send immediate response email
    await sendAutoResponse(contact, env);
    
    // Create internal ticket
    await createInternalTicket(contact, env);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Thank you for your inquiry. We\'ll respond within 24 hours.',
      ticketId: contact.timestamp,
      estimatedResponse: calculateResponseTime(contact)
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleLeadScoring(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const data = await request.json();
    const score = calculateAdvancedLeadScore(data);
    
    return new Response(JSON.stringify({
      success: true,
      leadScore: score.total,
      breakdown: score.breakdown,
      category: score.category,
      recommendations: score.recommendations
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
    
  } catch (error) {
    console.error('Lead scoring error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function sendToHubSpot(leadData, env) {
  if (!env.HUBSPOT_API_KEY) {
    console.warn('HubSpot API key not configured');
    return { success: false };
  }
  
  try {
    const hubspotPayload = {
      properties: {
        email: leadData.email,
        firstname: leadData.firstName || leadData.name?.split(' ')[0],
        lastname: leadData.lastName || leadData.name?.split(' ')[1],
        company: leadData.company,
        phone: leadData.phone,
        website: leadData.website,
        lead_source: leadData.source,
        lead_score: leadData.leadScore.toString(),
        country: leadData.country,
        lifecycle_stage: determineLifecycleStage(leadData),
        blaze_engagement_score: leadData.engagementScore?.toString() || '0',
        sports_focus: leadData.sportsInterest || 'General',
        budget_range: leadData.budgetRange,
        timeline: leadData.timeline,
        pain_points: leadData.painPoints?.join(', '),
        custom_notes: leadData.message || leadData.notes
      }
    };
    
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(hubspotPayload)
    });
    
    if (response.ok) {
      const result = await response.json();
      return { success: true, leadId: result.id };
    } else {
      console.error('HubSpot API error:', response.status, await response.text());
      return { success: false };
    }
    
  } catch (error) {
    console.error('HubSpot integration error:', error);
    return { success: false };
  }
}

async function sendNotificationEmail(leadData, env) {
  if (!env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured');
    return;
  }
  
  try {
    const emailPayload = {
      personalizations: [{
        to: [{ email: 'ahump20@outlook.com', name: 'Austin Humphrey' }],
        subject: `🔥 New Blaze Intelligence Lead: ${leadData.email} (Score: ${leadData.leadScore})`
      }],
      from: {
        email: 'noreply@blaze-intelligence.com',
        name: 'Blaze Intelligence'
      },
      content: [{
        type: 'text/html',
        value: generateLeadNotificationHTML(leadData)
      }]
    };
    
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });
    
  } catch (error) {
    console.error('Email notification error:', error);
  }
}

async function triggerEmailSequence(leadData, env) {
  // Trigger automated email sequence based on lead score and category
  const sequence = determineEmailSequence(leadData);
  
  // Store sequence trigger for processing
  if (env.EMAIL_QUEUE) {
    const queueItem = {
      email: leadData.email,
      sequence: sequence,
      leadScore: leadData.leadScore,
      triggerTime: Date.now(),
      status: 'pending'
    };
    
    await env.EMAIL_QUEUE.put(
      `seq:${leadData.email}:${Date.now()}`,
      JSON.stringify(queueItem)
    );
  }
}

function calculateLeadScore(leadData) {
  let score = 0;
  
  // Email domain scoring
  if (leadData.email?.includes('@')) {
    const domain = leadData.email.split('@')[1];
    if (['gmail.com', 'yahoo.com', 'hotmail.com'].includes(domain)) {
      score += 10; // Personal email
    } else {
      score += 25; // Business email
    }
  }
  
  // Company information
  if (leadData.company) score += 20;
  if (leadData.title?.includes('director') || leadData.title?.includes('manager')) score += 15;
  if (leadData.title?.includes('ceo') || leadData.title?.includes('president')) score += 25;
  
  // Budget and timeline
  if (leadData.budgetRange) {
    if (leadData.budgetRange.includes('100k+')) score += 30;
    else if (leadData.budgetRange.includes('50k')) score += 20;
    else if (leadData.budgetRange.includes('25k')) score += 15;
  }
  
  if (leadData.timeline) {
    if (leadData.timeline.includes('immediate')) score += 25;
    else if (leadData.timeline.includes('3 months')) score += 20;
    else if (leadData.timeline.includes('6 months')) score += 15;
  }
  
  // Sports industry relevance
  if (leadData.industry?.includes('sports')) score += 30;
  if (leadData.sportsInterest?.length > 0) score += 15;
  
  return Math.min(score, 100); // Cap at 100
}

function calculateAdvancedLeadScore(data) {
  const breakdown = {
    demographic: 0,
    behavioral: 0,
    firmographic: 0,
    engagement: 0
  };
  
  // Demographic scoring
  if (data.email?.includes('@')) {
    const domain = data.email.split('@')[1];
    breakdown.demographic += domain.includes('.edu') ? 15 : 10;
  }
  
  // Behavioral scoring
  if (data.pageViews > 5) breakdown.behavioral += 20;
  if (data.timeOnSite > 300) breakdown.behavioral += 15; // 5+ minutes
  if (data.downloadedContent) breakdown.behavioral += 25;
  
  // Firmographic scoring
  if (data.company) breakdown.firmographic += 20;
  if (data.companySize === 'enterprise') breakdown.firmographic += 30;
  if (data.industry === 'sports') breakdown.firmographic += 25;
  
  // Engagement scoring
  if (data.emailOpens > 3) breakdown.engagement += 20;
  if (data.formSubmissions > 1) breakdown.engagement += 25;
  if (data.championGamePlayed) breakdown.engagement += 30;
  
  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  
  return {
    total: Math.min(total, 100),
    breakdown,
    category: total > 70 ? 'hot' : total > 40 ? 'warm' : 'cold',
    recommendations: generateRecommendations(total, breakdown)
  };
}

function generateRecommendations(score, breakdown) {
  const recs = [];
  
  if (score > 70) {
    recs.push('Priority lead - schedule demo within 24 hours');
    recs.push('Assign to senior account executive');
  } else if (score > 40) {
    recs.push('Nurture with targeted content');
    recs.push('Schedule follow-up in 3-5 days');
  } else {
    recs.push('Add to long-term nurture campaign');
    recs.push('Focus on educational content');
  }
  
  if (breakdown.engagement < 10) {
    recs.push('Increase engagement with interactive content');
  }
  
  return recs;
}

function determineLifecycleStage(leadData) {
  if (leadData.leadScore > 70) return 'sales_qualified_lead';
  if (leadData.leadScore > 40) return 'marketing_qualified_lead';
  return 'lead';
}

function determinePriority(formData) {
  if (formData.urgency === 'immediate') return 'high';
  if (formData.budgetRange?.includes('100k+')) return 'high';
  if (formData.title?.includes('ceo')) return 'high';
  return 'medium';
}

function categorizeInquiry(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('demo') || lowerMessage.includes('trial')) {
    return 'demo_request';
  }
  if (lowerMessage.includes('pricing') || lowerMessage.includes('cost')) {
    return 'pricing_inquiry';
  }
  if (lowerMessage.includes('integration') || lowerMessage.includes('api')) {
    return 'technical_inquiry';
  }
  if (lowerMessage.includes('partnership') || lowerMessage.includes('collaborate')) {
    return 'partnership';
  }
  
  return 'general_inquiry';
}

function calculateResponseTime(contact) {
  const hours = contact.priority === 'high' ? 4 : 24;
  const responseTime = new Date(Date.now() + (hours * 60 * 60 * 1000));
  return responseTime.toISOString();
}

function determineEmailSequence(leadData) {
  if (leadData.leadScore > 70) return 'high_value_sequence';
  if (leadData.leadScore > 40) return 'nurture_sequence';
  return 'educational_sequence';
}

function generateLeadNotificationHTML(leadData) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color: #FF6B35;">🔥 New Blaze Intelligence Lead</h2>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Lead Information</h3>
        <p><strong>Email:</strong> ${leadData.email}</p>
        <p><strong>Name:</strong> ${leadData.name || 'Not provided'}</p>
        <p><strong>Company:</strong> ${leadData.company || 'Not provided'}</p>
        <p><strong>Lead Score:</strong> ${leadData.leadScore}/100</p>
        <p><strong>Source:</strong> ${leadData.source}</p>
        <p><strong>Country:</strong> ${leadData.country || 'Unknown'}</p>
      </div>
      
      <div style="background: #e8f4ff; padding: 20px; border-radius: 8px;">
        <h3>Next Steps</h3>
        ${getNextSteps(leadData).map(step => `<p>• ${step}</p>`).join('')}
      </div>
      
      <p style="margin-top: 30px; color: #666;">
        Generated by Blaze Intelligence Lead Capture System<br>
        ${new Date().toLocaleString()}
      </p>
    </div>
  `;
}

function getNextSteps(leadData) {
  const steps = [];
  
  if (leadData.leadScore > 70) {
    steps.push('Schedule demo call within 24 hours');
    steps.push('Send personalized welcome package');
    steps.push('Assign to senior account executive');
  } else if (leadData.leadScore > 40) {
    steps.push('Add to nurture campaign');
    steps.push('Send relevant case studies');
    steps.push('Follow up in 3-5 business days');
  } else {
    steps.push('Add to educational email sequence');
    steps.push('Send Blaze Intelligence overview materials');
    steps.push('Monitor engagement for 30 days');
  }
  
  return steps;
}

async function sendAutoResponse(contact, env) {
  // Implementation would send automated response email
  console.log('Auto-response sent to:', contact.email);
}

async function createInternalTicket(contact, env) {
  // Implementation would create internal support ticket
  console.log('Internal ticket created for:', contact.email);
}

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID'
  };
}

function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders()
  });
}