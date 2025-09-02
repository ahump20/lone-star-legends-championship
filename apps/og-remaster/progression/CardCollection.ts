/**
 * Blaze Intelligence OG Remaster
 * Player Progression & Card Collection System
 * Collect, upgrade, and trade baseball cards
 */

export enum CardRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  DIAMOND = 'diamond'
}

export enum CardSeries {
  BASE = 'base',
  ROOKIE = 'rookie',
  ALL_STAR = 'all_star',
  POSTSEASON = 'postseason',
  HALL_OF_FAME = 'hall_of_fame',
  MILESTONE = 'milestone',
  FLASHBACK = 'flashback',
  FUTURE_STARS = 'future_stars',
  SIGNATURE = 'signature'
}

export interface PlayerCard {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  year: number;
  series: CardSeries;
  rarity: CardRarity;
  level: number;
  maxLevel: number;
  experience: number;
  experienceToNext: number;
  
  // Card stats (boosted from base)
  attributes: {
    contact: number;
    power: number;
    speed: number;
    fielding: number;
    armStrength: number;
    
    // Pitcher specific
    velocity?: number;
    control?: number;
    movement?: number;
    stamina?: number;
  };
  
  // Visual customization
  cardArt: string;
  borderStyle: string;
  animation?: string;
  
  // Collection info
  duplicates: number;
  locked: boolean;
  favorite: boolean;
  dateAcquired: Date;
  
  // Market value
  marketValue: number;
  quickSellValue: number;
}

export interface Pack {
  id: string;
  name: string;
  description: string;
  type: PackType;
  cost: number;
  currency: 'coins' | 'gems' | 'tickets';
  guaranteedRarity?: CardRarity;
  cardCount: number;
  odds: Record<CardRarity, number>;
  imageUrl: string;
  available: boolean;
  limitedTime?: Date;
}

export enum PackType {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  TEAM = 'team',
  POSITION = 'position',
  LEGENDS = 'legends',
  SEASONAL = 'seasonal',
  EVENT = 'event'
}

export interface Collection {
  cards: PlayerCard[];
  totalCards: number;
  uniqueCards: number;
  completionPercentage: number;
  favoriteLineup: string[];
  collections: CollectionSet[];
}

export interface CollectionSet {
  id: string;
  name: string;
  description: string;
  requiredCards: string[];
  collectedCards: string[];
  reward: CollectionReward;
  completed: boolean;
  completionDate?: Date;
}

export interface CollectionReward {
  type: 'card' | 'pack' | 'currency' | 'xp' | 'title';
  value: any;
  amount?: number;
}

export interface PlayerProgression {
  level: number;
  experience: number;
  experienceToNext: number;
  rank: string;
  rankPoints: number;
  
  // Currencies
  coins: number;
  gems: number;
  tickets: number;
  
  // Stats
  gamesPlayed: number;
  wins: number;
  losses: number;
  
  // Achievements
  achievements: Achievement[];
  titles: string[];
  
