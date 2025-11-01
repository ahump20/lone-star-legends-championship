const TEAM_DATA = [
	{
		name: "Oakdale Orbiters",
		shortName: "Orbiters",
		motto: "Skyline kids with launchpad swings.",
		colors: { primary: "#ff914d", accent: "#facc15" },
		lineup: [
			{
				name: "Jazzy Harper",
				nickname: "Skyhook",
				emoji: "🛼",
				position: "CF",
				contact: 0.68,
				power: 0.52,
				speed: 0.88,
				discipline: 0.61,
				pitching: 0.32,
			},
			{
				name: "Theo Sparks",
				nickname: "Torch",
				emoji: "🔥",
				position: "SS",
				contact: 0.63,
				power: 0.58,
				speed: 0.72,
				discipline: 0.59,
				pitching: 0.28,
			},
			{
				name: "Riley Moon",
				nickname: "Orbit",
				emoji: "🌙",
				position: "1B",
				contact: 0.66,
				power: 0.64,
				speed: 0.58,
				discipline: 0.57,
				pitching: 0.35,
			},
			{
				name: "Maya Cruz",
				nickname: "Pulse",
				emoji: "🎧",
				position: "3B",
				contact: 0.61,
				power: 0.49,
				speed: 0.74,
				discipline: 0.6,
				pitching: 0.31,
			},
			{
				name: "Cam Gardner",
				nickname: "Rotor",
				emoji: "🛩️",
				position: "P",
				contact: 0.54,
				power: 0.46,
				speed: 0.62,
				discipline: 0.65,
				pitching: 0.72,
			},
			{
				name: "Nia Brooks",
				nickname: "Glide",
				emoji: "🪁",
				position: "LF",
				contact: 0.6,
				power: 0.44,
				speed: 0.86,
				discipline: 0.53,
				pitching: 0.3,
			},
			{
				name: "Miles Avery",
				nickname: "Blueprint",
				emoji: "📐",
				position: "C",
				contact: 0.58,
				power: 0.48,
				speed: 0.53,
				discipline: 0.69,
				pitching: 0.33,
			},
			{
				name: "Harper Quinn",
				nickname: "Boost",
				emoji: "⚡",
				position: "2B",
				contact: 0.57,
				power: 0.43,
				speed: 0.8,
				discipline: 0.55,
				pitching: 0.3,
			},
			{
				name: "Dez Coleman",
				nickname: "Launch",
				emoji: "🚀",
				position: "RF",
				contact: 0.52,
				power: 0.62,
				speed: 0.7,
				discipline: 0.47,
				pitching: 0.28,
			},
		],
		pitcherIndex: 4,
	},
	{
		name: "Cactus Gulch Roadrunners",
		shortName: "Roadrunners",
		motto: "Desert dashers with wheels for days.",
		colors: { primary: "#25d0b4", accent: "#60a5fa" },
		lineup: [
			{
				name: "Sunny Delgado",
				nickname: "Flash",
				emoji: "🌞",
				position: "CF",
				contact: 0.64,
				power: 0.5,
				speed: 0.9,
				discipline: 0.6,
				pitching: 0.34,
			},
			{
				name: "Kai Navarro",
				nickname: "Coyote",
				emoji: "🪶",
				position: "SS",
				contact: 0.62,
				power: 0.55,
				speed: 0.82,
				discipline: 0.58,
				pitching: 0.31,
			},
			{
				name: "June Morales",
				nickname: "Thunder",
				emoji: "🌩️",
				position: "1B",
				contact: 0.65,
				power: 0.67,
				speed: 0.56,
				discipline: 0.52,
				pitching: 0.3,
			},
			{
				name: "Atlas Reed",
				nickname: "Howitzer",
				emoji: "💥",
				position: "3B",
				contact: 0.58,
				power: 0.71,
				speed: 0.6,
				discipline: 0.49,
				pitching: 0.35,
			},
			{
				name: "Lena Ortiz",
				nickname: "Screwball",
				emoji: "🪀",
				position: "P",
				contact: 0.52,
				power: 0.42,
				speed: 0.68,
				discipline: 0.66,
				pitching: 0.74,
			},
			{
				name: "Piper Sloan",
				nickname: "Jet",
				emoji: "🛹",
				position: "LF",
				contact: 0.6,
				power: 0.48,
				speed: 0.86,
				discipline: 0.55,
				pitching: 0.29,
			},
			{
				name: "Eli Booker",
				nickname: "Signal",
				emoji: "📡",
				position: "C",
				contact: 0.56,
				power: 0.44,
				speed: 0.54,
				discipline: 0.67,
				pitching: 0.32,
			},
			{
				name: "Nova Ellis",
				nickname: "Skip",
				emoji: "🪩",
				position: "2B",
				contact: 0.55,
				power: 0.46,
				speed: 0.78,
				discipline: 0.62,
				pitching: 0.28,
			},
			{
				name: "Trace Kim",
				nickname: "Dustup",
				emoji: "🌪️",
				position: "RF",
				contact: 0.5,
				power: 0.6,
				speed: 0.7,
				discipline: 0.46,
				pitching: 0.27,
			},
		],
		pitcherIndex: 4,
	},
];

