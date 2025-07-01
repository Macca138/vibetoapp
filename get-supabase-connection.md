# How to Get Your Supabase Connection String

## Steps:

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/mefjscvwsmbrmovmixex

2. **Click on the "Settings" icon** (gear icon in the left sidebar)

3. **Click on "Database"** in the settings menu

4. **Scroll to "Connection string" section**

5. **Find the "Connection pooling" card** and look for:
   - **Mode**: Select "Transaction"
   - **Copy** the complete connection string

6. **IMPORTANT**: The connection string from Supabase will have:
   - Your password already properly encoded
   - The correct pooler hostname (usually ends with .pooler.supabase.com)
   - Port 6543 (not 5432)
   - `?pgbouncer=true` at the end

## The string should look like:
```
postgresql://postgres.mefjscvwsmbrmovmixex:[encoded-password]@[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Copy and paste directly
Don't try to modify the password - Supabase provides it already encoded correctly!

Just copy the entire string and replace the DATABASE_URL value in your .env file.