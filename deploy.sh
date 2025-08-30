#!/bin/bash

# Unified Deployment Script for algo_webapp
# This script manages both development and production environments
# Similar to the backend's unified deployment script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="algo_webapp"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Show usage
show_usage() {
    echo "Usage: $0 {dev|prod} {start|stop|status|logs|restart|health|cleanup}"
    echo ""
    echo "Environments:"
    echo "  dev   - Development environment"
    echo "  prod  - Production environment"
    echo ""
    echo "Commands:"
    echo "  start    - Start services"
    echo "  stop     - Stop services"
    echo "  status   - Show service status"
    echo "  logs     - Show service logs"
    echo "  restart  - Restart services"
    echo "  health   - Check service health"
    echo "  cleanup  - Clean up resources"
    echo ""
    echo "Examples:"
    echo "  $0 dev start      - Start development environment"
    echo "  $0 prod deploy    - Deploy to production"
    echo "  $0 dev status     - Show development status"
    echo "  $0 prod logs      - Show production logs"
}

# Check if environment is specified
if [ $# -lt 2 ]; then
    show_usage
    exit 1
fi

ENVIRONMENT=$1
COMMAND=$2

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    error "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: dev, prod"
    exit 1
fi

# Validate command
VALID_COMMANDS=("start" "stop" "status" "logs" "restart" "health" "cleanup" "deploy")
if [[ ! " ${VALID_COMMANDS[@]} " =~ " ${COMMAND} " ]]; then
    error "Invalid command: $COMMAND"
    echo "Valid commands: ${VALID_COMMANDS[*]}"
    exit 1
fi

# Set environment-specific variables
if [ "$ENVIRONMENT" = "dev" ]; then
    CONFIG_DIR="config/development"
    DEPLOY_SCRIPT="deploy-development.sh"
    ENV_FILE="env.development"
    DOCKER_COMPOSE_FILE="docker-compose.development.yml"
    BRANCH="development"
    PORT=3000
else
    CONFIG_DIR="config/production"
    DEPLOY_SCRIPT="deploy-production.sh"
    ENV_FILE="env.production"
    DOCKER_COMPOSE_FILE="docker-compose.production.yml"
    BRANCH="production"
    PORT=3000
fi

# Check if configuration directory exists
if [ ! -d "$CONFIG_DIR" ]; then
    error "Configuration directory not found: $CONFIG_DIR"
    exit 1
fi

# Check if deployment script exists
if [ ! -f "$DEPLOY_SCRIPT" ]; then
    error "Deployment script not found: $DEPLOY_SCRIPT"
    exit 1
fi

# Check if we're on the correct branch
check_branch() {
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "$BRANCH" ]; then
        warn "You are on branch: $current_branch"
        warn "Expected branch for $ENVIRONMENT: $BRANCH"
        warn "Consider switching to the correct branch: git checkout $BRANCH"
    fi
}

# Execute command based on environment and command
case "$COMMAND" in
    "start")
        log "Starting $ENVIRONMENT environment..."
        check_branch
        if [ "$ENVIRONMENT" = "dev" ]; then
            ./$DEPLOY_SCRIPT deploy
        else
            ./$DEPLOY_SCRIPT deploy
        fi
        ;;
    "deploy")
        if [ "$ENVIRONMENT" = "prod" ]; then
            log "Deploying to production..."
            check_branch
            ./$DEPLOY_SCRIPT deploy
        else
            log "Deploying development environment..."
            check_branch
            ./$DEPLOY_SCRIPT deploy
        fi
        ;;
    "stop")
        log "Stopping $ENVIRONMENT environment..."
        ./$DEPLOY_SCRIPT stop
        ;;
    "status")
        log "Showing $ENVIRONMENT environment status..."
        ./$DEPLOY_SCRIPT status
        ;;
    "logs")
        log "Showing $ENVIRONMENT environment logs..."
        ./$DEPLOY_SCRIPT logs
        ;;
    "restart")
        log "Restarting $ENVIRONMENT environment..."
        ./$DEPLOY_SCRIPT restart
        ;;
    "health")
        log "Checking $ENVIRONMENT environment health..."
        ./$DEPLOY_SCRIPT health
        ;;
    "cleanup")
        log "Cleaning up $ENVIRONMENT environment..."
        ./$DEPLOY_SCRIPT cleanup
        ;;
    *)
        error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac

# Show completion message
case "$COMMAND" in
    "start"|"deploy")
        log "$ENVIRONMENT environment $COMMAND completed successfully!"
        echo ""
        echo "Access URLs:"
        if [ "$ENVIRONMENT" = "dev" ]; then
            echo "Frontend: http://localhost:$PORT"
            echo "Mock Backend: http://localhost:3003"
            echo "Prometheus: http://localhost:9091"
            echo "Grafana: http://localhost:3004"
        else
            echo "Frontend: http://localhost:$PORT"
            echo "Backend: http://localhost:3003"
            echo "Monitoring: http://localhost:9090 (Prometheus)"
            echo "Dashboard: http://localhost:3003 (Grafana)"
        fi
        ;;
    "stop"|"cleanup")
        log "$ENVIRONMENT environment $COMMAND completed successfully!"
        ;;
    *)
        log "$ENVIRONMENT environment $COMMAND completed successfully!"
        ;;
esac 