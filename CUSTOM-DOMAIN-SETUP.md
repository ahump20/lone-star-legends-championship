# 🌐 Custom Domain Configuration Guide

## **baseball.blaze-intelligence.com**

### **Step 1: DNS Configuration**

Add these DNS records to your domain provider (GoDaddy, Namecheap, etc.):

```
Type: CNAME
Name: baseball
Value: blaze-og-remaster.pages.dev
TTL: Auto (or 3600)
Proxy: Yes (if using Cloudflare DNS)
```

### **Step 2: Cloudflare Pages Configuration**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **blaze-og-remaster**
3. Click **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter: `baseball.blaze-intelligence.com`
6. Click **Continue** → **Activate domain**

### **Step 3: SSL Certificate**

Cloudflare automatically provisions SSL certificates. Wait 5-10 minutes for:
- Universal SSL certificate generation
- Edge certificate deployment
- HTTPS enforcement

### **Step 4: Page Rules (Optional)**

Create these page rules for optimal performance:

```
Rule 1: Cache Everything
URL: baseball.blaze-intelligence.com/assets/*
Settings: Cache Level: Cache Everything
TTL: 1 month

Rule 2: Always HTTPS
URL: http://baseball.blaze-intelligence.com/*
Settings: Always Use HTTPS

Rule 3: Bypass Cache for API
URL: baseball.blaze-intelligence.com/api/*
Settings: Cache Level: Bypass
```

### **Step 5: Verify Configuration**

Test your domain setup:

```bash
# Check DNS propagation
dig baseball.blaze-intelligence.com

# Test HTTPS
curl -I https://baseball.blaze-intelligence.com

# Verify SSL certificate
openssl s_client -connect baseball.blaze-intelligence.com:443
```

### **Alternative Domain Providers**

#### **Vercel**
```
Type: CNAME
Name: baseball
Value: cname.vercel-dns.com
```

#### **Netlify**
```
Type: CNAME
Name: baseball
Value: blaze-og-remaster.netlify.app
```

#### **GitHub Pages**
```
Type: A
Name: baseball
Value: 185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153
```

### **Custom Domain Features**

Once configured, your domain will support:

- ✅ **Direct Access**: `https://baseball.blaze-intelligence.com`
- ✅ **Game Modes**: 
  - Quick Play: `/index.html?mode=quick`
  - Sandlot: `/index.html?mode=sandlot`
  - Season: `/index.html?mode=season`
- ✅ **PWA Install**: Add to home screen from browser
- ✅ **API Endpoints**: `/api/*` for backend services
- ✅ **WebSocket**: `wss://baseball.blaze-intelligence.com/ws`

### **Monitoring & Analytics**

Track your domain performance:

1. **Cloudflare Analytics**
   - Page views
   - Unique visitors
   - Performance metrics
   - Security events

2. **Custom Analytics**
   - Game sessions
   - Player engagement
   - Feature usage
   - Error tracking

### **Troubleshooting**

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| DNS not resolving | Wait 24-48 hours for propagation |
| SSL error | Clear browser cache, wait for cert |
| 404 errors | Check _redirects file in deployment |
| Slow loading | Enable Cloudflare caching |
| CORS issues | Update _headers file |

### **Security Headers**

Recommended security headers (add to `_headers` file):

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
```

### **Performance Optimization**

Enable these Cloudflare features:

- ✅ **Auto Minify**: HTML, CSS, JavaScript
- ✅ **Brotli Compression**: Better than gzip
- ✅ **HTTP/3 (QUIC)**: Faster protocol
- ✅ **Early Hints**: Preload critical resources
- ✅ **Rocket Loader**: Async JavaScript loading
- ✅ **Polish**: Image optimization
- ✅ **Mirage**: Lazy load images

### **Final URLs**

After configuration, your game will be accessible at:

- 🌐 **Production**: `https://baseball.blaze-intelligence.com`
- 🎮 **Multiplayer**: `wss://baseball.blaze-intelligence.com/ws`
- 📊 **Analytics**: `https://baseball.blaze-intelligence.com/analytics`
- 🏆 **Leaderboard**: `https://baseball.blaze-intelligence.com/leaderboard`
- 📱 **PWA Manifest**: `https://baseball.blaze-intelligence.com/manifest.json`

---

## 🏆 **Championship Domain Ready!**

Your custom domain will provide:
- Professional branded experience
- Enhanced SEO visibility  
- Improved performance via CDN
- Enterprise-grade security
- Analytics and monitoring

**Pattern Recognition Weaponized at baseball.blaze-intelligence.com! ⚾**