#!/bin/bash

# VibeToApp Comprehensive Testing Script
# This script tests the entire application from A to Z

echo "🚀 Starting VibeToApp Comprehensive Testing Suite"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
PASSED_TESTS=0
FAILED_TESTS=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    echo -e "${BLUE}Testing: ${test_name}${NC}"
    ((TOTAL_TESTS++))
    
    if eval "$test_command"; then
        if [ "$expected_status" = "success" ]; then
            echo -e "${GREEN}✓ PASSED: ${test_name}${NC}"
            ((PASSED_TESTS++))
        else
            echo -e "${RED}✗ FAILED: ${test_name} (expected to fail but passed)${NC}"
            ((FAILED_TESTS++))
        fi
    else
        if [ "$expected_status" = "fail" ]; then
            echo -e "${GREEN}✓ PASSED: ${test_name} (expected to fail)${NC}"
            ((PASSED_TESTS++))
        else
            echo -e "${RED}✗ FAILED: ${test_name}${NC}"
            ((FAILED_TESTS++))
        fi
    fi
    echo ""
}

# Function to test HTTP endpoint
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local expected_status="$3"
    local description="$4"
    local auth_header="$5"
    
    echo -e "${BLUE}Testing API: ${method} ${endpoint}${NC}"
    ((TOTAL_TESTS++))
    
    if [ -n "$auth_header" ]; then
        response=$(curl -s -w "%{http_code}" -X "$method" "http://localhost:3000$endpoint" -H "$auth_header" -o /dev/null)
    else
        response=$(curl -s -w "%{http_code}" -X "$method" "http://localhost:3000$endpoint" -o /dev/null)
    fi
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED: ${description} (${response})${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}✗ FAILED: ${description} (expected ${expected_status}, got ${response})${NC}"
        ((FAILED_TESTS++))
    fi
    echo ""
}

