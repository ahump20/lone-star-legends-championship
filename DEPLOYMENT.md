# 🔥 Blaze Intelligence - Lone Star Legends Championship
## Deployment & Setup Guide

### 📱 PWA Icon Setup

1. **Generate Icons from Your Logo:**
   - Open `icon-generator.html` in your browser
   - Upload your Lone Star Legends logo image
   - The tool will generate all required icon sizes:
     - 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
   - Download all icons and place them in the `/icons/` directory

2. **Manual Icon Creation (Alternative):**
   ```bash
   # If you have ImageMagick installed:
   convert logo.png -resize 72x72 icons/icon-72x72.png
   convert logo.png -resize 96x96 icons/icon-96x96.png
   convert logo.png -resize 128x128 icons/icon-128x128.png
   convert logo.png -resize 144x144 icons/icon-144x144.png
   convert logo.png -resize 152x152 icons/icon-152x152.png
   convert logo.png -resize 192x192 icons/icon-192x192.png
   convert logo.png -resize 384x384 icons/icon-384x384.png
   convert logo.png -resize 512x512 icons/icon-512x512.png
   ```

### 🌐 Multiplayer Server Deployment

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Deploy the Multiplayer Server:**
   ```bash
   # Run the deployment script
   ./deploy-multiplayer.sh
   
   # Or manually:
   wrangler deploy
   ```

4. **Configure Durable Objects:**
   - The server uses Cloudflare Durable Objects for game room state
   - These are automatically configured in `wrangler.toml`
   - First deployment may require enabling Durable Objects in your Cloudflare account

5. **Update WebSocket URL:**
   - The game client is already configured to use:
     ```
     wss://blaze-legends-multiplayer.humphrey-austin20.workers.dev/ws
     ```
   - Update this URL if you deploy to a different domain

### 🚀 GitHub Pages Deployment

1. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: main
   - Folder: / (root)
   - Save

2. **Access Your Game:**
   - Main Hub: `https://[username].github.io/lone-star-legends-championship/`
   - Blaze Game: `https://[username].github.io/lone-star-legends-championship/blaze-branded-game.html`
   - Icon Generator: `https://[username].github.io/lone-star-legends-championship/icon-generator.html`

### 📲 PWA Installation

**On Mobile (iOS/Android):**
1. Visit the game URL in Safari (iOS) or Chrome (Android)
2. Tap the Share button
3. Select "Add to Home Screen"
4. Name the app and tap "Add"

**On Desktop (Chrome/Edge):**
1. Visit the game URL
2. Click the install icon in the address bar
3. Or go to Menu → Install Lone Star Legends

### 🔧 Local Development

1. **Run Local Server:**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

2. **Test Multiplayer Locally:**
   ```bash
   # Run Wrangler in development mode
   wrangler dev
   ```

3. **Access Local Game:**
   - Open `http://localhost:8000/blaze-branded-game.html`
   - The game will automatically use local WebSocket server when on localhost

### 🎮 Game Features

**Mobile Controls:**
- Virtual joystick for player movement
- Touch buttons for swing, throw, and run
- Responsive design for all screen sizes
- Haptic feedback on supported devices

**Multiplayer Features:**
- Real-time PvP matches
- Room-based matchmaking
- Synchronized game state
- Chat system
- Spectator mode

**Progressive Web App:**
- Offline play capability
- Install as native app
- Push notifications
- Background sync
- Home screen icon

### 🐛 Troubleshooting

**Icons Not Showing:**
- Ensure all icon files are in `/icons/` directory
- Check file names match manifest.json exactly
- Clear browser cache and reload

**Multiplayer Not Connecting:**
- Check WebSocket URL in game client
- Ensure Cloudflare Worker is deployed
- Check browser console for errors
- Verify CORS settings in worker

**PWA Not Installing:**
- Must be served over HTTPS (GitHub Pages provides this)
- Manifest.json must be valid
- Service worker must be registered
- Icons must be present

### 📊 Analytics & Monitoring

**Cloudflare Analytics:**
- View in Cloudflare Dashboard → Workers → Analytics
- Monitor WebSocket connections
- Track API usage

**Game Analytics:**
- Player stats stored in Cloudflare KV
- Access via API: `/api/stats`
- View leaderboards: `/api/leaderboard`

### 🔐 Security

**Multiplayer Security:**
- Server-authoritative game logic
- Input validation on all actions
- Rate limiting on API endpoints
- CORS configured for your domain

**PWA Security:**
- Service worker only caches safe content
- No sensitive data in localStorage
- HTTPS required for installation

### 📝 Custom Domain Setup

1. **Add Custom Domain to Cloudflare Worker:**
   ```bash
   wrangler secret put CUSTOM_DOMAIN
   # Enter: yourdomain.com
   ```

2. **Update DNS Records:**
   - Add CNAME record pointing to Workers subdomain
   - Enable Cloudflare proxy (orange cloud)

3. **Update Game Client:**
   - Change WebSocket URL to use custom domain
   - Update manifest.json start_url

### 🎯 Next Steps

1. **Customize Team Names:**
   - Edit team configurations in game files
   - Add custom logos and colors

2. **Add Sound Effects:**
   - Place audio files in `/sounds/` directory
   - Update audio system in game client

3. **Create Tournaments:**
   - Implement tournament brackets
   - Add elimination/round-robin modes

4. **Enhance Statistics:**
   - Implement detailed player stats
   - Create season tracking
   - Add achievements system

### 📧 Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/ahump20/lone-star-legends-championship/issues)
- Blaze Intelligence: Contact through main website

---

**Powered by Blaze Intelligence** 🔥
*Where cognitive performance meets quarterly performance*