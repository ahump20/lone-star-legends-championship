# Blaze Intelligence - Operator Manual

## Command Map

### Core Operations
| Command | Script | Purpose | Exit Codes |
|---------|--------|---------|------------|
| `npm run ship` | `scripts/ship.js` | Full deployment sequence | 0=success, 1=failed |
| `npm run qa` | `scripts/simple-qa-check.js` | Production verification | 0=all pass, 1=failures |
| `npm run scan` | `security-scanner.js` | Security & secrets scan | 0=clean, 1=violations |

### Monitoring & Status
| Command | Script | Purpose | Output Format |
|---------|--------|---------|---------------|
| `npm run enigma` | `scripts/enigma-pulse.js` | Champion Enigma status | Badge + cache |
| `npm run readiness` | `scripts/readiness-pulse.js` | Cardinals readiness | Badge + cache |
| `npm run mp:probe` | `scripts/test-multiplayer-connection.js` | WebSocket testing | Connection matrix |

### Infrastructure
| Command | Script | Purpose | Side Effects |
|---------|--------|---------|--------------|
| `npm run reset` | `scripts/reset-workspace.js` | Clean workspace | Deletes cache/dist |
| `npm run logs` | Built-in | Wrangler tail | Live log stream |
| `node eval/run.js --url=$URL` | `eval/run.js` | Production proofs | Validates deployment |

## Expected Outputs

### STATUS Block Format
```
STATUS:
🚀 Starting [operation name]...
✅ [Step] completed
❌ [Step] failed: [reason]
```

### METRICS Block Format  
```
METRICS:
Score: X/Y (Z%)
URL: [production-url]
Time: [ISO timestamp]
Hash: [git-commit-hash]
```

### NEXT Block Format
```
NEXT:
• [Immediate action item]
• [Follow-up command]
• [Monitoring instruction]
```

## Production URLs
- **Primary**: https://fe5b775f.blaze-intelligence-lsl.pages.dev
- **Target**: https://blaze-intelligence.com (DNS propagating)
- **Workers**: 
  - Data Pipeline: blaze-data-pipeline.humphrey-austin20.workers.dev
  - Multiplayer: lone-star-legends-multiplayer.humphrey-austin20.workers.dev

## Critical Paths

### Deployment Flow
1. `npm run scan` (security check)
2. `npm run ship` (deploy + tag)
3. `npm run qa` (verification)
4. `node eval/run.js --url=$PROD` (proofs)

### Monitoring Flow
1. `npm run enigma` (Champion score)
2. `npm run readiness` (Cardinals status)  
3. `npm run mp:probe` (multiplayer health)

### Recovery Flow
1. `npm run reset` (clean workspace)
2. `npm run logs` (check deployment)
3. `scripts/pages-domain.js` (verify domain)

## Exit Codes & Rollback

### Exit Code Standards
- `0` = Success, continue
- `1` = Failure, investigate  
- No exit code = Informational only

### Rollback Procedures
1. **Failed Deployment**: 
   - Check `npm run logs` for errors
   - Verify git working directory is clean
   - Re-run `npm run ship`

2. **Failed QA**: 
   - Run `npm run scan` for security issues
   - Check individual endpoints manually
   - Verify DNS propagation if domain issues

3. **Failed Proofs**:
   - Check PWA manifest.json exists
   - Verify _headers file has CSP/HSTS
   - Test key routes individually

## File Structure
```
├── scripts/           # Command palette automation
├── eval/             # Blaze Proofs testing
├── dist/.pulse/      # Cached status badges  
├── _headers          # Security configuration
├── manifest.json     # PWA specification
├── OPS.md           # This operator manual
└── .claude/SEED.md  # Claude prompt configuration
```

## Emergency Contacts
- **Primary**: Austin Humphrey - ahump20@outlook.com - (210) 273-5538
- **Monitoring**: Automated health checks via /health endpoint
- **Logs**: `npm run logs` for real-time Wrangler output

## Quality Gates
- Security scan must pass (0 violations)
- QA verification must pass (100% endpoints)
- Blaze Proofs must pass (PWA + headers + routes)
- DNS propagation monitored but non-blocking