/**
 * Stadium Integration Module
 * Integrates MLB-inspired stadiums into the baseball game
 */

import { MLB_STADIUMS, getStadium, adjustHitOutcome } from './mlb-stadiums.js';

// Get selected stadium from URL or sessionStorage
export function getSelectedStadium() {
	const params = new URLSearchParams(window.location.search);
	const urlStadium = params.get('stadium');
	const sessionStadium = sessionStorage.getItem('selectedStadium');
	
	const stadiumId = urlStadium || sessionStadium || 'green_monster';
	return getStadium(stadiumId);
}

// Apply stadium visual styling to the game field
export function applyStadiumVisuals(stadium) {
	const field = document.querySelector('.field');
	const backdrop = document.querySelector('.field-backdrop');
	
	if (!field || !backdrop) return;

	const appearance = stadium.appearance;
	
	// Set CSS custom properties for stadium colors
	document.documentElement.style.setProperty('--stadium-grass', appearance.grassColor);
	document.documentElement.style.setProperty('--stadium-dirt', appearance.dirtColor);
	document.documentElement.style.setProperty('--stadium-wall', appearance.wallColor);
	document.documentElement.style.setProperty('--stadium-sky', appearance.skyColor);
	
	// Update field background
	backdrop.style.background = appearance.skyColor;
	
	// Update grass color in SVG if exists
	const grassGradient = document.querySelector('#grassGradient');
	if (grassGradient) {
		const stops = grassGradient.querySelectorAll('stop');
		if (stops.length >= 2) {
			stops[0].setAttribute('stop-color', appearance.grassColor);
			stops[1].setAttribute('stop-color', adjustColor(appearance.grassColor, -20));
		}
	}

	// Update diamond (infield) colors
	const diamond = document.querySelector('.diamond');
	if (diamond) {
		diamond.style.setProperty('--infield-color', appearance.dirtColor);
	}

	// Add stadium-specific class for additional styling
	field.classList.add(`stadium-${stadium.id}`);
	
	// Update lighting (day/night)
	if (appearance.lighting === 'night') {
		field.classList.add('night-game');
		backdrop.style.background = `radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0f0f1e 100%)`;
	} else if (appearance.lighting === 'indoor') {
		field.classList.add('indoor-game');
		backdrop.style.background = `linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)`;
	}
}