const USER_TEAM_INDEX = 1;
const PITCH_BASE_DURATION = 1500;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

class TeamState {
	constructor(config, index) {
		this.index = index;
		this.config = config;
		this.lineup = config.lineup.map((player, order) => {
			const copy = { ...player };
			copy.order = order + 1;
			copy.teamIndex = index;
			copy.stats = {
				atBats: 0,
				hits: 0,
				runs: 0,
				rbis: 0,
				walks: 0,
				homeRuns: 0,
			};
			return copy;
		});
		this.pitcherIndex = config.pitcherIndex ?? 0;
		this.pitcher = this.lineup[this.pitcherIndex];
		this.lineupCursor = 0;
		this.runsPerInning = [0, 0, 0];
		this.totalRuns = 0;
		this.totalHits = 0;
	}

	nextBatter() {
		const batter = this.lineup[this.lineupCursor];
		this.lineupCursor = (this.lineupCursor + 1) % this.lineup.length;
		return batter;
	}

	reset() {
		this.lineup.forEach((player) => {
			player.stats.atBats = 0;
			player.stats.hits = 0;
			player.stats.runs = 0;
			player.stats.rbis = 0;
			player.stats.walks = 0;
			player.stats.homeRuns = 0;
		});
		this.pitcher = this.lineup[this.pitcherIndex];
		this.lineupCursor = 0;
		this.runsPerInning = [0, 0, 0];
		this.totalRuns = 0;
		this.totalHits = 0;
	}
}

class SandlotShowdown {
	constructor() {
		this.teams = TEAM_DATA.map((team, index) => new TeamState(team, index));
		this.inning = 1;
		this.half = "top";
		this.outs = 0;
		this.bases = [null, null, null];
		this.currentBatter = null;
		this.count = { balls: 0, strikes: 0 };
		this.gameOver = false;
		this.playLog = [];

		this.pitchInProgress = false;
		this.pitchData = null;
		this.pitchAnimationFrame = null;
		this.pitchPointerProgress = 0;

		this.cacheElements();
		this.bindEvents();
		this.initializeGame();
	}

	cacheElements() {
		this.teamCards = [
			document.getElementById("teamCard0"),
			document.getElementById("teamCard1"),
		];
		this.teamLineups = [
			document.getElementById("team0Lineup"),
			document.getElementById("team1Lineup"),
		];
		this.teamMottos = [
			document.getElementById("team0Motto"),
			document.getElementById("team1Motto"),
		];
		this.teamNameBindings = [
			document.querySelector('tr[data-team="0"] .team-name'),
			document.querySelector('tr[data-team="1"] .team-name'),
		];
		this.teamSwatches = [
			document.querySelector('tr[data-team="0"] .team-swatch'),
			document.querySelector('tr[data-team="1"] .team-swatch'),
		];
		this.scoreRows = [
			document.querySelector('tr[data-team="0"]'),
			document.querySelector('tr[data-team="1"]'),
		];
		this.halfLabel = document.getElementById("halfLabel");
		this.inningLabel = document.getElementById("inningLabel");
		this.outsLabel = document.getElementById("outsLabel");
		this.countLabel = document.getElementById("countLabel");
		this.highlightBanner = document.getElementById("highlightBanner");
		this.batterName = document.getElementById("currentBatterName");
		this.batterDetail = document.getElementById("currentBatterDetail");
		this.batterAvatar = document.getElementById("currentBatterAvatar");
		this.playLogList = document.getElementById("playLog");
		this.finalBanner = document.getElementById("finalBanner");
		this.finalTitle = document.getElementById("finalTitle");
		this.finalSubtitle = document.getElementById("finalSubtitle");
		this.meterTarget = document.getElementById("meterTarget");
		this.meterPointer = document.getElementById("meterPointer");
		this.swingHint = document.getElementById("swingHint");
		this.playButton = document.querySelector('[data-action="play"]');
		this.swingButton = document.querySelector('[data-action="swing"]');
	}

