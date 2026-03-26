<!-- Sync Impact Report
Version: 1.0.0 (initial)
Ratification: 2026-03-02
Changes: Initial constitution created with 4 core principles + Technology Stack section
Modified Principles: N/A (new document)
Added Sections: Core Principles, Technology Stack, Governance
Removed Sections: N/A
Templates Updated: ✅ All dependent templates reviewed and aligned
Follow-up TODOs: None
-->

# FeedersLab Constitution

## Core Principles

### I. API-First Design

Backend APIs are the authoritative contract for all client interactions. Frontend and external integrations depend on well-defined, versioned endpoints. All feature work begins with API design; frontend and billing integrations follow from the API contract, never precede it.

**Non-negotiable rules:**

- API endpoints must be documented before implementation
- Breaking changes require major version bump and migration plan
- All external integrations (Stripe, Resend, Google OAuth) communicate through typed backend handlers
- Response schemas are versioned and backward-compatible by default

**Rationale:** Clear API contracts prevent frontend/backend misalignment, enable parallel work, and make integrations predictable and testable.

### II. Type Safety

TypeScript on the frontend and Python type hints on the backend catch errors at compile-time, not runtime. All new code must include type annotations; untyped code is a code smell.

**Non-negotiable rules:**

- Frontend: TypeScript strict mode enabled; no `any` types without justification
- Backend: Python 3.12+ with type hints on all function signatures and class attributes
- Shared types (API responses, database models) are defined once and referenced, never duplicated
- Type checking runs in CI/CD; type errors block merges

**Rationale:** Type safety reduces bugs in production, improves IDE support, and makes refactoring safer.

### III. Test-Driven Development

Tests are written first; implementation follows. Red-Green-Refactor cycle is enforced for all features. No feature ships without passing tests that verify the contract.

**Non-negotiable rules:**

- Feature work: write test → user approves test → test fails → implement → test passes
- Unit tests cover business logic; integration tests cover API contracts and external service interactions
- Test coverage for critical paths (auth, billing, board operations) must not decrease
- All tests run in CI/CD; failing tests block merges

**Rationale:** TDD ensures features work as designed, provides living documentation, and prevents regressions.

### IV. Security by Default

Authentication, authorization, and data protection are non-negotiable. Security reviews are required for all features handling user data, billing, or authentication flows.

**Non-negotiable rules:**

- All API endpoints require authentication (JWT tokens) unless explicitly public
- Authorization checks verify user owns the resource before returning or modifying it
- Sensitive data (passwords, API keys, billing info) never logged or exposed in errors
- Stripe webhook signatures are verified; all webhook handlers validate request origin
- Environment secrets are never committed; `.env` files are gitignored

**Rationale:** Security breaches damage trust and product viability. Proactive security prevents costly incidents.

## Technology Stack

The following stack is standardized across FeedersLab. Deviations require constitution amendment.

**Frontend:**

- Next.js 16 (App Router)
- React 19 + TypeScript (strict mode)
- Tailwind CSS + DaisyUI for styling
- Axios for backend API calls
- Better Auth for authentication (email magic link + Google OAuth)
- React Hot Toast for notifications
- Stripe SDK for checkout integration

**Backend:**

- FastAPI with Uvicorn ASGI server
- SQLModel + SQLAlchemy for ORM
- PostgreSQL for persistence
- JWT (pyjwt[crypto]) for token-based auth
- Stripe Python SDK for billing
- Python Dotenv for environment management

**External Services:**

- Stripe (subscriptions, checkout, billing portal, webhooks)
- Resend (magic-link email delivery)
- Google OAuth (social login)

**Rationale:** Standardized stack reduces cognitive load, enables code reuse, and simplifies onboarding.

## Governance

**Constitution Authority:**
This constitution supersedes all other development practices and guidelines. When conflicts arise, constitution principles take precedence.

**Amendment Process:**

1. Proposed amendment documented with rationale
2. Team review and approval required
3. Migration plan created if breaking changes introduced
4. Version bumped according to semantic versioning:
   - MAJOR: Principle removal or redefinition (backward incompatible)
   - MINOR: New principle or section added
   - PATCH: Clarifications, wording, non-semantic refinements
5. All dependent templates and docs updated before merge

**Compliance Review:**
- All PRs must verify compliance with Core Principles
- Code reviews check for type safety, test coverage, and security practices
- Complexity must be justified against Simplicity principle
- Use `.specify/` templates and guidance files for runtime development decisions

**Version**: 1.0.0 | **Ratified**: 2026-03-02 | **Last Amended**: 2026-03-02
