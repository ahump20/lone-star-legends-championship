-- Lone Star Legends Championship - D1 Analytics Schema
-- Memphis defense: Data integrity at the foundation
-- Texas scale: Built for growth

-- Players table: Core identity
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_active TEXT,
  total_playtime INTEGER DEFAULT 0,
  metadata TEXT -- JSON for flexible attributes
);

CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_players_created ON players(created_at);

-- Scores table: Achievement tracking
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  context TEXT, -- JSON context of the score
  submitted_at TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX IF NOT EXISTS idx_scores_player ON scores(player_id);
CREATE INDEX IF NOT EXISTS idx_scores_submitted ON scores(submitted_at);
CREATE INDEX IF NOT EXISTS idx_scores_high ON scores(score DESC);

-- Events table: Behavioral analytics
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT,
  event_type TEXT NOT NULL,
  properties TEXT, -- JSON properties
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_player ON events(player_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);

-- Sessions table: Engagement tracking
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration INTEGER,
  events_count INTEGER DEFAULT 0,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);

-- Achievements table: Milestone tracking
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  context TEXT, -- JSON for achievement context
  UNIQUE(player_id, achievement_key),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_player ON achievements(player_id);
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked ON achievements(unlocked_at);

-- Daily aggregates for performance dashboards
CREATE TABLE IF NOT EXISTS daily_metrics (
  date TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value INTEGER NOT NULL,
  metadata TEXT, -- JSON for additional context
  PRIMARY KEY (date, metric_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);

-- Funnel analysis table
CREATE TABLE IF NOT EXISTS funnel_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  funnel_name TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  time_to_complete INTEGER, -- seconds from previous step
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX IF NOT EXISTS idx_funnel_player ON funnel_events(player_id);
CREATE INDEX IF NOT EXISTS idx_funnel_name ON funnel_events(funnel_name);
CREATE INDEX IF NOT EXISTS idx_funnel_completed ON funnel_events(completed_at);