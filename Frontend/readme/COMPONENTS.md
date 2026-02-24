# Components Documentation

## Button Components

### ButtonGetStarted

Dynamic call-to-action button that shows different states based on authentication.

**Props:**

- `className?: string` - Additional CSS classes
- `width?: string` - Width classes (e.g., "w-full")

**States:**

- Not authenticated: Shows "Get Started"
- Loading: Shows "Get Started" (disabled state)
- Authenticated: Shows "Welcome {name}"

**Usage:**

```tsx
import ButtonGetStarted from "@/app/components/ButtonGetStarted";

<ButtonGetStarted />
<ButtonGetStarted className="rounded-lg" width="w-full" />
```

**Behavior:**

- Links to `/sign-in` when not authenticated
- Links to `/dashboard` when authenticated
- Handles hydration properly (SSR compatible)
- Shows user-friendly name or "Friend" as fallback

---

### ButtonLogout

Sign out button with confirmation.

**Usage:**

```tsx
import ButtonLogout from "@/app/components/ButtonLogout";

<ButtonLogout />;
```

**Behavior:**

- Calls `authClient.signOut()`
- Redirects to home page after logout

---

### ButtonCheckout

Stripe checkout button for subscription payments.

**Props:**

- `priceId: string` - Stripe price ID

**Usage:**

```tsx
import ButtonCheckout from "@/app/components/ButtonCheckout";

<ButtonCheckout priceId="price_1234567890" />;
```

**Behavior:**

- Creates Stripe checkout session
- Redirects to Stripe payment page
- Returns to `/dashboard/success` on completion

---

### ButtonPortal

Customer billing portal button.

**Usage:**

```tsx
import ButtonPortal from "@/app/components/ButtonPortal";

<ButtonPortal />;
```

**Behavior:**

- Opens Stripe customer portal
- Allows users to manage subscriptions
- Handles billing information updates

---

## Authentication Components

### MagicLink

Email-based passwordless authentication form.

**Props:**

- None

**Usage:**

```tsx
import MagicLink from "@/app/components/MagicLink";

<MagicLink />;
```

**Features:**

- Email validation
- Loading states
- Success/error feedback
- Callback URL support

**Flow:**

1. User enters email
2. Click "Send Magic Link"
3. Email sent via Resend
4. User clicks link in email
5. Redirected to dashboard

---

### GoogleProvider

Google OAuth authentication button.

**Usage:**

```tsx
import GoogleProvider from "@/app/components/GoogleProvider";

<GoogleProvider />;
```

**Behavior:**

- Redirects to Google OAuth
- Handles callback automatically
- Creates session on success

---

## Board Components

### BoardList

Displays user's boards with actions.

**Props:**

- None (fetches data internally)

**Usage:**

```tsx
import BoardList from "@/app/components/BoardList";

<BoardList />;
```

**Features:**

- Auto-fetches boards on mount
- Loading state
- Error handling
- Edit/Delete actions
- Empty state message

---

### NewBoard

Modal form to create new board.

**Props:**

- `onBoardCreated?: () => void` - Callback after creation

**Usage:**

```tsx
import NewBoard from "@/app/components/NewBoard";

<NewBoard onBoardCreated={() => console.log("Board created!")} />;
```

**Features:**

- Input validation
- Loading state
- Error handling
- Auto-refresh on success

---

## Layout Components

### Header

Main navigation header.

**Props:**

- None

**Usage:**

```tsx
import Header from "@/app/components/Header";

<Header />;
```

**Contains:**

- Logo/Brand name
- Navigation links (Pricing, FAQ)
- ButtonGetStarted

---

### Hero

Landing page hero section.

**Props:**

- None

**Usage:**

```tsx
import Hero from "@/app/components/Hero";

<Hero />;
```

**Contains:**

- Headline
- Description
- Product image
- ButtonGetStarted

---

### Pricing

Pricing table component.

**Props:**

- None

**Usage:**

```tsx
import Pricing from "@/app/components/Pricing";

<Pricing />;
```

**Features:**

- Multiple pricing tiers
- Feature comparison
- ButtonCheckout integration

---

### FAQ

Frequently asked questions accordion.

**Props:**

- None

**Usage:**

```tsx
import FAQ from "@/app/components/Faq";

<FAQ />;
```

**Features:**

- Collapsible questions
- Smooth animations
- Mobile responsive

---

## Component Best Practices

### 1. Always use "use client" for interactive components

```tsx
"use client";
import { useState } from "react";
```

### 2. Handle loading states

```tsx
const [isLoading, setIsLoading] = useState(false);

if (isLoading) {
  return <div>Loading...</div>;
}
```

### 3. Handle errors gracefully

```tsx
const [error, setError] = useState<string | null>(null);

if (error) {
  return <div>Error: {error}</div>;
}
```

### 4. Use TypeScript interfaces for props

```tsx
interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export default function MyComponent({ title, onClick }: MyComponentProps) {
  // ...
}
```

### 5. Follow React Hooks rules

- Call hooks at top level
- Never call hooks conditionally
- Always call in same order

```tsx
// ✅ Correct
const { data, isPending } = useSession();

useEffect(() => {
  // ...
}, []);

// ❌ Wrong
if (condition) {
  const { data } = useSession(); // Never do this!
}
```

### 6. Use Server Components when possible

Default to Server Components unless you need:

- Browser APIs (window, document)
- Event handlers (onClick, onChange)
- State (useState, useReducer)
- Effects (useEffect, useLayoutEffect)

---

## Styling Guidelines

### TailwindCSS Classes

Use utility-first approach:

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  {/* content */}
</div>
```

### DaisyUI Components

Leverage DaisyUI for common patterns:

```tsx
<button className="btn btn-primary">Click me</button>
<div className="card bg-base-100 shadow-xl">...</div>
<div className="modal modal-open">...</div>
```

### Responsive Design

Use Tailwind responsive prefixes:

```tsx
<div className="max-lg:flex-col max-md:w-64 lg:text-5xl">
  {/* Responsive content */}
</div>
```

---

## Testing Components

### Manual Testing Checklist

- [ ] Component renders without errors
- [ ] Loading states display correctly
- [ ] Error states show appropriate messages
- [ ] Forms validate input
- [ ] Buttons trigger correct actions
- [ ] Links navigate to correct pages
- [ ] Mobile responsive
- [ ] Works with/without authentication
- [ ] Handles API errors gracefully
