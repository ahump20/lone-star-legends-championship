/**
 * Blaze Intelligence OG Remaster
 * Stadium Customization System
 * Build your championship ballpark
 */

export enum StadiumTheme {
  CLASSIC = 'classic',
  MODERN = 'modern',
  RETRO = 'retro',
  FUTURISTIC = 'futuristic',
  NATURAL = 'natural',
  URBAN = 'urban'
}

export enum WeatherCondition {
  SUNNY = 'sunny',
  OVERCAST = 'overcast',
  NIGHT = 'night',
  RAIN = 'rain',
  SNOW = 'snow',
  FOG = 'fog'
}

export interface StadiumDimensions {
  leftField: number;      // Distance down left field line (325-355)
  centerField: number;    // Distance to center field (400-436)
  rightField: number;     // Distance down right field line (325-353)
  leftWallHeight: number; // Left field wall height (3-37 feet)
  centerWallHeight: number;
  rightWallHeight: number;
  foulTerritory: 'small' | 'medium' | 'large';
  elevation: number;      // Feet above sea level (affects ball flight)
}

export interface StadiumFeatures {
  // Outfield features
  manualScoreboard: boolean;
  greenMonster: boolean;
  ivyWalls: boolean;
  waterfallFeature: boolean;
  homeRunApple: boolean;
  
  // Seating
  bleachers: boolean;
  rooftopSeating: boolean;
  boxSeats: boolean;
  suites: boolean;
  standingRoom: boolean;
  
  // Unique features
  rooftopDeck: boolean;
  poolArea: boolean;
  kidZone: boolean;
  monumentPark: boolean;
  bermsSeating: boolean;
}

export interface StadiumCustomization {
  id: string;
  name: string;
  theme: StadiumTheme;
  dimensions: StadiumDimensions;
  features: StadiumFeatures;
  weather: WeatherCondition;
  timeOfDay: 'day' | 'twilight' | 'night';
  
  // Visual customization
  grassPattern: 'checkerboard' | 'stripes' | 'diamond' | 'logo' | 'plain';
  dirtColor: 'brown' | 'red' | 'tan' | 'gray';
  wallColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Crowd customization
  crowdDensity: number; // 0-100%
  crowdEnergy: number;  // 0-100%
  teamColors: boolean;
  banners: string[];
  chants: string[];
  
  // Gameplay effects
  windSpeed: number;    // -20 to +20 mph
  windDirection: number; // 0-360 degrees
  temperature: number;  // 32-110 degrees F
  humidity: number;     // 0-100%
  
  // Audio
  organMusic: boolean;
  walkupSongs: boolean;
  customAnnouncer: boolean;
  crowdNoise: number; // 0-100%
  
  // Unlocks & cost
  cost: number;
  unlocked: boolean;
  dateCreated: Date;
  gamesPlayed: number;
  homeRecord: string;
}

export class StadiumBuilder {
  private currentStadium: StadiumCustomization;
  private unlockedComponents: Set<string> = new Set();
  private savedStadiums: Map<string, StadiumCustomization> = new Map();
  
  constructor() {
    this.currentStadium = this.createDefaultStadium();
    this.loadUnlocks();
    console.log('🏟️ Stadium Builder initialized');
  }
  