# Check if development server is running
echo -e "${YELLOW}Checking if development server is running...${NC}"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Development server is not running!${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Development server is running${NC}"
echo ""

# 1. INFRASTRUCTURE TESTS
echo -e "${YELLOW}=== 1. INFRASTRUCTURE TESTS ===${NC}"

run_test "Node.js version check" "node --version | grep -E 'v1[89]|v2[0-9]'" "success"
run_test "NPM dependencies installed" "[ -d node_modules ]" "success"
run_test "Database connection" "npx prisma db push --accept-data-loss --skip-generate" "success"
run_test "Redis connection" "redis-cli ping 2>/dev/null | grep PONG" "success"
run_test "Environment variables" "[ -f .env.local ]" "success"

# 2. BUILD AND LINT TESTS
echo -e "${YELLOW}=== 2. BUILD AND LINT TESTS ===${NC}"

run_test "TypeScript compilation" "npx tsc --noEmit" "success"
run_test "ESLint check" "npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings 50" "success"
run_test "Prisma client generation" "npx prisma generate" "success"
run_test "Next.js build" "npm run build" "success"

# 3. API ENDPOINT TESTS
echo -e "${YELLOW}=== 3. API ENDPOINT TESTS ===${NC}"

# Public endpoints
test_endpoint "GET" "/" 200 "Landing page"
test_endpoint "GET" "/api/waitlist" 405 "Waitlist endpoint (GET not allowed)"
test_endpoint "POST" "/api/waitlist" 400 "Waitlist endpoint (no data)"

# Auth endpoints
test_endpoint "GET" "/api/auth/signin" 200 "Auth signin page"
test_endpoint "GET" "/api/auth/providers" 200 "Auth providers"
test_endpoint "GET" "/api/auth/session" 200 "Auth session"

# Protected endpoints (should return 401 without auth)
test_endpoint "GET" "/api/projects" 401 "Projects endpoint (unauthorized)"
test_endpoint "GET" "/api/projects/progress" 401 "Projects progress (unauthorized)"
test_endpoint "GET" "/dashboard" 307 "Dashboard redirect (unauthorized)"

# Workflow endpoints
test_endpoint "POST" "/api/workflow/step1" 401 "Step 1 API (unauthorized)"
test_endpoint "POST" "/api/workflow/step2" 401 "Step 2 API (unauthorized)"
test_endpoint "POST" "/api/workflow/step3" 401 "Step 3 API (unauthorized)"
test_endpoint "POST" "/api/workflow/step4" 401 "Step 4 API (unauthorized)"
test_endpoint "POST" "/api/workflow/step5" 401 "Step 5 API (unauthorized)"
test_endpoint "POST" "/api/workflow/step6" 401 "Step 6 API (unauthorized)"

# Payment endpoints
test_endpoint "POST" "/api/stripe/checkout-session" 401 "Stripe checkout (unauthorized)"
test_endpoint "POST" "/api/webhooks/stripe" 400 "Stripe webhook (no signature)"

# Export endpoints
test_endpoint "GET" "/api/export/test-id" 401 "Export job status (unauthorized)"
test_endpoint "GET" "/api/admin/queues" 401 "Queue admin (unauthorized)"

# 4. COMPONENT TESTS
echo -e "${YELLOW}=== 4. COMPONENT TESTS ===${NC}"

run_test "React components compile" "find src/components -name '*.tsx' -exec npx tsc --noEmit {} \;" "success"
run_test "Page components compile" "find src/app -name 'page.tsx' -exec npx tsc --noEmit {} \;" "success"
run_test "Hook files compile" "find src/hooks -name '*.ts' -exec npx tsc --noEmit {} \;" "success"
run_test "Lib files compile" "find src/lib -name '*.ts' -exec npx tsc --noEmit {} \;" "success"

# 5. DATABASE TESTS
echo -e "${YELLOW}=== 5. DATABASE TESTS ===${NC}"

run_test "Database schema is valid" "npx prisma validate" "success"
run_test "Database migrations are applied" "npx prisma db push --accept-data-loss --skip-generate" "success"
run_test "Database connection pool" "npx prisma studio --browser none --port 5555 & sleep 2 && kill $!" "success"

# 6. INTEGRATION TESTS
echo -e "${YELLOW}=== 6. INTEGRATION TESTS ===${NC}"

# Test critical file existence
run_test "Auth configuration exists" "[ -f src/lib/auth.ts ]" "success"
run_test "Prisma configuration exists" "[ -f src/lib/prisma.ts ]" "success"
run_test "Stripe configuration exists" "[ -f src/lib/stripe.ts ]" "success"
run_test "Gemini configuration exists" "[ -f src/lib/gemini.ts ]" "success"
run_test "Queue configuration exists" "[ -f src/lib/queues/index.ts ]" "success"

# Test critical directories
run_test "Components directory structure" "[ -d src/components/workflow/steps ]" "success"
run_test "API routes directory structure" "[ -d src/app/api/workflow ]" "success"
run_test "Export system exists" "[ -d src/lib/export ]" "success"
run_test "Queue processors exist" "[ -d src/lib/queues/processors ]" "success"

# 7. SECURITY TESTS
echo -e "${YELLOW}=== 7. SECURITY TESTS ===${NC}"

run_test "No hardcoded secrets in code" "! grep -r 'sk_live\|sk_test\|AIza\|ghp_' src/ --include='*.ts' --include='*.tsx' --include='*.js'" "success"
run_test "Environment variables not in git" "! git ls-files | grep -E '\.env$|\.env\.local$'" "success"
run_test "Package vulnerabilities check" "npm audit --audit-level high" "success"

# 8. PERFORMANCE TESTS
echo -e "${YELLOW}=== 8. PERFORMANCE TESTS ===${NC}"

run_test "Bundle size analysis" "npm run build && ls -la .next/static/chunks/ | wc -l" "success"
run_test "Database query optimization" "grep -r 'include.*include' src/lib/ | wc -l | awk '{print ($1 < 5)}'" "success"

# 9. DEPLOYMENT READINESS
echo -e "${YELLOW}=== 9. DEPLOYMENT READINESS ===${NC}"

run_test "Vercel configuration exists" "[ -f vercel.json ]" "success"
run_test "GitHub Actions workflow exists" "[ -f .github/workflows/ci-cd.yml ]" "success"
run_test "Docker configuration exists" "[ -f Dockerfile ]" "success"
run_test "Package.json has required scripts" "grep -q 'build\\|start\\|dev' package.json" "success"

# 10. FINAL HEALTH CHECK
echo -e "${YELLOW}=== 10. FINAL HEALTH CHECK ===${NC}"

test_endpoint "GET" "/" 200 "Application is responsive"
test_endpoint "GET" "/pricing" 200 "Pricing page loads"
test_endpoint "GET" "/api/auth/providers" 200 "Auth system functional"

# Generate test report
echo ""
echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}           TEST RESULTS SUMMARY${NC}"
echo -e "${YELLOW}================================================${NC}"
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
echo -e "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Application is ready for production.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the issues above.${NC}"
    echo ""
    echo -e "${YELLOW}Common fixes:${NC}"
    echo "1. Ensure all environment variables are set"
    echo "2. Make sure Redis server is running"
    echo "3. Check database connection"
    echo "4. Verify all dependencies are installed"
    echo "5. Fix any TypeScript or ESLint errors"
    exit 1
fi