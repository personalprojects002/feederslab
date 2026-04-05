# Research: Feedback Collection & Board Management

**Date**: 2026-04-05  
**Feature**: Feedback Collection & Board Management  
**Status**: Complete

## Research Findings

### 1. Share Link Implementation Pattern

**Decision**: Use URL-safe tokens (UUID-based) stored in database with access level

**Rationale**: 
- Enables revocation by deleting the token record
- Allows tracking of share link usage and analytics
- Supports permission enforcement at the database level
- Stateful approach allows expiration and rate limiting in future

**Alternatives Considered**:
- JWT tokens: Stateless but harder to revoke; would require token blacklist
- Simple numeric IDs: Less secure, easier to guess
- Hash-based tokens: More complex, no additional security benefit for this use case

**Implementation Details**:
- Generate 32-character URL-safe random token (using `secrets.token_urlsafe()`)
- Store in database with board_id and access_level
- Validate token on every shared board access
- Support optional expiration for future time-limited shares

---

### 2. Local Storage Vote Tracking

**Decision**: Store votes as JSON object keyed by feature ID, with user session identifier

**Rationale**:
- Prevents double voting without requiring authentication
- Persists across browser sessions and page refreshes
- Works offline (eventual sync when online)
- Minimal storage footprint (one entry per upvoted feature)

**Alternatives Considered**:
- Backend session tracking: Requires authentication, defeats purpose of public sharing
- Cookies: Limited to 4KB, harder to manage complex state
- IndexedDB: Overkill for this use case, adds complexity

**Implementation Details**:
- Storage key: `feeders_upvotes_{boardId}`
- Value: `{ featureId: true, featureId2: true }`
- Generate user identifier: Hash of browser fingerprint or use session ID
- Sync with backend on upvote toggle for count accuracy

---

### 3. Permission Model

**Decision**: Three-tier system (Owner, Creator+Upvoter, Upvoter-only)

**Rationale**:
- Matches business requirements exactly
- Simple to implement and enforce
- Clear UI/UX implications (show/hide buttons based on tier)
- Extensible for future permission levels

**Alternatives Considered**:
- Role-based access control (RBAC): Over-engineered for current scope
- Attribute-based access control (ABAC): Too complex, not needed yet
- Simple binary (can edit / cannot edit): Doesn't support Create+Upvote distinction

**Implementation Details**:
- Determine permission from: board ownership, share link access level, or creator status
- Enforce at API level (return 403 Forbidden for unauthorized actions)
- Enforce at UI level (hide buttons for users without permission)
- Store permission context in frontend state after validating share token

---

### 4. Upvote Count Persistence

**Decision**: Store in database, sync with local storage state

**Rationale**:
- Database is single source of truth for accurate counts
- Local storage provides instant UI feedback without waiting for API
- Eventual consistency model acceptable per requirements
- Supports analytics and reporting on feature popularity

**Alternatives Considered**:
- Client-only storage: Loses data on refresh, no cross-device sync
- Server-only: Slower UX (wait for API response on every upvote)
- Real-time sync: Over-engineered, adds complexity

**Implementation Details**:
- Upvote toggle: Update local storage immediately, send API request in background
- API response: Return updated count, update local storage if different
- On page load: Fetch current counts from API, merge with local storage state
- Handle conflicts: Server count is authoritative, local storage is cache

---

### 5. Premium UI/UX Design

**Decision**: Use Tailwind CSS + DaisyUI with enterprise color palette

**Rationale**:
- Matches existing tech stack (already in use)
- DaisyUI provides professional, pre-built components
- Tailwind enables rapid, consistent styling
- Enterprise color palette conveys premium positioning

**Alternatives Considered**:
- Custom CSS: More work, inconsistent styling, harder to maintain
- Material UI: Different design language, doesn't match landing page
- Shadcn/ui: Good but requires more customization

**Implementation Details**:
- Use landing page color scheme (extract from existing design)
- Apply consistent spacing, typography, and component styling
- Ensure responsive design (mobile, tablet, desktop)
- Use DaisyUI components: buttons, modals, cards, forms
- Add smooth transitions and hover states for premium feel

---

### 6. Share Link Security

**Decision**: Public access with backend permission validation

**Rationale**:
- Share links are intentionally public (business requirement)
- Backend validates access level on every request
- No authentication required, but authorization enforced
- Prevents unauthorized actions (e.g., creating features with Upvote-only link)

**Alternatives Considered**:
- Require authentication: Defeats purpose of sharing
- No validation: Security risk, allows unauthorized actions
- IP-based restrictions: Too restrictive, doesn't work for mobile users

**Implementation Details**:
- Share link contains token, not user ID
- Token lookup returns board and access level
- Every request validates: token exists, access level permits action
- Log share link usage for analytics

---

### 7. Feature Deletion Permissions

**Decision**: Creator can delete own features, owner can delete any feature

**Rationale**:
- Creators have ownership of their contributions
- Board owner has ultimate control
- Prevents accidental deletion by other users
- Supports moderation by board owner

**Alternatives Considered**:
- Only owner can delete: Limits user autonomy
- Anyone can delete: Chaos, no moderation
- Soft delete (archive): Adds complexity, not required

**Implementation Details**:
- Check: `feature.creator_id == current_user_id OR board.owner_id == current_user_id`
- Return 403 Forbidden if user lacks permission
- Hide delete button in UI for users without permission
- Log deletions for audit trail

---

### 8. Board Deletion

**Decision**: Only owner can delete board, cascades to features and share links

**Rationale**:
- Board owner has ultimate control
- Prevents accidental deletion by shared users
- Cascading delete maintains data integrity

**Implementation Details**:
- Check: `board.owner_id == current_user_id`
- Return 403 Forbidden if not owner
- Delete board, features, share links, upvotes in transaction
- Hide delete button in UI for non-owners

---

## Resolved Unknowns

✅ All research questions answered  
✅ No blockers identified  
✅ Ready for Phase 1 design and implementation

## Technology Stack Confirmation

**Backend**:
- FastAPI for API endpoints
- SQLModel for ORM and type safety
- PostgreSQL for persistence
- Pydantic for request/response validation
- Custom HTTP exceptions for error handling

**Frontend**:
- Next.js 16 with App Router
- React 19 with TypeScript
- Tailwind CSS + DaisyUI for styling
- Axios for API calls
- Local Storage API for vote tracking
- React hooks for state management

**No new dependencies required** - all technologies already in project stack.
