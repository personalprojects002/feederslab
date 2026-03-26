# 🎯 FeedersLab

> **Collect customer feedback to build better products**

A modern, minimalist feedback management platform that helps product teams centralize customer insights, prioritize features, and make data-driven decisions with confidence.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Active-brightgreen.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

---

## ✨ Features

### 🎨 Beautiful & Intuitive Interface
- **Minimalist Design**: Clean, modern UI built with Tailwind CSS
- **Fully Responsive**: Optimized for mobile, tablet, and desktop devices
- **Dark & Light Modes**: Seamless theme switching for user preference
- **Smooth Animations**: Polished interactions and transitions

### 📊 Feedback Management
- **Centralized Feedback Board**: One clear place for all customer requests
- **Smart Prioritization**: Sort and filter feedback by votes, categories, and impact
- **Public Roadmap**: Share your product direction with customers
- **Real-time Updates**: See feedback changes instantly

### 👥 Team Collaboration
- **Multi-user Support**: Invite team members to collaborate
- **Admin Dashboard**: Manage boards, users, and settings
- **Role-based Access**: Control who can view and edit feedback
- **Activity Tracking**: Monitor all changes and updates

### 🔐 Security & Authentication
- **Secure Authentication**: Email/password and OAuth2 support
- **JWT Tokens**: Secure session management with refresh tokens
- **Token Expiry Monitoring**: Automatic session refresh and renewal
- **CORS Protection**: Secure cross-origin requests

### 💳 Subscription Management
- **Stripe Integration**: Seamless payment processing
- **Flexible Pricing**: Simple, transparent pricing model
- **Subscription Tracking**: Monitor active subscriptions and billing
- **Secure Checkout**: PCI-compliant payment handling

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+
- PostgreSQL database
- Stripe account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/personalprojects002/fixer.git
cd fixer
```

2. **Setup Frontend**
```bash
cd Frontend
npm install
# or
yarn install
```

3. **Setup Backend**
```bash
cd Backend
pip install -r requirements.txt
```

4. **Environment Configuration**

Create `.env.local` in the Frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_KEY=your_stripe_public_key
```

Create `.env` in the Backend directory:
```env
DATABASE_URL=postgresql://user:password@localhost/fixer
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

5. **Run Development Servers**

Frontend:
```bash
cd Frontend
npm run dev
# Runs on http://localhost:3000
```

Backend:
```bash
cd Backend
python main.py
# Runs on http://localhost:8000
```

---

## 📁 Project Structure

```
fixer/
├── Frontend/                    # Next.js React application
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── sign-in/            # Authentication
│   │   ├── components/         # Reusable components
│   │   ├── globals.css         # Global styles
│   │   └── layout.tsx          # Root layout
│   ├── lib/
│   │   ├── auth-client.ts      # Auth client setup
│   │   ├── better-auth.server.ts
│   │   └── refresh-token-utils.ts
│   └── public/                 # Static assets
│
├── Backend/                     # Python FastAPI application
│   ├── src/
│   │   ├── models/             # Database models
│   │   ├── services/           # Business logic
│   │   ├── routes/             # API endpoints
│   │   └── config/             # Configuration
│   ├── main.py                 # Application entry point
│   └── requirements.txt        # Python dependencies
│
└── specs/                       # Feature specifications
    └── 1-refresh-token/        # Token refresh feature spec
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14+ with React 18+
- **Styling**: Tailwind CSS with custom configuration
- **Typography**: Plus Jakarta Sans & Inter fonts
- **Authentication**: Better Auth with JWT tokens
- **State Management**: React hooks and context
- **HTTP Client**: Axios with interceptors
- **Payments**: Stripe integration

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT with refresh tokens
- **API**: RESTful endpoints with CORS support
- **Payments**: Stripe API integration
- **Async**: AsyncIO for concurrent operations

### DevOps & Tools
- **Version Control**: Git & GitHub
- **Package Management**: npm/yarn (Frontend), pip (Backend)
- **Environment**: Docker-ready configuration
- **Monitoring**: Token expiry monitoring system

---

## 🔑 Key Features Explained

