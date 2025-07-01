# 🗄️ Database Documentation

This folder contains all database configuration and migration guides.

## 📄 Documents

### Getting Started
- [`database-options.md`](./database-options.md) - Compare Supabase vs Neon vs Local development

### Supabase Guides
- [`supabase-migration-guide.md`](./supabase-migration-guide.md) - Step-by-step migration from local to Supabase
- [`supabase-cli-setup.md`](./supabase-cli-setup.md) - Setting up Supabase CLI
- [`supabase-connection-fix.md`](./supabase-connection-fix.md) - Troubleshooting connection issues
- [`supabase-prisma-fix.md`](./supabase-prisma-fix.md) - Prisma integration with Supabase

## 🚀 Quick Setup

1. **Choose a database** → Read [`database-options.md`](./database-options.md)
2. **Migrate to cloud** → Follow [`supabase-migration-guide.md`](./supabase-migration-guide.md)
3. **Connection issues?** → Check [`supabase-connection-fix.md`](./supabase-connection-fix.md)

## 🔗 Connection Strings

### Supabase (Recommended)
```
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### Local Development
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/vibetoapp"
```