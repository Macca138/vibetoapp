# Supabase Migration Guide for VibeToApp

## Step 1: Create Supabase Project
1. Sign up at [supabase.com](https://supabase.com)
2. Create new project (choose region closest to you)
3. Save your project URL and anon key

## Step 2: Update Environment Variables
```bash
# Replace your current DATABASE_URL with:
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Add these new variables:
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

## Step 3: Update Prisma Configuration
No changes needed! Your existing Prisma schema works as-is.

## Step 4: Push Schema to Supabase
```bash
# Push your existing schema
npx prisma db push

# Generate fresh Prisma client
npx prisma generate
```

## Step 5: Update Redis Configuration
For Redis, you have options:
- **Upstash Redis**: Free tier, works great with Vercel
- **Railway Redis**: Simple setup, generous free tier
- **Keep local Redis**: For dev only, use cloud Redis in production

## Step 6: Test Your Application
```bash
npm run dev
```

## Additional Supabase Features to Consider

### 1. Realtime Updates (for workflow collaboration)
```typescript
// Example: Listen to workflow changes
const { data, error } = await supabase
  .from('WorkflowResponse')
  .on('UPDATE', payload => {
    console.log('Workflow updated!', payload)
  })
  .subscribe()
```

### 2. Storage for Exports
```typescript
// Store generated PDFs/documents
const { data, error } = await supabase.storage
  .from('exports')
  .upload(`${userId}/${projectId}/export.pdf`, pdfBuffer)
```

### 3. Edge Functions (Alternative to Bull Queue)
Consider Supabase Edge Functions for AI processing instead of Bull Queue:
- No Redis needed
- Scales automatically
- Built-in retry logic

## Migration Checklist
- [ ] Create Supabase project
- [ ] Update .env file
- [ ] Push schema with `npx prisma db push`
- [ ] Test authentication flow
- [ ] Test project creation
- [ ] Test workflow saving
- [ ] Consider Redis alternatives

## Rollback Plan
If you need to switch back to local:
1. Export data: `pg_dump [SUPABASE_URL] > backup.sql`
2. Import locally: `psql [LOCAL_DB] < backup.sql`
3. Update .env back to local DATABASE_URL