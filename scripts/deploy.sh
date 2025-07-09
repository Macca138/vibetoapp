#!/bin/bash

# VibeToApp Deployment Script
# This script helps automate the deployment process

set -e

echo "🚀 Starting VibeToApp Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git"
        exit 1
    fi
    
    print_status "All dependencies found ✓"
}

# Install project dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    npm ci
    print_status "Dependencies installed ✓"
}

# Run linting
run_lint() {
    print_status "Running ESLint..."
    npm run lint
    print_status "Linting completed ✓"
}

# Type checking
type_check() {
    print_status "Running TypeScript type checking..."
    npx tsc --noEmit
    print_status "Type checking completed ✓"
}

# Generate Prisma client
generate_prisma() {
    print_status "Generating Prisma client..."
    npx prisma generate
    print_status "Prisma client generated ✓"
}

# Build the application
build_app() {
    print_status "Building application..."
    npm run build
    print_status "Build completed ✓"
}

# Run tests (if they exist)
run_tests() {
    if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
        print_status "Running tests..."
        npm test
        print_status "Tests completed ✓"
    else
        print_warning "No tests found, skipping..."
    fi
}

# Check environment variables
check_env() {
    print_status "Checking environment variables..."
    
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
        print_warning "Please set these variables in your deployment environment"
        return 1
    else
        print_status "All required environment variables are set ✓"
    fi
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy to production
    vercel --prod
    print_status "Deployment completed ✓"
}

# Main deployment function
main() {
    print_status "Starting deployment process..."
    
    check_dependencies
    install_dependencies
    run_lint
    type_check
    generate_prisma
    build_app
    run_tests
    
    # Only check env vars if deploying
    if [ "$1" = "--deploy" ]; then
        check_env
        deploy_vercel
    else
        print_status "Build completed successfully!"
        print_warning "To deploy, run: $0 --deploy"
    fi
    
    print_status "🎉 Process completed successfully!"
}

# Help function
show_help() {
    echo "VibeToApp Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --deploy    Deploy to Vercel after successful build"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Build and test only"
    echo "  $0 --deploy     # Build, test, and deploy"
}

# Parse command line arguments
case "$1" in
    --help)
        show_help
        exit 0
        ;;
    --deploy)
        main --deploy
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