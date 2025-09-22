/**
 * Blaze Intelligence OG Remaster
 * Highlights Viewer UI Component
 * View and share your championship moments
 */

import { ReplaySystem, Highlight } from '../replay/ReplaySystem';

export class HighlightsViewer {
  private container: HTMLDivElement;
  private replaySystem: ReplaySystem;
  private isVisible: boolean = false;
  
  constructor(replaySystem: ReplaySystem) {
    this.replaySystem = replaySystem;
    this.container = this.createContainer();
    this.setupEventListeners();
  }
  
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'highlights-viewer';
    container.className = 'highlights-viewer';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: none;
      z-index: 5000;
      font-family: 'Press Start 2P', monospace;
      overflow-y: auto;
    `;
    
    container.innerHTML = `
      <div class="highlights-header" style="
        background: linear-gradient(135deg, #FF6B35, #1E3A8A);
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: sticky;
        top: 0;
        z-index: 5001;
      ">
        <h2 style="color: white; margin: 0; font-size: 20px;">🎬 GAME HIGHLIGHTS</h2>
        <button id="close-highlights" style="
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid white;
          color: white;
          padding: 10px 20px;
          font-family: 'Press Start 2P', monospace;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s;
        ">CLOSE</button>
      </div>
      
      <div class="highlights-grid" id="highlights-grid" style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        padding: 20px;
      "></div>
      
      <div class="no-highlights" id="no-highlights" style="
        display: none;
        text-align: center;
        color: #888;
        padding: 50px;
        font-size: 14px;
      ">
        <p>No highlights yet!</p>
        <p style="font-size: 10px; margin-top: 20px;">Hit a home run or make a great play to create highlights!</p>
      </div>
    `;
    
    document.body.appendChild(container);
    return container;
  }
  
  private setupEventListeners(): void {
    // Close button
    const closeBtn = document.getElementById('close-highlights');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
    
    // H key to toggle highlights
    document.addEventListener('keydown', (e) => {
      if (e.key === 'h' || e.key === 'H') {
        this.toggle();
      }
    });
  }
  
  public show(): void {
    this.isVisible = true;
    this.container.style.display = 'block';
    this.refreshHighlights();
  }
  
  public hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
  }
  
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  private refreshHighlights(): void {
    const highlights = this.replaySystem.getHighlights();
    const grid = document.getElementById('highlights-grid');
    const noHighlights = document.getElementById('no-highlights');
    
    if (!grid || !noHighlights) return;
    
    // Clear existing highlights
    grid.innerHTML = '';
    
    if (highlights.length === 0) {
      grid.style.display = 'none';
      noHighlights.style.display = 'block';
      return;
    }
    
    grid.style.display = 'grid';
    noHighlights.style.display = 'none';
    
    // Create highlight cards
    highlights.forEach((highlight, index) => {
      const card = this.createHighlightCard(highlight, index);
      grid.appendChild(card);
    });
  }
  
  private createHighlightCard(highlight: Highlight, index: number): HTMLDivElement {
    const card = document.createElement('div');
    card.className = 'highlight-card';
    card.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 2px solid #FF6B35;
      border-radius: 10px;
      padding: 15px;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
    `;
    
    // Add hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.05)';
      card.style.borderColor = '#FFA500';
      card.style.boxShadow = '0 0 20px rgba(255, 165, 0, 0.5)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)';
      card.style.borderColor = '#FF6B35';
      card.style.boxShadow = 'none';
    });
    
    // Importance badge
    const importanceBadge = this.getImportanceBadge(highlight.metadata.importance);
    
    card.innerHTML = `
      <div class="highlight-number" style="
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255, 107, 53, 0.3);
        color: #FF6B35;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 10px;
      ">#${index + 1}</div>
      
      <div class="highlight-importance" style="
        position: absolute;
        top: 10px;
        left: 10px;
        ${importanceBadge}
      "></div>
      
      <h3 style="
        color: white;
        font-size: 12px;
        margin: 30px 0 10px 0;
        line-height: 1.5;
      ">${highlight.title}</h3>
      
      <p style="
        color: #888;
        font-size: 10px;
        margin: 10px 0;
      ">${highlight.description}</p>
      
      <div class="highlight-stats" style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin: 15px 0;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 5px;
      ">
        <div style="color: #aaa; font-size: 9px;">
          <span style="color: #FF6B35;">Batter:</span><br>
          ${highlight.metadata.batter}
        </div>
        <div style="color: #aaa; font-size: 9px;">
          <span style="color: #1E3A8A;">Pitcher:</span><br>
          ${highlight.metadata.pitcher}
        </div>
      </div>
      
      <div class="highlight-actions" style="
        display: flex;
        gap: 10px;
        margin-top: 15px;
      ">
        <button class="replay-btn" data-highlight-id="${highlight.id}" style="
          flex: 1;
          background: linear-gradient(135deg, #FF6B35, #FF8C42);
          border: none;
          color: white;
          padding: 10px;
          font-family: 'Press Start 2P', monospace;
          font-size: 10px;
          cursor: pointer;
          border-radius: 5px;
          transition: all 0.3s;
        ">▶ REPLAY</button>
        
        <button class="share-btn" data-highlight-id="${highlight.id}" style="
          flex: 1;
          background: linear-gradient(135deg, #1E3A8A, #2563EB);
          border: none;
          color: white;
          padding: 10px;
          font-family: 'Press Start 2P', monospace;
          font-size: 10px;
          cursor: pointer;
          border-radius: 5px;
          transition: all 0.3s;
        ">📤 SHARE</button>
      </div>
    `;
    
    // Add event listeners for buttons
    const replayBtn = card.querySelector('.replay-btn') as HTMLButtonElement;
    const shareBtn = card.querySelector('.share-btn') as HTMLButtonElement;
    
    if (replayBtn) {
      replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playHighlight(highlight);
      });
    }
    
    if (shareBtn) {
      shareBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.shareHighlight(highlight);
      });
    }
    
    // Click card to replay
    card.addEventListener('click', () => {
      this.playHighlight(highlight);
    });
    
    return card;
  }
  
  private getImportanceBadge(importance: number): string {
    let color, icon, size;
    
    if (importance >= 90) {
      color = 'background: linear-gradient(135deg, #FFD700, #FFA500);';
      icon = '👑';
      size = '20px';
    } else if (importance >= 70) {
      color = 'background: linear-gradient(135deg, #C0C0C0, #808080);';
      icon = '⭐';
      size = '18px';
    } else if (importance >= 50) {
      color = 'background: linear-gradient(135deg, #CD7F32, #8B4513);';
      icon = '🔥';
      size = '16px';
    } else {
      return 'display: none;';
    }
    
    return `
      ${color}
      width: ${size};
      height: ${size};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${parseInt(size) * 0.6}px;
    `;
  }
  
  private async playHighlight(highlight: Highlight): Promise<void> {
    // Hide the viewer temporarily
    this.hide();
    
    // Play the replay
    await this.replaySystem.playReplay(highlight);
    
    // Show viewer again after a delay
    setTimeout(() => this.show(), 1000);
  }
  
  private async shareHighlight(highlight: Highlight): Promise<void> {
    try {
      const shareUrl = await this.replaySystem.shareHighlight(highlight);
      
      // Show success notification
      this.showNotification('📋 Share link copied to clipboard!', 'success');
      
      // If Web Share API is available, use it
      if (navigator.share) {
        await navigator.share({
          title: highlight.title,
          text: highlight.description,
          url: shareUrl
        });
      }
    } catch (error) {
      console.error('Failed to share highlight:', error);
      this.showNotification('❌ Failed to share highlight', 'error');
    }
  }
  
  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#4CAF50' : '#F44336'};
      color: white;
      padding: 15px 25px;
      border-radius: 5px;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      z-index: 6000;
      animation: slideUp 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideDown 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Add animation styles if not already present
    if (!document.getElementById('highlight-animations')) {
      const style = document.createElement('style');
      style.id = 'highlight-animations';
      style.textContent = `
        @keyframes slideUp {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translate(-50%, 0); opacity: 1; }
          to { transform: translate(-50%, 100px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  public addHighlightsButton(): void {
    const button = document.createElement('button');
    button.id = 'highlights-button';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #FF6B35, #1E3A8A);
      border: 2px solid white;
      color: white;
      padding: 10px 15px;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      cursor: pointer;
      border-radius: 5px;
      z-index: 1000;
      transition: all 0.3s;
      animation: pulse 2s infinite;
    `;
    button.innerHTML = '🎬 HIGHLIGHTS (H)';
    
    button.addEventListener('click', () => this.toggle());
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 0 20px rgba(255, 107, 53, 0.8)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = 'none';
    });
    
    document.body.appendChild(button);
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
  }
}