  private createDefaultStadium(): StadiumCustomization {
    return {
      id: 'default',
      name: 'Championship Field',
      theme: StadiumTheme.CLASSIC,
      dimensions: {
        leftField: 330,
        centerField: 400,
        rightField: 330,
        leftWallHeight: 8,
        centerWallHeight: 8,
        rightWallHeight: 8,
        foulTerritory: 'medium',
        elevation: 0
      },
      features: {
        manualScoreboard: true,
        greenMonster: false,
        ivyWalls: false,
        waterfallFeature: false,
        homeRunApple: false,
        bleachers: true,
        rooftopSeating: false,
        boxSeats: true,
        suites: false,
        standingRoom: true,
        rooftopDeck: false,
        poolArea: false,
        kidZone: false,
        monumentPark: false,
        bermsSeating: false
      },
      weather: WeatherCondition.SUNNY,
      timeOfDay: 'day',
      grassPattern: 'stripes',
      dirtColor: 'brown',
      wallColors: {
        primary: '#2E8B57',
        secondary: '#228B22',
        accent: '#FFD700'
      },
      crowdDensity: 75,
      crowdEnergy: 80,
      teamColors: true,
      banners: ['GO TEAM!', 'CHAMPIONSHIP BOUND'],
      chants: ['Defense!', 'Charge!'],
      windSpeed: 5,
      windDirection: 180,
      temperature: 72,
      humidity: 45,
      organMusic: true,
      walkupSongs: true,
      customAnnouncer: false,
      crowdNoise: 75,
      cost: 0,
      unlocked: true,
      dateCreated: new Date(),
      gamesPlayed: 0,
      homeRecord: '0-0'
    };
  }
  
  public createStadium(name: string): StadiumCustomization {
    const stadium: StadiumCustomization = {
      ...this.createDefaultStadium(),
      id: this.generateStadiumId(),
      name: name,
      dateCreated: new Date()
    };
    
    this.currentStadium = stadium;
    return stadium;
  }
  
  public updateDimensions(dimensions: Partial<StadiumDimensions>): void {
    this.currentStadium.dimensions = { ...this.currentStadium.dimensions, ...dimensions };
    this.validateDimensions();
    this.calculateCost();
  }
  
  private validateDimensions(): void {
    const dim = this.currentStadium.dimensions;
    
    // MLB minimum/maximum constraints
    dim.leftField = Math.max(325, Math.min(355, dim.leftField));
    dim.centerField = Math.max(400, Math.min(436, dim.centerField));
    dim.rightField = Math.max(325, Math.min(353, dim.rightField));
    
    dim.leftWallHeight = Math.max(3, Math.min(37, dim.leftWallHeight));
    dim.centerWallHeight = Math.max(3, Math.min(20, dim.centerWallHeight));
    dim.rightWallHeight = Math.max(3, Math.min(20, dim.rightWallHeight));
    
    dim.elevation = Math.max(-282, Math.min(5280, dim.elevation)); // Death Valley to Mile High
  }
  
  public setTheme(theme: StadiumTheme): void {
    this.currentStadium.theme = theme;
    this.applyThemeDefaults(theme);
    this.calculateCost();
  }
  
  private applyThemeDefaults(theme: StadiumTheme): void {
    switch (theme) {
      case StadiumTheme.CLASSIC:
        this.currentStadium.wallColors = {
          primary: '#2E8B57',
          secondary: '#228B22', 
          accent: '#FFD700'
        };
        this.currentStadium.features.manualScoreboard = true;
        this.currentStadium.organMusic = true;
        break;
        
      case StadiumTheme.MODERN:
        this.currentStadium.wallColors = {
          primary: '#1E3A8A',
          secondary: '#3B82F6',
          accent: '#EF4444'
        };
        this.currentStadium.features.suites = true;
        this.currentStadium.customAnnouncer = true;
        break;
        
      case StadiumTheme.RETRO:
        this.currentStadium.wallColors = {
          primary: '#8B4513',
          secondary: '#D2691E',
          accent: '#FFE4B5'
        };
        this.currentStadium.grassPattern = 'checkerboard';
        this.currentStadium.features.bleachers = true;
        break;
        
      case StadiumTheme.FUTURISTIC:
        this.currentStadium.wallColors = {
          primary: '#4B0082',
          secondary: '#9400D3',
          accent: '#00FFFF'
        };
        this.currentStadium.features.rooftopDeck = true;
        break;
        
      case StadiumTheme.NATURAL:
        this.currentStadium.wallColors = {
          primary: '#654321',
          secondary: '#8FBC8F',
          accent: '#DEB887'
        };
        this.currentStadium.features.ivyWalls = true;
        this.currentStadium.features.bermsSeating = true;
        break;
        
      case StadiumTheme.URBAN:
        this.currentStadium.wallColors = {
          primary: '#2F4F4F',
          secondary: '#708090',
          accent: '#FF6347'
        };
        this.currentStadium.features.rooftopSeating = true;
        break;
    }
  }
  