  // Battle Pass
  battlePassLevel: number;
  battlePassXP: number;
  premiumPass: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  progress: number;
  target: number;
  completed: boolean;
  reward: CollectionReward;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export class CardCollectionSystem {
  private collection: Collection;
  private progression: PlayerProgression;
  private marketplace: MarketplaceListing[] = [];
  
  constructor() {
    this.collection = this.loadCollection();
    this.progression = this.loadProgression();
    console.log('💳 Card Collection System initialized');
  }
  
  private loadCollection(): Collection {
    const saved = localStorage.getItem('blaze_collection');
    if (saved) {
      return JSON.parse(saved);
    }
    
    return {
      cards: [],
      totalCards: 0,
      uniqueCards: 0,
      completionPercentage: 0,
      favoriteLineup: [],
      collections: []
    };
  }
  
  private loadProgression(): PlayerProgression {
    const saved = localStorage.getItem('blaze_progression');
    if (saved) {
      return JSON.parse(saved);
    }
    
    return {
      level: 1,
      experience: 0,
      experienceToNext: 1000,
      rank: 'Rookie',
      rankPoints: 0,
      coins: 1000,
      gems: 50,
      tickets: 5,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      achievements: [],
      titles: ['Rookie'],
      battlePassLevel: 1,
      battlePassXP: 0,
      premiumPass: false
    };
  }
  
  public openPack(pack: Pack): PlayerCard[] {
    if (!this.canAffordPack(pack)) {
      throw new Error('Insufficient currency');
    }
    
    // Deduct cost
    this.deductCurrency(pack.currency, pack.cost);
    
    // Generate cards
    const cards: PlayerCard[] = [];
    
    for (let i = 0; i < pack.cardCount; i++) {
      const rarity = this.rollRarity(pack.odds);
      const card = this.generateCard(rarity, pack.type);
      cards.push(card);
      this.addCardToCollection(card);
    }
    
    // Check for guaranteed rarity
    if (pack.guaranteedRarity && !cards.some(c => c.rarity === pack.guaranteedRarity)) {
      cards[cards.length - 1] = this.generateCard(pack.guaranteedRarity, pack.type);
    }
    
    // Save collection
    this.saveCollection();
    
    // Trigger pack opening animation
    this.triggerPackAnimation(cards);
    
    return cards;
  }
  
  private canAffordPack(pack: Pack): boolean {
    switch (pack.currency) {
      case 'coins':
        return this.progression.coins >= pack.cost;
      case 'gems':
        return this.progression.gems >= pack.cost;
      case 'tickets':
        return this.progression.tickets >= pack.cost;
      default:
        return false;
    }
  }
  
  private deductCurrency(currency: 'coins' | 'gems' | 'tickets', amount: number): void {
    switch (currency) {
      case 'coins':
        this.progression.coins -= amount;
        break;
      case 'gems':
        this.progression.gems -= amount;
        break;
      case 'tickets':
        this.progression.tickets -= amount;
        break;
    }
  }
  
  private rollRarity(odds: Record<CardRarity, number>): CardRarity {
    const roll = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rarity, chance] of Object.entries(odds)) {
      cumulative += chance;
      if (roll <= cumulative) {
        return rarity as CardRarity;
      }
    }
    
