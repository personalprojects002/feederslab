-- Migration: Add feedback feature, share link, and upvote tables
-- Run this SQL against your production database.

CREATE TABLE IF NOT EXISTS feature (
    id SERIAL PRIMARY KEY,
    board_id INTEGER NOT NULL REFERENCES board(id) ON DELETE CASCADE,
    creator_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    creator_client_id VARCHAR(255),
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    upvotes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sharelink (
    id SERIAL PRIMARY KEY,
    board_id INTEGER NOT NULL REFERENCES board(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    access_level VARCHAR(40) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upvote (
    id SERIAL PRIMARY KEY,
    feature_id INTEGER NOT NULL REFERENCES feature(id) ON DELETE CASCADE,
    voter_key VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_upvote_feature_voter UNIQUE (feature_id, voter_key)
);

CREATE INDEX IF NOT EXISTS idx_feature_board_id ON feature(board_id);
CREATE INDEX IF NOT EXISTS idx_feature_creator_user_id ON feature(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_feature_creator_client_id ON feature(creator_client_id);
CREATE INDEX IF NOT EXISTS idx_sharelink_board_id ON sharelink(board_id);
CREATE INDEX IF NOT EXISTS idx_sharelink_token ON sharelink(token);
CREATE INDEX IF NOT EXISTS idx_upvote_feature_id ON upvote(feature_id);
CREATE INDEX IF NOT EXISTS idx_upvote_voter_key ON upvote(voter_key);
