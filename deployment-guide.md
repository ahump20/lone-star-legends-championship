# Lone Star Legends Championship - Deployment Guide

## 🚀 Production Deployment Overview

Complete deployment guide for the enhanced Lone Star Legends Championship baseball simulator with advanced AI players, real-time analytics, multiplayer functionality, VR/AR compatibility, and mobile touch controls.

## 📋 System Requirements

### Production Environment
- **Node.js**: 16.0.0 or higher
- **Python**: 3.8.0 or higher
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB available space
- **Network**: Stable internet connection for CDN and API services

### Browser Support
- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+, Samsung Internet 14+
- **VR/AR**: WebXR-compatible browsers and devices

## 🏗️ Architecture Components

### Core Applications
1. **Three.js Baseball Simulator** (`claude-baseball-demo.html`)
2. **Real-Time Analytics Dashboard** (`statistics-dashboard.html`)
3. **Multiplayer WebSocket Server** (`multiplayer-server.js`)
4. **Python API Server** (`simple-api-server.py`)

### Advanced Features
- **Advanced AI Player System** (`advanced-ai-player.js`)
- **Dashboard Integration** (`dashboard-integration.js`)
- **VR/AR Compatibility Layer** (`vr-ar-compatibility.js`)
- **Mobile Touch Controls** (`mobile-touch-controls.js`)

## 🌐 Deployment Options

### Option 1: GitHub Pages (Recommended for Demo)

**Pros**: Free, automatic HTTPS, easy setup
**Cons**: Limited to static content, no server-side features

```bash
# Already configured - repository is live at:
# https://ahump20.github.io/lone-star-legends-championship/
```

**Features Available**:
- ✅ Three.js Baseball Simulator
- ✅ Advanced AI Players
- ✅ VR/AR Compatibility
- ✅ Mobile Touch Controls
- ✅ Analytics Dashboard (client-side)
- ❌ Multiplayer Server
- ❌ Python API Server

### Option 2: Full-Stack Cloud Deployment

**Recommended Platforms**:
- **Vercel** (Frontend + Serverless Functions)
- **Netlify** (Static + Edge Functions)
- **Railway** (Full-stack with databases)
- **Digital Ocean** (VPS with full control)

#### Vercel Deployment

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Configure vercel.json**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "multiplayer-server.js",
      "use": "@vercel/node"
    },
    {
      "src": "simple-api-server.py",
      "use": "@vercel/python"
    },
    {
      "src": "*.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/simple-api-server.py" },
    { "src": "/multiplayer/(.*)", "dest": "/multiplayer-server.js" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

3. **Deploy**:
```bash
vercel --prod
```

#### Railway Deployment

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
```

2. **Configure railway.json**:
```json
{
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/game-status"
  }
}
```

3. **Deploy**:
```bash
railway login
railway init
railway up
```

### Option 3: Self-Hosted VPS

**Recommended Providers**:
- Digital Ocean ($5-10/month)
- Linode ($5-10/month)
- AWS EC2 (t3.micro eligible for free tier)

#### Ubuntu 22.04 Setup Script

```bash
#!/bin/bash
# Production deployment script for Ubuntu 22.04

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.10
sudo apt install -y python3 python3-pip

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install -y nginx

# Clone repository
git clone https://github.com/ahump20/lone-star-legends-championship.git
cd lone-star-legends-championship

# Install dependencies
npm install
pip3 install flask flask-cors

# Configure PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Configure Nginx
sudo cp deployment/nginx.conf /etc/nginx/sites-available/lone-star-legends
sudo ln -s /etc/nginx/sites-available/lone-star-legends /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

echo "🚀 Deployment complete! Server running at https://yourdomain.com"
```

## 🔧 Configuration Files

### PM2 Ecosystem (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'multiplayer-server',
      script: 'multiplayer-server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8081
      }
    },
    {
      name: 'api-server',
      script: 'simple-api-server.py',
      interpreter: 'python3',
      instances: 1,
      env: {
        FLASK_ENV: 'production',
        PORT: 8080
      }
    }
  ]
};
```