    return CardRarity.COMMON;
  }
  
  private generateCard(rarity: CardRarity, packType: PackType): PlayerCard {
    // Generate a random card based on rarity and pack type
    const playerId = `player_${Math.random().toString(36).substr(2, 9)}`;
    const series = this.getRandomSeries(rarity);
    
    const baseStats = this.getBaseStatsByRarity(rarity);
    
    return {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      playerName: this.getRandomPlayerName(),
      team: this.getRandomTeam(),
      position: this.getRandomPosition(),
      year: 2024,
      series,
      rarity,
      level: 1,
      maxLevel: this.getMaxLevelByRarity(rarity),
      experience: 0,
      experienceToNext: 100,
      attributes: {
        contact: baseStats.contact + Math.floor(Math.random() * 10),
        power: baseStats.power + Math.floor(Math.random() * 10),
        speed: baseStats.speed + Math.floor(Math.random() * 10),
        fielding: baseStats.fielding + Math.floor(Math.random() * 10),
        armStrength: baseStats.armStrength + Math.floor(Math.random() * 10)
      },
      cardArt: this.getCardArt(rarity, series),
      borderStyle: this.getBorderStyle(rarity),
      animation: rarity === CardRarity.DIAMOND ? 'holographic' : undefined,
      duplicates: 0,
      locked: false,
      favorite: false,
      dateAcquired: new Date(),
      marketValue: this.calculateMarketValue(rarity),
      quickSellValue: this.calculateQuickSellValue(rarity)
    };
  }
  
  private getRandomSeries(rarity: CardRarity): CardSeries {
    if (rarity === CardRarity.LEGENDARY || rarity === CardRarity.DIAMOND) {
      const special = [CardSeries.HALL_OF_FAME, CardSeries.SIGNATURE, CardSeries.MILESTONE];
      return special[Math.floor(Math.random() * special.length)];
    }
    
    const standard = [CardSeries.BASE, CardSeries.ROOKIE, CardSeries.ALL_STAR];
    return standard[Math.floor(Math.random() * standard.length)];
  }
  
  private getBaseStatsByRarity(rarity: CardRarity): any {
    const stats: Record<CardRarity, any> = {
      [CardRarity.COMMON]: { contact: 50, power: 45, speed: 50, fielding: 50, armStrength: 50 },
      [CardRarity.UNCOMMON]: { contact: 60, power: 55, speed: 60, fielding: 60, armStrength: 60 },
      [CardRarity.RARE]: { contact: 70, power: 65, speed: 70, fielding: 70, armStrength: 70 },
      [CardRarity.EPIC]: { contact: 80, power: 75, speed: 80, fielding: 80, armStrength: 80 },
      [CardRarity.LEGENDARY]: { contact: 90, power: 85, speed: 85, fielding: 85, armStrength: 85 },
      [CardRarity.DIAMOND]: { contact: 95, power: 95, speed: 90, fielding: 90, armStrength: 90 }
    };
    
    return stats[rarity];
  }
  
  private getMaxLevelByRarity(rarity: CardRarity): number {
    const levels: Record<CardRarity, number> = {
      [CardRarity.COMMON]: 5,
      [CardRarity.UNCOMMON]: 10,
      [CardRarity.RARE]: 15,
      [CardRarity.EPIC]: 20,
      [CardRarity.LEGENDARY]: 25,
      [CardRarity.DIAMOND]: 30
    };
    
    return levels[rarity];
  }
  
  private getCardArt(rarity: CardRarity, series: CardSeries): string {
    return `/assets/cards/${series}_${rarity}.png`;
  }
  
  private getBorderStyle(rarity: CardRarity): string {
    const borders: Record<CardRarity, string> = {
      [CardRarity.COMMON]: 'gray',
      [CardRarity.UNCOMMON]: 'green',
      [CardRarity.RARE]: 'blue',
      [CardRarity.EPIC]: 'purple',
      [CardRarity.LEGENDARY]: 'gold',
      [CardRarity.DIAMOND]: 'rainbow'
    };
    
    return borders[rarity];
  }
  
  private calculateMarketValue(rarity: CardRarity): number {
    const baseValues: Record<CardRarity, number> = {
      [CardRarity.COMMON]: 100,
      [CardRarity.UNCOMMON]: 250,
      [CardRarity.RARE]: 500,
      [CardRarity.EPIC]: 1000,
      [CardRarity.LEGENDARY]: 5000,
      [CardRarity.DIAMOND]: 10000
    };
    
    return baseValues[rarity] + Math.floor(Math.random() * baseValues[rarity] * 0.2);
  }
  
  private calculateQuickSellValue(rarity: CardRarity): number {
    return Math.floor(this.calculateMarketValue(rarity) * 0.4);
  }
  
  private getRandomPlayerName(): string {
    const firstNames = ['Mike', 'John', 'David', 'Carlos', 'Roberto', 'Jose', 'Luis', 'Pedro'];
    const lastNames = ['Johnson', 'Rodriguez', 'Martinez', 'Garcia', 'Smith', 'Williams', 'Jones'];
    
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }
  
  private getRandomTeam(): string {
    const teams = ['cardinals', 'yankees', 'dodgers', 'redsox', 'cubs', 'giants'];
    return teams[Math.floor(Math.random() * teams.length)];
  }
  
  private getRandomPosition(): string {
    const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SP', 'RP'];
    return positions[Math.floor(Math.random() * positions.length)];
  }
  
  private addCardToCollection(card: PlayerCard): void {
    // Check for duplicates
    const existing = this.collection.cards.find(c => c.playerId === card.playerId && c.series === card.series);
    
    if (existing) {
      existing.duplicates++;
    } else {
      this.collection.cards.push(card);
      this.collection.uniqueCards++;
    }
    
    this.collection.totalCards++;
    this.updateCompletionPercentage();
  }
  
  private updateCompletionPercentage(): void {
    const totalPossibleCards = 1000; // Total cards in the game
    this.collection.completionPercentage = (this.collection.uniqueCards / totalPossibleCards) * 100;
  }
  
  public upgradeCard(cardId: string, materials: PlayerCard[]): boolean {
    const card = this.collection.cards.find(c => c.id === cardId);
    if (!card || card.level >= card.maxLevel) return false;
    
    // Check if materials are sufficient
    const requiredDuplicates = Math.ceil(card.level / 5);
    const duplicates = materials.filter(m => m.playerId === card.playerId).length;
    
    if (duplicates < requiredDuplicates) return false;
    
    // Consume materials
    materials.forEach(material => {
      const index = this.collection.cards.findIndex(c => c.id === material.id);
      if (index !== -1) {
        this.collection.cards.splice(index, 1);
      }
    });
    
    // Upgrade card
    card.level++;
    card.experience = 0;
    card.experienceToNext = card.level * 100;
    
    // Boost stats
    const statBoost = 2;
    card.attributes.contact += statBoost;
    card.attributes.power += statBoost;
    card.attributes.speed += statBoost;
    card.attributes.fielding += statBoost;
    card.attributes.armStrength += statBoost;
    
    this.saveCollection();
    return true;
  }
  
  public completeCollection(setId: string): void {
    const set = this.collection.collections.find(c => c.id === setId);
    if (!set || set.completed) return;
    
    // Check if all required cards are collected
    const hasAll = set.requiredCards.every(reqCard => 
      this.collection.cards.some(c => c.playerId === reqCard)
    );
    
    if (!hasAll) return;
    
    // Mark as completed
    set.completed = true;
    set.completionDate = new Date();
    
    // Grant reward
    this.grantReward(set.reward);
    
    // Achievement
    this.unlockAchievement('collector', setId);
    
    this.saveCollection();
  }
  
  private grantReward(reward: CollectionReward): void {
    switch (reward.type) {
      case 'card':
        const card = this.generateCard(reward.value, PackType.STANDARD);
        this.addCardToCollection(card);
        break;
      case 'currency':
        if (reward.value === 'coins') this.progression.coins += reward.amount || 0;
        if (reward.value === 'gems') this.progression.gems += reward.amount || 0;
        break;
      case 'xp':
        this.addExperience(reward.amount || 0);
        break;
      case 'title':
        this.progression.titles.push(reward.value);
        break;
    }
  }
  
  public addExperience(amount: number): void {
    this.progression.experience += amount;
    
    while (this.progression.experience >= this.progression.experienceToNext) {
      this.progression.experience -= this.progression.experienceToNext;
      this.progression.level++;
      this.progression.experienceToNext = this.progression.level * 1000;
      
      // Level up rewards
      this.progression.coins += 500;
      this.progression.gems += 10;
      
      console.log(`🎉 Level up! Now level ${this.progression.level}`);
    }
    
    this.saveProgression();
  }
  
  private unlockAchievement(category: string, id: string): void {
    // Check and unlock achievements
    const achievement = this.progression.achievements.find(a => a.id === id);
    if (achievement && !achievement.completed) {
      achievement.completed = true;
      this.grantReward(achievement.reward);
      console.log(`🏆 Achievement unlocked: ${achievement.name}`);
    }
  }
  
  private triggerPackAnimation(cards: PlayerCard[]): void {
    // Would trigger pack opening animation in UI
    console.log(`📦 Opened pack with ${cards.length} cards!`);
    cards.forEach(card => {
      console.log(`  - ${card.rarity.toUpperCase()} ${card.playerName} (${card.position})`);
    });
  }
  
  private saveCollection(): void {
    localStorage.setItem('blaze_collection', JSON.stringify(this.collection));
  }
  
  private saveProgression(): void {
    localStorage.setItem('blaze_progression', JSON.stringify(this.progression));
  }
  
  public getCollection(): Collection {
    return this.collection;
  }
  
  public getProgression(): PlayerProgression {
    return this.progression;
  }
  
  public quickSellCard(cardId: string): void {
    const card = this.collection.cards.find(c => c.id === cardId);
    if (!card || card.locked || card.favorite) return;
    
    // Add coins
    this.progression.coins += card.quickSellValue;
    
    // Remove card
    const index = this.collection.cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      this.collection.cards.splice(index, 1);
      this.collection.totalCards--;
      if (card.duplicates === 0) {
        this.collection.uniqueCards--;
      }
    }
    
    this.saveCollection();
    this.saveProgression();
  }
}

interface MarketplaceListing {
  id: string;
  cardId: string;
  sellerId: string;
  price: number;
  buyNowPrice?: number;
  currentBid?: number;
  endTime: Date;
  bids: Bid[];
}

interface Bid {
  bidderId: string;
  amount: number;
  timestamp: Date;
}