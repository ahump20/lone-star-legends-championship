/**
 * Theme System for OG Remaster
 * Reads Blaze Intelligence brand tokens from CSS variables
 */

export type Theme = {
  field: string; 
  dirt: string; 
  lines: string;
  uiAccent: string; 
  uiText: string;
  uiBackground: string;
  primary: string;
  secondary: string;
  navy: string;
  teal: string;
  platinum: string;
  graphite: string;
  pearl: string;
};

export function readTheme(): Theme {
  const style = getComputedStyle(document.documentElement);
  const getVar = (variable: string, fallback: string = "#000"): string => {
    return style.getPropertyValue(variable).trim() || fallback;
  };
  
  return {
    // OG-specific tokens
    field: getVar("--og-field", "#6ab150"),
    dirt: getVar("--og-dirt", "#c49a6c"),
    lines: getVar("--og-lines", "#FAFAFA"),
    uiAccent: getVar("--og-ui-accent", "#BF5700"),
    uiText: getVar("--og-ui-text", "#FAFAFA"),
    uiBackground: getVar("--og-ui-bg", "rgba(0,0,0,0.65)"),
    
    // Brand color tokens
    primary: getVar("--bi-burnt-orange", "#BF5700"),
    secondary: getVar("--bi-sky-blue", "#9BCBEB"),
    navy: getVar("--bi-navy", "#002244"),
    teal: getVar("--bi-teal", "#00B2A9"),
    platinum: getVar("--bi-platinum", "#E5E4E2"),
    graphite: getVar("--bi-graphite", "#36454F"),
    pearl: getVar("--bi-pearl", "#FAFAFA"),
  };
}

export function getFont(type: 'primary' | 'secondary' | 'mono' = 'secondary'): string {
  const style = getComputedStyle(document.documentElement);
  const fontVar = `--bi-font-${type}`;
  return style.getPropertyValue(fontVar).trim() || 'Arial, sans-serif';
}

export function getEasing(): string {
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue("--bi-ease").trim() || "cubic-bezier(0.4, 0, 0.2, 1)";
}

// Utility functions for creating brand-consistent colors
export function withOpacity(color: string, opacity: number): string {
  // Handle CSS variables
  if (color.startsWith('var(')) {
    return `color-mix(in oklch, ${color} ${Math.round(opacity * 100)}%, transparent)`;
  }
  
  // Handle hex colors
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return color;
}

export function lighten(color: string, amount: number): string {
  if (color.startsWith('var(')) {
    return `color-mix(in oklch, ${color}, white ${Math.round(amount * 100)}%)`;
  }
  return color;
}

export function darken(color: string, amount: number): string {
  if (color.startsWith('var(')) {
    return `color-mix(in oklch, ${color}, black ${Math.round(amount * 100)}%)`;
  }
  return color;
}

// Theme state management for dynamic switching
class ThemeManager {
  private currentTheme: Theme;
  private listeners: Array<(theme: Theme) => void> = [];

  constructor() {
    this.currentTheme = readTheme();
    this.watchForChanges();
  }

  private watchForChanges() {
    // Watch for CSS custom property changes
    const observer = new MutationObserver(() => {
      const newTheme = readTheme();
      if (JSON.stringify(newTheme) !== JSON.stringify(this.currentTheme)) {
        this.currentTheme = newTheme;
        this.notifyListeners();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  get theme(): Theme {
    return this.currentTheme;
  }

  onChange(callback: (theme: Theme) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentTheme));
  }

  // Apply theme variants for different game states
  applyGameState(state: 'menu' | 'playing' | 'paused' | 'gameover') {
    document.documentElement.setAttribute('data-game-state', state);
    
    switch (state) {
      case 'menu':
        document.documentElement.style.setProperty('--og-ui-bg', 'rgba(0,0,0,0.8)');
        break;
      case 'playing':
        document.documentElement.style.setProperty('--og-ui-bg', 'rgba(0,0,0,0.65)');
        break;
      case 'paused':
        document.documentElement.style.setProperty('--og-ui-bg', 'rgba(0,0,0,0.9)');
        break;
      case 'gameover':
        document.documentElement.style.setProperty('--og-ui-bg', 'rgba(191,87,0,0.2)');
        break;
    }
  }
}

export const themeManager = new ThemeManager();