### Nginx Configuration (`deployment/nginx.conf`)

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /home/ubuntu/lone-star-legends-championship;
    index claude-baseball-demo.html;

    # Static files
    location / {
        try_files $uri $uri/ =404;
        add_header Cache-Control "public, max-age=31536000";
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket multiplayer
    location /baseball-multiplayer {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

## 🚀 Performance Optimization

### CDN Integration

**Recommended CDNs**:
- Cloudflare (Free tier available)
- AWS CloudFront
- Azure CDN

#### Cloudflare Setup

1. **Sign up** at [cloudflare.com](https://cloudflare.com)
2. **Add domain** and update nameservers
3. **Enable optimizations**:
   - Auto Minify (CSS, JS, HTML)
   - Rocket Loader
   - Brotli Compression
   - Image Optimization

### Asset Optimization

```bash
# Minify JavaScript files
npx terser claude-baseball-demo.html --compress --mangle -o claude-baseball-demo.min.html

# Optimize images (if any)
npx imagemin-cli assets/*.png --out-dir=assets/optimized/

# Generate service worker for caching
npx workbox generateSW workbox-config.js
```

### Database Options (Optional)

For persistent statistics and user data:

#### MongoDB Atlas (Cloud)
```javascript
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://username:password@cluster.mongodb.net/lone-star-legends');
```

#### PostgreSQL (Self-hosted)
```python
import psycopg2
conn = psycopg2.connect(
    host="localhost",
    database="lone_star_legends",
    user="username",
    password="password"
)
```

## 📱 Mobile Deployment Considerations

### Progressive Web App (PWA) Setup

Create `manifest.json`:
```json
{
  "name": "Lone Star Legends Championship",
  "short_name": "LSL Baseball",
  "description": "Advanced Baseball Simulator with AI Players",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a4c2b",
  "theme_color": "#90EE90",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker (`sw.js`):
```javascript
const CACHE_NAME = 'lone-star-legends-v1';
const urlsToCache = [
  '/',
  '/claude-baseball-demo.html',
  '/statistics-dashboard.html',
  '/advanced-ai-player.js',
  '/mobile-touch-controls.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

## 🔒 Security Configuration

### Environment Variables

Create `.env` file:
```
NODE_ENV=production
API_SECRET_KEY=your-secret-key-here
CLAUDE_API_KEY=your-claude-api-key
DATABASE_URL=your-database-connection-string
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Security Headers

Add to Nginx configuration:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 📊 Monitoring and Analytics

### Application Monitoring

**Recommended Services**:
- Sentry (Error tracking)
- LogRocket (Session replay)
- Google Analytics 4 (Usage analytics)

### Server Monitoring

```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-server-monit

# Monitor server resources
pm2 monit
```

## 🧪 Testing in Production

### Load Testing

```bash
# Install Artillery
npm install -g artillery

# Test WebSocket connections
artillery run load-test-websocket.yml

# Test HTTP endpoints
artillery run load-test-api.yml
```

### Cross-Browser Testing

**Recommended Services**:
- BrowserStack
- Sauce Labs
- CrossBrowserTesting

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations completed
- [ ] Assets optimized and minified
- [ ] CDN configured
- [ ] Monitoring tools setup

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Performance benchmarks met
- [ ] Error tracking active
- [ ] Backup strategy implemented
- [ ] Documentation updated

## 📞 Support and Maintenance

### Backup Strategy

```bash
# Database backup (if using PostgreSQL)
pg_dump lone_star_legends > backup-$(date +%Y%m%d).sql

# File backup
tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/application

# Automated backup script
echo "0 2 * * * /path/to/backup-script.sh" | crontab -
```

### Update Process

```bash
# 1. Backup current version
pm2 save

# 2. Pull latest changes
git pull origin main

# 3. Install dependencies
npm install

# 4. Restart services
pm2 restart all

# 5. Verify deployment
curl https://yourdomain.com/api/game-status
```

## 🔗 Quick Links

- **Live Demo**: https://ahump20.github.io/lone-star-legends-championship/
- **Repository**: https://github.com/ahump20/lone-star-legends-championship
- **Documentation**: This deployment guide
- **Support**: Create an issue on GitHub

## 🎯 Performance Targets

- **Page Load Time**: < 3 seconds on 3G
- **First Contentful Paint**: < 2 seconds
- **WebSocket Latency**: < 100ms
- **Mobile Performance**: Lighthouse score > 90
- **Uptime**: 99.9% availability

---

**Deployment completed successfully! 🚀**

The Lone Star Legends Championship is now ready for production with:
- Advanced AI player system with machine learning patterns
- Real-time analytics dashboard with Champion Enigma Engine
- Multiplayer WebSocket functionality
- VR/AR compatibility for immersive experiences
- Mobile-responsive touch controls
- Professional deployment architecture