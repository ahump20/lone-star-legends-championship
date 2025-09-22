/**
 * Blaze Intelligence - Core JavaScript
 * Unified functionality across all pages
 */

// Core utilities
const BlazeCore = {
  // Analytics tracking
  track: function(event, data = {}) {
    if (typeof gtag === 'function') {
      gtag('event', event, {
        ...data,
        timestamp: Date.now(),
        page: window.location.pathname
      });
    }
    
    // Also send to flow API if available
    if (window.flowAPI) {
      window.flowAPI.trackEvent(event, data);
    }
  },
  
  // Smooth scroll to elements
  scrollTo: function(target, offset = 0) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;
    
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
    
    this.track('scroll_to', { target: target.toString() });
  },
  
  // Format numbers for display
  formatNumber: function(num, decimals = 2) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(decimals) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(decimals) + 'k';
    }
    return num.toFixed(decimals);
  },
  
  // Format dates
  formatDate: function(date, options = {}) {
    const defaults = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(date).toLocaleDateString('en-US', { ...defaults, ...options });
  },
  
  // Format time
  formatTime: function(date) {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  },
  
  // Check if element is in viewport
  isInViewport: function(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },
  
  // Debounce function
  debounce: function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Throttle function
  throttle: function(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Local storage with error handling
  storage: {
    get: function(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.warn('Failed to get from localStorage:', error);
        return defaultValue;
      }
    },
    
    set: function(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
        return false;
      }
    },
    
    remove: function(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
        return false;
      }
    }
  },
  
  // API utilities
  api: {
    get: async function(url, options = {}) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('API GET error:', error);
        throw error;
      }
    },
    
    post: async function(url, data, options = {}) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          body: JSON.stringify(data),
          ...options
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('API POST error:', error);
        throw error;
      }
    }
  },
  
  // Performance monitoring
  performance: {
    mark: function(name) {
      if (performance.mark) {
        performance.mark(name);
      }
    },
    
    measure: function(name, startMark, endMark) {
      if (performance.measure) {
        try {
          performance.measure(name, startMark, endMark);
          const measure = performance.getEntriesByName(name)[0];
          BlazeCore.track('performance_measure', {
            name: name,
            duration: measure.duration
          });
          return measure.duration;
        } catch (error) {
          console.warn('Performance measure failed:', error);
        }
      }
      return null;
    }
  }
};

// Navigation enhancements
class NavigationManager {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupActiveLinks();
    this.setupScrollSpy();
    this.setupMobileMenu();
  }
  
  setupActiveLinks() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .dropdown-item, .mobile-nav-link');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
        link.classList.add('active');
      }
    });
  }
  
  setupScrollSpy() {
    const sections = document.querySelectorAll('[id]');
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    if (sections.length === 0 || navLinks.length === 0) return;
    
    const observerOptions = {
      rootMargin: '-20% 0px -70% 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${entry.target.id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));
  }
  
  setupMobileMenu() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (!mobileToggle || !mobileNav) return;
    
    mobileToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('active');
      mobileToggle.classList.toggle('active');
      
      // Prevent body scroll when menu is open
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
      
      BlazeCore.track('mobile_menu_toggle', {
        action: mobileNav.classList.contains('active') ? 'open' : 'close'
      });
    });
    
    // Close menu when clicking on a link
    const mobileLinks = mobileNav.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('active');
        mobileToggle.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
}

// Animation utilities
class AnimationManager {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupIntersectionObserver();
    this.setupCounters();
  }
  
  setupIntersectionObserver() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    if (animatedElements.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const animation = entry.target.getAttribute('data-animate');
          entry.target.classList.add(animation || 'animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -10% 0px'
    });
    
    animatedElements.forEach(el => observer.observe(el));
  }
  
  setupCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-counter'));
      const duration = parseInt(counter.getAttribute('data-duration') || '2000');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(counter, target, duration);
            observer.unobserve(entry.target);
          }
        });
      });
      
      observer.observe(counter);
    });
  }
  
  animateCounter(element, target, duration) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current);
    }, 16);
  }
}

// Live data management
class LiveDataManager {
  constructor() {
    this.init();
  }
  
  init() {
    this.startLiveUpdates();
    this.setupHealthCheck();
  }
  
  startLiveUpdates() {
    // Update readiness and leverage data
    this.updateLiveData();
    setInterval(() => this.updateLiveData(), 30000); // Every 30 seconds
  }
  
