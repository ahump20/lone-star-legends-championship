/**
 * Notion CMS Integration for Blaze Intelligence
 * Fetches and manages content from Notion database
 */

export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace('/api/cms', '');

    try {
        switch (request.method) {
            case 'GET':
                return await handleGet(path, url.searchParams, env, headers);
            case 'POST':
                return await handlePost(path, request, env, headers);
            case 'PUT':
                return await handlePut(path, request, env, headers);
            case 'DELETE':
                return await handleDelete(path, env, headers);
            default:
                return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                    status: 405,
                    headers
                });
        }
    } catch (error) {
        console.error('CMS API error:', error);
        return new Response(JSON.stringify({
            error: 'CMS operation failed',
            message: error.message
        }), {
            status: 500,
            headers
        });
    }
}

async function handleGet(path, params, env, headers) {
    // Check cache first
    const cacheKey = `cms:${path}:${params.toString()}`;
    if (env.CACHE) {
        const cached = await env.CACHE.get(cacheKey);
        if (cached) {
            return new Response(cached, {
                headers: { ...headers, 'X-Cache': 'HIT' }
            });
        }
    }

    // Route based on path
    if (path === '/pages' || path === '') {
        return await getAllPages(env, headers, cacheKey);
    } else if (path.startsWith('/page/')) {
        const pageId = path.replace('/page/', '');
        return await getPage(pageId, env, headers, cacheKey);
    } else if (path === '/blog') {
        return await getBlogPosts(params, env, headers, cacheKey);
    } else if (path.startsWith('/blog/')) {
        const slug = path.replace('/blog/', '');
        return await getBlogPost(slug, env, headers, cacheKey);
    } else if (path === '/research') {
        return await getResearchPapers(env, headers, cacheKey);
    } else if (path === '/sync') {
        return await syncContent(env, headers);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers
    });
}

async function getAllPages(env, headers, cacheKey) {
    if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
        return new Response(JSON.stringify({
            error: 'Notion configuration missing'
        }), {
            status: 500,
            headers
        });
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filter: {
                property: 'Status',
                select: {
                    equals: 'Published'
                }
            },
            sorts: [
                {
                    property: 'Order',
                    direction: 'ascending'
                }
            ]
        })
    });

    const data = await response.json();
    
    // Transform Notion data to simplified format
    const pages = data.results.map(page => ({
        id: page.id,
        title: getProperty(page, 'Title'),
        slug: getProperty(page, 'Slug'),
        type: getProperty(page, 'Type'),
        description: getProperty(page, 'Description'),
        hero: getProperty(page, 'Hero'),
        order: getProperty(page, 'Order'),
        lastEdited: page.last_edited_time,
        url: `/page/${getProperty(page, 'Slug')}`
    }));

    const result = JSON.stringify({ pages, total: pages.length });

    // Cache for 5 minutes
    if (env.CACHE) {
        await env.CACHE.put(cacheKey, result, { expirationTtl: 300 });
    }

    return new Response(result, {
        headers: { ...headers, 'X-Cache': 'MISS' }
    });
}

