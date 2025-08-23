/**
 * Blaze Intelligence Content Management System
 * Notion CMS integration with automated publishing
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }
    
    switch (url.pathname) {
      case '/api/cms/sync':
        return handleContentSync(request, env);
      case '/api/cms/publish':
        return handleContentPublish(request, env);
      case '/api/cms/content':
        return handleContentRetrieve(request, env);
      case '/api/cms/webhook':
        return handleNotionWebhook(request, env);
      default:
        return new Response('CMS endpoint not found', { status: 404 });
    }
  }
};

async function handleContentSync(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    // Sync content from Notion database
    const content = await syncFromNotion(env);
    
    // Store in KV for fast access
    if (env.CONTENT_KV) {
      await env.CONTENT_KV.put('content_index', JSON.stringify(content));
      
      // Store individual pages
      for (const page of content.pages) {
        await env.CONTENT_KV.put(`page:${page.slug}`, JSON.stringify(page));
      }
    }
    
    // Trigger site rebuild
    await triggerSiteRebuild(env);
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      syncedPages: content.pages.length,
      syncedPosts: content.posts.length
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
    
  } catch (error) {
    console.error('Content sync error:', error);
    return new Response('Sync failed', { status: 500 });
  }
}

async function handleContentPublish(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const { contentId, action } = await request.json();
    
    if (action === 'publish') {
      await publishContent(contentId, env);
    } else if (action === 'unpublish') {
      await unpublishContent(contentId, env);
    }
    
    return new Response(JSON.stringify({
      success: true,
      action: action,
      contentId: contentId,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
    
  } catch (error) {
    console.error('Content publish error:', error);
    return new Response('Publish failed', { status: 500 });
  }
}

async function handleContentRetrieve(request, env) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const type = url.searchParams.get('type') || 'all';
    
    let content;
    
    if (slug) {
      // Get specific content by slug
      content = await getContentBySlug(slug, env);
    } else {
      // Get all content of specified type
      content = await getAllContent(type, env);
    }
    
    return new Response(JSON.stringify({
      success: true,
      content: content,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300',
        ...getCORSHeaders()
      }
    });
    
  } catch (error) {
    console.error('Content retrieve error:', error);
    return new Response('Retrieval failed', { status: 500 });
  }
}

async function handleNotionWebhook(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const webhookData = await request.json();
    
    // Verify webhook signature if configured
    if (env.NOTION_WEBHOOK_SECRET) {
      const signature = request.headers.get('x-notion-signature');
      if (!verifyWebhookSignature(webhookData, signature, env.NOTION_WEBHOOK_SECRET)) {
        return new Response('Invalid signature', { status: 401 });
      }
    }
    
    // Process webhook event
    await processNotionWebhook(webhookData, env);
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Notion webhook error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
}

async function syncFromNotion(env) {
  if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
    throw new Error('Notion configuration not found');
  }
  
  const pages = await fetchNotionPages(env);
  const posts = await fetchNotionPosts(env);
  
  return {
    pages: pages.map(transformNotionPage),
    posts: posts.map(transformNotionPost),
    lastSync: new Date().toISOString()
  };
}

async function fetchNotionPages(env) {
  const response = await fetch(`https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify({
      filter: {
        property: 'Type',
        select: {
          equals: 'Page'
        }
      },
      sorts: [{
        property: 'Last edited time',
        direction: 'descending'
      }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Notion API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results;
}

async function fetchNotionPosts(env) {
  const response = await fetch(`https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify({
      filter: {
        property: 'Type',
        select: {
          equals: 'Post'
        }
      },
      sorts: [{
        property: 'Published Date',
        direction: 'descending'
      }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Notion API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results;
}

function transformNotionPage(notionPage) {
  const properties = notionPage.properties;
  
  return {
    id: notionPage.id,
    slug: extractPlainText(properties.Slug?.rich_text),
    title: extractPlainText(properties.Title?.title),
    type: extractSelect(properties.Type?.select),
    status: extractSelect(properties.Status?.select),
    hero: extractPlainText(properties.Hero?.rich_text),
    body: extractPlainText(properties.Body?.rich_text),
    cta: extractPlainText(properties.CTA?.rich_text),
    metaTitle: extractPlainText(properties['Meta Title']?.rich_text),
    metaDescription: extractPlainText(properties['Meta Description']?.rich_text),
    lastModified: notionPage.last_edited_time,
    createdTime: notionPage.created_time
  };
}

function transformNotionPost(notionPost) {
  const properties = notionPost.properties;
  
  return {
    id: notionPost.id,
    slug: extractPlainText(properties.Slug?.rich_text),
    title: extractPlainText(properties.Title?.title),
    excerpt: extractPlainText(properties.Excerpt?.rich_text),
    content: extractPlainText(properties.Content?.rich_text),
    author: extractPlainText(properties.Author?.rich_text),
    category: extractSelect(properties.Category?.select),
    tags: extractMultiSelect(properties.Tags?.multi_select),
    publishedDate: extractDate(properties['Published Date']?.date),
    status: extractSelect(properties.Status?.select),
    featuredImage: extractFile(properties['Featured Image']?.files),
    lastModified: notionPost.last_edited_time,
    createdTime: notionPost.created_time
  };
}

function extractPlainText(richText) {
  if (!richText || !Array.isArray(richText)) return '';
  return richText.map(text => text.plain_text).join('');
}

function extractSelect(select) {
  return select?.name || '';
}

function extractMultiSelect(multiSelect) {
  if (!multiSelect || !Array.isArray(multiSelect)) return [];
  return multiSelect.map(item => item.name);
}

function extractDate(date) {
  return date?.start || null;
}

function extractFile(files) {
  if (!files || !Array.isArray(files) || files.length === 0) return null;
  return files[0].file?.url || files[0].external?.url || null;
}

async function publishContent(contentId, env) {
  // Update content status to published
  if (env.CONTENT_KV) {
    const content = await env.CONTENT_KV.get(`page:${contentId}`);
    if (content) {
      const parsed = JSON.parse(content);
      parsed.status = 'published';
      parsed.publishedAt = new Date().toISOString();
      await env.CONTENT_KV.put(`page:${contentId}`, JSON.stringify(parsed));
    }
  }
  
  // Trigger site rebuild
  await triggerSiteRebuild(env);
}

async function unpublishContent(contentId, env) {
  // Update content status to draft
  if (env.CONTENT_KV) {
    const content = await env.CONTENT_KV.get(`page:${contentId}`);
    if (content) {
      const parsed = JSON.parse(content);
      parsed.status = 'draft';
      parsed.unpublishedAt = new Date().toISOString();
      await env.CONTENT_KV.put(`page:${contentId}`, JSON.stringify(parsed));
    }
  }
  
  // Trigger site rebuild
  await triggerSiteRebuild(env);
}

async function getContentBySlug(slug, env) {
  if (!env.CONTENT_KV) {
    throw new Error('Content storage not configured');
  }
  
  const content = await env.CONTENT_KV.get(`page:${slug}`);
  return content ? JSON.parse(content) : null;
}

async function getAllContent(type, env) {
  if (!env.CONTENT_KV) {
    throw new Error('Content storage not configured');
  }
  
  const contentIndex = await env.CONTENT_KV.get('content_index');
  if (!contentIndex) {
    return { pages: [], posts: [] };
  }
  
  const parsed = JSON.parse(contentIndex);
  
  if (type === 'pages') return { pages: parsed.pages };
  if (type === 'posts') return { posts: parsed.posts };
  
  return parsed;
}

async function processNotionWebhook(webhookData, env) {
  // Process different types of Notion webhook events
  const { object, action } = webhookData;
  
  if (object === 'page' && ['created', 'updated'].includes(action)) {
    // Trigger content sync for page changes
    await handleContentSync({ method: 'POST' }, env);
  }
  
  // Log webhook event
  console.log('Notion webhook processed:', {
    object,
    action,
    timestamp: new Date().toISOString()
  });
}

async function triggerSiteRebuild(env) {
  // Trigger Cloudflare Pages rebuild via build hook
  if (env.BUILD_HOOK_URL) {
    try {
      await fetch(env.BUILD_HOOK_URL, { method: 'POST' });
      console.log('Site rebuild triggered');
    } catch (error) {
      console.error('Failed to trigger rebuild:', error);
    }
  }
}

function verifyWebhookSignature(payload, signature, secret) {
  // Implement webhook signature verification
  // This is a simplified version - implement proper HMAC verification in production
  return signature && secret;
}

function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders()
  });
}