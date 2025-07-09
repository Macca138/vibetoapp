#!/bin/bash

# Local Testing Script for VibeToApp
# This script helps automate local testing before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# Check if required services are running
check_services() {
    print_status "Checking required services..."
    
    # Check PostgreSQL
    if ! pg_isready -q 2>/dev/null; then
        print_error "PostgreSQL is not running. Please start PostgreSQL first."
        exit 1
    fi
    print_status "PostgreSQL is running ✓"
    
    # Check Redis
    if ! redis-cli ping > /dev/null 2>&1; then
        print_error "Redis is not running. Please start Redis first."
        exit 1
    fi
    print_status "Redis is running ✓"
    
    # Check environment variables
    if [ ! -f ".env.local" ]; then
        print_error ".env.local file not found. Please create it with required variables."
        exit 1
    fi
    print_status "Environment file found ✓"
}

# Check environment variables
check_env_vars() {
    print_status "Checking environment variables..."
    
    source .env.local
    
    required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "GEMINI_API_KEY"
        "STRIPE_SECRET_KEY"
        "RESEND_API_KEY"
        "REDIS_URL"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_status "All required environment variables are set ✓"
}

# Install dependencies
install_deps() {
    print_status "Installing dependencies..."
    npm ci
    print_status "Dependencies installed ✓"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Apply database schema
    npx prisma db push
    
    print_status "Database setup complete ✓"
}

# Run linting
run_lint() {
    print_status "Running ESLint..."
    npm run lint
    print_status "Linting passed ✓"
}

# Run type checking
run_type_check() {
    print_status "Running TypeScript type checking..."
    npx tsc --noEmit
    print_status "Type checking passed ✓"
}

# Build application
build_app() {
    print_status "Building application..."
    npm run build
    print_status "Build completed ✓"
}

# Test basic functionality
test_basic_functionality() {
    print_test "Testing basic functionality..."
    
    # Start the application in background
    npm run dev &
    APP_PID=$!
    
    # Wait for app to start
    sleep 10
    
    # Test if app is responding
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Application is responding ✓"
    else
        print_error "Application is not responding"
        kill $APP_PID
        exit 1
    fi
    
    # Test API endpoints
    if curl -f http://localhost:3000/api/auth/csrf > /dev/null 2>&1; then
        print_status "API endpoints are working ✓"
    else
        print_error "API endpoints are not working"
        kill $APP_PID
        exit 1
    fi
    
    # Kill the app
    kill $APP_PID
    wait $APP_PID 2>/dev/null || true
    
    print_status "Basic functionality test passed ✓"
}

# Test database connection
test_database() {
    print_test "Testing database connection..."
    
    # Test Prisma connection
    if npx prisma db execute --command="SELECT 1" > /dev/null 2>&1; then
        print_status "Database connection working ✓"
    else
        print_error "Database connection failed"
        exit 1
    fi
}

# Test Redis connection
test_redis() {
    print_test "Testing Redis connection..."
    
    if redis-cli set test_key "test_value" > /dev/null 2>&1; then
        redis-cli del test_key > /dev/null 2>&1
        print_status "Redis connection working ✓"
    else
        print_error "Redis connection failed"
        exit 1
    fi
}

# Manual testing instructions
show_manual_tests() {
    print_status "🧪 Manual Testing Instructions"
    echo ""
    echo "Please test the following manually:"
    echo ""
    echo "1. Start the application:"
    echo "   Terminal 1: npm run dev"
    echo "   Terminal 2: npm run worker"
    echo ""
    echo "2. Test Authentication:"
    echo "   - Visit http://localhost:3000"
    echo "   - Sign up with email/password"
    echo "   - Test Google OAuth"
    echo "   - Test GitHub OAuth"
    echo ""
    echo "3. Test Workflow (9 steps):"
    echo "   - Create a new project"
    echo "   - Go through all 9 workflow steps"
    echo "   - Verify auto-save works"
    echo "   - Test AI processing"
    echo ""
    echo "4. Test Payments:"
    echo "   - Set up Stripe webhook: stripe listen --forward-to localhost:3000/api/webhooks/stripe"
    echo "   - Test payment with card 4242 4242 4242 4242"
    echo "   - Verify project unlock"
    echo ""
    echo "5. Test Export:"
    echo "   - Complete workflow"
    echo "   - Test PDF export"
    echo "   - Test Markdown export"
    echo "   - Check email delivery"
    echo ""
    echo "6. Test Error Handling:"
    echo "   - Try invalid inputs"
    echo "   - Test network failures"
    echo "   - Test edge cases"
    echo ""
}

# Performance test
run_performance_test() {
    print_test "Running basic performance test..."
    
    # Build for production
    npm run build
    
    # Start production server
    npm start &
    PROD_PID=$!
    
    # Wait for server to start
    sleep 10
    
    # Simple performance test
    if command -v curl &> /dev/null; then
        start_time=$(date +%s%N)
        curl -s http://localhost:3000 > /dev/null
        end_time=$(date +%s%N)
        
        duration=$((($end_time - $start_time) / 1000000))
        echo "Response time: ${duration}ms"
        
        if [ $duration -lt 1000 ]; then
            print_status "Performance test passed ✓"
        else
            print_warning "Response time is slow (${duration}ms)"
        fi
    else
        print_warning "curl not found, skipping performance test"
    fi
    
    # Kill production server
    kill $PROD_PID
    wait $PROD_PID 2>/dev/null || true
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    
    cat > test-report.md << EOF
# Local Testing Report

**Date:** $(date)
**Status:** All automated tests passed ✓

## Automated Tests Results

- ✅ Services running (PostgreSQL, Redis)
- ✅ Environment variables configured
- ✅ Dependencies installed
- ✅ Database setup complete
- ✅ Linting passed
- ✅ Type checking passed
- ✅ Build successful
- ✅ Basic functionality test passed
- ✅ Database connection working
- ✅ Redis connection working

## Manual Testing Required

Please complete the manual testing checklist in:
\`docs/testing/local-testing-guide.md\`

## Next Steps

1. Complete manual testing
2. Fix any issues found
3. Run this script again
4. Proceed with production deployment

---
*Generated by test-local.sh*
EOF

    print_status "Test report generated: test-report.md"
}

# Main function
main() {
    print_status "🧪 Starting Local Testing Process..."
    
    check_services
    check_env_vars
    install_deps
    setup_database
    run_lint
    run_type_check
    build_app
    test_basic_functionality
    test_database
    test_redis
    
    if [ "$1" = "--performance" ]; then
        run_performance_test
    fi
    
    generate_report
    
    print_status "🎉 Automated tests completed successfully!"
    echo ""
    show_manual_tests
}

# Help function
show_help() {
    echo "Local Testing Script for VibeToApp"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --performance   Run performance tests"
    echo "  --help          Show this help message"
    echo ""
    echo "Prerequisites:"
    echo "  - PostgreSQL server running"
    echo "  - Redis server running"
    echo "  - .env.local file configured"
    echo ""
    echo "Examples:"
    echo "  $0                  # Run standard tests"
    echo "  $0 --performance    # Run tests with performance check"
}

# Parse arguments
case "$1" in
    --help)
        show_help
        exit 0
        ;;
    --performance)
        main --performance
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac