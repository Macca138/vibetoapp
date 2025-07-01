# 🔐 Authentication Testing Checklist

## ✅ Test Plan
Your dev server is running at: http://localhost:3000

### 1. Test Authentication Pages Load
- [ ] **Landing Page**: http://localhost:3000
- [ ] **Sign In Page**: http://localhost:3000/auth/signin
- [ ] **Sign Up Page**: http://localhost:3000/auth/signup
- [ ] **Dashboard**: http://localhost:3000/dashboard (should redirect if not logged in)

### 2. Test Google OAuth Flow
- [ ] Visit: http://localhost:3000/auth/signin
- [ ] Click "Sign in with Google" button
- [ ] Should redirect to Google OAuth consent screen
- [ ] Authorize the app
- [ ] Should redirect back and log you in
- [ ] Check if user appears in Supabase User table

### 3. Test GitHub OAuth Flow
- [ ] Visit: http://localhost:3000/auth/signin  
- [ ] Click "Sign in with GitHub" button
- [ ] Should redirect to GitHub OAuth screen
- [ ] Authorize the app
- [ ] Should redirect back and log you in
- [ ] Check if user appears in Supabase User table

### 4. Test Email/Password Registration
- [ ] Visit: http://localhost:3000/auth/signup
- [ ] Fill in name, email, password
- [ ] Submit form
- [ ] Should show success message or redirect to dashboard
- [ ] Check if user appears in Supabase User table with passwordHash

### 5. Test Email/Password Login
- [ ] Sign out if logged in
- [ ] Visit: http://localhost:3000/auth/signin
- [ ] Use email/password from step 4
- [ ] Should log in successfully
- [ ] Should redirect to dashboard

### 6. Test Session Persistence
- [ ] While logged in, refresh the page
- [ ] Should remain logged in
- [ ] Check if session appears in Supabase Session table

### 7. Test Sign Out
- [ ] Find sign out button (likely in dashboard)
- [ ] Click sign out
- [ ] Should redirect to home page
- [ ] Should not be able to access protected pages

## 🔍 What to Look For

### ✅ Success Indicators:
- All pages load without errors
- OAuth redirects work smoothly
- Users are created in Supabase tables
- Sessions persist across page refreshes
- Sign out clears session

### ❌ Common Issues:
- **OAuth Redirect Mismatch**: Check redirect URIs in Google/GitHub settings
- **Environment Variables**: Restart server after adding OAuth keys
- **Database Connection**: Verify Supabase connection still works
- **CORS Issues**: Should be fine for localhost

## 🗄️ Verify in Supabase

After testing, check your Supabase dashboard tables:

1. **User Table**: Should have new users with:
   - ID, email, name
   - passwordHash (for email signup)
   - image (for OAuth users)

2. **Account Table**: Should have OAuth connections:
   - userId, provider (google/github)
   - providerAccountId, access_token

3. **Session Table**: Should have active sessions:
   - sessionToken, userId, expires

## 🚨 If Something Doesn't Work

### Common Fixes:
1. **Restart dev server**: `npm run dev`
2. **Check .env file**: Ensure no extra quotes or spaces
3. **Verify OAuth URLs**: Must match exactly in Google/GitHub settings
4. **Check browser console**: Look for JavaScript errors
5. **Check terminal**: Look for server errors

### Debug Commands:
```bash
# Test database connection
npx prisma studio

# Check environment variables are loaded
echo $GOOGLE_CLIENT_ID

# Restart with fresh cache
rm -rf .next && npm run dev
```