# Supabase CLI Setup Guide

## Method 1: Get Access Token (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/account/tokens

2. **Generate Access Token**
   - Click "Generate new token"
   - Give it a name like "CLI Access"
   - Copy the token

3. **Add to your .env file**
   ```bash
   SUPABASE_ACCESS_TOKEN="your-token-here"
   ```

4. **Link your project**
   ```bash
   npx supabase link --project-ref mefjscvwsmbrmovmixex
   ```

5. **Push your schema**
   ```bash
   npx supabase db push
   ```

## Method 2: Use Prisma with Better Connection

Since you already have the connection working (it was just timing out), let's try:

1. **Update .env for direct connection**
   - Go to Supabase → Settings → Database
   - Find "Connection string" → "Direct connection"
   - This might require IP whitelisting

2. **Try with session mode pooler**
   ```
   DATABASE_URL="postgresql://postgres.mefjscvwsmbrmovmixex:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
   ```

## Method 3: Alternative - Use Prisma Migrate

```bash
# Create migration files (this works offline)
npx prisma migrate dev --name init --create-only

# Then manually copy the SQL from prisma/migrations/ to Supabase SQL Editor
```

## Quick Commands Reference

```bash
# Check if linked
npx supabase status

# Pull existing schema (if any tables exist)
npx supabase db pull

# Push local schema to remote
npx supabase db push

# Reset remote database and push
npx supabase db reset --linked
```