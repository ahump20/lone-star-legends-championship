const TEAMS = [
  {
    id: "orbiters",
    name: "Oakdale Orbiters",
    motto: "Skyline kids with launchpad swings.",
    pitcherIndex: 3,
    colors: {
      primary: "#60a5fa",
      accent: "#1d4ed8",
    },
    lineup: [
      { name: "Avery Finch", position: "CF", avatar: "🛰️", contact: 74, power: 68, speed: 86, eye: 72, clutch: 68 },
      { name: "Nico Reyes", position: "2B", avatar: "🪁", contact: 77, power: 54, speed: 84, eye: 75, clutch: 62 },
      { name: "Kaya Bloom", position: "1B", avatar: "🌸", contact: 82, power: 72, speed: 58, eye: 69, clutch: 76 },
      { name: "Rory Mullins", position: "P", avatar: "🚀", contact: 61, power: 65, speed: 66, eye: 64, clutch: 68, pitching: 81, control: 78, movement: 74 },
      { name: "Penny Chu", position: "3B", avatar: "🧠", contact: 70, power: 59, speed: 72, eye: 83, clutch: 71 },
      { name: "Milo Hart", position: "LF", avatar: "🛹", contact: 66, power: 63, speed: 80, eye: 61, clutch: 64 },
      { name: "Gabi Frost", position: "RF", avatar: "❄️", contact: 69, power: 71, speed: 74, eye: 67, clutch: 80 },
      { name: "Ian Calder", position: "C", avatar: "🎯", contact: 64, power: 52, speed: 48, eye: 78, clutch: 59 },
      { name: "Jess Park", position: "SS", avatar: "🧢", contact: 75, power: 57, speed: 83, eye: 70, clutch: 74 },
    ],
  },
  {
    id: "roadrunners",
    name: "Cactus Gulch Roadrunners",
    motto: "Dust-storm burners with desert grit.",
    pitcherIndex: 4,
    colors: {
      primary: "#fb923c",
      accent: "#ea580c",
    },
    lineup: [
      { name: "Maya Cortez", position: "CF", avatar: "🌵", contact: 78, power: 71, speed: 92, eye: 70, clutch: 82 },
      { name: "Theo Brant", position: "SS", avatar: "🪶", contact: 80, power: 67, speed: 86, eye: 73, clutch: 79 },
      { name: "June Morales", position: "C", avatar: "🎺", contact: 74, power: 83, speed: 62, eye: 68, clutch: 88 },
      { name: "Dash Nguyen", position: "LF", avatar: "⚡", contact: 69, power: 72, speed: 88, eye: 64, clutch: 75 },
      { name: "Riley Shaw", position: "P", avatar: "🎯", contact: 63, power: 58, speed: 66, eye: 79, clutch: 72, pitching: 86, control: 84, movement: 79 },
      { name: "Zoe Patel", position: "1B", avatar: "🔥", contact: 76, power: 85, speed: 54, eye: 65, clutch: 84 },
      { name: "Devin Brooks", position: "RF", avatar: "💨", contact: 68, power: 64, speed: 89, eye: 67, clutch: 70 },
      { name: "Quinn Moss", position: "2B", avatar: "🪴", contact: 71, power: 56, speed: 84, eye: 76, clutch: 73 },
      { name: "Lena Ortiz", position: "3B", avatar: "🎨", contact: 73, power: 69, speed: 72, eye: 71, clutch: 77 },
    ],
  },
];

const USER_TEAM_INDEX = 1;
const CPU_TEAM_INDEX = 0;
const INNINGS = 3;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const formatCount = ({ balls, strikes }) => `${balls}-${strikes}`;

const formatAverage = (hits, atBats) => {
  if (atBats === 0) return ".000";
  const avg = hits / atBats;
  return avg.toFixed(3).slice(1);
};

const describeRunners = (bases, teams) => {
  const baseLabels = ["1B", "2B", "3B"];
  const active = bases
    .map((runner, idx) => (runner ? `${baseLabels[idx]}: ${teams[runner.team].lineup[runner.order].name}` : null))
    .filter(Boolean);
  return active.length ? active.join(" | ") : "Bases empty";
};

