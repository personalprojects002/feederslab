# Quickstart: Feedback Collection & Board Management

**Date**: 2026-04-05  
**Feature**: Feedback Collection & Board Management  
**Status**: Complete

## Overview

This quickstart guide provides step-by-step instructions for implementing the feedback collection feature. Follow the phases in order.

---

## Phase 1: Backend Setup

### Step 1.1: Create Database Models

Create `Backend/src/models/board.py`:
```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional, List

class Board(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    owner_id: UUID = Field(foreign_key="user.id")
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    features: List["Feature"] = Relationship(back_populates="board", cascade_delete=True)
    share_links: List["ShareLink"] = Relationship(back_populates="board", cascade_delete=True)
```

Create `Backend/src/models/feature.py`:
```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional, List

class Feature(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    board_id: UUID = Field(foreign_key="board.id")
    creator_id: UUID = Field(foreign_key="user.id")
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    upvote_count: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    board: Board = Relationship(back_populates="features")
    upvotes: List["Upvote"] = Relationship(back_populates="feature", cascade_delete=True)
```

Create `Backend/src/models/share_link.py`:
```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional

class ShareLink(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    board_id: UUID = Field(foreign_key="board.id")
    token: str = Field(unique=True, index=True, max_length=32)
    access_level: str = Field(default="UPVOTE_ONLY")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = Field(default=None)
    
    board: Board = Relationship(back_populates="share_links")
```

Create `Backend/src/models/upvote.py`:
```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from uuid import UUID, uuid4

class Upvote(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    feature_id: UUID = Field(foreign_key="feature.id")
    user_identifier: str = Field(max_length=64)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    feature: Feature = Relationship(back_populates="upvotes")
```

### Step 1.2: Create Pydantic Schemas

Create `Backend/src/schemas/board.py`:
```python
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class BoardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)

class BoardResponse(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

Create `Backend/src/schemas/feature.py`:
```python
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class FeatureCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)

class FeatureResponse(BaseModel):
    id: UUID
    board_id: UUID
    creator_id: UUID
    title: str
    description: Optional[str]
    upvote_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

Create `Backend/src/schemas/share_link.py`:
```python
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class ShareLinkCreate(BaseModel):
    access_level: str = Field(default="UPVOTE_ONLY")
    expires_at: Optional[datetime] = None

class ShareLinkResponse(BaseModel):
    id: UUID
    board_id: UUID
    token: str
    access_level: str
    created_at: datetime
    expires_at: Optional[datetime]
    share_url: Optional[str] = None
    
    class Config:
        from_attributes = True
```

### Step 1.3: Create Custom Errors

Update `Backend/src/utils/errors.py`:
```python
from fastapi import HTTPException, status

class BoardNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )

class FeatureNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found"
        )

class ShareLinkNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found or expired"
        )

class UnauthorizedError(HTTPException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )

class ForbiddenError(HTTPException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )

class ConflictError(HTTPException):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )
```

### Step 1.4: Create Services

Create `Backend/src/services/board_service.py`:
```python
from sqlmodel import Session, select
from uuid import UUID
from Backend.src.models.board import Board
from Backend.src.schemas.board import BoardCreate
from Backend.src.utils.errors import BoardNotFoundError, ConflictError

class BoardService:
    @staticmethod
    def create_board(session: Session, owner_id: UUID, board_data: BoardCreate) -> Board:
        # Check for duplicate name
        existing = session.exec(
            select(Board).where(
                Board.owner_id == owner_id,
                Board.name == board_data.name
            )
        ).first()
        
        if existing:
            raise ConflictError("Board name already exists")
        
        board = Board(
            owner_id=owner_id,
            name=board_data.name,
            description=board_data.description
        )
        session.add(board)
        session.commit()
        session.refresh(board)
        return board
    
    @staticmethod
    def get_board(session: Session, board_id: UUID) -> Board:
        board = session.get(Board, board_id)
        if not board:
            raise BoardNotFoundError()
        return board
    
    @staticmethod
    def delete_board(session: Session, board_id: UUID) -> None:
        board = BoardService.get_board(session, board_id)
        session.delete(board)
        session.commit()
```

