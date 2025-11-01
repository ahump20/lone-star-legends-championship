/**
 * TeamBuilder - Creates teams from the Backyard Baseball roster
 */

import rosterData from '../../../data/backyard-roster.json';
import { Team, Player } from '../../../packages/rules/gameState';

export class TeamBuilder {
  private characters: any[];
  private teams: any[];

  constructor() {
    this.characters = rosterData.characters;
    this.teams = rosterData.teams;
  }

  /**
   * Get all available characters
   */
  getAllCharacters(): Player[] {
    return this.characters.map(char => this.convertToPlayer(char));
  }

  /**
   * Convert roster character to Player format
   */
  private convertToPlayer(char: any): Player {
    return {
      id: char.id,
      name: char.name,
      nickname: char.nickname,
      stats: {
        batting: char.stats.batting,
        power: char.stats.power,
        speed: char.stats.speed,
        pitching: char.stats.pitching,
        fielding: char.stats.fielding
      },
      position: char.position
    };
  }

  /**
   * Create a balanced team by selecting players for each position
   */
  createBalancedTeam(teamId: string, playerIds: string[]): Team | null {
    const teamData = this.teams.find(t => t.id === teamId);
    if (!teamData) return null;

    const roster: Player[] = [];
    const selectedPlayers = playerIds.map(id =>
      this.characters.find(c => c.id === id)
    ).filter(p => p);

    // Ensure we have players for each position
    const requiredPositions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

    for (const pos of requiredPositions) {
      const player = selectedPlayers.find(p => p.position === pos);
      if (player) {
        roster.push(this.convertToPlayer(player));
      } else {
        // Find a substitute from all characters
        const substitute = this.characters.find(c => c.position === pos);
        if (substitute) {
          roster.push(this.convertToPlayer(substitute));
        }
      }
    }

    return {
      id: teamData.id,
      name: teamData.name,
      shortName: teamData.shortName,
      color: teamData.color,
      secondaryColor: teamData.secondaryColor,
      roster: roster,
      score: 0,
      battingOrder: Array.from({ length: roster.length }, (_, i) => i)
    };
  }

  /**
   * Create two pre-made teams for quick play
   */
  createQuickPlayTeams(): { homeTeam: Team; awayTeam: Team } {
    // Home Team: Sandlot Sluggers
    const homeTeam = this.createBalancedTeam('team_sandlot', [
      'char_003', // Tommy 'Tank' Chen - 1B
      'char_006', // Maya Patel - 2B
      'char_010', // Olivia 'Rocket' Kim - 3B
      'char_004', // Jasmine 'Jazz' Williams - SS
      'char_002', // Sofia Martinez - P
      'char_009', // Jamal 'J-Rock' Jackson - C
      'char_007', // Diego 'Dash' Rodriguez - LF
      'char_001', // Marcus Thunder - CF
      'char_005'  // Lucas 'Lucky' O'Brien - RF
    ])!;

    // Away Team: Thunder Strikers
    const awayTeam = this.createBalancedTeam('team_thunder', [
      'char_013', // Andre 'The Wall' Johnson - 1B
      'char_014', // Lily 'Spark' Chen - 2B
      'char_018', // Mia 'Magnet' Lee - 3B
      'char_017', // Alex 'Ace' Santos - SS
      'char_008', // Emma 'Ice' Anderson - P
      'char_009', // Jamal 'J-Rock' Jackson - C (duplicate, will use different catcher)
      'char_016', // Keisha 'Blaze' Robinson - LF
      'char_011', // Carter 'Wheels' Murphy - CF
      'char_015'  // Ryan 'Cannon' McGrath - RF
    ])!;

    // Fix duplicate - use char_012 as pitcher for away team
    const zigzagPitcher = this.characters.find(c => c.id === 'char_012');
    if (zigzagPitcher) {
      awayTeam.roster[4] = this.convertToPlayer(zigzagPitcher);
    }

    return { homeTeam, awayTeam };
  }

  /**
   * Get team by ID
   */
  getTeamData(teamId: string) {
    return this.teams.find(t => t.id === teamId);
  }

  /**
   * Get all available teams
   */
  getAllTeams() {
    return this.teams;
  }
}
