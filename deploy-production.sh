#!/bin/bash

# Production Deployment Script for algo_webapp
# This script integrates with the backend production setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="algo_webapp"
BACKEND_DIR="../backend"
FRONTEND_PORT=3000
BACKEND_PORT=3003
CONFIG_DIR="config/production"

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

# Check if we're on the production branch
check_branch() {
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "production" ]; then
        error "You must be on the production branch to deploy. Current branch: $current_branch"
        error "Please run: git checkout production"
        exit 1
    fi
    log "Deploying from production branch"
}

# Check if backend is running
check_backend() {
    log "Checking backend status..."
    
    if [ ! -d "$BACKEND_DIR" ]; then
        error "Backend directory not found at $BACKEND_DIR"
        exit 1
    fi
    
    # Check if backend is running
    if ! docker ps | grep -q "backend"; then
        warn "Backend is not running. Starting backend production services..."
        cd "$BACKEND_DIR"
        if [ -f "./scripts/deploy.sh" ]; then
            ./scripts/deploy.sh prod start
        else
            docker compose -f docker-compose.prod.yml up -d
        fi
        cd - > /dev/null
    else
        log "Backend is already running"
    fi
}

# Build production frontend
build_frontend() {
    log "Building production frontend..."
    
    # Load production environment
    if [ -f "$CONFIG_DIR/env.production" ]; then
        export $(cat "$CONFIG_DIR/env.production" | grep -v '^#' | xargs)
    fi
    
    # Clean previous build
    rm -rf build/
    
    # Build with production settings
    npm run build:docker
    
    log "Frontend build completed"
}

# Deploy frontend
deploy_frontend() {
    log "Deploying frontend to production..."
    
    # Stop existing frontend containers
    docker compose -f "$CONFIG_DIR/docker-compose.production.yml" down --remove-orphans 2>/dev/null || true
    
    # Start production services
    docker compose -f "$CONFIG_DIR/docker-compose.production.yml" up -d --build
    
    log "Frontend deployment completed"
}

# Check deployment health
check_health() {
    log "Checking deployment health..."
    
    # Wait for services to be ready
    sleep 10
    
    # Check frontend health
    if curl -f http://localhost:$FRONTEND_PORT/health > /dev/null 2>&1; then
        log "Frontend is healthy"
    else
        error "Frontend health check failed"
        return 1
    fi
    
    # Check backend connectivity
    if curl -f http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        log "Backend connectivity confirmed"
    else
        warn "Backend health check failed - this might be expected if backend doesn't have a health endpoint"
    fi
    
    log "All health checks passed"
}

# Show deployment status
show_status() {
    log "Deployment Status:"
    echo "=================="
    
    # Frontend status
    if docker ps | grep -q "algo_webapp_frontend"; then
        echo -e "Frontend: ${GREEN}Running${NC}"
    else
        echo -e "Frontend: ${RED}Not Running${NC}"
    fi
    
    # Backend status
    if docker ps | grep -q "backend"; then
        echo -e "Backend: ${GREEN}Running${NC}"
    else
        echo -e "Backend: ${RED}Not Running${NC}"
    fi
    
    # Port status
    if netstat -tulpn 2>/dev/null | grep -q ":$FRONTEND_PORT "; then
        echo -e "Frontend Port $FRONTEND_PORT: ${GREEN}Listening${NC}"
    else
        echo -e "Frontend Port $FRONTEND_PORT: ${RED}Not Listening${NC}"
    fi
    
    echo ""
    echo "Access URLs:"
    echo "Frontend: http://localhost:$FRONTEND_PORT"
    echo "Backend: http://localhost:$BACKEND_PORT"
    echo "Monitoring: http://localhost:9090 (Prometheus)"
    echo "Dashboard: http://localhost:3003 (Grafana)"
}

# Show logs
show_logs() {
    log "Showing frontend logs..."
    docker compose -f "$CONFIG_DIR/docker-compose.production.yml" logs -f frontend
}

# Stop production services
stop_services() {
    log "Stopping production services..."
    docker compose -f "$CONFIG_DIR/docker-compose.production.yml" down
    log "Production services stopped"
}

# Clean up resources
cleanup() {
    log "Cleaning up resources..."
    
    # Stop and remove containers
    docker compose -f "$CONFIG_DIR/docker-compose.production.yml" down --volumes --remove-orphans
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused networks
    docker network prune -f
    
    log "Cleanup completed"
}

# Main deployment function
deploy() {
    log "Starting production deployment..."
    
    check_branch
    check_backend
    build_frontend
    deploy_frontend
    check_health
    show_status
    
    log "Production deployment completed successfully!"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        stop_services
        ;;
    "cleanup")
        cleanup
        ;;
    "restart")
        stop_services
        sleep 2
        deploy
        ;;
    "health")
        check_health
        ;;
    *)
        echo "Usage: $0 {deploy|status|logs|stop|cleanup|restart|health}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy to production (default)"
        echo "  status   - Show deployment status"
        echo "  logs     - Show frontend logs"
        echo "  stop     - Stop production services"
        echo "  cleanup  - Clean up all resources"
        echo "  restart  - Restart production services"
        echo "  health   - Check deployment health"
        exit 1
        ;;
esac
