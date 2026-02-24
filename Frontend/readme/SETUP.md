# Frontend Setup Instructions

## Environment Variables

Create a `.env.local` file in the Frontend directory with the following variables:

```env
# Database Configuration (PostgreSQL - Same as Backend)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-here-min-32-characters
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Google OAuth Credentials
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# Email Provider (Resend)
RESEND_KEY=your-resend-api-key
RESEND_FROM=noreply@yourdomain.com

# Backend API URL
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000

# Stripe Configuration (For Frontend Components - Will be moved to backend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Important Notes

### Database Migration
- **Before**: Frontend used MongoDB for Better Auth sessions
- **Now**: Frontend uses PostgreSQL (same database as backend)
- Better Auth will automatically create required tables: `user`, `session`, `account`, `verification`

### BETTER_AUTH_SECRET
- Must be at least 32 characters long
- **MUST BE IDENTICAL** in both Frontend and Backend `.env` files
- This secret is used to sign and verify JWT tokens
- Generate a secure secret: `openssl rand -base64 32`

### DATABASE_URL
- Use the same Neon PostgreSQL connection string as your Backend
- Both services share the same database
- Better Auth tables will be created automatically on first run

### Backend API URL
- Development: `http://localhost:8000`
- Production: Your deployed FastAPI URL (e.g., `https://api.yourdomain.com`)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run database migrations (Better Auth auto-creates tables):
```bash
npm run dev
```

3. Better Auth will create these tables automatically:
   - `user` - User accounts
   - `session` - User sessions
   - `account` - OAuth provider accounts
   - `verification` - Email verification tokens

## JWT Token Flow

1. User signs in → Better Auth creates JWT token
2. Token stored in browser (cookie or localStorage)
3. Frontend makes API call to Backend → Includes `Authorization: Bearer <token>`
4. Backend verifies JWT using `BETTER_AUTH_SECRET`
5. Backend extracts user email from token → Queries PostgreSQL

## What Changed

### Removed
- ❌ MongoDB connection (`lib/mongo.ts`)
- ❌ Mongoose connection (`lib/mongoose.ts`)
- ❌ Mongoose models (`Models/user.ts`, `Models/board.ts`)
- ❌ `mongodb` and `mongoose` npm packages

### Added
- ✅ PostgreSQL connection (`lib/postgres.ts`)
- ✅ JWT plugin in Better Auth
- ✅ Backend API client (`lib/backend-api.ts`)
- ✅ `pg` npm package

### Modified
- ✅ `lib/better-auth.ts` - Uses PostgreSQL adapter + JWT plugin
- ✅ `lib/auth-client.ts` - Added JWT client plugin
- ✅ `package.json` - Replaced MongoDB with PostgreSQL

## Next Steps

After frontend setup is complete:
1. Install dependencies: `npm install`
2. Set up `.env.local` file
3. Run development server: `npm run dev`
4. Better Auth will create database tables automatically
5. Test login flow (Google OAuth or Magic Link)
6. Verify JWT token is generated (check browser DevTools)

## Troubleshooting

### "Missing DATABASE_URL" Error
- Ensure `.env.local` has `DATABASE_URL` variable
- Check connection string format is correct

### "Missing BETTER_AUTH_SECRET" Error
- Ensure secret is at least 32 characters
- Use same secret in both frontend and backend

### PostgreSQL Connection Issues
- Verify Neon PostgreSQL is accessible
- Check SSL settings in connection string
- Ensure `sslmode=require` is in connection string

### JWT Token Not Generated
- Check Better Auth configuration has JWT plugin
- Verify `BETTER_AUTH_SECRET` is set
- Check browser console for errors