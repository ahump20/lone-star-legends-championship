// vite.config.js
// Fixes the blank page issue on GitHub Pages
// The paradox: GitHub Pages serves from subdirectory, Vite assumes root

import { defineConfig } from 'vite';

export default defineConfig({
  // CRITICAL: Set base to your GitHub Pages repo name
  base: '/lone-star-legends-championship/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    
    // Optimize for game assets
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate game engine from vendor code
          'game-core': ['./src/game/engine.js', './src/game/state.js'],
          'game-assets': ['./src/assets/index.js'],
          'vendor': ['pixi.js', 'howler'] // If using these libraries
        },
        // Asset naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return `assets/fonts/[name]-[hash][extname]`;
          } else if (/mp3|wav|ogg/i.test(extType)) {
            return `assets/audio/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js'
      }
    },
    
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true
      }
    }
  },
  
  server: {
    port: 3000,
    open: true,
    
    // Proxy API calls to Cloudflare Worker during development
    proxy: {
      '/api': {
        target: 'https://lone-star-worker.YOUR-SUBDOMAIN.workers.dev',
        changeOrigin: true,
        secure: true
      },
      '/game-api': {
        target: 'http://localhost:8888', // Netlify Dev server
        changeOrigin: true
      }
    }
  },
  
  // Handle environment variables
  define: {
    __CLOUDFLARE_WORKER_URL__: JSON.stringify(
      process.env.VITE_CLOUDFLARE_WORKER_URL || 
      'https://lone-star-worker.YOUR-SUBDOMAIN.workers.dev'
    ),
    __NETLIFY_PREVIEW_URL__: JSON.stringify(
      process.env.VITE_NETLIFY_PREVIEW_URL || 
      null
    ),
    __GAME_VERSION__: JSON.stringify(
      process.env.npm_package_version || '1.0.0'
    ),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: ['pixi.js', 'howler'], // Pre-bundle heavy dependencies
    exclude: ['@cloudflare/workers-types'] // Don't bundle worker types
  },
  
  // Public directory for static assets
  publicDir: 'public',
  
  // CSS handling
  css: {
    modules: {
      localsConvention: 'camelCase'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/variables.scss";`
      }
    }
  },
  
  // Plugin configuration (if needed)
  plugins: [
    // Add plugins here if using frameworks like React/Vue
  ]
});