  async updateLiveData() {
    try {
      // Try to fetch from readiness.json
      const response = await BlazeCore.api.get('/data/readiness.json');
      
      // Update readiness
      const readinessEl = document.getElementById('readiness');
      if (readinessEl && response.readiness !== undefined) {
        readinessEl.textContent = response.readiness.toFixed(2);
      }
      
      // Update leverage
      const leverageEl = document.getElementById('leverage');
      if (leverageEl && response.leverage !== undefined) {
        leverageEl.textContent = response.leverage.toFixed(2);
      }
      
      // Update timestamp
      const updatedEl = document.getElementById('updated');
      if (updatedEl) {
        updatedEl.textContent = BlazeCore.formatTime(new Date());
      }
      
      // Update any other live elements
      this.updateStatus('live');
      
    } catch (error) {
      console.warn('Failed to update live data:', error);
      // Fallback to simulated data
      this.updateLiveDataFallback();
      this.updateStatus('warning');
    }
  }
  
  updateLiveDataFallback() {
    const readinessEl = document.getElementById('readiness');
    const leverageEl = document.getElementById('leverage');
    const updatedEl = document.getElementById('updated');
    
    if (readinessEl) {
      const baseReadiness = 67.3;
      const readiness = baseReadiness + (Math.random() - 0.5) * 4;
      readinessEl.textContent = readiness.toFixed(2);
    }
    
    if (leverageEl) {
      const baseLeverage = 2.4;
      const leverage = baseLeverage + (Math.random() - 0.5) * 0.4;
      leverageEl.textContent = leverage.toFixed(2);
    }
    
    if (updatedEl) {
      updatedEl.textContent = BlazeCore.formatTime(new Date());
    }
  }
  
  updateStatus(status) {
    const statusDots = document.querySelectorAll('.status-dot');
    statusDots.forEach(dot => {
      dot.className = `status-dot status-${status}`;
    });
  }
  
  setupHealthCheck() {
    // Periodically check system health
    setInterval(async () => {
      try {
        const response = await BlazeCore.api.get('/api/health');
        this.updateStatus(response.status || 'live');
      } catch (error) {
        this.updateStatus('warning');
      }
    }, 60000); // Every minute
  }
}

// Form handling
class FormManager {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupForms();
  }
  
  setupForms() {
    const forms = document.querySelectorAll('form[data-api]');
    
    forms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleFormSubmit(form);
      });
    });
  }
  
  async handleFormSubmit(form) {
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    
    try {
      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }
      
      // Collect form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      // Get API endpoint
      const endpoint = form.getAttribute('data-api');
      
      // Submit form
      const response = await BlazeCore.api.post(endpoint, data);
      
      // Show success message
      this.showMessage('Form submitted successfully!', 'success');
      form.reset();
      
      // Track success
      BlazeCore.track('form_submit_success', {
        form: endpoint,
        fields: Object.keys(data)
      });
      
    } catch (error) {
      console.error('Form submission error:', error);
      this.showMessage('Failed to submit form. Please try again.', 'error');
      
      // Track error
      BlazeCore.track('form_submit_error', {
        form: form.getAttribute('data-api'),
        error: error.message
      });
      
    } finally {
      // Reset button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }
  
  showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.textContent = text;
    
    // Style the message
    Object.assign(message.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem 1.5rem',
      backgroundColor: type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3',
      color: 'white',
      borderRadius: '8px',
      zIndex: '10000',
      animation: 'slideInRight 0.3s ease-out'
    });
    
    document.body.appendChild(message);
    
    // Remove after 5 seconds
    setTimeout(() => {
      message.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => message.remove(), 300);
    }, 5000);
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  BlazeCore.performance.mark('core_init_start');
  
  // Initialize managers
  new NavigationManager();
  new AnimationManager();
  new LiveDataManager();
  new FormManager();
  
  BlazeCore.performance.mark('core_init_end');
  BlazeCore.performance.measure('core_init_duration', 'core_init_start', 'core_init_end');
  
  // Track page load
  BlazeCore.track('page_load', {
    page: window.location.pathname,
    referrer: document.referrer,
    loadTime: performance.now()
  });
});

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  BlazeCore.track('javascript_error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Performance monitoring
window.addEventListener('load', () => {
  // Web Vitals tracking
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        BlazeCore.track('web_vital', {
          name: entry.name,
          value: entry.value,
          rating: entry.value < 2500 ? 'good' : entry.value < 4000 ? 'needs-improvement' : 'poor'
        });
      });
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'cumulative-layout-shift'] });
  }
});

// Export for global access
window.BlazeCore = BlazeCore;