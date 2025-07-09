# Local Testing Guide

## 🧪 **Complete Local Testing Process**

### **Prerequisites**
- Node.js 18+
- PostgreSQL database running
- Redis server running
- All required API keys

### **1. Environment Setup**

#### **Check Current Environment**
```bash
# Verify Node.js version
node --version  # Should be 18+

# Check if PostgreSQL is running
psql --version

# Check if Redis is running
redis-cli ping  # Should return PONG
```

#### **Install Dependencies**
```bash
npm install
```

#### **Environment Variables**
Create `.env.local` with your development values:
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vibetoapp_dev"

# Authentication
NEXTAUTH_SECRET="your-dev-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (use development apps)
GOOGLE_CLIENT_ID="your-dev-google-client-id"
GOOGLE_CLIENT_SECRET="your-dev-google-client-secret"
GITHUB_ID="your-dev-github-id"
GITHUB_SECRET="your-dev-github-secret"

# AI Integration
GEMINI_API_KEY="your-gemini-api-key"

# Stripe (use test keys)
STRIPE_SECRET_KEY="sk_test_your-stripe-test-key"
STRIPE_WEBHOOK_SECRET="whsec_your-test-webhook-secret"

# Email (use test domain)
RESEND_API_KEY="your-resend-api-key"

# Redis
REDIS_URL="redis://localhost:6379"

# Cron
CRON_SECRET="test-cron-secret"
```

### **2. Database Setup**

#### **Initialize Database**
```bash
# Generate Prisma client
npx prisma generate

# Apply database schema
npx prisma db push

# Optional: View database
npx prisma studio
```

#### **Seed Test Data (Optional)**
```bash
# Create test user and project
npm run seed  # If you have a seed script
```

### **3. Start Services**

#### **Terminal 1: Main Application**
```bash
npm run dev
```

#### **Terminal 2: Background Workers**
```bash
npm run worker
```

#### **Terminal 3: Redis Server (if local)**
```bash
redis-server
# OR
npm run redis
```

### **4. Feature Testing Checklist**

#### **🔐 Authentication Testing**
- [ ] Navigate to `http://localhost:3000`
- [ ] Click "Sign Up" and create account with email/password
- [ ] Verify email verification flow (check console logs)
- [ ] Test Google OAuth login
- [ ] Test GitHub OAuth login
- [ ] Test logout functionality
- [ ] Verify session persistence

#### **📊 Dashboard Testing**
- [ ] Access dashboard at `/dashboard`
- [ ] Create new project
- [ ] View project list
- [ ] Edit project details
- [ ] Delete project (if implemented)

#### **🔄 Workflow Testing**
Test each workflow step:
- [ ] Step 1: Describe Your Idea
- [ ] Step 2: Define Core Purpose
- [ ] Step 3: Identify Target Users
- [ ] Step 4: Feature Discovery
- [ ] Step 5: User Flow Mapping
- [ ] Step 6: Technical Architecture
- [ ] Step 7: Revenue Model
- [ ] Step 8: MVP Definition
- [ ] Step 9: Export & Execute

For each step:
- [ ] Form saves automatically
- [ ] AI processing works
- [ ] Data flows to next step
- [ ] Navigation works correctly
- [ ] Progress tracking updates

#### **💳 Payment Testing**
Set up Stripe test mode:
```bash
# Install Stripe CLI
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Test scenarios:
- [ ] Access payment page
- [ ] Test successful payment (use test card: 4242 4242 4242 4242)
- [ ] Test failed payment (use test card: 4000 0000 0000 0002)
- [ ] Verify webhook handling
- [ ] Check project unlock after payment
- [ ] Test subscription flow (if implemented)

#### **📄 Export Testing**
- [ ] Complete workflow to step 9
- [ ] Test PDF export generation
- [ ] Test Markdown export generation
- [ ] Verify file download works
- [ ] Check email delivery (check logs)
- [ ] Test export job queue processing

#### **🔧 Error Handling Testing**
- [ ] Test invalid form submissions
- [ ] Test network failures (disable internet briefly)
- [ ] Test database connection loss
- [ ] Test Redis connection loss
- [ ] Test API rate limiting
- [ ] Test invalid API keys

### **5. Performance Testing**

#### **Basic Performance Checks**
```bash
# Build for production
npm run build

# Start production server
npm start

# Test performance
npm run lighthouse  # If you have lighthouse configured
```

#### **Load Testing (Basic)**
```bash
# Install artillery for load testing
npm install -g artillery

# Create simple load test
artillery quick --count 10 --num 3 http://localhost:3000
```

### **6. Common Issues & Solutions**

#### **Database Connection Issues**
```bash
# Check PostgreSQL is running
pg_isready

# Reset database
npx prisma db push --force-reset
```

#### **Redis Connection Issues**
```bash
# Check Redis is running
redis-cli ping

# Start Redis
redis-server
```

#### **Build Errors**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### **TypeScript Errors**
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Generate Prisma client
npx prisma generate
```

### **7. Testing Automation**

#### **Run All Tests**
```bash
# Lint code
npm run lint

# Type check
npx tsc --noEmit

# Run tests (if implemented)
npm test

# Build application
npm run build
```

#### **Pre-deployment Script**
```bash
# Use the deployment script for testing
./scripts/deploy.sh
```

### **8. Production Simulation**

#### **Test with Production-like Environment**
```bash
# Set NODE_ENV to production
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

#### **Test with Production Database**
Create a staging database and test with production-like data volume.

### **9. Security Testing**

#### **Basic Security Checks**
- [ ] Test SQL injection on forms
- [ ] Test XSS vulnerabilities
- [ ] Verify CSRF protection
- [ ] Test authentication bypass attempts
- [ ] Check environment variable exposure
- [ ] Test file upload security (if applicable)

### **10. Mobile Testing**

#### **Responsive Design**
- [ ] Test on mobile viewport (DevTools)
- [ ] Test on tablet viewport
- [ ] Test touch interactions
- [ ] Test mobile payment flow

### **11. Browser Compatibility**

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### **12. Documentation**

#### **Test Documentation**
- [ ] Follow setup instructions as new developer
- [ ] Verify all environment variables are documented
- [ ] Test deployment guide accuracy
- [ ] Check API documentation (if exists)

---

## 🎯 **Ready for Deployment Checklist**

Only proceed to deployment when:
- [ ] All features tested locally
- [ ] No critical bugs found
- [ ] Performance is acceptable
- [ ] Security checks passed
- [ ] Documentation is complete
- [ ] Environment variables are secured

**Next Step:** Once local testing is complete, proceed with production database setup and Vercel deployment.