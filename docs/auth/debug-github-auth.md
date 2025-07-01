# 🔍 GitHub OAuth Debug Guide

## ✅ **Issue Found & Fixed**

**Problem**: GitHub environment variables mismatch
- `.env` uses: `GITHUB_ID` and `GITHUB_SECRET`
- NextAuth config was looking for: `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

**Fix Applied**: Updated `src/lib/auth.ts` to use the correct env variable names.

## 🧪 **Testing Steps**

### 1. Restart Your Dev Server
**IMPORTANT**: You must restart for environment variable changes to take effect:
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Test GitHub Button
1. Go to: http://localhost:3000/auth/signin
2. Click "Continue with GitHub"
3. Should now redirect to GitHub OAuth page

### 3. Check Browser Console
If still not working, open browser console (F12) and look for:
- JavaScript errors
- Network requests to `/api/auth/signin/github`
- Any error messages

### 4. Check Server Terminal
Watch your terminal for any error messages when clicking the GitHub button.

## 🔍 **Potential Issues & Solutions**

### Issue 1: Environment Variables Not Loading
**Symptom**: Button click does nothing, no console errors
**Solution**: 
```bash
# Restart dev server
npm run dev

# Verify env vars are loaded by temporarily adding to auth.ts:
console.log('GitHub ID:', process.env.GITHUB_ID);
```

### Issue 2: GitHub App Configuration
**Symptom**: Redirects to GitHub but shows error
**Check**: 
- GitHub App redirect URI: `http://localhost:3000/api/auth/callback/github`
- GitHub App is active and not suspended

### Issue 3: Browser Cache
**Symptom**: Inconsistent behavior
**Solution**: Hard refresh (Ctrl+F5 or Cmd+Shift+R)

### Issue 4: Network/Firewall
**Symptom**: No redirect happens
**Check**: Browser console for blocked requests

## 🔧 **Debug Commands**

### Test NextAuth Providers Endpoint
```bash
curl http://localhost:3000/api/auth/providers
```
Should return GitHub in the list.

### Test GitHub OAuth Redirect
```bash
curl -I http://localhost:3000/api/auth/signin/github
```
Should return a 302 redirect.

## 🚨 **If Still Not Working**

1. **Check GitHub App Settings**:
   - Go to: https://github.com/settings/developers
   - Verify your OAuth app is active
   - Check redirect URI matches exactly: `http://localhost:3000/api/auth/callback/github`

2. **Verify Credentials**:
   - Copy Client ID from GitHub (should match GITHUB_ID in .env)
   - Generate new Client Secret if needed

3. **Check Browser Console**: Look for any JavaScript errors

4. **Try Google OAuth**: If Google works but GitHub doesn't, it's likely a GitHub-specific config issue

## ✅ **Expected Working Flow**

1. Click "Continue with GitHub"
2. Button shows loading spinner
3. Redirects to GitHub OAuth page
4. User authorizes app
5. Redirects back to dashboard
6. User is signed in

Most likely the environment variable fix will resolve the issue - just make sure to restart your dev server!