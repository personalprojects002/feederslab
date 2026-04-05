# Data Model: Feedback Collection & Board Management

**Date**: 2026-04-05  
**Feature**: Feedback Collection & Board Management  
**Status**: Complete

## Entity Definitions

### Board

**Purpose**: Represents a feedback collection board owned by a business user

**Fields**:
- `id`: UUID (primary key, auto-generated)
- `owner_id`: UUID (foreign key to User, required)
- `name`: String (required, 1-255 characters)
- `description`: String (optional, 0-1000 characters)
- `created_at`: DateTime (auto-set on creation, immutable)
- `updated_at`: DateTime (auto-set on creation, updated on modification)

**Validation Rules**:
- `name` must not be empty
- `name` must be unique per owner (no duplicate board names for same owner)
- `owner_id` must reference valid User
- `created_at` and `updated_at` must be valid ISO 8601 timestamps

**State Transitions**:
- Created → Active (default state)
- Active → Deleted (when owner deletes board)

**Relationships**:
- One-to-Many with Feature (cascade delete)
- One-to-Many with ShareLink (cascade delete)

**Indexes**:
- `(owner_id, created_at)` for efficient listing of user's boards
- `id` (primary key)

---

### Feature

**Purpose**: Represents a requested feature within a board that users can upvote

**Fields**:
- `id`: UUID (primary key, auto-generated)
- `board_id`: UUID (foreign key to Board, required)
- `creator_id`: UUID (foreign key to User, required)
- `title`: String (required, 1-255 characters)
- `description`: String (optional, 0-2000 characters)
- `upvote_count`: Integer (default 0, non-negative)
- `created_at`: DateTime (auto-set on creation, immutable)
- `updated_at`: DateTime (auto-set on creation, updated on modification)

**Validation Rules**:
- `title` must not be empty
- `title` must be unique per board (no duplicate feature titles in same board)
- `board_id` must reference valid Board
- `creator_id` must reference valid User
- `upvote_count` must be >= 0
- `description` length must not exceed 2000 characters

**State Transitions**:
- Created → Active (default state)
- Active → Deleted (when creator or board owner deletes feature)

**Relationships**:
- Many-to-One with Board
- Many-to-One with User (creator)
- One-to-Many with Upvote (cascade delete)

**Indexes**:
- `(board_id, created_at)` for efficient listing of board's features
- `(board_id, upvote_count DESC)` for sorting by popularity
- `id` (primary key)

---

### ShareLink

**Purpose**: Represents a shareable access token for a board with specific permission level

**Fields**:
- `id`: UUID (primary key, auto-generated)
- `board_id`: UUID (foreign key to Board, required)
- `token`: String (unique, 32 characters, URL-safe, required)
- `access_level`: Enum (required, values: CREATE_UPVOTE, UPVOTE_ONLY)
- `created_at`: DateTime (auto-set on creation, immutable)
- `expires_at`: DateTime (optional, null = never expires)

**Validation Rules**:
- `board_id` must reference valid Board
- `token` must be unique across all share links
- `token` must be 32 characters, URL-safe (alphanumeric + hyphen + underscore)
- `access_level` must be one of: CREATE_UPVOTE, UPVOTE_ONLY
- `expires_at` must be in future if provided
- `expires_at` must be after `created_at` if provided

**State Transitions**:
- Created → Active (default state)
- Active → Expired (when current time > expires_at)
- Active → Revoked (when board owner deletes share link)

**Relationships**:
- Many-to-One with Board

**Indexes**:
- `token` (unique, for fast lookup)
- `(board_id, created_at)` for listing share links per board
- `id` (primary key)

---

### Upvote

**Purpose**: Tracks individual upvotes for analytics and preventing double voting

**Fields**:
- `id`: UUID (primary key, auto-generated)
- `feature_id`: UUID (foreign key to Feature, required)
- `user_identifier`: String (required, 64 characters max)
- `created_at`: DateTime (auto-set on creation, immutable)

**Validation Rules**:
- `feature_id` must reference valid Feature
- `user_identifier` must not be empty
- `user_identifier` must be unique per feature (one upvote per user per feature)
- `user_identifier` length must not exceed 64 characters

**State Transitions**:
- Created → Active (default state)
- Active → Deleted (when user removes upvote or feature is deleted)

**Relationships**:
- Many-to-One with Feature

**Indexes**:
- `(feature_id, user_identifier)` unique constraint for preventing duplicates
- `(feature_id, created_at)` for analytics queries
- `id` (primary key)

