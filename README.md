<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Blaze Intelligence — Sports Performance, NIL & Pro‑Grade Analytics</title>
  <meta name="description" content="Blaze Intelligence unifies 3D baseball simulation, real‑time analytics, NIL valuation, and enterprise APIs. Cardinals • Titans • Longhorns • Grizzlies." />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <link rel="icon" href="/images/favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --blaze-bg: #0a0a0a;
      --blaze-panel: #111213;
      --blaze-ink: #ffffff;
      --blaze-muted: #bdbdbd;
      --blaze-orange: #FF6B35; /* Blaze burnt orange */
      --blaze-orange-2: #ff8a5c;
      --ring: rgba(255,107,53,.32);
      --radius: 14px;
      --shadow: 0 10px 30px rgba(0,0,0,.35);
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0; color: var(--blaze-ink); background: radial-gradient(1200px 600px at 20% 5%, rgba(255,107,53,.07), transparent 50%), #0a0a0a;
      font: 14.5px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    }
    a { color: var(--blaze-ink); text-decoration: none; }
    a:hover { color: var(--blaze-orange-2); }

    /* Layout */
    .wrap { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

    /* Header */
    .header {
      position: sticky; top: 0; z-index: 200;
      backdrop-filter: saturate(140%) blur(8px);
      background: linear-gradient(180deg, rgba(10,10,10,.82), rgba(10,10,10,.42));
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .nav { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 0; }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; letter-spacing: .2px; }
    .brand-mark { width: 24px; height: 24px; border-radius: 6px; background: conic-gradient(from 210deg at 50% 50%, #2d2d2d, #FF6B35 35%, #b3411e 65%, #2d2d2d 100%); box-shadow: 0 0 0 4px rgba(255,107,53,.08), 0 10px 30px rgba(0,0,0,.4); }
    .nav a { opacity: .9; }
    .nav a.btn { padding: 10px 14px; border-radius: 999px; background: linear-gradient(90deg, var(--blaze-orange), #d45a2c); border: 1px solid rgba(255,255,255,.08); box-shadow: 0 10px 20px var(--ring); font-weight: 700; }

    /* Hero */
    .hero { padding: 60px 0 24px; }
    .hero-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 28px; align-items: center; }
    .headline { font-size: clamp(28px, 4.4vw, 54px); line-height: 1.05; letter-spacing: -.5px; font-weight: 850; }
    .headline strong { background: linear-gradient(90deg, #fff, #ffd2c2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .sub { color: var(--blaze-muted); font-size: 16px; margin-top: 14px; }
    .badges { display:flex; gap:10px; margin: 18px 0 22px; flex-wrap: wrap; }
    .badge { padding: 9px 12px; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)); color:#fff; box-shadow: var(--shadow); font-weight: 600; }
    .cta { display:flex; gap:12px; flex-wrap: wrap; margin-top: 8px; }
    .cta .btn { padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,.10); box-shadow: 0 10px 24px var(--ring); font-weight: 800; letter-spacing: .2px; }
    .btn-primary { background: linear-gradient(90deg, var(--blaze-orange), #d45a2c); }
    .btn-ghost { background: rgba(255,255,255,.04); }

    .hero-card { background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02)); border: 1px solid rgba(255,255,255,.10); border-radius: var(--radius); box-shadow: var(--shadow); padding: 18px; }
    .live { display:flex; align-items:center; justify-content: space-between; gap: 10px; }
    .live .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--blaze-orange); box-shadow: 0 0 0 0 rgba(255,107,53,.55); animation: pulse 2s infinite; display: inline-block; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255,107,53,.55) } 70% { box-shadow: 0 0 0 10px rgba(255,107,53,0) } 100% { box-shadow: 0 0 0 0 rgba(255,107,53,0) } }
    .kv { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    .kv .k { font-size: 12px; color: var(--blaze-muted); text-transform: uppercase; letter-spacing: .4px; }
    .kv .v { font-family: ui-rounded, SF Pro Rounded, Inter; font-size: 28px; font-weight: 800; background: linear-gradient(90deg, #fff, #ffd2c2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

    /* Section shells */
    .section { padding: 36px 0; }
    .section h2 { font-size: clamp(20px, 3vw, 34px); margin: 0 0 12px; letter-spacing: -.2px; }
    .panel { background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02)); border: 1px solid rgba(255,255,255,.10); border-radius: var(--radius); box-shadow: var(--shadow); }
    .grid-2 { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    /* Iframe Gallery */
    .iframe-grid { display:grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 900px) { .iframe-grid { grid-template-columns: 1fr 1fr; } }
    iframe.embed { width: 100%; min-height: 360px; border: 0; border-radius: 12px; background: #0f0f10; box-shadow: var(--shadow); }
    .embed-title { display:flex; align-items:center; justify-content: space-between; gap: 10px; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,.08); }
    .embed-title a { font-size: 13px; opacity: .9; }

    /* Feature cards */
    .cards { display:grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    @media (min-width: 900px) { .cards { grid-template-columns: repeat(4, 1fr); } }
    .card { padding: 16px; border: 1px solid rgba(255,255,255,.10); border-radius: 12px; background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02)); box-shadow: var(--shadow); }
    .card .t { font-size: 12px; color: var(--blaze-muted); text-transform: uppercase; letter-spacing: .4px; }
    .card .v { font-weight: 800; font-size: 18px; margin-top: 4px; }

    /* Footer */
    .footer { margin: 44px 0 24px; padding: 16px; border-top: 1px solid rgba(255,255,255,.08); color: var(--blaze-muted); }
    .footer a { color: #fff; }

    /* Small helpers */
    .pill { display:inline-flex; gap: 8px; align-items:center; padding: 6px 10px; border-radius: 999px; border:1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.05); font-weight: 700; font-size: 12px; }
    .pill .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blaze-orange); box-shadow: 0 0 0 6px rgba(255,107,53,.16); }
    .note { color: var(--blaze-muted); font-size: 12px; }
  </style>
