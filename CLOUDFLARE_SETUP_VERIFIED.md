# ✅ Blaze Intelligence — Verified Endpoints & Setup (Aug 20, 2025)

## 0) Tooling & Auth
- Install & auth Wrangler:
  ```bash
  npm i -D wrangler@latest
  npx wrangler login
  ```

- Astro build + Pages deploy (static SSG):
  ```bash
  npm run build
  npx wrangler pages deploy ./dist
  ```
  (Use the Cloudflare adapter for Astro only if you later add SSR/Functions.)

## 1) Cloudflare Data Plane

### D1 (serverless SQL)
```bash
npx wrangler d1 create blaze-db      # capture UUID
# wrangler.toml (Worker):
# [[d1_databases]]
# binding = "DB"
# database_name = "blaze-db"
# database_id = "<UUID from create>"

# Schema apply (local + remote):
npx wrangler d1 execute blaze-db --file ./schema.sql
npx wrangler d1 execute blaze-db --file ./schema.sql --remote
```

### Workers KV (cache/sessions/analytics)
```bash
npx wrangler kv:namespace create CACHE
npx wrangler kv:namespace create SESSIONS
npx wrangler kv:namespace create ANALYTICS

# wrangler.toml bindings
# [[kv_namespaces]] binding="CACHE"     id="<CACHE_ID>"
# [[kv_namespaces]] binding="SESSIONS"  id="<SESSIONS_ID>"
# [[kv_namespaces]] binding="ANALYTICS" id="<ANALYTICS_ID>"
```

### Durable Objects (multiplayer WebSocket)
- Implement a DO class and expose `/ws` using **native DO WebSocket API** (hibernation-friendly)
- One room per game instance; persist inning/score/pitch count in DO state

## 2) External Sports APIs — Minimal, Documented Routes

### MLB (no key) — MLB Stats API
- Base: `https://statsapi.mlb.com/api/`
- Teams: `/v1/teams?sportId=1`
- Team roster: `/v1/teams/{teamId}/roster`
- Schedule: `/v1/schedule?teamId={teamId}&season={year}`

### NFL (licensed) — SportsDataIO
- Base: see NFL docs
- Auth: header **`Ocp-Apim-Subscription-Key: {key}`** (or query param)
- Example: `/v3/nfl/scores/json/Teams`

### NCAA Football (free tier) — CollegeFootballData
- Base: `https://api.collegefootballdata.com/`
- Auth: header **`Authorization: Bearer <CFBD_KEY>`**

### Sportradar MLB v8 (licensed)
- Use API map → schedule/date feeds → hydrate game/team/player endpoints per v8 docs

## 3) Worker Routes (index.js) — Copy/Paste Scaffolds

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // MLB (Stats API)
    if (url.pathname === '/api/mlb/teams') {
      const r = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1');
      return new Response(await r.text(), { headers: { 'content-type': 'application/json' }});
    }
    if (url.pathname.startsWith('/api/mlb/teams/') && url.pathname.endsWith('/roster')) {
      const teamId = url.pathname.split('/')[4];
      const r = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster`);
      return new Response(await r.text(), { headers: { 'content-type': 'application/json' }});
    }

    // NFL (SportsDataIO)
    if (url.pathname === '/api/nfl/teams') {
      const r = await fetch('https://api.sportsdata.io/v3/nfl/scores/json/Teams', {
        headers: { 'Ocp-Apim-Subscription-Key': env.SPORTSDATAIO_KEY }
      });
      return new Response(await r.text(), { headers: { 'content-type': 'application/json' }});
    }

    // NCAA (CollegeFootballData)
    if (url.pathname === '/api/cfb/teams') {
      const r = await fetch('https://api.collegefootballdata.com/teams', {
        headers: { Authorization: `Bearer ${env.CFBD_KEY}` }
      });
      return new Response(await r.text(), { headers: { 'content-type': 'application/json' }});
    }

    // health
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ ok: true, ts: new Date().toISOString() }), {
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
}
```

## 4) Environment Variables (Dashboard → Worker → Settings → Variables)
- `SPORTSDATAIO_KEY` (NFL)
- `CFBD_KEY` (CollegeFootballData)
- `SPORTRADAR_KEY` (if using Sportradar)
- Keep all secrets out of git; use `wrangler secret put` only when needed

## 5) DNS + Domain (Cloudflare Pages)
- Pages → your project → **Custom domains** → add `blaze-intelligence.com` and `www.blaze-intelligence.com`
- Or external DNS:
  ```
  blaze-intelligence.com           CNAME  <your>.pages.dev
  www.blaze-intelligence.com       CNAME  <your>.pages.dev
  ```
- SSL: Full (strict); enable Always Use HTTPS & Automatic HTTPS Rewrites
- Verify:
  ```bash
  dig blaze-intelligence.com
  curl -I https://blaze-intelligence.com
  openssl s_client -connect blaze-intelligence.com:443 -servername blaze-intelligence.com < /dev/null
  ```

## 6) Multiplayer Checklist
- DO class with native WebSocket hibernation
- Route `/ws` → new DurableObjectStub per game room
- Persist inning/outs/score in DO state; broadcast on change

## 7) Commits & CI
- Conventional commits only (`feat:`, `fix:`, `chore:`)
- Do NOT commit secrets. Keep `.env.example` up to date

---

## Implementation Status

### ✅ Completed
- [x] API endpoints created (teams, players, health)
- [x] Game engine with 9-inning simulation
- [x] Multiplayer WebSocket/Durable Objects structure
- [x] Theme applied (navy #0A0E27, orange #FF6B35)
- [x] Cardinals readiness.json data pipeline
- [x] Export functionality for game stats

### 🔄 In Progress
- [ ] D1 database setup for persistent storage
- [ ] KV namespaces for caching
- [ ] API key configuration in environment

### 📝 Next Steps
1. Configure API keys in Cloudflare dashboard
2. Set up D1 database with schema
3. Create KV namespaces for caching
4. Add domain DNS records
5. Enable SSL/HTTPS settings

---

## Quick Deploy Commands

```bash
# Build and deploy
npm run build
npx wrangler pages deploy . --project-name=blaze-intelligence

# Check deployment
curl https://blaze-intelligence.pages.dev/api/health

# View logs
npx wrangler pages tail blaze-intelligence
```