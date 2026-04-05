# Implementation Plan: Feedback Collection & Board Management

**Branch**: `2-feedback-features` | **Date**: 2026-04-05 | **Spec**: [specs/2-feedback-features/spec.md](../spec.md)
**Input**: Feature specification from `/specs/2-feedback-features/spec.md`

## Summary

Implement a complete feedback collection system allowing business owners to create feature boards, manage features with upvoting, and share boards with customers at different permission levels (Create+Upvote or Upvote-Only). The system uses local storage for vote tracking to prevent double voting, includes permission-based deletion, and adds a sidebar navigation to the dashboard. All shared boards are accessible without authentication, with a premium enterprise UI matching the landing page design.

## Technical Context

**Language/Version**: Python 3.12+ (Backend), TypeScript 5.x (Frontend)  
**Primary Dependencies**: FastAPI, SQLModel, Next.js 16, React 19, Tailwind CSS, DaisyUI  
**Storage**: PostgreSQL (board data, features, upvotes), Local Storage (client-side vote state)  
**Testing**: pytest (Backend), Vitest (Frontend)  
**Target Platform**: Web (Desktop/Tablet)  
**Project Type**: Full-stack SaaS web application  
**Performance Goals**: Feature creation <2s, shared board load <3s, upvote toggle instant  
**Constraints**: No real-time collaboration required, eventual consistency acceptable  
**Scale/Scope**: Multi-tenant (per business owner), unlimited boards/features per owner, anonymous shared access

## Constitution Check

**GATE: Must pass before Phase 0 research**

✅ **API-First Design**: All features require backend API endpoints before frontend implementation. Share links, permission checks, and upvote operations are API-driven.

✅ **Type Safety**: Backend uses Python type hints (SQLModel models, Pydantic schemas). Frontend uses TypeScript strict mode for components and API calls.

✅ **Test-Driven Development**: Tests will be written for all API endpoints (permission checks, upvote logic, share link validation) and frontend components (upvote toggle, permission-based UI).

✅ **Security by Default**: 
- Share links are public but validated on backend
- Permission checks enforce access levels (Create+Upvote vs Upvote-Only)
- Board deletion restricted to owner
- Feature deletion restricted to creator or owner
- No authentication required for shared boards, but access level enforced

**GATE STATUS**: ✅ PASSED - All principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/2-feedback-features/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
Backend/
├── src/
│   ├── models/
│   │   ├── board.py          # Board model
│   │   ├── feature.py        # Feature model
│   │   ├── share_link.py     # Share link model
│   │   └── upvote.py         # Upvote tracking model
│   ├── schemas/
│   │   ├── board.py          # Board request/response schemas
│   │   ├── feature.py        # Feature request/response schemas
│   │   ├── share_link.py     # Share link schemas
│   │   └── upvote.py         # Upvote schemas
│   ├── routes/
│   │   ├── boards.py         # Board endpoints (create, read, delete)
│   │   ├── features.py       # Feature endpoints (create, read, delete)
│   │   ├── share_links.py    # Share link endpoints (generate, validate)
│   │   └── upvotes.py        # Upvote endpoints (toggle, get)
│   ├── services/
│   │   ├── board_service.py  # Board business logic
│   │   ├── feature_service.py # Feature business logic
│   │   ├── share_service.py  # Share link & permission logic
│   │   └── upvote_service.py # Upvote business logic
│   ├── utils/
│   │   ├── errors.py         # Custom HTTP exceptions
│   │   └── permissions.py    # Permission checking utilities
│   └── config/
│       └── db.py             # Database configuration

Frontend/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   ├── page.tsx          # Dashboard main page
│   │   └── boards/
│   │       ├── [boardId]/
│   │       │   ├── page.tsx  # Board view (owner & shared)
│   │       │   └── components/
│   │       │       ├── FeatureList.tsx
│   │       │       ├── FeatureForm.tsx
│   │       │       ├── FeatureCard.tsx
│   │       │       ├── UpvoteButton.tsx
│   │       │       ├── ShareModal.tsx
│   │       │       └── DeleteConfirmation.tsx
│   │       └── new/
│   │           └── page.tsx  # Create board page
│   ├── shared/
│   │   └── [shareToken]/
│   │       └── page.tsx      # Shared board view (no auth)
│   ├── components/
│   │   ├── Sidebar.tsx       # Dashboard sidebar navigation
│   │   ├── BoardCard.tsx     # Board list item
│   │   └── Navigation.tsx    # Sidebar sections
│   └── lib/
│       ├── api/
│       │   ├── boards.ts     # Board API calls
│       │   ├── features.ts   # Feature API calls
│       │   ├── shareLinks.ts # Share link API calls
│       │   └── upvotes.ts    # Upvote API calls
│       └── hooks/
│           ├── useUpvotes.ts # Local storage upvote state
│           └── usePermissions.ts # Permission checking

tests/
├── backend/
│   ├── test_board_routes.py
│   ├── test_feature_routes.py
│   ├── test_share_routes.py
│   └── test_upvote_routes.py
└── frontend/
    ├── components/
    │   ├── UpvoteButton.test.tsx
    │   ├── FeatureCard.test.tsx
    │   └── ShareModal.test.tsx
    └── hooks/
        └── useUpvotes.test.ts
