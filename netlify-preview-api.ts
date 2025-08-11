// netlify/functions/game-api.mts
// Preview environment API layer - Austin orchestration
// Bridges GitHub Pages static assets with dynamic edge capabilities

import type { Context, Config } from "@netlify/functions";

interface GameConfig {
  cloudflareWorkerUrl: string;
  huggingFaceApiKey?: string;
  notionApiKey?: string;
}

interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/.netlify/functions/game-api', '');
  
  // Feature flags for A/B testing mechanics
  const featureFlags: FeatureFlag[] = [
    { name: 'dynamic_npcs', enabled: true, rolloutPercentage: 50 },
    { name: 'ai_quest_generation', enabled: false },
    { name: 'community_voting', enabled: true },
  ];

  // CORS for local development
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token, X-Preview-Mode',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    switch (true) {
      // Feature flag endpoint for A/B testing
      case path === '/features' && req.method === 'GET':
        return handleFeatureFlags(req, featureFlags, corsHeaders);
      
      // AI-powered NPC dialogue (HuggingFace integration)
      case path === '/ai/npc-dialogue' && req.method === 'POST':
        return handleNPCDialogue(req, context, corsHeaders);
      
      // Community feedback collection (Notion integration)
      case path === '/feedback' && req.method === 'POST':
        return handleFeedback(req, context, corsHeaders);
      
      // Preview-specific analytics
      case path === '/analytics/preview' && req.method === 'POST':
        return handlePreviewAnalytics(req, context, corsHeaders);
      
      // Proxy to Cloudflare Worker for production features
      case path.startsWith('/api/'):
        return proxyToCloudflare(req, context, corsHeaders);
      
      default:
        return new Response('Not Found', { 
          status: 404, 
          headers: corsHeaders 
        });
    }
  } catch (error) {
    console.error('Preview API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

async function handleFeatureFlags(
  req: Request, 
  flags: FeatureFlag[], 
  corsHeaders: Record<string, string>
): Promise<Response> {
  const sessionToken = req.headers.get('X-Session-Token');
  
  // Determine which features are enabled for this session
  const enabledFeatures = flags.filter(flag => {
    if (!flag.enabled) return false;
    
    if (flag.rolloutPercentage) {
      // Use session token for consistent A/B assignment
      const hash = sessionToken ? 
        Array.from(sessionToken).reduce((acc, char) => acc + char.charCodeAt(0), 0) : 
        Math.random() * 100;
      return (hash % 100) < flag.rolloutPercentage;
    }
    
    return true;
  });

  return new Response(JSON.stringify({ features: enabledFeatures }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleNPCDialogue(
  req: Request, 
  context: Context, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { npcName, playerContext, dialogueHistory } = await req.json();
  
  // Check if AI features are enabled
  const apiKey = Netlify.env.get('HUGGINGFACE_API_KEY');
  if (!apiKey) {
    // Fallback to static dialogue
    return new Response(JSON.stringify({
      dialogue: getStaticDialogue(npcName),
      source: 'static'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Call HuggingFace model for dynamic dialogue
    const prompt = buildNPCPrompt(npcName, playerContext, dialogueHistory);
    
    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.8,
          top_p: 0.9,
        }
      })
    });

    const result = await response.json();
    
    return new Response(JSON.stringify({
      dialogue: result[0]?.generated_text || getStaticDialogue(npcName),
      source: 'ai',
      npc: npcName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('AI dialogue error:', error);
    // Graceful fallback
    return new Response(JSON.stringify({
      dialogue: getStaticDialogue(npcName),
      source: 'static_fallback'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleFeedback(
  req: Request, 
  context: Context, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { category, message, playerInfo, sessionData } = await req.json();
  
  const notionApiKey = Netlify.env.get('NOTION_API_KEY');
  const databaseId = Netlify.env.get('NOTION_FEEDBACK_DB_ID');
  
  if (!notionApiKey || !databaseId) {
    // Store locally for later processing
    console.log('Feedback stored locally:', { category, message, playerInfo });
    return new Response(JSON.stringify({ 
      success: true, 
      method: 'local_storage' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Send to Notion database
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          'Category': { 
            select: { name: category } 
          },
          'Message': {
            rich_text: [{
              text: { content: message }
            }]
          },
          'Player ID': {
            rich_text: [{
              text: { content: playerInfo?.id || 'anonymous' }
            }]
          },
          'Timestamp': {
            date: { start: new Date().toISOString() }
          },
          'Session Data': {
            rich_text: [{
              text: { content: JSON.stringify(sessionData) }
            }]
          }
        }
      })
    });

    const result = await response.json();
    
    return new Response(JSON.stringify({ 
      success: true, 
      method: 'notion',
      id: result.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Notion feedback error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to store feedback' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handlePreviewAnalytics(
  req: Request, 
  context: Context, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  const eventData = await req.json();
  
  // Add preview-specific metadata
  const enrichedEvent = {
    ...eventData,
    environment: 'preview',
    branch: context.params?.branch || 'main',
    deployId: context.deploy?.id,
    timestamp: new Date().toISOString(),
  };

  // Store in Netlify's analytics or forward to your analytics service
  console.log('Preview analytics:', enrichedEvent);

  return new Response(JSON.stringify({ 
    tracked: true,
    environment: 'preview'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function proxyToCloudflare(
  req: Request, 
  context: Context, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  const cloudflareUrl = Netlify.env.get('CLOUDFLARE_WORKER_URL');
  
  if (!cloudflareUrl) {
    return new Response('Cloudflare worker not configured', {
      status: 503,
      headers: corsHeaders
    });
  }

  // Forward request to Cloudflare Worker
  const url = new URL(req.url);
  const proxyUrl = `${cloudflareUrl}${url.pathname}${url.search}`;
  
  const response = await fetch(proxyUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // Return proxied response
  return new Response(response.body, {
    status: response.status,
    headers: {
      ...corsHeaders,
      ...Object.fromEntries(response.headers.entries())
    }
  });
}

// Helper functions
function getStaticDialogue(npcName: string): string {
  const dialogues: Record<string, string[]> = {
    'Sheriff_McGraw': [
      "This town ain't big enough for troublemakers, partner.",
      "Keep your wits about you. Strange things happening lately.",
      "The frontier rewards the bold, but punishes the reckless."
    ],
    'Merchant_Sally': [
      "Got the finest supplies this side of the Rio Grande!",
      "Trade's been slow since the troubles started.",
      "You look like you could use some provisions, friend."
    ],
    'Mysterious_Stranger': [
      "Some legends are better left undiscovered...",
      "The championship you seek comes with a price.",
      "I've seen many try. Few understand the true game."
    ]
  };

  const lines = dialogues[npcName] || ["..."];
  return lines[Math.floor(Math.random() * lines.length)];
}

function buildNPCPrompt(
  npcName: string, 
  playerContext: any, 
  history: any[]
): string {
  return `You are ${npcName}, an NPC in the game "Lone Star Legends Championship", a Texas frontier mythology game. 

Player context: Level ${playerContext.level}, ${playerContext.achievements?.length || 0} achievements.
Recent dialogue: ${history?.slice(-2).map(h => h.text).join(' ')}

Respond in character with a single line of dialogue (max 20 words) that fits the Texas frontier setting. Be mysterious, helpful, or challenging based on the character name.

${npcName}:`;
}

export const config: Config = {
  path: [
    "/game-api/*",
    "/game-api"
  ]
};