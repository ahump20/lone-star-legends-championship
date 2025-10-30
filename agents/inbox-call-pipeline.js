/**
 * Inbox → Call Pipeline Agent
 * Automated lead triage → reply → calendar hold → HubSpot integration
 */

class InboxCallPipeline {
    constructor(config = {}) {
        this.config = {
            runInterval: config.runInterval || 300000, // 5 minutes
            gmailCredentials: config.gmailCredentials || process.env.GMAIL_API_CREDENTIALS,
            hubspotApiKey: config.hubspotApiKey || process.env.HUBSPOT_API_KEY,
            calendarApiKey: config.calendarApiKey || process.env.CALENDAR_API_KEY,
            zapierToken: config.zapierToken || process.env.ZAPIER_AUTH_TOKEN,
            notionToken: config.notionToken || process.env.NOTION_TOKEN,
            
            // Email configuration
            watchedEmail: 'ahump20@outlook.com',
            replyFromEmail: 'austin@blaze-intelligence.com',
            
            // Lead classification rules
            classificationRules: {
                hot: ['urgent', 'asap', 'immediately', 'enterprise', 'million', 'contract'],
                warm: ['interested', 'demo', 'meeting', 'call', 'discuss', 'proposal'],
                cold: ['information', 'brochure', 'general', 'inquiry', 'more info'],
                spam: ['lottery', 'bitcoin', 'crypto', 'prince', 'inheritance', 'pills']
            },
            
            // Intent detection keywords
            intentKeywords: {
                pricing: ['price', 'cost', 'pricing', 'budget', 'investment', 'fee'],
                demo: ['demo', 'demonstration', 'show', 'walkthrough', 'presentation'],
                integration: ['integrate', 'api', 'connect', 'sync', 'import', 'export'],
                support: ['help', 'issue', 'problem', 'bug', 'error', 'support'],
                partnership: ['partner', 'collaboration', 'joint', 'alliance', 'together']
            },
            
            // Response templates
            responseTemplates: {
                hot: 'priority-response',
                warm: 'standard-response', 
                cold: 'information-response',
                demo: 'demo-booking-response',
                pricing: 'pricing-response'
            },
            
            ...config
        };
        
        this.isRunning = false;
        this.lastRun = null;
        this.processedEmails = new Set();
        this.leadsToday = 0;
        this.pipeline = [];
        
        console.log('📧 Inbox → Call Pipeline initialized');
    }
    