	bindEvents() {
		this.playButton.addEventListener("click", () => this.playNext());
		document
			.querySelector('[data-action="reset"]')
			.addEventListener("click", () => this.resetGame());
		document
			.querySelector('[data-action="close-final"]')
			.addEventListener("click", () => this.hideFinalBanner());
		this.swingButton.addEventListener("click", () => this.handleSwing());

		window.addEventListener("keydown", (event) => {
			if (event.code === "Space") {
				event.preventDefault();
				if (this.pitchInProgress && this.isUserHalf()) {
					this.handleSwing();
				} else {
					this.playNext();
				}
			} else if (event.code === "KeyJ") {
				event.preventDefault();
				this.handleSwing();
			} else if (event.code === "KeyR") {
				this.resetGame();
			}
		});
	}

	initializeGame() {
		this.teams.forEach((teamState, index) => {
			this.renderTeamCard(teamState, index);
		});
		this.resetGame();
	}

	renderTeamCard(teamState, index) {
		const card = this.teamCards[index];
		card.style.setProperty("--team-color", teamState.config.colors.primary);
		card.style.setProperty("--team-accent", teamState.config.colors.accent);
		const heading = card.querySelector("h2");
		heading.textContent = teamState.config.name;
		this.teamMottos[index].textContent = teamState.config.motto;
		this.teamNameBindings[index].textContent = teamState.config.shortName;
		this.teamSwatches[index].style.background = teamState.config.colors.primary;
	}

	resetGame() {
		this.clearPitchAnimation();
		this.pitchInProgress = false;
		this.pitchData = null;
		this.pitchPointerProgress = 0;
		this.teams.forEach((team) => {
			team.reset();
		});
		this.inning = 1;
		this.half = "top";
		this.outs = 0;
		this.bases = [null, null, null];
		this.currentBatter = null;
		this.count = { balls: 0, strikes: 0 };
		this.gameOver = false;
		this.playLog = [];
		this.finalBanner.classList.remove("show");
		this.finalBanner.setAttribute("aria-hidden", "true");
		this.playButton.disabled = false;
		this.updateSwingButton(false);
		this.ensureCurrentBatter();
		this.updateAllUI();
		this.pushLog({
			type: "info",
			text: "Play ball! Orbiters bat first in the top of the 1st.",
		});
	}

	updateSwingButton(active) {
		if (active) {
			this.swingButton.disabled = false;
			this.swingButton.setAttribute("aria-pressed", "true");
		} else {
			this.swingButton.disabled = true;
			this.swingButton.setAttribute("aria-pressed", "false");
		}
	}

	clearPitchAnimation() {
		if (this.pitchAnimationFrame) {
			cancelAnimationFrame(this.pitchAnimationFrame);
			this.pitchAnimationFrame = null;
		}
	}

	isUserHalf() {
		const battingTeam = this.getBattingTeam();
		return (
			!this.gameOver &&
			this.half === "bottom" &&
			battingTeam.index === USER_TEAM_INDEX
		);
	}

	playNext() {
		if (this.gameOver || this.pitchInProgress) {
			return;
		}
		this.ensureCurrentBatter();
		if (this.isUserHalf()) {
			this.startUserPitch();
		} else {
			this.resolveCpuPlateAppearance();
		}
	}

	ensureCurrentBatter() {
		if (this.gameOver) {
			return;
		}
		if (!this.currentBatter) {
			const battingTeam = this.getBattingTeam();
			this.currentBatter = battingTeam.nextBatter();
			this.count = { balls: 0, strikes: 0 };
		}
		this.updateCurrentBatterUI();
		this.updateCountUI();
	}