  public toggleFeature(feature: keyof StadiumFeatures): void {
    if (!this.isFeatureUnlocked(feature)) {
      throw new Error(`Feature ${feature} is locked`);
    }
    
    this.currentStadium.features[feature] = !this.currentStadium.features[feature];
    
    // Handle exclusive features
    this.handleFeatureExclusivity(feature);
    this.calculateCost();
  }
  
  private handleFeatureExclusivity(feature: keyof StadiumFeatures): void {
    // Some features are mutually exclusive
    if (feature === 'greenMonster' && this.currentStadium.features.greenMonster) {
      this.currentStadium.dimensions.leftWallHeight = 37; // Fenway's Green Monster
    }
    
    if (feature === 'ivyWalls' && this.currentStadium.features.ivyWalls) {
      this.currentStadium.features.greenMonster = false; // Can't have both
    }
    
    if (feature === 'poolArea' && this.currentStadium.features.poolArea) {
      this.currentStadium.features.kidZone = false; // Pool replaces kid zone
    }
  }
  
  public setWeatherConditions(
    weather: WeatherCondition,
    temperature: number,
    windSpeed: number,
    windDirection: number,
    humidity: number
  ): void {
    this.currentStadium.weather = weather;
    this.currentStadium.temperature = Math.max(32, Math.min(110, temperature));
    this.currentStadium.windSpeed = Math.max(-20, Math.min(20, windSpeed));
    this.currentStadium.windDirection = Math.max(0, Math.min(360, windDirection));
    this.currentStadium.humidity = Math.max(0, Math.min(100, humidity));
    
    // Adjust for weather realism
    if (weather === WeatherCondition.RAIN || weather === WeatherCondition.SNOW) {
      this.currentStadium.humidity = Math.max(80, this.currentStadium.humidity);
    }
    
    if (weather === WeatherCondition.NIGHT) {
      this.currentStadium.timeOfDay = 'night';
      this.currentStadium.temperature = Math.max(32, this.currentStadium.temperature - 10);
    }
  }
  
  public customizeCrowd(density: number, energy: number, teamColors: boolean): void {
    this.currentStadium.crowdDensity = Math.max(0, Math.min(100, density));
    this.currentStadium.crowdEnergy = Math.max(0, Math.min(100, energy));
    this.currentStadium.teamColors = teamColors;
  }
  
  public addBanner(text: string): void {
    if (this.currentStadium.banners.length >= 10) {
      throw new Error('Maximum 10 banners allowed');
    }
    
    if (text.length > 20) {
      throw new Error('Banner text too long (max 20 characters)');
    }
    
    this.currentStadium.banners.push(text);
  }
  
  public addChant(text: string): void {
    if (this.currentStadium.chants.length >= 5) {
      throw new Error('Maximum 5 chants allowed');
    }
    
    this.currentStadium.chants.push(text);
  }
  