const randomInRange = (min, max) => Math.random() * (max - min) + min;

const weightedPick = (entries) => {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const target = Math.random() * total;
  let running = 0;
  for (const entry of entries) {
    running += entry.weight;
    if (target <= running) return entry.value;
  }
  return entries[entries.length - 1].value;
};

class TimingMeter {
  constructor(panel) {
    this.panel = panel;
    this.slider = panel.querySelector("#meterSlider");
    this.button = panel.querySelector("#meterAction");
    this.timer = panel.querySelector("#meterTimer");
    this.title = panel.querySelector("#meterTitle");
    this.subtitle = panel.querySelector("#meterSubtitle");
    this.active = false;
    this.direction = 1;
    this.position = 0.02;
    this.speed = 0.0015;
    this.lastTime = 0;
    this.elapsed = 0;
    this.resolveHandler = null;
    this.loop = this.loop.bind(this);
    this.button.addEventListener("click", () => this.resolve());
  }

  start({ title, subtitle, buttonLabel, speed = 0.0015, onResolve }) {
    if (this.active) return;
    this.active = true;
    this.position = 0.02;
    this.speed = speed;
    this.direction = 1;
    this.elapsed = 0;
    this.resolveHandler = onResolve;
    this.title.textContent = title;
    this.subtitle.textContent = subtitle;
    this.button.textContent = buttonLabel;
    this.panel.classList.add("active");
    this.panel.setAttribute("aria-hidden", "false");
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  loop(timestamp) {
    if (!this.active) return;
    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.elapsed += delta;
    const track = this.panel.querySelector(".meter-track");
    const sliderWidth = this.slider.offsetWidth;
    const trackWidth = track.offsetWidth - sliderWidth - 6;
    this.position += this.direction * this.speed * delta;
    if (this.position >= 0.98) {
      this.position = 0.98;
      this.direction = -1;
    } else if (this.position <= 0.02) {
      this.position = 0.02;
      this.direction = 1;
    }
    const offset = 3 + trackWidth * this.position;
    this.slider.style.transform = `translateX(${offset}px)`;
    const seconds = Math.floor(this.elapsed / 1000);
    const ms = Math.floor((this.elapsed % 1000) / 10)
      .toString()
      .padStart(2, "0");
    this.timer.textContent = `${seconds.toString().padStart(2, "0")}:${ms}`;
    requestAnimationFrame(this.loop);
  }

  resolve() {
    if (!this.active) return;
    this.active = false;
    this.panel.classList.remove("active");
    this.panel.setAttribute("aria-hidden", "true");
    if (typeof this.resolveHandler === "function") {
      this.resolveHandler(this.position);
    }
  }
}

class SandlotShowdown {
  constructor() {
    this.teams = TEAMS;
    this.state = this.createState();
    this.elements = this.bindElements();
    this.meter = new TimingMeter(this.elements.meterPanel);
    this.fastForward = false;
    this.pendingPitchType = null;
    this.keyboardHandler = this.handleKey.bind(this);
    this.init();
  }

  createState() {
    return {
      inning: 1,
      half: 0, // 0 = top (CPU batting), 1 = bottom (user batting)
      outs: 0,
      count: { balls: 0, strikes: 0 },
      bases: [null, null, null],
      scoreboard: this.teams.map(() => ({ innings: Array.from({ length: INNINGS }, () => 0), runs: 0, hits: 0 })),
      battingIndex: this.teams.map(() => 0),
      stats: this.teams.map((team) => team.lineup.map(() => ({ ab: 0, hits: 0, rbi: 0, runs: 0, walks: 0, hr: 0 }))),
      phase: "pregame",
      log: [],
    };
  }