```

**Structure Decision**: Web application with separate Backend (FastAPI) and Frontend (Next.js) directories. Backend handles all business logic, data persistence, and permission enforcement. Frontend handles UI/UX with local storage for vote state management. Shared boards are accessible via public routes without authentication.

## Complexity Tracking

No constitution violations. All complexity is justified by feature requirements:
- Multiple models (Board, Feature, ShareLink, Upvote) required for data integrity and permission enforcement
- Permission service needed to enforce access control across different user types
- Local storage hook needed for client-side vote state management without authentication

---

## Phase 0: Research & Unknowns

### Research Tasks

1. **Share Link Implementation Pattern**
   - Decision: Use URL-safe tokens (UUID-based) stored in database with access level
   - Rationale: Enables revocation, tracking, and permission enforcement
   - Alternatives: JWT tokens (stateless but harder to revoke), simple IDs (less secure)

2. **Local Storage Vote Tracking**
   - Decision: Store votes as JSON object keyed by feature ID, with user session identifier
   - Rationale: Prevents double voting, persists across sessions, works without backend state
   - Alternatives: Backend session tracking (requires auth), cookies (limited size)

3. **Permission Model**
   - Decision: Three-tier system (Owner, Creator+Upvoter, Upvoter-only)
   - Rationale: Matches business requirements, simple to enforce
   - Alternatives: Role-based access control (over-engineered for current scope)

4. **Upvote Count Persistence**
   - Decision: Store in database, sync with local storage state
   - Rationale: Single source of truth in database, local cache for UI responsiveness
   - Alternatives: Client-only (loses data on refresh), server-only (slower UX)

5. **Premium UI/UX Design**
   - Decision: Use Tailwind CSS + DaisyUI with enterprise color palette
   - Rationale: Matches existing stack, provides professional components
   - Alternatives: Custom CSS (more work), Material UI (different design language)

### Research Output

All unknowns resolved. No blockers identified. Ready for Phase 1 design.

---

## Phase 1: Design & Contracts

### Data Model

**Board**
- `id`: UUID (primary key)
- `owner_id`: UUID (foreign key to User)
- `name`: String (required, max 255 chars)
- `description`: String (optional, max 1000 chars)
- `created_at`: DateTime
- `updated_at`: DateTime
- Relationships: One-to-Many with Features, One-to-Many with ShareLinks

**Feature**
- `id`: UUID (primary key)
- `board_id`: UUID (foreign key to Board)
- `creator_id`: UUID (foreign key to User)
- `title`: String (required, max 255 chars)
- `description`: String (optional, max 1000 chars)
- `upvote_count`: Integer (default 0)
- `created_at`: DateTime
- `updated_at`: DateTime
- Relationships: Many-to-One with Board, Many-to-One with User

**ShareLink**
- `id`: UUID (primary key)
- `board_id`: UUID (foreign key to Board)
- `token`: String (unique, URL-safe)
- `access_level`: Enum (CREATE_UPVOTE, UPVOTE_ONLY)
- `created_at`: DateTime
- `expires_at`: DateTime (optional, null = never expires)
- Relationships: Many-to-One with Board

**Upvote** (Database tracking for analytics)
- `id`: UUID (primary key)
- `feature_id`: UUID (foreign key to Feature)
- `user_identifier`: String (session ID or anonymous identifier)
- `created_at`: DateTime
- Relationships: Many-to-One with Feature

### API Contracts

**Board Endpoints**
- `POST /api/boards` - Create board (authenticated owner)
- `GET /api/boards` - List user's boards (authenticated)
- `GET /api/boards/{boardId}` - Get board details (owner only)
- `DELETE /api/boards/{boardId}` - Delete board (owner only)

**Feature Endpoints**
- `POST /api/boards/{boardId}/features` - Create feature (owner or shared with Create+Upvote)
- `GET /api/boards/{boardId}/features` - List features (any access)
- `DELETE /api/boards/{boardId}/features/{featureId}` - Delete feature (creator or owner)

**Share Link Endpoints**
- `POST /api/boards/{boardId}/share` - Generate share link (owner only)
- `GET /api/share/{token}` - Get shared board (public, no auth)
- `GET /api/share/{token}/features` - Get features for shared board (public)

**Upvote Endpoints**
- `POST /api/features/{featureId}/upvote` - Toggle upvote (any access)
- `GET /api/features/{featureId}/upvote-status` - Check if user upvoted (any access)

### Frontend Components

**Sidebar Navigation**
- Display "Boards" section with list of owned boards
- Display "Shared Boards" section with list of shared boards
- Include 2-3 placeholder sections for future expansion
- Active state highlighting for current board

**Board View**
- Feature list with upvote counts
- "Add Feature" button (visible only with Create permission)
- "Share Board" button (visible only for owner)
- "Delete Board" button (visible only for owner)

**Feature Card**
- Title and description
- Upvote button with toggle state
- Delete button (visible only with delete permission)
- Upvote count display

**Share Modal**
- Access level selector (Create+Upvote, Upvote-Only)
- Copy-to-clipboard button for share link
- Link preview

**Upvote Button**
- Toggle state (upvoted/not upvoted)
- Visual feedback on click
- Upvote count display
- Local storage persistence

### Quickstart

1. **Backend Setup**
   - Add models to `Backend/src/models/`
   - Add schemas to `Backend/src/schemas/`
   - Add routes to `Backend/src/routes/`
   - Add services to `Backend/src/services/`
   - Add custom errors to `Backend/src/utils/errors.py`
   - Run migrations to create tables

2. **Frontend Setup**
   - Create board view components in `Frontend/app/dashboard/boards/`
   - Create shared board view in `Frontend/app/shared/`
   - Add sidebar to dashboard layout
   - Create API client functions in `Frontend/app/lib/api/`
   - Create custom hooks for upvote state management

3. **Testing**
   - Write API tests for all endpoints
   - Write component tests for UI interactions
   - Test permission enforcement
   - Test local storage persistence

---

## Next Steps

Ready for Phase 2: `/speckit.tasks` to generate actionable implementation tasks with proper sequencing and dependencies.