</head>
<body>
  <header class="header">
    <div class="wrap nav">
      <div class="brand"><span class="brand-mark"></span> Blaze Intelligence</div>
      <nav style="display:flex; gap:14px; align-items:center;">
        <a href="#demos">Demos</a>
        <a href="#dashboards">Dashboards</a>
        <a href="#engines">Engines</a>
        <a href="#capabilities">Capabilities</a>
        <a href="#platform">Platform</a>
        <a href="#contact">Contact</a>
        <a class="btn" href="/client-onboarding.html">Get Started</a>
      </nav>
    </div>
  </header>

  <main>
    <!-- HERO -->
    <section class="wrap hero">
      <div class="hero-grid">
        <div>
          <div class="pill"><span class="dot"></span> Live • Cardinals | Titans | Longhorns | Grizzlies</div>
          <h1 class="headline">Professional‑grade <strong>performance intelligence</strong> that bridges instinct and data.</h1>
          <p class="sub">3D baseball simulation, real‑time analytics, NIL valuation, and API‑first delivery — all in one blazing‑fast stack.</p>
          <div class="badges">
            <span class="badge">94.6% predictive accuracy</span>
            <span class="badge">&lt;100ms API latency</span>
            <span class="badge">67–80% cost savings</span>
            <span class="badge">$29/mo entry price</span>
          </div>
          <div class="cta">
            <a class="btn btn-primary" href="#demos">Explore Live Demos</a>
            <a class="btn btn-ghost" href="/blaze-competitive-analysis.html">Competitive Analysis</a>
          </div>
          <p class="note" style="margin-top:10px;">Benchmarks are defined in our <a href="/blaze-competitive-analysis.html#methods">Methods &amp; Definitions</a>.</p>
        </div>
        <aside class="hero-card panel">
          <div class="live"><div style="display:flex; gap:8px; align-items:center;"><span class="dot"></span><strong>Champion Enigma Engine</strong></div><span id="updated">Just now</span></div>
          <div class="kv">
            <div><div class="k">Readiness</div><div class="v" id="readiness">—</div></div>
            <div><div class="k">Leverage</div><div class="v" id="leverage">—</div></div>
          </div>
          <div class="cards" style="margin-top:12px;">
            <div class="card"><div class="t">MLB Focus</div><div class="v">Cardinals</div></div>
            <div class="card"><div class="t">NFL</div><div class="v">Titans</div></div>
            <div class="card"><div class="t">NCAA</div><div class="v">Texas Longhorns</div></div>
            <div class="card"><div class="t">NBA</div><div class="v">Grizzlies</div></div>
          </div>
        </aside>
      </div>
    </section>

    <!-- ENGINES (Core Blaze systems) -->
    <section id="engines" class="section">
      <div class="wrap">
        <h2>Engines</h2>
        <div class="grid-2">
          <div class="panel" style="padding:16px;">
            <h3 style="margin:0 0 8px;">Champion Enigma Engine™</h3>
            <div class="note" style="margin-bottom:10px;">Visual + Physiological + Psychological quantification of 8 champion traits.</div>
            <ul style="margin:0 0 12px 18px;">
              <li>Modules: Visual Cortex • Physiological Decoder • Psychological Profiler • Neural Quantification</li>
              <li>Traits: Clutch Gene • Killer Instinct • Flow State • Mental Fortress • Predator Mindset • Champion Aura • Winner DNA • Beast Mode</li>
              <li>MLB-first lab: Cardinals; also Titans/Longhorns/Grizzlies (no soccer)</li>
            </ul>
            <div class="cta">
              <a class="btn btn-ghost" href="/blaze-competitive-analysis.html#champion-enigma">Read the overview</a>
              <a class="btn btn-primary" href="#dashboards">Open dashboards</a>
            </div>
          </div>
          <div class="panel" style="padding:16px;">
            <h3 style="margin:0 0 8px;">Digital Combine™</h3>
            <div class="note" style="margin-bottom:10px;">Continuous combine from video + wearables mapped to pro benchmarks.</div>
            <ul style="margin:0 0 12px 18px;">
              <li>Video-to-metrics (swing, sprint, reaction) • Wearables ingestion • Readiness index</li>
              <li>API-first delivery; sub-100ms scoring pipelines</li>
            </ul>
            <div class="cta">
              <a class="btn btn-ghost" href="/apex-command-center.html">See APEX</a>
              <a class="btn btn-primary" href="#demos">Try the 3D demo</a>
            </div>
          </div>
        </div>
        <div class="panel" style="padding:16px; margin-top:16px;">
          <h3 style="margin:0 0 8px;">Prescriptive Scouting Engine™</h3>
          <div class="note" style="margin-bottom:10px;">Unifies NIL valuation with performance data for front-office ready recommendations.</div>
          <ul style="margin:0 0 12px 18px;">
            <li>Audit trails • Evidence maps • Draft/portal targets with confidence bands</li>
            <li>APIs: REST & GraphQL • Tooling: MCP servers for team workflows</li>
          </ul>
          <div class="cta">
            <a class="btn btn-ghost" href="/blaze-intelligence-integration-hub.html">Integration Hub</a>
            <a class="btn btn-primary" href="#contact">Book a run-through</a>
          </div>
        </div>
      </div>
    </section>

    <!-- DEMOS (Game + NIL) -->
    <section id="demos" class="section">
      <div class="wrap">
        <h2>Live Demos</h2>
        <div class="iframe-grid">
          <div class="panel">
            <div class="embed-title">
              <strong>3D Baseball — Lone Star Legends</strong>
              <a href="/blaze-swing-engine.html" target="_blank" rel="noopener">Open →</a>
            </div>
            <iframe class="embed" loading="lazy" src="/blaze-swing-engine.html" title="3D Baseball Game"></iframe>
          </div>
          <div class="panel">
            <div class="embed-title">
              <strong>NIL Valuation (APEX)</strong>
              <a href="/apex-command-center.html" target="_blank" rel="noopener">Open →</a>
            </div>
            <iframe class="embed" loading="lazy" src="/apex-command-center.html" title="NIL Dashboard"></iframe>
          </div>
        </div>
      </div>
    </section>

    <!-- DASHBOARDS (Embedded) -->
    <section id="dashboards" class="section">
      <div class="wrap">
        <h2>Operational Dashboards</h2>
        <div class="iframe-grid">
          <div class="panel">
            <div class="embed-title">
              <strong>AI Command Center</strong>
              <a href="/ai-command-center.html" target="_blank" rel="noopener">Open →</a>
            </div>
            <iframe class="embed" loading="lazy" src="/ai-command-center.html" title="AI Command Center"></iframe>
          </div>
          <div class="panel">
            <div class="embed-title">
              <strong>APEX Command Center</strong>
              <a href="/apex-command-center.html" target="_blank" rel="noopener">Open →</a>
            </div>
            <iframe class="embed" loading="lazy" src="/apex-command-center.html" title="APEX Command Center"></iframe>
          </div>
          <div class="panel">
            <div class="embed-title">
              <strong>Integration Hub</strong>
              <a href="/blaze-intelligence-integration-hub.html" target="_blank" rel="noopener">Open →</a>
            </div>
            <iframe class="embed" loading="lazy" src="/blaze-intelligence-integration-hub.html" title="Integration Hub"></iframe>
          </div>
          <div class="panel">
            <div class="embed-title">
              <strong>Competitive Analysis</strong>
              <a href="/blaze-competitive-analysis.html" target="_blank" rel="noopener">Open →</a>
            </div>
            <iframe class="embed" loading="lazy" src="/blaze-competitive-analysis.html" title="Competitive Analysis"></iframe>
          </div>
        </div>
      </div>
    </section>

    <!-- CAPABILITIES (Models & Graphics) -->
    <section id="capabilities" class="section">
      <div class="wrap">
        <h2>Capabilities</h2>
        <div class="grid-2">
          <div class="panel" style="padding:16px;">
            <h3 style="margin:0 0 8px;">Cross‑Domain Synthesis</h3>
            <ul style="margin:0 0 12px 18px;">
              <li>Multimodal: text • images • video • audio in one pass</li>
              <li>Context compression with ~1M‑token windows for codebases, scouting reports, and long video</li>
              <li>Video IQ: ask for every touch, outcome, and system pattern across a full game</li>
            </ul>
            <h3 style="margin:12px 0 8px;">Interactive Visuals</h3>
            <ul style="margin:0 0 12px 18px;">
              <li>Simulations: boids, fractals, physics‑backed drills generated to code</li>
              <li>Depth anchoring: 2D→3D coordinate mapping for AR/VR and tracking</li>
            </ul>
          </div>
          <div class="panel" style="padding:16px;">
            <h3 style="margin:0 0 8px;">Model Playbook</h3>
            <div class="cards" style="margin-bottom:12px;">
              <div class="card"><div class="t">Gemini 2.5 Pro</div><div class="v">Deep reasoning • massive context • complex coding</div></div>
              <div class="card"><div class="t">Gemini 2.5 Flash</div><div class="v">Low‑latency • high‑throughput • real‑time extraction</div></div>
            </div>
            <div class="note">Use Pro for heavy analysis and architecture; Flash for fast loops, summaries, and data extraction at scale.</div>
          </div>
        </div>
      </div>
    </section>

    <!-- PLATFORM SUMMARY -->
    <section id="platform" class="section">
      <div class="wrap">
        <h2>Platform</h2>
        <div class="grid-2">
          <div class="panel" style="padding:16px;">
            <div class="cards">
              <div class="card"><div class="t">Architecture</div><div class="v">Cloudflare Workers • Hono • D1 • KV • Durable Objects</div></div>
              <div class="card"><div class="t">APIs</div><div class="v">REST &amp; GraphQL • Sub‑100ms</div></div>
              <div class="card"><div class="t">Analytics</div><div class="v">Champion Enigma • Prescriptive Scouting</div></div>
              <div class="card"><div class="t">Coverage</div><div class="v">MLB • NFL • NCAA • NBA (no soccer)</div></div>
            </div>
            <div class="cards" style="margin-top:14px;">
              <div class="card"><div class="t">Security</div><div class="v">CSP • HTTPS • Rate‑Limits • Input Validation</div></div>
              <div class="card"><div class="t">Economics</div><div class="v">$29/mo entry • 67–80% savings vs incumbents</div></div>
              <div class="card"><div class="t">Reliability</div><div class="v">99.9% uptime SLA</div></div>
              <div class="card"><div class="t">Performance</div><div class="v">Sub‑100ms pipelines • 94.6% accuracy</div></div>
            </div>
          </div>
          <div class="panel" style="padding:0; overflow:hidden;">
            <div class="embed-title" style="position:sticky; top:0; background:rgba(0,0,0,.2); backdrop-filter: blur(6px);">
              <strong>Statistics Dashboard</strong>
              <a href="/statistics-dashboard.html" target="_blank" rel="noopener">Open →</a>
            </div>
            <iframe class="embed" loading="lazy" src="/statistics-dashboard.html" title="Statistics Dashboard"></iframe>
          </div>
        </div>
      </div>
    </section>

    <!-- CONTACT / CTA -->
    <section id="contact" class="section">
      <div class="wrap">
        <div class="panel" style="padding:18px; display:flex; flex-wrap:wrap; gap:16px; align-items:center; justify-content: space-between;">
          <div>
            <h2 style="margin:0 0 6px;">Ready to run Blaze?</h2>
            <div class="note">Install the PWA, open the dashboards, or jump into the game. We answer fast.</div>
          </div>
          <div class="cta">
            <a class="btn btn-primary" href="/client-onboarding.html">Client Onboarding</a>
            <a class="btn btn-ghost" href="mailto:ahump20@outlook.com">ahump20@outlook.com</a>
            <a class="btn btn-ghost" href="tel:+12102735538">(210) 273‑5538</a>
          </div>
        </div>
      </div>
    </section>

    <footer class="wrap footer">
      Built with ❤️ by Blaze Intelligence — Where cognitive performance meets quarterly performance™ • Labs: Cardinals, Titans, Longhorns, Grizzlies
    </footer>
  </main>

  <script>
    // Simple live tile demo (no external deps). Replace with real-time bus when ready.
    function updateLive() {
      const r = (67.3 + (Math.random() - 0.5) * 2).toFixed(2);
      const l = (2.4 + (Math.random() - 0.5) * 0.2).toFixed(2);
      document.getElementById('readiness').textContent = r;
      document.getElementById('leverage').textContent = l;
      document.getElementById('updated').textContent = new Date().toLocaleTimeString();
    }
    updateLive();
    setInterval(updateLive, 5000);

    // Smooth-scroll anchors
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const node = document.getElementById(id);
      if (node) { e.preventDefault(); node.scrollIntoView({behavior:'smooth', block:'start'}); }
    }));
  </script>
</body>
</html>