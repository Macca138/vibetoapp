# Supabase + Prisma Connection Fix

## The Issue
Prisma db push is timing out with the pooler connection. This is a known issue with Supabase.

## Solution Options

### Option 1: Use Supabase CLI (Recommended)
Instead of using the connection string, use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref mefjscvwsmbrmovmixex

# Push schema using migrations
npx prisma migrate dev --name init
```

### Option 2: Get Direct Connection String
1. Go to Supabase Dashboard
2. Settings → Database
3. Look for "Connection string" (NOT pooling)
4. Find the **Direct connection** string
5. It might require whitelisting your IP address

### Option 3: Use Supabase SQL Editor
1. Generate the SQL from Prisma:
   ```bash
   npx prisma migrate dev --create-only --name init
   ```
2. Copy the generated SQL from `prisma/migrations/*/migration.sql`
3. Paste and run in Supabase SQL Editor

### Option 4: Try IPv6 Connection
Sometimes IPv4 is blocked. Try adding this to your connection string:
```
?host=db.mefjscvwsmbrmovmixex.supabase.co&sslmode=require
```

## For Now - Quick Fix
Let's generate the SQL and run it directly in Supabase:

```bash
# Generate migration SQL
npx prisma migrate dev --create-only --name init

# This creates a file in prisma/migrations/
# Copy that SQL and run it in Supabase SQL Editor
```