	startUserPitch() {
		const batter = this.currentBatter;
		if (!batter) {
			return;
		}
		const pitcher = this.getFieldingTeam().pitcher;
		const controlGap = pitcher.pitching - batter.discipline;
		const contactBonus = batter.contact - 0.5;
		const windowWidth = clamp(
			0.18 - controlGap * 0.08 + contactBonus * 0.04,
			0.09,
			0.28,
		);
		const center = 0.2 + Math.random() * 0.6;
		const width = windowWidth;
		const left = clamp(center - width / 2, 0.02, 0.98 - width);
		const strikeChance = clamp(
			0.55 + pitcher.pitching * 0.25 - batter.discipline * 0.18,
			0.25,
			0.85,
		);
		const duration = clamp(
			PITCH_BASE_DURATION - (pitcher.pitching - batter.speed) * 300,
			1050,
			1900,
		);

		this.pitchData = {
			center,
			radius: width / 2,
			isStrike: Math.random() < strikeChance,
			duration,
			startTime: null,
		};
		this.pitchPointerProgress = 0;
		this.pitchInProgress = true;
		this.playButton.disabled = true;
		this.updateSwingButton(true);
		this.meterPointer.classList.add("live");
		this.meterPointer.style.left = "0%";
		this.meterTarget.style.left = `${left * 100}%`;
		this.meterTarget.style.width = `${width * 100}%`;
		this.meterTarget.style.opacity = "0.85";
		this.swingHint.textContent =
			"Swing while the pointer glows in the gold zone!";

		const step = (timestamp) => {
			if (!this.pitchInProgress || !this.pitchData) {
				return;
			}
			if (!this.pitchData.startTime) {
				this.pitchData.startTime = timestamp;
			}
			const elapsed = timestamp - this.pitchData.startTime;
			const progress = clamp(elapsed / this.pitchData.duration, 0, 1);
			this.pitchPointerProgress = progress;
			this.meterPointer.style.left = `${progress * 100}%`;
			if (progress >= 1) {
				this.handlePitchExpiration();
				return;
			}
			this.pitchAnimationFrame = requestAnimationFrame(step);
		};

		this.pitchAnimationFrame = requestAnimationFrame(step);
	}

	handleSwing() {
		if (!this.pitchInProgress || !this.isUserHalf() || !this.pitchData) {
			return;
		}
		const batter = this.currentBatter;
		if (!batter) {
			return;
		}
		const pitcher = this.getFieldingTeam().pitcher;
		const { center, radius } = this.pitchData;
		const diff = Math.abs(this.pitchPointerProgress - center);
		const rawQuality = 1 - diff / radius;
		const adjustedQuality = clamp(
			rawQuality - (pitcher.pitching - 0.5) * 0.18,
			-1,
			1,
		);
		this.finishPitch();

		if (adjustedQuality <= 0) {
			this.recordStrike(
				batter,
				`${batter.nickname} comes up empty on the swing.`,
			);
			this.updateAllUI();
			return;
		}

		const result = this.resolveSwingResult(
			clamp(adjustedQuality, 0, 1),
			batter,
			pitcher,
		);
		if (result.type === "foul") {
			this.handleFoul(batter, result.message);
			this.updateAllUI();
			return;
		}
		this.applyOutcome(result.type, batter, result.message);
	}

	resolveSwingResult(quality, batter, _pitcher) {
		const contact = batter.contact ?? 0.5;
		const power = batter.power ?? 0.5;
		const speed = batter.speed ?? 0.5;
		if (quality > 0.92) {
			const hrChance = clamp(0.35 + (power - 0.5) * 0.6, 0.1, 0.85);
			if (Math.random() < hrChance) {
				return {
					type: "home_run",
					message: "Crushed! Moonshot over the neighborhood fence!",
				};
			}
			const tripleChance = clamp(0.2 + (speed - 0.5) * 0.35, 0.05, 0.45);
			if (Math.random() < tripleChance) {
				return {
					type: "triple",
					message: "Legs churning—triple to the alley!",
				};
			}
			return { type: "double", message: "Smoke to the gap for a double!" };
		}
		if (quality > 0.78) {
			const extraChance = clamp(0.25 + (power - 0.5) * 0.35, 0.05, 0.6);
			if (Math.random() < extraChance) {
				return { type: "double", message: "Drives it deep for extra bases!" };
			}
			return { type: "single", message: "Lines a single up the middle." };
		}
		if (quality > 0.6) {
			const singleChance = clamp(0.55 + (contact - 0.5) * 0.3, 0.3, 0.85);
			if (Math.random() < singleChance) {
				return {
					type: "single",
					message: "Drops in front of the fielder for a knock.",
				};
			}
			const outType = Math.random() < 0.5 ? "groundout" : "flyout";
			return {
				type: outType,
				message: "Puts it in play but the defense is ready.",
			};
		}
		if (quality > 0.45) {
			if (Math.random() < 0.5) {
				return { type: "foul", message: "Just foul down the line." };
			}
			const outType = Math.random() < 0.6 ? "groundout" : "flyout";
			return { type: outType, message: "Rolls over it for an out." };
		}
		return { type: "foul", message: "Nicks it foul to stay alive." };
	}

	handleFoul(batter, message = "Spoils it foul.") {
		if (this.count.strikes < 2) {
			this.count.strikes += 1;
			this.pushLog({ type: "out", text: `${batter.name}: ${message}` });
			this.showHighlight(message, "out");
		} else {
			this.pushLog({ type: "info", text: `${batter.name}: ${message}` });
		}
		this.updateCountUI();
	}

