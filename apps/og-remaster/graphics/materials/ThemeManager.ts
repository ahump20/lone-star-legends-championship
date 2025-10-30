/**
 * ThemeManager - Integrates CSS design tokens with graphics engine
 * Converts CSS variables to GPU-ready materials
 */

import type { Color } from '../core/types';

export interface ThemeColors {
  primary: Color;
  secondary: Color;
  accent: Color;
  background: Color;
  surface: Color;
  text: Color;
  success: Color;
  warning: Color;
  error: Color;
  info: Color;
}

export interface ThemeConfig {
  colors: ThemeColors;
  spacing: number[];
  shadows: {
    small: string;
    medium: string;
    large: string;
    glow: string;
  };
  transitions: {
    fast: number;
    base: number;
    slow: number;
  };
}

export class ThemeManager {
  private theme: ThemeConfig;
  private cssVariables: Map<string, string> = new Map();

  constructor() {
    this.theme = this.loadThemeFromCSS();
  }

  /**
   * Load theme from CSS custom properties
   */
  private loadThemeFromCSS(): ThemeConfig {
    // Get computed style from root element
    const root = document.documentElement;
    const styles = getComputedStyle(root);

    // Parse CSS variables
    this.parseCSSVariables(styles);

    // Build theme config
    return {
      colors: {
        primary: this.parseColor('--color-primary', '#FF6B35'),
        secondary: this.parseColor('--color-secondary', '#4ECDC4'),
        accent: this.parseColor('--color-accent', '#FFE66D'),
        background: this.parseColor('--color-background', '#0A0E27'),
        surface: this.parseColor('--color-surface', '#1A1F3A'),
        text: this.parseColor('--color-text', '#FFFFFF'),
        success: this.parseColor('--color-success', '#4ECDC4'),
        warning: this.parseColor('--color-warning', '#FFE66D'),
        error: this.parseColor('--color-error', '#FF6B6B'),
        info: this.parseColor('--color-info', '#95E1D3')
      },
      spacing: this.parseSpacing(),
      shadows: {
        small: this.getVariable('--shadow-sm', '0 1px 2px rgba(0,0,0,0.1)'),
        medium: this.getVariable('--shadow-md', '0 4px 6px rgba(0,0,0,0.1)'),
        large: this.getVariable('--shadow-lg', '0 10px 15px rgba(0,0,0,0.1)'),
        glow: this.getVariable('--shadow-glow', '0 0 20px rgba(255,107,53,0.5)')
      },
      transitions: {
        fast: this.parseTime('--transition-fast', 150),
        base: this.parseTime('--transition-base', 250),
        slow: this.parseTime('--transition-slow', 350)
      }
    };
  }

  private parseCSSVariables(styles: CSSStyleDeclaration): void {
    // Parse all CSS custom properties
    const root = document.documentElement;
    const allProps = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules);
        } catch {
          return [];
        }
      })
      .filter(rule => rule instanceof CSSStyleRule && rule.selectorText === ':root')
      .flatMap(rule => {
        const styleRule = rule as CSSStyleRule;
        return Array.from(styleRule.style);
      })
      .filter(prop => prop.startsWith('--'));

    for (const prop of allProps) {
      const value = styles.getPropertyValue(prop).trim();
      if (value) {
        this.cssVariables.set(prop, value);
      }
    }
  }

  private getVariable(name: string, fallback: string): string {
    return this.cssVariables.get(name) || fallback;
  }

  private parseColor(variable: string, fallback: string): Color {
    const value = this.getVariable(variable, fallback);
    return this.hexToColor(value);
  }

  private hexToColor(hex: string): Color {
    // Remove # if present
    hex = hex.replace('#', '');

    // Handle shorthand hex
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;

    return { r, g, b, a };
  }

  private parseSpacing(): number[] {
    const spacingUnits = [
      '--spacing-1',  // 0.25rem
      '--spacing-2',  // 0.5rem
      '--spacing-3',  // 0.75rem
      '--spacing-4',  // 1rem
      '--spacing-5',  // 1.25rem
      '--spacing-6',  // 1.5rem
      '--spacing-8',  // 2rem
      '--spacing-10', // 2.5rem
      '--spacing-12', // 3rem
      '--spacing-16'  // 4rem
    ];

    return spacingUnits.map(unit => {
      const value = this.getVariable(unit, '16px');
      return this.parsePixelValue(value);
    });
  }

  private parseTime(variable: string, fallback: number): number {
    const value = this.getVariable(variable, `${fallback}ms`);
    return parseInt(value.replace('ms', ''));
  }

  private parsePixelValue(value: string): number {
    if (value.endsWith('rem')) {
      return parseFloat(value) * 16; // Assume 16px base font size
    }
    if (value.endsWith('px')) {
      return parseFloat(value);
    }
    return parseFloat(value);
  }

  /**
   * Get theme configuration
   */
  getTheme(): ThemeConfig {
    return this.theme;
  }

  /**
   * Get a specific color by name
   */
  getColor(name: keyof ThemeColors): Color {
    return this.theme.colors[name];
  }

  /**
   * Create a color with alpha
   */
  withAlpha(color: Color, alpha: number): Color {
    return { ...color, a: alpha };
  }

  /**
   * Lighten a color
   */
  lighten(color: Color, amount: number): Color {
    return {
      r: Math.min(1, color.r + amount),
      g: Math.min(1, color.g + amount),
      b: Math.min(1, color.b + amount),
      a: color.a
    };
  }

  /**
   * Darken a color
   */
  darken(color: Color, amount: number): Color {
    return {
      r: Math.max(0, color.r - amount),
      g: Math.max(0, color.g - amount),
      b: Math.max(0, color.b - amount),
      a: color.a
    };
  }

  /**
   * Mix two colors
   */
  mix(color1: Color, color2: Color, ratio: number): Color {
    return {
      r: color1.r * (1 - ratio) + color2.r * ratio,
      g: color1.g * (1 - ratio) + color2.g * ratio,
      b: color1.b * (1 - ratio) + color2.b * ratio,
      a: color1.a * (1 - ratio) + color2.a * ratio
    };
  }

  /**
   * Convert color to CSS string
   */
  toCSS(color: Color): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return color.a < 1
      ? `rgba(${r}, ${g}, ${b}, ${color.a})`
      : `rgb(${r}, ${g}, ${b})`;
  }
}