Create `Backend/src/services/feature_service.py`:
```python
from sqlmodel import Session, select
from uuid import UUID
from Backend.src.models.feature import Feature
from Backend.src.schemas.feature import FeatureCreate
from Backend.src.utils.errors import FeatureNotFoundError, ConflictError

class FeatureService:
    @staticmethod
    def create_feature(session: Session, board_id: UUID, creator_id: UUID, feature_data: FeatureCreate) -> Feature:
        # Check for duplicate title in board
        existing = session.exec(
            select(Feature).where(
                Feature.board_id == board_id,
                Feature.title == feature_data.title
            )
        ).first()
        
        if existing:
            raise ConflictError("Feature title already exists in this board")
        
        feature = Feature(
            board_id=board_id,
            creator_id=creator_id,
            title=feature_data.title,
            description=feature_data.description
        )
        session.add(feature)
        session.commit()
        session.refresh(feature)
        return feature
    
    @staticmethod
    def get_feature(session: Session, feature_id: UUID) -> Feature:
        feature = session.get(Feature, feature_id)
        if not feature:
            raise FeatureNotFoundError()
        return feature
    
    @staticmethod
    def delete_feature(session: Session, feature_id: UUID) -> None:
        feature = FeatureService.get_feature(session, feature_id)
        session.delete(feature)
        session.commit()
```

### Step 1.5: Create Routes

Create `Backend/src/routes/boards.py`:
```python
from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from uuid import UUID
from Backend.src.models.board import Board
from Backend.src.schemas.board import BoardCreate, BoardResponse
from Backend.src.services.board_service import BoardService
from Backend.src.utils.jwt import get_current_user
from Backend.src.config.db import get_session

router = APIRouter(prefix="/api/boards", tags=["boards"])

@router.post("", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
def create_board(
    board_data: BoardCreate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    return BoardService.create_board(session, UUID(current_user["sub"]), board_data)

@router.get("/{board_id}", response_model=BoardResponse)
def get_board(
    board_id: UUID,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    board = BoardService.get_board(session, board_id)
    # Verify ownership
    if str(board.owner_id) != current_user["sub"]:
        raise ForbiddenError("You do not own this board")
    return board

@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(
    board_id: UUID,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    board = BoardService.get_board(session, board_id)
    if str(board.owner_id) != current_user["sub"]:
        raise ForbiddenError("You do not own this board")
    BoardService.delete_board(session, board_id)
```

---

## Phase 2: Frontend Setup

### Step 2.1: Create API Client Functions

Create `Frontend/app/lib/api/boards.ts`:
```typescript
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export interface Board {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const boardsAPI = {
  create: (data: { name: string; description?: string }) =>
    axios.post<Board>(`${API_BASE}/boards`, data),
  
  getAll: () =>
    axios.get<{ items: Board[]; total: number }>(`${API_BASE}/boards`),
  
  getById: (id: string) =>
    axios.get<Board>(`${API_BASE}/boards/${id}`),
  
  delete: (id: string) =>
    axios.delete(`${API_BASE}/boards/${id}`)
};
```

Create `Frontend/app/lib/api/features.ts`:
```typescript
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export interface Feature {
  id: string;
  board_id: string;
  creator_id: string;
  title: string;
  description?: string;
  upvote_count: number;
  created_at: string;
  updated_at: string;
}

export const featuresAPI = {
  create: (boardId: string, data: { title: string; description?: string }) =>
    axios.post<Feature>(`${API_BASE}/boards/${boardId}/features`, data),
  
  getByBoard: (boardId: string) =>
    axios.get<{ items: Feature[]; total: number }>(`${API_BASE}/boards/${boardId}/features`),
  
  delete: (boardId: string, featureId: string) =>
    axios.delete(`${API_BASE}/boards/${boardId}/features/${featureId}`)
};
```

### Step 2.2: Create Custom Hooks

Create `Frontend/app/lib/hooks/useUpvotes.ts`:
```typescript
import { useState, useEffect } from 'react';

export const useUpvotes = (boardId: string) => {
  const [upvotes, setUpvotes] = useState<Record<string, boolean>>({});
  
  const storageKey = `feeders_upvotes_${boardId}`;
  
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setUpvotes(JSON.parse(stored));
    }
  }, [boardId, storageKey]);
  
  const toggleUpvote = (featureId: string) => {
    setUpvotes(prev => {
      const updated = { ...prev };
      if (updated[featureId]) {
        delete updated[featureId];
      } else {
        updated[featureId] = true;
      }
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };
  
  const isUpvoted = (featureId: string) => !!upvotes[featureId];
  
  return { toggleUpvote, isUpvoted };
};
```

### Step 2.3: Create Components

