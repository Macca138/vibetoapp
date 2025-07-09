# Vercel Deployment Setup Guide

## 🚀 **Step-by-Step Deployment Process**

### **1. Prerequisites**
- GitHub repository with your code
- Vercel account (free tier available)
- Production database (PostgreSQL)
- Production Redis instance
- All required API keys

### **2. Database Setup (Choose One)**

#### **Option A: Supabase (Recommended)**
```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Get connection string from Settings > Database
# 4. Connection string format:
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

#### **Option B: PlanetScale**
```bash
# 1. Go to https://planetscale.com
# 2. Create new database
# 3. Create production branch
# 4. Get connection string
```

#### **Option C: Railway**
```bash
# 1. Go to https://railway.app
# 2. Create PostgreSQL service
# 3. Get connection URL from service
```

### **3. Redis Setup**

#### **Upstash Redis (Recommended)**
```bash
# 1. Go to https://upstash.com
# 2. Create Redis database
# 3. Get Redis URL
REDIS_URL="redis://default:[PASSWORD]@[HOST]:6379"
```

### **4. Vercel Project Setup**

#### **Step 1: Connect Repository**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Select your GitHub repository
4. Click "Import"

#### **Step 2: Configure Build Settings**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

#### **Step 3: Environment Variables**
Add these in Vercel Dashboard > Settings > Environment Variables:

**Database:**
- `DATABASE_URL`: Your PostgreSQL connection string

**Authentication:**
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your Vercel domain (e.g., `https://vibetoapp.vercel.app`)

**OAuth Providers:**
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GITHUB_ID`: GitHub OAuth app ID
- `GITHUB_SECRET`: GitHub OAuth app secret

**AI Integration:**
- `GEMINI_API_KEY`: Google Gemini API key

**Payment Processing:**
- `STRIPE_SECRET_KEY`: Stripe secret key (use live key for production)
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

**Email Service:**
- `RESEND_API_KEY`: Resend API key

**Queue Processing:**
- `REDIS_URL`: Redis connection string

**Cron Jobs:**
- `CRON_SECRET`: Random secret for cron endpoint security

### **5. OAuth Provider Configuration**

#### **Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`

#### **GitHub OAuth:**
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Edit your OAuth App
3. Set Authorization callback URL: `https://your-domain.vercel.app/api/auth/callback/github`

### **6. Stripe Webhook Configuration**
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### **7. Database Migration**
```bash
# After deployment, run database migration
npx prisma db push --accept-data-loss
```

### **8. GitHub Actions Setup**

#### **Required Secrets:**
Add these in GitHub Settings > Secrets and variables > Actions:

- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

#### **Get Vercel Credentials:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Get project details
vercel env ls
```

### **9. Custom Domain (Optional)**
1. Go to Vercel Dashboard > Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain

### **10. Monitoring and Logs**
1. **Vercel Dashboard**: Real-time logs and metrics
2. **Function Logs**: Monitor API route performance
3. **Analytics**: Enable Vercel Analytics for insights

## 🔧 **Post-Deployment Checklist**

- [ ] All environment variables set
- [ ] Database connected and migrated
- [ ] OAuth providers configured
- [ ] Stripe webhooks working
- [ ] Email service functional
- [ ] Redis queue processing
- [ ] Cron jobs scheduled
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] All features tested in production

## 🚨 **Common Issues and Solutions**

### **Build Errors:**
- Ensure all dependencies are in `package.json`
- Check TypeScript compilation: `npx tsc --noEmit`
- Verify Prisma client generation: `npx prisma generate`

### **Database Connection Issues:**
- Check connection string format
- Verify database is accessible from internet
- Ensure SSL is enabled for production databases

### **Authentication Problems:**
- Verify OAuth redirect URLs are correct
- Check `NEXTAUTH_URL` matches your domain
- Ensure `NEXTAUTH_SECRET` is set and secure

### **API Timeouts:**
- Increase function timeout in `vercel.json`
- Optimize database queries
- Consider using background jobs for long tasks

## 📈 **Performance Optimization**

### **Next.js Optimizations:**
- Enable image optimization
- Use dynamic imports for heavy components
- Implement proper caching strategies

### **Database Optimizations:**
- Add database indexes for frequently queried fields
- Use connection pooling
- Implement read replicas for high traffic

### **Monitoring:**
- Set up error tracking (Sentry)
- Monitor Core Web Vitals
- Track API response times

## 🔐 **Security Checklist**

- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] Database access restricted
- [ ] API rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Webhook signatures verified
- [ ] Authentication tokens secure
- [ ] Error messages don't expose sensitive data

---

**Next Steps:** After successful deployment, proceed to testing and monitoring setup.