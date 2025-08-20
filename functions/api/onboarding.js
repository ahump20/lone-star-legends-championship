/**
 * Client Onboarding API Endpoint
 * Handles new client registration and workspace setup
 */

export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers
        });
    }

    try {
        const data = await request.json();
        
        // Validate required fields
        if (!data.organization?.name || !data.contact?.email) {
            return new Response(JSON.stringify({ 
                error: 'Missing required fields' 
            }), {
                status: 400,
                headers
            });
        }

        // Generate client ID
        const clientId = generateClientId(data.organization.name);
        
        // Create workspace configuration
        const workspace = {
            clientId,
            createdAt: new Date().toISOString(),
            status: 'pending_setup',
            ...data,
            configuration: {
                apiKey: generateApiKey(),
                workspaceUrl: `https://blaze-intelligence.com/workspace/${clientId}`,
                features: data.features,
                integrations: data.integration,
                limits: getClientLimits(data.organization.type, data.athleteCount)
            }
        };

        // Store in database (D1 or KV)
        if (env.DB) {
            // Store in D1 database
            await env.DB.prepare(`
                INSERT INTO clients (
                    client_id, 
                    organization_name, 
                    organization_type,
                    contact_name,
                    contact_email,
                    contact_phone,
                    sports,
                    features,
                    configuration,
                    status,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                workspace.clientId,
                workspace.organization.name,
                workspace.organization.type,
                workspace.contact.name,
                workspace.contact.email,
                workspace.contact.phone || null,
                JSON.stringify(workspace.sports),
                JSON.stringify(workspace.features),
                JSON.stringify(workspace.configuration),
                workspace.status,
                workspace.createdAt
            ).run();
        }

        // Store in KV for quick access
        if (env.SESSIONS) {
            await env.SESSIONS.put(
                `client:${clientId}`,
                JSON.stringify(workspace),
                { expirationTtl: 86400 * 30 } // 30 days
            );
        }

        // Trigger async processes
        await triggerOnboardingProcesses(workspace, env);

        // Send welcome email (if SendGrid configured)
        if (env.SENDGRID_API_KEY) {
            await sendWelcomeEmail(workspace, env);
        }

        // Return success response
        return new Response(JSON.stringify({
            success: true,
            clientId,
            workspaceUrl: workspace.configuration.workspaceUrl,
            message: 'Onboarding successful. Check your email for login credentials.',
            nextSteps: [
                'Check email for login credentials',
                'Access your workspace URL',
                'Complete API integration setup',
                'Schedule training session'
            ]
        }), {
            status: 201,
            headers
        });

    } catch (error) {
        console.error('Onboarding error:', error);
        
        return new Response(JSON.stringify({
            error: 'Onboarding failed',
            message: error.message
        }), {
            status: 500,
            headers
        });
    }
}

function generateClientId(orgName) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 10);
    
    return `${slug}-${timestamp}-${random}`;
}

function generateApiKey() {
    const prefix = 'blaze_';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = prefix;
    
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return key;
}

function getClientLimits(orgType, athleteCount) {
    const baseLimits = {
        apiCallsPerMonth: 100000,
        storageGB: 10,
        users: 10,
        concurrentAnalysis: 5
    };

    // Adjust based on organization type
    const multipliers = {
        professional: 10,
        college: 5,
        club: 3,
        highschool: 2,
        agency: 5
    };

    const multiplier = multipliers[orgType] || 1;

    // Adjust based on athlete count
    const athleteMultiplier = {
        '1-50': 1,
        '51-100': 1.5,
        '101-250': 2,
        '251-500': 3,
        '500+': 5
    };

    const athleteMult = athleteMultiplier[athleteCount] || 1;

    return {
        apiCallsPerMonth: Math.floor(baseLimits.apiCallsPerMonth * multiplier * athleteMult),
        storageGB: Math.floor(baseLimits.storageGB * multiplier),
        users: Math.floor(baseLimits.users * multiplier),
        concurrentAnalysis: Math.floor(baseLimits.concurrentAnalysis * multiplier)
    };
}

async function triggerOnboardingProcesses(workspace, env) {
    const processes = [];

    // 1. Create Airtable record
    if (env.AIRTABLE_API_KEY && env.AIRTABLE_BASE_ID) {
        processes.push(createAirtableRecord(workspace, env));
    }

    // 2. Create HubSpot contact
    if (env.HUBSPOT_API_KEY) {
        processes.push(createHubSpotContact(workspace, env));
    }

    // 3. Setup Notion workspace
    if (env.NOTION_API_KEY) {
        processes.push(createNotionWorkspace(workspace, env));
    }

    // 4. Initialize analytics tracking
    if (env.ANALYTICS) {
        processes.push(env.ANALYTICS.put(
            `onboarding:${workspace.clientId}`,
            JSON.stringify({
                timestamp: new Date().toISOString(),
                organization: workspace.organization.name,
                sports: workspace.sports,
                features: workspace.features
            })
        ));
    }

    await Promise.allSettled(processes);
}

async function createAirtableRecord(workspace, env) {
    const url = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Clients`;
    
    const record = {
        fields: {
            'Client ID': workspace.clientId,
            'Organization': workspace.organization.name,
            'Type': workspace.organization.type,
            'Contact Name': workspace.contact.name,
            'Email': workspace.contact.email,
            'Phone': workspace.contact.phone || '',
            'Sports': workspace.sports.join(', '),
            'Status': 'Onboarding',
            'Created': workspace.createdAt,
            'API Key': workspace.configuration.apiKey
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ records: [record] })
    });

    return response.json();
}

