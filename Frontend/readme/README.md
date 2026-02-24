# Frontend Application - Feeder

A modern feedback management platform built with Next.js 16, Better Auth, and TypeScript.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Authentication**: Better Auth
- **Styling**: TailwindCSS + DaisyUI
- **API Client**: Axios
- **State Management**: React Hooks
- **Email**: Resend
- **Payments**: Stripe

## 📁 Project Structure

```
Frontend/
├── app/                        # Next.js App Router
│   ├── api/                   # API routes
│   │   └── better-auth/       # Auth endpoints
│   ├── components/            # React components
│   ├── dashboard/             # Dashboard pages
│   ├── sign-in/              # Authentication pages
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   ├── providers.tsx         # App providers
│   └── globals.css           # Global styles
├── lib/                       # Utilities
│   ├── auth-client.ts        # Better Auth client
│   ├── backend-api.ts        # Backend API client
│   ├── better-auth.ts        # Auth configuration
│   └── postgres.ts           # Database connection
├── public/                    # Static assets
├── readme/                    # Documentation files
└── scripts/                   # Utility scripts
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Stripe account (for payments)
- Resend account (for emails)
- Google OAuth credentials (optional)

### Steps

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create `.env.local` file:

   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=verify-full

   # Better Auth
   BETTER_AUTH_SECRET=your-secret-key-min-32-characters
   NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

   # Google OAuth (Optional)
   GOOGLE_ID=your-google-client-id
   GOOGLE_SECRET=your-google-client-secret

   # Resend Email
   RESEND_KEY=your-resend-api-key
   RESEND_FROM=noreply@yourdomain.com

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Backend API
   NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
   ```

3. **Initialize database**

   ```bash
   node scripts/init-db.js
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

   Application will be available at http://localhost:3000

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🔑 Authentication

The application uses **Better Auth** for authentication with multiple providers:

- **Magic Link**: Email-based passwordless auth
- **Google OAuth**: Sign in with Google
- **JWT**: Token-based session management

### Authentication Flow

1. User clicks "Get Started" → Redirects to `/sign-in`
2. User selects auth method (Magic Link or Google)
3. Auth completes → Session created
4. User redirected to `/dashboard`

## 🎨 Components

### Core Components

- **ButtonGetStarted**: Dynamic CTA button (shows "Get Started" or "Welcome {name}")
- **ButtonLogout**: Logout functionality
- **ButtonCheckout**: Stripe checkout integration
- **ButtonPortal**: Stripe customer portal
- **Header**: Navigation header
- **Hero**: Landing page hero section
- **Pricing**: Pricing table
- **FAQ**: Frequently asked questions
- **BoardList**: Display user boards
- **NewBoard**: Create new board modal
- **MagicLink**: Email authentication form
- **GoogleProvider**: Google OAuth button

### Component Usage

```tsx
import ButtonGetStarted from "@/app/components/ButtonGetStarted";

<ButtonGetStarted className="custom-class" width="w-full" />;
```

## 🔌 API Integration

Backend API calls are managed through `lib/backend-api.ts`:

```typescript
import backendApi from "@/lib/backend-api";

// Get all boards
const response = await backendApi.get("/boards/");

// Create board
const response = await backendApi.post("/boards/", {
  board_name: "New Board",
});

// Update board
const response = await backendApi.put(`/boards/${boardId}`, {
  board_name: "Updated Name",
});

// Delete board
await backendApi.delete(`/boards/${boardId}`);
```

All requests automatically include authentication tokens via interceptors.

## 💳 Stripe Integration

### Features

- Subscription checkout
- Customer portal
- Webhook handling
- Payment verification

### Usage

```tsx
import ButtonCheckout from "@/app/components/ButtonCheckout";

<ButtonCheckout priceId="price_xxx" />;
```

## 🎯 Pages

### Public Pages

- `/` - Landing page
- `/sign-in` - Authentication

### Protected Pages (Require Auth)

- `/dashboard` - User dashboard
- `/dashboard/b/[boardId]` - Board details
- `/dashboard/success` - Payment success

## 🐛 Troubleshooting

### Turbopack Crashes

If you see continuous Turbopack errors, disable it:

```json
// package.json
"scripts": {
  "dev": "set TURBOPACK=0&& next dev"
}
```

### Session Errors

Clear Next.js cache:

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### Database Connection Issues

- Verify DATABASE_URL in `.env.local`
- Check PostgreSQL is running
- Ensure SSL mode is correct (`sslmode=verify-full` for production)

### CORS Errors

Backend must allow frontend origin in CORS middleware:

```python
allow_origins=["http://localhost:3000"]
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Environment Variables for Production

- Update `NEXT_PUBLIC_BETTER_AUTH_URL` to your domain
- Use production Stripe keys
- Use production database URL

## 📚 Additional Documentation

- [Authentication Setup](AUTH_SETUP_GUIDE.md)
- [Testing Guide](TEST_AUTH.md)
- [Setup Instructions](SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Open Pull Request

## 📄 License

MIT License - See LICENSE file for details