// Helper function to darken/lighten color
function adjustColor(color, amount) {
	const hex = color.replace('#', '');
	const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
	const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
	const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Display stadium information in the game
export function displayStadiumInfo(stadium) {
	// Create or update stadium info panel
	let infoPanel = document.getElementById('stadiumInfo');
	
	if (!infoPanel) {
		infoPanel = document.createElement('div');
		infoPanel.id = 'stadiumInfo';
		infoPanel.className = 'stadium-info-panel';
		
		// Insert at the top of the game
		const header = document.querySelector('.score-header');
		if (header) {
			header.insertAdjacentElement('afterend', infoPanel);
		}
	}

	// Get gameplay characteristics
	const gameplay = stadium.gameplay || {};
	const hrFactor = gameplay.homeRunFactor || 1.0;
	
	let parkType = 'Balanced Park';
	if (hrFactor > 1.1) parkType = 'Hitters Park 🔥';
	else if (hrFactor < 0.9) parkType = 'Pitchers Park 🥶';

	infoPanel.innerHTML = `
		<div class="stadium-banner">
			<div class="stadium-banner-main">
				<span class="stadium-banner-icon">⚾</span>
				<div class="stadium-banner-text">
					<div class="stadium-banner-name">${stadium.name}</div>
					<div class="stadium-banner-details">${stadium.location} • ${parkType}</div>
				</div>
			</div>
			<div class="stadium-banner-dims">
				<span class="dim-label">LF: <strong>${stadium.dimensions.leftField}'</strong></span>
				<span class="dim-label">CF: <strong>${stadium.dimensions.center}'</strong></span>
				<span class="dim-label">RF: <strong>${stadium.dimensions.rightField}'</strong></span>
			</div>
			<button class="change-stadium-btn" onclick="window.location.href='./stadium-selector.html'">
				Change Stadium
			</button>
		</div>
	`;
}

// Apply stadium characteristics to hit outcomes
export function applyStadiumEffects(stadium, batter, pitcher, swingTiming) {
	const chars = stadium.characteristics;
	const gameplay = stadium.gameplay || {};
	
	// Base hit probability calculation
	const contactSkill = batter.contact || 0.5;
	const pitcherSkill = pitcher.pitching || 0.5;
	const timingBonus = 1.0 - Math.abs(swingTiming - 0.5) * 0.5;
	
	let hitProbability = (contactSkill - pitcherSkill * 0.5 + 0.25) * timingBonus;
	
	// Apply visibility effects
	hitProbability *= chars.visibility;
	
	// Determine if it's a hit
	const isHit = Math.random() < hitProbability;
	
	if (!isHit) {
		// It's an out
		return determineOutType(chars);
	}
	
	// It's a hit - determine type
	const powerRating = batter.power || 0.5;
	let distance = (powerRating * 100 + Math.random() * 50) * timingBonus;
	
	// Apply stadium modifiers to distance
	distance *= chars.ballCarry;
	distance *= (1 + chars.windFactor);
	
	// Determine hit type based on distance and stadium
	return determineHitType(distance, powerRating, stadium, gameplay);
}

function determineOutType(chars) {
	const roll = Math.random();
	
	if (roll < 0.33) {
		return { type: 'strikeout', bases: 0, description: 'Strikes out swinging.' };
	} else if (roll < 0.66) {
		return { type: 'groundout', bases: 0, description: 'Grounds out to the infield.' };
	} else {
		return { type: 'flyout', bases: 0, description: 'Fly ball caught for the out.' };
	}
}

function determineHitType(distance, power, stadium, gameplay) {
	const hrThreshold = stadium.dimensions.center * 0.95;
	const hrFactor = gameplay.homeRunFactor || 1.0;
	const doubleFactor = gameplay.doubleFactor || 1.0;
	const tripleFactor = gameplay.tripleFactor || 1.0;
	
	// Home Run
	if (distance >= hrThreshold * hrFactor) {
		return {
			type: 'homerun',
			bases: 4,
			description: `⚾ HOME RUN! The ball clears the ${stadium.dimensions.center}' center field wall!`,
			highlight: true
		};
	}
	
	// Triple (rare, requires speed + specific stadiums)
	if (distance >= hrThreshold * 0.85 && Math.random() < 0.15 * tripleFactor) {
		return {
			type: 'triple',
			bases: 3,
			description: 'Triple to the gap! Standing on third.',
			highlight: true
		};
	}
	
	// Double
	if (distance >= hrThreshold * 0.65 || Math.random() < 0.25 * doubleFactor) {
		return {
			type: 'double',
			bases: 2,
			description: 'Double down the line!',
			highlight: false
		};
	}
	
	// Single (default hit)
	return {
		type: 'single',
		bases: 1,
		description: 'Base hit!',
		highlight: false
	};
}

// Add stadium-specific CSS
export function injectStadiumStyles() {
	const style = document.createElement('style');
	style.id = 'stadium-styles';
	style.textContent = `
		.stadium-info-panel {
			margin: 0 0 20px 0;
		}

		.stadium-banner {
			background: linear-gradient(135deg, rgba(15, 29, 73, 0.9), rgba(30, 50, 100, 0.9));
			border: 2px solid rgba(255, 255, 255, 0.15);
			border-radius: 16px;
			padding: 16px 20px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 20px;
			flex-wrap: wrap;
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		}

		.stadium-banner-main {
			display: flex;
			align-items: center;
			gap: 12px;
		}

		.stadium-banner-icon {
			font-size: 2rem;
			filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
		}

		.stadium-banner-name {
			font-size: 1.3rem;
			font-weight: 800;
			color: var(--accent-gold, #facc15);
			text-shadow: 0 2px 4px rgba(0,0,0,0.5);
		}

		.stadium-banner-details {
			font-size: 0.85rem;
			color: var(--text-muted, #cbd5f5);
			opacity: 0.9;
		}

		.stadium-banner-dims {
			display: flex;
			gap: 16px;
			flex-wrap: wrap;
		}

		.dim-label {
			font-size: 0.9rem;
			color: var(--text-muted, #cbd5f5);
		}

		.dim-label strong {
			color: var(--accent-orange, #ff914d);
			font-weight: 800;
		}

		.change-stadium-btn {
			padding: 10px 18px;
			background: linear-gradient(135deg, rgba(255, 145, 77, 0.2), rgba(249, 168, 38, 0.2));
			border: 2px solid var(--accent-orange, #ff914d);
			border-radius: 12px;
			color: var(--text-primary, #f1f5f9);
			font-weight: 700;
			font-size: 0.9rem;
			cursor: pointer;
			transition: all 0.3s ease;
			white-space: nowrap;
		}

		.change-stadium-btn:hover {
			background: linear-gradient(135deg, rgba(255, 145, 77, 0.4), rgba(249, 168, 38, 0.4));
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(255, 145, 77, 0.4);
		}

		/* Stadium-specific field styling */
		.field.stadium-green_monster .base {
			background: var(--accent-gold, #facc15);
		}

		.field.night-game {
			filter: brightness(0.8);
		}

		.field.night-game .field-backdrop {
			background: radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0f0f1e 100%) !important;
		}

		.field.indoor-game .field-backdrop {
			background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%) !important;
		}

		/* Responsive */
		@media (max-width: 768px) {
			.stadium-banner {
				flex-direction: column;
				align-items: flex-start;
			}

			.stadium-banner-dims {
				flex-direction: column;
				gap: 8px;
			}

			.change-stadium-btn {
				width: 100%;
			}
		}
	`;
	
	document.head.appendChild(style);
}

// Initialize stadium integration
export function initStadiumIntegration() {
	const stadium = getSelectedStadium();
	
	// Inject stadium-specific styles
	injectStadiumStyles();
	
	// Apply visual styling
	applyStadiumVisuals(stadium);
	
	// Display stadium info
	displayStadiumInfo(stadium);
	
	// Store stadium for use in game logic
	window.currentStadium = stadium;
	
	console.log(`🏟️ Playing at: ${stadium.name} (${stadium.location})`);
	console.log(`📊 Stadium characteristics:`, stadium.characteristics);
	
	return stadium;
}

// Export stadium getter for use in game logic
export function getCurrentStadium() {
	return window.currentStadium || getSelectedStadium();
}
