-- Blaze Intelligence D1 Database Schema

CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    tier TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    stripe_customer_id TEXT,
    subscription_status TEXT DEFAULT 'trial'
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    organization_id TEXT,
    role TEXT DEFAULT 'member',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS athletes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organization_id TEXT,
    sport TEXT NOT NULL,
    position TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS cee_scores (
    id TEXT PRIMARY KEY,
    athlete_id TEXT NOT NULL,
    dimension TEXT NOT NULL,
    score REAL NOT NULL,
    confidence REAL NOT NULL,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_athletes_org ON athletes(organization_id);
CREATE INDEX IF NOT EXISTS idx_cee_scores_athlete ON cee_scores(athlete_id);
