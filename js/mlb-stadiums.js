/**
 * MLB-Inspired Stadium Configurations
 * Field designs artistically identical to major league parks
 * All stadiums are original creations inspired by real MLB parks
 */

export const MLB_STADIUMS = {
	// Inspired by Fenway Park - Boston
	green_monster: {
		id: 'green_monster',
		name: 'The Green Giant',
		location: 'East Coast Harbor',
		description: 'Historic park with the famous 37-foot left field wall',
		opened: 1912,
		capacity: 37000,
		
		// Actual Fenway dimensions
		dimensions: {
			leftField: 310,      // ft
			leftCenter: 379,
			center: 390,
			rightCenter: 380,
			rightField: 302,
			leftWallHeight: 37,  // The Green Monster
			centerWallHeight: 17,
			rightWallHeight: 3
		},
		
		// Field characteristics
		characteristics: {
			fenceDistance: 0.92,     // Closer fences favor hitters
			ballCarry: 1.05,         // Sea-level, good carry
			windFactor: 0.05,        // Swirling winds
			groundSpeed: 1.0,        // Well-maintained grass
			visibility: 1.0,         // Day games
			quirks: ['left_wall', 'pesky_pole', 'triangle']
		},
		
		// Visual appearance
		appearance: {
			grassColor: '#1a4d2e',      // Dark green grass
			dirtColor: '#8b7355',       // Brick-red warning track
			wallColor: '#0d3d0d',       // Green wall
			leftWallColor: '#0d5d0d',   // The Monster is darker green
			skyColor: '#87ceeb',
			lighting: 'day',
			features: ['manual_scoreboard', 'red_seat', 'ladder']
		},
		
		// Gameplay modifiers
		gameplay: {
			homeRunFactor: 1.15,     // Wall helps power hitters
			doubleFactor: 1.3,       // Lots of doubles off the wall
			tripleFactor: 0.8,       // Triangle creates triples
			speedAdvantage: 1.1      // Fast runners benefit
		}
	},
	
	// Inspired by Yankee Stadium - New York
	bronx_cathedral: {
		id: 'bronx_cathedral',
		name: 'The Bronx Cathedral',
		location: 'The Bronx',
		description: 'Classic stadium with short right field porch',
		opened: 1923,
		capacity: 46000,
		
		dimensions: {
			leftField: 318,
			leftCenter: 399,
			center: 408,
			rightCenter: 385,
			rightField: 314,       // The short porch
			leftWallHeight: 8,
			centerWallHeight: 8,
			rightWallHeight: 8
		},
		
		characteristics: {
			fenceDistance: 0.95,
			ballCarry: 1.0,
			windFactor: -0.05,       // Swirling winds hurt fly balls
			groundSpeed: 1.05,
			visibility: 1.0,
			quirks: ['short_porch', 'monument_park', 'death_valley']
		},
		
		appearance: {
			grassColor: '#2d5016',
			dirtColor: '#8b4513',
			wallColor: '#003087',    // Navy blue
			skyColor: '#4a90e2',
			lighting: 'day',
			features: ['facade', 'monuments', 'frieze']
		},
		
		gameplay: {
			homeRunFactor: 1.2,      // Right field porch
			doubleFactor: 0.9,
			tripleFactor: 0.7,       // Death valley in left-center
			powerAdvantage: 1.15     // Power hitters love it
		}
	},
	
	// Inspired by Wrigley Field - Chicago
	ivy_walls: {
		id: 'ivy_walls',
		name: 'Ivy Walls Classic',
		location: 'North Side',
		description: 'Historic park with ivy-covered brick walls',
		opened: 1914,
		capacity: 41000,
		
		dimensions: {
			leftField: 355,
			leftCenter: 368,
			center: 400,
			rightCenter: 368,
			rightField: 353,
			leftWallHeight: 11,
			centerWallHeight: 11,
			rightWallHeight: 11
		},
		
		characteristics: {
			fenceDistance: 1.0,
			ballCarry: 1.1,          // Wind can help or hurt
			windFactor: 0.15,        // Famous for wind
			groundSpeed: 0.95,
			visibility: 1.0,
			quirks: ['ivy', 'rooftops', 'wind']
		},
		
		appearance: {
			grassColor: '#2ecc71',
			dirtColor: '#c19a6b',
			wallColor: '#8fbc8f',    // Ivy green
			skyColor: '#87ceeb',
			lighting: 'day',
			features: ['ivy', 'brick_wall', 'bleachers', 'manual_scoreboard']
		},
		
		gameplay: {
			homeRunFactor: 1.25,     // Wind out = home runs
			doubleFactor: 1.0,
			tripleFactor: 0.9,
			windDependency: 'high'   // Weather matters most
		}
	},
	
	// Inspired by Dodger Stadium - Los Angeles
	chavez_ravine: {
		id: 'chavez_ravine',
		name: 'Chavez Ravine Bowl',
		location: 'Los Angeles Hills',
		description: 'Symmetrical pitchers paradise in the hills',
		opened: 1962,
		capacity: 56000,
		
		dimensions: {
			leftField: 330,
			leftCenter: 385,
			center: 395,
			rightCenter: 385,
			rightField: 330,
			leftWallHeight: 8,
			centerWallHeight: 8,
			rightWallHeight: 8
		},
		
		characteristics: {
			fenceDistance: 1.05,     // Deeper than most
			ballCarry: 0.95,         // Heavier night air
			windFactor: 0,           // Protected by hills
			groundSpeed: 1.0,
			visibility: 1.0,
			quirks: ['symmetrical', 'pitcher_friendly']
		},
		
		appearance: {
			grassColor: '#228b22',
			dirtColor: '#daa520',
			wallColor: '#004687',    // Dodger blue
			skyColor: '#191970',     // Night sky
			lighting: 'night',
			features: ['palm_trees', 'parking_lot', 'hills']
		},
		
		gameplay: {
			homeRunFactor: 0.85,     // Pitcher's park
			doubleFactor: 1.1,
			tripleFactor: 1.0,
			pitcherAdvantage: 1.15
		}
	},
	
	// Inspired by Oracle Park (AT&T Park) - San Francisco
	bay_winds: {
		id: 'bay_winds',
		name: 'Bay Winds Ballpark',
		location: 'San Francisco Bay',
		description: 'Bay-side park with tricky winds and splash zone',
		opened: 2000,
		capacity: 41000,
		
		dimensions: {
			leftField: 339,
			leftCenter: 382,
			center: 399,
			rightCenter: 421,        // Triples Alley
			rightField: 309,         // Short but tall wall
			leftWallHeight: 8,
			centerWallHeight: 8,
			rightWallHeight: 25      // Tall right field wall
		},
		
		characteristics: {
			fenceDistance: 1.0,
			ballCarry: 0.9,          // Heavy marine air
			windFactor: -0.15,       // Wind blows in from right
			groundSpeed: 1.0,
			visibility: 1.0,
			quirks: ['splash_zone', 'triples_alley', 'marine_layer']
		},
		
		appearance: {
			grassColor: '#1f7a4d',
			dirtColor: '#b8860b',
			wallColor: '#013369',    // Giants colors
			rightWallColor: '#0d5d0d',
			skyColor: '#b0c4de',     // Foggy
			lighting: 'day',
			features: ['bay', 'boats', 'palm_court', 'coca_cola_slide']
		},
		
		gameplay: {
			homeRunFactor: 0.8,      // Very tough for power
			doubleFactor: 1.1,
			tripleFactor: 1.4,       // Triples Alley
			leftHandedPenalty: 1.3   // Lefties struggle
		}
	},
	
	// Inspired by Coors Field - Denver
	mile_high: {
		id: 'mile_high',
		name: 'Mile High Diamond',
		location: 'Rocky Mountains',
		description: 'Thin air creates a hitters paradise',
		opened: 1995,
		capacity: 50000,
		
		dimensions: {
			leftField: 347,
			leftCenter: 390,
			center: 415,             // Deepest in MLB
			rightCenter: 375,
			rightField: 350,
			leftWallHeight: 8,
			centerWallHeight: 8,
			rightWallHeight: 8
		},
		
		characteristics: {
			fenceDistance: 1.1,      // Deep fences
			ballCarry: 1.35,         // Altitude = more carry
			windFactor: 0.05,
			groundSpeed: 1.0,
			visibility: 1.0,
			quirks: ['altitude', 'humidor', 'thin_air']
		},
		
		appearance: {
			grassColor: '#2d5016',
			dirtColor: '#c2b280',
			wallColor: '#33006f',    // Purple (Rockies)
			skyColor: '#4169e1',     // Deep blue high altitude sky
			lighting: 'day',
			features: ['mountains', 'purple_row', 'fountain']
		},
		
		gameplay: {
			homeRunFactor: 1.4,      // Hitters paradise
			doubleFactor: 1.2,
			tripleFactor: 1.2,
			offenseBoost: 1.3        // Everything is amplified
		}
	},
	
	// Inspired by Camden Yards - Baltimore
	downtown_classic: {
		id: 'downtown_classic',
		name: 'Downtown Classic Park',
		location: 'Baltimore Harbor',
		description: 'Retro-modern design with warehouse backdrop',
		opened: 1992,
		capacity: 45000,
		
		dimensions: {
			leftField: 333,
			leftCenter: 364,
			center: 400,
			rightCenter: 373,
			rightField: 318,
			leftWallHeight: 7,
			centerWallHeight: 7,
			rightWallHeight: 25      // Warehouse
		},
		
		characteristics: {
			fenceDistance: 1.0,
			ballCarry: 1.0,
			windFactor: 0,
			groundSpeed: 1.0,
			visibility: 1.0,
			quirks: ['warehouse', 'retro', 'asymmetric']
		},
		
		appearance: {
			grassColor: '#228b22',
			dirtColor: '#daa520',
			wallColor: '#ed4c09',    // Orioles orange
			skyColor: '#87ceeb',
			lighting: 'day',
			features: ['warehouse', 'brick', 'flags']
		},
		
		gameplay: {
			homeRunFactor: 1.0,      // Balanced
			doubleFactor: 1.0,
			tripleFactor: 0.9,
			balanced: true
		}
	},
	
	// Inspired by Minute Maid Park - Houston
	retractable_dome: {
		id: 'retractable_dome',
		name: 'Retractable Dome Stadium',
		location: 'Downtown Houston',
		description: 'Indoor-outdoor park with deep left field',
		opened: 2000,
		capacity: 42000,
		
		dimensions: {
			leftField: 315,
			leftCenter: 362,
			center: 409,             // Deep center
			rightCenter: 373,
			rightField: 326,
			leftWallHeight: 19,      // Tals Hil (removed in 2016)
			centerWallHeight: 10,
			rightWallHeight: 7
		},
		
		characteristics: {
			fenceDistance: 1.0,
			ballCarry: 0.95,         // Indoor dampens ball
			windFactor: 0,           // No wind when closed
			groundSpeed: 1.05,       // Fast turf
			visibility: 1.0,
			quirks: ['retractable', 'crawford_boxes', 'train']
		},
		
		appearance: {
			grassColor: '#2d5016',
			dirtColor: '#8b7355',
			wallColor: '#eb6e1f',    // Astros orange
			skyColor: '#696969',     // Indoor lighting
			lighting: 'indoor',
			features: ['train', 'roof', 'boxes']
		},
		
		gameplay: {
			homeRunFactor: 1.05,
			doubleFactor: 1.0,
			tripleFactor: 0.8,
			leftHandedBonus: 1.1     // Crawford boxes help lefties
		}
	},
	
	// Inspired by Petco Park - San Diego
	beach_breeze: {
		id: 'beach_breeze',
		name: 'Beach Breeze Park',
		location: 'San Diego Bay',
		description: 'Ocean-side park with Western Metal Supply building',
		opened: 2004,
		capacity: 40000,
		
		dimensions: {
			leftField: 336,
			leftCenter: 367,
			center: 396,
			rightCenter: 391,
			rightField: 322,
			leftWallHeight: 19,      // Building
			centerWallHeight: 8,
			rightWallHeight: 8
		},
		
		characteristics: {
			fenceDistance: 1.02,
			ballCarry: 0.92,         // Marine layer
			windFactor: -0.1,        // Wind blows in
			groundSpeed: 1.0,
			visibility: 1.0,
			quirks: ['building', 'marine_layer', 'beach']
		},
		
		appearance: {
			grassColor: '#2ecc71',
			dirtColor: '#d2b48c',
			wallColor: '#2f241d',    // Brown (Padres)
			skyColor: '#87ceeb',
			lighting: 'day',
			features: ['building', 'park', 'ocean_view']
		},
		
		gameplay: {
			homeRunFactor: 0.85,     // Pitcher's park
			doubleFactor: 1.05,
			tripleFactor: 0.95,
			pitcherAdvantage: 1.1
		}
	},
	
	// Inspired by Globe Life Field - Texas
	texas_heat: {
		id: 'texas_heat',
		name: 'Texas Heat Dome',
		location: 'Arlington',
		description: 'New retractable roof park built for Texas heat',
		opened: 2020,
		capacity: 40000,
		
		dimensions: {
			leftField: 329,
			leftCenter: 374,
			center: 407,
			rightCenter: 374,
			rightField: 326,
			leftWallHeight: 8,
			centerWallHeight: 8,
			rightWallHeight: 8
		},
		
		characteristics: {
			fenceDistance: 1.0,
			ballCarry: 1.05,         // AC when closed helps ball
			windFactor: 0,
			groundSpeed: 1.0,
			visibility: 1.0,
			quirks: ['retractable', 'symmetrical', 'air_conditioned']
		},
		
		appearance: {
			grassColor: '#228b22',
			dirtColor: '#c19a6b',
			wallColor: '#003087',    // Rangers blue
			skyColor: '#87ceeb',
			lighting: 'day',
			features: ['roof', 'texas_themed', 'modern']
		},
		
		gameplay: {
			homeRunFactor: 1.0,
			doubleFactor: 1.0,
			tripleFactor: 0.95,
			balanced: true
		}
	}
};

