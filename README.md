# VibeToApp - AI-Powered SaaS Idea Development Platform

**Status:** 85% Complete - Core functionality implemented, deployment preparation in progress

This repository contains the codebase for VibeToApp, a SaaS application that guides users through a 9-step AI-powered workflow to transform app ideas into detailed specifications, manage projects, and export their work.

## 📚 Documentation

All project documentation is organized in the [`/docs`](./docs) folder:

- **[📋 Quick Start](./docs/README.md)** - Complete documentation index
- **[📊 Project Status](./docs/development/project_status.md)** - Current implementation status
- **[🔄 Next Steps](./docs/development/next_steps.md)** - Development continuation guide
- **[🔐 Authentication](./docs/auth/)** - OAuth setup, testing, and troubleshooting
- **[🗄️ Database](./docs/database/)** - Supabase configuration and migration guides
- **[🎨 UI/UX](./docs/ui/)** - Design decisions and visibility fixes
- **[🛠️ Development](./docs/development/)** - Implementation plan, specifications, and guides

## 🚀 Project Status

**Current Implementation (Steps 1-24 Complete):**
- ✅ Complete authentication system with social login
- ✅ AI-powered workflow engine with Google Gemini integration
- ✅ Professional payment processing with Stripe
- ✅ Production-ready export system (PDF/Markdown)
- ✅ Background job processing with error handling
- ✅ Auto-save functionality and progress tracking
- ✅ Data flow engine with automatic field mapping
- ✅ Email notification system

**Next Steps (Steps 25-26):**
- ⏳ CI/CD Pipeline setup
- ⏳ Environment management and deployment
- ⏳ Complete remaining workflow steps (3-9)

## 🛠️ Technology Stack

* **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Framer Motion
* **Backend:** Next.js API Routes, Prisma ORM
* **Database:** PostgreSQL, Redis
* **AI Integration:** Google Gemini 1.5 Pro
* **Authentication:** NextAuth.js with Google/GitHub OAuth
* **Payments:** Stripe with webhook handling
* **Email:** Resend for notifications
* **Background Jobs:** Bull Queue with Redis
* **Export:** Puppeteer for PDF, Markdown generation
* **Deployment:** Vercel (configured)

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Redis server
- API keys for Google Gemini, Stripe, and Resend

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vibetoapp"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"

# AI Integration
GEMINI_API_KEY="your-gemini-api-key"

# Payment Processing
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# Email Service
RESEND_API_KEY="your-resend-api-key"

# Queue Processing
REDIS_URL="redis://localhost:6379"

# Export Cleanup
CRON_SECRET="your-cron-secret"
```

### 3. Database Setup
```bash
# Apply database migrations
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 4. Start Development Environment
```bash
# Terminal 1: Start main application
npm run dev

# Terminal 2: Start background workers
npm run worker

# Terminal 3: Start Redis (if local)
npm run redis
```

### 5. Access the Application
- **Main App:** http://localhost:3000
- **Database Studio:** `npx prisma studio`
- **Queue Monitor:** http://localhost:3000/api/admin/queues

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run worker` - Start background workers
- `npm run dev:all` - Start dev server + workers
- `npm run redis` - Start Redis server