  bindElements() {
    return {
      halfLabel: document.getElementById("halfLabel"),
      inningLabel: document.getElementById("inningLabel"),
      outsLabel: document.getElementById("outsLabel"),
      teamLineups: [
        document.getElementById("team0Lineup"),
        document.getElementById("team1Lineup"),
      ],
      battingTeamLabel: document.getElementById("battingTeamLabel"),
      pitchingTeamLabel: document.getElementById("pitchingTeamLabel"),
      countLabel: document.getElementById("countLabel"),
      runnerLabel: document.getElementById("runnerLabel"),
      currentBatterAvatar: document.getElementById("currentBatterAvatar"),
      currentBatterName: document.getElementById("currentBatterName"),
      currentBatterBlurb: document.getElementById("currentBatterBlurb"),
      scoreRibbon: document.getElementById("scoreRibbon"),
      meterPanel: document.getElementById("meterPanel"),
      meterAction: document.getElementById("meterAction"),
      pitchControls: document.getElementById("pitchControls"),
      pitchButtons: Array.from(document.querySelectorAll(".pitch-btn")),
      controlButtons: Array.from(document.querySelectorAll(".control-btn")),
      scoreboardRows: Array.from(document.querySelectorAll(".score-table tbody tr")),
      playLog: document.getElementById("playLog"),
      modal: document.getElementById("finalModal"),
      modalTitle: document.getElementById("finalTitle"),
      modalSummary: document.getElementById("finalSummary"),
    };
  }

  init() {
    this.renderLineups();
    this.updateHUD();
    this.elements.controlButtons.forEach((button) => {
      const action = button.dataset.action;
      if (action === "start") {
        button.addEventListener("click", () => this.startGame());
      } else if (action === "reset") {
        button.addEventListener("click", () => this.resetGame());
      } else if (action === "fast-forward") {
        button.addEventListener("click", () => this.handleFastForward());
      } else if (action === "close-final") {
        button.addEventListener("click", () => this.closeModal());
      }
    });

    this.elements.pitchButtons.forEach((button) => {
      button.addEventListener("click", () => this.preparePitch(button.dataset.pitch));
    });

    document.addEventListener("keydown", this.keyboardHandler);
  }

  resetGame() {
    this.state = this.createState();
    this.fastForward = false;
    this.pendingPitchType = null;
    this.elements.pitchControls.setAttribute("aria-hidden", "true");
    this.elements.pitchButtons.forEach((btn) => btn.classList.remove("active"));
    this.elements.scoreRibbon.textContent = "Let’s play ball.";
    this.elements.playLog.innerHTML = "";
    this.hideModal();
    this.renderLineups();
    this.updateHUD();
  }

  startGame() {
    if (this.state.phase === "playing") return;
    this.state.phase = "playing";
    this.fastForward = false;
    this.elements.scoreRibbon.textContent = "Orbiters lead off the night.";
    this.logMoment({
      title: "First pitch",
      detail: "Orbiters send Avery Finch to the plate under the lights.",
      tag: "start",
    });
    this.startAtBat();
  }

  handleFastForward() {
    if (this.state.phase !== "playing") return;
    this.fastForward = true;
    this.elements.scoreRibbon.textContent = "Fast forwarding — CPU wraps the night.";
    this.advanceFastForward();
  }

  advanceFastForward() {
    const iterate = () => {
      if (this.state.phase !== "playing" || !this.fastForward) return;
      if (this.state.inning > INNINGS && this.state.half === 0) return;
      const battingTeam = this.state.half === 0 ? CPU_TEAM_INDEX : USER_TEAM_INDEX;
      this.simulateAtBat(battingTeam, { turbo: true });
      if (this.state.phase === "playing" && this.fastForward) {
        setTimeout(iterate, 180);
      }
    };
    iterate();
  }

  handleKey(event) {
    if (event.code === "Space") {
      if (this.meter && this.meter.active) {
        event.preventDefault();
        this.meter.resolve();
      } else if (this.state.phase === "playing" && this.state.half === 1 && !this.fastForward) {
        event.preventDefault();
        this.startUserSwing();
      }
    }

    if (this.state.phase === "playing" && this.state.half === 0 && !this.fastForward) {
      if (event.code === "KeyH") this.preparePitch("heater");
      if (event.code === "KeyC") this.preparePitch("change");
      if (event.code === "KeyK") this.preparePitch("hook");
    }

    if (event.code === "KeyR") {
      event.preventDefault();
      this.resetGame();
    }
  }