// Helper function to get stadium by ID
export function getStadium(id) {
	return MLB_STADIUMS[id] || MLB_STADIUMS.green_monster;
}

// Helper function to get all stadium IDs
export function getAllStadiumIds() {
	return Object.keys(MLB_STADIUMS);
}

// Helper function to get stadium list for UI
export function getStadiumList() {
	return Object.values(MLB_STADIUMS).map(stadium => ({
		id: stadium.id,
		name: stadium.name,
		location: stadium.location,
		description: stadium.description
	}));
}

// Calculate hit outcomes based on stadium characteristics
export function adjustHitOutcome(stadium, baseOutcome, batterStats) {
	const chars = stadium.characteristics;
	const gameplay = stadium.gameplay;
	
	let adjustedPower = baseOutcome.power;
	let adjustedDistance = baseOutcome.distance;
	
	// Apply stadium modifiers
	adjustedDistance *= chars.fenceDistance;
	adjustedDistance *= chars.ballCarry;
	
	// Wind effects
	if (chars.windFactor > 0) {
		adjustedDistance *= (1 + chars.windFactor);
	} else if (chars.windFactor < 0) {
		adjustedDistance *= (1 + chars.windFactor);
	}
	
	// Determine if it's a home run based on adjusted distance
	const isHomeRun = adjustedDistance >= stadium.dimensions.center * gameplay.homeRunFactor;
	
	return {
		...baseOutcome,
		adjustedDistance,
		isHomeRun,
		stadium: stadium.id
	};
}