  private calculateCost(): void {
    let cost = 0;
    
    // Base cost for non-default dimensions
    const defaultDim = this.createDefaultStadium().dimensions;
    if (this.currentStadium.dimensions.leftField !== defaultDim.leftField) cost += 500;
    if (this.currentStadium.dimensions.centerField !== defaultDim.centerField) cost += 500;
    if (this.currentStadium.dimensions.rightField !== defaultDim.rightField) cost += 500;
    
    // Wall height costs
    cost += Math.max(0, this.currentStadium.dimensions.leftWallHeight - 8) * 100;
    cost += Math.max(0, this.currentStadium.dimensions.centerWallHeight - 8) * 100;
    cost += Math.max(0, this.currentStadium.dimensions.rightWallHeight - 8) * 100;
    
    // Feature costs
    const featureCosts: Partial<Record<keyof StadiumFeatures, number>> = {
      greenMonster: 2000,
      ivyWalls: 1500,
      waterfallFeature: 3000,
      homeRunApple: 2500,
      rooftopSeating: 1000,
      suites: 1500,
      rooftopDeck: 2000,
      poolArea: 5000,
      monumentPark: 3000
    };
    
    Object.entries(this.currentStadium.features).forEach(([feature, enabled]) => {
      if (enabled && featureCosts[feature as keyof StadiumFeatures]) {
        cost += featureCosts[feature as keyof StadiumFeatures]!;
      }
    });
    
    // Theme costs
    const themeCosts: Record<StadiumTheme, number> = {
      [StadiumTheme.CLASSIC]: 0,
      [StadiumTheme.MODERN]: 1000,
      [StadiumTheme.RETRO]: 500,
      [StadiumTheme.FUTURISTIC]: 2000,
      [StadiumTheme.NATURAL]: 750,
      [StadiumTheme.URBAN]: 1250
    };
    
    cost += themeCosts[this.currentStadium.theme];
    
    this.currentStadium.cost = cost;
  }
  