Create `Frontend/app/dashboard/boards/[boardId]/components/UpvoteButton.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useUpvotes } from '@/app/lib/hooks/useUpvotes';

interface UpvoteButtonProps {
  featureId: string;
  boardId: string;
  initialCount: number;
  onToggle?: (upvoted: boolean) => void;
}

export default function UpvoteButton({
  featureId,
  boardId,
  initialCount,
  onToggle
}: UpvoteButtonProps) {
  const { toggleUpvote, isUpvoted } = useUpvotes(boardId);
  const [count, setCount] = useState(initialCount);
  
  const handleClick = () => {
    const wasUpvoted = isUpvoted(featureId);
    toggleUpvote(featureId);
    setCount(wasUpvoted ? count - 1 : count + 1);
    onToggle?.(!wasUpvoted);
  };
  
  return (
    <button
      onClick={handleClick}
      className={`btn btn-sm ${
        isUpvoted(featureId) ? 'btn-primary' : 'btn-outline'
      }`}
    >
      👍 {count}
    </button>
  );
}
```

Create `Frontend/app/dashboard/boards/[boardId]/components/FeatureCard.tsx`:
```typescript
'use client';

import { Feature } from '@/app/lib/api/features';
import UpvoteButton from './UpvoteButton';

interface FeatureCardProps {
  feature: Feature;
  boardId: string;
  canDelete?: boolean;
  onDelete?: (featureId: string) => void;
}

export default function FeatureCard({
  feature,
  boardId,
  canDelete,
  onDelete
}: FeatureCardProps) {
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h3 className="card-title text-lg">{feature.title}</h3>
        {feature.description && (
          <p className="text-sm text-gray-600">{feature.description}</p>
        )}
        <div className="card-actions justify-between items-center">
          <UpvoteButton
            featureId={feature.id}
            boardId={boardId}
            initialCount={feature.upvote_count}
          />
          {canDelete && (
            <button
              onClick={() => onDelete?.(feature.id)}
              className="btn btn-sm btn-ghost text-error"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Step 2.4: Create Sidebar Component

Create `Frontend/app/components/Sidebar.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { boardsAPI, Board } from '@/app/lib/api/boards';

export default function Sidebar() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [sharedBoards, setSharedBoards] = useState<Board[]>([]);
  
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await boardsAPI.getAll();
        setBoards(response.data.items);
      } catch (error) {
        console.error('Failed to fetch boards:', error);
      }
    };
    
    fetchBoards();
  }, []);
  
  return (
    <aside className="w-64 bg-base-200 p-4 h-screen overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-3">Boards</h3>
          <ul className="space-y-2">
            {boards.map(board => (
              <li key={board.id}>
                <Link
                  href={`/dashboard/boards/${board.id}`}
                  className="link link-hover"
                >
                  {board.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="font-bold text-lg mb-3">Shared Boards</h3>
          <ul className="space-y-2">
            {sharedBoards.map(board => (
              <li key={board.id}>
                <Link
                  href={`/dashboard/boards/${board.id}`}
                  className="link link-hover"
                >
                  {board.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="divider"></div>
        
        <div>
          <h3 className="font-bold text-lg mb-3">Future Sections</h3>
          <p className="text-sm text-gray-500">Coming soon...</p>
        </div>
      </div>
    </aside>
  );
}
```

---

## Phase 3: Testing

### Backend Tests

Create `Backend/tests/test_board_routes.py`:
```python
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine
from sqlmodel.pool import StaticPool

# Test board creation, retrieval, deletion
# Test permission enforcement
# Test error handling
```

### Frontend Tests

Create `Frontend/__tests__/components/UpvoteButton.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import UpvoteButton from '@/app/dashboard/boards/[boardId]/components/UpvoteButton';

describe('UpvoteButton', () => {
  it('toggles upvote state', () => {
    // Test upvote toggle behavior
    // Test local storage persistence
  });
});
```

---

## Database Migration

Run migrations to create tables:
```bash
cd Backend
alembic upgrade head
```

---

## Environment Variables

Add to `.env`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
DATABASE_URL=postgresql://user:password@localhost/feeders
```

---

## Next Steps

1. Implement backend routes and services
2. Create frontend components and pages
3. Write and run tests
4. Deploy to staging environment
5. Gather user feedback and iterate

---

## Troubleshooting

**Issue**: Share link not working
- **Solution**: Verify token is valid and not expired in database

**Issue**: Upvotes not persisting
- **Solution**: Check local storage is enabled in browser

**Issue**: Permission denied errors
- **Solution**: Verify JWT token is valid and user owns resource

---

## Support

For questions or issues, refer to:
- API Contracts: `contracts/api-contracts.md`
- Data Model: `data-model.md`
- Research: `research.md`