---

## Relationships Diagram

```
User (existing)
├── 1:N → Board (owner_id)
│   ├── 1:N → Feature (board_id)
│   │   ├── 1:N → Upvote (feature_id)
│   │   └── M:1 → User (creator_id)
│   └── 1:N → ShareLink (board_id)
```

---

## Data Integrity Rules

### Cascade Behavior

- **Board deletion**: Cascades to all Features and ShareLinks
- **Feature deletion**: Cascades to all Upvotes
- **ShareLink deletion**: No cascade (independent record)

### Constraints

- **Foreign Key Constraints**: All foreign keys must reference existing records
- **Unique Constraints**:
  - ShareLink.token (globally unique)
  - Feature.title per board (no duplicate titles in same board)
  - Board.name per owner (no duplicate names for same owner)
  - Upvote (feature_id, user_identifier) composite unique

### Temporal Constraints

- `created_at` must be <= `updated_at`
- `created_at` must be <= `expires_at` (for ShareLink)
- All timestamps must be valid ISO 8601 format

---

## Database Schema (SQL)

```sql
-- Boards table
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner_id, name)
);

CREATE INDEX idx_boards_owner_created ON boards(owner_id, created_at);

-- Features table
CREATE TABLE features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    upvote_count INTEGER NOT NULL DEFAULT 0 CHECK (upvote_count >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(board_id, title)
);

CREATE INDEX idx_features_board_created ON features(board_id, created_at);
CREATE INDEX idx_features_board_upvotes ON features(board_id, upvote_count DESC);

-- Share links table
CREATE TABLE share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    token VARCHAR(32) NOT NULL UNIQUE,
    access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('CREATE_UPVOTE', 'UPVOTE_ONLY')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_links_board_created ON share_links(board_id, created_at);

-- Upvotes table
CREATE TABLE upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    user_identifier VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feature_id, user_identifier)
);

CREATE INDEX idx_upvotes_feature_created ON upvotes(feature_id, created_at);
```

---

## SQLModel Definitions

```python
# Backend/src/models/board.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional, List

class Board(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    owner_id: UUID = Field(foreign_key="user.id")
    name: str = Field(min_length=1, max_length=255, index=True)
    description: Optional[str] = Field(default=None, max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    features: List["Feature"] = Relationship(back_populates="board", cascade_delete=True)
    share_links: List["ShareLink"] = Relationship(back_populates="board", cascade_delete=True)

# Backend/src/models/feature.py
class Feature(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    board_id: UUID = Field(foreign_key="board.id")
    creator_id: UUID = Field(foreign_key="user.id")
    title: str = Field(min_length=1, max_length=255, index=True)
    description: Optional[str] = Field(default=None, max_length=2000)
    upvote_count: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    board: Board = Relationship(back_populates="features")
    upvotes: List["Upvote"] = Relationship(back_populates="feature", cascade_delete=True)

# Backend/src/models/share_link.py
class ShareLink(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    board_id: UUID = Field(foreign_key="board.id")
    token: str = Field(unique=True, index=True, max_length=32)
    access_level: str = Field(default="UPVOTE_ONLY")  # CREATE_UPVOTE or UPVOTE_ONLY
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = Field(default=None)
    
    board: Board = Relationship(back_populates="share_links")

# Backend/src/models/upvote.py
class Upvote(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    feature_id: UUID = Field(foreign_key="feature.id")
    user_identifier: str = Field(max_length=64, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    feature: Feature = Relationship(back_populates="upvotes")
```

---

## Migration Strategy

1. Create new tables in order: boards → features → share_links → upvotes
2. Add foreign key constraints after all tables created
3. Create indexes for query performance
4. No data migration needed (new feature, no existing data)

---

## Performance Considerations

- **Upvote Count Denormalization**: Store count in Feature table for fast queries (instead of COUNT(*) on upvotes)
- **Indexes**: Composite indexes on (board_id, created_at) for efficient listing
- **Pagination**: Implement cursor-based pagination for large feature lists
- **Caching**: Cache share link lookups (token → board_id, access_level) for 5 minutes

---

## Future Extensibility

- **Feature Categories**: Add category_id to Feature for grouping
- **Feature Status**: Add status field (planned, in-progress, completed) for tracking
- **Comments**: Add Comment table for feature discussions
- **Analytics**: Add analytics table for tracking upvote trends over time
- **Notifications**: Add notification preferences per user
