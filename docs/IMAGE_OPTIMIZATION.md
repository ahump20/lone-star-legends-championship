# Image Optimization Guide

## Current Status

The site currently has **4.3MB of unoptimized PNG banner images** that significantly impact mobile performance:

- `public/images/blaze-banner-5.png`: 2.3MB
- `public/images/blaze-banner-6.png`: 2.1MB

## Performance Impact

- **LCP (Largest Contentful Paint):** These large images delay the largest contentful paint metric
- **Mobile Data Usage:** Over 4MB just for banners is excessive on 4G/5G
- **Time to Interactive:** Large images delay page interactivity

## Optimization Strategy

### 1. Convert to WebP Format

WebP provides 25-35% better compression than PNG/JPEG while maintaining quality.

**Using Sharp (Node.js):**
```bash
npm install sharp --save-dev
node scripts/optimize-images.js
```

**Using ImageMagick (CLI):**
```bash
# Install ImageMagick first
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Convert with quality 85
convert public/images/blaze-banner-5.png -quality 85 public/images/optimized/blaze-banner-5.webp
convert public/images/blaze-banner-6.png -quality 85 public/images/optimized/blaze-banner-6.webp
```

**Using Online Tools:**
- https://squoosh.app/ (Google's image optimizer)
- https://cloudconvert.com/png-to-webp
- https://tinypng.com/ (also supports WebP)

### 2. Create Responsive Images

Generate multiple sizes for different devices:

```bash
# Mobile (375w)
convert input.png -resize 375x public/images/optimized/banner-mobile.webp

# Tablet (768w)
convert input.png -resize 768x public/images/optimized/banner-tablet.webp

# Desktop (1024w)
convert input.png -resize 1024x public/images/optimized/banner-desktop.webp

# HD (1920w)
convert input.png -resize 1920x public/images/optimized/banner-hd.webp
```

### 3. Update HTML Markup

Replace simple `<img>` tags with responsive `<picture>` elements:

```html
<picture>
  <source
    srcset="
      /images/optimized/blaze-banner-5-mobile.webp 375w,
      /images/optimized/blaze-banner-5-tablet.webp 768w,
      /images/optimized/blaze-banner-5-desktop.webp 1024w,
      /images/optimized/blaze-banner-5-hd.webp 1920w
    "
    sizes="(max-width: 375px) 375px,
           (max-width: 768px) 768px,
           (max-width: 1024px) 1024px,
           1920px"
    type="image/webp"
  />
  <!-- Fallback for browsers that don't support WebP -->
  <img
    src="/images/blaze-banner-5.png"
    alt="Blaze Intelligence Banner"
    loading="lazy"
    decoding="async"
    width="1920"
    height="1080"
  />
</picture>
```

### 4. Lazy Loading

For images below the fold, add `loading="lazy"`:

```html
<img src="image.webp" loading="lazy" decoding="async" alt="Description" />
```

For above-the-fold critical images, use `fetchpriority="high"`:

```html
<img src="hero.webp" fetchpriority="high" alt="Hero image" />
```

## Expected Results

After optimization:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total Image Size | 4.3MB | ~800KB-1.2MB | 70-80% |
| Mobile LCP | ~5-7s | ~2-3s | 50-60% |
| Initial Load | 4-6s | 1-2s | 60-70% |

## Cloudflare Image Resizing

For production, consider using Cloudflare Image Resizing:

```html
<img src="https://example.com/cdn-cgi/image/width=800,format=webp/images/banner.png" />
```

Benefits:
- Automatic format conversion
- On-the-fly resizing
- Edge caching
- Device-aware delivery

## Automation

Add to your build process:

```json
{
  "scripts": {
    "optimize:images": "node scripts/optimize-images.js",
    "prebuild": "npm run optimize:images"
  }
}
```

## Monitoring

Track image performance:

1. **Lighthouse CI:** Monitor image metrics in CI/CD
2. **Chrome DevTools:** Network panel → filter by img
3. **WebPageTest:** Image analysis report

## Checklist

- [ ] Convert PNG to WebP (85% quality)
- [ ] Generate 4 responsive sizes (375w, 768w, 1024w, 1920w)
- [ ] Update HTML to use `<picture>` elements
- [ ] Add `loading="lazy"` for below-fold images
- [ ] Add `fetchpriority="high"` for hero images
- [ ] Add width/height attributes to prevent CLS
- [ ] Test on slow 4G network
- [ ] Verify WebP support fallback works
- [ ] Run Lighthouse audit
- [ ] Deploy and monitor metrics

## Additional Resources

- [WebP Guide](https://developers.google.com/speed/webp)
- [Responsive Images MDN](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