	recordBall(batter, description) {
		this.count.balls += 1;
		if (this.count.balls >= 4) {
			this.handleWalk(batter);
			return;
		}
		this.pushLog({ type: "walk", text: `${batter.name}: ${description}` });
		this.showHighlight(description, "walk");
		this.updateCountUI();
	}

	recordStrike(batter, description, options = {}) {
		this.count.strikes += 1;
		if (this.count.strikes >= 3) {
			const finalMessage = options.called
				? "Caught looking at strike three."
				: description;
			this.handleOut(batter, finalMessage);
			return;
		}
		const type = options.called ? "info" : "out";
		this.pushLog({ type, text: `${batter.name}: ${description}` });
		this.showHighlight(description, "out");
		this.updateCountUI();
	}
	handlePitchExpiration() {
		if (!this.pitchData) {
			return;
		}
		const batter = this.currentBatter;
		const wasStrike = this.pitchData.isStrike;
		this.finishPitch();
		if (!batter) {
			return;
		}
		if (wasStrike) {
			this.recordStrike(batter, "Watches strike paint the corner.", {
				called: true,
			});
		} else {
			this.recordBall(batter, "Lets the pitch sail wide.");
		}
		this.updateAllUI();
	}

	finishPitch() {
		this.clearPitchAnimation();
		this.pitchInProgress = false;
		this.pitchData = null;
		this.playButton.disabled = this.gameOver;
		this.updateSwingButton(false);
		this.meterPointer.classList.remove("live");
		this.meterPointer.style.left = "0%";
	}

	updateAllUI() {
		this.updateStatusChips();
		this.updateBasesUI();
		this.updateScoreboard();
		this.updateLineups();
		this.updateCurrentBatterUI();
		this.updateCountUI();
		if (!this.pitchInProgress) {
			this.updateMeterIdleState();
		}
		this.renderLog();
	}

	updateMeterIdleState() {
		if (this.pitchInProgress) {
			return;
		}
		this.meterPointer.classList.remove("live");
		this.meterPointer.style.left = "0%";
		if (this.gameOver) {
			this.meterTarget.style.width = "0%";
			this.meterTarget.style.opacity = "0.2";
			this.swingHint.textContent = "Final. Hit reset to run it back.";
			return;
		}
		if (this.isUserHalf()) {
			this.meterTarget.style.width = "18%";
			this.meterTarget.style.left = "41%";
			this.meterTarget.style.opacity = "0.35";
			this.swingHint.textContent =
				"Press “Next Play” to start a pitch. Swing while the pointer is in the gold.";
		} else {
			this.meterTarget.style.width = "0%";
			this.meterTarget.style.opacity = "0.15";
			this.swingHint.textContent =
				"Orbiters bat automatically—tap “Next Play” to advance plays.";
		}
	}

	updateStatusChips() {
		const halfText = this.half === "top" ? "Top" : "Bottom";
		const inningSuffix = this.getInningSuffix(this.inning);
		this.halfLabel.textContent = halfText;
		this.inningLabel.textContent = `${this.inning}${inningSuffix} Inning`;
		this.outsLabel.textContent = `${this.outs} ${this.outs === 1 ? "Out" : "Outs"}`;
	}

	getInningSuffix(inning) {
		if (inning === 1) return "st";
		if (inning === 2) return "nd";
		if (inning === 3) return "rd";
		return "th";
	}

	updateScoreboard() {
		this.teams.forEach((team, index) => {
			const row = this.scoreRows[index];
			for (let inning = 1; inning <= 3; inning++) {
				const cell = row.querySelector(`td[data-inning="${inning}"]`);
				cell.textContent = team.runsPerInning[inning - 1] ?? 0;
			}
			row.querySelector('[data-field="runs"]').textContent = team.totalRuns;
			row.querySelector('[data-field="hits"]').textContent = team.totalHits;
		});
	}

	updateBasesUI() {
		document.querySelectorAll(".base[data-base]").forEach((base) => {
			base.classList.remove("active");
		});
		this.bases.forEach((runner, index) => {
			if (runner) {
				const baseElement = document.querySelector(
					`.base[data-base="${index + 1}"]`,
				);
				if (baseElement) {
					baseElement.classList.add("active");
				}
			}
		});
	}

	updateLineups() {
		this.teams.forEach((team, teamIndex) => {
			const lineupList = this.teamLineups[teamIndex];
			lineupList.innerHTML = "";
			team.lineup.forEach((player) => {
				const item = document.createElement("li");
				if (
					this.currentBatter &&
					this.currentBatter.name === player.name &&
					this.currentBatter.teamIndex === teamIndex
				) {
					item.classList.add("active");
				}
				item.innerHTML = `
                    <span class="player-order">${player.order}</span>
                    <span class="player-name">${player.emoji} ${player.name}</span>
                    <span class="player-detail">${player.position} · ${player.stats.hits}-${player.stats.atBats} · ${player.stats.runs} R</span>
                `;
				lineupList.appendChild(item);
			});
		});
	}

