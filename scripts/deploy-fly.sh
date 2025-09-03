#!/bin/bash

# Frontend Fly.io Deployment Script
set -e

APP_NAME="trading-frontend"
DEV_APP_NAME="trading-frontend-dev"
FLY_CONFIG="fly.toml"
DEV_FLY_CONFIG="fly.dev.toml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if fly CLI is installed
check_fly_cli() {
    if ! command -v fly &> /dev/null; then
        print_error "Fly CLI is not installed. Please install it first:"
        echo "curl -L https://fly.io/install.sh | sh"
        exit 1
    fi
}

# Function to check if user is logged in
check_fly_auth() {
    if ! fly auth whoami &> /dev/null; then
        print_error "You are not logged in to Fly.io. Please run:"
        echo "fly auth login"
        exit 1
    fi
}

deploy_production() {
    print_header "Deploying Frontend to Production"
    
    check_fly_cli
    check_fly_auth
    
    # Check if app exists
    if ! fly apps list | grep -q "$APP_NAME"; then
        print_status "Creating new Fly.io production app: $APP_NAME"
        fly apps create "$APP_NAME" --generate-name=false
    fi
    
    # Set production environment variables
    print_status "Setting production environment variables..."
    fly secrets set REACT_APP_API_URL="https://trading-backend.fly.dev" --config $FLY_CONFIG
    fly secrets set REACT_APP_PREDICTION_URL="https://trading-predict.fly.dev" --config $FLY_CONFIG
    
    # Deploy
    print_status "Deploying to production..."
    fly deploy --config $FLY_CONFIG
    
    print_status "Production deployment complete!"
    print_status "Frontend available at: https://$APP_NAME.fly.dev"
}

deploy_development() {
    print_header "Deploying Frontend to Development"
    
    check_fly_cli
    check_fly_auth
    
    # Check if app exists
    if ! fly apps list | grep -q "$DEV_APP_NAME"; then
        print_status "Creating new Fly.io development app: $DEV_APP_NAME"
        fly apps create "$DEV_APP_NAME" --generate-name=false
    fi
    
    # Set development environment variables
    print_status "Setting development environment variables..."
    fly secrets set REACT_APP_API_URL="https://trading-backend-dev.fly.dev" --config $DEV_FLY_CONFIG
    fly secrets set REACT_APP_PREDICTION_URL="https://trading-predict-dev.fly.dev" --config $DEV_FLY_CONFIG
    
    # Deploy
    print_status "Deploying to development..."
    fly deploy --config $DEV_FLY_CONFIG
    
    print_status "Development deployment complete!"
    print_status "Frontend available at: https://$DEV_APP_NAME.fly.dev"
}

show_status() {
    print_header "Frontend App Status"
    
    check_fly_cli
    check_fly_auth
    
    echo "Production Status:"
    fly status --config $FLY_CONFIG 2>/dev/null || echo "Production app not deployed"
    
    echo ""
    echo "Development Status:"
    fly status --config $DEV_FLY_CONFIG 2>/dev/null || echo "Development app not deployed"
}

show_logs() {
    local env=${1:-"dev"}
    
    print_header "Frontend App Logs"
    
    check_fly_cli
    check_fly_auth
    
    if [ "$env" = "prod" ] || [ "$env" = "production" ]; then
        fly logs --config $FLY_CONFIG
    else
        fly logs --config $DEV_FLY_CONFIG
    fi
}

show_help() {
    echo "Usage: $0 [prod|dev|status|logs] [env]"
    echo ""
    echo "Commands:"
    echo "  prod, production  - Deploy to production"
    echo "  dev, development  - Deploy to development"
    echo "  status            - Show app status"
    echo "  logs [env]        - Show logs (dev/prod)"
    echo ""
    echo "Examples:"
    echo "  $0 prod           - Deploy to production"
    echo "  $0 dev            - Deploy to development"
    echo "  $0 status         - Show status of both apps"
    echo "  $0 logs prod      - Show production logs"
    echo "  $0 logs dev       - Show development logs"
}

# Main script logic
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi
    
    local action=$1
    local env=$2
    
    case $action in
        "prod"|"production")
            deploy_production
            ;;
        "dev"|"development")
            deploy_development
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$env"
            ;;
        *)
            print_error "Invalid action: $action"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
