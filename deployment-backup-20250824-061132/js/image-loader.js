/**
 * Blaze Intelligence Image Loader
 * Manages Cloudflare Images integration and fallbacks
 */

class BlazeImageLoader {
    constructor() {
        this.config = {
            accountHash: 'OIRkQQRLQBn_9nQh_tfKWA',
            baseUrl: 'https://imagedelivery.net/OIRkQQRLQBn_9nQh_tfKWA',
            defaultVariant: 'public',
            lazyLoad: true,
            fadeIn: true
        };

        // Image mappings with appropriate usage context
        this.images = {
            // Brand assets
            'blaze-logo': {
                id: 'blaze-logo-main',
                alt: 'Blaze Intelligence Logo',
                variants: ['public', 'thumbnail']
            },
            
            // Hero backgrounds (data visualization focused)
            'hero-analytics': {
                id: 'hero-sports-analytics',
                alt: 'Advanced Sports Analytics Dashboard',
                variants: ['hero', 'public'],
                fallback: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 600"%3E%3Crect fill="%230A0A0A"/%3E%3C/svg%3E'
            },
            
            // Sports team imagery
            'cardinals-action': {
                id: 'cardinals-game-action',
                alt: 'St. Louis Cardinals Baseball Analytics',
                variants: ['card', 'public']
            },
            'titans-field': {
                id: 'titans-field-view',
                alt: 'Tennessee Titans Football Analytics',
                variants: ['card', 'public']
            },
            'longhorns-stadium': {
                id: 'longhorns-stadium',
                alt: 'Texas Longhorns Sports Analytics',
                variants: ['card', 'public']
            },
            'grizzlies-court': {
                id: 'grizzlies-basketball-court',
                alt: 'Memphis Grizzlies Basketball Analytics',
                variants: ['card', 'public']
            },
            
            // Platform features
            'data-dashboard': {
                id: 'data-viz-dashboard',
                alt: 'Real-time Analytics Dashboard',
                variants: ['card', 'hero']
            },
            'nil-visualization': {
                id: 'nil-trust-visualization',
                alt: 'NIL Trust Score Visualization',
                variants: ['card', 'public']
            },
            'mobile-interface': {
                id: 'mobile-app-mockup',
                alt: 'Mobile Analytics Interface',
                variants: ['card', 'public']
            },
            
            // Founder image (limited use)
            'austin-professional': {
                id: 'austin-humphrey-professional',
                alt: 'Austin Humphrey - Founder & CEO',
                variants: ['avatar', 'card'],
                usage: 'founder-section-only'
            }
        };

        this.init();
    }

    init() {
        // Auto-load images with data attributes
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadImages());
        } else {
            this.loadImages();
        }

        // Set up lazy loading if enabled
        if (this.config.lazyLoad) {
            this.setupLazyLoading();
        }
    }

    /**
     * Get the full URL for an image
     */
    getImageUrl(imageKey, variant = 'public') {
        const image = this.images[imageKey];
        if (!image) {
            console.warn(`Image key "${imageKey}" not found`);
            return this.getPlaceholder(variant);
        }

        // Check if variant exists for this image
        if (!image.variants.includes(variant)) {
            variant = image.variants[0] || this.config.defaultVariant;
        }

        return `${this.config.baseUrl}/${image.id}/${variant}`;
    }

    /**
     * Load all images with data-blaze-image attribute
     */
    loadImages() {
        const images = document.querySelectorAll('[data-blaze-image]');
        
        images.forEach(img => {
            const imageKey = img.dataset.blazeImage;
            const variant = img.dataset.blazeVariant || 'public';
            const lazy = img.dataset.blazeLazy !== 'false';
            
            if (lazy && this.config.lazyLoad) {
                // Set up for lazy loading
                img.dataset.src = this.getImageUrl(imageKey, variant);
                img.classList.add('blaze-lazy');
            } else {
                // Load immediately
                this.loadImage(img, imageKey, variant);
            }
        });
    }

    /**
     * Load a single image
     */
    loadImage(element, imageKey, variant = 'public') {
        const imageData = this.images[imageKey];
        if (!imageData) {
            console.warn(`Image "${imageKey}" not configured`);
            return;
        }

        const url = this.getImageUrl(imageKey, variant);
        
        // Set alt text if not present
        if (!element.alt && imageData.alt) {
            element.alt = imageData.alt;
        }

        // Handle image or background
        if (element.tagName === 'IMG') {
            this.loadImageElement(element, url, imageData.fallback);
        } else {
            this.loadBackgroundImage(element, url, imageData.fallback);
        }
    }

    /**
     * Load image element with fade effect
     */
    loadImageElement(img, url, fallback) {
        const tempImg = new Image();
        
        tempImg.onload = () => {
            img.src = url;
            if (this.config.fadeIn) {
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease-in-out';
                setTimeout(() => {
                    img.style.opacity = '1';
                }, 10);
            }
            img.classList.add('blaze-loaded');
        };
        
        tempImg.onerror = () => {
            if (fallback) {
                img.src = fallback;
            } else {
                img.src = this.getPlaceholder('public');
            }
            img.classList.add('blaze-error');
        };
        
        tempImg.src = url;
    }

    /**
     * Load background image
     */
    loadBackgroundImage(element, url, fallback) {
        const tempImg = new Image();
        
        tempImg.onload = () => {
            element.style.backgroundImage = `url(${url})`;
            element.classList.add('blaze-loaded');
        };
        
        tempImg.onerror = () => {
            if (fallback) {
                element.style.backgroundImage = `url(${fallback})`;
            }
            element.classList.add('blaze-error');
        };
        
        tempImg.src = url;
    }

    /**
     * Set up intersection observer for lazy loading
     */
    setupLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for browsers without IntersectionObserver
            this.loadAllLazy();
            return;
        }

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    if (src) {
                        if (img.tagName === 'IMG') {
                            this.loadImageElement(img, src);
                        } else {
                            this.loadBackgroundImage(img, src);
                        }
                        img.classList.remove('blaze-lazy');
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });

        // Observe all lazy images
        document.querySelectorAll('.blaze-lazy').forEach(img => {
            imageObserver.observe(img);
        });
    }

    /**
     * Fallback to load all lazy images
     */
    loadAllLazy() {
        document.querySelectorAll('.blaze-lazy').forEach(img => {
            const src = img.dataset.src;
            if (src) {
                img.src = src;
                img.classList.remove('blaze-lazy');
            }
        });
    }

    /**
     * Get placeholder image based on variant
     */
    getPlaceholder(variant) {
        const placeholders = {
            'hero': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 600"%3E%3Crect fill="%231A1A1A"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23666" font-size="20"%3ELoading...%3C/text%3E%3C/svg%3E',
            'card': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%231A1A1A"/%3E%3C/svg%3E',
            'avatar': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%231A1A1A"/%3E%3C/svg%3E',
            'public': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect fill="%231A1A1A"/%3E%3C/svg%3E'
        };
        
        return placeholders[variant] || placeholders.public;
    }

    /**
     * Preload critical images
     */
    preloadImages(imageKeys) {
        imageKeys.forEach(key => {
            const image = this.images[key];
            if (image) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = this.getImageUrl(key, image.variants[0]);
                document.head.appendChild(link);
            }
        });
    }
}

// Initialize on load
const blazeImageLoader = new BlazeImageLoader();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeImageLoader;
}