async function getPage(pageSlug, env, headers, cacheKey) {
    // First get the page metadata
    const pagesResponse = await fetch(`https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filter: {
                property: 'Slug',
                rich_text: {
                    equals: pageSlug
                }
            }
        })
    });

    const pagesData = await pagesResponse.json();
    
    if (pagesData.results.length === 0) {
        return new Response(JSON.stringify({ error: 'Page not found' }), {
            status: 404,
            headers
        });
    }

    const page = pagesData.results[0];
    
    // Get the page content
    const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${page.id}/children?page_size=100`, {
        headers: {
            'Authorization': `Bearer ${env.NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28'
        }
    });

    const blocksData = await blocksResponse.json();
    
    // Transform blocks to HTML/Markdown
    const content = await transformBlocks(blocksData.results);

    const pageData = {
        id: page.id,
        title: getProperty(page, 'Title'),
        slug: getProperty(page, 'Slug'),
        type: getProperty(page, 'Type'),
        description: getProperty(page, 'Description'),
        hero: getProperty(page, 'Hero'),
        content,
        lastEdited: page.last_edited_time,
        metadata: {
            author: getProperty(page, 'Author'),
            tags: getProperty(page, 'Tags'),
            category: getProperty(page, 'Category')
        }
    };

    const result = JSON.stringify(pageData);

    // Cache for 5 minutes
    if (env.CACHE) {
        await env.CACHE.put(cacheKey, result, { expirationTtl: 300 });
    }

    return new Response(result, {
        headers: { ...headers, 'X-Cache': 'MISS' }
    });
}

async function getBlogPosts(params, env, headers, cacheKey) {
    const limit = parseInt(params.get('limit') || '10');
    const offset = parseInt(params.get('offset') || '0');
    const category = params.get('category');
    const tag = params.get('tag');

    let filter = {
        and: [
            {
                property: 'Status',
                select: { equals: 'Published' }
            },
            {
                property: 'Type',
                select: { equals: 'Blog' }
            }
        ]
    };

    if (category) {
        filter.and.push({
            property: 'Category',
            select: { equals: category }
        });
    }

    if (tag) {
        filter.and.push({
            property: 'Tags',
            multi_select: { contains: tag }
        });
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filter,
            sorts: [
                {
                    property: 'PublishDate',
                    direction: 'descending'
                }
            ],
            page_size: limit,
            start_cursor: offset > 0 ? undefined : undefined // Would need cursor pagination
        })
    });

    const data = await response.json();
    
    const posts = data.results.map(page => ({
        id: page.id,
        title: getProperty(page, 'Title'),
        slug: getProperty(page, 'Slug'),
        excerpt: getProperty(page, 'Excerpt'),
        author: getProperty(page, 'Author'),
        publishDate: getProperty(page, 'PublishDate'),
        category: getProperty(page, 'Category'),
        tags: getProperty(page, 'Tags'),
        coverImage: getProperty(page, 'CoverImage'),
        readTime: getProperty(page, 'ReadTime'),
        url: `/blog/${getProperty(page, 'Slug')}`
    }));

    const result = JSON.stringify({ 
        posts, 
        total: posts.length,
        hasMore: data.has_more,
        nextCursor: data.next_cursor
    });

    // Cache for 5 minutes
    if (env.CACHE) {
        await env.CACHE.put(cacheKey, result, { expirationTtl: 300 });
    }

    return new Response(result, {
        headers: { ...headers, 'X-Cache': 'MISS' }
    });
}

async function getBlogPost(slug, env, headers, cacheKey) {
    return await getPage(slug, env, headers, cacheKey);
}

async function getResearchPapers(env, headers, cacheKey) {
    const response = await fetch(`https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filter: {
                and: [
                    {
                        property: 'Status',
                        select: { equals: 'Published' }
                    },
                    {
                        property: 'Type',
                        select: { equals: 'Research' }
                    }
                ]
            },
            sorts: [
                {
                    property: 'PublishDate',
                    direction: 'descending'
                }
            ]
        })
    });

    const data = await response.json();
    
    const papers = data.results.map(page => ({
        id: page.id,
        title: getProperty(page, 'Title'),
        abstract: getProperty(page, 'Abstract'),
        authors: getProperty(page, 'Authors'),
        publishDate: getProperty(page, 'PublishDate'),
        journal: getProperty(page, 'Journal'),
        doi: getProperty(page, 'DOI'),
        keywords: getProperty(page, 'Keywords'),
        pdfUrl: getProperty(page, 'PDFUrl'),
        citations: getProperty(page, 'Citations')
    }));

    const result = JSON.stringify({ papers, total: papers.length });

    // Cache for 5 minutes
    if (env.CACHE) {
        await env.CACHE.put(cacheKey, result, { expirationTtl: 300 });
    }

    return new Response(result, {
        headers: { ...headers, 'X-Cache': 'MISS' }
    });
}

async function handlePost(path, request, env, headers) {
    const data = await request.json();
    
    if (path === '/page') {
        return await createPage(data, env, headers);
    } else if (path === '/blog') {
        return await createBlogPost(data, env, headers);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers
    });
}

async function createPage(data, env, headers) {
    const page = {
        parent: { database_id: env.NOTION_DATABASE_ID },
        properties: {
            'Title': {
                title: [{
                    text: { content: data.title }
                }]
            },
            'Slug': {
                rich_text: [{
                    text: { content: data.slug }
                }]
            },
            'Type': {
                select: { name: data.type || 'Page' }
            },
            'Status': {
                select: { name: 'Draft' }
            },
            'Description': {
                rich_text: [{
                    text: { content: data.description || '' }
                }]
            },
            'Hero': {
                rich_text: [{
                    text: { content: data.hero || '' }
                }]
            }
        },
        children: data.content ? transformContentToBlocks(data.content) : []
    };

    const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(page)
    });

    const result = await response.json();

    // Clear cache
    if (env.CACHE) {
        await clearCachePattern(env.CACHE, 'cms:*');
    }

    return new Response(JSON.stringify({
        success: true,
        pageId: result.id,
        url: result.url
    }), {
        status: 201,
        headers
    });
}

async function handlePut(path, request, env, headers) {
    const data = await request.json();
    
    if (path.startsWith('/page/')) {
        const pageId = path.replace('/page/', '');
        return await updatePage(pageId, data, env, headers);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers
    });
}

async function updatePage(pageId, data, env, headers) {
    const updates = {
        properties: {}
    };

    if (data.title) {
        updates.properties['Title'] = {
            title: [{
                text: { content: data.title }
            }]
        };
    }

    if (data.status) {
        updates.properties['Status'] = {
            select: { name: data.status }
        };
    }

    if (data.description) {
        updates.properties['Description'] = {
            rich_text: [{
                text: { content: data.description }
            }]
        };
    }

    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${env.NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    });

    const result = await response.json();

    // Clear cache
    if (env.CACHE) {
        await clearCachePattern(env.CACHE, 'cms:*');
    }

    return new Response(JSON.stringify({
        success: true,
        pageId: result.id
    }), {
        headers
    });
}

