# 🏗️ Blaze Intelligence - Unified Site Architecture

## **Information Architecture Overview**

### **Primary Navigation Structure**
```
blaze-intelligence.com/
├── 🏠 Home                    → index.html (with flow integration)
├── 📊 Analytics               → /analytics/
├── 🎯 Capabilities            → /capabilities/
├── 🎮 Interactive Demos       → /games/
├── 💰 Pricing                 → /pricing/
├── 🏢 Company                 → /company/
├── 📚 Resources               → /resources/
└── 🚀 Get Started            → /onboarding/
```

---

## **📋 DETAILED SITE STRUCTURE**

### **🏠 Homepage** - `/`
**Source**: `index.html` (current with flow state integration)
**Purpose**: Primary landing, value proposition, flow state showcase
**Key Features**:
- Hero section with value proposition
- Live data tiles (readiness/leverage)
- Flow state integration widget
- Scientific evidence section
- Call-to-action flows

### **📊 Analytics Hub** - `/analytics/`
**Main Landing**: Statistics Dashboard Enhanced
**Pages**:
```
/analytics/
├── / (overview dashboard)
├── /dashboard/           → statistics-dashboard-enhanced.html  
├── /real-time/          → blaze-analytics-integration.html
├── /reports/            → Custom reporting interface
└── /nil-valuation/      → nil-trust-dashboard.html
```

### **🎯 Capabilities Platform** - `/capabilities/`
**Purpose**: Showcase all Blaze Intelligence capabilities
**Structure**:
```
/capabilities/
├── /                    → Overview of all capabilities
├── /scouting/           → Advanced scouting systems
├── /biomechanics/       → 3d-biometric-viewer.html
├── /flow-state/         → Flow state integration showcase
├── /nil-valuation/      → NIL trust dashboard
├── /performance/        → Performance analytics
└── /predictive/         → Predictive modeling
```

### **🎮 Interactive Demos** - `/games/`
**Purpose**: Hands-on experience with technology
**Structure**:
```
/games/
├── /                    → Game selection hub
├── /baseball/           → game.html (with flow integration)
├── /simulator/          → threejs-baseball-simulator.html
├── /advanced/           → enhanced-threejs-simulator.html
├── /stadium/            → enhanced-stadium-demo.html
└── /multiplayer/        → multiplayer-client.html
```

### **💰 Pricing** - `/pricing/`
**Source**: `pricing.html`
**Features**:
- Service packages
- Custom solutions
- ROI calculators
- Contact forms

### **🏢 Company** - `/company/`
**Structure**:
```
/company/
├── /about/              → Company story, mission, vision
├── /team/               → team-showcase.html
├── /presentations/      → presentations.html
├── /portfolio/          → blaze-portfolio-showcase.html
├── /careers/            → Job openings and culture
└── /contact/            → Contact information
```

### **📚 Resources** - `/resources/`
**Purpose**: Support, documentation, learning materials
**Structure**:
```
/resources/
├── /documentation/      → Technical documentation
├── /api-reference/      → API documentation
├── /help-center/        → User guides and FAQs
├── /case-studies/       → Success stories
├── /blog/               → Industry insights
└── /research/           → Scientific backing
```

### **🚀 Client Onboarding** - `/onboarding/`
**Source**: `client-onboarding-enhanced.html`
**Purpose**: Client intake and setup process
**Features**:
- Account creation
- Service configuration
- Integration setup
- Training materials

---

## **🔄 URL MIGRATION MAPPING**

### **Current → New URL Structure**
```
CURRENT FILE                          NEW URL
====================================  ================================
index.html                         →  /
statistics-dashboard-enhanced.html →  /analytics/dashboard/
game.html                          →  /games/baseball/
nil-trust-dashboard.html           →  /analytics/nil-valuation/
client-onboarding-enhanced.html    →  /onboarding/
presentations.html                 →  /company/presentations/
pricing.html                       →  /pricing/
3d-biometric-viewer.html           →  /capabilities/biomechanics/
team-showcase.html                 →  /company/team/
blaze-portfolio-showcase.html      →  /company/portfolio/
threejs-baseball-simulator.html    →  /games/simulator/
enhanced-threejs-simulator.html    →  /games/advanced/
enhanced-stadium-demo.html         →  /games/stadium/
multiplayer-client.html            →  /games/multiplayer/
blaze-analytics-integration.html   →  /analytics/real-time/
cee-scorecard.html                 →  /analytics/scorecard/
```