	updateCurrentBatterUI() {
		if (!this.currentBatter) {
			this.batterName.textContent = "On deck";
			this.batterDetail.textContent = "Next hitter strides up soon.";
			this.batterAvatar.textContent = "⚾️";
			return;
		}
		const batter = this.currentBatter;
		const avg =
			batter.stats.atBats > 0
				? batter.stats.hits / batter.stats.atBats
				: batter.contact;
		const avgDisplay = avg.toFixed(3).replace("0.", ".");
		this.batterName.textContent = `${batter.emoji} ${batter.name}`;
		this.batterDetail.textContent = `${batter.nickname} · ${batter.position} · AVG ${avgDisplay}`;
		this.batterAvatar.textContent = batter.emoji;
	}

	updateCountUI() {
		this.countLabel.textContent = `Count ${this.count.balls}-${this.count.strikes}`;
	}

	renderLog() {
		this.playLogList.innerHTML = "";
		this.playLog.slice(0, 12).forEach((entry) => {
			const item = document.createElement("li");
			if (entry.type) {
				item.classList.add(entry.type);
			}
			const tag = document.createElement("span");
			tag.className = "log-tag";
			tag.textContent = (entry.type ?? "info").toUpperCase();
			item.appendChild(tag);
			const text = document.createElement("span");
			text.textContent = entry.text;
			item.appendChild(text);
			this.playLogList.appendChild(item);
		});
	}

	pushLog(entry) {
		this.playLog.unshift(entry);
		if (this.playLog.length > 40) {
			this.playLog.length = 40;
		}
		this.renderLog();
	}

	getBattingTeam() {
		return this.half === "top" ? this.teams[0] : this.teams[1];
	}

	getFieldingTeam() {
		return this.half === "top" ? this.teams[1] : this.teams[0];
	}

	resolveCpuPlateAppearance() {
		if (!this.currentBatter) {
			this.currentBatter = this.getBattingTeam().nextBatter();
			this.count = { balls: 0, strikes: 0 };
		}
		const batter = this.currentBatter;
		const pitcher = this.getFieldingTeam().pitcher;
		const outcome = this.determineCpuOutcome(batter, pitcher);
		this.applyOutcome(outcome, batter);
	}

	determineCpuOutcome(batter, pitcher) {
		const battingContact = batter.contact ?? 0.5;
		const battingPower = batter.power ?? 0.5;
		const battingSpeed = batter.speed ?? 0.5;
		const battingDiscipline = batter.discipline ?? 0.5;
		const pitchingSkill = pitcher.pitching ?? 0.5;

		const outcomes = [
			{
				type: "walk",
				weight: 0.06 + (battingDiscipline - pitchingSkill) * 0.1,
			},
			{
				type: "strikeout",
				weight: 0.16 + (pitchingSkill - battingContact) * 0.18,
			},
			{ type: "single", weight: 0.28 + (battingContact - 0.5) * 0.3 },
			{ type: "double", weight: 0.12 + (battingPower - 0.5) * 0.18 },
			{ type: "triple", weight: 0.03 + (battingSpeed - 0.5) * 0.06 },
			{ type: "home_run", weight: 0.06 + (battingPower - 0.5) * 0.16 },
			{ type: "groundout", weight: 0.11 - (battingSpeed - 0.5) * 0.12 },
			{ type: "flyout", weight: 0.08 - (battingPower - 0.5) * 0.08 },
			{ type: "lineout", weight: 0.04 },
		];

		const sanitized = outcomes.map((outcome) => ({
			...outcome,
			weight: Math.max(0.02, outcome.weight),
		}));
		const totalWeight = sanitized.reduce(
			(sum, outcome) => sum + outcome.weight,
			0,
		);
		let random = Math.random() * totalWeight;
		for (const outcome of sanitized) {
			random -= outcome.weight;
			if (random <= 0) {
				return outcome.type;
			}
		}
		return "groundout";
	}