  bindCurrentPlayers() {
    const battingTeamIndex = this.state.half === 0 ? CPU_TEAM_INDEX : USER_TEAM_INDEX;
    const pitchingTeamIndex = battingTeamIndex === CPU_TEAM_INDEX ? USER_TEAM_INDEX : CPU_TEAM_INDEX;
    const batterOrder = this.state.battingIndex[battingTeamIndex];
    const batter = this.teams[battingTeamIndex].lineup[batterOrder];
    const pitcher = this.teams[pitchingTeamIndex].lineup[this.teams[pitchingTeamIndex].pitcherIndex];
    return { battingTeamIndex, pitchingTeamIndex, batterOrder, batter, pitcher };
  }

  renderLineups() {
    this.teams.forEach((team, teamIndex) => {
      const list = this.elements.teamLineups[teamIndex];
      list.innerHTML = "";
      team.lineup.forEach((player, index) => {
        const li = document.createElement("li");
        li.dataset.index = index.toString();
        const stats = this.state.stats?.[teamIndex]?.[index] ?? { ab: 0, hits: 0, rbi: 0, runs: 0, walks: 0, hr: 0 };
        li.innerHTML = `
          <span class="position">${index + 1}</span>
          <div>
            <div class="name">${player.avatar} ${player.name} <span class="position">${player.position}</span></div>
            <div class="stat-line">AVG ${formatAverage(stats.hits, stats.ab)} · RBI ${stats.rbi} · HR ${stats.hr}</div>
          </div>
        `;
        list.appendChild(li);
      });
    });
  }

  updateLineupHighlights() {
    this.teams.forEach((team, teamIndex) => {
      const order = this.state.battingIndex[teamIndex];
      this.elements.teamLineups[teamIndex].querySelectorAll("li").forEach((li) => {
        li.classList.toggle("active", Number(li.dataset.index) === order && this.state.phase === "playing" && this.getBattingTeam() === teamIndex);
      });
    });
  }

  updateHUD() {
    const halfText = this.state.half === 0 ? "Top" : "Bottom";
    const inningSuffix = this.state.inning === 1 ? "st" : this.state.inning === 2 ? "nd" : "rd";
    this.elements.halfLabel.textContent = halfText;
    this.elements.inningLabel.textContent = `${this.state.inning}${inningSuffix}`;
    this.elements.outsLabel.textContent = `${this.state.outs} ${this.state.outs === 1 ? "Out" : "Outs"}`;
    this.elements.countLabel.textContent = formatCount(this.state.count);
    this.elements.runnerLabel.textContent = describeRunners(this.state.bases, this.teams);
    const battingTeamIndex = this.getBattingTeam();
    const pitchingTeamIndex = battingTeamIndex === CPU_TEAM_INDEX ? USER_TEAM_INDEX : CPU_TEAM_INDEX;
    this.elements.battingTeamLabel.textContent = `${this.teams[battingTeamIndex].name} batting`;
    this.elements.pitchingTeamLabel.textContent = `${this.teams[pitchingTeamIndex].name} pitching`;
    this.updateLineupHighlights();
    this.updateScoreboard();
    this.updateBatterFocus();
  }

  updateBatterFocus() {
    const { batter } = this.bindCurrentPlayers();
    this.elements.currentBatterAvatar.textContent = batter.avatar;
    this.elements.currentBatterName.textContent = batter.name;
    const stats = this.getCurrentBatterStats();
    this.elements.currentBatterBlurb.textContent = `AVG ${formatAverage(stats.hits, stats.ab)} | RBI ${stats.rbi} | HR ${stats.hr}`;
  }

  updateScoreboard() {
    this.elements.scoreboardRows.forEach((row, teamIndex) => {
      const data = this.state.scoreboard[teamIndex];
      row.querySelectorAll("td[data-inning]").forEach((cell) => {
        const inningIndex = Number(cell.dataset.inning) - 1;
        cell.textContent = data.innings[inningIndex];
      });
      row.querySelector("td[data-field='runs']").textContent = data.runs;
      row.querySelector("td[data-field='hits']").textContent = data.hits;
    });
  }

  getCurrentBatterStats() {
    const battingTeam = this.getBattingTeam();
    const order = this.state.battingIndex[battingTeam];
    return this.state.stats[battingTeam][order];
  }

