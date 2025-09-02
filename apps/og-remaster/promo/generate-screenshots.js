#!/usr/bin/env node
/**
 * OG Remaster - Screenshot Generator
 * Creates promotional materials for app stores and marketing
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

class ScreenshotGenerator {
  constructor() {
    this.devices = {
      desktop: { width: 1920, height: 1080, name: 'Desktop HD' },
      tablet: { width: 1024, height: 768, name: 'iPad Landscape' },
      mobile: { width: 390, height: 844, name: 'iPhone 14 Pro' }
    };
    
    this.scenes = [
      { name: 'menu', title: 'Championship Baseball Awaits!' },
      { name: 'gameplay', title: 'Arcade Action with Texas Heart!' },
      { name: 'sandlot', title: 'Draft Your Dream Team!' },
      { name: 'season', title: 'Win the Championship!' },
      { name: 'victory', title: 'Become a Legend!' }
    ];
  }

  async generateAllScreenshots() {
    console.log('🎨 Generating OG Remaster Promotional Screenshots...\n');
    
    // Create output directory
    const outputDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const [deviceName, device] of Object.entries(this.devices)) {
      for (const scene of this.scenes) {
        await this.generateScreenshot(device, scene, outputDir);
      }
    }

    // Generate feature graphics
    await this.generateFeatureGraphic(outputDir);
    await this.generatePromoVideo(outputDir);
    
    console.log('\n✅ All promotional materials generated!');
    console.log(`📁 Output directory: ${outputDir}`);
  }

  async generateScreenshot(device, scene, outputDir) {
    const canvas = createCanvas(device.width, device.height);
    const ctx = canvas.getContext('2d');

    // Background gradient (field green)
    const gradient = ctx.createLinearGradient(0, 0, 0, device.height);
    gradient.addColorStop(0, '#6ab150');
    gradient.addColorStop(1, '#5ba143');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, device.width, device.height);

    // Draw baseball field
    this.drawBaseballField(ctx, device.width, device.height);

    // Add UI elements based on scene
    this.drawSceneContent(ctx, scene, device);

    // Add branding
    this.addBranding(ctx, device);

    // Add promotional text
    this.addPromoText(ctx, scene.title, device);

    // Save screenshot
    const filename = `${device.name.toLowerCase().replace(' ', '-')}_${scene.name}.png`;
    const filepath = path.join(outputDir, filename);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filepath, buffer);
    
    console.log(`📸 Generated: ${filename}`);
  }

  drawBaseballField(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height * 0.7;
    const scale = Math.min(width, height) / 1000;

    // Diamond
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - 150 * scale, centerY - 150 * scale);
    ctx.lineTo(centerX, centerY - 300 * scale);
    ctx.lineTo(centerX + 150 * scale, centerY - 150 * scale);
    ctx.closePath();
    ctx.stroke();

    // Bases
    const bases = [
      { x: centerX, y: centerY }, // Home
      { x: centerX + 150 * scale, y: centerY - 150 * scale }, // First
      { x: centerX, y: centerY - 300 * scale }, // Second
      { x: centerX - 150 * scale, y: centerY - 150 * scale } // Third
    ];

    ctx.fillStyle = '#ffffff';
    bases.forEach(base => {
      ctx.fillRect(base.x - 10 * scale, base.y - 10 * scale, 20 * scale, 20 * scale);
    });

    // Pitcher's mound
    ctx.beginPath();
    ctx.arc(centerX, centerY - 150 * scale, 30 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#c49a6c';
    ctx.fill();
  }

  drawSceneContent(ctx, scene, device) {
    const { width, height } = device;
    
    switch(scene.name) {
      case 'menu':
        this.drawMenuScene(ctx, width, height);
        break;
      case 'gameplay':
        this.drawGameplayScene(ctx, width, height);
        break;
      case 'sandlot':
        this.drawSandlotScene(ctx, width, height);
        break;
      case 'season':
        this.drawSeasonScene(ctx, width, height);
        break;
      case 'victory':
        this.drawVictoryScene(ctx, width, height);
        break;
    }
  }

  drawMenuScene(ctx, width, height) {
    // Title card
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width * 0.1, height * 0.2, width * 0.8, height * 0.3);
    
    ctx.fillStyle = '#BF5700';
    ctx.font = `bold ${width * 0.06}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('BLAZE INTELLIGENCE', width / 2, height * 0.3);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${width * 0.08}px Inter, sans-serif`;
    ctx.fillText('OG REMASTER', width / 2, height * 0.4);
    
    // Menu buttons
    const buttons = ['QUICK PLAY', 'SANDLOT', 'SEASON'];
    buttons.forEach((text, i) => {
      const y = height * 0.55 + i * height * 0.08;
      
      ctx.fillStyle = '#BF5700';
      ctx.fillRect(width * 0.35, y, width * 0.3, height * 0.06);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${width * 0.025}px Inter, sans-serif`;
      ctx.fillText(text, width / 2, y + height * 0.04);
    });
  }

  drawGameplayScene(ctx, width, height) {
    // Score display
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(width * 0.35, height * 0.05, width * 0.3, height * 0.1);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${width * 0.03}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('LEGENDS 5 - SCOUTS 3', width / 2, height * 0.09);
    ctx.font = `${width * 0.02}px JetBrains Mono, monospace`;
    ctx.fillText('Bottom 7th | 2 Outs', width / 2, height * 0.12);
    
    // Player at bat
    ctx.fillStyle = '#BF5700';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.7, width * 0.03, 0, Math.PI * 2);
    ctx.fill();
    
    // Bat
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = width * 0.01;
    ctx.beginPath();
    ctx.moveTo(width * 0.48, height * 0.68);
    ctx.lineTo(width * 0.42, height * 0.62);
    ctx.stroke();
  }

  drawSandlotScene(ctx, width, height) {
    // Draft board
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(width * 0.1, height * 0.15, width * 0.8, height * 0.7);
    
    ctx.fillStyle = '#BF5700';
    ctx.font = `bold ${width * 0.04}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SANDLOT DRAFT', width / 2, height * 0.25);
    
    // Team columns
    const teams = ['TEAM BLAZE', 'TEAM ACE'];
    teams.forEach((team, i) => {
      const x = width * (0.3 + i * 0.4);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${width * 0.025}px Inter, sans-serif`;
      ctx.fillText(team, x, height * 0.35);
      
      // Player slots
      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x - width * 0.1, height * (0.4 + j * 0.1), width * 0.2, height * 0.08);
      }
    });
  }

  drawSeasonScene(ctx, width, height) {
    // Tournament bracket
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(width * 0.15, height * 0.2, width * 0.7, height * 0.6);
    
    ctx.fillStyle = '#BF5700';
    ctx.font = `bold ${width * 0.04}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('CHAMPIONSHIP PLAYOFFS', width / 2, height * 0.3);
    
    // Bracket lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // Semi-finals
    ctx.beginPath();
    ctx.moveTo(width * 0.25, height * 0.4);
    ctx.lineTo(width * 0.4, height * 0.4);
    ctx.lineTo(width * 0.4, height * 0.5);
    ctx.lineTo(width * 0.5, height * 0.5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width * 0.25, height * 0.6);
    ctx.lineTo(width * 0.4, height * 0.6);
    ctx.lineTo(width * 0.4, height * 0.5);
    ctx.stroke();
  }

  drawVictoryScene(ctx, width, height) {
    // Trophy
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(width * 0.45, height * 0.3);
    ctx.lineTo(width * 0.55, height * 0.3);
    ctx.lineTo(width * 0.53, height * 0.5);
    ctx.lineTo(width * 0.47, height * 0.5);
    ctx.closePath();
    ctx.fill();
    
    // Trophy handles
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = width * 0.01;
    ctx.beginPath();
    ctx.arc(width * 0.43, height * 0.35, width * 0.03, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width * 0.57, height * 0.35, width * 0.03, Math.PI * 1.5, Math.PI * 0.5);
    ctx.stroke();
    
    // Victory text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${width * 0.06}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('CHAMPIONS!', width / 2, height * 0.65);
    
    // Confetti effect
    const colors = ['#BF5700', '#9BCBEB', '#FFD700'];
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillRect(
        Math.random() * width,
        Math.random() * height,
        width * 0.01,
        height * 0.02
      );
    }
  }

  addBranding(ctx, device) {
    const { width, height } = device;
    
    // Blaze Intelligence watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `${width * 0.015}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('BLAZE INTELLIGENCE', width - 20, height - 20);
  }

  addPromoText(ctx, title, device) {
    const { width, height } = device;
    
    // Promotional banner
    ctx.fillStyle = '#BF5700';
    ctx.fillRect(0, 0, width, height * 0.08);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${width * 0.03}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, height * 0.05);
  }

  async generateFeatureGraphic(outputDir) {
    const canvas = createCanvas(1024, 500);
    const ctx = canvas.getContext('2d');
    
    // Gradient background
    const gradient = ctx.createRadialGradient(512, 250, 0, 512, 250, 600);
    gradient.addColorStop(0, '#BF5700');
    gradient.addColorStop(1, '#36454F');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 500);
    
    // Logo area
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BLAZE INTELLIGENCE', 512, 150);
    
    ctx.font = 'bold 80px Inter, sans-serif';
    ctx.fillText('OG REMASTER', 512, 230);
    
    // Tagline
    ctx.font = '30px Inter, sans-serif';
    ctx.fillText('Championship Baseball • Texas Heritage', 512, 300);
    
    // Feature bullets
    const features = [
      '⚾ Classic Arcade Gameplay',
      '🏆 Championship Tournaments',
      '📱 Play Anywhere Offline',
      '🎮 Texas Kids & Teams'
    ];
    
    ctx.font = '20px Inter, sans-serif';
    ctx.textAlign = 'left';
    features.forEach((feature, i) => {
      ctx.fillText(feature, 150 + (i % 2) * 400, 380 + Math.floor(i / 2) * 40);
    });
    
    // Save
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, 'feature-graphic.png'), buffer);
    
    console.log('🎨 Generated: feature-graphic.png');
  }

  async generatePromoVideo(outputDir) {
    // Create video storyboard config
    const storyboard = {
      title: 'Blaze Intelligence OG Remaster',
      duration: 30,
      scenes: [
        { start: 0, end: 3, type: 'logo', text: 'BLAZE INTELLIGENCE PRESENTS' },
        { start: 3, end: 6, type: 'title', text: 'OG REMASTER BASEBALL' },
        { start: 6, end: 10, type: 'gameplay', text: 'Classic Arcade Action' },
        { start: 10, end: 14, type: 'characters', text: '12 Unique Texas Kids' },
        { start: 14, end: 18, type: 'modes', text: '3 Championship Modes' },
        { start: 18, end: 22, type: 'features', text: 'Play Offline Anywhere' },
        { start: 22, end: 26, type: 'action', text: 'Draft, Play, Win!' },
        { start: 26, end: 30, type: 'cta', text: 'Download Now - Free!' }
      ],
      fps: 30,
      resolution: '1920x1080'
    };
    
    // Save storyboard config
    fs.writeFileSync(
      path.join(outputDir, 'video-storyboard.json'),
      JSON.stringify(storyboard, null, 2)
    );
    
    console.log('🎬 Generated: video-storyboard.json');
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new ScreenshotGenerator();
  generator.generateAllScreenshots().catch(console.error);
}

module.exports = ScreenshotGenerator;