# Supabase Connection Troubleshooting

## Try These Connection Strings

### Option 1: Direct Connection (Port 5432)
```
DATABASE_URL="postgresql://postgres:[password]@db.mefjscvwsmbrmovmixex.supabase.co:5432/postgres"
```

### Option 2: Pooler Connection (Port 6543) - Recommended
```
DATABASE_URL="postgresql://postgres:[password]@db.mefjscvwsmbrmovmixex.supabase.co:6543/postgres?pgbouncer=true"
```

### Option 3: With SSL Mode
```
DATABASE_URL="postgresql://postgres:[password]@db.mefjscvwsmbrmovmixex.supabase.co:5432/postgres?sslmode=require"
```

## How to Get the Correct Connection String

1. Go to your Supabase Dashboard
2. Click on "Settings" (gear icon)
3. Navigate to "Database"
4. Look for "Connection string" section
5. Copy the "URI" under either:
   - **Session mode** (for direct connections)
   - **Transaction mode** (for serverless/Vercel - recommended)

## For Prisma Specifically

Supabase recommends using the **Transaction mode** pooler for Prisma:
1. Use port `6543` instead of `5432`
2. Add `?pgbouncer=true` to the connection string
3. You might also need to add `&connection_limit=1`

## Update your .env

Replace your DATABASE_URL with the connection string from Supabase dashboard. Make sure to:
- Keep the quotes around the entire URL
- Don't modify the password if it has special characters - Supabase provides it already encoded