async function createHubSpotContact(workspace, env) {
    const url = 'https://api.hubapi.com/crm/v3/objects/contacts';
    
    const contact = {
        properties: {
            email: workspace.contact.email,
            firstname: workspace.contact.name.split(' ')[0],
            lastname: workspace.contact.name.split(' ').slice(1).join(' '),
            phone: workspace.contact.phone,
            company: workspace.organization.name,
            blaze_client_id: workspace.clientId,
            blaze_organization_type: workspace.organization.type,
            blaze_sports: workspace.sports.join(', '),
            lifecyclestage: 'customer'
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(contact)
    });

    return response.json();
}

async function createNotionWorkspace(workspace, env) {
    const url = 'https://api.notion.com/v1/pages';
    
    const page = {
        parent: { database_id: env.NOTION_DATABASE_ID },
        properties: {
            'Client': {
                title: [{
                    text: { content: workspace.organization.name }
                }]
            },
            'Client ID': {
                rich_text: [{
                    text: { content: workspace.clientId }
                }]
            },
            'Status': {
                select: { name: 'Onboarding' }
            },
            'Contact': {
                email: workspace.contact.email
            },
            'Sports': {
                multi_select: workspace.sports.map(sport => ({ name: sport }))
            },
            'Created': {
                date: { start: workspace.createdAt }
            }
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(page)
    });

    return response.json();
}

async function sendWelcomeEmail(workspace, env) {
    const url = 'https://api.sendgrid.com/v3/mail/send';
    
    const email = {
        personalizations: [{
            to: [{ email: workspace.contact.email, name: workspace.contact.name }],
            dynamic_template_data: {
                organization_name: workspace.organization.name,
                contact_name: workspace.contact.name,
                client_id: workspace.clientId,
                api_key: workspace.configuration.apiKey,
                workspace_url: workspace.configuration.workspaceUrl,
                sports: workspace.sports.join(', ')
            }
        }],
        from: {
            email: 'welcome@blaze-intelligence.com',
            name: 'Blaze Intelligence'
        },
        template_id: 'd-blazewelcometemplate', // Would need to be created in SendGrid
        subject: `Welcome to Blaze Intelligence, ${workspace.organization.name}!`
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(email)
    });

    return response.json();
}