	applyOutcome(type, batter, customMessage) {
		switch (type) {
			case "walk":
				this.handleWalk(batter);
				break;
			case "single":
				this.handleHit(
					batter,
					1,
					customMessage ?? "Rips a single into the gap.",
				);
				break;
			case "double":
				this.handleHit(
					batter,
					2,
					customMessage ?? "Splits the alley for a stand-up double!",
				);
				break;
			case "triple":
				this.handleHit(
					batter,
					3,
					customMessage ?? "Rattles off the fence—triple time!",
				);
				break;
			case "home_run":
				this.handleHit(batter, 4, customMessage ?? "Launches a backyard bomb!");
				break;
			case "strikeout":
				this.handleOut(batter, customMessage ?? "K'd on the heater.");
				break;
			case "groundout":
				this.handleOut(
					batter,
					customMessage ?? "Chopped on the ground and scooped.",
				);
				break;
			case "flyout":
				this.handleOut(
					batter,
					customMessage ?? "High fly pulled in on the run.",
				);
				break;
			default:
				this.handleOut(batter, customMessage ?? "Laser snagged in mid-air.");
				break;
		}
	}

	handleWalk(batter) {
		batter.stats.walks += 1;
		this.pushLog({
			type: "walk",
			text: `${batter.name} draws ball four and trots to first.`,
		});
		const scored = this.advanceWalk(batter);
		if (scored.length) {
			this.processRuns(scored, batter, "Ball four forces a run!");
		} else {
			this.showHighlight("Ball four! Take your base.", "walk");
		}
		this.count = { balls: 0, strikes: 0 };
		if (this.gameOver) {
			return;
		}
		this.queueNextBatter();
		this.updateAllUI();
	}

	handleHit(batter, basesTaken, message) {
		batter.stats.atBats += 1;
		batter.stats.hits += 1;
		if (basesTaken === 4) {
			batter.stats.homeRuns += 1;
		}
		const team = this.getBattingTeam();
		team.totalHits += 1;
		const scoredPlayers = this.advanceRunners(basesTaken, batter);
		const highlightType = basesTaken >= 3 ? "score" : "hit";
		const runsText = this.describeRuns(scoredPlayers.length, batter);
		const defaultMessage = message ?? this.defaultHitMessage(basesTaken);
		const logText = `${batter.name}: ${defaultMessage} ${runsText}`.trim();
		this.pushLog({ type: highlightType, text: logText });
		if (scoredPlayers.length) {
			this.processRuns(scoredPlayers, batter, defaultMessage);
		} else {
			this.showHighlight(defaultMessage, highlightType);
		}
		if (this.gameOver) {
			return;
		}
		this.queueNextBatter();
		this.updateAllUI();
	}

	defaultHitMessage(basesTaken) {
		if (basesTaken === 1) return "Rips a single into the gap.";
		if (basesTaken === 2) return "Splits the alley for a stand-up double!";
		if (basesTaken === 3) return "Rattles off the fence—triple time!";
		return "Launches a backyard bomb!";
	}

	describeRuns(runCount, batter) {
		if (runCount === 0) return "";
		if (runCount === 1) return `${batter.nickname} plates one.`;
		if (runCount === 2) return "Two runners hustle home!";
		if (runCount === 3) return "Bases clear!";
		return "Everybody scores!";
	}

	handleOut(batter, description) {
		batter.stats.atBats += 1;
		this.outs += 1;
		this.pushLog({ type: "out", text: `${batter.name}: ${description}` });
		this.showHighlight(description, "out");
		if (this.outs >= 3) {
			this.endHalfInning();
		} else {
			this.queueNextBatter();
			this.updateAllUI();
		}
	}

	advanceWalk(batter) {
		const before = [...this.bases];
		const newBases = [...this.bases];
		const scored = [];
		for (let base = 2; base >= 0; base--) {
			const runner = before[base];
			if (!runner) continue;
			let forced = true;
			for (let check = 0; check < base; check++) {
				if (!before[check]) {
					forced = false;
					break;
				}
			}
			if (forced) {
				const destination = base + 1;
				newBases[base] = null;
				if (destination >= 3) {
					scored.push(runner);
				} else {
					newBases[destination] = runner;
				}
			}
		}
		newBases[0] = batter;
		this.bases = newBases;
		return scored;
	}

	advanceRunners(steps, batter) {
		const prior = [...this.bases];
		const newBases = [null, null, null];
		const scored = [];
		for (let base = 2; base >= 0; base--) {
			const runner = prior[base];
			if (!runner) continue;
			const destination = base + steps;
			if (destination >= 3) {
				scored.push(runner);
			} else {
				newBases[destination] = runner;
			}
		}
		if (steps >= 4) {
			scored.push(batter);
		} else {
			const batterDestination = steps - 1;
			if (batterDestination >= 3) {
				scored.push(batter);
			} else {
				newBases[batterDestination] = batter;
			}
		}
		this.bases = newBases;
		return scored;
	}

