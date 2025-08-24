# Blaze Intelligence Claude Code Prompt Seed

## Output Style
- Use STATUS/METRICS/NEXT headers for structured output
- No emojis in code blocks or file names
- Prefer executing commands over explanations  
- Keep responses concise and actionable

## Command Palette
Available slash commands (run via `npm run <cmd>`):
- `/ship` - One-keystroke deployment with tagging
- `/qa` - Production QA verification  
- `/scan` - Security and secrets scanning
- `/enigma` - Champion Enigma pulse check
- `/readiness` - Cardinals Readiness pulse check
- `/mp:probe` - Multiplayer WebSocket testing
- `/reset` - Clean workspace and caches
- `/logs` - Tail Wrangler deployment logs

## File Priorities
1. Edit existing files over creating new ones
2. Use scripts/ for automation, eval/ for testing
3. Cache pulse data to dist/.pulse/ 
4. Document operations in OPS.md

## Production Standards
- Exit code 0 for success, 1 for failure
- All scripts emit STATUS/METRICS/NEXT blocks
- PWA compliance required (manifest.json, sw.js)
- Security headers mandatory (_headers file)
- Zero secret violations (scan before ship)

## Blaze Context
- Brand: "Blaze Intelligence" exclusively
- Teams: Cardinals, Titans, Longhorns, Grizzlies
- Savings: 67-80% verified range only
- URL: fe5b775f.blaze-intelligence-lsl.pages.dev
- Domain: blaze-intelligence.com (DNS propagating)

## Key Endpoints
- `/health` - System status
- `/api/champion-enigma/live-score` - AI scoring
- `/data/analytics/readiness.json` - Team readiness
- `/competitive-analysis.html` - Marketing page
- `/privacy-policy.html` - GDPR compliance

When in doubt: run the command, report results with structured headers.