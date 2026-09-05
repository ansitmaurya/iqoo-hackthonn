-- =============================================================================
-- TraceGuard Database Schema for Supabase / PostgreSQL
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(32) DEFAULT 'ANALYST',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS network_nodes (
    id VARCHAR(64) PRIMARY KEY,
    node_name VARCHAR(128) NOT NULL,
    node_type VARCHAR(64) NOT NULL,
    risk_score INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    sender VARCHAR(64) NOT NULL,
    sender_name VARCHAR(128),
    receiver VARCHAR(64),
    receiver_name VARCHAR(128),
    amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    type VARCHAR(32) DEFAULT 'TRANSFER',
    category VARCHAR(64) DEFAULT 'PEER_TRANSFER',
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    location JSONB DEFAULT '{}'::jsonb,
    device JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(32) DEFAULT 'SETTLED',
    risk_score INTEGER DEFAULT 0,
    risk_level VARCHAR(16) DEFAULT 'LOW',
    triggered_rules JSONB DEFAULT '[]'::jsonb,
    flagged BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) REFERENCES transactions(id) ON DELETE CASCADE,
    account_id VARCHAR(64) NOT NULL,
    account_name VARCHAR(128),
    alert_type VARCHAR(64) DEFAULT 'RULE_VIOLATION',
    severity VARCHAR(16) DEFAULT 'MEDIUM',
    message TEXT,
    risk_score INTEGER DEFAULT 0,
    status VARCHAR(32) DEFAULT 'OPEN',
    assigned_analyst VARCHAR(128),
    triggered_rules JSONB DEFAULT '[]'::jsonb,
    notes JSONB DEFAULT '[]'::jsonb,
    resolution_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS network_edges (
    id VARCHAR(64) PRIMARY KEY,
    source_node VARCHAR(64) REFERENCES network_nodes(id) ON DELETE CASCADE,
    target_node VARCHAR(64) REFERENCES network_nodes(id) ON DELETE CASCADE,
    transaction_count INTEGER DEFAULT 1,
    total_amount NUMERIC(14, 2) DEFAULT 0.00,
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Optimized query indexes
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_risk_score ON transactions(risk_score);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_account_id ON alerts(account_id);

CREATE INDEX IF NOT EXISTS idx_network_edges_source ON network_edges(source_node);
CREATE INDEX IF NOT EXISTS idx_network_edges_target ON network_edges(target_node);