	processRuns(scoredPlayers, batter, highlightMessage) {
		const battingTeam = this.getBattingTeam();
		scoredPlayers.forEach((player) => {
			battingTeam.totalRuns += 1;
			battingTeam.runsPerInning[this.inning - 1] += 1;
			player.stats.runs += 1;
		});
		batter.stats.rbis += scoredPlayers.length;
		this.pushLog({
			type: "score",
			text: `${scoredPlayers.length} run${scoredPlayers.length === 1 ? "" : "s"} cross. ${highlightMessage}`,
		});
		this.showHighlight(`${scoredPlayers.length} score!`, "score");
		this.checkWalkOff();
	}

	checkWalkOff() {
		if (this.inning === 3 && this.half === "bottom") {
			const home = this.teams[1];
			const away = this.teams[0];
			if (home.totalRuns > away.totalRuns) {
				this.endGame(
					`${home.config.name} walk it off!`,
					`${home.totalRuns}-${away.totalRuns} final.`,
				);
			}
		}
	}

	queueNextBatter() {
		if (this.gameOver || this.outs >= 3) {
			return;
		}
		const battingTeam = this.getBattingTeam();
		this.currentBatter = battingTeam.nextBatter();
		this.count = { balls: 0, strikes: 0 };
		this.updateCurrentBatterUI();
		this.updateCountUI();
		if (this.isUserHalf()) {
			this.updateMeterIdleState();
		}
	}

	endHalfInning() {
		const battingTeam = this.getBattingTeam();
		const fieldingTeam = this.getFieldingTeam();
		this.pushLog({
			type: "info",
			text: `${battingTeam.config.shortName} strand ${this.runnersLeft()} and ${fieldingTeam.config.shortName} grab their bats.`,
		});
		this.bases = [null, null, null];
		this.outs = 0;
		this.currentBatter = null;
		this.count = { balls: 0, strikes: 0 };
		this.clearPitchAnimation();
		this.pitchInProgress = false;
		this.updateSwingButton(false);
		if (this.half === "top") {
			this.half = "bottom";
			if (
				this.inning === 3 &&
				this.teams[1].totalRuns > this.teams[0].totalRuns
			) {
				this.endGame(
					`${this.teams[1].config.name} win it without swinging in the 3rd!`,
					`${this.teams[1].totalRuns}-${this.teams[0].totalRuns} final.`,
				);
				return;
			}
		} else {
			if (this.inning === 3) {
				this.finishRegulation();
				return;
			}
			this.inning += 1;
			this.half = "top";
		}
		this.ensureCurrentBatter();
		this.updateAllUI();
	}

	runnersLeft() {
		const count = this.bases.filter(Boolean).length;
		if (count === 0) return "no one";
		if (count === 1) return "a runner";
		return `${count} runners`;
	}

	finishRegulation() {
		const home = this.teams[1];
		const away = this.teams[0];
		if (home.totalRuns > away.totalRuns) {
			this.endGame(
				`${home.config.name} defend their turf!`,
				`${home.totalRuns}-${away.totalRuns} final.`,
			);
		} else if (away.totalRuns > home.totalRuns) {
			this.endGame(
				`${away.config.name} steal the road win!`,
				`${away.totalRuns}-${home.totalRuns} final.`,
			);
		} else {
			this.endGame(
				"Three innings and we stay tied!",
				`${away.totalRuns}-${home.totalRuns} backyard draw.`,
			);
		}
	}

	showHighlight(message, type) {
		this.highlightBanner.textContent = message;
		this.highlightBanner.classList.remove(
			"show",
			"hit",
			"score",
			"out",
			"walk",
		);
		if (type) {
			this.highlightBanner.classList.add(type);
		}
		requestAnimationFrame(() => {
			this.highlightBanner.classList.add("show");
		});
		clearTimeout(this.highlightTimeout);
		this.highlightTimeout = setTimeout(() => {
			this.highlightBanner.classList.remove("show");
		}, 2000);
	}

	endGame(title, subtitle) {
		if (this.gameOver) return;
		this.gameOver = true;
		this.finishPitch();
		this.finalTitle.textContent = title;
		this.finalSubtitle.textContent = subtitle;
		this.finalBanner.setAttribute("aria-hidden", "false");
		this.finalBanner.classList.add("show");
		this.playButton.disabled = true;
		this.updateSwingButton(false);
		this.pushLog({ type: "info", text: `${title} ${subtitle}` });
		this.updateMeterIdleState();
		this.updateAllUI();
	}

	hideFinalBanner() {
		this.finalBanner.classList.remove("show");
		this.finalBanner.setAttribute("aria-hidden", "true");
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const game = new SandlotShowdown();
	window.sandlotShowdown = game;
});