  private generateStadiumId(): string {
    return `stadium_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  public saveStadium(): void {
    if (!this.canAffordStadium()) {
      throw new Error('Insufficient coins to save stadium');
    }
    
    this.savedStadiums.set(this.currentStadium.id, { ...this.currentStadium });
    
    // Deduct coins (would integrate with progression system)
    console.log(`💰 Stadium saved for ${this.currentStadium.cost} coins`);
    
    this.saveToStorage();
  }
  
  private canAffordStadium(): boolean {
    // Would check against player progression coins
    return true; // Simplified for now
  }
  
  public loadStadium(stadiumId: string): void {
    const stadium = this.savedStadiums.get(stadiumId);
    if (stadium) {
      this.currentStadium = { ...stadium };
    }
  }
  
  public deleteStadium(stadiumId: string): void {
    this.savedStadiums.delete(stadiumId);
    this.saveToStorage();
  }
  
  public getGameplayEffects(): any {
    const effects = {
      // Wind affects ball flight
      windMultiplier: 1 + (this.currentStadium.windSpeed / 100),
      windDirection: this.currentStadium.windDirection,
      
      // Temperature affects ball flight
      temperatureMultiplier: 1 + ((this.currentStadium.temperature - 72) / 500),
      
      // Elevation affects ball flight (every 1000 ft = ~6% more distance)
      elevationMultiplier: 1 + (this.currentStadium.elevation / 16667),
      
      // Humidity affects ball flight (dry air = farther)
      humidityMultiplier: 1 - (this.currentStadium.humidity / 1000),
      
      // Stadium dimensions
      dimensions: this.currentStadium.dimensions,
      
      // Special features affect gameplay
      features: {
        greenMonster: this.currentStadium.features.greenMonster,
        ivyWalls: this.currentStadium.features.ivyWalls, // Ball can get stuck
        waterfallFeature: this.currentStadium.features.waterfallFeature // Affects CF catches
      }
    };
    
    return effects;
  }
  
  public unlockComponent(componentId: string): void {
    this.unlockedComponents.add(componentId);
    this.saveUnlocks();
  }
  
  private isFeatureUnlocked(feature: keyof StadiumFeatures): boolean {
    // Basic features are always unlocked
    const basicFeatures: (keyof StadiumFeatures)[] = [
      'manualScoreboard', 'bleachers', 'boxSeats', 'standingRoom'
    ];
    
    if (basicFeatures.includes(feature)) return true;
    
    return this.unlockedComponents.has(feature);
  }
  
  private loadUnlocks(): void {
    const saved = localStorage.getItem('stadium_unlocks');
    if (saved) {
      this.unlockedComponents = new Set(JSON.parse(saved));
    }
    
    // Load saved stadiums
    const savedStadiums = localStorage.getItem('saved_stadiums');
    if (savedStadiums) {
      const stadiumData = JSON.parse(savedStadiums);
      this.savedStadiums = new Map(Object.entries(stadiumData));
    }
  }
  
  private saveUnlocks(): void {
    localStorage.setItem('stadium_unlocks', JSON.stringify([...this.unlockedComponents]));
  }
  
  private saveToStorage(): void {
    const stadiumData = Object.fromEntries(this.savedStadiums);
    localStorage.setItem('saved_stadiums', JSON.stringify(stadiumData));
  }
  
  public getPresetStadiums(): StadiumCustomization[] {
    return [
      this.createFenwayPark(),
      this.createWrigleyField(), 
      this.createYankeeStadium(),
      this.createCoorsField(),
      this.createMinuteMaidPark()
    ];
  }
  
  private createFenwayPark(): StadiumCustomization {
    return {
      ...this.createDefaultStadium(),
      id: 'fenway',
      name: 'Green Monster Park',
      theme: StadiumTheme.CLASSIC,
      dimensions: {
        leftField: 310,
        centerField: 420,
        rightField: 302,
        leftWallHeight: 37,
        centerWallHeight: 17,
        rightWallHeight: 3,
        foulTerritory: 'small',
        elevation: 21
      },
      features: {
        ...this.createDefaultStadium().features,
        greenMonster: true,
        manualScoreboard: true
      }
    };
  }
  
  private createWrigleyField(): StadiumCustomization {
    return {
      ...this.createDefaultStadium(),
      id: 'wrigley',
      name: 'Ivy League Park',
      theme: StadiumTheme.RETRO,
      dimensions: {
        leftField: 355,
        centerField: 400,
        rightField: 353,
        leftWallHeight: 11,
        centerWallHeight: 11,
        rightWallHeight: 11,
        foulTerritory: 'small',
        elevation: 595
      },
      features: {
        ...this.createDefaultStadium().features,
        ivyWalls: true,
        rooftopSeating: true,
        manualScoreboard: true
      },
      windSpeed: 12, // Windy City
      windDirection: 225
    };
  }
  
  private createYankeeStadium(): StadiumCustomization {
    return {
      ...this.createDefaultStadium(),
      id: 'yankee',
      name: 'Monument Stadium',
      theme: StadiumTheme.MODERN,
      dimensions: {
        leftField: 318,
        centerField: 408,
        rightField: 314,
        leftWallHeight: 8,
        centerWallHeight: 8,
        rightWallHeight: 8,
        foulTerritory: 'large',
        elevation: 55
      },
      features: {
        ...this.createDefaultStadium().features,
        monumentPark: true,
        suites: true
      }
    };
  }
  
  private createCoorsField(): StadiumCustomization {
    return {
      ...this.createDefaultStadium(),
      id: 'coors',
      name: 'Mile High Stadium',
      theme: StadiumTheme.NATURAL,
      dimensions: {
        leftField: 347,
        centerField: 415,
        rightField: 350,
        leftWallHeight: 8,
        centerWallHeight: 8,
        rightWallHeight: 8,
        foulTerritory: 'large',
        elevation: 5280 // Mile high!
      },
      humidity: 25, // Dry air
      temperature: 75
    };
  }
  
  private createMinuteMaidPark(): StadiumCustomization {
    return {
      ...this.createDefaultStadium(),
      id: 'minutemaid',
      name: 'Space City Stadium',
      theme: StadiumTheme.MODERN,
      dimensions: {
        leftField: 315,
        centerField: 436,
        rightField: 325,
        leftWallHeight: 19,
        centerWallHeight: 12,
        rightWallHeight: 7,
        foulTerritory: 'medium',
        elevation: 50
      }
    };
  }
  
  public getCurrentStadium(): StadiumCustomization {
    return this.currentStadium;
  }
  
  public getSavedStadiums(): StadiumCustomization[] {
    return Array.from(this.savedStadiums.values());
  }
}