# 📚 VibeToApp Documentation

Welcome to the VibeToApp documentation! This folder contains all guides, specifications, and documentation for the project.

## 📁 Documentation Structure

### 🔐 [`/auth`](./auth/) - Authentication & Authorization
- [`auth-fix-summary.md`](./auth/auth-fix-summary.md) - NextAuth database session fixes
- [`auth-testing-checklist.md`](./auth/auth-testing-checklist.md) - Complete auth testing guide
- [`oauth-setup-guide.md`](./auth/oauth-setup-guide.md) - Google & GitHub OAuth setup
- [`debug-github-auth.md`](./auth/debug-github-auth.md) - GitHub OAuth troubleshooting

### 🗄️ [`/database`](./database/) - Database Configuration
- [`database-options.md`](./database/database-options.md) - Comparison of database hosting options
- [`supabase-migration-guide.md`](./database/supabase-migration-guide.md) - Moving to Supabase from local DB
- [`supabase-connection-fix.md`](./database/supabase-connection-fix.md) - Connection troubleshooting
- [`supabase-cli-setup.md`](./database/supabase-cli-setup.md) - Supabase CLI installation guide
- [`supabase-prisma-fix.md`](./database/supabase-prisma-fix.md) - Prisma + Supabase integration fixes

### 🎨 [`/ui`](./ui/) - UI/UX Documentation
- [`ui-strategy-guide.md`](./ui/ui-strategy-guide.md) - UI development strategy and timing
- [`ui-fixes-summary.md`](./ui/ui-fixes-summary.md) - Critical UI visibility fixes applied
- [`button-visibility-fixes.md`](./ui/button-visibility-fixes.md) - Button and form visibility solutions

### 🛠️ [`/development`](./development/) - Development Guides
- [`implementation_plan.md`](./development/implementation_plan.md) - Complete step-by-step implementation plan
- [`tech_specification_original.md`](./development/tech_specification_original.md) - Original technical specifications
- [`data_models_overview.md`](./development/data_models_overview.md) - Database schema and relationships
- [`workflow_step_prompts.md`](./development/workflow_step_prompts.md) - AI prompts for each workflow step
- [`env-management-guide.md`](./development/env-management-guide.md) - Managing .env files across devices

## 🚀 Quick Start Guides

### For New Developers
1. Start with [`implementation_plan.md`](./development/implementation_plan.md)
2. Set up your database using [`database-options.md`](./database/database-options.md)
3. Configure authentication with [`oauth-setup-guide.md`](./auth/oauth-setup-guide.md)
4. Review UI guidelines in [`ui-strategy-guide.md`](./ui/ui-strategy-guide.md)

### For Production Setup
1. [`supabase-migration-guide.md`](./database/supabase-migration-guide.md) - Set up cloud database
2. [`env-management-guide.md`](./development/env-management-guide.md) - Secure environment variables
3. [`auth-testing-checklist.md`](./auth/auth-testing-checklist.md) - Verify auth flows

### For Troubleshooting
- Auth issues → [`/auth`](./auth/) folder
- Database issues → [`/database`](./database/) folder  
- UI/visibility issues → [`/ui`](./ui/) folder

## 📋 Project Status

### ✅ Completed
- Steps 1-14: Core infrastructure, auth, and workflow UI
- Database migration to Supabase
- OAuth integration (Google & GitHub)
- Critical UI fixes for visibility

### 🚧 In Progress
- Step 15: Google Gemini AI integration
- Payment system (Stripe)
- Export functionality

### 📝 Documentation Standards

When adding new documentation:
1. Use descriptive filenames (kebab-case)
2. Add to appropriate subfolder
3. Update this README with the new file
4. Include clear headings and sections
5. Add code examples where relevant

## 🔗 External Resources

- [Supabase Dashboard](https://supabase.com/dashboard)
- [NextAuth Documentation](https://next-auth.js.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

Last updated: 2025-07-01