  getBattingTeam() {
    return this.state.half === 0 ? CPU_TEAM_INDEX : USER_TEAM_INDEX;
  }

  startAtBat() {
    if (this.state.phase !== "playing") return;
    this.state.count = { balls: 0, strikes: 0 };
    this.updateHUD();
    const battingTeam = this.getBattingTeam();
    const description = battingTeam === USER_TEAM_INDEX ? "Roadrunners need a spark." : "Orbiters chase early momentum.";
    this.elements.currentBatterBlurb.textContent = description;
    if (this.fastForward) {
      this.simulateAtBat(battingTeam, { turbo: true });
      return;
    }

    if (battingTeam === USER_TEAM_INDEX) {
      this.startUserSwing();
    } else {
      this.promptPitchSelection();
    }
  }

  promptPitchSelection() {
    this.elements.pitchControls.setAttribute("aria-hidden", "false");
    this.elements.pitchButtons.forEach((btn) => btn.classList.remove("active"));
    this.elements.scoreRibbon.textContent = "Choose your pitch: heater, change, or hook.";
  }

  preparePitch(type) {
    if (this.fastForward || this.state.phase !== "playing" || this.getBattingTeam() !== CPU_TEAM_INDEX) return;
    this.pendingPitchType = type;
    this.elements.pitchButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.pitch === type));
    const title = type === "heater" ? "High Heat" : type === "change" ? "Off-Speed Deception" : "Bender";
    const subtitle = "Stop the slider in the gold for pinpoint command.";
    const speed = type === "heater" ? 0.0021 : type === "change" ? 0.0016 : 0.0018;
    this.elements.scoreRibbon.textContent = `Riley Shaw sets for a ${title.toLowerCase()}.`;
    this.meter.start({
      title,
      subtitle,
      buttonLabel: "Release",
      speed,
      onResolve: (position) => this.resolveUserPitch(position, type),
    });
  }

  resolveUserPitch(position, pitchType) {
    const { batter, pitcher } = this.bindCurrentPlayers();
    const accuracy = 1 - Math.abs(position - 0.5) * 2;
    const controlFactor = (pitcher.control ?? 70) / 100;
    const movementFactor = (pitcher.movement ?? 65) / 100;
    const pitchIntensity = pitchType === "heater" ? 1.05 : pitchType === "change" ? 0.95 : 1.0;
    const quality = clamp(accuracy * 0.6 + controlFactor * 0.3 + movementFactor * 0.2 + randomInRange(-0.15, 0.15), 0, 1);
    const batterSkill = clamp((batter.contact * 0.55 + batter.eye * 0.25 + batter.clutch * 0.2) / 100, 0, 1);
    const pressure = this.state.inning === INNINGS && this.state.half === 0 ? 0.05 : 0;
    const difficulty = clamp(quality * pitchIntensity + (pitcher.pitching ?? 75) / 140, 0, 1);
    const contactScore = batterSkill + randomInRange(-0.12, 0.12) + pressure - difficulty * 0.8;

    if (quality < 0.18) {
      this.registerBall("Lost the handle — ball one.");
      return;
    }

    if (contactScore < 0.25) {
      this.registerStrike("Painted corner. Batter watches strike one.");
      return;
    }

    if (contactScore < 0.38) {
      this.registerStrike("Foul tip into the glove.");
      return;
    }

    if (contactScore < 0.55) {
      this.recordBallInPlay({ type: "out", descriptor: "Grounder to short." });
      return;
    }

    const power = (batter.power / 100) + (contactScore - 0.55) * 0.8;
    const result = this.resolveContact(power, batter);
    this.recordBallInPlay(result);
  }

  startUserSwing() {
    if (this.fastForward || this.state.phase !== "playing" || this.getBattingTeam() !== USER_TEAM_INDEX) return;
    const title = "Swing Timing";
    const subtitle = "Spacebar or click when the slider is gold for barrels.";
    this.elements.scoreRibbon.textContent = "CPU paints the corner — time your swing.";
    this.meter.start({
      title,
      subtitle,
      buttonLabel: "Swing",
      speed: 0.002,
      onResolve: (position) => this.resolveUserSwing(position),
    });
  }

  resolveUserSwing(position) {
    const { batter, pitcher } = this.bindCurrentPlayers();
    const accuracy = 1 - Math.abs(position - 0.5) * 2;
    const eyeFactor = batter.eye / 100;
    const timing = clamp(accuracy + randomInRange(-0.1, 0.1) + eyeFactor * 0.15, 0, 1);
    if (timing < 0.2) {
      this.registerStrike("Swing and miss under the heater.");
      return;
    }
    if (timing < 0.35) {
      this.registerStrike("Foul back over the screen.");
      return;
    }
    const pitcherSkill = ((pitcher.pitching ?? 75) + (pitcher.movement ?? 70)) / 200;
    const contactAdvantage = timing - pitcherSkill * randomInRange(0.4, 0.65);
    if (contactAdvantage < 0.1) {
      this.recordBallInPlay({ type: "out", descriptor: "Chopper right back to the mound." });
      return;
    }
    const barrel = timing + batter.contact / 140 + randomInRange(-0.1, 0.1);
    const power = barrel * 0.6 + batter.power / 140;
    const result = this.resolveContact(power, batter, true);
    this.recordBallInPlay(result);
  }

  resolveContact(power, batter, userSwing = false) {
    const baseOutcome = clamp(power, 0, 1);
    const clutchBoost = userSwing ? batter.clutch / 140 : batter.clutch / 180;
    const scoring = baseOutcome + clutchBoost + randomInRange(-0.08, 0.08);
    if (scoring > 1.15) {
      return { type: "homeRun", descriptor: `${batter.name} absolutely unloads — gone!` };
    }
    if (scoring > 0.95) {
      return { type: "triple", descriptor: `${batter.name} torches one into the gap!` };
    }
    if (scoring > 0.8) {
      return { type: "double", descriptor: `Ripped down the line for extra bases.` };
    }
    if (scoring > 0.55) {
      return { type: "single", descriptor: `Finds grass for a clean single.` };
    }
    return { type: "out", descriptor: "Sky-high pop — handled." };
  }

  simulateAtBat(teamIndex, { turbo = false } = {}) {
    if (this.state.phase !== "playing") return;
    const { batter, pitcher } = this.bindCurrentPlayers();
    const pitchType = weightedPick([
      { value: "heater", weight: 4 },
      { value: "change", weight: 3 },
      { value: "hook", weight: 2 },
    ]);
    const position = randomInRange(0.18, 0.82);
    const accuracy = 1 - Math.abs(position - 0.5) * 2;
    const command = ((pitcher.control ?? 75) + (pitcher.pitching ?? 75)) / 200;
    const quality = clamp(accuracy * 0.5 + command * 0.5 + randomInRange(-0.12, 0.12), 0, 1);
    const batterSkill = (batter.contact * 0.5 + batter.eye * 0.2 + batter.clutch * 0.3) / 100;
    if (quality < 0.22) {
      this.registerBall("Pitch misses just off the edge.", { silent: turbo });
      return;
    }
    const contest = batterSkill + randomInRange(-0.1, 0.1) - quality * 0.6;
    if (contest < 0.2) {
      this.registerStrike("Frozen with a painted strike.", { silent: turbo });
      return;
    }
    if (contest < 0.35) {
      this.registerStrike("Foul into the stands.", { silent: turbo });
      return;
    }
    const result = this.resolveContact(batter.power / 120 + contest + randomInRange(-0.08, 0.08), batter);
    this.recordBallInPlay(result, { silent: turbo });
  }

  registerBall(message, options = {}) {
    this.state.count.balls += 1;
    if (this.state.count.balls >= 4) {
      this.completePlateAppearance({ type: "walk", descriptor: `${this.getCurrentBatter().name} works a walk.` });
      return;
    }
    if (!options.silent) {
      this.elements.scoreRibbon.textContent = message;
      this.logMoment({ title: "Ball", detail: message });
    }
    this.updateHUD();
  }

  registerStrike(message, options = {}) {
    this.state.count.strikes += 1;
    if (this.state.count.strikes >= 3) {
      this.completePlateAppearance({ type: "strikeout", descriptor: `${this.getCurrentBatter().name} goes down on strikes.` });
      return;
    }
    if (!options.silent) {
      this.elements.scoreRibbon.textContent = message;
      this.logMoment({ title: "Strike", detail: message });
    }
    this.updateHUD();
  }

  recordBallInPlay(result, options = {}) {
    if (result.type === "out") {
      this.completePlateAppearance({ type: "out", descriptor: result.descriptor });
      return;
    }
    this.completePlateAppearance({ type: result.type, descriptor: result.descriptor });
  }

  completePlateAppearance(result) {
    const battingTeam = this.getBattingTeam();
    const order = this.state.battingIndex[battingTeam];
    const stats = this.state.stats[battingTeam][order];
    if (result.type === "walk") {
      stats.walks += 1;
    } else if (result.type === "strikeout" || result.type === "out") {
      stats.ab += 1;
    } else {
      stats.ab += 1;
      stats.hits += 1;
      if (result.type === "homeRun") stats.hr += 1;
    }
    const movement = this.moveRunners(result.type, battingTeam);
    if (movement && movement.rbi) {
      stats.rbi += movement.rbi;
    }
    const tag = ["double", "triple", "homeRun"].includes(result.type) ? "highlight" : undefined;
    const runNote = movement?.runs
      ? ` ${movement.runs} run${movement.runs === 1 ? "" : "s"} score for the ${this.teams[battingTeam].name}.`
      : "";
    this.logMoment({ title: this.titleForResult(result.type), detail: `${result.descriptor}${runNote}`, tag });
    this.elements.scoreRibbon.textContent = `${result.descriptor}${runNote}`;
    const advanceTeam = battingTeam;
    this.advanceBattingOrder(advanceTeam);
    this.state.count = { balls: 0, strikes: 0 };
    if (movement?.endedInning) {
      this.updateHUD();
      this.changeSide();
      return;
    }
    this.updateHUD();
    this.startAtBat();
  }

  titleForResult(type) {
    switch (type) {
      case "single":
        return "Single";
      case "double":
        return "Double";
      case "triple":
        return "Triple";
      case "homeRun":
        return "Home Run";
      case "strikeout":
        return "Strikeout";
      case "walk":
        return "Walk";
      default:
        return "Out";
    }
  }

  moveRunners(type, teamIndex) {
    const inningIndex = this.state.inning - 1;
    const result = { runs: 0, endedInning: false, rbi: 0 };
    const batterOrder = this.state.battingIndex[teamIndex];
    const batterRef = { team: teamIndex, order: batterOrder };
    const scoreboard = this.state.scoreboard[teamIndex];
    const newBases = [null, null, null];

    const scoreRunner = (runner) => {
      result.runs += 1;
      const stats = this.state.stats[runner.team][runner.order];
      stats.runs += 1;
    };

    const shiftRunners = (steps) => {
      this.state.bases.forEach((runner, index) => {
        if (!runner) return;
        const target = index + steps;
        if (target >= 3) {
          scoreRunner(runner);
        } else {
          newBases[target] = runner;
        }
      });
    };

    switch (type) {
      case "single":
        shiftRunners(1);
        newBases[0] = batterRef;
        scoreboard.hits += 1;
        break;
      case "double":
        shiftRunners(2);
        newBases[1] = batterRef;
        scoreboard.hits += 1;
        break;
      case "triple":
        shiftRunners(3);
        newBases[2] = batterRef;
        scoreboard.hits += 1;
        break;
      case "homeRun":
        shiftRunners(4);
        scoreRunner(batterRef);
        scoreboard.hits += 1;
        break;
      case "walk": {
        const first = this.state.bases[0];
        const second = this.state.bases[1];
        const third = this.state.bases[2];
        if (third && second && first) {
          scoreRunner(third);
        } else if (third) {
          newBases[2] = third;
        }
        if (second && first) {
          newBases[2] = newBases[2] ?? second;
        } else if (second) {
          newBases[1] = second;
        }
        if (first) {
          newBases[1] = newBases[1] ?? first;
        }
        newBases[0] = batterRef;
        break;
      }
      default:
        this.state.outs += 1;
        if (this.state.outs >= 3) {
          result.endedInning = true;
        }
        return result;
    }

    this.state.bases = newBases;
    if (result.runs > 0) {
      scoreboard.runs += result.runs;
      scoreboard.innings[inningIndex] += result.runs;
    }
    result.rbi = result.runs;
    this.updateBasesUI();
    return result;
  }

  advanceBattingOrder(teamIndex) {
    this.state.battingIndex[teamIndex] = (this.state.battingIndex[teamIndex] + 1) % this.teams[teamIndex].lineup.length;
  }

  updateBasesUI() {
    document.querySelectorAll(".base").forEach((baseEl) => baseEl.classList.remove("runner"));
    this.state.bases.forEach((runner, idx) => {
      if (!runner) return;
      const baseEl = document.querySelector(`.base[data-base='${idx + 1}']`);
      if (baseEl) baseEl.classList.add("runner");
    });
  }

  changeSide() {
    this.state.outs = 0;
    this.state.count = { balls: 0, strikes: 0 };
    this.state.bases = [null, null, null];
    this.updateBasesUI();
    if (this.state.half === 0) {
      this.state.half = 1;
      this.elements.scoreRibbon.textContent = "Roadrunners jog in ready to hit.";
    } else {
      this.state.half = 0;
      this.state.inning += 1;
      if (this.state.inning > INNINGS) {
        this.endGame();
        return;
      }
      this.elements.scoreRibbon.textContent = `Heading to the ${this.state.inning === 2 ? "second" : "third"}.`;
    }
    this.updateHUD();
    this.state.battingIndex[this.getBattingTeam()] = this.state.battingIndex[this.getBattingTeam()] % this.teams[this.getBattingTeam()].lineup.length;
    if (this.state.phase === "playing") {
      this.startAtBat();
    }
  }

  getCurrentBatter() {
    const battingTeam = this.getBattingTeam();
    return this.teams[battingTeam].lineup[this.state.battingIndex[battingTeam]];
  }

  endGame() {
    this.state.phase = "finished";
    this.fastForward = false;
    const visitorRuns = this.state.scoreboard[CPU_TEAM_INDEX].runs;
    const homeRuns = this.state.scoreboard[USER_TEAM_INDEX].runs;
    let summary;
    if (homeRuns > visitorRuns) {
      summary = "Roadrunners defend the sandlot in style.";
    } else if (homeRuns < visitorRuns) {
      summary = "Orbiters steal the crown on the road.";
    } else {
      summary = "Classic sandlot stalemate — call it a night.";
    }
    this.elements.modalTitle.textContent = homeRuns > visitorRuns ? "Roadrunners Win!" : homeRuns < visitorRuns ? "Orbiters Triumph" : "Sandlot Tie";
    this.elements.modalSummary.textContent = `${this.state.scoreboard[CPU_TEAM_INDEX].runs}-${this.state.scoreboard[USER_TEAM_INDEX].runs} final. ${summary}`;
    this.showModal();
    this.logMoment({ title: "Game Over", detail: `${visitorRuns}-${homeRuns} final. ${summary}`, tag: "highlight" });
  }

  showModal() {
    this.elements.modal.setAttribute("aria-hidden", "false");
    this.elements.modal.classList.add("active");
  }

  hideModal() {
    this.elements.modal.setAttribute("aria-hidden", "true");
    this.elements.modal.classList.remove("active");
  }

  closeModal() {
    this.hideModal();
  }

  logMoment({ title, detail, tag }) {
    const entry = document.createElement("li");
    entry.className = "log-entry";
    if (tag) entry.dataset.tag = tag;
    entry.innerHTML = `<strong>${title}</strong><span class="meta">${this.describeSituation()}</span><span>${detail}</span>`;
    this.elements.playLog.prepend(entry);
    while (this.elements.playLog.children.length > 12) {
      this.elements.playLog.removeChild(this.elements.playLog.lastChild);
    }
  }

  describeSituation() {
    const half = this.state.half === 0 ? "Top" : "Bot";
    return `${half} ${this.state.inning}, ${this.state.outs} ${this.state.outs === 1 ? "out" : "outs"}, ${formatCount(this.state.count)}`;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new SandlotShowdown();
});