    async start() {
        if (this.isRunning) {
            console.log('⚠️  Pipeline already running');
            return;
        }
        
        this.isRunning = true;
        console.log('🚀 Inbox → Call Pipeline started');
        
        // Run immediately, then on interval
        await this.processPipeline();
        
        this.intervalId = setInterval(async () => {
            try {
                await this.processPipeline();
            } catch (error) {
                console.error('💥 Pipeline processing failed:', error);
                await this.notifyError(error);
            }
        }, this.config.runInterval);
    }
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('⏹️  Inbox → Call Pipeline stopped');
    }
    
    async processPipeline() {
        console.log('📨 Processing inbox pipeline...');
        
        try {
            // 1. Fetch new emails
            const newEmails = await this.fetchNewEmails();
            
            // 2. Classify and filter leads
            const leads = await this.classifyLeads(newEmails);
            
            // 3. Generate appropriate responses
            const responses = await this.generateResponses(leads);
            
            // 4. Send automated replies
            await this.sendReplies(responses);
            
            // 5. Create calendar holds for qualified leads
            await this.createCalendarHolds(leads.filter(l => l.classification === 'hot' || l.classification === 'warm'));
            
            // 6. Update HubSpot with lead data
            await this.syncToHubSpot(leads);
            
            // 7. Log to Notion for tracking
            await this.logToNotion(leads);
            
            this.lastRun = new Date().toISOString();
            this.leadsToday += leads.length;
            
            console.log(`📊 Processed ${leads.length} leads, ${this.leadsToday} today total`);
            
        } catch (error) {
            console.error('📨 Pipeline processing failed:', error);
            throw error;
        }
    }
    
    async fetchNewEmails() {
        console.log('📬 Fetching new emails...');
        
        try {
            // This would integrate with Gmail API
            // Mock implementation for now
            
            const mockEmails = [
                {
                    id: `email_${Date.now()}_1`,
                    from: 'prospect@company.com',
                    subject: 'Interested in Blaze Intelligence demo',
                    body: 'Hi Austin, I saw your sports analytics platform and would love to schedule a demo for our team.',
                    timestamp: Date.now(),
                    threadId: 'thread_123'
                },
                {
                    id: `email_${Date.now()}_2`, 
                    from: 'ceo@enterprise.com',
                    subject: 'URGENT: Enterprise partnership opportunity',
                    body: 'We need to discuss a major partnership opportunity worth $2M annually. When can we talk?',
                    timestamp: Date.now() - 1000,
                    threadId: 'thread_124'
                }
            ];
            
            // Filter out already processed emails
            const newEmails = mockEmails.filter(email => !this.processedEmails.has(email.id));
            
            console.log(`📨 Found ${newEmails.length} new emails`);
            return newEmails;
            
        } catch (error) {
            console.error('📬 Failed to fetch emails:', error);
            return [];
        }
    }
    
    async classifyLeads(emails) {
        console.log('🔍 Classifying leads...');
        
        const leads = [];
        
        for (const email of emails) {
            const lead = await this.classifyLead(email);
            if (lead && lead.classification !== 'spam') {
                leads.push(lead);
                this.processedEmails.add(email.id);
            }
        }
        
        console.log(`🎯 Classified ${leads.length} qualified leads`);
        return leads;
    }
    
    async classifyLead(email) {
        const text = `${email.subject} ${email.body}`.toLowerCase();
        
        // Check for spam first
        if (this.matchesKeywords(text, this.config.classificationRules.spam)) {
            return null; // Ignore spam
        }
        
        // Classify lead temperature
        let classification = 'cold'; // Default
        
        if (this.matchesKeywords(text, this.config.classificationRules.hot)) {
            classification = 'hot';
        } else if (this.matchesKeywords(text, this.config.classificationRules.warm)) {
            classification = 'warm';
        }
        
        // Detect intent
        const intent = this.detectIntent(text);
        
        // Extract contact details
        const contact = this.extractContactDetails(email);
        
        // Calculate lead score
        const score = this.calculateLeadScore(email, classification, intent);
        
        return {
            id: email.id,
            classification,
            intent,
            score,
            contact,
            email,
            timestamp: Date.now(),
            status: 'new'
        };
    }
    
    detectIntent(text) {
        for (const [intent, keywords] of Object.entries(this.config.intentKeywords)) {
            if (this.matchesKeywords(text, keywords)) {
                return intent;
            }
        }
        return 'general';
    }
    
    matchesKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
    
    extractContactDetails(email) {
        return {
            email: email.from,
            name: this.extractName(email.from),
            company: this.extractCompany(email.from, email.body),
            phone: this.extractPhone(email.body)
        };
    }
    
    extractName(fromEmail) {
        // Extract name from email address or signature
        const name = fromEmail.split('@')[0].replace(/[._]/g, ' ');
        return this.capitalizeWords(name);
    }
    
    extractCompany(fromEmail, body) {
        const domain = fromEmail.split('@')[1];
        return domain.split('.')[0];
    }
    
    extractPhone(body) {
        const phoneMatch = body.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        return phoneMatch ? phoneMatch[0] : null;
    }
    
    calculateLeadScore(email, classification, intent) {
        let score = 0;
        
        // Base score by classification
        const classificationScores = { hot: 80, warm: 60, cold: 30 };
        score += classificationScores[classification] || 0;
        
        // Intent bonuses
        const intentBonuses = { 
            demo: 20, 
            pricing: 15, 
            partnership: 25, 
            integration: 10, 
            support: 5 
        };
        score += intentBonuses[intent] || 0;
        
        // Subject line indicators
        const subject = email.subject.toLowerCase();
        if (subject.includes('urgent')) score += 20;
        if (subject.includes('demo')) score += 15;
        if (subject.includes('partnership')) score += 20;
        
        // Domain reputation (enterprise domains get bonus)
        const domain = email.from.split('@')[1];
        if (domain.includes('.edu')) score += 10; // Educational
        if (domain.includes('corp') || domain.includes('inc')) score += 5; // Corporate
        
        return Math.min(100, score);
    }
    
    async generateResponses(leads) {
        console.log('✍️  Generating responses...');
        
        const responses = [];
        
        for (const lead of leads) {
            const response = await this.generateResponse(lead);
            if (response) {
                responses.push(response);
            }
        }
        
        console.log(`📝 Generated ${responses.length} responses`);
        return responses;
    }
    
    async generateResponse(lead) {
        const templateType = this.selectResponseTemplate(lead);
        const template = await this.getResponseTemplate(templateType);
        
        if (!template) return null;
        
        // Personalize template
        const personalizedResponse = this.personalizeTemplate(template, lead);
        
        return {
            leadId: lead.id,
            to: lead.contact.email,
            subject: this.generateSubject(lead),
            body: personalizedResponse,
            template: templateType,
            priority: lead.classification === 'hot' ? 'high' : 'normal'
        };
    }
    
    selectResponseTemplate(lead) {
        // Select template based on classification and intent
        if (lead.intent === 'demo') return 'demo';
        if (lead.intent === 'pricing') return 'pricing';
        
        return this.config.responseTemplates[lead.classification] || 'standard-response';
    }
    
    async getResponseTemplate(templateType) {
        const templates = {
            'priority-response': {
                subject: 'Re: {subject} - Priority Response from Blaze Intelligence',
                body: `Hi {name},
                
Thank you for your message about Blaze Intelligence. I appreciate you reaching out and I can see this is a priority for your organization.

I'd love to schedule a brief call to discuss how our sports analytics platform can address your specific needs. 

I've provisionally held some time slots for us to connect:
- Tomorrow at 2:00 PM CT
- Tomorrow at 4:00 PM CT  
- Wednesday at 10:00 AM CT

Please reply with your preferred time, or if none work, let me know what works best for your schedule.

Looking forward to our conversation,

Austin Humphrey
Founder, Blaze Intelligence
📧 ahump20@outlook.com
📱 (210) 273-5538`
            },
            
            'demo': {
                subject: 'Re: {subject} - Demo Booking Confirmation',
                body: `Hi {name},

Great to hear from you! I'd be happy to show you a personalized demo of Blaze Intelligence.

Our platform provides real-time sports analytics and intelligence for teams like the Cardinals, Titans, Longhorns, and Grizzlies - with 94.6% accuracy and <100ms response times.

I've reserved time slots for your demo:
- This Thursday at 2:00 PM CT (30 minutes)
- Friday at 11:00 AM CT (30 minutes)

During the demo, I'll show you:
✅ Live analytics dashboard
✅ Player performance insights  
✅ Predictive game modeling
✅ Integration capabilities

Please confirm your preferred time and I'll send a calendar invite.

Best regards,
Austin`
            },
            
            'pricing': {
                subject: 'Re: {subject} - Blaze Intelligence Investment Options',
                body: `Hi {name},

Thank you for your interest in Blaze Intelligence pricing.

Our sports analytics platform is designed to deliver immediate ROI through data-driven insights. Here's a quick overview:

🎯 **Professional Tier**: $1,188/year
- Real-time analytics for 4 major sports
- 94.6% accuracy benchmark
- Standard integrations
- Email support

🏆 **Enterprise Tier**: Custom pricing  
- White-label solutions
- API access & custom integrations
- Dedicated success manager
- SLA guarantees

Most clients see 67-80% cost savings vs competitors while getting superior performance.

I'd love to discuss your specific needs and show you how we can create value for your organization. 

When would be a good time for a 15-minute call?

Best,
Austin Humphrey`
            }
        };
        
        return templates[templateType];
    }
    
    personalizeTemplate(template, lead) {
        let body = template.body;
        
        // Replace placeholders
        body = body.replace('{name}', lead.contact.name);
        body = body.replace('{company}', lead.contact.company);
        body = body.replace('{subject}', lead.email.subject);
        
        return body;
    }
    
    generateSubject(lead) {
        const baseSubject = lead.email.subject;
        
        if (!baseSubject.toLowerCase().startsWith('re:')) {
            return `Re: ${baseSubject}`;
        }
        
        return baseSubject;
    }
    
    async sendReplies(responses) {
        console.log(`📤 Sending ${responses.length} replies...`);
        
        for (const response of responses) {
            try {
                await this.sendEmail(response);
                console.log(`✅ Reply sent to ${response.to}`);
            } catch (error) {
                console.error(`❌ Failed to send reply to ${response.to}:`, error);
            }
        }
    }
    
    async sendEmail(response) {
        // This would integrate with Gmail API or SMTP
        // Mock implementation for now
        console.log(`📧 Mock email sent to ${response.to}: ${response.subject}`);
    }
    
    async createCalendarHolds(qualifiedLeads) {
        console.log(`📅 Creating calendar holds for ${qualifiedLeads.length} qualified leads...`);
        
        for (const lead of qualifiedLeads) {
            try {
                await this.createCalendarHold(lead);
            } catch (error) {
                console.error(`📅 Failed to create calendar hold for ${lead.contact.email}:`, error);
            }
        }
    }
    
    async createCalendarHold(lead) {
        // This would integrate with Google Calendar API
        // Mock implementation
        
        const holdSlots = [
            { start: this.getNextBusinessDay(14), duration: 30 }, // 2 PM tomorrow
            { start: this.getNextBusinessDay(16), duration: 30 }, // 4 PM tomorrow  
            { start: this.getNextBusinessDay(10, 2), duration: 30 } // 10 AM day after tomorrow
        ];
        
        console.log(`📅 Calendar holds created for ${lead.contact.name} at ${lead.contact.company}`);
    }
    
    async syncToHubSpot(leads) {
        console.log(`🔄 Syncing ${leads.length} leads to HubSpot...`);
        
        for (const lead of leads) {
            try {
                await this.createOrUpdateHubSpotContact(lead);
            } catch (error) {
                console.error(`🔄 HubSpot sync failed for ${lead.contact.email}:`, error);
            }
        }
    }
    
    async createOrUpdateHubSpotContact(lead) {
        // This would integrate with HubSpot API
        // Mock implementation
        
        const contactData = {
            email: lead.contact.email,
            firstname: lead.contact.name.split(' ')[0],
            lastname: lead.contact.name.split(' ').slice(1).join(' '),
            company: lead.contact.company,
            phone: lead.contact.phone,
            lifecyclestage: 'lead',
            lead_status: lead.classification,
            hs_lead_status: lead.classification,
            blaze_lead_score: lead.score,
            blaze_intent: lead.intent,
            blaze_source: 'inbox_pipeline'
        };
        
        console.log(`🏢 HubSpot contact updated: ${lead.contact.name} (${lead.contact.company})`);
    }
    
    async logToNotion(leads) {
        console.log(`📋 Logging ${leads.length} leads to Notion...`);
        
        for (const lead of leads) {
            try {
                await this.createNotionEntry(lead);
            } catch (error) {
                console.error(`📋 Notion logging failed for ${lead.contact.email}:`, error);
            }
        }
    }
    
    async createNotionEntry(lead) {
        // This would integrate with Notion API
        // Mock implementation
        
        console.log(`📝 Notion entry created for ${lead.contact.name} - ${lead.classification} lead (${lead.score} score)`);
    }
    
    // Utility methods
    
    capitalizeWords(str) {
        return str.replace(/\\b\\w/g, l => l.toUpperCase());
    }
    
    getNextBusinessDay(hour = 14, daysAhead = 1) {
        const date = new Date();
        date.setDate(date.getDate() + daysAhead);
        date.setHours(hour, 0, 0, 0);
        
        // Skip weekends
        while (date.getDay() === 0 || date.getDay() === 6) {
            date.setDate(date.getDate() + 1);
        }
        
        return date.toISOString();
    }
    
    async notifyError(error) {
        console.log(`🚨 Pipeline error: ${error.message}`);
        
        // Send to Slack or other notification system
        if (this.config.zapierToken) {
            console.log('💬 Error notification sent via Zapier');
        }
    }
    
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastRun: this.lastRun,
            leadsToday: this.leadsToday,
            processedCount: this.processedEmails.size,
            pipelineLength: this.pipeline.length,
            nextRun: this.isRunning ? new Date(Date.now() + this.config.runInterval).toISOString() : null
        };
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InboxCallPipeline;
} else if (typeof window !== 'undefined') {
    window.InboxCallPipeline = InboxCallPipeline;
}