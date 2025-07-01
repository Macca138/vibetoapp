# 🛠️ Development Documentation

This folder contains core development guides, specifications, and implementation plans.

## 📄 Core Documents

### Planning & Implementation
- [`implementation_plan.md`](./implementation_plan.md) - **START HERE** - Complete 26-step implementation guide
- [`tech_specification_original.md`](./tech_specification_original.md) - Original technical requirements and architecture

### Data & Architecture
- [`data_models_overview.md`](./data_models_overview.md) - Database schema, relationships, and model details
- [`workflow_step_prompts.md`](./workflow_step_prompts.md) - AI prompts for each of the 9 workflow steps

### Development Practices
- [`env-management-guide.md`](./env-management-guide.md) - Managing .env files across multiple devices

## 📊 Implementation Progress

### ✅ Completed (Steps 1-14)
- Core infrastructure (Next.js, Tailwind, Prisma)
- Authentication (NextAuth with OAuth)
- Database setup (PostgreSQL → Supabase)
- Project management system
- Landing page & waitlist
- Workflow UI (9 steps)

### 🚧 Next Priority
- **Step 15**: Google Gemini AI integration
- **Steps 16-17**: AI-powered workflow steps
- **Steps 21-22**: Stripe payment integration

### 📝 Future Steps
- Export functionality (PDF/Markdown)
- CI/CD pipeline
- Advanced features

## 🔑 Key Files Quick Reference

1. **Starting a new feature?** → Check implementation step in [`implementation_plan.md`](./implementation_plan.md)
2. **Need database schema?** → See [`data_models_overview.md`](./data_models_overview.md)
3. **Working on workflow?** → Use prompts from [`workflow_step_prompts.md`](./workflow_step_prompts.md)
4. **Setting up new device?** → Follow [`env-management-guide.md`](./env-management-guide.md)