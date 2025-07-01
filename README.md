# VibeToApp - AI-Powered SaaS Idea Development Platform

This repository contains the codebase for VibeToApp, a SaaS application that guides users through a 9-step AI-powered workflow to transform app ideas into detailed specifications, manage projects, and export their work.

## 📚 Documentation

All project documentation is organized in the [`/docs`](./docs) folder:

- **[📋 Quick Start](./docs/README.md)** - Complete documentation index
- **[🔐 Authentication](./docs/auth/)** - OAuth setup, testing, and troubleshooting
- **[🗄️ Database](./docs/database/)** - Supabase configuration and migration guides
- **[🎨 UI/UX](./docs/ui/)** - Design decisions and visibility fixes
- **[🛠️ Development](./docs/development/)** - Implementation plan, specifications, and guides

## 🚀 Project Goal

To build a full-stack SaaS application that empowers users to transform their app ideas into detailed specifications with AI assistance, offering a streamlined development workflow and flexible monetization options.

## 🛠️ Planned Technologies

* **Frontend:** Next.js 14+, TypeScript, Tailwind CSS, Framer Motion
* **Backend:** Next.js API Routes, Prisma ORM
* **Database:** PostgreSQL, Redis
* **AI Integration:** Google Gemini 1.5 Pro
* **Authentication:** NextAuth.js
* **Payments:** Stripe
* **Email:** Resend
* **Background Jobs:** Bull Queue
* **Deployment:** Vercel

## ⚙️ Getting Started

As this project is in its initial phase, the following steps outline how to begin setting up the development environment as per the implementation plan:

### 1. Create a New Next.js Project

```bash
npx create-next-app@latest --typescript --eslint .
2. Install Project Dependencies
Bash

npm install
3. Initialize Git Repository
Bash

git init
git add .
git commit -m "Initial project setup"
4. Environment Variables
Create a .env file in the root of your project and populate it with the necessary environment variables. Refer to the .env.example file for a template once generated in later steps. You will need to obtain API keys for services like Google Gemini, Stripe, and Resend, and set up your database URL and NextAuth.js secret.

5. Start Development Server
Bash

npm run dev
The application will be accessible at http://localhost:3000 once the initial setup is complete.