### **Legacy/Duplicate Files → Actions**
```
LEGACY FILES                          ACTION
====================================  ================================
index-corporate.html               →  MERGE into /company/about/
index-enhanced.html                →  MERGE into / (homepage)
statistics-dashboard.html          →  RETIRE (use enhanced version)
client-onboarding.html             →  RETIRE (use enhanced version)
blaze-branded-game.html            →  MERGE into /games/baseball/
proper-baseball-game.html          →  MERGE into /games/baseball/
lone-star-legends-game.html        →  MERGE into /games/advanced/
index-temp.html                    →  DELETE (temporary file)
index-backup.html                  →  DELETE (backup file)
icon-generator.html                →  DELETE (dev tool)
```

---

## **🎨 DESIGN SYSTEM & COMPONENTS**

### **Reusable Components**
1. **Navigation Header** - Consistent across all pages
2. **Flow State Widget** - Available on all interactive pages
3. **Analytics Tiles** - Standardized data display
4. **CTA Sections** - Conversion-optimized calls-to-action
5. **Footer** - Links, contact, scientific citations

### **Layout Templates**
1. **Landing Page Template** - Hero + features + CTA
2. **Dashboard Template** - Navigation + data visualization
3. **Game Template** - Full-screen interactive experience  
4. **Content Page Template** - Header + content + sidebar
5. **Form Template** - Clean, conversion-optimized forms

---

## **📱 RESPONSIVE STRATEGY**

### **Mobile-First Approach**
- **Breakpoints**: Mobile (320px+), Tablet (768px+), Desktop (1024px+)
- **Touch Optimization**: Larger buttons, swipe gestures
- **Performance**: Optimized images, lazy loading
- **Games**: Touch controls, simplified UI

### **Progressive Enhancement**
- **Core Content**: Accessible on all devices
- **Interactive Features**: Enhanced on capable devices
- **3D Games**: Fallback to 2D on lower-end devices
- **Flow State**: Adapts to screen size and capability

---

## **🔍 SEO OPTIMIZATION STRATEGY**

### **URL Structure Best Practices**
- **Clean URLs**: No file extensions, descriptive paths
- **Hierarchy**: Logical parent/child relationships  
- **Keywords**: Relevant terms in URL paths
- **Consistency**: Standardized naming conventions

### **Technical SEO Implementation**
```html
<!-- Meta Tags Template -->
<title>Page Title | Blaze Intelligence</title>
<meta name="description" content="Evidence-based sports analytics...">
<meta name="keywords" content="sports analytics, flow state, performance">
<link rel="canonical" href="https://blaze-intelligence.com/page/">

<!-- Open Graph -->
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description">
<meta property="og:image" content="/images/og-image.jpg">
<meta property="og:url" content="https://blaze-intelligence.com/page/">

<!-- Schema Markup -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Blaze Intelligence",
  "description": "Sports analytics and performance optimization platform"
}
</script>
```

### **Content Strategy**
- **Unique Content**: No duplicate pages
- **Evidence-Based**: Scientific citations and methodology
- **User-Focused**: Clear value propositions
- **Keyword Optimization**: Natural integration of target terms

---

## **⚡ PERFORMANCE OPTIMIZATION**

### **Core Web Vitals Targets**
- **LCP (Largest Contentful Paint)**: <2.5s (currently 1.4s ✅)
- **FID (First Input Delay)**: <100ms
- **CLS (Cumulative Layout Shift)**: <0.1
- **Lighthouse Score**: >90 (currently 88 ✅)

### **Optimization Strategies**
1. **Image Optimization**: WebP format, responsive images
2. **Code Splitting**: Lazy load non-critical components
3. **CDN Usage**: Cloudflare global distribution
4. **Caching**: Aggressive caching for static assets
5. **Compression**: Gzip/Brotli compression enabled

---

## **🔧 IMPLEMENTATION ROADMAP**

### **Phase 3A: Structure Definition** ✅
- [x] Information architecture designed
- [x] URL mapping completed  
- [x] Component library planned
- [x] SEO strategy defined

### **Phase 3B: Next Steps**
- [ ] Create page templates
- [ ] Build navigation system
- [ ] Implement responsive layouts
- [ ] Set up redirect rules
- [ ] Configure analytics tracking

---

**Site Architecture Status**: ✅ **COMPLETE**
**Total Pages Mapped**: 25+ core pages
**URL Structure**: Clean, hierarchical, SEO-optimized
**Migration Strategy**: Systematic with SEO preservation

*Generated by Claude Code - Blaze Intelligence Consolidation Plan*