async function handleDelete(path, env, headers) {
    if (path.startsWith('/page/')) {
        const pageId = path.replace('/page/', '');
        return await deletePage(pageId, env, headers);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers
    });
}

async function deletePage(pageId, env, headers) {
    // Notion doesn't support deletion via API, so we archive instead
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${env.NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            archived: true
        })
    });

    const result = await response.json();

    // Clear cache
    if (env.CACHE) {
        await clearCachePattern(env.CACHE, 'cms:*');
    }

    return new Response(JSON.stringify({
        success: true,
        archived: true
    }), {
        headers
    });
}

async function syncContent(env, headers) {
    // Trigger a full sync of all content
    const pages = await getAllPages(env, headers, 'cms:pages');
    const blog = await getBlogPosts(new URLSearchParams({ limit: '100' }), env, headers, 'cms:blog');
    const research = await getResearchPapers(env, headers, 'cms:research');

    // Clear all cache
    if (env.CACHE) {
        await clearCachePattern(env.CACHE, 'cms:*');
    }

    return new Response(JSON.stringify({
        success: true,
        synced: {
            pages: JSON.parse(await pages.text()).total,
            blog: JSON.parse(await blog.text()).total,
            research: JSON.parse(await research.text()).total
        },
        timestamp: new Date().toISOString()
    }), {
        headers
    });
}

// Helper functions
function getProperty(page, propertyName) {
    const property = page.properties[propertyName];
    if (!property) return null;

    switch (property.type) {
        case 'title':
            return property.title[0]?.plain_text || '';
        case 'rich_text':
            return property.rich_text[0]?.plain_text || '';
        case 'select':
            return property.select?.name || null;
        case 'multi_select':
            return property.multi_select.map(s => s.name);
        case 'number':
            return property.number;
        case 'date':
            return property.date?.start || null;
        case 'url':
            return property.url;
        case 'email':
            return property.email;
        case 'phone_number':
            return property.phone_number;
        default:
            return null;
    }
}

async function transformBlocks(blocks) {
    const content = [];
    
    for (const block of blocks) {
        switch (block.type) {
            case 'paragraph':
                content.push({
                    type: 'paragraph',
                    text: block.paragraph.rich_text.map(t => t.plain_text).join('')
                });
                break;
            case 'heading_1':
                content.push({
                    type: 'h1',
                    text: block.heading_1.rich_text.map(t => t.plain_text).join('')
                });
                break;
            case 'heading_2':
                content.push({
                    type: 'h2',
                    text: block.heading_2.rich_text.map(t => t.plain_text).join('')
                });
                break;
            case 'heading_3':
                content.push({
                    type: 'h3',
                    text: block.heading_3.rich_text.map(t => t.plain_text).join('')
                });
                break;
            case 'bulleted_list_item':
                content.push({
                    type: 'bullet',
                    text: block.bulleted_list_item.rich_text.map(t => t.plain_text).join('')
                });
                break;
            case 'numbered_list_item':
                content.push({
                    type: 'number',
                    text: block.numbered_list_item.rich_text.map(t => t.plain_text).join('')
                });
                break;
            case 'code':
                content.push({
                    type: 'code',
                    language: block.code.language,
                    text: block.code.rich_text.map(t => t.plain_text).join('')
                });
                break;
            case 'image':
                content.push({
                    type: 'image',
                    url: block.image.file?.url || block.image.external?.url,
                    caption: block.image.caption.map(t => t.plain_text).join('')
                });
                break;
            case 'quote':
                content.push({
                    type: 'quote',
                    text: block.quote.rich_text.map(t => t.plain_text).join('')
                });
                break;
            case 'divider':
                content.push({ type: 'divider' });
                break;
        }
    }
    
    return content;
}

function transformContentToBlocks(content) {
    // Transform simplified content format back to Notion blocks
    if (typeof content === 'string') {
        return [{
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [{
                    type: 'text',
                    text: { content }
                }]
            }
        }];
    }
    
    return content.map(item => {
        switch (item.type) {
            case 'paragraph':
                return {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{
                            type: 'text',
                            text: { content: item.text }
                        }]
                    }
                };
            case 'h1':
                return {
                    object: 'block',
                    type: 'heading_1',
                    heading_1: {
                        rich_text: [{
                            type: 'text',
                            text: { content: item.text }
                        }]
                    }
                };
            // Add more transformations as needed
            default:
                return null;
        }
    }).filter(Boolean);
}

async function clearCachePattern(cache, pattern) {
    // Cloudflare KV doesn't support pattern deletion
    // Would need to maintain a list of keys or use a different strategy
    // For now, just clear specific known keys
    const keys = [
        'cms:pages',
        'cms:blog',
        'cms:research'
    ];
    
    for (const key of keys) {
        await cache.delete(key);
    }
}