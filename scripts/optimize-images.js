/**
 * Image Optimization Script
 * Converts PNG images to WebP format with responsive sizes for mobile performance
 *
 * Usage: node scripts/optimize-images.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGE_DIR = path.join(__dirname, '..', 'public', 'images');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'optimized');

// Responsive image sizes for mobile-first design
const SIZES = [
  { width: 375, suffix: '-mobile' },      // Mobile
  { width: 768, suffix: '-tablet' },      // Tablet
  { width: 1024, suffix: '-desktop' },    // Desktop
  { width: 1920, suffix: '-hd' }          // HD
];

async function optimizeImage(inputPath, filename) {
  console.log(`\nOptimizing ${filename}...`);

  const baseName = path.basename(filename, path.extname(filename));
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  console.log(`  Original: ${metadata.width}x${metadata.height}, ${metadata.format}`);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate responsive sizes
  for (const size of SIZES) {
    if (size.width <= metadata.width) {
      const outputPath = path.join(OUTPUT_DIR, `${baseName}${size.suffix}.webp`);

      await sharp(inputPath)
        .resize(size.width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: 85, effort: 6 })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`  ✓ ${size.width}w → ${sizeMB}MB`);
    }
  }

  // Also create a full-size WebP
  const fullSizeOutput = path.join(OUTPUT_DIR, `${baseName}.webp`);
  await sharp(inputPath)
    .webp({ quality: 85, effort: 6 })
    .toFile(fullSizeOutput);

  const fullStats = fs.statSync(fullSizeOutput);
  const originalStats = fs.statSync(inputPath);
  const savings = ((1 - fullStats.size / originalStats.size) * 100).toFixed(1);

  console.log(`  ✓ Full size: ${(fullStats.size / 1024 / 1024).toFixed(2)}MB (${savings}% smaller)`);
}

async function main() {
  console.log('Starting image optimization...\n');
  console.log('Installing sharp if not present...');

  try {
    await import('sharp');
  } catch (e) {
    console.log('Sharp not found, installing...');
    execSync('npm install sharp --no-save', { stdio: 'inherit' });
  }

  const images = [
    'blaze-banner-5.png',
    'blaze-banner-6.png'
  ];

  for (const image of images) {
    const imagePath = path.join(IMAGE_DIR, image);
    if (fs.existsSync(imagePath)) {
      await optimizeImage(imagePath, image);
    } else {
      console.log(`⚠ ${image} not found, skipping...`);
    }
  }

  console.log('\n✅ Image optimization complete!');
  console.log(`\nOptimized images are in: ${OUTPUT_DIR}`);
  console.log('\nNext steps:');
  console.log('1. Update HTML to use <picture> elements with srcset');
  console.log('2. Add loading="lazy" for below-the-fold images');
  console.log('3. Add fetchpriority="high" for above-the-fold images');
}

main().catch(console.error);
