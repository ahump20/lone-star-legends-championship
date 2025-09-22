/**
 * Blaze Intelligence OG Remaster
 * Team Selector UI - Choose your MLB team
 * Pattern Recognition Weaponized ⚾
 */

import { MLBDataLoader, MLBTeam } from '../data/MLBDataLoader';

export class TeamSelector {
  private container: HTMLDivElement;
  private dataLoader: MLBDataLoader;
  private onTeamSelected: (team: MLBTeam) => void;
  private isVisible: boolean = false;
  
  constructor(dataLoader: MLBDataLoader, onTeamSelected: (team: MLBTeam) => void) {
    this.dataLoader = dataLoader;
    this.onTeamSelected = onTeamSelected;
    this.container = this.createContainer();
    this.setupEventListeners();
  }
  
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'team-selector';
    container.className = 'team-selector';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0A0A0A 0%, #1a1a2e 100%);
      display: none;
      z-index: 4000;
      font-family: 'Press Start 2P', monospace;
      overflow-y: auto;
    `;
    
    container.innerHTML = `
      <div class="selector-header" style="
        background: linear-gradient(135deg, #FF6B35, #1E3A8A);
        padding: 30px;
        text-align: center;
        position: sticky;
        top: 0;
        z-index: 4001;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      ">
        <h1 style="color: white; margin: 0; font-size: 24px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
          ⚾ SELECT YOUR TEAM ⚾
        </h1>
        <p style="color: rgba(255,255,255,0.9); font-size: 10px; margin-top: 10px;">
          Choose your championship squad with real MLB rosters
        </p>
      </div>
      
      <div class="league-container" style="padding: 20px;">
        <div class="league-section" id="american-league" style="margin-bottom: 40px;">
          <h2 style="color: #FF6B35; text-align: center; margin: 20px 0; font-size: 16px;">
            AMERICAN LEAGUE
          </h2>
          <div class="teams-grid" id="al-teams" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
          "></div>
        </div>
        
        <div class="league-section" id="national-league">
          <h2 style="color: #1E3A8A; text-align: center; margin: 20px 0; font-size: 16px;">
            NATIONAL LEAGUE
          </h2>
          <div class="teams-grid" id="nl-teams" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
          "></div>
        </div>
      </div>
      
      <div class="loading-indicator" id="loading-teams" style="
        text-align: center;
        color: white;
        padding: 50px;
        font-size: 14px;
      ">
        Loading MLB teams...
      </div>
    `;
    
    document.body.appendChild(container);
    return container;
  }
  
  private setupEventListeners(): void {
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }
  
  public async show(): Promise<void> {
    this.isVisible = true;
    this.container.style.display = 'block';
    await this.loadTeams();
  }
  
  public hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
  }
  
  private async loadTeams(): Promise<void> {
    const loadingIndicator = document.getElementById('loading-teams');
    const alGrid = document.getElementById('al-teams');
    const nlGrid = document.getElementById('nl-teams');
    
    if (!alGrid || !nlGrid) return;
    
    try {
      // Load all teams
      const teams = await this.dataLoader.loadAllTeams();
      
      // Hide loading indicator
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      // Clear grids
      alGrid.innerHTML = '';
      nlGrid.innerHTML = '';
      
      // Sort teams by league
      const alTeams = teams.filter(t => t.league === 'American');
      const nlTeams = teams.filter(t => t.league === 'National');
      
      // Create team cards
      alTeams.forEach(team => {
        const card = this.createTeamCard(team);
        alGrid.appendChild(card);
      });
      
      nlTeams.forEach(team => {
        const card = this.createTeamCard(team);
        nlGrid.appendChild(card);
      });
      
      // If no real teams loaded, show default teams
      if (teams.length === 0) {
        this.showDefaultTeams(alGrid, nlGrid);
      }
      
    } catch (error) {
      console.error('Failed to load teams:', error);
      if (loadingIndicator) {
        loadingIndicator.textContent = 'Failed to load teams. Using default rosters.';
      }
      this.showDefaultTeams(alGrid!, nlGrid!);
    }
  }
  
  private createTeamCard(team: MLBTeam): HTMLDivElement {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.style.cssText = `
      background: linear-gradient(135deg, ${team.primaryColor}CC, ${team.secondaryColor}CC);
      border: 2px solid ${team.primaryColor};
      border-radius: 10px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;
      position: relative;
      overflow: hidden;
    `;
    
    // Add hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.05)';
      card.style.boxShadow = `0 0 30px ${team.primaryColor}`;
      card.style.borderColor = '#FFA500';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)';
      card.style.boxShadow = 'none';
      card.style.borderColor = team.primaryColor;
    });
    
    // Add shine effect
    const shine = document.createElement('div');
    shine.style.cssText = `
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255,255,255,0.1) 50%,
        transparent 70%
      );
      transform: rotate(45deg);
      transition: all 0.6s;
      pointer-events: none;
    `;
    card.appendChild(shine);
    
    card.addEventListener('mouseenter', () => {
      shine.style.transform = 'rotate(45deg) translate(100%, 100%)';
    });
    
    card.innerHTML += `
      <div class="team-logo" style="
        width: 80px;
        height: 80px;
        margin: 0 auto 15px;
        background: rgba(255,255,255,0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
      ">
        ${this.getTeamEmoji(team.abbreviation)}
      </div>
      
      <h3 style="
        color: white;
        font-size: 12px;
        margin: 10px 0 5px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      ">${team.city}</h3>
      
      <h2 style="
        color: white;
        font-size: 16px;
        margin: 5px 0;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      ">${team.name}</h2>
      
      <div class="team-info" style="
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(255,255,255,0.3);
      ">
        <p style="
          color: rgba(255,255,255,0.9);
          font-size: 9px;
          margin: 5px 0;
        ">${team.division}</p>
        <p style="
          color: rgba(255,255,255,0.8);
          font-size: 8px;
          margin: 5px 0;
        ">${team.roster.length} Players</p>
      </div>
      
      <div class="select-indicator" style="
        position: absolute;
        top: 10px;
        right: 10px;
        width: 20px;
        height: 20px;
        background: rgba(255,255,255,0.2);
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.3s;
      ">✓</div>
    `;
    
    // Show checkmark on hover
    const indicator = card.querySelector('.select-indicator') as HTMLElement;
    card.addEventListener('mouseenter', () => {
      if (indicator) indicator.style.opacity = '1';
    });
    card.addEventListener('mouseleave', () => {
      if (indicator) indicator.style.opacity = '0';
    });
    
    // Handle selection
    card.addEventListener('click', () => {
      this.selectTeam(team);
    });
    
    return card;
  }
  
  private getTeamEmoji(abbreviation: string): string {
    const emojiMap: Record<string, string> = {
      'STL': '🔴', // Cardinals - red bird
      'NYY': '⚾', // Yankees
      'LAD': '🔵', // Dodgers - blue
      'BOS': '🧦', // Red Sox
      'CHC': '🐻', // Cubs
      'SF': '🌉', // Giants - Golden Gate
      'HOU': '🚀', // Astros - space
      'ATL': '⚔️', // Braves
      'WSH': '🏛️', // Nationals - capitol
      'SEA': '🔱', // Mariners - trident
      'TEX': '⭐', // Rangers - Texas star
      'SD': '⚓', // Padres
      'PHI': '🔔', // Phillies - Liberty Bell
      'NYM': '🍎', // Mets - Big Apple
      'MIL': '🍺', // Brewers
      'CIN': '🔴', // Reds
      'PIT': '🏴‍☠️', // Pirates
      'BAL': '🟠', // Orioles - orange bird
      'TB': '⚡', // Rays
      'TOR': '🍁', // Blue Jays - maple leaf
      'MIN': '👯', // Twins
      'CLE': '⚾', // Guardians
      'CWS': '⚪', // White Sox
      'KC': '👑', // Royals
      'DET': '🐅', // Tigers
      'LAA': '😇', // Angels
      'OAK': '🌳', // Athletics
      'MIA': '🐟', // Marlins
      'COL': '⛰️', // Rockies
      'ARI': '🐍', // Diamondbacks
    };
    
    return emojiMap[abbreviation] || '⚾';
  }
  
  private showDefaultTeams(alGrid: HTMLElement, nlGrid: HTMLElement): void {
    // Create default teams if real data isn't available
    const defaultALTeams = ['yankees', 'redsox', 'astros', 'whitesox', 'rangers'];
    const defaultNLTeams = ['cardinals', 'dodgers', 'cubs', 'giants', 'braves'];
    
    defaultALTeams.forEach(async (teamId) => {
      const team = await this.dataLoader.loadTeamData(teamId);
      if (team) {
        const card = this.createTeamCard(team);
        alGrid.appendChild(card);
      }
    });
    
    defaultNLTeams.forEach(async (teamId) => {
      const team = await this.dataLoader.loadTeamData(teamId);
      if (team) {
        const card = this.createTeamCard(team);
        nlGrid.appendChild(card);
      }
    });
  }
  
  private selectTeam(team: MLBTeam): void {
    console.log(`🏆 Selected team: ${team.city} ${team.name}`);
    
    // Animate selection
    const cards = document.querySelectorAll('.team-card');
    cards.forEach(card => {
      if (card.textContent?.includes(team.name)) {
        (card as HTMLElement).style.animation = 'pulse 0.5s';
        (card as HTMLElement).style.border = '3px solid #FFA500';
      }
    });
    
    // Call callback
    setTimeout(() => {
      this.onTeamSelected(team);
      this.hide();
    }, 500);
  }
  
  public showQuickSelect(): void {
    // Show a quick select menu for testing
    const quickTeams = ['cardinals', 'yankees', 'dodgers'];
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #1a1a2e, #0A0A0A);
      border: 2px solid #FF6B35;
      border-radius: 10px;
      padding: 20px;
      z-index: 5000;
    `;
    
    menu.innerHTML = `
      <h3 style="color: white; font-family: 'Press Start 2P', monospace; font-size: 14px; margin-bottom: 20px;">
        Quick Team Select
      </h3>
    `;
    
    quickTeams.forEach(async (teamId) => {
      const team = await this.dataLoader.loadTeamData(teamId);
      if (team) {
        const btn = document.createElement('button');
        btn.style.cssText = `
          display: block;
          width: 100%;
          margin: 10px 0;
          padding: 10px 20px;
          background: linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor});
          color: white;
          border: none;
          border-radius: 5px;
          font-family: 'Press Start 2P', monospace;
          font-size: 10px;
          cursor: pointer;
        `;
        btn.textContent = `${team.city} ${team.name}`;
        btn.onclick = () => {
          this.selectTeam(team);
          menu.remove();
        };
        menu.appendChild(btn);
      }
    });
    
    document.body.appendChild(menu);
  }
}