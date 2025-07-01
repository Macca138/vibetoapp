# OAuth Setup Guide - 100% FREE! 🆓

## 🔵 Google OAuth Setup (FREE)

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account
3. Click "Select a project" → "New Project"
4. Name it "VibeToApp" → Create

### Step 2: Enable Google+ API
1. In the left sidebar: "APIs & Services" → "Library"
2. Search for "Google+ API" or "People API"
3. Click it → "Enable"

### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: **External** (free)
   - App name: "VibeToApp"
   - User support email: your email
   - Developer contact: your email
   - Save and Continue through all steps
4. Back to "Create OAuth client ID":
   - Application type: **Web application**
   - Name: "VibeToApp Web Client"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Create

### Step 4: Copy Your Keys
- **Client ID**: Starts with something like `123456789-abc...googleusercontent.com`
- **Client Secret**: Random string like `GOCSPX-...`

---

## ⚫ GitHub OAuth Setup (FREE)

### Step 1: Go to GitHub Developer Settings
1. Visit: https://github.com/settings/developers
2. Click "OAuth Apps" → "New OAuth App"

### Step 2: Fill in App Details
- **Application name**: VibeToApp
- **Homepage URL**: `http://localhost:3000`
- **Application description**: AI-powered app idea development platform
- **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
- Click "Register application"

### Step 3: Generate Client Secret
1. After creation, you'll see your **Client ID**
2. Click "Generate a new client secret"
3. Copy both the **Client ID** and **Client Secret**

---

## 💰 Cost Breakdown

| Service | Free Tier | Cost for Your App |
|---------|-----------|-------------------|
| **Google OAuth** | 100,000 requests/day | $0.00 |
| **GitHub OAuth** | Unlimited for public apps | $0.00 |
| **Google+ API** | 1,000 requests/day | $0.00 |

### For VibeToApp Usage:
- **Expected OAuth calls**: ~10-50 per day (just for logins)
- **Total monthly cost**: **$0.00**
- **Free tier limits**: Will handle 1000s of users

---

## 🔧 Add to Your .env File

Once you have the keys, add them to `.env`:

```bash
# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="123456789-abcdefghijk.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"

# GitHub OAuth (from GitHub Developer Settings)
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

---

## 🚀 Production Setup (When You Deploy)

### For Vercel Deployment:
Replace localhost URLs with your production domain:

**Google:**
- Authorized redirect URI: `https://yourapp.vercel.app/api/auth/callback/google`

**GitHub:**
- Authorization callback URL: `https://yourapp.vercel.app/api/auth/callback/github`

### Tips:
1. **Keep Development Keys**: Create separate OAuth apps for dev/prod
2. **Environment Variables**: Add keys to Vercel environment variables
3. **Domain Verification**: Some providers require domain verification for production

---

## 🔒 Security Notes

- ✅ **Client ID**: Safe to expose (used in frontend)
- ❌ **Client Secret**: NEVER expose publicly
- ✅ **Redirect URIs**: Must match exactly
- ✅ **Your .env**: Already in .gitignore (secure)

---

## 🧪 Testing OAuth

After adding keys to `.env`:

1. Restart your dev server: `npm run dev`
2. Visit: `http://localhost:3000/auth/signin`
3. You should see Google and GitHub login buttons
4. Click to test the OAuth flow

The authentication will:
1. Redirect to Google/GitHub
2. User authorizes your app
3. Redirect back to your app
4. User is logged in and saved to Supabase!