### 1. **Feedback Collection**
Users can submit feature requests and ideas through a public or private feedback board. Each submission includes:
- Feature title and description
- Category/tag classification
- Upvote system for prioritization
- Customer segment targeting

### 2. **Smart Prioritization**
Product teams can:
- Sort feedback by vote count
- Filter by customer segments
- Identify high-impact features
- Plan roadmap based on demand

### 3. **Public Roadmap**
Share your product direction with customers:
- Planned features
- In-review items
- Completed features
- Build trust and transparency

### 4. **Team Collaboration**
- Invite team members to boards
- Assign feedback to team members
- Add internal notes and discussions
- Track progress and updates

### 5. **Secure Authentication**
- Email/password registration
- OAuth2 social login
- JWT token-based sessions
- Automatic token refresh
- Session expiry monitoring

### 6. **Subscription Management**
- Stripe payment integration
- Flexible pricing plans
- Subscription tracking
- Billing management
- Secure checkout experience

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Boards
- `GET /api/boards` - List user's boards
- `POST /api/boards` - Create new board
- `GET /api/boards/{id}` - Get board details
- `PUT /api/boards/{id}` - Update board
- `DELETE /api/boards/{id}` - Delete board

### Feedback
- `GET /api/boards/{id}/feedback` - List feedback
- `POST /api/boards/{id}/feedback` - Submit feedback
- `PUT /api/feedback/{id}` - Update feedback
- `DELETE /api/feedback/{id}` - Delete feedback
- `POST /api/feedback/{id}/upvote` - Upvote feedback

### Subscriptions
- `GET /api/subscriptions` - Get subscription status
- `POST /api/subscriptions/checkout` - Create checkout session
- `POST /api/subscriptions/webhook` - Stripe webhook handler

---

## 🎨 Design System

### Color Palette
- **Primary**: Black (#000000)
- **Background**: White (#FFFFFF)
- **Accent**: Gray (#F3F4F6)
- **Text**: Dark Gray (#1F2937)
- **Border**: Light Gray (#E5E7EB)

### Typography
- **Headings**: Plus Jakarta Sans (Bold, 700)
- **Body**: Inter (Regular, 400)
- **Labels**: Inter (Medium, 500)

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

---

## 🔄 Authentication Flow

```
User Registration/Login
        ↓
JWT Token Generated
        ↓
Token Stored in Session
        ↓
Token Expiry Monitor Active
        ↓
Token Expires (30 min)
        ↓
Refresh Token Used
        ↓
New JWT Token Generated
        ↓
Session Continues
```

---

## 📱 Responsive Design

FeedersLab is built mobile-first with full responsiveness:

- **Mobile**: Optimized touch interactions, stacked layouts
- **Tablet**: Balanced spacing, readable typography
- **Desktop**: Full-width layouts, advanced features

All components scale beautifully across devices with adaptive:
- Font sizes
- Padding and margins
- Grid layouts
- Button sizes

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
vercel deploy
```

### Backend (Heroku/Railway)
```bash
git push heroku main
```

### Environment Variables
Ensure all required environment variables are set in your deployment platform.

---

## 🧪 Testing

### Frontend Tests
```bash
cd Frontend
npm run test
```

### Backend Tests
```bash
cd Backend
pytest
```

---

## 📝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🤝 Support

For support, email support@feederslab.com or open an issue on GitHub.

---

## 🎯 Roadmap

- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] AI-powered insights
- [ ] Slack integration
- [ ] Email notifications
- [ ] Custom branding
- [ ] API for third-party integrations
- [ ] Multi-language support

---

## 👨‍💻 Author

**FeedersLab Team**
- GitHub: [@personalprojects002](https://github.com/personalprojects002)
- Repository: [fixer](https://github.com/personalprojects002/fixer)

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Authentication by [Better Auth](https://better-auth.com/)
- Payments by [Stripe](https://stripe.com/)
- Backend powered by [FastAPI](https://fastapi.tiangolo.com/)

---

<div align="center">

**[Live Demo](https://feederslab.com)** • **[Documentation](https://docs.feederslab.com)** • **[Issues](https://github.com/personalprojects002/fixer/issues)**

Made with ❤️ by the FeedersLab Team

</div>
